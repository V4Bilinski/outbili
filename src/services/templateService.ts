import { zapFetch } from '../lib/bilinskizap'
import type { ZapTemplate } from '../lib/bilinskizap'

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  example?: { header_text?: string[]; body_text?: string[][] }
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE'
    text: string
    url?: string
    phone_number?: string
  }>
}

export interface CreateTemplatePayload {
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  components: TemplateComponent[]
}

export interface TemplateDraft {
  id: string
  name: string
  category: string
  language: string
  components: TemplateComponent[]
  createdAt: string
  updatedAt: string
}

// === Templates ===

export async function listTemplates(): Promise<ZapTemplate[]> {
  return zapFetch('/api/templates')
}

export async function syncTemplates(): Promise<ZapTemplate[]> {
  return zapFetch('/api/templates', { method: 'POST' })
}

export async function createTemplate(data: CreateTemplatePayload): Promise<any> {
  return zapFetch('/api/templates/create', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteTemplate(name: string): Promise<void> {
  await zapFetch(`/api/templates/${encodeURIComponent(name)}`, { method: 'DELETE' })
}

// === Drafts ===

export async function listDrafts(): Promise<TemplateDraft[]> {
  return zapFetch('/api/templates/drafts')
}

export async function saveDraft(data: Omit<CreateTemplatePayload, 'language'> & { language?: string }): Promise<TemplateDraft> {
  return zapFetch('/api/templates/drafts', {
    method: 'POST',
    body: JSON.stringify({ ...data, language: data.language || 'pt_BR' }),
  })
}

export async function submitDraft(draftId: string): Promise<any> {
  return zapFetch(`/api/templates/drafts/${draftId}/submit`, { method: 'POST' })
}
