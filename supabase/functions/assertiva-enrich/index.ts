// Supabase Edge Function: assertiva-enrich
// Story W3-08 — Pipeline de enriquecimento profundo via Assertiva Localize V3.
//
// Fluxo:
//   POST { cnpj, leadId, idFinalidade? }
//   1. Auth OAuth2 server-side (token cacheado no isolate)
//   2. GET /localize/v3/cnpj                      -> dados empresa + protocolo
//   3. GET /localize/v3/possiveis-decisores        -> lista de socios (protocolo obrigatorio)
//   4. Para cada socio com CPF:
//      a. GET /localize/v3/cpf                     -> dados pessoais + protocolo CPF
//      b. GET /localize-api/v1/base-cadastral/conexoes -> vinculos familiares + societarios
//      c. GET /localize/v3/pessoas-de-referencia   -> pessoas de referencia (mae, etc.)
//      d. GET /localize/v3/mais-telefones          -> telefones adicionais
//   5. Normaliza CPFs; cifragem via app.insert_socio / app.insert_vinculo_familiar (SECURITY DEFINER)
//   6. Persiste em app.socios / app.socio_vinculos / app.socio_telefones
//   7. Retorna grafo montado: empresa -> socios[] -> {dados, vinculosFamiliares,
//      empresasVinculadas, telefones}
//
// Erros de etapa por socio nao interrompem o pipeline; acumulam em `warnings`.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ASSERTIVA_BASE_URL = 'https://api.assertivasolucoes.com.br'

// Delay entre chamadas encadeadas para nao estourar rate-limit da Assertiva.
// Ajustar conforme contrato (padrao conservador: 300ms).
const INTER_REQUEST_DELAY_MS = 300

// ---------------------------------------------------------------------------
// Cache de token OAuth2 (escopo do isolate; persiste entre requests quentes)
// ---------------------------------------------------------------------------
interface TokenCache {
  token: string
  expiresAt: number
}
let tokenCache: TokenCache | null = null

// ---------------------------------------------------------------------------
// Interfaces de dominio
// ---------------------------------------------------------------------------

interface AssertivaPhone {
  numero: string
  tipo: 'celular' | 'fixo'
  operadora?: string
  whatsapp?: boolean
  hotphone?: boolean
  plus?: boolean
}

interface NormalizedPhone {
  e164: string
  whatsappPessoal: boolean
  whatsappConfirmado: boolean
  isHot: boolean
  origem: string
  ranking: number
  raw: unknown
}

interface SocioOutput {
  nome: string
  cpf?: string           // CPF em claro (disponível durante o processamento; não exposto no JSON final)
  cpfFormatado?: string  // CPF formatado 000.000.000-00 para inclusão no grafo de retorno
  cpfHash?: string
  participacao?: string
  cargo?: string
  indiceProbabilidadeNegociacao?: number
  vinculosFamiliares: VinculoFamiliar[]
  empresasVinculadas: VinculoSocietario[]
  telefones: NormalizedPhone[]
  _protocolo?: string
  _rawCpf?: unknown
}

interface VinculoFamiliar {
  nomeRelacionado?: string
  cpfFamiliarClaro?: string   // CPF do familiar em claro (para cifragem no insert)
  documentoHash?: string
  grauParentesco?: string
  raw: unknown
}

interface VinculoSocietario {
  cnpjVinculado?: string
  razaoSocialVinculada?: string
  documentoHash?: string
  raw: unknown
}

interface EnrichOutput {
  empresa: unknown
  socios: SocioOutput[]
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Helpers: CORS
// ---------------------------------------------------------------------------

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// ---------------------------------------------------------------------------
// Helper: delay
// ---------------------------------------------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// OAuth2: obtem ou renova token da Assertiva
// ---------------------------------------------------------------------------
async function getAssertivaToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const clientId = Deno.env.get('ASSERTIVA_CLIENT_ID')
  const clientSecret = Deno.env.get('ASSERTIVA_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('ASSERTIVA_CLIENT_ID ou ASSERTIVA_CLIENT_SECRET nao configurados no env')
  }

