import type { CnpjaOffice, CnpjaSearchParams, Lead } from '../types'

const API_KEY = import.meta.env.VITE_CNPJA_API_KEY || ''
const BASE_URL = 'https://api.cnpja.com'
const OPEN_URL = 'https://open.cnpja.com'

async function cnpjaFetch<T>(path: string, useOpen = false, retryCount = 0): Promise<T> {
  const base = useOpen ? OPEN_URL : BASE_URL
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (!useOpen && API_KEY) {
    headers['Authorization'] = API_KEY
  }

  const res = await fetch(`${base}${path}`, { headers })

  if (res.status === 429) {
    if (retryCount >= 3) {
      throw new Error('CNPJa: rate limit excedido apos 3 tentativas. Aguarde e tente novamente.')
    }
    const delay = 2000 * Math.pow(2, retryCount) // 2s, 4s, 8s
    await new Promise((r) => setTimeout(r, delay))
    return cnpjaFetch<T>(path, useOpen, retryCount + 1)
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`CNPJa ${res.status}: ${error.message || res.statusText}`)
  }

  return res.json()
}

// --- Pesquisa por CNPJ (endpoint principal) ---

export async function searchOffice(cnpj: string): Promise<CnpjaOffice> {
  const cleanCnpj = cnpj.replace(/\D/g, '')
  try {
    return await cnpjaFetch<CnpjaOffice>(`/office/${cleanCnpj}`)
  } catch (err) {
    // Fallback para API open (gratuita) se comercial falhar
    return cnpjaFetch<CnpjaOffice>(`/office/${cleanCnpj}`, true)
  }
}

// --- Pesquisa avancada simples (legado, mantida para compatibilidade) ---

export async function searchOffices(params: CnpjaSearchParams): Promise<CnpjaOffice[]> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value))
    }
  }
  const qs = searchParams.toString()
  const result = await cnpjaFetch<{ count: number; records: CnpjaOffice[] }>(
    `/office?${qs}`,
  )
  return result.records || []
}

// --- Pesquisa avancada paginada (nova — usada pelo PESCA) ---

export async function searchOfficesPaginated(
  params: CnpjaSearchParams,
  options: {
    targetCount: number
    maxPages?: number
    signal?: AbortSignal
    onProgress?: (found: number) => void
    // Over-fetch adaptativo (PESCA com quantidade exata):
    // quando `targetValidCount` + `isValid` são fornecidos, a paginação continua
    // até juntar N empresas VÁLIDAS (não apenas N brutas), respeitando `maxOffices`.
    targetValidCount?: number
    isValid?: (office: CnpjaOffice) => boolean
    maxOffices?: number
  },
): Promise<{ offices: CnpjaOffice[]; totalCount: number; validCount: number }> {
  const allOffices: CnpjaOffice[] = []
  const maxPages = options.maxPages ?? 15
  const maxOffices = options.maxOffices ?? Infinity
  const usesValidTarget = options.targetValidCount != null && typeof options.isValid === 'function'
  let validCount = 0
  let currentToken: string | undefined

  for (let page = 0; page < maxPages; page++) {
    if (options.signal?.aborted) break
    // Teto rígido de consultas (controle de custo CNPJa). Checado ANTES do fetch
    if (allOffices.length >= maxOffices) break
    // Critério de parada: por válidos (over-fetch) ou por brutos (modo legado)
    if (usesValidTarget) {
      if (validCount >= (options.targetValidCount as number)) break
    } else if (allOffices.length >= options.targetCount) {
      break
    }

    // CNPJa: token is mutually exclusive with other params
    const queryParams: Record<string, string | number | boolean> = { limit: 10 }
    if (currentToken) {
      queryParams.token = currentToken
    } else {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = value
        }
      }
    }

    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParams)) {
      qs.set(key, String(value))
    }

    const result = await cnpjaFetch<{ count: number; next?: string; records: CnpjaOffice[] }>(
      `/office?${qs}`,
    )

    if (!result.records?.length) break
    allOffices.push(...result.records)
    if (usesValidTarget) {
      validCount += result.records.filter(options.isValid as (o: CnpjaOffice) => boolean).length
    }
    // Em modo over-fetch o progresso reporta válidos (o que o usuário realmente recebe)
    options.onProgress?.(usesValidTarget ? validCount : allOffices.length)

    currentToken = result.next
    if (!currentToken) break
  }

  return { offices: allOffices, totalCount: allOffices.length, validCount }
}

