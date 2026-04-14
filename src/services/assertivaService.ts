import type { AssertivaCompanyResult, AssertivaDecisionMaker, AssertivaPhone, AssertivaSocialLinks } from '../types'

// Assertiva proxy: Worker (primário) + n8n (fallback)
// Worker Cloudflare elimina CORS server-side. Se falhar, tenta n8n.
const WORKER_URL = import.meta.env.VITE_ASSERTIVA_WORKER_URL || ''
const N8N_URL = import.meta.env.VITE_N8N_ASSERTIVA_PROXY || ''

// Fallback: direct calls (only works from server contexts, not browser)
const DIRECT_BASE_URL = 'https://api.assertivasolucoes.com.br'
const CLIENT_ID = import.meta.env.VITE_ASSERTIVA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_ASSERTIVA_CLIENT_SECRET || ''

// Token cache for direct mode
let tokenCache: { token: string; expiresAt: number } | null = null

// --- Proxy fetch: Worker (primário) → n8n (fallback) ---

async function proxyFetch(url: string, body: Record<string, string>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function assertivaViaProxy<T>(action: string, params: Record<string, string>): Promise<T> {
  const payload = { action, ...params }

  // Tentar Worker primeiro (primário — sem CORS, mais rápido)
  if (WORKER_URL) {
    try {
      const res = await proxyFetch(WORKER_URL, payload)
      if (res.ok) return res.json()
    } catch { /* Worker falhou, tentar n8n */ }
  }

  // Fallback: n8n webhook
  if (N8N_URL) {
    try {
      const res = await proxyFetch(N8N_URL, payload)
      if (res.ok) return res.json()
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(`Assertiva n8n ${res.status}: ${error.message || res.statusText}`)
    } catch (err) {
      if (err instanceof Error && err.message.includes('Assertiva n8n')) throw err
      // n8n também falhou
    }
  }

  throw new Error('Assertiva indisponível: nenhum proxy configurado (Worker ou n8n)')
}

// --- Direct auth (fallback, for server-side contexts) ---

export async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
  const res = await fetch(`${DIRECT_BASE_URL}/oauth2/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`Assertiva auth ${res.status}: ${error.message || res.statusText}`)
  }

  const data = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 5) * 1000,
  }
  return data.access_token
}

// --- Consulta CNPJ (telefones, emails, socios) ---

export async function lookupCnpj(cnpj: string): Promise<AssertivaCompanyResult> {
  const cleanCnpj = cnpj.replace(/\D/g, '')

  const raw = await assertivaViaProxy<any>('lookup-cnpj', { cnpj: cleanCnpj })

  // Mapear resposta — proxy retorna dados ja processados pelo n8n ou raw da Assertiva
  const resp = raw.resposta || raw
  const cadastro = resp.dadosCadastrais || {}

  // Debug: logar campos disponíveis para mapear extração expandida
  if (typeof window !== 'undefined') {
    const availableFields = Object.keys(resp).filter(k => resp[k] != null)
    const cadastroFields = Object.keys(cadastro).filter(k => cadastro[k] != null)
    console.log('[Assertiva] Campos resp:', availableFields.join(', '))
    console.log('[Assertiva] Campos cadastro:', cadastroFields.join(', '))
    if (resp.redesSociais || cadastro.redesSociais || resp.midiasSociais) {
      console.log('[Assertiva] Redes sociais:', JSON.stringify(resp.redesSociais || cadastro.redesSociais || resp.midiasSociais))
    }
    if (resp.faturamentoPresumido || cadastro.faturamentoPresumido || resp.faturamento) {
      console.log('[Assertiva] Faturamento:', resp.faturamentoPresumido || cadastro.faturamentoPresumido || resp.faturamento)
    }
    if (resp.scoreCredito || cadastro.scoreCredito) {
      console.log('[Assertiva] Score crédito:', resp.scoreCredito || cadastro.scoreCredito)
    }
  }
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

  // Extrair redes sociais (podem vir em resp.redesSociais, cadastro.redesSociais, ou resp.midiasSociais)
  const rawSociais = resp.redesSociais || cadastro.redesSociais || resp.midiasSociais || {}
  const redesSociais: AssertivaSocialLinks = {}
  if (typeof rawSociais === 'object' && rawSociais !== null) {
    redesSociais.instagram = rawSociais.instagram || rawSociais.instagramUrl || undefined
    redesSociais.facebook = rawSociais.facebook || rawSociais.facebookUrl || undefined
    redesSociais.linkedin = rawSociais.linkedin || rawSociais.linkedinUrl || undefined
    redesSociais.twitter = rawSociais.twitter || rawSociais.twitterUrl || undefined
    redesSociais.youtube = rawSociais.youtube || rawSociais.youtubeUrl || undefined
  }

  // Detectar WhatsApp Business em telefones fixos
  const hasWhatsappBusiness = fixos.some((f: AssertivaPhone) => f.whatsapp === true)

  // Faturamento — pode vir em diferentes paths da resposta
  const faturamentoPresumido = resp.faturamentoPresumido
    || cadastro.faturamentoPresumido
    || resp.faturamento?.valorPresumido
    || cadastro.receitaBruta
    || undefined

  // Score de crédito
  const scoreCredito = resp.scoreCredito?.valor
    || resp.scoreCredito
    || cadastro.scoreCredito
    || undefined

  // Renda presumida
  const rendaPresumida = resp.rendaPresumida
    || cadastro.rendaPresumida
    || undefined

  // Indicador de atividade
  const indicadorAtividade = resp.indicadorAtividade
    || cadastro.indicadorAtividade
    || cadastro.situacaoAtividade
    || undefined

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
    _indicadorAtividade: indicadorAtividade,
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

// --- Consulta CPF (telefones pessoais do decisor) ---

export async function lookupCpf(cpf: string): Promise<any> {
  const cleanCpf = cpf.replace(/\D/g, '')
  return assertivaViaProxy('lookup-cpf', { cpf: cleanCpf })
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
