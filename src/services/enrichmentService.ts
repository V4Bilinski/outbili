import { updateLead } from './leadService'
import { createContact, getContacts } from './contactService'
import { generateStrategicAnalysis } from './strategicAnalysisService'
import { matchBusiness, matchProspects } from '../lib/vibeprospecting'
import { searchOffice, mapCnpjaToLead, extractPartners } from './cnpjaService'
import { lookupCnpj as assertivaLookupCnpj, getDecisionMakers, extractBestPhone } from './assertivaService'
import { createPartners } from './partnerService'
import { logEnrichmentStep } from './enrichmentLogService'
import type { Lead } from '../types'

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN || ''
const APIFY_API = 'https://api.apify.com/v2'

async function fetchWithRetry(url: string, options?: RequestInit, retries = 1): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok || i === retries) return res
      // Non-OK but retriable (5xx)
      if (res.status >= 500 && i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      return res
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('fetchWithRetry exhausted')
}

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

// --- CNPJa (fonte central unica) ---

async function enrichByCnpj(cnpj: string): Promise<Partial<Lead> & { _partners?: any[]; _cnpjaOffice?: any } | null> {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return null

  try {
    // CNPJa como fonte unica
    const office = await searchOffice(clean)
    const leadFields = mapCnpjaToLead(office)
    const partners = extractPartners(office)

    // Extrair CEP para geolocalização
    const cep = office.address?.zip || ''

    return {
      ...leadFields,
      _cep: cep,
      _partners: partners,
      _cnpjaOffice: office,
    } as any
  } catch (cnpjaError) {
    // Fallback: APIs legadas (serao removidas na Fase 6)
    console.warn('CNPJa falhou, usando fallback legado:', cnpjaError)
    return enrichByCnpjLegacy(clean)
  }
}

// Fallback legado — sera removido na Fase 6 quando n8n assumir
async function enrichByCnpjLegacy(cnpj: string): Promise<Partial<Lead> | null> {
  const clean = cnpj.replace(/\D/g, '')

  // Query ALL 3 APIs in parallel and merge results
  const [openCnpjData, brasilApiData, receitaWsData] = await Promise.all([
    fetchOpenCnpj(clean),
    fetchBrasilApiCnpj(clean),
    fetchReceitaWs(clean),
  ])

  const hasAnyData = brasilApiData || openCnpjData || receitaWsData
  if (hasAnyData) {
    const merged: Partial<Lead> = {}
    // Priority: ReceitaWS > BrasilAPI > OpenCNPJ (ReceitaWS has most complete phone data)
    const sources = [receitaWsData?.lead, brasilApiData, openCnpjData].filter(Boolean) as Partial<Lead>[]
    for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
        if (value && !(merged as any)[key]) {
          ;(merged as any)[key] = value
        }
      }
    }

    // Smart phone extraction: prioritize mobile (WhatsApp) over landline
    if (receitaWsData?.phones?.length) {
      const mobilePhones = receitaWsData.phones.filter(p => classifyPhone(p) === 'mobile')
      const landlinePhones = receitaWsData.phones.filter(p => classifyPhone(p) === 'landline')
      // rfPhone = best phone for WhatsApp (mobile first)
      merged.rfPhone = (mobilePhones[0] || landlinePhones[0] || '').replace(/\D/g, '') || merged.rfPhone
      // Store all phones in businessSummary for reference
      if (mobilePhones.length > 0) {
        const phoneInfo = `WhatsApp provavel: ${mobilePhones.map(p => formatPhone(p)).join(', ')}${landlinePhones.length ? ` | Fixo: ${landlinePhones.map(p => formatPhone(p)).join(', ')}` : ''}`
        merged.businessSummary = merged.businessSummary ? `${merged.businessSummary}\n${phoneInfo}` : phoneInfo
      }
    }

    // Attach decisor name from ReceitaWS if available
    if (receitaWsData?.decisorName && !merged.rfPhone) {
      // No phone but we have the decisor name — useful for contact creation
    }

    // Store _receitaWsDecisor for contact creation later (via any field hack)
    if (receitaWsData?.decisorName) {
      ;(merged as any)._receitaWsDecisor = receitaWsData.decisorName
      ;(merged as any)._receitaWsPhones = receitaWsData.phones
    }

    return merged
  }

  // Fallback: Apify actor
  const items = await runActor('viralanalyzer/cnpj-enricher', { cnpjs: [clean] })
  if (!items?.length) return null
  const d = items[0]
  const apifySocios = d.qsa || []
  return {
    tradeName: d.nome_fantasia || d.tradeName || undefined,
    segment: d.cnae_fiscal_descricao || d.segment || undefined,
    address: [d.logradouro, d.numero, d.bairro].filter(Boolean).join(', ') || undefined,
    city: d.municipio || d.city || undefined,
    state: d.uf || d.state || undefined,
    employees: d.porte ? estimateEmployees(d.porte) : undefined,
    yearsInMarket: d.data_inicio_atividade ? yearsSince(d.data_inicio_atividade) : undefined,
    capitalSocial: d.capital_social ? Number(d.capital_social) : undefined,
    registrationStatus: d.descricao_situacao_cadastral || undefined,
    foundingDate: d.data_inicio_atividade || undefined,
    cnaePrimary: d.cnae_fiscal_descricao || undefined,
    partners: apifySocios.length ? JSON.stringify(apifySocios.map((s: any) => ({
      nome: s.nome_socio || s.nome,
      qualificacao: s.qual_socio || s.qualificacao_socio || 'Sócio',
    }))) : undefined,
    rfEmail: d.email || undefined,
    rfPhone: d.telefone ? String(d.telefone).replace(/\D/g, '') : undefined,
  }
}

