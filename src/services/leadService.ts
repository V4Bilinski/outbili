// leadService — backend Supabase (schema 'app').
// Wave 3 do cutover Airtable -> Supabase. Mantem a mesma API publica do service legado
// (`getLeads(filter?: string)`, `getLead(id)`, `createLead`, `updateLead`, `deleteLead`)
// para minimizar quebra nos 7 callers. O `id` exposto continua sendo o `rec...` legado
// (`airtable_record_id`), reaproveitado para leads novos via `generateRecordId()`.

import { supabase, generateRecordId, throwIfError } from '../lib/supabase'
import type { Lead } from '../types'

const TABLE = 'leads'
// Embed das redes sociais (lead_social) e telefones/emails preferidos por meio das
// colunas denormalizadas em app.leads (rf_phone, assertiva_phone_validated, etc).
const SELECT = '*, lead_social(*)'

// ---------- Mappers ----------

/** Converte row Supabase + lead_social[] -> interface Lead (camelCase do app). */
function rowToLead(row: any): Lead {
  const social: any[] = row.lead_social || []
  const ig = social.find((s) => s.platform === 'instagram')
  const li = social.find((s) => s.platform === 'linkedin')
  const fb = social.find((s) => s.platform === 'facebook')
  const tt = social.find((s) => s.platform === 'tiktok')

  return {
    id: row.airtable_record_id || row.id,
    companyName: row.company_name,
    tradeName: row.trade_name ?? undefined,
    cnpj: row.cnpj ?? undefined,
    segment: row.segment ?? '',
    tier: row.tier ?? '',
    monthlyRevenue: row.monthly_revenue ?? undefined,
    status: row.status ?? 'Novo',
    score: Number(row.score ?? 0),
    temperature: row.temperatura ?? undefined,
    spicedS: row.spiced_s ?? 0,
    spicedP: row.spiced_p ?? 0,
    spicedI: row.spiced_i ?? 0,
    spicedC: row.spiced_c ?? 0,
    spicedD: row.spiced_d ?? 0,
    spicedNotes: row.spiced_notes ?? undefined,
    hypotheticalTrap: row.hypothetical_trap ?? undefined,
    website: row.website ?? undefined,
    instagram: ig?.url ?? undefined,
    linkedin: li?.url ?? undefined,
    facebook: fb?.url ?? undefined,
    tiktok: tt?.url ?? undefined,
    socialMediaExtractedAt: row.social_media_extracted_at ?? undefined,
    socialMediaSource: row.social_media_source ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    employees: row.employees ?? undefined,
    yearsInMarket: row.years_in_market ?? undefined,
    businessSummary: row.business_summary ?? undefined,
    marketContext: row.market_context ?? undefined,
    productPortfolio: row.product_portfolio ?? undefined,
    techStack: row.tech_stack ?? undefined,
    projectionData: row.projection_data ?? undefined,
    vulnerabilities: row.vulnerabilities ?? undefined,
    competitiveAnalysis: row.competitive_analysis ?? undefined,
    salesArguments: row.sales_arguments ?? undefined,
    meetingPrep: row.meeting_prep ?? undefined,
    discoveryQuestions: row.discovery_questions ?? undefined,
    eligibilityChecklist: row.eligibility_checklist ?? undefined,
    sourceHtmlReport: row.source_html_report ?? undefined,
    enrichmentStatus: row.enrichment_status ?? undefined,
    googleRating: row.google_rating ?? undefined,
    googleReviewsCount: row.google_reviews_count ?? undefined,
    instagramFollowers: ig?.followers ?? undefined,
    instagramIsVerified: ig?.is_verified ?? undefined,
    instagramIsBusiness: ig?.is_business ?? undefined,
    instagramCategory: ig?.category ?? undefined,
    instagramBio: ig?.bio ?? undefined,
    linkedinEmployeeCount: li?.employee_count ?? undefined,
    taxRegime: row.tax_regime ?? undefined,
    capitalSocial: row.capital_social ?? undefined,
    legalNature: row.legal_nature ?? undefined,
    registrationStatus: row.registration_status ?? undefined,
    foundingDate: row.founding_date ?? undefined,
    cnaePrimary: row.cnae_primary ?? undefined,
    cnaeSecondary: row.cnae_secondary ?? undefined,
    partners: undefined, // QSA agora vive em app.lead_partners (use partnerService)
    rfEmail: row.rf_email ?? undefined,
    rfPhone: row.rf_phone ?? undefined,
    zipCode: row.zip_code ?? undefined,
    district: row.district ?? undefined,
    municipalityCode: row.municipality_code ?? undefined,
    phoneType: row.phone_type ?? undefined,
    simplesOptant: row.simples_optant ?? undefined,
    simplesSince: row.simples_since ?? undefined,
    isHeadquarters: row.is_headquarters ?? undefined,
    cnpjaLastUpdate: row.cnpja_last_update ?? undefined,
    statusDate: row.status_date ?? undefined,
    emailDomain: row.email_domain ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    inpiTrademarks: row.inpi_trademarks ?? undefined,
    inpiTrademarkCount: row.inpi_trademark_count ?? undefined,
    inpiHasRegisteredTrademark: row.inpi_has_registered_trademark ?? undefined,
    domainActive: row.domain_active ?? undefined,
    domainExpiry: row.domain_expiry ?? undefined,
    assertivaPhoneValidated: row.assertiva_phone_validated ?? undefined,
    assertivaWhatsappFlag: row.assertiva_whatsapp_flag ?? undefined,
    assertivaEmailValidated: row.assertiva_email_validated ?? undefined,
    assertivaCpfDecisor: undefined, // cifrado em assertiva_cpf_decisor_encrypted (PII pos-W2)
    assertivaIncomeEstimate: row.assertiva_income_estimate ?? undefined,
    assertivaCreditScore: row.assertiva_credit_score ?? undefined,
    assertivaSocialMedia: row.assertiva_social_media ?? undefined,
    enrichmentSources: row.enrichment_sources ?? undefined,
    enrichmentLog: row.enrichment_log ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  } as Lead
}

