import { listAllRecords, createRecords } from '../lib/airtable'
import { startGoogleMapsSearch, pollRunUntilDone, getDatasetItems } from '../lib/apify'
import { classifyPhone, formatPhone, parseCnpjResponse } from './enrichmentService'
import { TIERS, SEGMENTS } from '../lib/constants'
import type { Lead, Contact, PescaFilters, PescaLead } from '../types'

// --- Fase 1: Descoberta via Google Maps (Apify) ---

const GOOGLE_MAPS_ACTOR = 'compass~crawler-google-places'

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapa', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceara', DF: 'Brasilia', ES: 'Espirito Santo', GO: 'Goias',
  MA: 'Maranhao', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Para', PB: 'Paraiba', PR: 'Parana',
  PE: 'Pernambuco', PI: 'Piaui', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondonia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'Sao Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

function buildSearchQueries(filters: PescaFilters): Array<{ query: string; location: string }> {
  const segmentNames = filters.segments
    .map(slug => SEGMENTS.find(s => s.slug === slug)?.name || slug)

  const locations = filters.states.length > 0
    ? filters.states.map(uf => STATE_NAMES[uf] || uf)
    : ['Sao Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Parana', 'Santa Catarina', 'Rio Grande do Sul']

  const queries: Array<{ query: string; location: string }> = []
  for (const seg of segmentNames) {
    for (const loc of locations) {
      queries.push({ query: seg, location: `${loc}, Brasil` })
    }
  }
  return queries
}

export async function discoverBusinesses(
  filters: PescaFilters,
  targetCount: number = 150,
  onProgress?: (found: number) => void,
  signal?: AbortSignal,
): Promise<GoogleMapsCompany[]> {
  const queries = buildSearchQueries(filters)
  const all: GoogleMapsCompany[] = []
  const seenNames = new Set<string>()

  // Calcular quantos resultados pedir por query para atingir o target
  const resultsPerQuery = Math.max(20, Math.ceil(targetCount * 1.5 / queries.length))

  // Rodar queries em paralelo (max 3 por vez para nao estourar Apify)
  const batchSize = 3
  for (let i = 0; i < queries.length; i += batchSize) {
    if (signal?.aborted) break
    if (all.length >= targetCount) break

    const batch = queries.slice(i, i + batchSize)

    const runPromises = batch.map(async ({ query, location }) => {
      try {
        const runId = await startGoogleMapsSearch(query, location, resultsPerQuery)
        const datasetId = await pollRunUntilDone(runId, GOOGLE_MAPS_ACTOR, undefined, 180_000)
        return await getDatasetItems<any>(datasetId, resultsPerQuery)
      } catch {
        return []
      }
    })

    const results = await Promise.allSettled(runPromises)

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value) continue
      for (const item of result.value) {
        if (signal?.aborted) break
        const key = (item.title || '').toLowerCase().trim()
        if (!key || seenNames.has(key)) continue
        seenNames.add(key)

        all.push({
          name: item.title || '',
          address: item.address || '',
          phone: item.phone || '',
          website: item.website || '',
          rating: item.totalScore || 0,
          reviewsCount: item.reviewsCount || 0,
          category: item.categoryName || '',
          city: item.city || '',
          state: item.state || '',
          emails: item.emails || [],
        })
      }
    }

    onProgress?.(all.length)
  }

  return all.slice(0, targetCount + 50) // Overshoot para compensar dedup
}

interface GoogleMapsCompany {
  name: string
  address: string
  phone: string
  website: string
  rating: number
  reviewsCount: number
  category: string
  city: string
  state: string
  emails: string[]
}

// --- Fase 2: Enriquecimento CNPJ via APIs publicas ---

interface CnpjEnrichResult {
  cnpj?: string
  companyName?: string
  tradeName?: string
  decisorName?: string
  decisorRole?: string
  phones: string[]
  capitalSocial?: number
  porte?: string
  foundingDate?: string
  cnaePrimary?: string
  email?: string
  state?: string
  city?: string
  address?: string
}

async function searchCnpjByName(companyName: string, _state?: string): Promise<CnpjEnrichResult | null> {
  // Tentar encontrar o CNPJ pelo nome da empresa via CNPJa Open
  const cleanName = companyName.replace(/[^\w\s]/g, '').trim()
  if (!cleanName) return null

  try {
    // CNPJa Open permite busca por nome
    const query = encodeURIComponent(cleanName)
    const res = await fetch(`https://open.cnpja.com/office/${query}`, { signal: AbortSignal.timeout(8000) })
    if (res.ok) {
      const d = await res.json()
      if (d.taxId) {
        return parseCnpjaResponse(d)
      }
    }
  } catch { /* fallback below */ }

  return null
}

