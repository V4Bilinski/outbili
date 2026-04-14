import { listAllRecords, createRecords, getRecord, updateRecords } from '../lib/airtable'
import { getCnaeCodesForCnpja } from '../lib/cnae-mapping'
import { formatPhone } from './enrichmentService'
import { detectTravas } from './strategicAnalysisService'
import { searchOffice, searchOfficesPaginated, mapCnpjaToLead, extractPartners } from './cnpjaService'
import { lookupCnpj as assertivaLookupCnpj, getDecisionMakers, extractBestPhone, lookupCpf } from './assertivaService'
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
  // REGRA OBRIGATÓRIA: todo lead DEVE ter decisor (nome) + telefone (celular ou fixo).
  // Leads sem decisor ou sem telefone são DESCARTADOS — proibido salvar lead incompleto.
  const allLeads: PescaLead[] = []

  for (const office of offices) {
    const lead = mapCnpjaToLead(office)
    const partners = extractPartners(office)
    const decisor = findDecisor(
      partners.map(p => ({ nome: p.name, qualificacao: p.qualification })),
    )

    // CNPJa ja classifica telefone como MOBILE/LANDLINE
    const mobilePhone = office.phones?.find(p => p.type === 'MOBILE')
    const anyPhone = office.phones?.[0]

    // VALIDAÇÃO OBRIGATÓRIA: decisor + telefone
    const decisorName = decisor?.nome
    const phone = anyPhone ? formatPhone(`${anyPhone.area}${anyPhone.number}`) : undefined
    if (!decisorName || !phone) continue // DESCARTA — proibido lead sem decisor ou telefone

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

// --- Fase 2: Fallback cascata CNPJa + Assertiva para leads sem celular ---
// Cascata de 3 niveis — foco no telefone do decisor/socio:
//   Nivel 1: CNPJa Company Read (custo 0) — busca socios com CPF
//   Nivel 2: Assertiva CNPJ — telefones validados da empresa + WhatsApp flag
//   Nivel 3: Assertiva CPF do decisor — telefone pessoal do socio-administrador

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

    // NIVEL 1: CNPJa consulta individual (usa cache, custo 0 se em cache)
    try {
      const cnpj = lead.cnpj.replace(/\D/g, '')
      const office = await searchOffice(cnpj)

      // Procurar celular nos telefones do office
      const mobile = office.phones?.find(p => p.type === 'MOBILE')
      if (mobile) {
        lead.whatsapp = formatPhone(`${mobile.area}${mobile.number}`)
        enrichedCount++
        onProgress?.(enrichedCount)
        continue
      }

      // Guardar CPF do decisor para nivel 3
      if (office.company?.members?.length) {
        const decisor = office.company.members.find(m =>
          m.role.text.toLowerCase().includes('administrador') ||
          m.role.text.toLowerCase().includes('diretor') ||
          m.role.text.toLowerCase().includes('presidente'),
        ) || office.company.members[0]
        if (decisor?.person?.taxId && decisor.person.type === 'NATURAL') {
          decisorCpf = decisor.person.taxId.replace(/\D/g, '')
          // Atualizar nome do decisor se nao tinha
          if (!lead.decisorName && decisor.person.name) {
            lead.decisorName = decisor.person.name
            lead.decisorRole = decisor.role.text
          }
        }
      }
    } catch { /* nivel 1 falhou, tentar nivel 2 */ }

    // NIVEL 2: Assertiva CNPJ (telefones empresa validados + WhatsApp flag)
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
        // Se achou telefone fixo mas nao celular, salvar como phone
        if (bestPhone.landline && !lead.phone) {
          lead.phone = bestPhone.landline
        }
      }
      // Guardar CPF do decisor se nivel 1 nao encontrou
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
    } catch { /* nivel 2 falhou, tentar nivel 3 */ }

    // NIVEL 3: Assertiva CPF do decisor (telefone pessoal — celular OU fixo)
    if (decisorCpf && decisorCpf.length === 11) {
      try {
        const cpfData = await lookupCpf(decisorCpf) as any
        const telefones = cpfData?.resposta?.telefones
        if (telefones) {
          // Prioridade: celular (WhatsApp) > fixo pessoal
          const celulares = telefones.celulares || telefones.moveis || []
          const fixos = telefones.fixos || []
          let found = false

          // Tentar celular primeiro
          for (const cel of celulares) {
            const num = cel.numero?.replace(/\D/g, '') || ''
            if (num.length >= 10) {
              lead.whatsapp = formatPhone(num)
              found = true
              break
            }
          }

          // Se não achou celular, pegar fixo pessoal como fallback
          if (!found && fixos.length > 0) {
            const num = fixos[0].numero?.replace(/\D/g, '') || ''
            if (num.length >= 10) {
              lead.phone = lead.phone || formatPhone(num)
              found = true
            }
          }

          // Atualizar nome do decisor se disponível
          if (found && !lead.decisorName && cpfData?.resposta?.dadosCadastrais?.nome) {
            lead.decisorName = cpfData.resposta.dadosCadastrais.nome
          }
        }
      } catch { /* nivel 3 falhou, tentar nivel 4 */ }
    }

    // NIVEL 4: Assertiva CPF de TODOS os sócios (varredura completa)
    // Se nenhum nível anterior encontrou celular, buscar CPF de cada sócio até achar
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
            const telefones = cpfData?.resposta?.telefones
            if (telefones) {
              const celulares = telefones.celulares || telefones.moveis || []
              const fixos = telefones.fixos || []

              for (const cel of celulares) {
                const num = cel.numero?.replace(/\D/g, '') || ''
                if (num.length >= 10) {
                  lead.whatsapp = formatPhone(num)
                  if (!lead.decisorName && socio.nome) {
                    lead.decisorName = socio.nome
                    lead.decisorRole = socio.qualificacao || 'Sócio'
                  }
                  break
                }
              }

              if (!lead.whatsapp && fixos.length > 0) {
                const num = fixos[0].numero?.replace(/\D/g, '') || ''
                if (num.length >= 10) {
                  lead.phone = formatPhone(num)
                  if (!lead.decisorName && socio.nome) {
                    lead.decisorName = socio.nome
                    lead.decisorRole = socio.qualificacao || 'Sócio'
                  }
                }
              }
            }
          } catch { /* CPF deste sócio falhou, tentar próximo */ }
        }
      } catch { /* varredura de sócios falhou */ }
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

