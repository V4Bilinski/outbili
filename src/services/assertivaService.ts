import type { AssertivaCompanyResult, AssertivaDecisionMaker, AssertivaPhone, AssertivaSocialLinks } from '../types'
import { supabase } from '../lib/supabase'

// Roteamento do enriquecimento RASO Assertiva via Edge Function `assertiva-proxy`
// (Supabase). A função faz OAuth2 server-side, elimina CORS e retorna o JSON RAW
// da Assertiva. Substitui o antigo Cloudflare Worker + n8n (Story W3-09, Fase A).

async function assertivaViaProxyInner<T>(action: string, params: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('assertiva-proxy', {
    body: { action, ...params },
  })

  if (error) {
    // Propaga para o wrapper registrar recordAssertivaOutcome(false).
    throw new Error(`Assertiva proxy (${action}): ${error.message || 'erro desconhecido'}`)
  }

  return data as T
}

// --- Status observado: alimenta o health-check sem gastar consulta paga ---

const ASSERTIVA_STATUS_KEY = 'outbili_assertiva_status'

export interface AssertivaLastKnown {
  state: 'ok' | 'down' | 'unknown'
  at: number | null
}

function recordAssertivaOutcome(ok: boolean): void {
  try {
    localStorage.setItem(ASSERTIVA_STATUS_KEY, JSON.stringify({ ok, at: Date.now() }))
  } catch { /* storage indisponivel */ }
}

export function getAssertivaLastKnown(): AssertivaLastKnown {
  try {
    const raw = localStorage.getItem(ASSERTIVA_STATUS_KEY)
    if (!raw) return { state: 'unknown', at: null }
    const parsed = JSON.parse(raw) as { ok?: boolean; at?: number }
    return { state: parsed.ok ? 'ok' : 'down', at: parsed.at ?? null }
  } catch {
    return { state: 'unknown', at: null }
  }
}

// Wrapper que registra o resultado de cada chamada real a Assertiva. O status
// vem do uso real (enriquecimento), nunca de um probe que consumiria credito.
async function assertivaViaProxy<T>(action: string, params: Record<string, string>): Promise<T> {
  try {
    const result = await assertivaViaProxyInner<T>(action, params)
    recordAssertivaOutcome(true)
    return result
  } catch (err) {
    recordAssertivaOutcome(false)
    throw err
  }
}

// --- Consulta CNPJ (telefones, emails, socios) ---

