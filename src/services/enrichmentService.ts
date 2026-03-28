import { updateLead } from './leadService'
import { createContact, getContacts } from './contactService'
import { matchBusiness, matchProspects } from '../lib/vibeprospecting'
import type { Lead } from '../types'

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN || ''
const APIFY_API = 'https://api.apify.com/v2'

// --- Apify helpers ---

async function runActor<T = any>(actorId: string, input: Record<string, any>, timeoutMs = 120_000): Promise<T[] | null> {
  try {
    const res = await fetch(`${APIFY_API}/acts/${actorId}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const { data } = await res.json()
    const runId = data.id

    // Poll until done
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 5000))
      const statusRes = await fetch(`${APIFY_API}/acts/${actorId}/runs/${runId}?token=${APIFY_TOKEN}`)
      if (!statusRes.ok) continue
      const { data: run } = await statusRes.json()
      if (run.status === 'SUCCEEDED') {
        const itemsRes = await fetch(`${APIFY_API}/datasets/${run.defaultDatasetId}/items?token=${APIFY_TOKEN}&limit=50`)
        return itemsRes.ok ? await itemsRes.json() : null
      }
      if (run.status === 'FAILED' || run.status === 'ABORTED') return null
    }
    return null
  } catch {
    return null
  }
}

// --- Individual enrichment actors ---

// --- Public API: OpenCNPJ (primary, 50 req/s, free, no auth) ---

async function enrichByCnpj(cnpj: string): Promise<Partial<Lead> | null> {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return null

  // 1. OpenCNPJ (50 req/s, mais rápida)
  const data = await fetchOpenCnpj(clean)
  if (data) return data

  // 2. Fallback: BrasilAPI
  const data2 = await fetchBrasilApiCnpj(clean)
  if (data2) return data2

  // 3. Último recurso: Apify actor
  const items = await runActor('viralanalyzer/cnpj-enricher', { cnpjs: [clean] })
  if (!items?.length) return null
  const d = items[0]
  return {
    tradeName: d.nome_fantasia || d.tradeName || undefined,
    segment: d.cnae_fiscal_descricao || d.segment || undefined,
    address: [d.logradouro, d.numero, d.bairro].filter(Boolean).join(', ') || undefined,
    city: d.municipio || d.city || undefined,
    state: d.uf || d.state || undefined,
    employees: d.porte ? estimateEmployees(d.porte) : undefined,
    yearsInMarket: d.data_inicio_atividade ? yearsSince(d.data_inicio_atividade) : undefined,
  }
}

async function fetchOpenCnpj(cnpj: string): Promise<Partial<Lead> | null> {
  try {
    const res = await fetch(`https://api.opencnpj.org/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()
    return parseCnpjResponse(d)
  } catch { return null }
}

async function fetchBrasilApiCnpj(cnpj: string): Promise<Partial<Lead> | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()
    return parseCnpjResponse(d)
  } catch { return null }
}

function parseCnpjResponse(d: any): Partial<Lead> {
  const socios = d.qsa || []
  const socioAdmin = socios.find((s: any) =>
    s.qual_socio?.toLowerCase().includes('administrador') ||
    s.qualificacao_socio?.toLowerCase().includes('administrador') ||
    s.nome_socio,
  )

  const cep = d.cep?.replace(/\D/g, '') || ''
  const result: Partial<Lead> = {
    tradeName: d.nome_fantasia || undefined,
    companyName: d.razao_social || undefined,
    segment: d.cnae_fiscal_descricao || d.atividade_principal?.[0]?.text || undefined,
    address: [d.logradouro, d.numero, d.complemento, d.bairro].filter(Boolean).join(', ') || undefined,
    city: d.municipio || undefined,
    state: d.uf || undefined,
    employees: estimateEmployees(d.descricao_porte || d.porte || ''),
    yearsInMarket: d.data_inicio_atividade ? yearsSince(d.data_inicio_atividade) : undefined,
    // --- Campos estruturados da Receita Federal ---
    capitalSocial: d.capital_social ? Number(d.capital_social) : undefined,
    legalNature: d.natureza_juridica || d.descricao_natureza_juridica || undefined,
    registrationStatus: d.descricao_situacao_cadastral || d.situacao_cadastral || undefined,
    foundingDate: d.data_inicio_atividade || undefined,
    cnaePrimary: d.cnae_fiscal ? `${d.cnae_fiscal} - ${d.cnae_fiscal_descricao || ''}` : d.atividade_principal?.[0]?.text || undefined,
    cnaeSecondary: d.cnaes_secundarios?.length ? JSON.stringify(d.cnaes_secundarios.map((c: any) => c.descricao || c.text || c).filter(Boolean)) :
      d.atividades_secundarias?.length ? JSON.stringify(d.atividades_secundarias.map((c: any) => c.text || c.descricao || c).filter(Boolean)) : undefined,
    partners: socios.length ? JSON.stringify(socios.map((s: any) => ({
      nome: s.nome_socio || s.nome,
      qualificacao: s.qual_socio || s.qualificacao_socio || 'Sócio',
    }))) : undefined,
    rfEmail: d.email || d.correio_eletronico || undefined,
    rfPhone: d.telefone || d.ddd_telefone_1 ? `${d.ddd_telefone_1 || ''}${d.telefone || ''}`.replace(/\D/g, '') || undefined : undefined,
    businessSummary: [
      d.cnae_fiscal_descricao || d.atividade_principal?.[0]?.text,
      d.descricao_situacao_cadastral,
      d.natureza_juridica ? `Natureza: ${d.natureza_juridica}` : null,
      d.capital_social ? `Capital: R$ ${Number(d.capital_social).toLocaleString('pt-BR')}` : null,
      socioAdmin?.nome_socio ? `Sócio: ${socioAdmin.nome_socio}` : null,
    ].filter(Boolean).join(' · '),
  }

  // Armazenar CEP para geolocalização posterior
  if (cep) (result as any)._cep = cep

  return result
}