async function fetchOpenCnpj(cnpj: string): Promise<Partial<Lead> | null> {
  try {
    const res = await fetchWithRetry(`https://api.opencnpj.org/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()
    return parseCnpjResponse(d)
  } catch { return null }
}

async function fetchBrasilApiCnpj(cnpj: string): Promise<Partial<Lead> | null> {
  try {
    const res = await fetchWithRetry(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()
    return parseCnpjResponse(d)
  } catch { return null }
}

// --- ReceitaWS (returns multiple phones including mobile/WhatsApp) ---
async function fetchReceitaWs(cnpj: string): Promise<{ lead: Partial<Lead>; phones: string[]; decisorName?: string } | null> {
  try {
    const res = await fetchWithRetry(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()
    if (d.status === 'ERROR') return null

    // Extract ALL phones (ReceitaWS returns "tel1 / tel2" format)
    const rawPhones = (d.telefone || '').split(/[\/;,]/).map((p: string) => p.trim()).filter(Boolean)
    const phones = rawPhones.map((p: string) => p.replace(/\D/g, '')).filter((p: string) => p.length >= 10)

    // Find the decisor (admin partner)
    const socios = d.qsa || []
    const decisor = socios.find((s: any) =>
      s.qual?.toLowerCase().includes('administrador') ||
      s.qual?.toLowerCase().includes('diretor') ||
      s.qual?.toLowerCase().includes('presidente')
    ) || socios[0]

    return {
      lead: parseCnpjResponse({
        ...d,
        razao_social: d.nome,
        nome_fantasia: d.fantasia,
        cnae_fiscal_descricao: d.atividade_principal?.[0]?.text,
        atividade_principal: d.atividade_principal,
        atividades_secundarias: d.atividades_secundarias,
        descricao_situacao_cadastral: d.situacao,
        data_inicio_atividade: d.abertura,
        descricao_porte: d.porte,
        natureza_juridica: d.natureza_juridica,
        capital_social: d.capital_social ? Number(String(d.capital_social).replace(/\D/g, '')) / 100 : undefined,
        qsa: socios.map((s: any) => ({ nome_socio: s.nome, qualificacao_socio: s.qual })),
        email: d.email,
        correio_eletronico: d.email,
        logradouro: d.logradouro,
        numero: d.numero,
        complemento: d.complemento,
        bairro: d.bairro,
        municipio: d.municipio,
        uf: d.uf,
        cep: d.cep,
      }),
      phones,
      decisorName: decisor?.nome,
    }
  } catch { return null }
}

// Classify phone: mobile (starts with 9 after DDD) = likely WhatsApp
export function classifyPhone(phone: string): 'mobile' | 'landline' {
  const digits = phone.replace(/\D/g, '')
  const withoutCountry = digits.startsWith('55') ? digits.slice(2) : digits
  // Brazilian mobile formats:
  // New: DDD (2) + 9 + 8 digits = 11 total (e.g., 11999887766)
  // Old: DDD (2) + 8 digits starting with 9 = 10 total (e.g., 6199921313)
  if (withoutCountry.length === 11 && withoutCountry[2] === '9') return 'mobile'
  if (withoutCountry.length === 10 && withoutCountry[2] === '9') return 'mobile'
  return 'landline'
}

export function parseCnpjResponse(d: any): Partial<Lead> {
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
    const res = await fetchWithRetry(`https://open.cnpja.com/office/${cnpj}`)
    if (!res.ok) return null
    const d = await res.json()

    let taxRegime = 'nao_optante'
    if (d.company?.simples?.optant === true) taxRegime = 'simples'
    if (d.company?.simples?.mei === true || d.company?.simei?.optant === true) taxRegime = 'mei'
    if (d.company?.naturezaJuridica?.id && String(d.company.naturezaJuridica.id).startsWith('2')) taxRegime = 'lucro_presumido'

    return {
      taxRegime: taxRegime as Lead['taxRegime'],
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
    const res = await fetchWithRetry(`https://brasilapi.com.br/api/cep/v2/${clean}`)
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
    const res = await fetchWithRetry(`https://brasilapi.com.br/api/registrobr/v1/${match[0]}`)
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

// --- INPI: Busca de marcas registradas por CNPJ ---

async function enrichByInpi(cnpj: string, companyName: string): Promise<Partial<Lead> | null> {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return null

  // Strategy 1: Google Search for INPI records (fast, free)
  const items = await runActor('apify/google-search-scraper', {
    queries: `site:busca.inpi.gov.br "${clean}" OR site:busca.inpi.gov.br "${companyName}" marca`,
    countryCode: 'br',
    languageCode: 'pt-BR',
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
  }, 60_000)

  const trademarks: Array<{ marca: string; numero?: string; status?: string; classe?: string; fonte: string }> = []

  if (items?.length) {
    const results = items[0]?.organicResults || items
    for (const r of results) {
      const title = r.title || ''
      const desc = r.description || ''
      const text = `${title} ${desc}`

      // Extract trademark info from search results
      if (text.toLowerCase().includes('marca') || text.toLowerCase().includes('inpi') || text.toLowerCase().includes('registro')) {
        // Try to extract processo number (format: BR XXXXXXX or numbers)
        const numMatch = text.match(/\b(\d{7,12})\b/)
        // Try to extract status
        const statusKeywords = ['deferido', 'indeferido', 'arquivado', 'vigente', 'registrado', 'publicado', 'em andamento']
        const foundStatus = statusKeywords.find(kw => text.toLowerCase().includes(kw))
        // Try to extract classe Nice
        const classeMatch = text.match(/(?:classe|NCL)\s*(\d{1,2})/i)

        if (title && !title.includes('Busca') && !title.includes('INPI -')) {
          trademarks.push({
            marca: title.replace(/\s*[-–|].*$/, '').trim().slice(0, 100),
            numero: numMatch?.[1] || undefined,
            status: foundStatus || undefined,
            classe: classeMatch?.[1] || undefined,
            fonte: 'google_inpi',
          })
        }
      }
    }
  }

  // Strategy 2: Web scraper on busca.inpi.gov.br (if Google didn't find enough)
  if (trademarks.length === 0) {
    try {
      const webItems = await runActor('apify/web-scraper', {
        startUrls: [{
          url: `https://busca.inpi.gov.br/pePI/servlet/MarcaServletController?Action=getResult&CodPedido=&CodTipo=&PalavraChave=&Titular=${clean}&NrProcDe=&NrProcAte=&DtDepDe=&DtDepAte=&DtPubDe=&DtPubAte=&DtRegDe=&DtRegAte=&CodDespacho=&CodNcl=&CodNat=&CodPresApworking=&CodPresApre=&CodSitReq=&Ession=`,
        }],
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          await page.waitForSelector('table', { timeout: 10000 }).catch(() => null);
          const rows = await page.$$eval('table tr', trs => {
            return trs.slice(1).map(tr => {
              const tds = tr.querySelectorAll('td');
              return {
                numero: tds[0]?.textContent?.trim() || '',
                marca: tds[1]?.textContent?.trim() || '',
                ncl: tds[2]?.textContent?.trim() || '',
                titular: tds[3]?.textContent?.trim() || '',
                situacao: tds[4]?.textContent?.trim() || '',
              };
            }).filter(r => r.marca);
          });
          return rows;
        }`,
        proxyConfiguration: { useApifyProxy: true },
      }, 90_000)

      if (webItems?.length) {
        for (const item of webItems) {
          // webItems can be nested arrays from web-scraper
          const rows = Array.isArray(item) ? item : [item]
          for (const row of rows) {
            if (row.marca) {
              trademarks.push({
                marca: row.marca,
                numero: row.numero || undefined,
                status: row.situacao || undefined,
                classe: row.ncl || undefined,
                fonte: 'inpi_direto',
              })
            }
          }
        }
      }
    } catch { /* non-critical, Google search may have been enough */ }
  }

  if (trademarks.length === 0) return null

  // Deduplicate by marca name
  const unique = trademarks.filter((t, i, arr) =>
    arr.findIndex(x => x.marca.toLowerCase() === t.marca.toLowerCase()) === i
  ).slice(0, 10)

  const hasRegistered = unique.some(t =>
    t.status?.toLowerCase().includes('registrad') ||
    t.status?.toLowerCase().includes('deferid') ||
    t.status?.toLowerCase().includes('vigente')
  )

  return {
    inpiTrademarks: JSON.stringify(unique),
    inpiTrademarkCount: unique.length,
    inpiHasRegisteredTrademark: hasRegistered,
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

// --- Apify RAG Web Browser (deep research on company) ---
async function enrichByRagBrowser(companyName: string, cnpj?: string, city?: string): Promise<Partial<Lead> & { phones: string[]; emails: string[] } | null> {
  const query = cnpj
    ? `"${companyName}" CNPJ ${cnpj} telefone whatsapp email contato`
    : `"${companyName}" ${city || 'Brasil'} telefone whatsapp email contato dono proprietario`

  const items = await runActor('apify/rag-web-browser', {
    query,
    maxResults: 5,
  }, 90_000)
  if (!items?.length) return null

  const phones: string[] = []
  const emails: string[] = []
  const enriched: Partial<Lead> = {}

  for (const item of items) {
    const text = (item.text || item.markdown || item.content || '').slice(0, 5000)

    // Extract phones from RAG results
    const phoneMatches = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9?\s?\d{4}[\s-]?\d{4})/g)
    if (phoneMatches) {
      for (const p of phoneMatches) {
        const digits = p.replace(/\D/g, '')
        if (digits.length >= 10 && digits.length <= 13 && !phones.includes(digits)) {
          phones.push(digits)
        }
      }
    }

    // Extract emails
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatches) {
      for (const e of emailMatches) {
        if (!emails.includes(e.toLowerCase())) emails.push(e.toLowerCase())
      }
    }

    // Extract website
    if (!enriched.website) {
      const urlMatch = text.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/i)
      if (urlMatch && !urlMatch[0].includes('google') && !urlMatch[0].includes('facebook') && !urlMatch[0].includes('instagram')) {
        enriched.website = urlMatch[0]
      }
    }

    // Extract Instagram
    if (!enriched.instagram) {
      const igMatch = text.match(/instagram\.com\/([a-zA-Z0-9._]+)/i)
      if (igMatch) enriched.instagram = `https://instagram.com/${igMatch[1]}`
    }

    // Extract LinkedIn
    if (!enriched.linkedin) {
      const liMatch = text.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)/i)
      if (liMatch) enriched.linkedin = `https://linkedin.com/company/${liMatch[1]}`
    }
  }

  return { ...enriched, phones, emails }
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

// --- Targeted Google Search (find specific URLs) ---

async function findUrlViaGoogle(query: string, urlPattern: string): Promise<string | null> {
  const items = await runActor('apify/google-search-scraper', {
    queries: query,
    countryCode: 'br',
    languageCode: 'pt-BR',
    maxPagesPerQuery: 1,
    resultsPerPage: 5,
  }, 60_000)
  if (!items?.length) return null

  const results = items[0]?.organicResults || items
  for (const r of results) {
    const url = r.url || r.link || ''
    if (url.includes(urlPattern)) return url
  }
  return null
}

// --- Active CEO/Founder contact search ---

async function searchDecisionMakerContact(
  companyName: string,
  decisionMakerName?: string,
  city?: string,
): Promise<Array<{ name?: string; whatsapp?: string; email?: string; source: string }>> {
  const contacts: Array<{ name?: string; whatsapp?: string; email?: string; source: string }> = []

  // 1. Google search for CEO contact info
  const personQuery = decisionMakerName
    ? `"${decisionMakerName}" "${companyName}" telefone WhatsApp contato`
    : `"${companyName}" CEO fundador proprietario telefone WhatsApp contato ${city || ''}`

  const items = await runActor('apify/google-search-scraper', {
    queries: personQuery,
    countryCode: 'br',
    languageCode: 'pt-BR',
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
  }, 60_000)

  if (items?.length) {
    const results = items[0]?.organicResults || items
    for (const r of results) {
      const text = `${r.title || ''} ${r.description || ''}`
      // Extract phone numbers from search results
      const phoneMatches = text.match(/\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g)
      if (phoneMatches) {
        for (const phone of phoneMatches.slice(0, 2)) {
          const digits = phone.replace(/\D/g, '')
          if (digits.length >= 10 && digits.length <= 11) {
            contacts.push({
              name: decisionMakerName || undefined,
              whatsapp: formatPhone(digits),
              source: 'google_search_decisor',
            })
          }
        }
      }
      // Extract emails
      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
      if (emailMatches) {
        for (const email of emailMatches.slice(0, 2)) {
          if (!email.includes('example') && !email.includes('sentry') && !email.includes('google')) {
            contacts.push({
              name: decisionMakerName || undefined,
              email,
              source: 'google_search_decisor',
            })
          }
        }
      }
    }

    // Also check if any result links to a LinkedIn profile of the decision maker
    for (const r of results) {
      const url = r.url || r.link || ''
      if (url.includes('linkedin.com/in/') && decisionMakerName) {
        // Found decision maker's LinkedIn profile — try to scrape it
        try {
          const profileItems = await runActor('harvestapi/linkedin-profile-scraper', {
            profileUrls: [url],
          }, 60_000)
          if (profileItems?.length) {
            const p = profileItems[0]
            if (p.email) contacts.push({ name: decisionMakerName, email: p.email, source: 'linkedin_profile' })
            if (p.phone || p.phoneNumber) contacts.push({ name: decisionMakerName, whatsapp: formatPhone(p.phone || p.phoneNumber), source: 'linkedin_profile' })
          }
        } catch { /* non-critical */ }
        break // Only try first LinkedIn profile
      }
    }
  }

  return contacts
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

// --- Fallback: Search Instagram by company name using Apify ---
async function searchInstagramByName(companyName: string, city?: string): Promise<string | null> {
  const query = city ? `${companyName} ${city}` : companyName
  const items = await runActor('apify/instagram-profile-scraper', {
    search: query,
    searchType: 'user',
    resultsLimit: 5,
  }, 90_000)
  if (!items?.length) return null

  // Find best match by comparing name/username with company name
  const nameLower = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const p of items) {
    const username = (p.username || '').toLowerCase()
    const fullName = (p.fullName || p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (username.includes(nameLower) || nameLower.includes(username) || fullName.includes(nameLower) || nameLower.includes(fullName)) {
      return `https://instagram.com/${p.username}`
    }
  }
  // If no exact match, return first business account
  const business = items.find((p: any) => p.isBusinessAccount)
  if (business) return `https://instagram.com/${business.username}`

  return items[0]?.username ? `https://instagram.com/${items[0].username}` : null
}

// --- Fallback: Search LinkedIn company by name using Google ---
async function searchLinkedInByName(companyName: string, city?: string): Promise<string | null> {
  const query = city
    ? `"${companyName}" "${city}" linkedin.com/company`
    : `"${companyName}" linkedin.com/company`
  const items = await runActor('apify/google-search-scraper', {
    queries: query,
    countryCode: 'br',
    languageCode: 'pt-BR',
    maxPagesPerQuery: 1,
    resultsPerPage: 10,
  }, 60_000)
  if (!items?.length) return null

  const results = items[0]?.organicResults || items
  for (const r of results) {
    const url = r.url || r.link || ''
    if (url.includes('linkedin.com/company/')) return url
  }
  return null
}

// --- Fallback: Search website using RAG Web Browser ---
async function searchWebsiteByName(companyName: string, city?: string): Promise<string | null> {
  const query = city ? `${companyName} ${city} site oficial` : `${companyName} site oficial`
  const items = await runActor('apify/rag-web-browser', {
    query,
    maxResults: 5,
  }, 60_000)
  if (!items?.length) return null

  for (const r of items) {
    const url = r.url || r.link || ''
    if (url && !url.includes('facebook.com') && !url.includes('instagram.com') && !url.includes('linkedin.com') && !url.includes('google.com') && !url.includes('youtube.com') && !url.includes('reclameaqui')) {
      return url
    }
  }
  return null
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
  estimatedMs?: number
}

export type EnrichmentProgress = {
  steps: EnrichmentStep[]
  currentStep: number
  totalSteps: number
  isDone: boolean
}

function calculateSpicedScore(leadData: Partial<Lead>, merged: Partial<Lead>): { spicedS: number; spicedP: number; spicedI: number; spicedC: number; spicedD: number } {
  const data = { ...leadData, ...merged }

  // Fallback: calcular yearsInMarket a partir de foundingDate
  const yearsInMarket = data.yearsInMarket
    ?? (data.foundingDate
      ? Math.floor((Date.now() - new Date(data.foundingDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined)

  // S (Situation) — porte e contexto
  let spicedS = 1
  if (data.employees && data.employees > 5) spicedS++
  if (data.employees && data.employees > 20) spicedS++
  if (yearsInMarket && yearsInMarket > 3) spicedS++
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
  if (revenue > 0) {
    if (revenue >= 100000) spicedI++
    if (revenue >= 200000) spicedI++
    if (revenue >= 500000) spicedI++
  } else if (data.capitalSocial) {
    // Fallback: capitalSocial como proxy de porte/potencial
    if (data.capitalSocial >= 50000) spicedI++
    if (data.capitalSocial >= 200000) spicedI++
    if (data.capitalSocial >= 500000) spicedI++
  }
  if (data.instagramFollowers && data.instagramFollowers > 1000) spicedI++
  // Bonus: regime tributário indica porte real
  if (data.taxRegime === 'lucro_presumido' || data.taxRegime === 'lucro_real') spicedI++

  // C (Critical Event) — urgência
  let spicedC = 1
  if (yearsInMarket !== undefined && yearsInMarket < 2) spicedC += 2
  if (data.enrichmentStatus === 'complete') spicedC++
  if (data.googleRating !== undefined && data.googleRating >= 4.5) spicedC++
  // Bonus: empresa recém-cadastrada = momento de decisão
  if (data.registrationStatus === 'Ativa' && yearsInMarket && yearsInMarket < 1) spicedC++

  // D (Decision) — acesso ao decisor
  let spicedD = 1
  if (data.cnpj) spicedD++
  if (data.linkedin) spicedD++
  if (data.website) spicedD++
  // Bonus: temos sócios identificados da RF
  if (data.partners) spicedD++
  if (data.rfEmail || data.rfPhone) spicedD++

  // Bonus INPI: empresa com marca registrada = mais consolidada e investidora
  if (data.inpiHasRegisteredTrademark) { spicedS++; spicedI++ }
  if (data.inpiTrademarkCount && data.inpiTrademarkCount >= 3) spicedS++

  // Cap all scores at 5
  const cap = (n: number) => Math.min(5, Math.max(1, n))
  return { spicedS: cap(spicedS), spicedP: cap(spicedP), spicedI: cap(spicedI), spicedC: cap(spicedC), spicedD: cap(spicedD) }
}

export async function enrichLead(
  leadId: string,
  leadData: Partial<Lead>,
  onProgress?: (progress: EnrichmentProgress) => void,
): Promise<Partial<Lead>> {
  // Smart skip: if lead was already enriched, skip steps that have data
  const alreadyEnriched = leadData.enrichmentStatus === 'complete' || leadData.enrichmentStatus === 'assertiva' || leadData.enrichmentStatus === 'cnpja'
  const hasGeo = !!(leadData.city && leadData.state)
  const hasGoogleData = !!(leadData.googleRating || leadData.googleReviewsCount)
  const hasWebsite = !!leadData.website
  const hasInstagramData = !!(leadData.instagramFollowers || leadData.instagramBio)
  const hasLinkedinData = !!(leadData.linkedinEmployeeCount || leadData.businessSummary)

  const steps: EnrichmentStep[] = [
    { source: 'cnpj', status: !leadData.cnpj ? 'skipped' : (alreadyEnriched && leadData.tradeName) ? 'skipped' : 'pending', label: 'CNPJa (dados cadastrais)', estimatedMs: 3000 },
    { source: 'assertiva', status: !leadData.cnpj ? 'skipped' : 'pending', label: 'Assertiva (telefones + decisores)', estimatedMs: 5000 },
    { source: 'tax_regime', status: 'skipped', label: 'Regime Tributario (via CNPJa)', estimatedMs: 0 },
    { source: 'geolocation', status: (alreadyEnriched && hasGeo) ? 'skipped' : 'pending', label: 'Geolocalização (CEP)', estimatedMs: 2000 },
    { source: 'domain_check', status: (alreadyEnriched && hasWebsite) ? 'skipped' : 'pending', label: 'Domínio .br (Registro.br)', estimatedMs: 2000 },
    { source: 'google_search', status: (alreadyEnriched && hasWebsite) ? 'skipped' : 'pending', label: 'Pesquisa Google', estimatedMs: 30000 },
    { source: 'rag_browser', status: 'pending', label: 'RAG Web Browser (pesquisa profunda)', estimatedMs: 60000 },
    { source: 'google_maps', status: (alreadyEnriched && hasGoogleData) ? 'skipped' : 'pending', label: 'Google Maps / Perfil Comercial', estimatedMs: 30000 },
    { source: 'vibeprospecting', status: 'pending', label: 'VibeProspecting (contatos)', estimatedMs: 15000 },
    { source: 'instagram', status: (alreadyEnriched && hasInstagramData) ? 'skipped' : 'pending', label: 'Instagram', estimatedMs: 25000 },
    { source: 'website', status: (alreadyEnriched && hasWebsite) ? 'skipped' : 'pending', label: 'Website (contatos)', estimatedMs: 30000 },
    { source: 'linkedin', status: (alreadyEnriched && hasLinkedinData) ? 'skipped' : 'pending', label: 'LinkedIn', estimatedMs: 25000 },
    { source: 'decisor', status: 'pending', label: 'Contato do Decisor (CEO/Fundador)', estimatedMs: 30000 },
    { source: 'inpi', status: !leadData.cnpj ? 'skipped' : 'pending', label: 'INPI (Marcas e Patentes)', estimatedMs: 30000 },
    { source: 'strategic', status: 'pending', label: 'Análise Estratégica Personalizada', estimatedMs: 500 },
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

  // Classify a URL to the correct field (website vs instagram vs linkedin vs facebook)
  const classifyUrl = (url: string): { field: keyof Lead; value: string } | null => {
    if (!url) return null
    const lower = url.toLowerCase()
    if (lower.includes('instagram.com') || lower.includes('instagr.am')) return { field: 'instagram', value: url }
    if (lower.includes('linkedin.com')) return { field: 'linkedin', value: url }
    if (lower.includes('facebook.com') || lower.includes('fb.com')) return { field: 'facebook', value: url }
    if (lower.includes('linktr.ee') || lower.includes('linklist.bio') || lower.includes('links.') || lower.includes('bio/')) return { field: 'website', value: url }
    return { field: 'website', value: url }
  }

  // Helper to merge without overwriting existing user data
  // Automatically classifies URLs to the correct field
  const mergeField = (key: keyof Lead, value: any) => {
    if (!value) return
    // If writing to website, classify the URL first
    if (key === 'website' && typeof value === 'string') {
      const classified = classifyUrl(value)
      if (classified && classified.field !== 'website') {
        // URL belongs to a social field, not website
        if (!leadData[classified.field] && !(merged as any)[classified.field]) {
          ;(merged as any)[classified.field] = classified.value
        }
        return
      }
    }
    if (!leadData[key] && !(merged as any)[key]) {
      ;(merged as any)[key] = value
    }
  }

  // ========== FASE 1: CNPJa (fonte central unica) ==========

  // Step 1: CNPJa — dados cadastrais + socios + CNAE + endereço
  let cnpjCep = ''
  if (leadData.cnpj) {
    step('cnpj').status = 'running'
    notify()
    try {
      const cnpjData = await enrichByCnpj(leadData.cnpj)
      if (cnpjData) {
        // Merge todos os campos CNPJa
        const cnpjaFields: (keyof Lead)[] = [
          'tradeName', 'companyName', 'segment', 'address', 'city', 'state',
          'employees', 'yearsInMarket', 'capitalSocial', 'legalNature',
          'registrationStatus', 'foundingDate', 'cnaePrimary', 'cnaeSecondary',
          'rfEmail', 'rfPhone', 'taxRegime', 'zipCode', 'district',
          'municipalityCode', 'phoneType', 'simplesOptant', 'simplesSince',
          'isHeadquarters', 'cnpjaLastUpdate', 'statusDate', 'emailDomain',
        ]
        for (const key of cnpjaFields) {
          mergeField(key, (cnpjData as any)[key])
        }

        cnpjCep = (cnpjData as any)._cep || (cnpjData as any).zipCode || ''

        // Criar Partners na tabela relacional (se CNPJa retornou socios)
        const partnersData = (cnpjData as any)._partners
        if (partnersData?.length) {
          try {
            await createPartners(leadId, partnersData)
          } catch { /* silencioso — partners sao complementares */ }
        }

        // Contato do decisor via CNPJa (RF)
        const rfDecisionMaker = extractDecisionMaker(cnpjData.partners)
        const decisorName = rfDecisionMaker?.nome
        if (decisorName && cnpjData.rfPhone) {
          newContacts.push({
            name: decisorName,
            whatsapp: formatPhone(cnpjData.rfPhone),
            source: 'cnpja',
          })
        }
        if (cnpjData.rfEmail && cnpjData.rfEmail.includes('@') && decisorName) {
          newContacts.push({ name: decisorName, email: cnpjData.rfEmail, source: 'cnpja' })
        }

        // Log no EnrichmentLog
        const partnerCount = partnersData?.length || 0
        const cnpjDetails = [
          cnpjData.companyName ? 'Razao social' : null,
          partnerCount > 0 ? `${partnerCount} socio${partnerCount > 1 ? 's' : ''}` : null,
          cnpjData.capitalSocial ? `Capital R$ ${Number(cnpjData.capitalSocial).toLocaleString('pt-BR')}` : null,
          cnpjData.cnaePrimary ? 'CNAE' : null,
        ].filter(Boolean)
        step('cnpj').detail = cnpjDetails.join(' + ')
        await logEnrichmentStep(leadId, 'cnpja', 'done', step('cnpj').detail || 'OK').catch(() => {})
      }
      step('cnpj').status = 'done'
    } catch {
      step('cnpj').status = 'error'
      await logEnrichmentStep(leadId, 'cnpja', 'error', 'Falha na consulta CNPJa').catch(() => {})
    }
    notify()
  }

  // Step 1b: Assertiva Localize — telefones, emails, decisores com WhatsApp confirmado
  if (leadData.cnpj) {
    step('assertiva').status = 'running'
    notify()
    try {
      // Consulta CNPJ no Assertiva
      const assertivaData = await assertivaLookupCnpj(leadData.cnpj) as any
      if (assertivaData?.telefones?.length) {
        const bestPhone = extractBestPhone(assertivaData.telefones)
        if (bestPhone.whatsapp) {
          merged.rfPhone = bestPhone.whatsapp
          ;(merged as any).phoneType = 'MOBILE'
        }
      }

      // Mapear dados cadastrais da Assertiva (campos antes ignorados)
      // Assertiva _quantidadeFuncionarios SEMPRE sobrescreve estimate do CNPJa (dado real RAIS/CAGED)
      if (assertivaData?._quantidadeFuncionarios) {
        merged.employees = Number(assertivaData._quantidadeFuncionarios)
      }
      if (assertivaData?._cnaeDescricao && !merged.segment) {
        merged.segment = assertivaData._cnaeDescricao
      }
      if (assertivaData?._cnaeDescricao && !merged.cnaePrimary) {
        merged.cnaePrimary = assertivaData._cnaeDescricao
      }
      if (assertivaData?._site && !merged.website) {
        merged.website = assertivaData._site.startsWith('http')
          ? assertivaData._site
          : `https://${assertivaData._site}`
      }

      // Redes sociais da Assertiva (Instagram, Facebook, LinkedIn)
      if (assertivaData?._redesSociais) {
        if (assertivaData._redesSociais.instagram && !merged.instagram) {
          merged.instagram = assertivaData._redesSociais.instagram
        }
        if (assertivaData._redesSociais.facebook && !merged.facebook) {
          merged.facebook = assertivaData._redesSociais.facebook
        }
        if (assertivaData._redesSociais.linkedin && !merged.linkedin) {
          merged.linkedin = assertivaData._redesSociais.linkedin
        }
        merged.assertivaSocialMedia = JSON.stringify(assertivaData._redesSociais)
      }

      // Faturamento presumido da Assertiva (substitui estimativa por dados reais)
      if (assertivaData?._faturamentoPresumido && !merged.monthlyRevenue) {
        merged.monthlyRevenue = Number(assertivaData._faturamentoPresumido)
      }

      // Score de crédito da Assertiva
      if (assertivaData?._scoreCredito) {
        merged.assertivaCreditScore = Number(assertivaData._scoreCredito)
      }

      // Renda presumida da Assertiva
      if (assertivaData?._rendaPresumida) {
        merged.assertivaIncomeEstimate = Number(assertivaData._rendaPresumida)
      }

      // Buscar decisores via Assertiva (requer protocolo da consulta CNPJ)
      const protocolo = assertivaData?._protocolo
      const decisores = await getDecisionMakers(leadData.cnpj, protocolo)
      for (const decisor of decisores) {
        const phones = extractBestPhone(decisor.telefones || [])
        newContacts.push({
          name: decisor.nome,
          whatsapp: phones.whatsapp,
          email: decisor.emails?.[0]?.endereco,
          source: 'assertiva',
        })
      }

      const assertivaDetails = [
        assertivaData?.telefones?.length ? `${assertivaData.telefones.length} tel` : null,
        decisores.length ? `${decisores.length} decisor${decisores.length > 1 ? 'es' : ''}` : null,
        assertivaData?._quantidadeFuncionarios ? `${assertivaData._quantidadeFuncionarios} func` : null,
        assertivaData?._cnaeDescricao ? 'CNAE' : null,
        assertivaData?._redesSociais ? 'redes sociais' : null,
        assertivaData?._faturamentoPresumido ? `faturamento R$ ${assertivaData._faturamentoPresumido}` : null,
        assertivaData?._scoreCredito ? `score ${assertivaData._scoreCredito}` : null,
      ].filter(Boolean)
      step('assertiva').detail = assertivaDetails.join(' + ') || 'Sem dados'
      step('assertiva').status = 'done'
      merged.enrichmentStatus = 'assertiva' as any
      await logEnrichmentStep(leadId, 'assertiva', 'done', step('assertiva').detail || 'OK').catch(() => {})
    } catch {
      step('assertiva').status = 'error'
      await logEnrichmentStep(leadId, 'assertiva', 'error', 'Falha ou endpoint indisponivel').catch(() => {})
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
        const regimeLabels: Record<string, string> = { simples: 'Simples Nacional', mei: 'MEI', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real', nao_optante: 'Não optante' }
        step('tax_regime').detail = regimeLabels[taxData.taxRegime] || taxData.taxRegime
      }
    } catch {
      step('tax_regime').status = 'error'
    }
    notify()
  }

  // Step 3: Geolocalização — CNPJ obrigatório garante CEP disponível
  // Strategy: CEP (BrasilAPI) → Fallback 1 (ViaCEP) → Fallback 2 (Nominatim cidade+estado)
  {
    step('geolocation').status = 'running'
    notify()

    // CEP primário vem do CNPJ (sempre disponível pois CNPJ é obrigatório)
    let cepToLookup = cnpjCep || ''
    // Fallback: extrair CEP do endereço se CNPJ não retornou
    if (!cepToLookup) {
      const addressField = merged.address || leadData.address || ''
      const cepMatch = addressField.match(/\d{5}-?\d{3}/)
      if (cepMatch) cepToLookup = cepMatch[0]
    }

    let geoResolved = false

    // Primary: BrasilAPI CEP v2 (lat/long inclusos)
    if (cepToLookup) {
      try {
        const geoData = await fetchGeoFromCep(cepToLookup)
        if (geoData) {
          mergeField('city', geoData.city)
          mergeField('state', geoData.state)
          if (geoData.address) mergeField('address', geoData.address)
          if (geoData.latitude) merged.latitude = geoData.latitude
          if (geoData.longitude) merged.longitude = geoData.longitude
          geoResolved = true
          step('geolocation').status = 'done'
          step('geolocation').detail = geoData.latitude
            ? `${geoData.city || ''} · lat/long via BrasilAPI`
            : `${geoData.city || ''} · sem coordenadas`
        }
      } catch { /* fallback below */ }
    }

    // Fallback 1: ViaCEP (API pública gratuita, sem lat/long mas confirma cidade/estado)
    if (!geoResolved && cepToLookup) {
      try {
        const cleanCep = cepToLookup.replace(/\D/g, '')
        const res = await fetchWithRetry(`https://viacep.com.br/ws/${cleanCep}/json/`)
        if (res.ok) {
          const d = await res.json()
          if (!d.erro) {
            mergeField('city', d.localidade)
            mergeField('state', d.uf)
            if (d.logradouro) mergeField('address', [d.logradouro, d.bairro].filter(Boolean).join(', '))
            geoResolved = true
            step('geolocation').detail = `${d.localidade || ''}, ${d.uf || ''} · via ViaCEP (sem coordenadas)`
          }
        }
      } catch { /* fallback below */ }
    }

    // Fallback 2: Nominatim geocode por cidade + estado (lat/long estimados)
    if (!geoResolved) {
      const geoCity = merged.city || leadData.city
      const geoState = merged.state || leadData.state
      if (geoCity && geoState) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(geoCity)}&state=${encodeURIComponent(geoState)}&country=Brazil&format=json&limit=1`, {
            headers: { 'User-Agent': 'Outbili/1.0' },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.length > 0) {
              merged.latitude = parseFloat(data[0].lat)
              merged.longitude = parseFloat(data[0].lon)
              geoResolved = true
              step('geolocation').detail = `${geoCity}, ${geoState} · lat/long via Nominatim`
            }
          }
        } catch { /* all fallbacks exhausted */ }
      }
    }

    step('geolocation').status = geoResolved ? 'done' : 'error'
    if (!geoResolved) step('geolocation').detail = 'Nenhuma API de geo retornou dados'
    notify()
  }

  // Step 4: Verificação de domínio .br (Registro.br)
  const websiteForDomain = leadData.website || merged.website || ''
  const isBrDomain = websiteForDomain.includes('.br')
  if (websiteForDomain && isBrDomain) {
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
  } else if (websiteForDomain) {
    step('domain_check').status = 'skipped'
    step('domain_check').detail = 'Apenas dominios .br'
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

  // Step 6: RAG Web Browser (deep research — phones, emails, socials)
  step('rag_browser').status = 'running'
  notify()
  try {
    const ragData = await enrichByRagBrowser(
      leadData.companyName || '',
      leadData.cnpj?.replace(/\D/g, ''),
      leadData.city || merged.city,
    )
    if (ragData) {
      mergeField('website', ragData.website)
      mergeField('instagram', ragData.instagram)
      mergeField('linkedin', ragData.linkedin)

      // Add discovered phones as contacts (prioritize mobile/WhatsApp)
      const ragMobiles = ragData.phones.filter(p => classifyPhone(p) === 'mobile')
      const ragLandlines = ragData.phones.filter(p => classifyPhone(p) === 'landline')
      for (const phone of [...ragMobiles, ...ragLandlines].slice(0, 3)) {
        newContacts.push({
          whatsapp: formatPhone(phone),
          source: 'rag_web_browser',
        })
      }
      for (const email of ragData.emails.slice(0, 2)) {
        newContacts.push({ email, source: 'rag_web_browser' })
      }
    }
    step('rag_browser').status = 'done'
    if (ragData) {
      const ragDetails = [
        ragData.phones.length > 0 ? `${ragData.phones.length} tel` : null,
        ragData.emails.length > 0 ? `${ragData.emails.length} email` : null,
        ragData.website ? 'Website' : null,
        ragData.instagram ? 'Instagram' : null,
      ].filter(Boolean)
      if (ragDetails.length > 0) step('rag_browser').detail = ragDetails.join(' · ')
    }
  } catch {
    step('rag_browser').status = 'error'
  }
  notify()

  // Step 7: Google Maps / Business Profile
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

  // Step 7: VibeProspecting — sempre buscar contatos de decisores
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

  // Step 8: Instagram — busca ativa com multiplas estrategias
  let igHandle = leadData.instagram || merged.instagram
  if (!igHandle) {
    step('instagram').status = 'running'
    step('instagram').detail = 'Buscando perfil via Google...'
    notify()
    const igCity = leadData.city || merged.city || ''

    // Strategy 1: Google site search
    try {
      const foundIgUrl = await findUrlViaGoogle(
        `site:instagram.com "${leadData.companyName}" ${igCity}`,
        'instagram.com',
      )
      if (foundIgUrl) {
        igHandle = foundIgUrl
        merged.instagram = foundIgUrl
      }
    } catch { /* continue */ }

    // Strategy 2: Apify Instagram search by name (fallback)
    if (!igHandle) {
      step('instagram').detail = 'Buscando perfil via Instagram Search...'
      notify()
      try {
        const foundIg = await searchInstagramByName(leadData.companyName || '', igCity)
        if (foundIg) {
          igHandle = foundIg
          merged.instagram = foundIg
        }
      } catch { /* continue */ }
    }
  }
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
  } else {
    step('instagram').status = 'skipped'
    step('instagram').detail = 'Perfil não encontrado'
    notify()
  }

  // Step 9: Website contact crawl — busca ativa com fallbacks
  let websiteUrl = leadData.website || merged.website
  if (!websiteUrl) {
    step('website').status = 'running'
    step('website').detail = 'Buscando site via Google...'
    notify()
    const siteCity = leadData.city || merged.city || ''

    // Strategy 1: Google Search
    try {
      const items = await runActor('apify/google-search-scraper', {
        queries: `"${leadData.companyName}" ${siteCity} site oficial`,
        countryCode: 'br',
        languageCode: 'pt-BR',
        maxPagesPerQuery: 1,
        resultsPerPage: 5,
      }, 60_000)
      if (items?.length) {
        const results = items[0]?.organicResults || items
        for (const r of results) {
          const url = r.url || r.link || ''
          if (url && !url.includes('facebook.com') && !url.includes('instagram.com') && !url.includes('linkedin.com') && !url.includes('google.com') && !url.includes('youtube.com') && !url.includes('reclameaqui')) {
            websiteUrl = url
            merged.website = url
            break
          }
        }
      }
    } catch { /* continue */ }

    // Strategy 2: RAG Web Browser fallback
    if (!websiteUrl) {
      step('website').detail = 'Buscando site via RAG Browser...'
      notify()
      try {
        const foundUrl = await searchWebsiteByName(leadData.companyName || '', siteCity)
        if (foundUrl) {
          websiteUrl = foundUrl
          merged.website = foundUrl
        }
      } catch { /* continue */ }
    }
  }
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
    step('website').detail = 'Site não encontrado'
    notify()
  }

  // Step 10: LinkedIn — busca ativa com fallbacks
  let linkedinUrl = leadData.linkedin || merged.linkedin
  if (!linkedinUrl) {
    step('linkedin').status = 'running'
    step('linkedin').detail = 'Buscando página via Google...'
    notify()
    const liCity = leadData.city || merged.city || ''

    // Strategy 1: Google site:linkedin search
    try {
      const foundLiUrl = await findUrlViaGoogle(
        `site:linkedin.com/company "${leadData.companyName}"`,
        'linkedin.com/company',
      )
      if (foundLiUrl) {
        linkedinUrl = foundLiUrl
        merged.linkedin = foundLiUrl
      }
    } catch { /* continue */ }

    // Strategy 2: Google general search (fallback)
    if (!linkedinUrl) {
      step('linkedin').detail = 'Buscando página via pesquisa ampla...'
      notify()
      try {
        const foundLi = await searchLinkedInByName(leadData.companyName || '', liCity)
        if (foundLi) {
          linkedinUrl = foundLi
          merged.linkedin = foundLi
        }
      } catch { /* continue */ }
    }
  }
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
          liData.employees ? `${liData.employees} funcionários` : null,
          liData.segment ? liData.segment : null,
        ].filter(Boolean)
        if (liDetails.length > 0) step('linkedin').detail = liDetails.join(' · ')
      }
    } catch {
      step('linkedin').status = 'error'
    }
    notify()
  } else {
    step('linkedin').status = 'skipped'
    step('linkedin').detail = 'Página não encontrada'
    notify()
  }

  // Step 11: Contato do Decisor (CEO/Fundador) — busca ativa
  step('decisor').status = 'running'
  notify()
  try {
    // Extrair nome do decisor dos socios da RF
    const partnersData = merged.partners || leadData.partners
    const decisionMaker = extractDecisionMaker(partnersData as string | undefined)
    const dmName = decisionMaker?.nome || undefined

    const dmContacts = await searchDecisionMakerContact(
      leadData.companyName || '',
      dmName,
      leadData.city || merged.city,
    )
    if (dmContacts.length > 0) {
      newContacts.push(...dmContacts)
      step('decisor').status = 'done'
      const hasPhone = dmContacts.some(c => c.whatsapp)
      const hasEmail = dmContacts.some(c => c.email)
      const details = [
        dmName || 'Decisor',
        hasPhone ? 'WhatsApp encontrado' : null,
        hasEmail ? 'Email encontrado' : null,
      ].filter(Boolean)
      step('decisor').detail = details.join(' · ')
    } else {
      step('decisor').status = 'done'
      step('decisor').detail = dmName ? `${dmName} (sem contato direto)` : 'Sem contato direto'
    }
  } catch {
    step('decisor').status = 'error'
  }
  notify()

  // Step 12: INPI (Marcas e Patentes)
  if (leadData.cnpj) {
    step('inpi').status = 'running'
    notify()
    try {
      const inpiData = await enrichByInpi(leadData.cnpj, leadData.companyName || '')
      if (inpiData) {
        merged.inpiTrademarks = inpiData.inpiTrademarks
        merged.inpiTrademarkCount = inpiData.inpiTrademarkCount
        merged.inpiHasRegisteredTrademark = inpiData.inpiHasRegisteredTrademark
      }
      step('inpi').status = 'done'
      if (inpiData?.inpiTrademarkCount) {
        const inpiDetails = [
          `${inpiData.inpiTrademarkCount} marca${inpiData.inpiTrademarkCount > 1 ? 's' : ''}`,
          inpiData.inpiHasRegisteredTrademark ? 'Registrada' : 'Sem registro ativo',
        ].filter(Boolean)
        step('inpi').detail = inpiDetails.join(' · ')
      } else {
        step('inpi').detail = 'Nenhuma marca encontrada'
      }
    } catch {
      step('inpi').status = 'error'
    }
    notify()
  }

  // --- Auto-score SPICED ---
  const spiced = calculateSpicedScore(leadData, merged)

  // --- Reclassify misplaced URLs (e.g., Instagram URL in website field) ---
  const finalData = { ...leadData, ...merged }
  if (finalData.website) {
    const classified = classifyUrl(finalData.website)
    if (classified && classified.field !== 'website') {
      if (!finalData[classified.field]) {
        merged[classified.field as keyof typeof merged] = classified.value as any
      }
      merged.website = undefined as any
    }
  }

  // --- Competitor Research via Google Maps (non-blocking) ---
  let realCompetitors: Array<{ name: string; rating: number; reviews: number; website?: string; category?: string }> = []
  if (!leadData.competitiveAnalysis && APIFY_TOKEN) {
    const compSegment = merged.segment || leadData.segment || ''
    const compCity = merged.city || leadData.city || ''
    if (compSegment && compCity) {
      try {
        const compResults = await runActor<any>('compass~crawler-google-places', {
          searchStringsArray: [compSegment],
          locationQuery: `${compCity}, ${merged.state || leadData.state || 'Brasil'}`,
          maxCrawledPlacesPerSearch: 5,
          language: 'pt-BR',
          maxImages: 0,
          scrapeContacts: false,
          deeperCityScrape: false,
        }, 30_000)
        if (compResults && compResults.length > 0) {
          const leadName = (merged.companyName || leadData.companyName || '').toLowerCase()
          realCompetitors = compResults
            .filter((c: any) => c.title && c.title.toLowerCase() !== leadName)
            .slice(0, 3)
            .map((c: any) => ({
              name: c.title,
              rating: c.totalScore || 0,
              reviews: c.reviewsCount || 0,
              website: c.website,
              category: c.categoryName,
            }))
        }
      } catch {
        // Non-blocking: fall through to generic competitors
      }
    }
  }

  // --- Generate Strategic Analysis (personalized from enrichment data) ---
  step('strategic').status = 'running'
  notify()
  try {
    const fullLeadData = { ...leadData, ...merged, ...spiced }
    fullLeadData.score = Math.round((spiced.spicedS * 0.25 + spiced.spicedP * 0.25 + spiced.spicedI * 0.20 + spiced.spicedC * 0.15 + spiced.spicedD * 0.15) * 10) / 10
    const strategic = generateStrategicAnalysis(fullLeadData, realCompetitors.length > 0 ? realCompetitors : undefined)
    // Only overwrite if not already set (respect n8n or manual data)
    if (!leadData.hypotheticalTrap) merged.hypotheticalTrap = strategic.hypotheticalTrap
    if (!leadData.discoveryQuestions) merged.discoveryQuestions = strategic.discoveryQuestions
    if (!leadData.eligibilityChecklist) merged.eligibilityChecklist = strategic.eligibilityChecklist
    if (!leadData.meetingPrep) merged.meetingPrep = strategic.meetingPrep
    if (!leadData.salesArguments) merged.salesArguments = strategic.salesArguments
    if (!leadData.vulnerabilities) merged.vulnerabilities = strategic.vulnerabilities
    if (!leadData.competitiveAnalysis) merged.competitiveAnalysis = strategic.competitiveAnalysis
    if (!leadData.projectionData) merged.projectionData = strategic.projectionData
    if (!leadData.productPortfolio) merged.productPortfolio = strategic.productPortfolio
    step('strategic').status = 'done'
    step('strategic').detail = realCompetitors.length > 0
      ? `Reunião + Discovery + ${realCompetitors.length} concorrentes reais`
      : 'Reunião + Discovery + Vulnerabilidades + Argumentos'
  } catch {
    step('strategic').status = 'error'
  }
  notify()

  // --- Save enriched data to Airtable ---
  const updateFields: Partial<Lead> = { ...merged }
  Object.assign(updateFields, spiced)
  // Score = media ponderada SPICED (S*25% + P*25% + I*20% + C*15% + D*15%) = escala 1 a 5
  updateFields.score = Math.round((spiced.spicedS * 0.25 + spiced.spicedP * 0.25 + spiced.spicedI * 0.20 + spiced.spicedC * 0.15 + spiced.spicedD * 0.15) * 10) / 10
  const successSteps = steps.filter((s) => s.status === 'done').length
  updateFields.enrichmentStatus = successSteps >= 3 ? 'complete' : successSteps > 0 ? 'cnpja' : 'none'

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

  // Append INPI info to market context
  if (merged.inpiTrademarkCount && merged.inpiTrademarkCount > 0) {
    const inpiInfo = merged.inpiHasRegisteredTrademark
      ? `INPI: ${merged.inpiTrademarkCount} marca${merged.inpiTrademarkCount > 1 ? 's' : ''} registrada${merged.inpiTrademarkCount > 1 ? 's' : ''} — empresa protege sua propriedade intelectual`
      : `INPI: ${merged.inpiTrademarkCount} pedido${merged.inpiTrademarkCount > 1 ? 's' : ''} de marca (sem registro ativo)`
    merged.marketContext = [leadData.marketContext || merged.marketContext, inpiInfo].filter(Boolean).join('\n\n')
  }

  // Build enrichment log before saving
  const enrichmentLog = steps.map(s => ({
    source: s.source,
    status: s.status,
    label: s.label,
  }))
  updateFields.enrichmentSources = JSON.stringify(steps.filter(s => s.status === 'done').map(s => s.source))
  updateFields.enrichmentLog = JSON.stringify(enrichmentLog)

  // Single batched Airtable write (all fields + SPICED + log)
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
        const isDup = existing.some((e) =>
          (c.email && e.email === c.email) || (c.whatsapp && e.whatsapp === c.whatsapp),
        )
        if (!isDup && (c.email || c.whatsapp)) {
          await createContact({
            name: c.name || 'Decisor não identificado',
            role: c.source === 'receita_federal' ? 'Socio/Administrador (RF)' : c.source === 'google_maps' ? 'Telefone comercial' : c.source === 'website' ? 'Contato do site' : c.source === 'vibeprospecting' ? 'Decisor (VibeProspecting)' : c.source === 'google_search_decisor' ? 'CEO/Fundador (Google)' : c.source === 'linkedin_profile' ? 'CEO/Fundador (LinkedIn)' : `Via ${c.source}`,
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

export function formatPhone(phone: string): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '').replace(/^0+/, '')
  // Remove country code for normalization
  const withoutCountry = digits.startsWith('55') ? digits.slice(2) : digits
  // Add 9th digit for old mobile format (DDD + 8 digits starting with 9)
  // e.g., 6199921313 → 61999921313 (WhatsApp requires 9-digit mobile)
  if (withoutCountry.length === 10 && withoutCountry[2] === '9') {
    digits = withoutCountry.slice(0, 2) + '9' + withoutCountry.slice(2)
    return '55' + digits
  }
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

// ========== RE-ENRICHMENT: Atualizar campos faltantes via CNPJa + Assertiva ==========

export interface ReEnrichResult {
  leadId: string
  updated: Partial<Lead>
  source: 'cnpja' | 'assertiva' | 'both'
  skipped: boolean
  error?: string
}

const ESTIMATE_VALUES = new Set([5, 30, 100])

export function leadNeedsReEnrich(lead: Lead, forceAll: boolean): boolean {
  if (!lead.cnpj) return false
  if (forceAll) return true
  const hasEstimateOnly = lead.employees && ESTIMATE_VALUES.has(lead.employees) &&
    !['assertiva', 'complete'].includes(lead.enrichmentStatus || '')
  return !lead.employees || !lead.foundingDate || !lead.yearsInMarket || !!hasEstimateOnly
}

export async function reEnrichLead(
  leadId: string,
  lead: Partial<Lead>,
  _options?: { forceAll?: boolean },
): Promise<ReEnrichResult> {
  if (!lead.cnpj) {
    return { leadId, updated: {}, source: 'cnpja', skipped: true, error: 'Sem CNPJ' }
  }

  const merged: Partial<Lead> = {}
  let source: 'cnpja' | 'assertiva' | 'both' = 'cnpja'

  // Fase 1: CNPJa — foundingDate, yearsInMarket, employees (estimate)
  try {
    const office = await searchOffice(lead.cnpj)
    const cnpjaFields = mapCnpjaToLead(office)

    if (cnpjaFields.foundingDate) {
      merged.foundingDate = cnpjaFields.foundingDate
      // Sempre recalcular yearsInMarket da foundingDate (valor atual)
      const founded = new Date(cnpjaFields.foundingDate)
      if (!isNaN(founded.getTime()) && founded.getTime() < Date.now()) {
        merged.yearsInMarket = Math.floor((Date.now() - founded.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      }
    }
    if (cnpjaFields.employees && cnpjaFields.employees > 0) {
      merged.employees = cnpjaFields.employees
    }
    // Preencher campos extras que possam estar faltando
    if (cnpjaFields.capitalSocial && !lead.capitalSocial) merged.capitalSocial = cnpjaFields.capitalSocial
    if (cnpjaFields.tradeName && !lead.tradeName) merged.tradeName = cnpjaFields.tradeName
    if (cnpjaFields.legalNature && !lead.legalNature) merged.legalNature = cnpjaFields.legalNature
    if (cnpjaFields.registrationStatus && !lead.registrationStatus) merged.registrationStatus = cnpjaFields.registrationStatus
    if (cnpjaFields.cnaePrimary && !lead.cnaePrimary) merged.cnaePrimary = cnpjaFields.cnaePrimary
    if (cnpjaFields.taxRegime && !lead.taxRegime) merged.taxRegime = cnpjaFields.taxRegime
    if (cnpjaFields.address && !lead.address) merged.address = cnpjaFields.address
    if (cnpjaFields.city && !lead.city) merged.city = cnpjaFields.city
    if (cnpjaFields.state && !lead.state) merged.state = cnpjaFields.state
    if (cnpjaFields.rfPhone && !lead.rfPhone) merged.rfPhone = cnpjaFields.rfPhone
    if (cnpjaFields.rfEmail && !lead.rfEmail) merged.rfEmail = cnpjaFields.rfEmail
  } catch (err) {
    console.warn(`reEnrichLead CNPJa falhou para ${lead.cnpj}:`, err)
  }

  // Fase 2: Assertiva — employees real (_quantidadeFuncionarios) sobrescreve estimate
  try {
    const assertivaData = await assertivaLookupCnpj(lead.cnpj) as any
    if (assertivaData?._quantidadeFuncionarios) {
      const realEmployees = Number(assertivaData._quantidadeFuncionarios)
      if (realEmployees > 0 && !isNaN(realEmployees)) {
        merged.employees = realEmployees
        source = source === 'cnpja' ? 'both' : 'assertiva'
      }
    }
    // Telefone com WhatsApp validado
    if (assertivaData?.telefones?.length) {
      const bestPhone = extractBestPhone(assertivaData.telefones)
      if (bestPhone.whatsapp && !lead.rfPhone) {
        merged.rfPhone = bestPhone.whatsapp
      }
    }
    if (assertivaData?._site && !lead.website) {
      merged.website = assertivaData._site.startsWith('http') ? assertivaData._site : `https://${assertivaData._site}`
    }
    // Redes sociais da Assertiva
    if (assertivaData?._redesSociais) {
      if (assertivaData._redesSociais.instagram && !lead.instagram) merged.instagram = assertivaData._redesSociais.instagram
      if (assertivaData._redesSociais.facebook && !lead.facebook) merged.facebook = assertivaData._redesSociais.facebook
      if (assertivaData._redesSociais.linkedin && !lead.linkedin) merged.linkedin = assertivaData._redesSociais.linkedin
      merged.assertivaSocialMedia = JSON.stringify(assertivaData._redesSociais)
    }
    // Faturamento presumido
    if (assertivaData?._faturamentoPresumido && !lead.monthlyRevenue) {
      merged.monthlyRevenue = Number(assertivaData._faturamentoPresumido)
    }
    // Score de crédito
    if (assertivaData?._scoreCredito) {
      merged.assertivaCreditScore = Number(assertivaData._scoreCredito)
    }
    // Renda presumida
    if (assertivaData?._rendaPresumida) {
      merged.assertivaIncomeEstimate = Number(assertivaData._rendaPresumida)
    }

    if (source !== 'both') source = 'assertiva'
  } catch (err) {
    console.warn(`reEnrichLead Assertiva falhou para ${lead.cnpj}:`, err)
  }

  // Validacao final
  if (merged.employees && (merged.employees <= 0 || isNaN(merged.employees))) {
    delete merged.employees
  }
  if (merged.foundingDate) {
    const d = new Date(merged.foundingDate)
    if (isNaN(d.getTime()) || d.getTime() > Date.now()) {
      delete merged.foundingDate
      delete merged.yearsInMarket
    }
  }

  // Se nao ha nada para atualizar, skip
  if (Object.keys(merged).length === 0) {
    return { leadId, updated: {}, source, skipped: true }
  }

  // Atualizar enrichmentStatus se melhorou
  if (!lead.enrichmentStatus || lead.enrichmentStatus === 'none' || lead.enrichmentStatus === 'cnpja') {
    merged.enrichmentStatus = source === 'both' || source === 'assertiva' ? 'assertiva' : 'cnpja'
  }

  // Persistir no Airtable
  await updateLead(leadId, merged)
  await logEnrichmentStep(leadId, 're-enrich', 'done', `${Object.keys(merged).length} campos atualizados via ${source}`).catch(() => {})

  return { leadId, updated: merged, source, skipped: false }
}
