import type { AssertivaCompanyResult, AssertivaDecisionMaker, AssertivaPhone } from '../types'

// Assertiva calls are proxied through n8n to avoid CORS issues.
// The n8n workflow handles OAuth2 auth server-side (credentials secured).
const PROXY_URL = import.meta.env.VITE_N8N_ASSERTIVA_PROXY || 'https://n8n.bilinski.cloud/webhook/assertiva-proxy'

// Fallback: direct calls (only works from server/n8n, not browser)
const DIRECT_BASE_URL = 'https://api.assertivasolucoes.com.br'
const CLIENT_ID = import.meta.env.VITE_ASSERTIVA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_ASSERTIVA_CLIENT_SECRET || ''

// Token cache for direct mode (used by n8n Code nodes, not browser)
let tokenCache: { token: string; expiresAt: number } | null = null

// --- Proxy fetch (browser → n8n → Assertiva) ---

async function assertivaViaProxy<T>(action: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`Assertiva proxy ${res.status}: ${error.message || error.error || res.statusText}`)
  }

  return res.json()
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
  } as any
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