// --- Public API: CNPJa Open (regime tributário, Simples Nacional) ---

async function fetchTaxRegime(cnpj: string): Promise<Partial<Lead> | null> {
  try {
    const res = await fetch(`https://open.cnpja.com/office/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()

    let taxRegime = 'nao_optante'
    if (d.company?.simples?.optant === true) taxRegime = 'simples'
    if (d.company?.simples?.mei === true || d.company?.simei?.optant === true) taxRegime = 'mei'
    if (d.company?.naturezaJuridica?.id && String(d.company.naturezaJuridica.id).startsWith('2')) taxRegime = 'lucro_presumido'

    return {
      taxRegime,
      ...(d.company?.equity ? { capitalSocial: d.company.equity } : {}),
      ...(d.registrations?.length ? {
        registrationStatus: d.status?.text || d.registrations[0]?.state?.name || undefined,
      } : {}),
    }
  } catch { return null }
}

// --- Public API: BrasilAPI CEP v2 (geolocalização com lat/long) ---

async function fetchGeoFromCep(cep: string): Promise<Partial<Lead> | null> {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) return null
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`)
    if (!res.ok) return null
    const d = await res.json()
    return {
      address: [d.street, d.neighborhood].filter(Boolean).join(', ') || undefined,
      city: d.city || undefined,
      state: d.state || undefined,
      latitude: d.location?.coordinates?.latitude || undefined,
      longitude: d.location?.coordinates?.longitude || undefined,
    }
  } catch { return null }
}

// --- Public API: BrasilAPI Registro.br (domínio ativo?) ---

async function fetchDomainStatus(domain: string): Promise<Partial<Lead> | null> {
  if (!domain) return null
  // Extrair domínio .br se aplicável
  const match = domain.match(/([a-z0-9-]+\.com\.br|[a-z0-9-]+\.br)/i)
  if (!match) return null
  try {
    const res = await fetch(`https://brasilapi.com.br/api/registrobr/v1/${match[0]}`)
    if (!res.ok) return null
    const d = await res.json()
    return {
      domainActive: d.status_code === 2 || d.status === 'REGISTERED' || !!d.fqdn,
      domainExpiry: d['expires-at'] || d.expires || undefined,
    }
  } catch { return null }
}

async function enrichByInstagram(handle: string): Promise<{ profile: any } | null> {
  const username = handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')
  if (!username) return null

  const items = await runActor('apify/instagram-profile-scraper', {
    usernames: [username],
  })
  if (!items?.length) return null

  const p = items[0]
  return {
    profile: {
      followers: p.followersCount || p.followers,
      following: p.followingCount || p.following,
      posts: p.postsCount || p.posts,
      bio: p.biography || p.bio,
      website: p.externalUrl || p.website,
      isVerified: p.verified || p.isVerified,
      isBusinessAccount: p.isBusinessAccount,
      businessCategory: p.businessCategory || p.category,
      profilePicUrl: p.profilePicUrl || p.profilePicUrlHD,
    },
  }
}

async function enrichByGoogleSearch(companyName: string, city?: string, state?: string): Promise<Partial<Lead> | null> {
  const location = [city, state].filter(Boolean).join(', ')
  const query = location ? `"${companyName}" ${location}` : `"${companyName}" Brasil`

  const items = await runActor('apify/google-search-scraper', {
    queries: query,
    countryCode: 'br',
    languageCode: 'pt-BR',
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
  })
  if (!items?.length) return null

  const results = items[0]?.organicResults || items
  const enriched: Partial<Lead> = {}

  // Extract website from first relevant result
  for (const r of results) {
    const url = r.url || r.link || ''
    if (url && !url.includes('facebook.com') && !url.includes('instagram.com') && !url.includes('linkedin.com') && !url.includes('google.com')) {
      enriched.website = url
      break
    }
  }

  // Extract social profiles
  for (const r of results) {
    const url = r.url || r.link || ''
    if (url.includes('instagram.com') && !enriched.instagram) enriched.instagram = url
    if (url.includes('linkedin.com/company') && !enriched.linkedin) enriched.linkedin = url
    if (url.includes('facebook.com') && !enriched.facebook) enriched.facebook = url
  }

  return Object.keys(enriched).length > 0 ? enriched : null
}