// --- Consulta creditos ---

export async function checkCredits(): Promise<{ used: number; limit: number; remaining: number }> {
  return cnpjaFetch('/credit')
}

// --- Consulta empresa (socios + filiais, custo 0) ---

export async function getCompany(companyId: number): Promise<any> {
  return cnpjaFetch(`/company/${companyId}`)
}

// --- Consulta CEP (custo 0) ---

export async function getZip(code: string): Promise<{ municipality: number; street: string; district: string; city: string; state: string }> {
  const cleanCode = code.replace(/\D/g, '')
  return cnpjaFetch(`/zip/${cleanCode}`)
}

// --- Mapear resposta CNPJa para campos Lead ---

export function mapCnpjaToLead(office: CnpjaOffice): Partial<Lead> {
  const phone = office.phones?.[0]
  const email = office.emails?.[0]

  // Derivar taxRegime de simples/simei
  let taxRegime: string | undefined
  if (office.company?.simei?.optant) taxRegime = 'mei'
  else if (office.company?.simples?.optant) taxRegime = 'simples'

  // Mapear size para tier
  let tier = 'Micro+'
  const sizeAcronym = office.company?.size?.acronym
  if (sizeAcronym === 'ME') tier = 'Micro+'
  else if (sizeAcronym === 'EPP') tier = 'Small'
  else if (sizeAcronym === 'DEMAIS') tier = 'Medium='

  // Estimar employees pelo porte
  let employees: number | undefined
  if (sizeAcronym === 'ME') employees = 5
  else if (sizeAcronym === 'EPP') employees = 30
  else if (sizeAcronym === 'DEMAIS') employees = 100

  // Calcular yearsInMarket
  let yearsInMarket: number | undefined
  if (office.founded) {
    const founded = new Date(office.founded)
    yearsInMarket = Math.floor((Date.now() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  return {
    companyName: office.company?.name,
    tradeName: office.alias || undefined,
    cnpj: office.taxId,
    segment: office.mainActivity?.text,
    tier,
    status: 'Novo',
    score: 0,
    temperature: 'Frio' as const,
    address: office.address ? `${office.address.street}, ${office.address.number}` : undefined,
    city: office.address?.city,
    state: office.address?.state,
    zipCode: office.address?.zip,
    district: office.address?.district,
    municipalityCode: office.address?.municipality,
    capitalSocial: office.company?.equity,
    legalNature: office.company?.nature?.text,
    registrationStatus: office.status?.text as any,
    statusDate: office.statusDate,
    foundingDate: office.founded,
    cnaePrimary: office.mainActivity ? `${office.mainActivity.id} - ${office.mainActivity.text}` : undefined,
    cnaeSecondary: office.sideActivities?.map((a) => `${a.id} - ${a.text}`).join('\n'),
    rfPhone: phone ? `${phone.area}${phone.number}` : undefined,
    phoneType: phone?.type as any,
    rfEmail: email?.address,
    emailDomain: email?.domain,
    taxRegime: taxRegime as any,
    simplesOptant: office.company?.simples?.optant,
    simplesSince: office.company?.simples?.since || undefined,
    isHeadquarters: office.head,
    cnpjaLastUpdate: office.updated,
    employees,
    yearsInMarket,
    enrichmentStatus: 'cnpja' as const,
  }
}

// --- Extrair socios do CNPJa para tabela Partners ---

export function extractPartners(office: CnpjaOffice): Array<{ name: string; qualification: string; since?: string; ageRange?: string; personType?: string; cpf?: string }> {
  const members = office.company?.members || []
  return members.map((m) => ({
    name: m.person.name,
    qualification: m.role.text,
    since: m.since,
    ageRange: m.person.age,
    personType: m.person.type,
    cpf: m.person.taxId,
  }))
}
