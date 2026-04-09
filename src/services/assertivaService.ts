import type { AssertivaToken, AssertivaCompanyResult, AssertivaDecisionMaker, AssertivaPhone } from '../types'

const CLIENT_ID = import.meta.env.VITE_ASSERTIVA_CLIENT_ID || ''
const CLIENT_SECRET = import.meta.env.VITE_ASSERTIVA_CLIENT_SECRET || ''
const BASE_URL = 'https://api.assertivasolucoes.com.br'

// Token cache (60s TTL)
let tokenCache: { token: string; expiresAt: number } | null = null

// --- Autenticacao OAuth2 ---

export async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
  const res = await fetch(`${BASE_URL}/oauth2/v3/token`, {
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

  const data: AssertivaToken = await res.json()
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 5) * 1000, // 5s buffer
  }
  return data.access_token
}

async function assertivaFetch<T>(path: string): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401) {
    // Token expirado, limpar cache e retry
    tokenCache = null
    const newToken = await getToken()
    const retry = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!retry.ok) {
      throw new Error(`Assertiva ${retry.status}: ${retry.statusText}`)
    }
    return retry.json()
  }

  if (res.status === 403) {
    throw new Error('Assertiva: endpoint nao disponivel no seu plano')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`Assertiva ${res.status}: ${error.message || res.statusText}`)
  }

  return res.json()
}

// --- Consulta CNPJ (telefones, emails, socios) ---

export async function lookupCnpj(cnpj: string): Promise<AssertivaCompanyResult> {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  return assertivaFetch<AssertivaCompanyResult>(
    `/localize/v3/cnpj?cnpj=${cleanCnpj}&idFinalidade=5`,
  )
}

// --- Possiveis decisores ---

export async function getDecisionMakers(cnpj: string): Promise<AssertivaDecisionMaker[]> {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  try {
    const result = await assertivaFetch<{ decisores?: AssertivaDecisionMaker[] }>(
      `/localize/v3/possiveis-decisores?cnpj=${cleanCnpj}&idFinalidade=5`,
    )
    return result.decisores || []
  } catch {
    // Endpoint pode nao estar disponivel no plano
    return []
  }
}

// --- Consulta CPF (telefones pessoais do decisor) ---

export async function lookupCpf(cpf: string): Promise<any> {
  const cleanCpf = cpf.replace(/\D/g, '')
  return assertivaFetch(`/localize/v3/cpf?cpf=${cleanCpf}&idFinalidade=5`)
}

// --- Consulta telefone (validacao reversa) ---

export async function lookupPhone(phone: string): Promise<any> {
  const cleanPhone = phone.replace(/\D/g, '')
  return assertivaFetch(`/localize/v3/telefone?telefone=${cleanPhone}&idFinalidade=5`)
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
  const endpoints: Record<string, string> = {
    cnpj: '/localize/v3/cnpj?cnpj=00000000000191&idFinalidade=5',
    decisores: '/localize/v3/possiveis-decisores?cnpj=00000000000191&idFinalidade=5',
    cpf: '/localize/v3/cpf?cpf=00000000000&idFinalidade=5',
    telefone: '/localize/v3/telefone?telefone=11999999999&idFinalidade=5',
    email: '/localize/v3/email?email=test@test.com&idFinalidade=5',
  }

  const results: Record<string, boolean> = {}
  const token = await getToken()

  for (const [name, path] of Object.entries(endpoints)) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      results[name] = res.status !== 403
    } catch {
      results[name] = false
    }
  }

  return results
}
