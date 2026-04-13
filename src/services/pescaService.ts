import { listAllRecords, createRecords } from '../lib/airtable'
import { getCnaeCodesForCnpja } from '../lib/cnae-mapping'
import { classifyPhone, formatPhone } from './enrichmentService'
import { searchOfficesPaginated, mapCnpjaToLead, extractPartners } from './cnpjaService'
import { TIERS } from '../lib/constants'
import type { Lead, Contact, CnpjaSearchParams, PescaFilters, PescaLead } from '../types'

// --- Fase 1: Busca em massa via CNPJa API (GET /office) ---
// CNPJa retorna dados completos: telefone (com tipo MOBILE/LANDLINE), email, socios, CNAE, endereco.
// Isso elimina a necessidade de enriquecimento separado via OpenCNPJ/ReceitaWS.

export async function searchViaCnpja(
  filters: PescaFilters,
  targetCount: number = 150,
  onProgress?: (found: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const cnaeCodes = getCnaeCodesForCnpja(filters.segments)

  if (cnaeCodes.length === 0) {
    throw new Error('Nenhum codigo CNAE encontrado para os segmentos selecionados.')
  }

  // Montar CnpjaSearchParams a partir dos filtros do usuario
  const params: CnpjaSearchParams = {
    'mainActivity.id.in': cnaeCodes.join(','),
    'status.id.in': '2', // somente ativas
    'phones.ex': true,    // exigir telefone
  }

  if (filters.states?.length) {
    params['address.state.in'] = filters.states.join(',')
  }
  if (filters.cities?.length) {
    params['address.municipality.in'] = filters.cities.map(c => c.ibgeCode).join(',')
  }
  if (filters.companySizes?.length) {
    params['company.size.id.in'] = filters.companySizes.join(',')
  }
  if (filters.revenueMin) {
    params['company.equity.gte'] = filters.revenueMin
  }
  if (filters.revenueMax && filters.revenueMax < 10000000) {
    params['company.equity.lte'] = filters.revenueMax
  }
  if (filters.excludeMei) {
    params['company.simei.optant.eq'] = false
  }
  if (filters.headOnly) {
    params['head.eq'] = true
  }

  // Busca paginada via CNPJa
  const { offices } = await searchOfficesPaginated(params, {
    targetCount,
    maxPages: 15,
    signal,
    onProgress,
  })

  // Mapear CnpjaOffice -> PescaLead (reutiliza mapCnpjaToLead + extractPartners existentes)
  return offices.map(office => {
    const lead = mapCnpjaToLead(office)
    const partners = extractPartners(office)
    const decisor = findDecisor(
      partners.map(p => ({ nome: p.name, qualificacao: p.qualification })),
    )

    // CNPJa ja classifica telefone como MOBILE/LANDLINE
    const mobilePhone = office.phones?.find(p => p.type === 'MOBILE')
    const anyPhone = office.phones?.[0]

    return {
      companyName: lead.companyName || office.company?.name || '',
      tradeName: lead.tradeName,
      cnpj: lead.cnpj || office.taxId,
      segment: lead.segment,
      state: lead.state,
      city: lead.city,
      address: lead.address,
      decisorName: decisor?.nome,
      decisorRole: decisor?.qualificacao,
      whatsapp: mobilePhone ? formatPhone(`${mobilePhone.area}${mobilePhone.number}`) : undefined,
      phone: anyPhone ? formatPhone(`${anyPhone.area}${anyPhone.number}`) : undefined,
      capitalSocial: lead.capitalSocial,
      porte: office.company?.size?.text,
      cnaePrimary: lead.cnaePrimary,
      foundingDate: lead.foundingDate,
      email: lead.rfEmail,
      source: 'pesca' as const,
    }
  })
}

// --- Fase 2 (opcional): Enriquecer leads sem celular via ReceitaWS ---

export async function enrichMissingPhones(
  leads: PescaLead[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const leadsWithoutMobile = leads.filter(l => !l.whatsapp)
  const limit = Math.min(leadsWithoutMobile.length, 5)
  let enrichedCount = 0

  for (let i = 0; i < limit; i++) {
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

    enrichedCount++
    onProgress?.(enrichedCount)

    // ReceitaWS rate limit: 3/min
    if (i < limit - 1) await delay(20000)
  }

  return leads
}

// --- ReceitaWS fallback (apenas para leads sem celular) ---

async function enrichFromReceitaWs(cnpj: string): Promise<EnrichResult | null> {
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const text = await res.text()
    if (!text) return null
    let d: any
    try { d = JSON.parse(text) } catch { return null }
    if (d.status === 'ERROR') return null

    const rawPhones = (d.telefone || '').split(/[\/;,]/).map((p: string) => p.trim().replace(/\D/g, '')).filter((p: string) => p.length >= 10)
    const socios = (d.qsa || []).map((s: any) => ({ nome: s.nome || '', qualificacao: s.qual || '' }))

    return {
      phones: rawPhones,
      decisorName: findDecisor(socios)?.nome,
      decisorRole: findDecisor(socios)?.qualificacao,
    }
  } catch {
    return null
  }
}

interface EnrichResult {
  phones: string[]
  decisorName?: string
  decisorRole?: string
}

function findDecisor(socios: Array<{ nome: string; qualificacao: string }>): { nome: string; qualificacao: string } | undefined {
  return socios.find(s =>
    s.qualificacao.toLowerCase().includes('administrador') ||
    s.qualificacao.toLowerCase().includes('diretor') ||
    s.qualificacao.toLowerCase().includes('presidente'),
  ) || socios[0]
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
        enrichmentStatus: 'cnpja',
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
