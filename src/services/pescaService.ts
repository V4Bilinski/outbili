import { listAllRecords, createRecords } from '../lib/airtable'
import { getCnaeCodesForSegments } from '../lib/cnae-mapping'
import { classifyPhone, formatPhone, parseCnpjResponse } from './enrichmentService'
import { TIERS } from '../lib/constants'
import type { Lead, Contact, PescaFilters, PescaLead } from '../types'

// --- Casa dos Dados API ---

interface CasaDosDadosCompany {
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
  cep?: string
  capital_social?: number
  porte?: string
  data_inicio_atividade?: string
  telefone1?: string
  email?: string
}

interface CasaDosDadosResponse {
  data: {
    cnpj: CasaDosDadosCompany[]
    count: number
  }
}

const CASA_DOS_DADOS_URL = 'https://api.casadosdados.com.br/v2/public/cnpj/search'

export async function searchCasaDosDados(
  filters: PescaFilters,
  targetCount: number = 150,
  onProgress?: (found: number) => void,
  signal?: AbortSignal,
): Promise<CasaDosDadosCompany[]> {
  const cnaeCodes = getCnaeCodesForSegments(filters.segments)
  const all: CasaDosDadosCompany[] = []
  const seenCnpjs = new Set<string>()

  // Buscar por cada CNAE separadamente para maximizar resultados
  for (const cnae of cnaeCodes) {
    if (signal?.aborted) break
    if (all.length >= targetCount) break

    let page = 1
    const maxPages = 10 // Limite de seguranca

    while (page <= maxPages && all.length < targetCount) {
      if (signal?.aborted) break

      try {
        const payload = {
          query: {
            termo: [],
            atividade_principal: [cnae],
            natureza_juridica: [],
            uf: filters.states.length > 0 ? filters.states : [],
            municipio: [],
            situacao_cadastral: 'ATIVA',
          },
          range_query: {
            capital_social: {
              gte: filters.revenueMin || 0,
              lte: filters.revenueMax || 10000000,
            },
          },
          extras: {
            somente_mei: false,
            excluir_mei: filters.excludeMei,
            com_email: false,
            incluir_atividade_secundaria: false,
            com_contato_telefonico: true,
          },
          page,
        }

        const res = await fetch(CASA_DOS_DADOS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal,
        })

        if (!res.ok) {
          // Rate limit ou erro — tentar proximo CNAE
          if (res.status === 429) {
            await delay(2000)
            continue
          }
          break
        }

        const data: CasaDosDadosResponse = await res.json()
        const companies = data?.data?.cnpj || []

        if (companies.length === 0) break

        for (const company of companies) {
          const cleanCnpj = company.cnpj?.replace(/\D/g, '')
          if (!cleanCnpj || seenCnpjs.has(cleanCnpj)) continue
          seenCnpjs.add(cleanCnpj)
          all.push({ ...company, cnpj: cleanCnpj })
        }

        onProgress?.(all.length)
        page++

        // Pequeno delay entre paginas para nao sobrecarregar
        await delay(300)
      } catch (err) {
        if (signal?.aborted) break
        // Erro de rede — tentar proximo CNAE
        break
      }
    }
  }

  return all
}

// --- Enriquecimento de telefone + decisor ---

interface EnrichResult {
  phones: string[]
  decisorName?: string
  decisorRole?: string
  socios?: Array<{ nome: string; qualificacao: string }>
  leadData?: Partial<Lead>
}

async function enrichCnpjFromOpenCnpj(cnpj: string): Promise<EnrichResult | null> {
  try {
    const res = await fetch(`https://api.opencnpj.org/${cnpj}`)
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

    return {
      phones: rawPhones,
      decisorName: decisor?.nome,
      decisorRole: decisor?.qualificacao,
      socios,
      leadData: parseCnpjResponse(d),
    }
  } catch {
    return null
  }
}

