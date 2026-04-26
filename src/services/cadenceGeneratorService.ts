import type { Lead, Contact } from '../types'
import {
  pickColdOpeningTemplate,
  getTemplateByName,
  resolveTemplateParams,
  previewTemplate,
  CADENCE_FOLLOWUP_SEQUENCE,
  type CatalogTemplate,
  type CustomValues,
} from '../lib/template-catalog'

type LeadWithContact = Lead & { decisorContact?: Contact }

export type CadenceCondition = 'always' | 'if_no_reply' | 'if_no_read'

export interface CadenceStep {
  index: number
  delayHours: number
  condition: CadenceCondition
  template: CatalogTemplate
  params: Record<string, string>
  preview: string
}

export interface CadencePlan {
  leadId: string
  leadName: string
  decisorName: string
  reason: string
  steps: CadenceStep[]
  totalDurationHours: number
  generatedAt: string
}

export interface GenerateOptions {
  customValues?: CustomValues
  maxFollowups?: number
}

export function generateCadence(
  lead: LeadWithContact,
  options: GenerateOptions = {},
): CadencePlan {
  const { customValues = {}, maxFollowups = 4 } = options

  const cold = pickColdOpeningTemplate(lead)
  const steps: CadenceStep[] = []

  steps.push({
    index: 0,
    delayHours: 0,
    condition: 'always',
    template: cold.template,
    params: resolveTemplateParams(cold.template, lead, customValues),
    preview: previewTemplate(cold.template, lead, customValues),
  })

  const followups = CADENCE_FOLLOWUP_SEQUENCE.slice(0, maxFollowups)
  followups.forEach((step, i) => {
    const template = getTemplateByName(step.templateName)
    if (!template) return
    steps.push({
      index: i + 1,
      delayHours: step.delayHours,
      condition: step.condition,
      template,
      params: resolveTemplateParams(template, lead, customValues),
      preview: previewTemplate(template, lead, customValues),
    })
  })

  const totalDurationHours = steps.reduce((max, s) => Math.max(max, s.delayHours), 0)

  return {
    leadId: lead.id,
    leadName: lead.companyName,
    decisorName: lead.decisorContact?.name ?? '',
    reason: cold.reason,
    steps,
    totalDurationHours,
    generatedAt: new Date().toISOString(),
  }
}

export function cadencePlanToCampaignWizardInput(plan: CadencePlan): {
  templateName: string
  variableMapping: Record<string, string>
  steps: Array<{ delayHours: number; condition: CadenceCondition; templateName: string }>
} {
  const [first, ...rest] = plan.steps
  if (!first) throw new Error('Cadence plan must have at least 1 step')

  return {
    templateName: first.template.name,
    variableMapping: first.params,
    steps: rest.map((s) => ({
      delayHours: s.delayHours,
      condition: s.condition,
      templateName: s.template.name,
    })),
  }
}

export interface CadenceValidationIssue {
  stepIndex: number
  templateName: string
  issue: string
}

export function validateCadence(plan: CadencePlan): CadenceValidationIssue[] {
  const issues: CadenceValidationIssue[] = []

  for (const step of plan.steps) {
    for (const [name, value] of Object.entries(step.params)) {
      if (!value || value.startsWith('[')) {
        issues.push({
          stepIndex: step.index,
          templateName: step.template.name,
          issue: `Variavel "${name}" nao resolvida`,
        })
      }
    }

    const body = step.template.components.find((c) => c.type === 'BODY')
    if (body?.text && body.text.length > 1024) {
      issues.push({
        stepIndex: step.index,
        templateName: step.template.name,
        issue: `Body excede 1024 chars (${body.text.length})`,
      })
    }
  }

  return issues
}