function parseCnpjaResponse(d: any): CnpjEnrichResult {
  const socios = (d.company?.members || []).map((m: any) => ({
    nome: m.person?.name || '',
    qualificacao: m.role?.text || '',
  }))

  const decisor = socios.find((s: { qualificacao: string }) =>
    s.qualificacao.toLowerCase().includes('administrador') ||
    s.qualificacao.toLowerCase().includes('diretor') ||
    s.qualificacao.toLowerCase().includes('presidente'),
  ) || socios[0]

  const phones = [d.phones?.[0]?.number, d.phones?.[1]?.number]
    .filter(Boolean)
    .map((p: string) => p.replace(/\D/g, ''))
    .filter((p: string) => p.length >= 10)

  return {
    cnpj: d.taxId?.replace(/\D/g, ''),
    companyName: d.company?.name,
    tradeName: d.alias,
    decisorName: decisor?.nome,
    decisorRole: decisor?.qualificacao,
    phones,
    capitalSocial: d.company?.equity,
    porte: d.company?.size?.text,
    foundingDate: d.founded,
    cnaePrimary: d.mainActivity?.id ? String(d.mainActivity.id) : undefined,
    email: d.emails?.[0]?.address,
    state: d.address?.state,
    city: d.address?.city,
    address: d.address?.street ? `${d.address.street}, ${d.address.number || ''}` : undefined,
  }
}