export async function lookupCnpj(cnpj: string): Promise<AssertivaCompanyResult> {
  const cleanCnpj = cnpj.replace(/\D/g, '')

  const raw = await assertivaViaProxy<any>('lookup-cnpj', { cnpj: cleanCnpj })

  // Mapear resposta — Worker Cloudflare retorna resposta RAW completa da Assertiva
  const resp = raw.resposta || raw
  const cadastro = resp.dadosCadastrais || {}
  const celulares = (resp.telefones?.celulares || []).map((t: any) => ({
    numero: t.numero?.replace(/\D/g, '') || '',
    tipo: 'celular' as const,
    operadora: t.operadora,
    whatsapp: t.aplicativos?.whatsApp || false,
    hotphone: t.hotphone || false,
    plus: t.plus || false,
  }))
  const fixos = (resp.telefones?.fixos || []).map((t: any) => ({
    numero: t.numero?.replace(/\D/g, '') || '',
    tipo: 'fixo' as const,
    operadora: t.operadora,
    whatsapp: t.aplicativos?.whatsAppBusiness || false,
    hotphone: false,
    plus: false,
  }))
  const emails = (resp.emails || []).map((e: any) => ({
    endereco: e.email || e.endereco || '',
  }))
  const socios = (resp.quadroSocietario || []).map((s: any) => ({
    nome: s.nome || '',
    cpf: s.cpf,
    qualificacao: s.qualificacao || s.cargo || '',
  }))

  // Redes sociais — resp.redesSociais e um ARRAY de objetos (confirmado via Worker)
  // Formato: [{ tipo: "instagram", url: "..." }, { tipo: "facebook", url: "..." }]
  // Pode estar vazio dependendo do tier Assertiva contratado
  const rawSociaisArr = Array.isArray(resp.redesSociais) ? resp.redesSociais : []
  const redesSociais: AssertivaSocialLinks = {}
  for (const rede of rawSociaisArr) {
    const tipo = (rede.tipo || rede.rede || rede.nome || '').toLowerCase()
    const url = rede.url || rede.link || rede.perfil || ''
    if (!url) continue
    if (tipo.includes('instagram')) redesSociais.instagram = url
    else if (tipo.includes('facebook')) redesSociais.facebook = url
    else if (tipo.includes('linkedin')) redesSociais.linkedin = url
    else if (tipo.includes('tiktok') || tipo.includes('tik_tok') || tipo.includes('tik-tok')) redesSociais.tiktok = url
    else if (tipo.includes('twitter') || tipo.includes('x.com')) redesSociais.twitter = url
    else if (tipo.includes('youtube')) redesSociais.youtube = url
  }

  // Detectar WhatsApp Business em telefones fixos
  const hasWhatsappBusiness = fixos.some((f: AssertivaPhone) => f.whatsapp === true)

  // Campos extras do cadastro (confirmados via Worker)
  const temGoogleMeuNegocio = cadastro.temGoogleMeuNegocio ?? undefined
  const porteEmpresa = cadastro.porteEmpresa || undefined
  const situacaoCadastral = cadastro.situacaoCadastral || undefined

  // Enderecos com geolocalização (resp.enderecos inclui latitude/longitude)
  const enderecos = Array.isArray(resp.enderecos) ? resp.enderecos : []
  const primeiroEndereco = enderecos[0] || null

  // Faturamento/score — podem nao existir no tier atual (graceful)
  const faturamentoPresumido = resp.faturamentoPresumido
    || cadastro.faturamentoPresumido
    || undefined
  const scoreCredito = typeof (resp.scoreCredito?.valor ?? resp.scoreCredito) === 'number'
    ? (resp.scoreCredito?.valor ?? resp.scoreCredito)
    : undefined
  const rendaPresumida = resp.rendaPresumida || cadastro.rendaPresumida || undefined

  return {
    razaoSocial: cadastro.razaoSocial,
    nomeFantasia: cadastro.nomeFantasia,
    cnpj: cleanCnpj,
    telefones: [...celulares, ...fixos],
    emails,
    socios,
    _protocolo: raw.cabecalho?.protocolo || raw._protocolo,
    _site: cadastro.site,
    _cnaeDescricao: cadastro.cnaeDescricao,
    _idadeEmpresa: cadastro.idadeEmpresa,
    _quantidadeFuncionarios: cadastro.quantidadeFuncionarios,
    _redesSociais: Object.values(redesSociais).some(Boolean) ? redesSociais : undefined,
    _faturamentoPresumido: typeof faturamentoPresumido === 'number' ? faturamentoPresumido : undefined,
    _scoreCredito: typeof scoreCredito === 'number' ? scoreCredito : undefined,
    _rendaPresumida: typeof rendaPresumida === 'number' ? rendaPresumida : undefined,
    _hasWhatsappBusiness: hasWhatsappBusiness || undefined,
    _indicadorAtividade: situacaoCadastral,
    // Campos extras descobertos via Worker (usados pelo SPICED)
    _temGoogleMeuNegocio: temGoogleMeuNegocio,
    _porteEmpresa: porteEmpresa,
    _endereco: primeiroEndereco ? {
      cidade: primeiroEndereco.cidade,
      uf: primeiroEndereco.uf,
      bairro: primeiroEndereco.bairro,
      latitude: primeiroEndereco.latitude,
      longitude: primeiroEndereco.longitude,
    } : undefined,
  } satisfies AssertivaCompanyResult
}

// --- Possiveis decisores (requer protocolo da consulta CNPJ) ---

export async function getDecisionMakers(cnpj: string, protocolo?: string): Promise<AssertivaDecisionMaker[]> {
  if (!protocolo) return []
  const cleanCnpj = cnpj.replace(/\D/g, '')
  try {
    const result = await assertivaViaProxy<any>('get-decision-makers', {
      cnpj: cleanCnpj,
      protocolo,
    })
    const decisores = result.resposta?.decisores || result.decisores || []
    return decisores.map((d: any) => ({
      nome: d.nome || '',
      cpf: d.cpf,
      cargo: d.cargo || d.qualificacao || '',
      telefones: (d.telefones || []).map((t: any) => ({
        numero: t.numero?.replace(/\D/g, '') || '',
        tipo: t.tipo || 'celular',
        whatsapp: t.aplicativos?.whatsApp || false,
        hotphone: t.hotphone || false,
      })),
      emails: (d.emails || []).map((e: any) => ({ endereco: e.email || e.endereco || '' })),
    }))
  } catch {
    return []
  }
}

// --- Consulta CPF (dados pessoais do decisor: renda, cargo, telefones, redes sociais) ---

export interface AssertivaCpfResult {
  nome?: string
  cpf: string
  idade?: number
  sexo?: string
  telefones: AssertivaPhone[]
  emails: Array<{ endereco: string }>
  redesSociais: AssertivaSocialLinks
  rendaEstimada?: number
  faixaSalarial?: string
  cargoAtual?: string
  setorAtual?: string
  participacoesEmpresas: Array<{ cnpj: string; razaoSocial: string; cargo: string }>
}

