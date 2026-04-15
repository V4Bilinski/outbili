import type { Lead, Contact } from '../types'

type LeadWithContact = Lead & {
  decisorContact?: Contact
}

export interface VariableFieldOption {
  value: string
  label: string
  resolver: (lead: LeadWithContact) => string
}

export const VARIABLE_FIELD_OPTIONS: VariableFieldOption[] = [
  { value: 'decisorName', label: 'Nome do decisor', resolver: (l) => l.decisorContact?.name || '' },
  { value: 'companyName', label: 'Nome da empresa', resolver: (l) => l.companyName || '' },
  { value: 'segment', label: 'Segmento', resolver: (l) => l.segment || '' },
  { value: 'city', label: 'Cidade', resolver: (l) => l.city || '' },
  { value: 'state', label: 'Estado', resolver: (l) => l.state || '' },
  { value: 'score', label: 'Score SPICED', resolver: (l) => String(l.score || 0) },
  { value: 'tier', label: 'Tier', resolver: (l) => l.tier || '' },
  { value: 'email', label: 'Email', resolver: (l) => l.decisorContact?.email || '' },
  { value: 'phone', label: 'Telefone', resolver: (l) => l.decisorContact?.whatsapp || '' },
  { value: 'tradeName', label: 'Nome fantasia', resolver: (l) => l.tradeName || l.companyName || '' },
  { value: 'contactRole', label: 'Cargo do decisor', resolver: (l) => l.decisorContact?.role || '' },
]

export const DEFAULT_VARIABLE_MAPPING: Record<string, string> = {
  '1': 'decisorName',
  '2': 'companyName',
  '3': 'segment',
  '4': 'city',
}

export function resolveVariables(
  mapping: Record<string, string>,
  lead: LeadWithContact,
): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const [varNum, fieldValue] of Object.entries(mapping)) {
    const option = VARIABLE_FIELD_OPTIONS.find((o) => o.value === fieldValue)
    resolved[varNum] = option ? option.resolver(lead) : `[Variavel ${varNum}]`
  }
  return resolved
}

export function resolveVariableLabel(fieldValue: string): string {
  return VARIABLE_FIELD_OPTIONS.find((o) => o.value === fieldValue)?.label || fieldValue
}