async function enrichFromOpenCnpj(cnpj: string): Promise<CnpjEnrichResult | null> {
  try {
    const res = await fetch(`https://api.opencnpj.org/${cnpj}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const d = await res.json()

    const socios = (d.qsa || []).map((s: any) => ({
      nome: s.nome_socio || s.nome || '',
      qualificacao: s.qualificacao_socio || s.qual || '',
    }))

    const decisor = socios.find((s: { qualificacao: string }) =>
      s.qualificacao.toLowerCase().includes('administrador') ||
      s.qualificacao.toLowerCase().includes('diretor') ||
      s.qualificacao.toLowerCase().includes('presidente'),
    ) || socios[0]

    const rawPhones = [d.telefone1, d.telefone2, d.ddd_telefone_1, d.ddd_telefone_2, d.telefone]
      .filter(Boolean)
      .flatMap((p: string) => p.split(/[\/;,]/))
      .map((p: string) => p.trim().replace(/\D/g, ''))
      .filter((p: string) => p.length >= 10)

    const leadData = parseCnpjResponse(d)

    return {
      cnpj: cnpj,
      companyName: d.razao_social || leadData.companyName,
      tradeName: d.nome_fantasia || leadData.tradeName,
      decisorName: decisor?.nome,
      decisorRole: decisor?.qualificacao,
      phones: rawPhones,
      capitalSocial: d.capital_social ? Number(String(d.capital_social).replace(/\D/g, '')) : undefined,
      porte: d.porte || d.descricao_porte,
      foundingDate: d.data_inicio_atividade,
      cnaePrimary: d.cnae_fiscal ? String(d.cnae_fiscal) : undefined,
      email: d.email || d.correio_eletronico,
      state: d.uf,
      city: d.municipio,
      address: [d.logradouro, d.numero, d.bairro].filter(Boolean).join(', ') || undefined,
    }
  } catch {
    return null
  }
}

async function enrichFromReceitaWs(cnpj: string): Promise<{ phones: string[]; decisorName?: string; decisorRole?: string } | null> {
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const d = await res.json()
    if (d.status === 'ERROR') return null

    const rawPhones = (d.telefone || '').split(/[\/;,]/).map((p: string) => p.trim().replace(/\D/g, '')).filter((p: string) => p.length >= 10)

    const socios = (d.qsa || []).map((s: any) => ({
      nome: s.nome || '',
      qualificacao: s.qual || '',
    }))

    const decisor = socios.find((s: { qualificacao: string }) =>
      s.qualificacao.toLowerCase().includes('administrador') ||
      s.qualificacao.toLowerCase().includes('diretor') ||
      s.qualificacao.toLowerCase().includes('presidente'),
    ) || socios[0]

    return { phones: rawPhones, decisorName: decisor?.nome, decisorRole: decisor?.qualificacao }
  } catch {
    return null
  }
}

export async function enrichBusinesses(
  businesses: GoogleMapsCompany[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const leads: PescaLead[] = []
  const concurrency = 5
  let enrichedCount = 0

  for (let i = 0; i < businesses.length; i += concurrency) {
    if (signal?.aborted) break

    const batch = businesses.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map(async (biz) => {
        if (signal?.aborted) return null

        // Passo 1: Classificar telefone do Google Maps
        let mobilePhone: string | undefined
        let allPhones: string[] = []
        if (biz.phone) {
          const cleanPhone = biz.phone.replace(/\D/g, '')
          if (cleanPhone.length >= 10) {
            allPhones.push(cleanPhone)
            if (classifyPhone(cleanPhone) === 'mobile') {
              mobilePhone = formatPhone(cleanPhone)
            }
          }
        }

        // Passo 2: Tentar buscar CNPJ pelo nome da empresa
        let cnpjData: CnpjEnrichResult | null = null
        cnpjData = await searchCnpjByName(biz.name, biz.state)

        // Passo 3: Se encontrou CNPJ, enriquecer com OpenCNPJ
        if (cnpjData?.cnpj) {
          const openData = await enrichFromOpenCnpj(cnpjData.cnpj)
          if (openData) {
            // Merge dados
            if (openData.phones.length) {
              allPhones = [...new Set([...allPhones, ...openData.phones])]
              if (!mobilePhone) {
                const mobile = openData.phones.find(p => classifyPhone(p) === 'mobile')
                if (mobile) mobilePhone = formatPhone(mobile)
              }
            }
            cnpjData = { ...cnpjData, ...openData, phones: allPhones }
          }
        }

        const lead: PescaLead = {
          companyName: cnpjData?.companyName || biz.name,
          tradeName: cnpjData?.tradeName || undefined,
          cnpj: cnpjData?.cnpj || '',
          segment: biz.category || cnpjData?.cnaePrimary || undefined,
          state: cnpjData?.state || biz.state || undefined,
          city: cnpjData?.city || biz.city || undefined,
          address: cnpjData?.address || biz.address || undefined,
          decisorName: cnpjData?.decisorName || undefined,
          decisorRole: cnpjData?.decisorRole || undefined,
          whatsapp: mobilePhone || undefined,
          phone: allPhones[0] ? formatPhone(allPhones[0]) : undefined,
          capitalSocial: cnpjData?.capitalSocial || undefined,
          porte: cnpjData?.porte || undefined,
          cnaePrimary: cnpjData?.cnaePrimary || undefined,
          foundingDate: cnpjData?.foundingDate || undefined,
          email: cnpjData?.email || biz.emails?.[0] || undefined,
          source: 'pesca',
        }

        return lead
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        leads.push(result.value)
        enrichedCount++
      }
    }

    onProgress?.(enrichedCount)
    await delay(300)
  }

  // Fase extra: ReceitaWS para leads sem celular (max 10, rate limit 3/min)
  const leadsWithoutMobile = leads.filter(l => !l.whatsapp && l.cnpj)
  const receitaWsLimit = Math.min(leadsWithoutMobile.length, 10)

  for (let i = 0; i < receitaWsLimit; i++) {
    if (signal?.aborted) break
    const lead = leadsWithoutMobile[i]
    try {
      const receitaData = await enrichFromReceitaWs(lead.cnpj)
      if (receitaData?.phones?.length) {
        const mobile = receitaData.phones.find(p => classifyPhone(p) === 'mobile')
        if (mobile) lead.whatsapp = formatPhone(mobile)
        if (!lead.phone) lead.phone = formatPhone(receitaData.phones[0])
      }
      if (!lead.decisorName && receitaData?.decisorName) {
        lead.decisorName = receitaData.decisorName
        lead.decisorRole = receitaData.decisorRole
      }
    } catch { /* non-blocking */ }
    if (i < receitaWsLimit - 1) await delay(20000)
  }

  return leads
}

// --- Deduplicacao ---

export async function loadExistingDedup(signal?: AbortSignal): Promise<{ cnpjs: Set<string>; phones: Set<string> }> {
  const cnpjs = new Set<string>()
  const phones = new Set<string>()
  let leadsFailed = false
  let contactsFailed = false

  try {
    if (signal?.aborted) throw new Error('Aborted')
    const leadRecords = await listAllRecords('Leads', { fields: ['cnpj'] })
    for (const r of leadRecords) {
      const cnpj = (r.fields as any).cnpj?.replace(/\D/g, '')
      if (cnpj) cnpjs.add(cnpj)
    }
  } catch (err) {
    if (signal?.aborted) throw err
    console.warn('PESCA: falha ao carregar leads para dedup')
    leadsFailed = true
  }

  try {
    if (signal?.aborted) throw new Error('Aborted')
    const contactRecords = await listAllRecords('Contacts', { fields: ['whatsapp'] })
    for (const r of contactRecords) {
      const phone = (r.fields as any).whatsapp?.replace(/\D/g, '')
      if (phone) phones.add(phone)
    }
  } catch (err) {
    if (signal?.aborted) throw err
    console.warn('PESCA: falha ao carregar contacts para dedup')
    contactsFailed = true
  }

  if (leadsFailed && contactsFailed) {
    throw new Error('Nao foi possivel verificar duplicatas. Verifique sua conexao e tente novamente.')
  }

  return { cnpjs, phones }
}

export function deduplicateLeads(
  leads: PescaLead[],
  existingCnpjs: Set<string>,
  existingPhones: Set<string>,
): PescaLead[] {
  const seenCnpjs = new Set<string>()
  const seenNames = new Set<string>()
  const result: PescaLead[] = []

  for (const lead of leads) {
    // Dedup por CNPJ se disponivel
    if (lead.cnpj) {
      const cnpj = lead.cnpj.replace(/\D/g, '')
      if (seenCnpjs.has(cnpj) || existingCnpjs.has(cnpj)) continue
      seenCnpjs.add(cnpj)
    } else {
      // Sem CNPJ: dedup por nome normalizado
      const normalizedName = lead.companyName.toLowerCase().trim()
      if (seenNames.has(normalizedName)) continue
      seenNames.add(normalizedName)
    }

    // Dedup por WhatsApp (existente)
    if (lead.whatsapp) {
      const phoneDigits = lead.whatsapp.replace(/\D/g, '')
      if (existingPhones.has(phoneDigits)) continue
    }

    result.push(lead)
  }

  return result
}

// --- Save no Airtable ---

function calculateTier(capitalSocial?: number): string {
  if (!capitalSocial) return 'Micro+'
  for (const tier of TIERS) {
    if (capitalSocial >= tier.min && capitalSocial <= tier.max) return tier.name
  }
  return capitalSocial > 2000000 ? 'Medium=' : 'Micro+'
}

export interface SaveResult {
  savedLeads: number
  savedContacts: number
  leadIds: string[]
}

export async function savePescaToAirtable(
  leads: PescaLead[],
  onProgress?: (saved: number) => void,
  signal?: AbortSignal,
): Promise<SaveResult> {
  const leadIds: string[] = []
  const pendingContacts: Array<{ fields: Partial<Contact> }> = []

  for (let i = 0; i < leads.length; i += 10) {
    if (signal?.aborted) break

    const batch = leads.slice(i, i + 10)
    const records = batch.map((lead) => ({
      fields: {
        companyName: lead.companyName,
        tradeName: lead.tradeName,
        cnpj: lead.cnpj || undefined,
        segment: lead.segment || '',
        status: 'Novo',
        score: 0,
        temperature: 'Frio',
        tier: calculateTier(lead.capitalSocial),
        state: lead.state,
        city: lead.city,
        address: lead.address,
        rfPhone: lead.phone,
        rfEmail: lead.email,
        capitalSocial: lead.capitalSocial,
        foundingDate: lead.foundingDate,
        cnaePrimary: lead.cnaePrimary,
        enrichmentStatus: 'basic',
        googleRating: undefined, // Pode ser adicionado do Google Maps depois
        partners: lead.decisorName ? JSON.stringify([{ nome_socio: lead.decisorName, qualificacao_socio: lead.decisorRole || '' }]) : undefined,
      } as Partial<Lead>,
    }))

    try {
      const created = await createRecords<Lead>('Leads', records)
      for (let j = 0; j < created.length; j++) {
        const createdLead = created[j]
        const originalLead = batch[j]
        leadIds.push(createdLead.id)

        if (originalLead.decisorName && (originalLead.whatsapp || originalLead.phone)) {
          pendingContacts.push({
            fields: {
              leadId: createdLead.id,
              name: originalLead.decisorName,
              role: originalLead.decisorRole,
              contactType: 'decisor',
              whatsapp: originalLead.whatsapp || originalLead.phone || '',
            } as Partial<Contact>,
          })
        }
      }
    } catch (err) {
      console.error(`Erro ao salvar batch leads ${i / 10 + 1}:`, err)
    }

    onProgress?.(leadIds.length)
    await delay(200)
  }

  // Batch create contacts
  let savedContacts = 0
  for (let i = 0; i < pendingContacts.length; i += 10) {
    if (signal?.aborted) break
    const contactBatch = pendingContacts.slice(i, i + 10)
    try {
      const created = await createRecords<Contact>('Contacts', contactBatch)
      savedContacts += created.length
    } catch {
      console.warn(`Erro ao salvar batch contacts ${i / 10 + 1}`)
    }
    await delay(200)
  }

  return { savedLeads: leadIds.length, savedContacts, leadIds }
}

// --- Utils ---

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
