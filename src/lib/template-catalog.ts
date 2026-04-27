import type { Lead, Contact } from '../types'
import catalogData from '../../whatsapp-templates/catalog.json'

type LeadWithContact = Lead & { decisorContact?: Contact }

export type TemplatePillar = 1 | 2 | 3 | 4 | 5
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: {
    body_text_named_params?: Array<{ param_name: string; example: string }>
    header_text?: string[]
  }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE'
    text: string
    url?: string
    phone_number?: string
  }>
}

export interface CatalogTemplate {
  name: string
  category: TemplateCategory
  language: string
  pillar: TemplatePillar
  use_when: string
  components: TemplateComponent[]
}

export const TEMPLATE_CATALOG: CatalogTemplate[] = (catalogData.templates as CatalogTemplate[])

export function getTemplateByName(name: string): CatalogTemplate | undefined {
  return TEMPLATE_CATALOG.find((t) => t.name === name)
}

export function getTemplatesByPillar(pillar: TemplatePillar): CatalogTemplate[] {
  return TEMPLATE_CATALOG.filter((t) => t.pillar === pillar)
}

export function extractNamedParams(template: CatalogTemplate): string[] {
  const body = template.components.find((c) => c.type === 'BODY')
  if (!body?.text) return []
  const matches = body.text.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set(Array.from(matches, (m) => m[1]))]
}

const LEAD_FIELD_RESOLVERS: Record<string, (lead: LeadWithContact) => string> = {
  decisor: (l) => l.decisorContact?.name ?? '',
  empresa: (l) => l.companyName ?? '',
  empresa_curta: (l) => l.tradeName ?? l.companyName ?? '',
  segmento: (l) => l.segment ?? '',
  cidade: (l) => l.city ?? '',
  cargo: (l) => l.decisorContact?.role ?? '',
}

export const CUSTOM_PARAMS = [
  'case_empresa',
  'dado',
  'dor',
  'evento',
  'indicador',
  'horario1',
  'horario2',
  'horario3',
  'link',
  'material',
] as const

export type CustomParamName = (typeof CUSTOM_PARAMS)[number]
export type CustomValues = Partial<Record<CustomParamName, string>>

export function resolveTemplateParams(
  template: CatalogTemplate,
  lead: LeadWithContact,
  custom: CustomValues = {},
): Record<string, string> {
  const params = extractNamedParams(template)
  const resolved: Record<string, string> = {}

  for (const name of params) {
    if (LEAD_FIELD_RESOLVERS[name]) {
      resolved[name] = LEAD_FIELD_RESOLVERS[name](lead)
    } else if (name in custom) {
      resolved[name] = custom[name as CustomParamName] ?? ''
    } else {
      resolved[name] = `[${name}]`
    }
  }

  return resolved
}

export function previewTemplate(
  template: CatalogTemplate,
  lead: LeadWithContact,
  custom: CustomValues = {},
): string {
  const body = template.components.find((c) => c.type === 'BODY')
  if (!body?.text) return ''
  const values = resolveTemplateParams(template, lead, custom)
  return body.text.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? `[${name}]`)
}

const TRAVA_TO_TEMPLATE: Record<string, string> = {
  T1: 'outbili_trava_t1_caixa',
  T2: 'outbili_trava_t2_operacional',
  T3: 'outbili_trava_t3_mercado',
  T4: 'outbili_trava_t4_tech',
  T5: 'outbili_trava_t5_org',
  T6: 'outbili_trava_t6_budget',
  T7: 'outbili_trava_t7_compliance',
  T8: 'outbili_trava_t8_geo',
}

function matchesCeoRole(role?: string): boolean {
  if (!role) return false
  return /\b(ceo|founder|fundador|s[óo]cio|presidente)\b/i.test(role)
}

function matchesCommercialRole(role?: string): boolean {
  if (!role) return false
  return /\b(comercial|vendas|revenue|cmo|cro|vp\s*sales|diretor.*comercial)\b/i.test(role)
}

export interface ColdTemplatePick {
  template: CatalogTemplate
  reason: string
}

export function pickColdOpeningTemplate(lead: LeadWithContact): ColdTemplatePick {
  const role = lead.decisorContact?.role
  const trap = lead.hypotheticalTrap
  const vulnerabilities = lead.vulnerabilities ?? []

  if (trap && TRAVA_TO_TEMPLATE[trap]) {
    const tpl = getTemplateByName(TRAVA_TO_TEMPLATE[trap])
    if (tpl) return { template: tpl, reason: `Trava ${trap} detectada` }
  }

  if (vulnerabilities.length > 0) {
    const tpl = getTemplateByName('outbili_cold_dor_especifica')
    if (tpl) return { template: tpl, reason: 'Vulnerabilidades mapeadas' }
  }

  if (matchesCeoRole(role)) {
    const tpl = getTemplateByName('outbili_cold_ceo_direto')
    if (tpl) return { template: tpl, reason: 'Decisor e CEO/Founder' }
  }

  if (matchesCommercialRole(role)) {
    const tpl = getTemplateByName('outbili_cold_diretor_comercial')
    if (tpl) return { template: tpl, reason: 'Decisor e Comercial/Sales' }
  }

  const score = lead.score ?? 0
  if (score >= 3.7) {
    const tpl = getTemplateByName('outbili_cold_oferta_diag')
    if (tpl) return { template: tpl, reason: 'Lead Quente (SPICED >= 3.7)' }
  }

  if (lead.segment) {
    const tpl = getTemplateByName('outbili_cold_caso_setor')
    if (tpl) return { template: tpl, reason: 'Segmento mapeado' }
  }

  return {
    template: getTemplateByName('outbili_cold_curto')!,
    reason: 'Fallback. Abordagem neutra.',
  }
}

export const CADENCE_FOLLOWUP_SEQUENCE = [
  { delayHours: 48, templateName: 'outbili_followup_d2_breve', condition: 'if_no_reply' },
  { delayHours: 96, templateName: 'outbili_followup_d4_caso_extra', condition: 'if_no_reply' },
  { delayHours: 168, templateName: 'outbili_followup_d7_material', condition: 'if_no_reply' },
  { delayHours: 240, templateName: 'outbili_followup_d10_pergunta', condition: 'if_no_reply' },
] as const