async function enrichCnpjFromReceitaWs(cnpj: string): Promise<EnrichResult | null> {
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`)
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

    return {
      phones: rawPhones,
      decisorName: decisor?.nome,
      decisorRole: decisor?.qualificacao,
      socios,
    }
  } catch {
    return null
  }
}

export async function enrichWithPhoneAndDecisionMaker(
  companies: CasaDosDadosCompany[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const leads: PescaLead[] = []
  const concurrency = 8
  let enrichedCount = 0

  // Process in batches with concurrency pool
  for (let i = 0; i < companies.length; i += concurrency) {
    if (signal?.aborted) break

    const batch = companies.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map(async (company) => {
        if (signal?.aborted) return null

        const cnpj = company.cnpj.replace(/\D/g, '')

        // Fase 1: OpenCNPJ (rapido, 50 req/s)
        let enrichData = await enrichCnpjFromOpenCnpj(cnpj)

        // Verificar se tem telefone movel
        let mobilePhone: string | undefined
        let allPhones: string[] = []

        if (enrichData?.phones?.length) {
          allPhones = enrichData.phones
          const mobile = allPhones.find(p => classifyPhone(p) === 'mobile')
          if (mobile) mobilePhone = formatPhone(mobile)
        }

        // ReceitaWS eh chamada separadamente depois (rate limit 3/min)

        const lead: PescaLead = {
          companyName: enrichData?.leadData?.companyName || company.razao_social || '',
          tradeName: enrichData?.leadData?.tradeName || company.nome_fantasia || undefined,
          cnpj,
          segment: company.cnae_fiscal_descricao || enrichData?.leadData?.segment || undefined,
          state: company.uf || enrichData?.leadData?.state || undefined,
          city: company.municipio || enrichData?.leadData?.city || undefined,
          address: enrichData?.leadData?.address || [company.logradouro, company.numero, company.bairro].filter(Boolean).join(', ') || undefined,
          decisorName: enrichData?.decisorName || undefined,
          decisorRole: enrichData?.decisorRole || undefined,
          whatsapp: mobilePhone || undefined,
          phone: allPhones[0] ? formatPhone(allPhones[0]) : undefined,
          capitalSocial: company.capital_social || enrichData?.leadData?.capitalSocial || undefined,
          porte: enrichData?.leadData?.employees ? String(enrichData.leadData.employees) : company.porte || undefined,
          cnaePrimary: company.cnae_fiscal || undefined,
          foundingDate: company.data_inicio_atividade || enrichData?.leadData?.foundingDate || undefined,
          email: company.email || enrichData?.leadData?.rfEmail || undefined,
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

  // Fase 2b: ReceitaWS sequencial para leads sem celular (rate limit 3/min = 20s entre requests)
  const leadsWithoutMobile = leads.filter(l => !l.whatsapp)
  const receitaWsLimit = Math.min(leadsWithoutMobile.length, 15) // Max 15 para nao demorar demais

  for (let i = 0; i < receitaWsLimit; i++) {
    if (signal?.aborted) break
    const lead = leadsWithoutMobile[i]

    try {
      const receitaData = await enrichCnpjFromReceitaWs(lead.cnpj)
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

    // Respeitar rate limit: 20s entre requests (3/min)
    if (i < receitaWsLimit - 1) await delay(20000)
    onProgress?.(enrichedCount) // Manter UI atualizada
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
    console.warn('PESCA: falha ao carregar leads para dedup, prosseguindo com dedup parcial')
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
    console.warn('PESCA: falha ao carregar contacts para dedup, prosseguindo com dedup parcial')
    contactsFailed = true
  }

  // Se AMBAS falharam, a dedup eh impossivel — abortar para evitar duplicatas em massa
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
  const seen = new Set<string>()
  const result: PescaLead[] = []

  for (const lead of leads) {
    const cnpj = lead.cnpj?.replace(/\D/g, '')
    if (!cnpj) continue

    // Dedup por CNPJ (interno + existente)
    if (seen.has(cnpj) || existingCnpjs.has(cnpj)) continue

    // Dedup por WhatsApp (existente)
    if (lead.whatsapp) {
      const phoneDigits = lead.whatsapp.replace(/\D/g, '')
      if (existingPhones.has(phoneDigits)) continue
    }

    seen.add(cnpj)
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

  // Fase A: Save leads em batches de 10
  for (let i = 0; i < leads.length; i += 10) {
    if (signal?.aborted) break

    const batch = leads.slice(i, i + 10)
    const records = batch.map((lead) => ({
      fields: {
        companyName: lead.companyName,
        tradeName: lead.tradeName,
        cnpj: lead.cnpj,
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
        partners: lead.decisorName ? JSON.stringify([{ nome_socio: lead.decisorName, qualificacao_socio: lead.decisorRole || '' }]) : undefined,
      } as Partial<Lead>,
    }))

    try {
      const created = await createRecords<Lead>('Leads', records)

      for (let j = 0; j < created.length; j++) {
        const createdLead = created[j]
        const originalLead = batch[j]
        leadIds.push(createdLead.id)

        // Coletar contact para batch posterior
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

  // Fase B: Batch create contacts (em grupos de 10)
  let savedContacts = 0
  for (let i = 0; i < pendingContacts.length; i += 10) {
    if (signal?.aborted) break
    const contactBatch = pendingContacts.slice(i, i + 10)
    try {
      const created = await createRecords<Contact>('Contacts', contactBatch)
      savedContacts += created.length
    } catch {
      console.warn(`Erro ao salvar batch contacts ${i / 10 + 1}, prosseguindo`)
    }
    await delay(200)
  }

  return { savedLeads: leadIds.length, savedContacts, leadIds }
}

// --- Utils ---

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
