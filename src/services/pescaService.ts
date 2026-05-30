// pescaService — backend Supabase (schema 'app').
// Wave 3 do cutover Airtable -> Supabase. Refatora as 3 operacoes que tocavam o Airtable
// direto (`loadExistingDedup`, `enrichBatchWithAssertiva`, `savePescaToAirtable`) para
// usar os services convertidos + cliente Supabase. As 4 fases de busca/enriquecimento
// que dependem so de CNPJa/Assertiva (sem banco) continuam intactas.

import { supabase, throwIfError } from '../lib/supabase'
import { getCnaeCodesForCnpja } from '../lib/cnae-mapping'
import { formatPhone, calculateSpicedDimensions } from './enrichmentService'
import { detectTravas } from './strategicAnalysisService'
import { searchOffice, searchOfficesPaginated, mapCnpjaToLead, extractPartners } from './cnpjaService'
import { lookupCnpj as assertivaLookupCnpj, getDecisionMakers, extractBestPhone, lookupCpf } from './assertivaService'
import { TIERS } from '../lib/constants'
import { calculateSpicedScore, getTemperatureFromScore } from '../lib/utils'
import { createLead, updateLead, getLead } from './leadService'
import { createContact } from './contactService'
import type { Lead, CnpjaOffice, CnpjaSearchParams, PescaFilters, PescaLead } from '../types'

// --- Fase 1: Busca em massa via CNPJa API (GET /office) ---
// CNPJa retorna dados completos: telefone (com tipo MOBILE/LANDLINE), email, socios, CNAE, endereco.

// Over-fetch: buffer aplicado sobre o alvo de leads validos-intrinsecos para
// compensar a deduplicacao vs. base (feita depois, em usePesca).
const PESCA_DEDUP_BUFFER = 1.3
// Teto rigido de consultas CNPJa por pesquisa (controle de custo de creditos).
const PESCA_MAX_OFFICES_CAP = 450

/**
 * Verdade de validade de um office para a PESCA: precisa ter decisor identificavel
 * (QSA) E ao menos um telefone. Mesmo criterio do descarte no loop de montagem abaixo.
 */
function officeHasDecisorAndPhone(office: CnpjaOffice): boolean {
  const partners = extractPartners(office)
  const decisor = findDecisor(partners.map(p => ({ nome: p.name, qualificacao: p.qualification })))
  const hasPhone = !!office.phones?.[0]
  return !!decisor?.nome && hasPhone
}

