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

// Tipo permissivo do client (o schema é selecionado por .schema('app') em cada query).
// `any` evita o ruído de genéricos do supabase-js (esm.sh latest) entre createClient()
// e os helpers — os tipos são apagados em runtime; o deploy faz o próprio bundle.
// deno-lint-ignore no-explicit-any
type SbClient = any

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

interface EmpresaTelefone {
  e164: string
  tipo: 'MOBILE' | 'LANDLINE'
  whatsapp: boolean
  isHot: boolean
  operadora?: string
  relacao?: string
  raw: unknown
}

interface EnrichOutput {
  empresa: unknown
  socios: SocioOutput[]
  empresaTelefones: EmpresaTelefone[]
  digitalPresence: DigitalPresence
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
// Helper: telefones da EMPRESA (consulta CNPJ) -> EmpresaTelefone[]
// ---------------------------------------------------------------------------
function mapEmpresaTelefones(rawArr: unknown[], tipo: 'MOBILE' | 'LANDLINE'): EmpresaTelefone[] {
  return rawArr
    .map((t) => {
      const phone = t as Record<string, unknown>
      const numero = String(phone['numero'] ?? '').replace(/\D/g, '')
      if (!numero) return null
      const apps = phone['aplicativos'] as Record<string, unknown> | undefined
      const whatsapp = Boolean(apps?.['whatsApp'] ?? apps?.['whatsAppBusiness'])
      return {
        e164: normalizeToE164(numero),
        tipo,
        whatsapp,
        isHot: Boolean(phone['hotphone']),
        operadora: (phone['operadora'] as string) || undefined,
        relacao: (phone['relacao'] as string) || undefined,
        raw: t,
      } satisfies EmpresaTelefone
    })
    .filter((p): p is EmpresaTelefone => p !== null)
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
// Helper: map com pool de concorrencia limitada.
// Processa `items` aplicando `fn`, com no maximo `limit` execucoes simultaneas.
// Preserva a ordem original do array de saida.
// W3-08: paraleliza os socios (independentes entre si) para caber no wall-clock
// de ~150s do gateway Edge. A sequencia INTERNA de cada socio (cpf -> conexoes ->
// referencias -> mais-telefones) permanece serial por causa do protocolo CPF.
// ---------------------------------------------------------------------------
const SOCIO_CONCURRENCY = 3

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ---------------------------------------------------------------------------
// Enriquecimento de UM socio (cascata serial interna: cpf -> conexoes ->
// referencias -> mais-telefones). Extraido do loop para permitir paralelizacao
// por socio. Erros de etapa acumulam em `warnings` (push em array JS e seguro
// no event loop single-thread do Deno).
// ---------------------------------------------------------------------------
async function enrichSocio(
  socioRaw: unknown,
  idFinalidade: string,
  token: string,
  warnings: string[],
): Promise<SocioOutput> {
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
    return socioOutput
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

  return socioOutput
}

// ---------------------------------------------------------------------------
// PRESENÇA DIGITAL (nativa Assertiva): site + redes sociais + Google Meu Negócio.
// A consulta CNPJ já devolve `resposta.redesSociais[]` ({nome,url,temGoogleMeuNegocio})
// e `resposta.dadosCadastrais` (site, temGoogleMeuNegocio). Extraído sem custo extra.
// ---------------------------------------------------------------------------
interface DigitalPresence {
  website: string | null
  redes: { platform: string; url: string }[]
  temGoogleMeuNegocio: boolean
}

function extractDigitalPresence(rawCnpj: unknown): DigitalPresence {
  const resp = (rawCnpj as Record<string, unknown> | null)?.['resposta'] as Record<string, unknown> | undefined
  const cad = (resp?.['dadosCadastrais'] ?? {}) as Record<string, unknown>
  const redesArr = (Array.isArray(resp?.['redesSociais']) ? resp?.['redesSociais'] : []) as Record<string, unknown>[]

  let website: string | null = (cad['site'] as string) || null
  let temGmb = Boolean(cad['temGoogleMeuNegocio'])
  const redes: { platform: string; url: string }[] = []
  const seen = new Set<string>()

  for (const item of redesArr) {
    const nome = String(item['nome'] ?? item['tipo'] ?? item['rede'] ?? '').toLowerCase()
    const url = String(item['url'] ?? item['link'] ?? item['perfil'] ?? '')
    if (item['temGoogleMeuNegocio']) temGmb = true
    if (!url) continue

    let platform: string | null = null
    if (nome.includes('instagram')) platform = 'instagram'
    else if (nome.includes('facebook')) platform = 'facebook'
    else if (nome.includes('linkedin')) platform = 'linkedin'
    else if (nome.includes('tiktok') || nome.includes('tik_tok') || nome.includes('tik-tok')) platform = 'tiktok'
    else if (nome.includes('youtube')) platform = 'youtube'
    else if (nome.includes('twitter') || nome.includes('x.com')) platform = 'twitter'
    else if (nome.includes('site') || nome.includes('website') || nome.includes('homepage') || nome.includes('url')) {
      if (!website) website = url
      continue
    } else if (nome.includes('google') || nome.includes('maps')) {
      temGmb = true
      continue
    } else {
      continue
    }

    if (platform && !seen.has(platform)) {
      seen.add(platform)
      redes.push({ platform, url })
    }
  }

  return { website, redes, temGoogleMeuNegocio: temGmb }
}

// Persiste a presença digital. website: só preenche se vazio (não sobrescreve a bio
// linktr.ee gravada pelo social-enrich). redes: insere apenas plataformas que o lead
// ainda NÃO possui (preserva o Apify validado anti-filial). Idempotente.
async function persistirPresencaDigital(
  supabase: SbClient,
  leadId: string,
  presence: DigitalPresence,
  warnings: string[],
): Promise<void> {
  if (presence.website) {
    const { data: leadRow, error: selErr } = await supabase
      .schema('app').from('leads').select('website').eq('id', leadId).maybeSingle()
    if (!selErr && leadRow && !(leadRow as { website?: string }).website) {
      const { error } = await supabase
        .schema('app').from('leads').update({ website: presence.website }).eq('id', leadId)
      if (error) warnings.push(`Erro ao gravar website: ${error.message}`)
    }
  }

  if (presence.redes.length > 0) {
    const { data: existing } = await supabase
      .schema('app').from('lead_social').select('platform').eq('lead_id', leadId)
    const have = new Set(((existing ?? []) as { platform: string }[]).map((r) => r.platform))
    const novas = presence.redes.filter((r) => !have.has(r.platform))
    if (novas.length > 0) {
      const rows = novas.map((r) => ({
        lead_id: leadId,
        platform: r.platform,
        url: r.url,
        source: 'assertiva',
        extracted_at: new Date().toISOString(),
      }))
      const { error } = await supabase.schema('app').from('lead_social').insert(rows)
      if (error) warnings.push(`Erro ao gravar redes (assertiva): ${error.message}`)
    }
  }
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

  // Etapa 2b: telefones da EMPRESA (consulta CNPJ .resposta.telefones).
  // Varredura completa: TODOS os moveis/fixos com flags de WhatsApp. Sao o canal
  // de contato corporativo (relacao=Direto) e, em PMEs, frequentemente o WhatsApp
  // do socio-administrador. Persistidos em app.lead_phones e expostos no grafo.
  const telEmpresaRaw = (respostaCnpj?.['telefones'] ?? {}) as Record<string, unknown>
  const empresaTelefones: EmpresaTelefone[] = [
    ...mapEmpresaTelefones(
      (telEmpresaRaw['moveis'] ?? telEmpresaRaw['celulares'] ?? []) as unknown[],
      'MOBILE',
    ),
    ...mapEmpresaTelefones((telEmpresaRaw['fixos'] ?? []) as unknown[], 'LANDLINE'),
  ]

  // Etapa 3: enriquecer cada socio individualmente (paralelizado).
  // W3-08: socios sao independentes -> pool de ate SOCIO_CONCURRENCY simultaneos
  // (a cascata interna de cada socio permanece serial via enrichSocio). Corta o
  // tempo total de N×~6s para ⌈N/SOCIO_CONCURRENCY⌉×~6s, cabendo no wall-clock ~150s.
  const socios = await mapWithConcurrency(
    sociosRaw,
    SOCIO_CONCURRENCY,
    (socioRaw) => enrichSocio(socioRaw, idFinalidade, token, warnings),
  )

  return { empresa, socios, empresaTelefones, digitalPresence: extractDigitalPresence(rawCnpj), warnings }
}

// ---------------------------------------------------------------------------
// Persistencia dos telefones da EMPRESA em app.lead_phones (upsert por e164).
// Varredura completa: garante que TODOS os moveis/fixos da consulta CNPJ fiquem
// disponiveis (o enriquecimento raso so salvava 1). owner='empresa'.
// ---------------------------------------------------------------------------
async function persistirTelefonesEmpresa(
  supabase: SbClient,
  leadId: string,
  telefones: EmpresaTelefone[],
  warnings: string[],
): Promise<void> {
  if (telefones.length === 0) return
  const rows = telefones.map((t) => ({
    lead_id: leadId,
    e164: t.e164,
    type: t.tipo,
    source: 'cnpj_empresa',
    owner: 'empresa',
    is_whatsapp: t.whatsapp,
    is_hotphone: t.isHot,
    raw: typeof t.raw === 'string' ? t.raw : JSON.stringify(t.raw),
  }))
  const { error } = await supabase
    .schema('app')
    .from('lead_phones')
    .upsert(rows, { onConflict: 'lead_id,e164', ignoreDuplicates: false })
  if (error) warnings.push(`Erro ao persistir telefones da empresa: ${error.message}`)
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
  supabase: SbClient,
  leadId: string,
  cnpjOrigem: string,
  socios: SocioOutput[],
  warnings: string[],
): Promise<void> {
  // Idempotencia: remove socios anteriores deste lead antes de reinserir.
  // FK ON DELETE CASCADE limpa socio_telefones e socio_vinculos juntos.
  // Evita duplicacao quando o enriquecimento e reexecutado para o mesmo lead.
  const { error: delErr } = await supabase
    .schema('app')
    .from('socios')
    .delete()
    .eq('lead_id', leadId)
  if (delErr) warnings.push(`Erro ao limpar socios anteriores do lead: ${delErr.message}`)

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
// ---------------------------------------------------------------------------
// W3-08: fecha o job da fila e registra o run de enriquecimento.
// Encapsula a logica de retry no banco (RPC app.finish_enrichment_job):
//   - INSERT app.enrichment_runs (source=assertiva_decisores, status done|error)
//     -> impede o sweeper de re-enfileirar o lead por 7 dias
//   - se p_job_id != null: UPDATE app.enrichment_jobs
//       ok        -> done
//       erro      -> retrying (attempts < 3) | failed (>= 3)
// Best-effort: nunca derruba a resposta principal.
// ---------------------------------------------------------------------------
async function finishJob(
  supabase: SbClient,
  leadId: string,
  jobId: string | undefined,
  ok: boolean,
  error: string | null,
  result: Record<string, unknown> | null,
): Promise<void> {
  try {
    const { error: rpcErr } = await supabase.schema('app').rpc('finish_enrichment_job', {
      p_lead_id: leadId,
      p_job_id: jobId ?? null,
      p_ok: ok,
      p_error: error,
      p_result: result,
    })
    if (rpcErr) {
      console.error('[assertiva-enrich] finish_enrichment_job falhou:', rpcErr.message)
    }
  } catch (e) {
    console.error('[assertiva-enrich] finish_enrichment_job exception:', e instanceof Error ? e.message : String(e))
  }
}

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

  // Cliente Supabase com service_role (criado fora do try p/ estar disponivel no catch)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : null

  // leadId/jobId em escopo externo p/ o catch poder fechar o job em caso de erro
  let leadId: string | undefined
  let jobId: string | undefined

  try {
    const body = await req.json() as {
      cnpj?: string
      leadId?: string
      jobId?: string
      idFinalidade?: string
      mode?: 'full' | 'presence'
    }

    const cnpj = body.cnpj
    leadId = body.leadId
    jobId = body.jobId   // W3-08: presente quando disparado pelo worker da fila
    const mode = body.mode ?? 'full'   // 'presence' = só presença digital (consulta CNPJ leve)

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

    if (!supabase) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados')
    }

    // Obter token Assertiva
    const token = await getAssertivaToken()
    const warnings: string[] = []

    // MODO PRESENCE: só presença digital (1 consulta CNPJ), sem a cascata de sócios.
    // Usado para popular a presença digital em massa de forma barata (leads já com sócios).
    if (mode === 'presence') {
      const cleanCnpj = cnpj.replace(/\D/g, '')
      const rawCnpj = await assertivaGet(
        token,
        `/localize/v3/cnpj?cnpj=${cleanCnpj}&idFinalidade=${idFinalidade}`,
        warnings,
      )
      const presence = extractDigitalPresence(rawCnpj)
      await persistirPresencaDigital(supabase, leadId, presence, warnings)
      await finishJob(supabase, leadId, jobId, true, null, {
        mode: 'presence',
        website: Boolean(presence.website),
        redes: presence.redes.length,
        googleMeuNegocio: presence.temGoogleMeuNegocio,
        warnings: warnings.length,
      })
      return new Response(
        JSON.stringify({ digitalPresence: presence, warnings: warnings.length > 0 ? warnings : undefined }),
        { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } },
      )
    }

    // MODO FULL (default): cascata completa de sócios + presença digital
    const result = await enrichCnpj(cnpj, leadId, idFinalidade, token, warnings)

    // Persistir no banco
    await persistir(supabase, leadId, cnpj, result.socios, warnings)
    await persistirTelefonesEmpresa(supabase, leadId, result.empresaTelefones, warnings)
    // Camada de presença digital (site + redes + Google Meu Negócio), nativa da Assertiva
    await persistirPresencaDigital(supabase, leadId, result.digitalPresence, warnings)

    // W3-08: fecha o job (done) + registra enrichment_runs (impede re-enfileiramento)
    await finishJob(supabase, leadId, jobId, true, null, {
      numSocios: result.socios.length,
      numTelefonesEmpresa: result.empresaTelefones.length,
      website: Boolean(result.digitalPresence.website),
      redes: result.digitalPresence.redes.length,
      googleMeuNegocio: result.digitalPresence.temGoogleMeuNegocio,
      warnings: warnings.length,
    })

    // Montar resposta: grafo empresa -> socios
    const responseBody = {
      empresa: result.empresa,
      empresaTelefones: result.empresaTelefones.map((t) => ({
        e164: t.e164,
        tipo: t.tipo,
        whatsapp: t.whatsapp,
        isHot: t.isHot,
        operadora: t.operadora,
      })),
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

    // W3-08: fecha o job (retrying|failed) + registra run de erro (best-effort)
    if (supabase && leadId) {
      await finishJob(supabase, leadId, jobId, false, message, null)
    }

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      },
    )
  }
})
