import { updateLead } from './leadService'
import { createContact, getContacts } from './contactService'
import { generateStrategicAnalysis, detectTravas } from './strategicAnalysisService'
import { searchOffice, mapCnpjaToLead, extractPartners } from './cnpjaService'
import { lookupCnpj as assertivaLookupCnpj, lookupCpf as assertivaLookupCpf, getDecisionMakers, extractBestPhone } from './assertivaService'
import { createPartners } from './partnerService'
import { logEnrichmentStep } from './enrichmentLogService'
import { scrapeSocialLinksFromWebsite, isFirecrawlAvailable } from './firecrawlService'
import { classifySocialUrl, normalizeSocialUrl } from './socialMediaExtractor'
import type { Lead } from '../types'

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
    console.warn('CNPJa falhou:', cnpjaError)
    return null
  }
}

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

/**
 * SPICED Score v2 — alimentado 100% por CNPJá + Assertiva (CNPJ + CPF)
 *
 * Formula: Score = (S × 0.25) + (P × 0.25) + (I × 0.20) + (C × 0.15) + (D × 0.15)
 * Cada dimensão: 1–5. Score final: 1.0–5.0.
 * Temperatura: >= 3.7 Quente | >= 2.5 Morno | < 2.5 Frio
 *
 * Fontes:
 *   CNPJá  → employees (est.), foundingDate, capitalSocial, city/state, taxRegime,
 *            isHeadquarters, registrationStatus, statusDate, emailDomain, phoneType,
 *            simplesOptant, partners, cnpj, rfEmail, rfPhone
 *   Assertiva CNPJ → employees (real RAIS/CAGED), website, temGoogleMeuNegocio,
 *                     whatsappBusiness (fixos), telefones validados
 *   Assertiva CPF  → rendaEstimada, redesSociais pessoais, linkedin, whatsapp pessoal
 */