/** Converte Partial<Lead> -> row Supabase (snake_case) para INSERT/UPDATE em app.leads. */
function leadToRow(data: Partial<Lead>): Record<string, any> {
  const row: Record<string, any> = {}
  const set = (k: string, v: any) => { if (v !== undefined) row[k] = v }

  set('cnpj', data.cnpj)
  set('company_name', data.companyName)
  set('trade_name', data.tradeName)
  set('segment', data.segment)
  set('tier', data.tier)
  set('monthly_revenue', data.monthlyRevenue)
  set('status', data.status)
  set('score', data.score)
  set('temperatura', data.temperature)
  set('spiced_s', data.spicedS)
  set('spiced_p', data.spicedP)
  set('spiced_i', data.spicedI)
  set('spiced_c', data.spicedC)
  set('spiced_d', data.spicedD)
  set('spiced_notes', data.spicedNotes)
  set('hypothetical_trap', data.hypotheticalTrap)
  set('website', data.website)
  set('social_media_extracted_at', data.socialMediaExtractedAt)
  set('social_media_source', data.socialMediaSource)
  set('address', data.address)
  set('city', data.city)
  set('state', data.state)
  set('employees', data.employees)
  set('years_in_market', data.yearsInMarket)
  set('business_summary', data.businessSummary)
  set('market_context', data.marketContext)
  set('product_portfolio', data.productPortfolio)
  set('tech_stack', data.techStack)
  set('projection_data', data.projectionData)
  set('vulnerabilities', data.vulnerabilities)
  set('competitive_analysis', data.competitiveAnalysis)
  set('sales_arguments', data.salesArguments)
  set('meeting_prep', data.meetingPrep)
  set('discovery_questions', data.discoveryQuestions)
  set('eligibility_checklist', data.eligibilityChecklist)
  set('source_html_report', data.sourceHtmlReport)
  set('enrichment_status', data.enrichmentStatus)
  set('google_rating', data.googleRating)
  set('google_reviews_count', data.googleReviewsCount)
  set('tax_regime', data.taxRegime)
  set('capital_social', data.capitalSocial)
  set('legal_nature', data.legalNature)
  set('registration_status', data.registrationStatus)
  set('founding_date', data.foundingDate)
  set('cnae_primary', data.cnaePrimary)
  set('cnae_secondary', data.cnaeSecondary)
  set('rf_email', data.rfEmail)
  set('rf_phone', data.rfPhone)
  set('zip_code', data.zipCode)
  set('district', data.district)
  set('municipality_code', data.municipalityCode)
  set('phone_type', data.phoneType)
  set('simples_optant', data.simplesOptant)
  set('simples_since', data.simplesSince)
  set('is_headquarters', data.isHeadquarters)
  set('cnpja_last_update', data.cnpjaLastUpdate)
  set('status_date', data.statusDate)
  set('email_domain', data.emailDomain)
  set('latitude', data.latitude)
  set('longitude', data.longitude)
  set('inpi_trademarks', data.inpiTrademarks)
  set('inpi_trademark_count', data.inpiTrademarkCount)
  set('inpi_has_registered_trademark', data.inpiHasRegisteredTrademark)
  set('domain_active', data.domainActive)
  set('domain_expiry', data.domainExpiry)
  set('assertiva_phone_validated', data.assertivaPhoneValidated)
  set('assertiva_whatsapp_flag', data.assertivaWhatsappFlag)
  set('assertiva_email_validated', data.assertivaEmailValidated)
  set('assertiva_income_estimate', data.assertivaIncomeEstimate)
  set('assertiva_credit_score', data.assertivaCreditScore)
  set('assertiva_social_media', data.assertivaSocialMedia)
  set('enrichment_sources', data.enrichmentSources)
  set('enrichment_log', data.enrichmentLog)
  return row
}