  const credentials = btoa(`${clientId}:${clientSecret}`)

  const res = await fetch(`${ASSERTIVA_BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Assertiva auth ${res.status}: ${text}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }

  // Margem de seguranca de 30s para evitar uso de token expirado
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  }

  return tokenCache.token
}

// ---------------------------------------------------------------------------
// Helper: chamada autenticada GET para Assertiva
// Retorna null (com warning) em vez de lancar excecao, permitindo pipeline parcial.
// ---------------------------------------------------------------------------
async function assertivaGet(
  token: string,
  path: string,
  warnings: string[],
): Promise<unknown | null> {
  try {
    const res = await fetch(`${ASSERTIVA_BASE_URL}${path}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      const text = await res.text()
      warnings.push(`Assertiva ${res.status} em ${path}: ${text.slice(0, 200)}`)
      return null
    }

    return await res.json()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    warnings.push(`Falha de rede em ${path}: ${msg}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Helper: normalizar numero de telefone para E.164 (padrao BR)
// Espelha formatPhone() de src/services/assertivaService.ts
// ---------------------------------------------------------------------------
function normalizeToE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`
  if (digits.length === 11 || digits.length === 10) return `+55${digits}`
  return `+${digits}`
}

// ---------------------------------------------------------------------------
// Helper: mapear array de telefones Assertiva para NormalizedPhone[]
// Espelha extractBestPhone() de src/services/assertivaService.ts
// ---------------------------------------------------------------------------
function mapTelefones(
  rawArr: unknown[],
  origem: string,
  rankOffset: number,
): NormalizedPhone[] {
  return rawArr
    .map((t, idx) => {
      const phone = t as Record<string, unknown>
      const numero = String(phone['numero'] ?? '').replace(/\D/g, '')
      if (!numero) return null

      const whatsappPessoal = Boolean(
        (phone['aplicativos'] as Record<string, unknown> | undefined)?.['whatsApp'],
      )
      const isHot = Boolean(phone['hotphone'])
      const isPlus = Boolean(phone['plus'])

      // WhatsApp confirmado: hotphone ou plus ativados junto com flag whatsapp
      const whatsappConfirmado = whatsappPessoal && (isHot || isPlus)

      return {
        e164: normalizeToE164(numero),
        whatsappPessoal,
        whatsappConfirmado,
        isHot,
        origem,
        ranking: rankOffset + idx + 1,
        raw: t,
      } satisfies NormalizedPhone
    })
    .filter((p): p is NormalizedPhone => p !== null)
}

// ---------------------------------------------------------------------------
// Helper: gerar hash SHA-256 do documento para lookup/dedupe
// Usa salt do env para evitar rainbow table.
// TODO: substituir por pgsodium.crypto_secretbox quando disponivel via REST do Supabase.
// ---------------------------------------------------------------------------
async function hashDocumento(doc: string): Promise<string> {
  const salt = Deno.env.get('ASSERTIVA_CPF_HASH_SALT') ?? 'outbili-default-salt'
  const encoder = new TextEncoder()
  const data = encoder.encode(`${salt}:${doc.replace(/\D/g, '')}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Helper: formatar CPF como 000.000.000-00
// Usado para incluir o CPF formatado no grafo de retorno sem precisar decifrar.
// ---------------------------------------------------------------------------
function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

// ---------------------------------------------------------------------------
// Pipeline principal: enriquece um CNPJ completo
// ---------------------------------------------------------------------------
async function enrichCnpj(
  cnpj: string,
  leadId: string,
  idFinalidade: string,
  token: string,
  warnings: string[],
): Promise<EnrichOutput> {
  const cleanCnpj = cnpj.replace(/\D/g, '')

  // Etapa 1: consulta CNPJ
  const rawCnpj = await assertivaGet(
    token,
    `/localize/v3/cnpj?cnpj=${cleanCnpj}&idFinalidade=${idFinalidade}`,
    warnings,
  )

  const empresa = rawCnpj

  // Extrair protocolo retornado pela consulta CNPJ (necessario para possiveis-decisores)
  const protocoloCnpj: string | undefined =
    (rawCnpj as Record<string, unknown> | null)?.['cabecalho']?.['protocolo'] as string | undefined

  if (!protocoloCnpj) {
    warnings.push('Protocolo CNPJ ausente na resposta Assertiva: possiveis-decisores serao pulados')
  }

  // Etapa 2: os sócios vêm DIRETO da consulta CNPJ em `.resposta.socios[]`.
  // Cada item: { documento (CPF/CNPJ COMPLETO, sem máscara), nomeOuRazaoSocial, dataEntrada }.
  // O endpoint /possiveis-decisores foi descontinuado: a consulta CNPJ já devolve
  // o quadro societário com o documento em claro (validado contra a API real em 2026-05-23).
  void protocoloCnpj // protocolo permanece disponível para sub-consultas (cpf/conexoes)
  const respostaCnpj =
    (rawCnpj as Record<string, unknown> | null)?.['resposta'] as Record<string, unknown> | undefined
  const sociosRaw = (respostaCnpj?.['socios'] ?? []) as unknown[]

  if (sociosRaw.length === 0) {
    warnings.push('Nenhum socio em .resposta.socios na consulta CNPJ')
  }

  // Etapa 3: enriquecer cada socio individualmente
  const socios: SocioOutput[] = []

  for (const socioRaw of sociosRaw) {
    const s = socioRaw as Record<string, unknown>
    const docDigits = String(s['documento'] ?? '').replace(/\D/g, '')
    const nome = String(s['nomeOuRazaoSocial'] ?? s['nome'] ?? '')
    // PF = CPF (11 dígitos) -> cascata pessoal. PJ (14 dígitos) = sócio holding (sem cascata).
    const cpf: string | undefined = docDigits.length === 11 ? docDigits : undefined

    const socioOutput: SocioOutput = {
      nome,
      cpf,
      participacao: (s['participacao'] ?? s['qualificacao']) as string | undefined,
      cargo: s['cargo'] as string | undefined,
      vinculosFamiliares: [],
      empresasVinculadas: [],
      telefones: [],
    }

    if (!cpf) {
      warnings.push(`Socio "${nome}" sem CPF de pessoa fisica (documento PJ ou ausente): cascata pulada`)
      socios.push(socioOutput)
      continue
    }

    const cleanCpf = cpf

    // Hash do CPF para dedupe e lookup
    socioOutput.cpfHash = await hashDocumento(cleanCpf)

    // CPF formatado para retorno no grafo (sem necessidade de decifrar)
    socioOutput.cpfFormatado = formatCpf(cleanCpf)

    // Etapa 3a: consulta CPF
    await delay(INTER_REQUEST_DELAY_MS)
    const rawCpf = await assertivaGet(
      token,
      `/localize/v3/cpf?cpf=${cleanCpf}&idFinalidade=${idFinalidade}`,
      warnings,
    )

    socioOutput._rawCpf = rawCpf

    const cpfResp = rawCpf as Record<string, unknown> | null
    const protocoloCpf: string | undefined =
      cpfResp?.['cabecalho']?.['protocolo'] as string | undefined

    socioOutput._protocolo = protocoloCpf

    // Telefones da consulta CPF
    const telefonesCpfResp = cpfResp?.['resposta']?.['telefones'] as Record<string, unknown> | undefined
    const moveisRaw = (telefonesCpfResp?.['moveis'] ?? telefonesCpfResp?.['celulares'] ?? []) as unknown[]
    const fixosRaw = (telefonesCpfResp?.['fixos'] ?? []) as unknown[]

    socioOutput.telefones.push(...mapTelefones(moveisRaw, 'cpf_localize', 0))
    socioOutput.telefones.push(...mapTelefones(fixosRaw, 'cpf_localize', moveisRaw.length))

    // Etapa 3b: conexoes (familiares + societarias cruzadas + telefones adicionais)
    await delay(INTER_REQUEST_DELAY_MS)
    const rawConexoes = await assertivaGet(
      token,
      `/localize-api/v1/base-cadastral/conexoes?documento=${cleanCpf}&tipo=CPF&idFinalidade=${idFinalidade}&conjuge=true&telefones=true`,
      warnings,
    )

    if (rawConexoes) {
      const conexoesResp = rawConexoes as Record<string, unknown>

      // Vinculos familiares
      const familiares = (conexoesResp['vinculosFamiliares'] ?? conexoesResp['familiares'] ?? []) as unknown[]
      for (const fam of familiares) {
        const f = fam as Record<string, unknown>
        const docFam = String(f['cpf'] ?? f['documento'] ?? '').replace(/\D/g, '')
        socioOutput.vinculosFamiliares.push({
          nomeRelacionado: f['nome'] as string | undefined,
          // CPF do familiar em claro: cifrado pela função SQL no momento do insert
          cpfFamiliarClaro: docFam || undefined,
          documentoHash: docFam ? await hashDocumento(docFam) : undefined,
          grauParentesco: f['grauParentesco'] as string | undefined ?? f['vinculo'] as string | undefined,
          raw: fam,
        })
      }

      // Vinculos societarios cruzados
      const empresas = (conexoesResp['empresasVinculadas'] ?? conexoesResp['participacoes'] ?? []) as unknown[]
      for (const emp of empresas) {
        const e = emp as Record<string, unknown>
        const cnpjVinc = String(e['cnpj'] ?? '').replace(/\D/g, '')
        socioOutput.empresasVinculadas.push({
          cnpjVinculado: cnpjVinc || undefined,
          razaoSocialVinculada: e['razaoSocial'] as string | undefined,
          documentoHash: cnpjVinc ? await hashDocumento(cnpjVinc) : undefined,
          raw: emp,
        })
      }

      // Telefones extras da resposta conexoes
      const telConexoes = (conexoesResp['telefones'] ?? []) as unknown[]
      if (telConexoes.length > 0) {
        socioOutput.telefones.push(
          ...mapTelefones(telConexoes, 'conexoes', socioOutput.telefones.length),
        )
      }
    }

    // Etapa 3c: pessoas de referencia (mae, etc.)
    if (protocoloCpf) {
      await delay(INTER_REQUEST_DELAY_MS)
      const rawRef = await assertivaGet(
        token,
        `/localize/v3/pessoas-de-referencia?cpf=${cleanCpf}&retornarMae=true&protocolo=${protocoloCpf}`,
        warnings,
      )

      if (rawRef) {
        const refResp = rawRef as Record<string, unknown>
        const refs = (refResp['resposta']?.['referencias'] ?? refResp['referencias'] ?? []) as unknown[]
        for (const ref of refs) {
          const r = ref as Record<string, unknown>
          const docRef = String(r['cpf'] ?? r['documento'] ?? '').replace(/\D/g, '')
          // Pessoas de referencia sao tratadas como vinculos familiares
          socioOutput.vinculosFamiliares.push({
            nomeRelacionado: r['nome'] as string | undefined,
            cpfFamiliarClaro: docRef || undefined,
            documentoHash: docRef ? await hashDocumento(docRef) : undefined,
            grauParentesco: r['vinculo'] as string | undefined ?? 'referencia',
            raw: ref,
          })
        }
      }
    }

    // Etapa 3d: mais telefones
    if (protocoloCpf) {
      await delay(INTER_REQUEST_DELAY_MS)
      const rawMaisTel = await assertivaGet(
        token,
        `/localize/v3/mais-telefones?tipo=CPF&documento=${cleanCpf}&protocolo=${protocoloCpf}`,
        warnings,
      )

      if (rawMaisTel) {
        const maisTelResp = rawMaisTel as Record<string, unknown>
        const extras = (
          maisTelResp['resposta']?.['telefones'] ??
          maisTelResp['telefones'] ??
          []
        ) as unknown[]
        if (extras.length > 0) {
          socioOutput.telefones.push(
            ...mapTelefones(extras, 'mais_telefones', socioOutput.telefones.length),
          )
        }
      }
    }

    // Deduplicar telefones pelo numero E.164 (manter o primeiro por ranking)
    const seenE164 = new Set<string>()
    socioOutput.telefones = socioOutput.telefones.filter((t) => {
      if (seenE164.has(t.e164)) return false
      seenE164.add(t.e164)
      return true
    })

    // Calcular indice de probabilidade de negociacao (heuristica)
    socioOutput.indiceProbabilidadeNegociacao = calcularIndiceProbabilidade(socioOutput)

    socios.push(socioOutput)
  }

  return { empresa, socios, warnings }
}

// ---------------------------------------------------------------------------
// Calculo do indice de probabilidade de negociacao
// Score 0.0-1.0 baseado em sinais de qualidade de contato.
// ---------------------------------------------------------------------------
function calcularIndiceProbabilidade(socio: SocioOutput): number {
  let score = 0

  const temWhatsappConfirmado = socio.telefones.some((t) => t.whatsappConfirmado)
  const temHotPhone = socio.telefones.some((t) => t.isHot)
  const temWhatsappPessoal = socio.telefones.some((t) => t.whatsappPessoal)
  const temTelefone = socio.telefones.length > 0

  // Pesos calibrados para prospecao B2B outbound
  if (temWhatsappConfirmado) score += 0.35
  else if (temWhatsappPessoal) score += 0.20
  if (temHotPhone) score += 0.25
  if (temTelefone && !temWhatsappPessoal) score += 0.10
  if (socio.empresasVinculadas.length > 0) score += 0.10
  if (socio.cargo) score += 0.10
  if (socio.vinculosFamiliares.length > 0) score += 0.05
  if (socio.participacao) score += 0.05

  return Math.min(Math.round(score * 10000) / 10000, 1.0)
}

// ---------------------------------------------------------------------------
// Persistencia no Supabase
//
// Estratégia de cifragem:
//   - CPF do sócio principal: via app.insert_socio() SECURITY DEFINER.
//     Recebe o CPF em claro e cifra internamente no Postgres com pgp_sym_encrypt +
//     chave do Vault. Evita o round-trip bytea via PostgREST (base64 → reinserção
//     problemática com supabase-js).
//   - CPF de familiares: via app.insert_vinculo_familiar() SECURITY DEFINER,
//     mesmo padrão.
//   - CNPJ vinculado (societário_cruzado): não é PII — gravado em texto normal.
// ---------------------------------------------------------------------------
async function persistir(
  supabase: ReturnType<typeof createClient>,
  leadId: string,
  cnpjOrigem: string,
  socios: SocioOutput[],
  warnings: string[],
): Promise<void> {
  for (const socio of socios) {
    // Insere o sócio via função SECURITY DEFINER que cifra o CPF internamente.
    // O CPF em claro nunca transita como bytea no protocolo HTTP.
    const { data: insertData, error: socioErr } = await supabase.schema('app').rpc('insert_socio', {
      p_lead_id:             leadId,
      p_cnpj_origem:         cnpjOrigem.replace(/\D/g, ''),
      p_nome:                socio.nome,
      p_cpf_claro:           socio.cpf ?? null,
      p_cpf_hash:            socio.cpfHash ?? null,
      p_participacao:        socio.participacao ?? null,
      p_cargo:               socio.cargo ?? null,
      p_indice_prob:         socio.indiceProbabilidadeNegociacao ?? null,
      p_protocolo_assertiva: socio._protocolo ?? null,
      p_raw:                 socio._rawCpf ?? null,
    }, { head: false, count: null })

    if (socioErr) {
      warnings.push(`Erro ao inserir socio "${socio.nome}": ${socioErr.message}`)
      continue
    }

    const socioId = insertData as string

    // Vinculos familiares: CPF do familiar cifrado via função SECURITY DEFINER
    for (const vf of socio.vinculosFamiliares) {
      const { error } = await supabase.schema('app').rpc('insert_vinculo_familiar', {
        p_socio_id:           socioId,
        p_nome_relacionado:   vf.nomeRelacionado ?? null,
        p_cpf_familiar_claro: vf.cpfFamiliarClaro ?? null,
        p_documento_hash:     vf.documentoHash ?? null,
        p_grau_parentesco:    vf.grauParentesco ?? null,
        p_raw:                vf.raw,
      }, { head: false, count: null })
      if (error) {
        warnings.push(`Erro ao inserir vinculo familiar de "${socio.nome}": ${error.message}`)
      }
    }

    // Vinculos societarios cruzados: CNPJ não é PII — insert direto via PostgREST
    for (const vs of socio.empresasVinculadas) {
      const { error } = await supabase
        .schema('app')
        .from('socio_vinculos')
        .insert({
          socio_id:                      socioId,
          tipo:                          'societario_cruzado',
          nome_relacionado:              vs.razaoSocialVinculada ?? null,
          documento_relacionado_cifrado: null,   // CNPJ não é PII — não cifrado
          documento_hash:                vs.documentoHash ?? null,
          grau_parentesco:               null,
          cnpj_vinculado:                vs.cnpjVinculado ?? null,
          razao_social_vinculada:        vs.razaoSocialVinculada ?? null,
          raw:                           vs.raw,
        })
      if (error) {
        warnings.push(`Erro ao inserir vinculo societario de "${socio.nome}": ${error.message}`)
      }
    }

    // Telefones do socio
    const telefonesRows = socio.telefones.map((t) => ({
      socio_id:            socioId,
      telefone_e164:       t.e164,
      whatsapp_pessoal:    t.whatsappPessoal,
      whatsapp_confirmado: t.whatsappConfirmado,
      is_hot:              t.isHot,
      origem:              t.origem,
      ranking:             t.ranking,
      raw:                 t.raw,
    }))

    if (telefonesRows.length > 0) {
      const { error } = await supabase
        .schema('app')
        .from('socio_telefones')
        .insert(telefonesRows)
      if (error) {
        warnings.push(`Erro ao inserir telefones de "${socio.nome}": ${error.message}`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Metodo nao permitido' }),
      { status: 405, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
    )
  }

  try {
    const body = await req.json() as {
      cnpj?: string
      leadId?: string
      idFinalidade?: string
    }

    const { cnpj, leadId } = body

    if (!cnpj || !leadId) {
      return new Response(
        JSON.stringify({ error: 'cnpj e leadId sao obrigatorios' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
      )
    }

    // idFinalidade: body > env > default '5'
    const idFinalidade =
      body.idFinalidade ??
      Deno.env.get('ASSERTIVA_ID_FINALIDADE') ??
      '5'

    // Cliente Supabase com service_role (escrita nas tabelas app.*)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Obter token Assertiva
    const token = await getAssertivaToken()

    // Executar pipeline
    const warnings: string[] = []
    const result = await enrichCnpj(cnpj, leadId, idFinalidade, token, warnings)

    // Persistir no banco
    await persistir(supabase, leadId, cnpj, result.socios, warnings)

    // Montar resposta: grafo empresa -> socios
    const responseBody = {
      empresa: result.empresa,
      socios: result.socios.map((s) => ({
        nome: s.nome,
        cpfFormatado: s.cpfFormatado,   // CPF formatado 000.000.000-00 (já disponível em claro)
        cpfHash: s.cpfHash,
        participacao: s.participacao,
        cargo: s.cargo,
        indiceProbabilidadeNegociacao: s.indiceProbabilidadeNegociacao,
        vinculosFamiliares: s.vinculosFamiliares.map((vf) => ({
          nomeRelacionado: vf.nomeRelacionado,
          grauParentesco: vf.grauParentesco,
        })),
        empresasVinculadas: s.empresasVinculadas.map((vs) => ({
          cnpjVinculado: vs.cnpjVinculado,
          razaoSocialVinculada: vs.razaoSocialVinculada,
        })),
        telefones: s.telefones.map((t) => ({
          e164: t.e164,
          whatsappPessoal: t.whatsappPessoal,
          whatsappConfirmado: t.whatsappConfirmado,
          isHot: t.isHot,
          origem: t.origem,
          ranking: t.ranking,
        })),
      })),
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    return new Response(
      JSON.stringify(responseBody),
      {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[assertiva-enrich] erro nao tratado:', message)

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      },
    )
  }
})