async function enrichByGoogleMaps(companyName: string, city?: string, state?: string): Promise<Partial<Lead> & { contacts?: any[] } | null> {
  const location = [city, state || 'Brasil'].filter(Boolean).join(', ')

  const items = await runActor('cheapget/google-business-profile', {
    searchTerms: [`${companyName} ${location}`],
    maxResults: 3,
  }, 90_000)
  if (!items?.length) return null

  // Find best match by name similarity
  const best = items.reduce((a: any, b: any) => {
    const aScore = similarity(companyName.toLowerCase(), (a.title || a.name || '').toLowerCase())
    const bScore = similarity(companyName.toLowerCase(), (b.title || b.name || '').toLowerCase())
    return bScore > aScore ? b : a
  }, items[0])

  const enriched: Partial<Lead> & { contacts?: any[] } = {}

  if (best.phone || best.phoneNumber) {
    enriched.contacts = [{
      name: undefined,  // telefone comercial — nome do decisor será identificado por outras fontes
      whatsapp: formatPhone(best.phone || best.phoneNumber),
      source: 'google_maps',
    }]
  }
  if (best.website || best.url) enriched.website = best.website || best.url
  if (best.address || best.fullAddress) enriched.address = best.address || best.fullAddress
  if (best.totalScore || best.rating) {
    enriched.googleRating = parseFloat(best.totalScore || best.rating) || undefined
    enriched.googleReviewsCount = parseInt(best.reviewsCount || best.reviews || '0') || undefined
    enriched.marketContext = `Google Maps: ${enriched.googleRating}/5 (${enriched.googleReviewsCount} avaliações)`
  }

  return Object.keys(enriched).length > 0 ? enriched : null
}

