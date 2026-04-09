import { listAllRecords, createRecords } from '../lib/airtable'
import { getCnaeCodesForSegments } from '../lib/cnae-mapping'
import { classifyPhone, formatPhone } from './enrichmentService'
import { searchOffices } from './cnpjaService'
import { TIERS } from '../lib/constants'
import type { Lead, Contact, PescaFilters, PescaLead, CnpjaSearchParams } from '../types'

// --- Fase 1: Busca em massa via CNPJa (primario) com fallback n8n ---

const N8N_PESCA_URL = import.meta.env.VITE_N8N_WEBHOOK_URL
  ? import.meta.env.VITE_N8N_WEBHOOK_URL.replace('/outbili-search', '/outbili-pesca')
  : ''

export async function searchCnpjsViaN8n(
  filters: PescaFilters,
  targetCount: number = 150,
  onProgress?: (found: number) => void,
  signal?: AbortSignal,
): Promise<CnpjRecord[]> {
  const cnaeCodes = getCnaeCodesForSegments(filters.segments)

  // Tentar CNPJa primeiro (pesquisa avancada)
  try {
    const params: CnpjaSearchParams = {
      'mainActivity.id': Number(cnaeCodes[0]) || undefined, // CNAE primario
      'address.state': filters.states[0],
      'status.id': 2, // Ativa
      limit: Math.min(targetCount, 100),
    }

    const offices = await searchOffices(params)
    if (offices.length > 0) {
      const companies: CnpjRecord[] = offices.map((office) => {
        return {
          cnpj: office.taxId,
          razao_social: office.company?.name || '',
          nome_fantasia: office.alias || undefined,
          uf: office.address?.state,
          municipio: office.address?.city,
          logradouro: office.address?.street,
          numero: office.address?.number,
          bairro: office.address?.district,
          cep: office.address?.zip,
          capital_social: office.company?.equity,
          porte: office.company?.size?.text,
          cnae_fiscal_descricao: office.mainActivity?.text,
          data_inicio_atividade: office.founded,
          email: office.emails?.[0]?.address,
          telefone: office.phones?.[0] ? `${office.phones[0].area}${office.phones[0].number}` : undefined,
          qsa: (office.company?.members || []).map((m) => ({
            nome_socio: m.person.name,
            qualificacao_socio: m.role.text,
          })),
        }
      })
      onProgress?.(companies.length)
      return companies
    }
  } catch (cnpjaError) {
    console.warn('CNPJa search falhou, usando fallback n8n:', cnpjaError)
  }

  // Fallback: n8n webhook (mesma API CNPJa, server-side)
  if (!N8N_PESCA_URL) {
    throw new Error('CNPJa e webhook PESCA indisponiveis. Configure VITE_CNPJA_API_KEY ou VITE_N8N_WEBHOOK_URL.')
  }

  const payload = {
    action: 'pesca',
    cnaeCodes,
    states: filters.states,
    capitalMin: filters.revenueMin,
    capitalMax: filters.revenueMax,
    excludeMei: filters.excludeMei,
    targetCount,
  }

  const res = await fetch(N8N_PESCA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok) {
    throw new Error(`Erro no fallback n8n: ${res.status}. Verifique o webhook.`)
  }

  const data = await res.json()
  const companies: CnpjRecord[] = data.companies || data.results || data || []

  if (!Array.isArray(companies)) {
    throw new Error('Resposta invalida do webhook n8n.')
  }

  onProgress?.(companies.length)
  return companies
}

interface CnpjRecord {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  cnae_fiscal_descricao?: string
  cnae_fiscal?: string
  uf?: string
  municipio?: string
  logradouro?: string
  numero?: string
  bairro?: string
  capital_social?: number
  porte?: string
  data_inicio_atividade?: string
  telefone1?: string
  telefone2?: string
  email?: string
  qsa?: Array<{ nome_socio: string; qualificacao_socio: string }>
}

// --- Fase 2: Enriquecimento de telefone + decisor via APIs publicas ---

