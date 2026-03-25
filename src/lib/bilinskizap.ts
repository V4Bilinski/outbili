const BASE_URL = import.meta.env.VITE_BILINSKIZAP_URL || 'https://bilinskizap.vercel.app'
const API_KEY = import.meta.env.VITE_BILINSKIZAP_API_KEY || ''

async function zapFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.details || `BilinskiZap error: ${res.status}`)
  }

  return res.json()
}

// --- Types ---

export interface ZapCampaign {
  id: string
  name: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'PAUSED' | 'FAILED' | 'CANCELLED'
  templateName: string
  recipients: number
  sent: number
  delivered: number
  read: number
  failed: number
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface ZapContact {
  id: string
  name: string
  phone: string
  email?: string
  status: 'OPT_IN' | 'OPT_OUT' | 'UNKNOWN'
  tags: string[]
  custom_fields: Record<string, string>
  createdAt: string
}

export interface ZapTemplate {
  name: string
  category: string
  language: string
  status: string
  content?: string
  preview?: string
  components: Array<{
    type: string
    format?: string
    text?: string
    buttons?: Array<{ type: string; text: string; url?: string }>
  }>
}

export interface ZapMessageStatus {
  id: string
  campaignId: string
  contactId: string
  contactName: string
  contactPhone: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'skipped' | 'failed'
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  error?: string
}

export interface ZapCampaignStats {
  total: number
  pending: number
  sent: number
  delivered: number
  read: number
  skipped: number
  failed: number
}

// --- Campaigns ---

export async function listCampaigns(params?: { limit?: number; offset?: number; status?: string }): Promise<{ data: ZapCampaign[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.status) qs.set('status', params.status)
  return zapFetch(`/api/campaigns?${qs}`)
}

export async function getCampaign(id: string): Promise<ZapCampaign> {
  return zapFetch(`/api/campaigns/${id}`)
}

export async function createCampaign(data: {
  name: string
  templateName: string
  contacts: Array<{ phone: string; name: string; email?: string; custom_fields?: Record<string, string> }>
  templateVariables?: { header?: string[]; body?: string[]; buttons?: Record<string, string> }
  scheduledAt?: string
}): Promise<ZapCampaign> {
  return zapFetch('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      recipients: data.contacts.length,
    }),
  })
}

export async function precheckCampaign(data: {
  templateName: string
  templateVariables?: { header?: string[]; body?: string[]; buttons?: Record<string, string> }
  contacts: Array<{ phone: string; name: string }>
}): Promise<{ ok: boolean; totals: { total: number; valid: number; skipped: number }; results: any[] }> {
  return zapFetch('/api/campaign/precheck', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function dispatchCampaign(campaignId: string, templateName: string): Promise<any> {
  return zapFetch('/api/campaign/dispatch', {
    method: 'POST',
    body: JSON.stringify({ campaignId, templateName, trigger: 'manual' }),
  })
}

export async function pauseCampaign(id: string): Promise<any> {
  return zapFetch(`/api/campaign/${id}/pause`, { method: 'POST' })
}

export async function resumeCampaign(id: string): Promise<any> {
  return zapFetch(`/api/campaign/${id}/resume`, { method: 'POST' })
}

export async function cancelCampaign(id: string): Promise<any> {
  return zapFetch(`/api/campaign/${id}/cancel`, { method: 'POST' })
}

export async function getCampaignMessages(id: string, params?: { limit?: number; offset?: number; status?: string }): Promise<{
  messages: ZapMessageStatus[]
  stats: ZapCampaignStats
  pagination: { total: number; hasMore: boolean }
}> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.status) qs.set('status', params.status)
  return zapFetch(`/api/campaigns/${id}/messages?${qs}`)
}

// --- Contacts ---

export async function listContacts(params?: { limit?: number; offset?: number; search?: string }): Promise<{ data: ZapContact[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.search) qs.set('search', params.search)
  return zapFetch(`/api/contacts?${qs}`)
}

export async function createContact(data: { name: string; phone: string; email?: string; tags?: string[]; custom_fields?: Record<string, string> }): Promise<ZapContact> {
  return zapFetch('/api/contacts', { method: 'POST', body: JSON.stringify(data) })
}

export async function importContacts(contacts: Array<{ name: string; phone: string; email?: string; tags?: string[]; custom_fields?: Record<string, string> }>): Promise<{ inserted: number; updated: number; total: number }> {
  return zapFetch('/api/contacts/import', { method: 'POST', body: JSON.stringify({ contacts }) })
}

export async function getContactStats(): Promise<{ total: number; optIn: number; optOut: number }> {
  return zapFetch('/api/contacts/stats')
}

// --- Templates ---

export async function listTemplates(): Promise<ZapTemplate[]> {
  return zapFetch('/api/templates')
}

export async function syncTemplates(): Promise<ZapTemplate[]> {
  return zapFetch('/api/templates', { method: 'POST' })
}

// --- Health ---

export async function checkHealth(): Promise<boolean> {
  try {
    await zapFetch('/api/health')
    return true
  } catch {
    return false
  }
}

// --- Metrics helpers ---

export function calculateDeliveryRate(campaign: ZapCampaign): number {
  if (!campaign.sent) return 0
  return Math.round((campaign.delivered / campaign.sent) * 100)
}

export function calculateReadRate(campaign: ZapCampaign): number {
  if (!campaign.delivered) return 0
  return Math.round((campaign.read / campaign.delivered) * 100)
}

export function calculateResponseRate(stats: ZapCampaignStats): number {
  if (!stats.delivered) return 0
  return Math.round(((stats.delivered - stats.failed) / stats.total) * 100)
}