// --- Fase 5: Enriquecimento Assertiva em batch (automatico apos salvar) ---

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
    await Promise.allSettled(
      batch.map(async (leadId) => {
        if (signal?.aborted) return

        // Buscar lead do Airtable para obter CNPJ
        const leadRecord = await getRecord<Lead>('Leads', leadId)
        const cnpj = leadRecord.fields.cnpj?.replace(/\D/g, '')
        if (!cnpj) return

        try {
          // Consulta Assertiva CNPJ — telefones, emails, socios
          const assertivaData = await assertivaLookupCnpj(cnpj) as any
          const leadUpdate: Partial<Lead> = {
          }

          // Telefone validado — PRIORIDADE: atualizar rfPhone com melhor telefone
          if (assertivaData?.telefones?.length) {
            const bestPhone = extractBestPhone(assertivaData.telefones)
            if (bestPhone.whatsapp) {
              leadUpdate.assertivaPhoneValidated = bestPhone.whatsapp
              leadUpdate.assertivaWhatsappFlag = true
              // CRITICO: atualizar rfPhone com WhatsApp validado (prioridade maxima)
              leadUpdate.rfPhone = bestPhone.whatsapp
            } else if (bestPhone.landline) {
              leadUpdate.assertivaPhoneValidated = bestPhone.landline
              leadUpdate.assertivaWhatsappFlag = false
              // Atualizar rfPhone se nao tinha telefone
              const currentPhone = leadRecord.fields.rfPhone
              if (!currentPhone) {
                leadUpdate.rfPhone = bestPhone.landline
              }
            }
          }

          // Quantidade de funcionarios (dado real Assertiva)
          if (assertivaData?._quantidadeFuncionarios) {
            leadUpdate.employees = Number(assertivaData._quantidadeFuncionarios)
          }

          // Email validado
          if (assertivaData?.emails?.length) {
            leadUpdate.assertivaEmailValidated = assertivaData.emails[0].endereco
          }

          // CPF do decisor (do QSA Assertiva)
          if (assertivaData?.socios?.length) {
            const decisor = assertivaData.socios.find((s: any) =>
              (s.qualificacao || '').toLowerCase().includes('administrador') ||
              (s.qualificacao || '').toLowerCase().includes('diretor'),
            ) || assertivaData.socios[0]
            if (decisor?.cpf) {
              leadUpdate.assertivaCpfDecisor = decisor.cpf
            }
          }

          // Redes sociais da Assertiva
          if (assertivaData?._redesSociais) {
            if (assertivaData._redesSociais.instagram && !leadRecord.fields.instagram) {
              leadUpdate.instagram = assertivaData._redesSociais.instagram
            }
            if (assertivaData._redesSociais.facebook && !leadRecord.fields.facebook) {
              leadUpdate.facebook = assertivaData._redesSociais.facebook
            }
            if (assertivaData._redesSociais.linkedin && !leadRecord.fields.linkedin) {
              leadUpdate.linkedin = assertivaData._redesSociais.linkedin
            }
            leadUpdate.assertivaSocialMedia = JSON.stringify(assertivaData._redesSociais)
          }

          // Faturamento presumido
          if (assertivaData?._faturamentoPresumido && !leadRecord.fields.monthlyRevenue) {
            leadUpdate.monthlyRevenue = Number(assertivaData._faturamentoPresumido)
          }

          // Score de crédito
          if (assertivaData?._scoreCredito) {
            leadUpdate.assertivaCreditScore = Number(assertivaData._scoreCredito)
          }

          // Renda presumida
          if (assertivaData?._rendaPresumida) {
            leadUpdate.assertivaIncomeEstimate = Number(assertivaData._rendaPresumida)
          }

          // Website da Assertiva (se não tinha)
          if (assertivaData?._site && !leadRecord.fields.website) {
            leadUpdate.website = assertivaData._site.startsWith('http')
              ? assertivaData._site
              : `https://${assertivaData._site}`
          }

          // CNPJa já rodou (lead foi salvo com 'cnpja') + Assertiva concluiu = complete
          leadUpdate.enrichmentStatus = 'complete' as any

          // Decisores com telefone/WhatsApp — atualizar Contacts
          const protocolo = assertivaData?._protocolo
          if (protocolo) {
            try {
              const decisores = await getDecisionMakers(cnpj, protocolo)
              if (decisores.length > 0) {
                const decisor = decisores[0]
                const phones = extractBestPhone(decisor.telefones || [])
                if (phones.whatsapp || decisor.emails?.[0]?.endereco) {
                  await createRecords<Contact>('Contacts', [{
                    fields: {
                      leadId,
                      name: decisor.nome,
                      role: decisor.cargo,
                      contactType: 'decisor',
                      whatsapp: phones.whatsapp || '',
                      email: decisor.emails?.[0]?.endereco,
                      source: 'assertiva',
                      whatsappConfirmed: !!phones.whatsapp,
                      phoneIsHot: phones.phoneIsHot,
                    } as Partial<Contact>,
                  }])
                }
              }
            } catch { /* decisores sao complementares */ }
          }

          // Lookup CPF do decisor — renda estimada, redes sociais pessoais
          const decisorCpf = leadUpdate.assertivaCpfDecisor || assertivaData?.socios?.[0]?.cpf
          if (decisorCpf) {
            try {
              const cpfData = await lookupCpf(decisorCpf)
              if (cpfData.rendaEstimada) {
                leadUpdate.assertivaIncomeEstimate = cpfData.rendaEstimada
              }
              if (cpfData.redesSociais) {
                if (cpfData.redesSociais.instagram && !leadRecord.fields.instagram) {
                  leadUpdate.instagram = cpfData.redesSociais.instagram
                }
                if (cpfData.redesSociais.facebook && !leadRecord.fields.facebook) {
                  leadUpdate.facebook = cpfData.redesSociais.facebook
                }
                if (cpfData.redesSociais.linkedin && !leadRecord.fields.linkedin) {
                  leadUpdate.linkedin = cpfData.redesSociais.linkedin
                }
              }
              // Telefone pessoal como fallback (celular > fixo — PROIBIDO ficar sem telefone)
              if (cpfData.telefones?.length && !leadUpdate.rfPhone) {
                const personalPhone = extractBestPhone(cpfData.telefones)
                if (personalPhone.whatsapp) {
                  leadUpdate.rfPhone = personalPhone.whatsapp
                } else if (personalPhone.landline) {
                  leadUpdate.rfPhone = personalPhone.landline
                }
              }
            } catch { /* CPF lookup complementar */ }
          }

          // NÍVEL 4: Se AINDA não tem telefone, varrer CPF de TODOS os sócios
          if (!leadUpdate.rfPhone && !leadRecord.fields.rfPhone) {
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
                    if (num.length >= 10) {
                      leadUpdate.rfPhone = formatPhone(num)
                      break
                    }
                  }
                  if (!leadUpdate.rfPhone && fixos.length > 0) {
                    const num = fixos[0].numero?.replace(/\D/g, '') || ''
                    if (num.length >= 10) {
                      leadUpdate.rfPhone = formatPhone(num)
                    }
                  }
                }
              } catch { /* sócio sem dados, tentar próximo */ }
            }
          }

          // Calcular trava dominante (Fábrica de Receita) com dados atualizados
          const mergedForTrava = { ...leadRecord.fields, ...leadUpdate } as Partial<Lead>
          const travasDetectadas = detectTravas(mergedForTrava)
          if (travasDetectadas.length > 0) {
            leadUpdate.hypotheticalTrap = `${travasDetectadas[0].codigo} — ${travasDetectadas[0].nome}`
          }

          // Atualizar lead com dados completos + trava
          await updateRecords<Lead>('Leads', [{ id: leadId, fields: leadUpdate }])

          enrichedCount++
        } catch (err) {
          failedCount++
          console.warn(`ASSERTIVA ENRICH falhou para lead ${leadId}:`, err instanceof Error ? err.message : err)
        }
      }),
    )

    onProgress?.(enrichedCount)

    // Rate limit Assertiva: 1s entre batches
    if (i + batchSize < leadIds.length) {
      await delay(1000)
    }
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
  // GATE OBRIGATÓRIO: rejeitar leads sem decisor ou sem telefone
  const validLeads = leads.filter(l => l.decisorName && (l.whatsapp || l.phone))
  if (validLeads.length < leads.length) {
    console.warn(`PESCA: ${leads.length - validLeads.length} leads descartados por falta de decisor ou telefone`)
  }

  const leadIds: string[] = []
  const pendingContacts: Array<{ fields: Partial<Contact> }> = []

  for (let i = 0; i < validLeads.length; i += 10) {
    if (signal?.aborted) break

    const batch = validLeads.slice(i, i + 10)
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
        rfPhone: lead.whatsapp || lead.phone,
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

        if (originalLead.decisorName) {
          pendingContacts.push({
            fields: {
              leadId: createdLead.id,
              name: originalLead.decisorName,
              role: originalLead.decisorRole,
              contactType: 'decisor',
              // Prioridade: celular (WhatsApp) > telefone fixo
              whatsapp: originalLead.whatsapp || originalLead.phone || '',
              source: 'cnpja',
            } as Partial<Contact>,
          })
        }
      }
    } catch (err: any) {
      // Log detalhado do 422 para debugging
      const detail = err?.message || JSON.stringify(err)
      console.error(`PESCA SAVE ERRO batch ${i / 10 + 1} (${batch.length} leads):`, detail)
      console.error('Campos do primeiro lead do batch:', JSON.stringify(records[0]?.fields, null, 2))
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