async function enrichByWebsite(url: string): Promise<{ emails: string[]; phones: string[]; socials: Record<string, string> } | null> {
  if (!url) return null
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`

  const items = await runActor('cdubiel/lead-scraper', {
    urls: [cleanUrl],
  }, 90_000)
  if (!items?.length) return null

  const d = items[0]
  return {
    emails: (d.emails || []).map((e: any) => typeof e === 'string' ? e : e.email).filter(Boolean),
    phones: (d.phoneNumbers || d.phones || []).map((p: any) => typeof p === 'string' ? p : p.number).filter(Boolean),
    socials: d.socialLinks || d.socialMedia || {},
  }
}

async function enrichByLinkedIn(companyUrl: string): Promise<Partial<Lead> | null> {
  if (!companyUrl) return null

  const items = await runActor('dev_fusion/Linkedin-Company-Scraper', {
    urls: [companyUrl],
  })
  if (!items?.length) return null

  const d = items[0]
  return {
    employees: d.employeeCount || d.staffCount || undefined,
    businessSummary: d.description || d.about || undefined,
    segment: d.industry || undefined,
  }
}

// --- VibeProspecting fallback ---

async function enrichByVibeProspecting(
  companyName: string,
  domain?: string,
): Promise<{ lead: Partial<Lead>; contacts: Array<{ name?: string; whatsapp?: string; email?: string; source: string }> } | null> {
  try {
    const biz = await matchBusiness(companyName, domain)
    if (!biz) return null

    const lead: Partial<Lead> = {}
    if (biz.industry) lead.segment = biz.industry
    if (biz.employeeCount) lead.employees = biz.employeeCount
    if (biz.city) lead.city = biz.city
    if (biz.state) lead.state = biz.state
    if (biz.website) lead.website = biz.website
    if (biz.linkedinUrl) lead.linkedin = biz.linkedinUrl
    if (biz.description) lead.businessSummary = biz.description
    if (biz.employeeCount) lead.linkedinEmployeeCount = biz.employeeCount
    if (biz.revenue) {
      lead.marketContext = [lead.marketContext, `Revenue: ${biz.revenue}`].filter(Boolean).join('\n')
    }
    if (biz.technologies?.length) {
      lead.techStack = biz.technologies.join(', ')
    }

    const contacts: Array<{ name?: string; whatsapp?: string; email?: string; source: string }> = []

    if (biz.phone) {
      contacts.push({ name: undefined, whatsapp: formatPhone(biz.phone), source: 'vibeprospecting' })
    }

    // Try to get prospects (decision-makers)
    const prospects = await matchProspects(companyName, domain)
    for (const p of prospects.slice(0, 3)) {
      if (p.email || p.phone) {
        contacts.push({
          name: p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ') || undefined,
          email: p.email || undefined,
          whatsapp: p.phone ? formatPhone(p.phone) : undefined,
          source: 'vibeprospecting',
        })
      }
    }

    return { lead, contacts }
  } catch {
    return null
  }
}

// --- Decision maker extraction ---

function extractDecisionMaker(partnersJson?: string): { nome: string; qualificacao: string } | null {
  if (!partnersJson) return null
  try {
    const partners: Array<{ nome: string; qualificacao: string }> = JSON.parse(partnersJson)
    if (!partners.length) return null
    // Priority: Administrador > Sócio-Administrador > Diretor > CEO > Fundador > any Sócio > first
    const priorities = ['administrador', 'socio-administrador', 'sócio-administrador', 'diretor', 'ceo', 'fundador', 'presidente', 'gerente']
    for (const keyword of priorities) {
      const match = partners.find(p => p.qualificacao?.toLowerCase().includes(keyword))
      if (match && match.nome) return match
    }
    // Fallback: first partner with a name
    const first = partners.find(p => p.nome && p.nome.length > 2)
    return first || null
  } catch { return null }
}

// --- Orchestrator ---

export type EnrichmentStep = {
  source: string
  status: 'pending' | 'running' | 'done' | 'skipped' | 'error'
  label: string
  detail?: string
}

export type EnrichmentProgress = {
  steps: EnrichmentStep[]
  currentStep: number
  totalSteps: number
  isDone: boolean
}

function calculateSpicedScore(leadData: Partial<Lead>, merged: Partial<Lead>): { spicedS: number; spicedP: number; spicedI: number; spicedC: number; spicedD: number } {
  const data = { ...leadData, ...merged }

  // S (Situation) — porte e contexto
  let spicedS = 1
  if (data.employees && data.employees > 5) spicedS++
  if (data.employees && data.employees > 20) spicedS++
  if (data.yearsInMarket && data.yearsInMarket > 3) spicedS++
  if (data.city && data.state) spicedS++
  // Bonus: capital social alto indica empresa consolidada
  if (data.capitalSocial && data.capitalSocial >= 100000) spicedS++

  // P (Pain) — sinais de dor
  let spicedP = 1
  if (data.googleRating !== undefined && data.googleRating < 4.0) spicedP += 2
  if (!data.website) spicedP++
  if (!data.instagram) spicedP++
  if (data.googleReviewsCount !== undefined && data.googleReviewsCount < 10) spicedP++
  // Bonus: empresa sem presença digital madura
  if (data.domainActive === false) spicedP++

  // I (Impact) — potencial de impacto
  let spicedI = 1
  const revenue = data.monthlyRevenue || 0
  if (revenue >= 100000) spicedI++
  if (revenue >= 200000) spicedI++
  if (revenue >= 500000) spicedI++
  if (data.instagramFollowers && data.instagramFollowers > 1000) spicedI++
  // Bonus: regime tributário indica porte real
  if (data.taxRegime === 'lucro_presumido' || data.taxRegime === 'lucro_real') spicedI++

  // C (Critical Event) — urgência
  let spicedC = 1
  if (data.yearsInMarket !== undefined && data.yearsInMarket < 2) spicedC += 2
  if (data.enrichmentStatus === 'complete') spicedC++
  if (data.googleRating !== undefined && data.googleRating >= 4.5) spicedC++
  // Bonus: empresa recém-cadastrada = momento de decisão
  if (data.registrationStatus === 'ATIVA' && data.yearsInMarket && data.yearsInMarket < 1) spicedC++

  // D (Decision) — acesso ao decisor
  let spicedD = 1
  if (data.cnpj) spicedD++
  if (data.linkedin) spicedD++
  if (data.website) spicedD++
  // Bonus: temos sócios identificados da RF
  if (data.partners) spicedD++
  if (data.rfEmail || data.rfPhone) spicedD++

  // Cap all scores at 5
  const cap = (n: number) => Math.min(5, Math.max(1, n))
  return { spicedS: cap(spicedS), spicedP: cap(spicedP), spicedI: cap(spicedI), spicedC: cap(spicedC), spicedD: cap(spicedD) }
}

export async function enrichLead(
  leadId: string,
  leadData: Partial<Lead>,
  onProgress?: (progress: EnrichmentProgress) => void,
): Promise<Partial<Lead>> {
  const steps: EnrichmentStep[] = [
    { source: 'cnpj', status: leadData.cnpj ? 'pending' : 'skipped', label: 'Receita Federal (CNPJ)' },
    { source: 'tax_regime', status: leadData.cnpj ? 'pending' : 'skipped', label: 'Regime Tributario (Simples/MEI)' },
    { source: 'geolocation', status: 'pending', label: 'Geolocalizacao (CEP)' },
    { source: 'domain_check', status: 'pending', label: 'Dominio .br (Registro.br)' },
    { source: 'google_search', status: 'pending', label: 'Pesquisa Google' },
    { source: 'google_maps', status: 'pending', label: 'Google Maps / Perfil Comercial' },
    { source: 'vibeprospecting', status: 'pending', label: 'VibeProspecting (fallback)' },
    { source: 'instagram', status: leadData.instagram ? 'pending' : 'skipped', label: 'Instagram' },
    { source: 'website', status: 'pending', label: 'Website (contatos)' },
    { source: 'linkedin', status: leadData.linkedin ? 'pending' : 'skipped', label: 'LinkedIn' },
  ]

  const notify = () => {
    const done = steps.filter((s) => s.status === 'done' || s.status === 'skipped' || s.status === 'error').length
    onProgress?.({
      steps: [...steps],
      currentStep: done,
      totalSteps: steps.length,
      isDone: done === steps.length,
    })
  }

  const merged: Partial<Lead> = {}
  const newContacts: Array<{ name?: string; whatsapp?: string; email?: string; source: string }> = []

  // Helper to find step by source name (avoids hardcoded indices)
  const step = (source: string) => steps.find(s => s.source === source)!

  // Helper to merge without overwriting existing user data
  const mergeField = (key: keyof Lead, value: any) => {
    if (value && !leadData[key]) {
      ;(merged as any)[key] = value
    }
  }

  // ========== FASE 1: APIs PÚBLICAS (gratuitas, sem token) ==========

  // Step 1: Receita Federal via OpenCNPJ/BrasilAPI
  let cnpjCep = ''
  if (leadData.cnpj) {
    step('cnpj').status = 'running'
    notify()
    try {
      const cnpjData = await enrichByCnpj(leadData.cnpj)
      if (cnpjData) {
        mergeField('tradeName', cnpjData.tradeName)
        mergeField('companyName', cnpjData.companyName)
        mergeField('segment', cnpjData.segment)
        mergeField('address', cnpjData.address)
        mergeField('city', cnpjData.city)
        mergeField('state', cnpjData.state)
        mergeField('employees', cnpjData.employees)
        mergeField('yearsInMarket', cnpjData.yearsInMarket)
        mergeField('businessSummary', cnpjData.businessSummary)
        // Campos estruturados da RF
        mergeField('capitalSocial', cnpjData.capitalSocial)
        mergeField('legalNature', cnpjData.legalNature)
        mergeField('registrationStatus', cnpjData.registrationStatus)
        mergeField('foundingDate', cnpjData.foundingDate)
        mergeField('cnaePrimary', cnpjData.cnaePrimary)
        mergeField('cnaeSecondary', cnpjData.cnaeSecondary)
        mergeField('partners', cnpjData.partners)
        mergeField('rfEmail', cnpjData.rfEmail)
        mergeField('rfPhone', cnpjData.rfPhone)
        // CEP para geolocalização
        cnpjCep = (cnpjData as any)._cep || ''
        // Extrair decisor dos sócios da RF (Administrador > Sócio > primeiro da lista)
        const rfDecisionMaker = extractDecisionMaker(cnpjData.partners)
        // Contato da RF — usar nome do decisor, NUNCA nome da empresa
        if (cnpjData.rfPhone && rfDecisionMaker) {
          newContacts.push({ name: rfDecisionMaker.nome, whatsapp: formatPhone(cnpjData.rfPhone), source: 'receita_federal' })
        }
        if (cnpjData.rfEmail && rfDecisionMaker) {
          newContacts.push({ name: rfDecisionMaker.nome, email: cnpjData.rfEmail, source: 'receita_federal' })
        }
      }
      step('cnpj').status = 'done'
      // Detail: summarize what was found
      const partnerCount = cnpjData?.partners ? JSON.parse(cnpjData.partners).length : 0
      const cnpjDetails = [
        cnpjData?.companyName ? 'Razao social' : null,
        partnerCount > 0 ? `${partnerCount} socio${partnerCount > 1 ? 's' : ''}` : null,
        cnpjData?.capitalSocial ? `Capital R$ ${Number(cnpjData.capitalSocial).toLocaleString('pt-BR')}` : null,
        cnpjData?.cnaePrimary ? 'CNAE' : null,
      ].filter(Boolean)
      if (cnpjDetails.length > 0) step('cnpj').detail = cnpjDetails.join(' + ')
    } catch {
      step('cnpj').status = 'error'
    }
    notify()
  }

  // Step 2: Regime Tributário (CNPJa Open)
  if (leadData.cnpj) {
    step('tax_regime').status = 'running'
    notify()
    try {
      const taxData = await fetchTaxRegime(leadData.cnpj.replace(/\D/g, ''))
      if (taxData) {
        mergeField('taxRegime', taxData.taxRegime)
        if (taxData.capitalSocial && !merged.capitalSocial) merged.capitalSocial = taxData.capitalSocial
      }
      step('tax_regime').status = 'done'
      if (taxData?.taxRegime) {
        const regimeLabels: Record<string, string> = { simples: 'Simples Nacional', mei: 'MEI', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real', nao_optante: 'Nao optante' }
        step('tax_regime').detail = regimeLabels[taxData.taxRegime] || taxData.taxRegime
      }
    } catch {
      step('tax_regime').status = 'error'
    }
    notify()
  }

  // Step 3: Geolocalização (BrasilAPI CEP v2)
  const cepToLookup = cnpjCep || ''
  if (cepToLookup) {
    step('geolocation').status = 'running'
    notify()
    try {
      const geoData = await fetchGeoFromCep(cepToLookup)
      if (geoData) {
        mergeField('city', geoData.city)
        mergeField('state', geoData.state)
        if (geoData.latitude) merged.latitude = geoData.latitude
        if (geoData.longitude) merged.longitude = geoData.longitude
      }
      step('geolocation').status = 'done'
      if (geoData?.latitude && geoData?.longitude) step('geolocation').detail = `${geoData.city || ''} · lat/long encontrados`
      else if (geoData?.city) step('geolocation').detail = geoData.city
    } catch {
      step('geolocation').status = 'error'
    }
    notify()
  } else {
    step('geolocation').status = 'skipped'
    notify()
  }

  // Step 4: Verificação de domínio .br (Registro.br)
  const websiteForDomain = leadData.website || merged.website || ''
  if (websiteForDomain && websiteForDomain.includes('.br')) {
    step('domain_check').status = 'running'
    notify()
    try {
      const domainData = await fetchDomainStatus(websiteForDomain)
      if (domainData) {
        merged.domainActive = domainData.domainActive
        if (domainData.domainExpiry) merged.domainExpiry = domainData.domainExpiry
      }
      step('domain_check').status = 'done'
      if (domainData?.domainActive) step('domain_check').detail = 'Dominio ativo'
      else if (domainData?.domainActive === false) step('domain_check').detail = 'Dominio expirado'
    } catch {
      step('domain_check').status = 'error'
    }
    notify()
  } else {
    step('domain_check').status = 'skipped'
    notify()
  }

  // ========== FASE 2: APIFY ACTORS ==========

  // Step 5: Google Search (find website, socials)
  step('google_search').status = 'running'
  notify()
  try {
    const googleData = await enrichByGoogleSearch(
      leadData.companyName || '',
      leadData.city || merged.city,
      leadData.state || merged.state,
    )
    if (googleData) {
      mergeField('website', googleData.website)
      mergeField('instagram', googleData.instagram)
      mergeField('linkedin', googleData.linkedin)
      mergeField('facebook', googleData.facebook)
    }
    step('google_search').status = 'done'
    const foundLinks = [googleData?.website ? 'Website' : null, googleData?.instagram ? 'Instagram' : null, googleData?.linkedin ? 'LinkedIn' : null, googleData?.facebook ? 'Facebook' : null].filter(Boolean)
    if (foundLinks.length > 0) step('google_search').detail = foundLinks.join(', ') + ' encontrado' + (foundLinks.length > 1 ? 's' : '')
  } catch {
    step('google_search').status = 'error'
  }
  notify()

  // Step 6: Google Maps / Business Profile
  step('google_maps').status = 'running'
  notify()
  try {
    const mapsData = await enrichByGoogleMaps(
      leadData.companyName || '',
      leadData.city || merged.city,
      leadData.state || merged.state,
    )
    if (mapsData) {
      mergeField('website', mapsData.website)
      mergeField('address', mapsData.address)
      mergeField('marketContext', mapsData.marketContext)
      if (mapsData.googleRating) merged.googleRating = mapsData.googleRating
      if (mapsData.googleReviewsCount) merged.googleReviewsCount = mapsData.googleReviewsCount
      if (mapsData.contacts) newContacts.push(...mapsData.contacts)
    }
    step('google_maps').status = 'done'
    const mapsDetails = [
      mapsData?.googleRating ? `Rating ${mapsData.googleRating}/5` : null,
      mapsData?.contacts?.length ? 'Tel encontrado' : null,
      mapsData?.googleReviewsCount ? `${mapsData.googleReviewsCount} avaliacoes` : null,
    ].filter(Boolean)
    if (mapsDetails.length > 0) step('google_maps').detail = mapsDetails.join(' · ')
  } catch {
    step('google_maps').status = 'error'
  }
  notify()

  // Step 7: VibeProspecting fallback
  const googleSearchFailed = step('google_search').status === 'error'
  const googleMapsFailed = step('google_maps').status === 'error'
  const missingKeyData = !merged.website && !leadData.website && !merged.employees && !leadData.employees
  const shouldFallback = googleSearchFailed || googleMapsFailed || missingKeyData

  if (shouldFallback) {
    step('vibeprospecting').status = 'running'
    notify()
    try {
      const domain = (leadData.website || merged.website || '')
        .replace(/^https?:\/\//, '').replace(/\/.*$/, '') || undefined
      const vpData = await enrichByVibeProspecting(leadData.companyName || '', domain)
      if (vpData) {
        mergeField('segment', vpData.lead.segment)
        mergeField('employees', vpData.lead.employees)
        mergeField('city', vpData.lead.city)
        mergeField('state', vpData.lead.state)
        mergeField('website', vpData.lead.website)
        mergeField('linkedin', vpData.lead.linkedin)
        mergeField('businessSummary', vpData.lead.businessSummary)
        mergeField('techStack', vpData.lead.techStack)
        if (vpData.lead.linkedinEmployeeCount) merged.linkedinEmployeeCount = vpData.lead.linkedinEmployeeCount
        if (vpData.lead.marketContext) {
          merged.marketContext = [leadData.marketContext || merged.marketContext, vpData.lead.marketContext].filter(Boolean).join('\n\n')
        }
        if (vpData.contacts.length > 0) newContacts.push(...vpData.contacts)
      }
      step('vibeprospecting').status = 'done'
      const vpDetails = [
        vpData?.contacts?.length ? `${vpData.contacts.length} contato${vpData.contacts.length > 1 ? 's' : ''}` : null,
        vpData?.lead.techStack ? 'Tech stack' : null,
        vpData?.lead.employees ? `~${vpData.lead.employees} func.` : null,
      ].filter(Boolean)
      if (vpDetails.length > 0) step('vibeprospecting').detail = vpDetails.join(' · ')
    } catch {
      step('vibeprospecting').status = 'error'
    }
    notify()
  } else {
    step('vibeprospecting').status = 'skipped'
    notify()
  }

  // Step 8: Instagram
  const igHandle = leadData.instagram || merged.instagram
  if (igHandle) {
    step('instagram').status = 'running'
    notify()
    try {
      const igData = await enrichByInstagram(igHandle)
      if (igData?.profile) {
        const p = igData.profile
        if (p.followers || p.followersCount) merged.instagramFollowers = p.followers || p.followersCount
        merged.instagramIsVerified = p.isVerified || p.verified || false
        merged.instagramIsBusiness = p.isBusinessAccount || false
        if (p.businessCategory || p.category) merged.instagramCategory = p.businessCategory || p.category
        if (p.biography || p.bio) merged.instagramBio = (p.biography || p.bio).slice(0, 500)

        const igInfo = [
          `Instagram: ${p.followers?.toLocaleString() || '?'} seguidores`,
          p.isVerified ? 'Verificado' : null,
          p.isBusinessAccount ? `Conta Business (${p.businessCategory || 'sem categoria'})` : null,
          p.bio ? `Bio: ${p.bio.slice(0, 200)}` : null,
        ].filter(Boolean).join(' | ')
        merged.marketContext = [leadData.marketContext || merged.marketContext, igInfo].filter(Boolean).join('\n\n')
        if (p.website) mergeField('website', p.website)
      }
      step('instagram').status = 'done'
      if (igData?.profile) {
        const followers = igData.profile.followers || igData.profile.followersCount
        const igDetails = [
          followers ? `${followers >= 1000 ? `${(followers / 1000).toFixed(1).replace('.0', '')}k` : followers} seguidores` : null,
          igData.profile.isVerified ? 'Verificado' : null,
          igData.profile.isBusinessAccount ? 'Business' : null,
        ].filter(Boolean)
        if (igDetails.length > 0) step('instagram').detail = igDetails.join(' · ')
      }
    } catch {
      step('instagram').status = 'error'
    }
    notify()
  }

  // Step 9: Website contact crawl
  const websiteUrl = leadData.website || merged.website
  if (websiteUrl) {
    step('website').status = 'running'
    notify()
    try {
      const webData = await enrichByWebsite(websiteUrl)
      if (webData) {
        if (webData.emails.length > 0) {
          newContacts.push({ email: webData.emails[0], source: 'website' })
        }
        if (webData.phones.length > 0) {
          newContacts.push({ whatsapp: formatPhone(webData.phones[0]), source: 'website' })
        }
        if (webData.socials) {
          mergeField('instagram', webData.socials.instagram || webData.socials.Instagram)
          mergeField('linkedin', webData.socials.linkedin || webData.socials.LinkedIn)
          mergeField('facebook', webData.socials.facebook || webData.socials.Facebook)
        }
      }
      step('website').status = 'done'
      if (webData) {
        const webDetails = [
          webData.emails.length > 0 ? `${webData.emails.length} email${webData.emails.length > 1 ? 's' : ''}` : null,
          webData.phones.length > 0 ? `${webData.phones.length} telefone${webData.phones.length > 1 ? 's' : ''}` : null,
          Object.keys(webData.socials || {}).length > 0 ? 'Redes sociais' : null,
        ].filter(Boolean)
        if (webDetails.length > 0) step('website').detail = webDetails.join(' · ')
      }
    } catch {
      step('website').status = 'error'
    }
    notify()
  } else {
    step('website').status = 'skipped'
    notify()
  }

  // Step 10: LinkedIn
  const linkedinUrl = leadData.linkedin || merged.linkedin
  if (linkedinUrl) {
    step('linkedin').status = 'running'
    notify()
    try {
      const liData = await enrichByLinkedIn(linkedinUrl)
      if (liData) {
        mergeField('employees', liData.employees)
        mergeField('businessSummary', liData.businessSummary)
        mergeField('segment', liData.segment)
        if (liData.employees) merged.linkedinEmployeeCount = liData.employees
      }
      step('linkedin').status = 'done'
      if (liData) {
        const liDetails = [
          liData.employees ? `${liData.employees} funcionarios` : null,
          liData.segment ? liData.segment : null,
        ].filter(Boolean)
        if (liDetails.length > 0) step('linkedin').detail = liDetails.join(' · ')
      }
    } catch {
      step('linkedin').status = 'error'
    }
    notify()
  }

  // --- Auto-score SPICED ---
  const spiced = calculateSpicedScore(leadData, merged)

  // --- Save enriched data to Airtable ---
  const updateFields: Partial<Lead> = { ...merged }
  Object.assign(updateFields, spiced)
  updateFields.score = spiced.spicedS + spiced.spicedP + spiced.spicedI + spiced.spicedC + spiced.spicedD
  const successSteps = steps.filter((s) => s.status === 'done').length
  updateFields.enrichmentStatus = successSteps >= 3 ? 'complete' : successSteps > 0 ? 'basic' : 'pending'

  // Build business summary from enrichment sources
  if (!leadData.businessSummary && !merged.businessSummary) {
    const summary = [
      merged.segment || leadData.segment,
      merged.city || leadData.city ? `${merged.city || leadData.city}, ${merged.state || leadData.state}` : null,
      merged.employees ? `~${merged.employees} funcionários` : null,
      merged.yearsInMarket ? `${merged.yearsInMarket} anos no mercado` : null,
    ].filter(Boolean).join(' · ')
    if (summary) updateFields.businessSummary = summary
  }

  try {
    await updateLead(leadId, updateFields)
  } catch {
    // Non-critical — lead was already saved
  }

  // Save discovered contacts
  if (newContacts.length > 0) {
    try {
      const existing = await getContacts(leadId)
      for (const c of newContacts) {
        // Skip duplicates
        const isDup = existing.some((e) =>
          (c.email && e.email === c.email) || (c.whatsapp && e.whatsapp === c.whatsapp),
        )
        if (!isDup && (c.email || c.whatsapp)) {
          await createContact({
            name: c.name || 'Decisor nao identificado',
            role: c.source === 'receita_federal' ? 'Socio/Administrador (RF)' : c.source === 'google_maps' ? 'Telefone comercial' : c.source === 'website' ? 'Contato do site' : c.source === 'vibeprospecting' ? 'Decisor (VibeProspecting)' : `Via ${c.source}`,
            contactType: 'stakeholder',
            whatsapp: c.whatsapp || '',
            email: c.email || '',
            leadId,
          } as any)
        }
      }
    } catch {
      // Non-critical
    }
  }

  // Build enrichment log
  const enrichmentLog = steps.map(s => ({
    source: s.source,
    status: s.status,
    label: s.label,
  }))
  updateFields.enrichmentSources = JSON.stringify(steps.filter(s => s.status === 'done').map(s => s.source))
  updateFields.enrichmentLog = JSON.stringify(enrichmentLog)

  // Persist enrichment log fields to Airtable
  try {
    await updateLead(leadId, { enrichmentSources: updateFields.enrichmentSources, enrichmentLog: updateFields.enrichmentLog })
  } catch {
    // Non-critical
  }

  // Final notification
  steps.forEach((s) => { if (s.status === 'pending') s.status = 'skipped' })
  onProgress?.({
    steps: [...steps],
    currentStep: steps.length,
    totalSteps: steps.length,
    isDone: true,
  })

  return updateFields
}

// --- Utility functions ---

function formatPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length >= 10) return digits.startsWith('55') ? digits : '55' + digits
  return digits
}

function estimateEmployees(porte: string): number {
  const p = porte.toLowerCase()
  if (p.includes('mei') || p.includes('micro')) return 3
  if (p.includes('pequen')) return 15
  if (p.includes('medi') || p.includes('médio')) return 80
  if (p.includes('grand')) return 300
  return 10
}

function yearsSince(dateStr: string): number {
  try {
    const d = new Date(dateStr)
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  } catch {
    return 0
  }
}

function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1
  const editDistance = levenshtein(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}