export async function lookupCpf(cpf: string): Promise<AssertivaCpfResult> {
  const cleanCpf = cpf.replace(/\D/g, '')
  const raw = await assertivaViaProxy<any>('lookup-cpf', { cpf: cleanCpf })
  const resp = raw.resposta || raw
  const cadastro = resp.dadosCadastrais || resp.dadosPessoais || {}

  // Telefones pessoais (celulares = moveis na consulta CPF)
  const moveis = (resp.telefones?.moveis || resp.telefones?.celulares || []).map((t: any) => ({
    numero: t.numero?.replace(/\D/g, '') || '',
    tipo: 'celular' as const,
    operadora: t.operadora,
    whatsapp: t.aplicativos?.whatsApp || false,
    hotphone: t.hotphone || false,
  }))
  const fixos = (resp.telefones?.fixos || []).map((t: any) => ({
    numero: t.numero?.replace(/\D/g, '') || '',
    tipo: 'fixo' as const,
    operadora: t.operadora,
    whatsapp: false,
    hotphone: false,
  }))

  // Emails pessoais
  const emails = (resp.emails || []).map((e: any) => ({
    endereco: e.email || e.endereco || '',
  }))

  // Redes sociais da pessoa
  const rawSociais = Array.isArray(resp.redesSociais) ? resp.redesSociais : []
  const redesSociais: AssertivaSocialLinks = {}
  for (const rede of rawSociais) {
    const tipo = (rede.tipo || rede.rede || rede.nome || '').toLowerCase()
    const url = rede.url || rede.link || rede.perfil || ''
    if (!url) continue
    if (tipo.includes('instagram')) redesSociais.instagram = url
    else if (tipo.includes('facebook')) redesSociais.facebook = url
    else if (tipo.includes('linkedin')) redesSociais.linkedin = url
    else if (tipo.includes('tiktok') || tipo.includes('tik_tok') || tipo.includes('tik-tok')) redesSociais.tiktok = url
    else if (tipo.includes('twitter') || tipo.includes('x.com')) redesSociais.twitter = url
  }

  // Historico profissional — renda, cargo, setor (primeiro = mais recente)
  const historico = resp.possivelHistoricoProfissional || []
  const maisRecente = historico[0] || null
  const rendaEstimada = maisRecente?.rendaEstimada ? parseFloat(maisRecente.rendaEstimada) : undefined
  const faixaSalarial = maisRecente?.faixaSalarial || undefined
  const cargoAtual = maisRecente?.cboDescricao || undefined
  const setorAtual = maisRecente?.setor || undefined

  // Participacoes em empresas
  const participacoes = (resp.participacoesEmpresas || []).map((p: any) => ({
    cnpj: p.cnpj || '',
    razaoSocial: p.razaoSocial || '',
    cargo: p.cargo || '',
  }))

  return {
    nome: cadastro.nome,
    cpf: cleanCpf,
    idade: cadastro.idade,
    sexo: cadastro.sexo,
    telefones: [...moveis, ...fixos],
    emails,
    redesSociais,
    rendaEstimada: rendaEstimada && !isNaN(rendaEstimada) ? rendaEstimada : undefined,
    faixaSalarial,
    cargoAtual,
    setorAtual,
    participacoesEmpresas: participacoes,
  }
}

// --- Consulta telefone (validacao reversa) ---

export async function lookupPhone(phone: string): Promise<any> {
  const cleanPhone = phone.replace(/\D/g, '')
  return assertivaViaProxy('lookup-phone', { phone: cleanPhone })
}

// --- Helpers ---

export function extractBestPhone(phones: AssertivaPhone[]): { whatsapp?: string; landline?: string; whatsappConfirmed: boolean; phoneIsHot: boolean } {
  let whatsapp: string | undefined
  let landline: string | undefined
  let whatsappConfirmed = false
  let phoneIsHot = false

  for (const p of phones) {
    if (p.tipo === 'celular' || p.numero?.length === 11) {
      if (!whatsapp) whatsapp = formatPhone(p.numero)
      if (p.whatsapp) whatsappConfirmed = true
      if (p.hotphone) phoneIsHot = true
    } else {
      if (!landline) landline = formatPhone(p.numero)
    }
  }

  return { whatsapp, landline, whatsappConfirmed, phoneIsHot }
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}

// --- Discovery: testar quais endpoints estao disponiveis ---

export async function discoverEndpoints(): Promise<Record<string, boolean>> {
  try {
    const result = await assertivaViaProxy<Record<string, boolean>>('discover-endpoints', {})
    return result
  } catch {
    return { cnpj: false, decisores: false, cpf: false, telefone: false, email: false }
  }
}