export async function searchViaCnpja(
  filters: PescaFilters,
  targetCount: number = 50,
  onProgress?: (found: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const cnaeCodes = getCnaeCodesForCnpja(filters.segments)

  if (cnaeCodes.length === 0) {
    throw new Error('Nenhum codigo CNAE encontrado para os segmentos selecionados.')
  }

  const params: CnpjaSearchParams = {
    'mainActivity.id.in': cnaeCodes.join(','),
    'status.id.in': '2',
    'phones.ex': true,
  }

  if (filters.states?.length) params['address.state.in'] = filters.states.join(',')
  if (filters.cities?.length) params['address.municipality.in'] = filters.cities.map(c => c.ibgeCode).join(',')
  if (filters.companySizes?.length) params['company.size.id.in'] = filters.companySizes.join(',')
  if (filters.revenueMin) params['company.equity.gte'] = filters.revenueMin
  if (filters.revenueMax && filters.revenueMax < 10000000) params['company.equity.lte'] = filters.revenueMax
  if (filters.excludeMei) params['company.simei.optant.eq'] = false
  if (filters.headOnly) params['head.eq'] = true

  // Mira N leads validos (+ buffer p/ dedup), nunca consultando alem do teto de custo.
  const targetValidCount = Math.ceil(targetCount * PESCA_DEDUP_BUFFER)
  const maxOffices = Math.min(targetCount * 4, PESCA_MAX_OFFICES_CAP)
  const maxPages = Math.ceil(maxOffices / 10)

  const { offices } = await searchOfficesPaginated(params, {
    targetCount,
    targetValidCount,
    isValid: officeHasDecisorAndPhone,
    maxOffices,
    maxPages,
    signal,
    onProgress,
  })

  const allLeads: PescaLead[] = []

  for (const office of offices) {
    const lead = mapCnpjaToLead(office)
    const partners = extractPartners(office)
    const decisor = findDecisor(partners.map(p => ({ nome: p.name, qualificacao: p.qualification })))

    const mobilePhone = office.phones?.find(p => p.type === 'MOBILE')
    const anyPhone = office.phones?.[0]

    const decisorName = decisor?.nome
    const phone = anyPhone ? formatPhone(`${anyPhone.area}${anyPhone.number}`) : undefined
    if (!decisorName || !phone) continue

    allLeads.push({
      companyName: lead.companyName || office.company?.name || '',
      tradeName: lead.tradeName,
      cnpj: lead.cnpj || office.taxId,
      segment: lead.segment,
      state: lead.state,
      city: lead.city,
      address: lead.address,
      decisorName,
      decisorRole: decisor?.qualificacao,
      whatsapp: mobilePhone ? formatPhone(`${mobilePhone.area}${mobilePhone.number}`) : undefined,
      phone,
      capitalSocial: lead.capitalSocial,
      porte: office.company?.size?.text,
      cnaePrimary: lead.cnaePrimary,
      foundingDate: lead.foundingDate,
      email: lead.rfEmail,
      source: 'pesca' as const,
    })
  }

  return allLeads
}

// --- Fase 2: Fallback cascata CNPJa + Assertiva (idem versao Airtable) ---

export async function fallbackEnrichLeads(
  leads: PescaLead[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<PescaLead[]> {
  const leadsWithoutMobile = leads.filter(l => !l.whatsapp)
  if (leadsWithoutMobile.length === 0) return leads

  let enrichedCount = 0

  for (const lead of leadsWithoutMobile) {
    if (signal?.aborted) break
    let decisorCpf: string | undefined

    // NIVEL 1: CNPJa
    try {
      const cnpj = lead.cnpj.replace(/\D/g, '')
      const office = await searchOffice(cnpj)
      const mobile = office.phones?.find(p => p.type === 'MOBILE')
      if (mobile) {
        lead.whatsapp = formatPhone(`${mobile.area}${mobile.number}`)
        enrichedCount++
        onProgress?.(enrichedCount)
        continue
      }
      if (office.company?.members?.length) {
        const decisor = office.company.members.find(m =>
          m.role.text.toLowerCase().includes('administrador') ||
          m.role.text.toLowerCase().includes('diretor') ||
          m.role.text.toLowerCase().includes('presidente'),
        ) || office.company.members[0]
        if (decisor?.person?.taxId && decisor.person.type === 'NATURAL') {
          decisorCpf = decisor.person.taxId.replace(/\D/g, '')
          if (!lead.decisorName && decisor.person.name) {
            lead.decisorName = decisor.person.name
            lead.decisorRole = decisor.role.text
          }
        }
      }
    } catch { /* nivel 1 falhou */ }

    // NIVEL 2: Assertiva CNPJ
    try {
      const assertivaData = await assertivaLookupCnpj(lead.cnpj) as any
      if (assertivaData?.telefones?.length) {
        const bestPhone = extractBestPhone(assertivaData.telefones)
        if (bestPhone.whatsapp) {
          lead.whatsapp = bestPhone.whatsapp
          enrichedCount++
          onProgress?.(enrichedCount)
          continue
        }
        if (bestPhone.landline && !lead.phone) lead.phone = bestPhone.landline
      }
      if (!decisorCpf && assertivaData?.socios?.length) {
        const socio = assertivaData.socios.find((s: any) =>
          (s.qualificacao || '').toLowerCase().includes('administrador') ||
          (s.qualificacao || '').toLowerCase().includes('diretor'),
        ) || assertivaData.socios[0]
        if (socio?.cpf) {
          decisorCpf = socio.cpf.replace(/\D/g, '')
          if (!lead.decisorName && socio.nome) {
            lead.decisorName = socio.nome
            lead.decisorRole = socio.qualificacao
          }
        }
      }
    } catch { /* nivel 2 falhou */ }

    // NIVEL 3: Assertiva CPF decisor
    if (decisorCpf && decisorCpf.length === 11) {
      try {
        const cpfData = await lookupCpf(decisorCpf) as any
        const telefones = cpfData?.resposta?.telefones
        if (telefones) {
          const celulares = telefones.celulares || telefones.moveis || []
          const fixos = telefones.fixos || []
          let found = false
          for (const cel of celulares) {
            const num = cel.numero?.replace(/\D/g, '') || ''
            if (num.length >= 10) { lead.whatsapp = formatPhone(num); found = true; break }
          }
          if (!found && fixos.length > 0) {
            const num = fixos[0].numero?.replace(/\D/g, '') || ''
            if (num.length >= 10) { lead.phone = lead.phone || formatPhone(num); found = true }
          }
          if (found && !lead.decisorName && cpfData?.resposta?.dadosCadastrais?.nome) {
            lead.decisorName = cpfData.resposta.dadosCadastrais.nome
          }
        }
      } catch { /* nivel 3 falhou */ }
    }

    // NIVEL 4: varredura CPF de todos socios
    if (!lead.whatsapp && !lead.phone) {
      try {
        const cnpj = lead.cnpj.replace(/\D/g, '')
        const assertivaData = await assertivaLookupCnpj(cnpj) as any
        const socios = assertivaData?.socios || []
        for (const socio of socios) {
          if (lead.whatsapp) break
          const cpf = socio?.cpf?.replace(/\D/g, '')
          if (!cpf || cpf.length !== 11 || cpf === decisorCpf) continue
          try {
            const cpfData = await lookupCpf(cpf) as any
            const tels = cpfData?.resposta?.telefones
            if (tels) {
              const celulares = tels.celulares || tels.moveis || []
              const fixos = tels.fixos || []
              for (const cel of celulares) {
                const num = cel.numero?.replace(/\D/g, '') || ''
                if (num.length >= 10) {
                  lead.whatsapp = formatPhone(num)
                  if (!lead.decisorName && socio.nome) { lead.decisorName = socio.nome; lead.decisorRole = socio.qualificacao || 'Socio' }
                  break
                }
              }
              if (!lead.whatsapp && fixos.length > 0) {
                const num = fixos[0].numero?.replace(/\D/g, '') || ''
                if (num.length >= 10) {
                  lead.phone = formatPhone(num)
                  if (!lead.decisorName && socio.nome) { lead.decisorName = socio.nome; lead.decisorRole = socio.qualificacao || 'Socio' }
                }
              }
            }
          } catch { /* CPF deste socio falhou */ }
        }
      } catch { /* varredura falhou */ }
    }

    enrichedCount++
    onProgress?.(enrichedCount)
  }

  return leads
}

function findDecisor(socios: Array<{ nome: string; qualificacao: string }>): { nome: string; qualificacao: string } | undefined {
  return socios.find(s =>
    s.qualificacao.toLowerCase().includes('administrador') ||
    s.qualificacao.toLowerCase().includes('diretor') ||
    s.qualificacao.toLowerCase().includes('presidente'),
  ) || socios[0]
}

// --- Fase 5: Enriquecimento Assertiva em batch ---

export async function enrichBatchWithAssertiva(
  leadIds: string[],
  onProgress?: (enriched: number) => void,
  signal?: AbortSignal,
): Promise<{ enriched: number; failed: number }> {
  let enrichedCount = 0
  let failedCount = 0
  const batchSize = 5

  for (let i = 0; i < leadIds.length; i += batchSize) {
    if (signal?.aborted) break
    const batch = leadIds.slice(i, i + batchSize)
    await Promise.allSettled(batch.map(async (leadId) => {
      if (signal?.aborted) return

      // Le lead atual do Supabase para obter CNPJ + dados existentes
      const currentLead = await getLead(leadId).catch(() => null)
      const cnpj = currentLead?.cnpj?.replace(/\D/g, '')
      if (!cnpj) return

      try {
        const assertivaData = await assertivaLookupCnpj(cnpj) as any
        const leadUpdate: Partial<Lead> = {}

        if (assertivaData?.telefones?.length) {
          const bestPhone = extractBestPhone(assertivaData.telefones)
          if (bestPhone.whatsapp) {
            leadUpdate.assertivaPhoneValidated = bestPhone.whatsapp
            leadUpdate.assertivaWhatsappFlag = true
            leadUpdate.rfPhone = bestPhone.whatsapp
          } else if (bestPhone.landline) {
            leadUpdate.assertivaPhoneValidated = bestPhone.landline
            leadUpdate.assertivaWhatsappFlag = false
            if (!currentLead?.rfPhone) leadUpdate.rfPhone = bestPhone.landline
          }
        }

        if (assertivaData?._quantidadeFuncionarios) leadUpdate.employees = Number(assertivaData._quantidadeFuncionarios)
        if (assertivaData?.emails?.length) leadUpdate.assertivaEmailValidated = assertivaData.emails[0].endereco

        if (assertivaData?.socios?.length) {
          const decisor = assertivaData.socios.find((s: any) =>
            (s.qualificacao || '').toLowerCase().includes('administrador') ||
            (s.qualificacao || '').toLowerCase().includes('diretor'),
          ) || assertivaData.socios[0]
          if (decisor?.cpf) leadUpdate.assertivaCpfDecisor = decisor.cpf
        }

        if (assertivaData?._redesSociais) {
          if (assertivaData._redesSociais.instagram && !currentLead?.instagram) leadUpdate.instagram = assertivaData._redesSociais.instagram
          if (assertivaData._redesSociais.facebook && !currentLead?.facebook) leadUpdate.facebook = assertivaData._redesSociais.facebook
          if (assertivaData._redesSociais.linkedin && !currentLead?.linkedin) leadUpdate.linkedin = assertivaData._redesSociais.linkedin
          leadUpdate.assertivaSocialMedia = JSON.stringify(assertivaData._redesSociais)
        }

        if (assertivaData?._faturamentoPresumido && !currentLead?.monthlyRevenue) leadUpdate.monthlyRevenue = Number(assertivaData._faturamentoPresumido)
        if (assertivaData?._scoreCredito) leadUpdate.assertivaCreditScore = Number(assertivaData._scoreCredito)
        if (assertivaData?._rendaPresumida) leadUpdate.assertivaIncomeEstimate = Number(assertivaData._rendaPresumida)

        if (!currentLead?.website) {
          if (assertivaData?._site) {
            leadUpdate.website = assertivaData._site.startsWith('http') ? assertivaData._site : `https://${assertivaData._site}`
          } else if (assertivaData?.emails?.length) {
            const corpEmail = assertivaData.emails.find((e: any) => {
              const domain = (e.endereco || e.email || '').split('@')[1] || ''
              return domain && !/gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(domain)
            })
            if (corpEmail) {
              const domain = (corpEmail.endereco || corpEmail.email).split('@')[1]
              leadUpdate.website = `https://${domain}`
            }
          }
        }

        leadUpdate.enrichmentStatus = 'complete' as any

        const protocolo = assertivaData?._protocolo
        if (protocolo) {
          try {
            const decisores = await getDecisionMakers(cnpj, protocolo)
            if (decisores.length > 0) {
              const decisor = decisores[0]
              const phones = extractBestPhone(decisor.telefones || [])
              if (phones.whatsapp || decisor.emails?.[0]?.endereco) {
                await createContact({
                  leadId,
                  name: decisor.nome,
                  role: decisor.cargo,
                  contactType: 'decisor',
                  whatsapp: phones.whatsapp || '',
                  email: decisor.emails?.[0]?.endereco,
                  source: 'assertiva',
                  whatsappConfirmed: !!phones.whatsapp,
                  phoneIsHot: (phones as any).phoneIsHot,
                })
              }
            }
          } catch { /* decisores sao complementares */ }
        }

        const decisorCpf = leadUpdate.assertivaCpfDecisor || assertivaData?.socios?.[0]?.cpf
        if (decisorCpf) {
          try {
            const cpfData = await lookupCpf(decisorCpf)
            if (cpfData.rendaEstimada) leadUpdate.assertivaIncomeEstimate = cpfData.rendaEstimada
            if (cpfData.redesSociais) {
              if (cpfData.redesSociais.instagram && !currentLead?.instagram) leadUpdate.instagram = cpfData.redesSociais.instagram
              if (cpfData.redesSociais.facebook && !currentLead?.facebook) leadUpdate.facebook = cpfData.redesSociais.facebook
              if (cpfData.redesSociais.linkedin && !currentLead?.linkedin) leadUpdate.linkedin = cpfData.redesSociais.linkedin
            }
            if (cpfData.telefones?.length && !leadUpdate.rfPhone) {
              const personalPhone = extractBestPhone(cpfData.telefones)
              if (personalPhone.whatsapp) leadUpdate.rfPhone = personalPhone.whatsapp
              else if (personalPhone.landline) leadUpdate.rfPhone = personalPhone.landline
            }
          } catch { /* CPF lookup complementar */ }
        }

        // NIVEL 4: varredura de socios se ainda sem telefone
        if (!leadUpdate.rfPhone && !currentLead?.rfPhone) {
          const socios = assertivaData?.socios || []
          for (const socio of socios) {
            if (leadUpdate.rfPhone) break
            const cpf = socio?.cpf?.replace(/\D/g, '')
            if (!cpf || cpf.length !== 11) continue
            try {
              const cpfData = await lookupCpf(cpf) as any
              const tels = cpfData?.resposta?.telefones || cpfData?.telefones
              if (tels) {
                const celulares = tels.celulares || tels.moveis || []
                const fixos = tels.fixos || []
                for (const cel of celulares) {
                  const num = cel.numero?.replace(/\D/g, '') || ''
                  if (num.length >= 10) { leadUpdate.rfPhone = formatPhone(num); break }
                }
                if (!leadUpdate.rfPhone && fixos.length > 0) {
                  const num = fixos[0].numero?.replace(/\D/g, '') || ''
                  if (num.length >= 10) leadUpdate.rfPhone = formatPhone(num)
                }
              }
            } catch { /* socio sem dados */ }
          }
        }

        // Trava dominante recalculada
        const mergedForTrava = { ...currentLead, ...leadUpdate } as Partial<Lead>
        const travasDetectadas = detectTravas(mergedForTrava)
        if (travasDetectadas.length > 0) {
          leadUpdate.hypotheticalTrap = `${travasDetectadas[0].codigo} ${travasDetectadas[0].nome}`
        }

        await updateLead(leadId, leadUpdate)
        enrichedCount++
      } catch (err) {
        failedCount++
        console.warn(`ASSERTIVA ENRICH falhou para lead ${leadId}:`, err instanceof Error ? err.message : err)
      }
    }))

    onProgress?.(enrichedCount)
    if (i + batchSize < leadIds.length) await delay(1000)
  }

  return { enriched: enrichedCount, failed: failedCount }
}

// --- Deduplicacao ---

export async function loadExistingDedup(signal?: AbortSignal): Promise<{ cnpjs: Set<string>; phones: Set<string> }> {
  const cnpjs = new Set<string>()
  const phones = new Set<string>()
  let leadsFailed = false
  let contactsFailed = false

  try {
    if (signal?.aborted) throw new Error('Aborted')
    const { data, error } = await supabase.from('leads').select('cnpj').is('deleted_at', null)
    throwIfError(error, 'loadExistingDedup.leads')
    for (const r of (data || [])) {
      const cnpj = (r as any).cnpj?.replace(/\D/g, '')
      if (cnpj) cnpjs.add(cnpj)
    }
  } catch (err) {
    if (signal?.aborted) throw err
    console.warn('PESCA: falha ao carregar leads para dedup')
    leadsFailed = true
  }

  try {
    if (signal?.aborted) throw new Error('Aborted')
    const { data, error } = await supabase.from('contacts').select('whatsapp,whatsapp_e164').is('deleted_at', null)
    throwIfError(error, 'loadExistingDedup.contacts')
    for (const r of (data || [])) {
      const w = (r as any).whatsapp || (r as any).whatsapp_e164
      const phone = w?.replace(/\D/g, '')
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
    if (lead.cnpj) {
      const cnpj = lead.cnpj.replace(/\D/g, '')
      if (seenCnpjs.has(cnpj) || existingCnpjs.has(cnpj)) continue
      seenCnpjs.add(cnpj)
    } else {
      const normalizedName = lead.companyName.toLowerCase().trim()
      if (seenNames.has(normalizedName)) continue
      seenNames.add(normalizedName)
    }
    if (lead.whatsapp) {
      const phoneDigits = lead.whatsapp.replace(/\D/g, '')
      if (existingPhones.has(phoneDigits)) continue
    }
    result.push(lead)
  }
  return result
}

// --- Save no Supabase ---

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

/**
 * Persiste resultados do PESCA no Supabase.
 * Nome mantido `savePescaToAirtable` para compat com callers em PescaPanel/usePesca.
 * @deprecated Use o nome `savePescaToSupabase` em novos callers.
 */
export async function savePescaToAirtable(
  leads: PescaLead[],
  onProgress?: (saved: number) => void,
  signal?: AbortSignal,
): Promise<SaveResult> {
  return savePescaToSupabase(leads, onProgress, signal)
}

export async function savePescaToSupabase(
  leads: PescaLead[],
  onProgress?: (saved: number) => void,
  signal?: AbortSignal,
): Promise<SaveResult> {
  const validLeads = leads.filter(l => l.decisorName && (l.whatsapp || l.phone))
  if (validLeads.length < leads.length) {
    console.warn(`PESCA: ${leads.length - validLeads.length} leads descartados por falta de decisor ou telefone`)
  }

  const leadIds: string[] = []
  let savedContacts = 0

  // Cria 1 a 1 (createLead ja sabe gerar airtable_record_id e inserir social via upsert)
  for (let i = 0; i < validLeads.length; i++) {
    if (signal?.aborted) break

    const lead = validLeads[i]
    const partialLead: Partial<Lead> = {
      cnpj: lead.cnpj,
      capitalSocial: lead.capitalSocial,
      foundingDate: lead.foundingDate,
      city: lead.city,
      state: lead.state,
      rfEmail: lead.email,
      rfPhone: lead.whatsapp || lead.phone,
      phoneType: lead.whatsapp ? 'MOBILE' : (lead.phone ? 'LANDLINE' : undefined),
    }
    const spiced = calculateSpicedDimensions(partialLead)
    const score = calculateSpicedScore(spiced.spicedS, spiced.spicedP, spiced.spicedI, spiced.spicedC, spiced.spicedD)
    const temperature = getTemperatureFromScore(score)

    try {
      const created = await createLead({
        companyName: lead.companyName,
        tradeName: lead.tradeName,
        cnpj: lead.cnpj || undefined,
        segment: lead.segment || '',
        status: 'Novo',
        score,
        temperature,
        spicedS: spiced.spicedS,
        spicedP: spiced.spicedP,
        spicedI: spiced.spicedI,
        spicedC: spiced.spicedC,
        spicedD: spiced.spicedD,
        tier: calculateTier(lead.capitalSocial),
        state: lead.state,
        city: lead.city,
        address: lead.address,
        rfPhone: lead.whatsapp || lead.phone,
        rfEmail: lead.email,
        capitalSocial: lead.capitalSocial,
        foundingDate: lead.foundingDate,
        cnaePrimary: lead.cnaePrimary,
        enrichmentStatus: (lead.whatsapp || lead.phone) ? 'complete' : 'cnpja',
      })
      leadIds.push(created.id)

      if (lead.decisorName) {
        try {
          await createContact({
            leadId: created.id,
            name: lead.decisorName,
            role: lead.decisorRole,
            contactType: 'decisor',
            whatsapp: lead.whatsapp || lead.phone || '',
            source: 'cnpja',
          })
          savedContacts++
        } catch (err) {
          console.warn(`PESCA: falha ao salvar contact do lead ${created.id}:`, err)
        }
      }
    } catch (err: any) {
      console.error(`PESCA SAVE ERRO lead ${i + 1}/${validLeads.length}:`, err?.message || err)
    }

    onProgress?.(leadIds.length)
    // Throttle leve para nao saturar o Realtime/triggers do Supabase
    if ((i + 1) % 10 === 0) await delay(150)
  }

  return { savedLeads: leadIds.length, savedContacts, leadIds }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