async function enrichFromOpenCnpj(cnpj: string): Promise<EnrichResult | null> {
  try {
    const res = await fetch(`https://api.opencnpj.org/${cnpj}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const d = await res.json()

    const socios = (d.qsa || []).map((s: any) => ({
      nome: s.nome_socio || s.nome || '',
      qualificacao: s.qualificacao_socio || s.qual || '',
    }))

    const decisor = findDecisor(socios)

    const rawPhones = [d.telefone1, d.telefone2, d.ddd_telefone_1, d.ddd_telefone_2, d.telefone]
      .filter(Boolean)
      .flatMap((p: string) => p.split(/[\/;,]/))
      .map((p: string) => p.trim().replace(/\D/g, ''))
      .filter((p: string) => p.length >= 10)

    return {
      phones: rawPhones,
      decisorName: decisor?.nome,
      decisorRole: decisor?.qualificacao,
      capitalSocial: d.capital_social ? Number(String(d.capital_social).replace(/\D/g, '')) : undefined,
      state: d.uf,
      city: d.municipio,
      address: [d.logradouro, d.numero, d.bairro].filter(Boolean).join(', ') || undefined,
      email: d.email || d.correio_eletronico,
      tradeName: d.nome_fantasia,
      companyName: d.razao_social,
      foundingDate: d.data_inicio_atividade,
      porte: d.porte || d.descricao_porte,
    }
  } catch {
    return null
  }
}

async function enrichFromReceitaWs(cnpj: string): Promise<EnrichResult | null> {
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const d = await res.json()
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
  capitalSocial?: number
  state?: string
  city?: string
  address?: string
  email?: string
  tradeName?: string
  companyName?: string
  foundingDate?: string
  porte?: string
}

function findDecisor(socios: Array<{ nome: string; qualificacao: string }>): { nome: string; qualificacao: string } | undefined {
  return socios.find(s =>
    s.qualificacao.toLowerCase().includes('administrador') ||
    s.qualificacao.toLowerCase().includes('diretor') ||
    s.qualificacao.toLowerCase().includes('presidente'),
  ) || socios[0]
}

export async function enrichCnpjRecords(
  records: CnpjRecord[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const leads: PescaLead[] = []
  const concurrency = 8
  let enrichedCount = 0

  for (let i = 0; i < records.length; i += concurrency) {
    if (signal?.aborted) break

    const batch = records.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map(async (record) => {
        if (signal?.aborted) return null

        const cnpj = record.cnpj.replace(/\D/g, '')

        // Extrair dados do QSA que já veio do n8n
        let decisorName = undefined as string | undefined
        let decisorRole = undefined as string | undefined
        let allPhones: string[] = []
        let mobilePhone: string | undefined

        // Dados básicos do registro n8n
        if (record.qsa?.length) {
          const decisor = findDecisor(record.qsa.map(s => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio })))
          decisorName = decisor?.nome
          decisorRole = decisor?.qualificacao
        }

        // Telefones do registro
        const regPhones = [record.telefone1, record.telefone2]
          .filter((p): p is string => !!p)
          .flatMap(p => p.split(/[\/;,]/))
          .map(p => p.trim().replace(/\D/g, ''))
          .filter(p => p.length >= 10)
        allPhones.push(...regPhones)

        // Tentar OpenCNPJ para dados extras (socios, telefones)
        const openData = await enrichFromOpenCnpj(cnpj)
        if (openData) {
          if (openData.phones.length) allPhones = [...new Set([...allPhones, ...openData.phones])]
          if (!decisorName && openData.decisorName) {
            decisorName = openData.decisorName
            decisorRole = openData.decisorRole
          }
        }

        // Classificar telefone movel = WhatsApp
        for (const p of allPhones) {
          if (classifyPhone(p) === 'mobile') {
            mobilePhone = formatPhone(p)
            break
          }
        }

        const lead: PescaLead = {
          companyName: openData?.companyName || record.razao_social || '',
          tradeName: openData?.tradeName || record.nome_fantasia || undefined,
          cnpj,
          segment: record.cnae_fiscal_descricao || undefined,
          state: openData?.state || record.uf || undefined,
          city: openData?.city || record.municipio || undefined,
          address: openData?.address || [record.logradouro, record.numero, record.bairro].filter(Boolean).join(', ') || undefined,
          decisorName,
          decisorRole,
          whatsapp: mobilePhone || undefined,
          phone: allPhones[0] ? formatPhone(allPhones[0]) : undefined,
          capitalSocial: openData?.capitalSocial || record.capital_social || undefined,
          porte: openData?.porte || record.porte || undefined,
          cnaePrimary: record.cnae_fiscal || undefined,
          foundingDate: openData?.foundingDate || record.data_inicio_atividade || undefined,
          email: openData?.email || record.email || undefined,
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
    await delay(200)
  }

  // ReceitaWS para leads sem celular (max 10, rate limit 3/min)
  const leadsWithoutMobile = leads.filter(l => !l.whatsapp)
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
    throw new Error('Não foi possível verificar duplicatas. Verifique sua conexão e tente novamente.')
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
    // Dedup por CNPJ se disponível
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