export function calculateSpicedDimensions(leadData: Partial<Lead>, merged: Partial<Lead> = {}): { spicedS: number; spicedP: number; spicedI: number; spicedC: number; spicedD: number } {
  const data = { ...leadData, ...merged }

  const yearsInMarket = data.yearsInMarket
    ?? (data.foundingDate
      ? Math.floor((Date.now() - new Date(data.foundingDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined)

  // ═══════════════════════════════════════════════════════════════════
  // S (Situação) 25% — porte, maturidade e contexto da empresa
  // Fontes: CNPJá (capitalSocial, foundingDate, address, isHeadquarters)
  //         Assertiva CNPJ (employees real RAIS/CAGED)
  // ═══════════════════════════════════════════════════════════════════
  let spicedS = 1
  if (data.employees && data.employees > 5) spicedS++      // Assertiva employees real
  if (data.employees && data.employees > 20) spicedS++     // Assertiva employees real
  if (yearsInMarket && yearsInMarket > 3) spicedS++        // CNPJá foundingDate
  if (data.city && data.state) spicedS++                   // CNPJá address
  if (data.capitalSocial && data.capitalSocial >= 100000) spicedS++ // CNPJá equity
  if (data.isHeadquarters) spicedS++                       // CNPJá head (matriz = mais relevante)

  // ═══════════════════════════════════════════════════════════════════
  // P (Dor/Pain) 25% — sinais de fragilidade digital e operacional
  // Fontes: Assertiva CNPJ (website, temGoogleMeuNegocio, whatsappBusiness)
  //         CNPJá (emailDomain, phoneType, capitalSocial, foundingDate, simplesOptant)
  //         Assertiva CPF (redesSociais pessoais como fallback)
  // ═══════════════════════════════════════════════════════════════════
  let spicedP = 1
  if (!data.website) spicedP++                              // Assertiva _site: sem website = dor
  if (!data.instagram) spicedP++                            // Assertiva redesSociais: sem Instagram = dor
  // Email genérico (gmail, hotmail, yahoo, outlook) = marketing amador
  const emailDomain = data.emailDomain || (data.rfEmail?.split('@')[1]) || ''
  const isGenericEmail = /gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(emailDomain)
  if (isGenericEmail || !emailDomain) spicedP++
  // Só telefone fixo, sem celular = difícil alcançar
  if (data.phoneType === 'LANDLINE' || (!data.assertivaWhatsappFlag && data.rfPhone)) spicedP++
  // Capital baixo e empresa antiga = estagnação
  if (data.capitalSocial && data.capitalSocial < 50000 && yearsInMarket && yearsInMarket > 5) spicedP++
  // Simples Nacional com muitos funcionários = pode estar limitando crescimento
  if (data.simplesOptant && data.employees && data.employees > 10) spicedP++

  // ═══════════════════════════════════════════════════════════════════
  // I (Impacto) 20% — potencial financeiro e capacidade de investimento
  // Fontes: Assertiva CPF (rendaEstimada do decisor)
  //         CNPJá (capitalSocial, taxRegime)
  //         Assertiva CNPJ (employees real)
  // ═══════════════════════════════════════════════════════════════════
  let spicedI = 1
  const revenue = data.monthlyRevenue || 0
  const rendaDecisor = data.assertivaIncomeEstimate || 0
  if (revenue > 0) {
    // Faturamento da empresa (Assertiva CNPJ _faturamentoPresumido ou estimado)
    if (revenue >= 100000) spicedI++
    if (revenue >= 200000) spicedI++
    if (revenue >= 500000) spicedI++
  } else if (rendaDecisor > 0) {
    // Renda do decisor como proxy de porte (Assertiva CPF)
    if (rendaDecisor >= 10000) spicedI++   // R$ 10k+ = empresa minimamente estruturada
    if (rendaDecisor >= 30000) spicedI++   // R$ 30k+ = empresa média
    if (rendaDecisor >= 100000) spicedI++  // R$ 100k+ = empresa grande
  } else if (data.capitalSocial) {
    // Capital social como último proxy (CNPJá)
    if (data.capitalSocial >= 50000) spicedI++
    if (data.capitalSocial >= 200000) spicedI++
    if (data.capitalSocial >= 500000) spicedI++
  }
  // Regime tributário indica porte real (CNPJá)
  if (data.taxRegime === 'lucro_presumido' || data.taxRegime === 'lucro_real') spicedI++
  // Muitos funcionários = operação com escala = impacto alto (Assertiva)
  if (data.employees && data.employees > 50) spicedI++

  // ═══════════════════════════════════════════════════════════════════
  // C (Evento Crítico) 15% — urgência e timing
  // Fontes: CNPJá (foundingDate, statusDate, registrationStatus)
  //         Assertiva CNPJ (whatsappConfirmed, phoneIsHot)
  // ═══════════════════════════════════════════════════════════════════
  let spicedC = 1
  if (yearsInMarket !== undefined && yearsInMarket < 2) spicedC += 2  // CNPJá: empresa nova = momento decisão
  // Decisor com WhatsApp validado = canal aberto (Assertiva)
  if (data.assertivaWhatsappFlag) spicedC++
  // Status mudou nos últimos 6 meses = momento de transição (CNPJá)
  if (data.statusDate) {
    const statusDate = new Date(data.statusDate)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    if (!isNaN(statusDate.getTime()) && statusDate > sixMonthsAgo) spicedC++
  }
  // Empresa recém-ativa com menos de 1 ano (CNPJá)
  if (data.registrationStatus === 'Ativa' && yearsInMarket !== undefined && yearsInMarket < 1) spicedC++

  // ═══════════════════════════════════════════════════════════════════
  // D (Decisão) 15% — acesso ao decisor e canal de contato
  // Fontes: CNPJá (cnpj, partners, rfEmail, rfPhone)
  //         Assertiva CNPJ/CPF (whatsappConfirmed, linkedin, website)
  // ═══════════════════════════════════════════════════════════════════
  let spicedD = 1
  if (data.cnpj) spicedD++                                   // CNPJá: CNPJ identificado
  if (data.partners) spicedD++                               // CNPJá: sócios (QSA) identificados
  if (data.rfEmail || data.assertivaEmailValidated) spicedD++ // CNPJá/Assertiva: email disponível
  if (data.assertivaWhatsappFlag) spicedD++                  // Assertiva: WhatsApp confirmado do decisor
  if (data.linkedin || data.website) spicedD++               // Assertiva: presença digital acessível

  // Cap: todas as dimensões entre 1 e 5
  const cap = (n: number) => Math.min(5, Math.max(1, n))
  return { spicedS: cap(spicedS), spicedP: cap(spicedP), spicedI: cap(spicedI), spicedC: cap(spicedC), spicedD: cap(spicedD) }
}

export function generateSpicedDescriptions(leadData: Partial<Lead>): Record<string, string> {
  const data = leadData
  const yearsInMarket = data.yearsInMarket
    ?? (data.foundingDate
      ? Math.floor((Date.now() - new Date(data.foundingDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined)

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

  // S — Situação
  const sFragments: string[] = []
  if (data.employees && data.employees > 20) sFragments.push(`Equipe com ${data.employees} colaboradores`)
  else if (data.employees && data.employees > 5) sFragments.push(`Equipe de ${data.employees} colaboradores`)
  if (yearsInMarket && yearsInMarket > 3) sFragments.push(`${yearsInMarket} anos no mercado`)
  else if (yearsInMarket !== undefined) sFragments.push(`${yearsInMarket} ano(s) no mercado`)
  if (data.city && data.state) sFragments.push(`Localizada em ${data.city}, ${data.state}`)
  if (data.capitalSocial && data.capitalSocial >= 100000) sFragments.push(`Capital social de ${fmt(data.capitalSocial)}`)
  if (data.isHeadquarters) sFragments.push('Matriz (sede principal)')

  // P — Dor
  const pFragments: string[] = []
  if (!data.website) pFragments.push('Sem website identificado')
  if (!data.instagram) pFragments.push('Sem presença no Instagram')
  const emailDomain = data.emailDomain || (data.rfEmail?.split('@')[1]) || ''
  const isGenericEmail = /gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(emailDomain)
  if (isGenericEmail) pFragments.push('E-mail genérico indica marketing amador')
  else if (!emailDomain) pFragments.push('Sem e-mail corporativo identificado')
  if (data.phoneType === 'LANDLINE' || (!data.assertivaWhatsappFlag && data.rfPhone)) pFragments.push('Apenas telefone fixo, sem WhatsApp')
  if (data.capitalSocial && data.capitalSocial < 50000 && yearsInMarket && yearsInMarket > 5) pFragments.push(`Capital social baixo com ${yearsInMarket} anos. Possível estagnação.`)
  if (data.simplesOptant && data.employees && data.employees > 10) pFragments.push(`Simples Nacional com ${data.employees}+ funcionários. Pode limitar crescimento.`)

  // I — Impacto
  const iFragments: string[] = []
  const revenue = data.monthlyRevenue || 0
  const rendaDecisor = data.assertivaIncomeEstimate || 0
  if (revenue > 0) {
    iFragments.push(`Faturamento estimado de ${fmt(revenue)}/mês`)
  } else if (rendaDecisor > 0) {
    iFragments.push(`Renda do decisor estimada em ${fmt(rendaDecisor)}`)
  } else if (data.capitalSocial) {
    iFragments.push(`Capital social de ${fmt(data.capitalSocial)}`)
  }
  if (data.taxRegime === 'lucro_presumido') iFragments.push('Regime Lucro Presumido indica operação estruturada')
  else if (data.taxRegime === 'lucro_real') iFragments.push('Regime Lucro Real indica operação de grande porte')
  if (data.employees && data.employees > 50) iFragments.push(`Operação com ${data.employees} colaboradores indica escala`)

  // CE — Evento Crítico
  const cFragments: string[] = []
  if (yearsInMarket !== undefined && yearsInMarket < 2) cFragments.push('Empresa nova. Momento de decisão.')
  if (data.assertivaWhatsappFlag) cFragments.push('WhatsApp do decisor confirmado. Canal aberto.')
  if (data.statusDate) {
    const statusDate = new Date(data.statusDate)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
    if (!isNaN(statusDate.getTime()) && statusDate > sixMonthsAgo) cFragments.push('Mudança de status cadastral recente. Momento de transição.')
  }
  if (data.registrationStatus === 'Ativa' && yearsInMarket !== undefined && yearsInMarket < 1) cFragments.push('Empresa recém-ativada')

  // D — Decisão
  const dFragments: string[] = []
  if (data.cnpj) dFragments.push('CNPJ identificado')
  if (data.partners) dFragments.push('Sócios/QSA mapeados')
  if (data.rfEmail || data.assertivaEmailValidated) dFragments.push('E-mail de contato disponível')
  if (data.assertivaWhatsappFlag) dFragments.push('WhatsApp do decisor confirmado')
  if (data.linkedin) dFragments.push('LinkedIn identificado')
  if (data.website) dFragments.push('Website ativo')

  const join = (fragments: string[]) => fragments.length > 0 ? fragments.join('. ') + '.' : 'Dados insuficientes para análise.'

  return {
    S: join(sFragments),
    P: join(pFragments),
    I: join(iFragments),
    C: join(cFragments),
    D: join(dFragments),
  }
}

export async function enrichLead(
  leadId: string,
  leadData: Partial<Lead>,
  onProgress?: (progress: EnrichmentProgress) => void,
): Promise<Partial<Lead>> {
  // Pipeline v2: apenas CNPJá + Assertiva (CNPJ + decisores + CPF) + Strategic Analysis
  const steps: EnrichmentStep[] = [
    { source: 'cnpj', status: !leadData.cnpj ? 'skipped' : (leadData.enrichmentStatus !== 'none' && leadData.tradeName && leadData.employees && leadData.foundingDate) ? 'skipped' : 'pending', label: 'CNPJá (dados cadastrais)', estimatedMs: 3000 },
    { source: 'assertiva', status: !leadData.cnpj ? 'skipped' : 'pending', label: 'Assertiva (telefones + redes + renda + decisores)', estimatedMs: 8000 },
    { source: 'firecrawl', status: isFirecrawlAvailable() ? 'pending' : 'skipped', label: 'Firecrawl (redes sociais fallback)', estimatedMs: 10000 },
    { source: 'strategic', status: 'pending', label: 'SPICED + Análise Estratégica', estimatedMs: 500 },
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

  // Classify a URL to the correct field usando o helper centralizado
  // Mantém assinatura local para backwards-compat com mergeField abaixo.
  const classifyUrl = (url: string): { field: keyof Lead; value: string } | null => {
    const classified = classifySocialUrl(url)
    if (!classified) return null
    return { field: classified.platform as keyof Lead, value: classified.url }
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
          merged.assertivaPhoneValidated = bestPhone.whatsapp
          merged.assertivaWhatsappFlag = true
        } else if (bestPhone.landline) {
          merged.assertivaPhoneValidated = bestPhone.landline
          merged.assertivaWhatsappFlag = false
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
      // Website: Assertiva _site → fallback: inferir do domínio do email corporativo
      if (!merged.website && !leadData.website) {
        if (assertivaData?._site) {
          merged.website = assertivaData._site.startsWith('http')
            ? assertivaData._site
            : `https://${assertivaData._site}`
        } else if (assertivaData?.emails?.length) {
          const corpEmail = assertivaData.emails.find((e: any) => {
            const addr = e.endereco || e.email || ''
            const domain = addr.split('@')[1] || ''
            return domain && !/gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(domain)
          })
          if (corpEmail) {
            const domain = (corpEmail.endereco || corpEmail.email).split('@')[1]
            merged.website = `https://${domain}`
          }
        }
      }

      // Redes sociais da Assertiva (Instagram, Facebook, LinkedIn, TikTok)
      if (assertivaData?._redesSociais) {
        if (assertivaData._redesSociais.instagram && !merged.instagram) {
          merged.instagram = normalizeSocialUrl(assertivaData._redesSociais.instagram, 'instagram')
        }
        if (assertivaData._redesSociais.facebook && !merged.facebook) {
          merged.facebook = normalizeSocialUrl(assertivaData._redesSociais.facebook, 'facebook')
        }
        if (assertivaData._redesSociais.linkedin && !merged.linkedin) {
          merged.linkedin = normalizeSocialUrl(assertivaData._redesSociais.linkedin, 'linkedin')
        }
        if (assertivaData._redesSociais.tiktok && !merged.tiktok) {
          merged.tiktok = normalizeSocialUrl(assertivaData._redesSociais.tiktok, 'tiktok')
        }
        merged.assertivaSocialMedia = JSON.stringify(assertivaData._redesSociais)
      }

      // Email validado
      if (assertivaData?.emails?.length && !merged.assertivaEmailValidated) {
        merged.assertivaEmailValidated = assertivaData.emails[0].endereco
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

      // Lookup CPF do decisor — renda estimada, cargo, redes sociais pessoais
      const decisorCpf = assertivaData?.socios?.find((s: any) =>
        (s.qualificacao || '').toLowerCase().includes('administrador') ||
        (s.qualificacao || '').toLowerCase().includes('diretor'),
      )?.cpf || assertivaData?.socios?.[0]?.cpf
      if (decisorCpf) {
        merged.assertivaCpfDecisor = decisorCpf
        try {
          const cpfData = await assertivaLookupCpf(decisorCpf)
          // Renda estimada do decisor → proxy de faturamento/capacidade
          if (cpfData.rendaEstimada && !merged.assertivaIncomeEstimate) {
            merged.assertivaIncomeEstimate = cpfData.rendaEstimada
          }
          // Redes sociais pessoais do decisor (fallback se empresa não tem)
          if (cpfData.redesSociais) {
            if (cpfData.redesSociais.instagram && !merged.instagram) {
              merged.instagram = normalizeSocialUrl(cpfData.redesSociais.instagram, 'instagram')
            }
            if (cpfData.redesSociais.facebook && !merged.facebook) {
              merged.facebook = normalizeSocialUrl(cpfData.redesSociais.facebook, 'facebook')
            }
            if (cpfData.redesSociais.linkedin && !merged.linkedin) {
              merged.linkedin = normalizeSocialUrl(cpfData.redesSociais.linkedin, 'linkedin')
            }
            if (cpfData.redesSociais.tiktok && !merged.tiktok) {
              merged.tiktok = normalizeSocialUrl(cpfData.redesSociais.tiktok, 'tiktok')
            }
          }
          // Telefone pessoal do decisor como fallback
          if (cpfData.telefones?.length) {
            const personalPhone = extractBestPhone(cpfData.telefones)
            if (personalPhone.whatsapp && !merged.rfPhone) {
              merged.rfPhone = personalPhone.whatsapp
            } else if (personalPhone.landline && !merged.rfPhone) {
              merged.rfPhone = personalPhone.landline
            }
          }
          // Emails pessoais do decisor como fallback
          if (cpfData.emails?.length && !merged.rfEmail) {
            merged.rfEmail = cpfData.emails[0].endereco
          }
        } catch { /* CPF lookup é complementar, não bloqueia */ }
      }

      // NÍVEL 4: Se AINDA não tem rfPhone, varrer CPF de TODOS os sócios
      if (!merged.rfPhone && !leadData.rfPhone) {
        const allSocios = assertivaData?.socios || []
        const alreadyCheckedCpf = decisorCpf?.replace?.(/\D/g, '')
        for (const socio of allSocios) {
          if (merged.rfPhone) break
          const cpf = socio?.cpf?.replace(/\D/g, '')
          if (!cpf || cpf.length !== 11 || cpf === alreadyCheckedCpf) continue
          try {
            const cpfData = await assertivaLookupCpf(cpf)
            if (cpfData.telefones?.length) {
              const phone = extractBestPhone(cpfData.telefones)
              if (phone.whatsapp) {
                merged.rfPhone = phone.whatsapp
                merged.assertivaWhatsappFlag = true
              } else if (phone.landline) {
                merged.rfPhone = phone.landline
              }
            }
          } catch { /* sócio sem dados, tentar próximo */ }
        }
      }

      const assertivaDetails = [
        assertivaData?.telefones?.length ? `${assertivaData.telefones.length} tel` : null,
        decisores.length ? `${decisores.length} decisor${decisores.length > 1 ? 'es' : ''}` : null,
        assertivaData?._quantidadeFuncionarios ? `${assertivaData._quantidadeFuncionarios} func` : null,
        assertivaData?._cnaeDescricao ? 'CNAE' : null,
        assertivaData?._redesSociais ? 'redes sociais' : null,
        assertivaData?._faturamentoPresumido ? `faturamento R$ ${assertivaData._faturamentoPresumido}` : null,
        assertivaData?._scoreCredito ? `score ${assertivaData._scoreCredito}` : null,
        decisorCpf ? 'CPF decisor' : null,
        merged.assertivaIncomeEstimate ? `renda R$ ${Math.round(merged.assertivaIncomeEstimate)}` : null,
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

  // ========== FASE 2.5: Firecrawl fallback (redes sociais) ==========
  // Condição: Assertiva não retornou Instagram NEM LinkedIn (prioridades) E lead tem website
  // Firecrawl raspa o website e extrai <a href> → classifica em IG/LI/TT/FB
  const assertivaPreencheuPrioridade =
    (!!merged.instagram || !!leadData.instagram) &&
    (!!merged.linkedin || !!leadData.linkedin)
  const websiteDisponivel = merged.website || leadData.website

  if (!assertivaPreencheuPrioridade && websiteDisponivel && isFirecrawlAvailable()) {
    step('firecrawl').status = 'running'
    notify()
    try {
      const firecrawlResult = await scrapeSocialLinksFromWebsite(websiteDisponivel)
      if (firecrawlResult) {
        let countFound = 0
        if (firecrawlResult.instagram && !merged.instagram && !leadData.instagram) {
          merged.instagram = firecrawlResult.instagram
          countFound++
        }
        if (firecrawlResult.linkedin && !merged.linkedin && !leadData.linkedin) {
          merged.linkedin = firecrawlResult.linkedin
          countFound++
        }
        if (firecrawlResult.tiktok && !merged.tiktok && !leadData.tiktok) {
          merged.tiktok = firecrawlResult.tiktok
          countFound++
        }
        if (firecrawlResult.facebook && !merged.facebook && !leadData.facebook) {
          merged.facebook = firecrawlResult.facebook
          countFound++
        }
        step('firecrawl').detail = countFound > 0 ? `${countFound} rede${countFound > 1 ? 's' : ''} encontrada${countFound > 1 ? 's' : ''}` : 'nenhuma rede nova'
        step('firecrawl').status = 'done'
        // Se Assertiva trouxe algo E Firecrawl trouxe algo → mixed; senão firecrawl puro
        const assertivaBrought = !!(merged.assertivaSocialMedia)
        merged.socialMediaSource = assertivaBrought ? 'mixed' : 'firecrawl'
        await logEnrichmentStep(leadId, 'firecrawl', 'done', step('firecrawl').detail || 'OK').catch(() => {})
      } else {
        step('firecrawl').status = 'skipped'
        step('firecrawl').detail = 'sem links sociais no site'
      }
    } catch {
      step('firecrawl').status = 'error'
      await logEnrichmentStep(leadId, 'firecrawl', 'error', 'Falha ao raspar website').catch(() => {})
    }
    notify()
  } else if (step('firecrawl').status === 'pending') {
    step('firecrawl').status = 'skipped'
    step('firecrawl').detail = assertivaPreencheuPrioridade ? 'Assertiva preencheu' : 'sem website'
  }

  // Auditoria: registrar quando e de onde vieram as redes sociais
  const hasAnySocial = !!(merged.instagram || merged.linkedin || merged.tiktok || merged.facebook)
  if (hasAnySocial) {
    merged.socialMediaExtractedAt = new Date().toISOString()
    if (!merged.socialMediaSource) {
      // Default: assertiva (pois Firecrawl já setou explicitamente)
      merged.socialMediaSource = 'assertiva'
    }
  }

  // --- Auto-score SPICED ---
  const spiced = calculateSpicedDimensions(leadData, merged)

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

  // --- Generate Strategic Analysis (personalized from enrichment data) ---
  step('strategic').status = 'running'
  notify()
  try {
    const fullLeadData = { ...leadData, ...merged, ...spiced }
    fullLeadData.score = Math.round((spiced.spicedS * 0.25 + spiced.spicedP * 0.25 + spiced.spicedI * 0.20 + spiced.spicedC * 0.15 + spiced.spicedD * 0.15) * 10) / 10
    const strategic = generateStrategicAnalysis(fullLeadData)
    // Trava dominante: SEMPRE atualizar com detectTravas (Fábrica de Receita)
    const travasEnrich = detectTravas(fullLeadData)
    if (travasEnrich.length > 0) {
      merged.hypotheticalTrap = `${travasEnrich[0].codigo} ${travasEnrich[0].nome}`
    } else if (!leadData.hypotheticalTrap) {
      merged.hypotheticalTrap = strategic.hypotheticalTrap
    }
    if (!leadData.discoveryQuestions) merged.discoveryQuestions = strategic.discoveryQuestions
    if (!leadData.eligibilityChecklist) merged.eligibilityChecklist = strategic.eligibilityChecklist
    if (!leadData.meetingPrep) merged.meetingPrep = strategic.meetingPrep
    if (!leadData.salesArguments) merged.salesArguments = strategic.salesArguments
    if (!leadData.vulnerabilities) merged.vulnerabilities = strategic.vulnerabilities
    if (!leadData.competitiveAnalysis) merged.competitiveAnalysis = strategic.competitiveAnalysis
    if (!leadData.projectionData) merged.projectionData = strategic.projectionData
    if (!leadData.productPortfolio) merged.productPortfolio = strategic.productPortfolio
    step('strategic').status = 'done'
    step('strategic').detail = 'Reunião + Discovery + Vulnerabilidades + Argumentos'
  } catch {
    step('strategic').status = 'error'
  }
  notify()

  // --- Save enriched data to Airtable ---
  const updateFields: Partial<Lead> = { ...merged }
  Object.assign(updateFields, spiced)
  // Score = media ponderada SPICED (S*25% + P*25% + I*20% + C*15% + D*15%) = escala 1 a 5
  updateFields.score = Math.round((spiced.spicedS * 0.25 + spiced.spicedP * 0.25 + spiced.spicedI * 0.20 + spiced.spicedC * 0.15 + spiced.spicedD * 0.15) * 10) / 10
  const cnpjDone = steps.find(s => s.source === 'cnpj')?.status === 'done'
  const assertivaDone = steps.find(s => s.source === 'assertiva')?.status === 'done'
  const hasPhone = !!(updateFields.rfPhone || leadData.rfPhone)
  updateFields.enrichmentStatus = (cnpjDone && assertivaDone) || hasPhone ? 'complete' : cnpjDone ? 'cnpja' : assertivaDone ? 'assertiva' : 'none'

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
            role: c.source === 'receita_federal' ? 'Socio/Administrador (RF)' : c.source === 'google_maps' ? 'Telefone comercial' : c.source === 'website' ? 'Contato do site' : c.source === 'google_search_decisor' ? 'CEO/Fundador (Google)' : c.source === 'linkedin_profile' ? 'CEO/Fundador (LinkedIn)' : `Via ${c.source}`,
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
    // Telefone com WhatsApp validado + flags Assertiva
    if (assertivaData?.telefones?.length) {
      const bestPhone = extractBestPhone(assertivaData.telefones)
      if (bestPhone.whatsapp) {
        merged.assertivaPhoneValidated = bestPhone.whatsapp
        merged.assertivaWhatsappFlag = true
        if (!lead.rfPhone) merged.rfPhone = bestPhone.whatsapp
      } else if (bestPhone.landline) {
        merged.assertivaPhoneValidated = bestPhone.landline
        merged.assertivaWhatsappFlag = false
        if (!lead.rfPhone) merged.rfPhone = bestPhone.landline
      }
    }
    if (assertivaData?.emails?.length) {
      merged.assertivaEmailValidated = assertivaData.emails[0].endereco
    }
    // Website: _site → fallback: email corporativo
    if (!lead.website && !merged.website) {
      if (assertivaData?._site) {
        merged.website = assertivaData._site.startsWith('http') ? assertivaData._site : `https://${assertivaData._site}`
      } else if (assertivaData?.emails?.length) {
        const corpEmail = assertivaData.emails.find((e: any) => {
          const addr = e.endereco || e.email || ''
          const domain = addr.split('@')[1] || ''
          return domain && !/gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\./i.test(domain)
        })
        if (corpEmail) {
          const domain = (corpEmail.endereco || corpEmail.email).split('@')[1]
          merged.website = `https://${domain}`
        }
      }
    }
    // Redes sociais da Assertiva (inclui TikTok)
    if (assertivaData?._redesSociais) {
      if (assertivaData._redesSociais.instagram && !lead.instagram) merged.instagram = normalizeSocialUrl(assertivaData._redesSociais.instagram, 'instagram')
      if (assertivaData._redesSociais.facebook && !lead.facebook) merged.facebook = normalizeSocialUrl(assertivaData._redesSociais.facebook, 'facebook')
      if (assertivaData._redesSociais.linkedin && !lead.linkedin) merged.linkedin = normalizeSocialUrl(assertivaData._redesSociais.linkedin, 'linkedin')
      if (assertivaData._redesSociais.tiktok && !lead.tiktok) merged.tiktok = normalizeSocialUrl(assertivaData._redesSociais.tiktok, 'tiktok')
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

    // NÍVEL 2: Decisores via protocolo
    const protocolo = assertivaData?._protocolo
    if (protocolo && lead.cnpj && !merged.rfPhone && !lead.rfPhone) {
      try {
        const decisores = await getDecisionMakers(lead.cnpj, protocolo)
        for (const d of decisores) {
          const phones = extractBestPhone(d.telefones || [])
          if (phones.whatsapp) { merged.rfPhone = phones.whatsapp; merged.assertivaWhatsappFlag = true; break }
          if (phones.landline && !merged.rfPhone) merged.rfPhone = phones.landline
        }
      } catch { /* complementar */ }
    }

    // NÍVEL 3: CPF do decisor
    const decisorSocio = assertivaData?.socios?.find((s: any) =>
      (s.qualificacao || '').toLowerCase().includes('administrador') ||
      (s.qualificacao || '').toLowerCase().includes('diretor'),
    ) || assertivaData?.socios?.[0]
    if (decisorSocio?.cpf && !merged.rfPhone && !lead.rfPhone) {
      try {
        const cpfData = await assertivaLookupCpf(decisorSocio.cpf)
        if (cpfData.telefones?.length) {
          const phone = extractBestPhone(cpfData.telefones)
          if (phone.whatsapp) { merged.rfPhone = phone.whatsapp; merged.assertivaWhatsappFlag = true }
          else if (phone.landline) merged.rfPhone = phone.landline
        }
        if (cpfData.rendaEstimada && !merged.assertivaIncomeEstimate) {
          merged.assertivaIncomeEstimate = cpfData.rendaEstimada
        }
      } catch { /* complementar */ }
    }
    if (decisorSocio?.cpf) {
      merged.assertivaCpfDecisor = decisorSocio.cpf
    }

    // NÍVEL 4: Varredura CPF de TODOS os sócios
    if (!merged.rfPhone && !lead.rfPhone) {
      const allSocios = assertivaData?.socios || []
      const checkedCpf = decisorSocio?.cpf?.replace(/\D/g, '')
      for (const socio of allSocios) {
        if (merged.rfPhone) break
        const cpf = socio?.cpf?.replace(/\D/g, '')
        if (!cpf || cpf.length !== 11 || cpf === checkedCpf) continue
        try {
          const cpfData = await assertivaLookupCpf(cpf)
          if (cpfData.telefones?.length) {
            const phone = extractBestPhone(cpfData.telefones)
            if (phone.whatsapp) { merged.rfPhone = phone.whatsapp; merged.assertivaWhatsappFlag = true }
            else if (phone.landline) merged.rfPhone = phone.landline
          }
        } catch { /* tentar próximo */ }
      }
    }

    if (source !== 'both') source = 'assertiva'
  } catch (err) {
    console.warn(`reEnrichLead Assertiva falhou para ${lead.cnpj}:`, err)
  }

  // FASE 2.5 (re-enrich): Firecrawl fallback para redes sociais
  // Se Assertiva não retornou IG nem LI E lead tem website → raspa o site
  const rePrioridadeOK = !!(merged.instagram || lead.instagram) && !!(merged.linkedin || lead.linkedin)
  const reWebsite = merged.website || lead.website
  if (!rePrioridadeOK && reWebsite && isFirecrawlAvailable()) {
    try {
      const firecrawlResult = await scrapeSocialLinksFromWebsite(reWebsite)
      if (firecrawlResult) {
        if (firecrawlResult.instagram && !merged.instagram && !lead.instagram) merged.instagram = firecrawlResult.instagram
        if (firecrawlResult.linkedin && !merged.linkedin && !lead.linkedin) merged.linkedin = firecrawlResult.linkedin
        if (firecrawlResult.tiktok && !merged.tiktok && !lead.tiktok) merged.tiktok = firecrawlResult.tiktok
        if (firecrawlResult.facebook && !merged.facebook && !lead.facebook) merged.facebook = firecrawlResult.facebook
        merged.socialMediaSource = merged.assertivaSocialMedia ? 'mixed' : 'firecrawl'
      }
    } catch { /* graceful */ }
  }
  if (merged.instagram || merged.linkedin || merged.tiktok || merged.facebook) {
    merged.socialMediaExtractedAt = new Date().toISOString()
    if (!merged.socialMediaSource) merged.socialMediaSource = 'assertiva'
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