/** Persiste o slice de social (lead_social) a partir de Partial<Lead>. */
async function upsertSocial(leadDbId: string, data: Partial<Lead>): Promise<void> {
  const rows: Record<string, any>[] = []
  if (data.instagram) {
    rows.push({
      lead_id: leadDbId, platform: 'instagram', url: data.instagram,
      followers: data.instagramFollowers, is_verified: data.instagramIsVerified,
      is_business: data.instagramIsBusiness, category: data.instagramCategory,
      bio: data.instagramBio, source: data.socialMediaSource, extracted_at: data.socialMediaExtractedAt,
    })
  }
  if (data.linkedin) {
    rows.push({
      lead_id: leadDbId, platform: 'linkedin', url: data.linkedin,
      employee_count: data.linkedinEmployeeCount, source: data.socialMediaSource,
      extracted_at: data.socialMediaExtractedAt,
    })
  }
  if (data.facebook) {
    rows.push({ lead_id: leadDbId, platform: 'facebook', url: data.facebook, source: data.socialMediaSource, extracted_at: data.socialMediaExtractedAt })
  }
  if (data.tiktok) {
    rows.push({ lead_id: leadDbId, platform: 'tiktok', url: data.tiktok, source: data.socialMediaSource, extracted_at: data.socialMediaExtractedAt })
  }
  if (!rows.length) return
  const { error } = await supabase.from('lead_social').upsert(rows, { onConflict: 'lead_id,platform' })
  throwIfError(error, 'upsertSocial')
}

// ---------- Filter parser (compat com filterByFormula legado) ----------

// Suporta 4 padroes em uso no codigo: {campo} = "valor"
// onde campo ∈ {status, temperatura, cnpj, companyName}
function applyAirtableFilter<T extends { eq: any }>(q: T, filter: string): T {
  const m = filter.trim().match(/^\{(\w+)\}\s*=\s*"(.*)"$/)
  if (!m) {
    // eslint-disable-next-line no-console
    console.warn('leadService: filter nao reconhecido, retornando tudo:', filter)
    return q
  }
  const field = m[1]
  const value = m[2].replace(/\\"/g, '"')
  const map: Record<string, string> = {
    status: 'status',
    temperatura: 'temperatura',
    cnpj: 'cnpj',
    companyName: 'company_name',
  }
  const column = map[field]
  if (!column) {
    // eslint-disable-next-line no-console
    console.warn('leadService: campo nao suportado em filter:', field)
    return q
  }
  return (q as any).eq(column, value)
}

// ---------- API publica ----------

export async function getLeads(filter?: string): Promise<Lead[]> {
  let q: any = supabase.from(TABLE).select(SELECT).is('deleted_at', null).order('company_name', { ascending: true })
  if (filter) q = applyAirtableFilter(q, filter)
  const { data, error } = await q
  throwIfError(error, 'getLeads')
  return (data || []).map(rowToLead)
}

export async function getLead(id: string): Promise<Lead> {
  // Aceita tanto airtable_record_id (rec...) quanto UUID Supabase
  const { data, error } = await supabase.from(TABLE).select(SELECT)
    .or(`airtable_record_id.eq.${id},id.eq.${id}`)
    .maybeSingle()
  throwIfError(error, 'getLead')
  if (!data) throw new Error(`Lead nao encontrado: ${id}`)
  return rowToLead(data)
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const recordId = data.id || generateRecordId()
  const row = { ...leadToRow(data), airtable_record_id: recordId }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select(SELECT).single()
  throwIfError(error, 'createLead')
  if (data.instagram || data.linkedin || data.facebook || data.tiktok) {
    await upsertSocial(inserted.id, data)
    // Reler para incluir lead_social
    return getLead(recordId)
  }
  return rowToLead(inserted)
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  // Resolve UUID interno para fazer o UPDATE
  const target = await supabase.from(TABLE).select('id, airtable_record_id')
    .or(`airtable_record_id.eq.${id},id.eq.${id}`).maybeSingle()
  throwIfError(target.error, 'updateLead.lookup')
  if (!target.data) throw new Error(`Lead nao encontrado: ${id}`)
  const dbId = target.data.id
  const row = leadToRow(data)
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from(TABLE).update(row).eq('id', dbId)
    throwIfError(error, 'updateLead')
  }
  if (data.instagram !== undefined || data.linkedin !== undefined || data.facebook !== undefined || data.tiktok !== undefined) {
    await upsertSocial(dbId, data)
  }
  return getLead(target.data.airtable_record_id || dbId)
}

export async function deleteLead(id: string): Promise<void> {
  // Soft delete via deleted_at, preservando audit trail e FK das filhas
  const { error } = await supabase.from(TABLE).update({ deleted_at: new Date().toISOString() })
    .or(`airtable_record_id.eq.${id},id.eq.${id}`)
  throwIfError(error, 'deleteLead')
}

export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  const { data, error } = await supabase.from(TABLE).select(SELECT)
    .is('deleted_at', null).eq('status', status).order('company_name')
  throwIfError(error, 'getLeadsByStatus')
  return (data || []).map(rowToLead)
}

export async function getLeadsByTemperature(temperature: string): Promise<Lead[]> {
  const { data, error } = await supabase.from(TABLE).select(SELECT)
    .is('deleted_at', null).eq('temperatura', temperature).order('company_name')
  throwIfError(error, 'getLeadsByTemperature')
  return (data || []).map(rowToLead)
}

export async function getHotLeads(): Promise<Lead[]> {
  return getLeadsByTemperature('Quente')
}
