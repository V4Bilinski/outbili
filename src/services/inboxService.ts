import { zapFetch } from '../lib/bilinskizap'
import type {
  InboxConversation,
  InboxMessage,
  InboxLabel,
  InboxQuickReply,
  ConversationListParams,
  ConversationListResult,
  MessageListResult,
  ReplyStatusCounts,
  ConversationPriority,
} from '../types/inbox'

// === Conversations ===

export async function listConversations(params?: ConversationListParams): Promise<ConversationListResult> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.status) qs.set('status', params.status)
  if (params?.mode) qs.set('mode', params.mode)
  if (params?.search) qs.set('search', params.search)
  if (params?.labelId) qs.set('labelId', params.labelId)
  if (params?.replyStatus && params.replyStatus !== 'all') qs.set('replyStatus', params.replyStatus)
  return zapFetch(`/api/inbox/conversations?${qs}`)
}

export async function getConversation(id: string): Promise<InboxConversation> {
  return zapFetch(`/api/inbox/conversations/${id}`)
}

export async function markConversationRead(id: string): Promise<void> {
  await zapFetch(`/api/inbox/conversations/${id}/read`, { method: 'POST' })
}

export async function updateConversation(id: string, data: { priority?: ConversationPriority; status?: string }): Promise<InboxConversation> {
  return zapFetch(`/api/inbox/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// === Messages ===

export async function listMessages(conversationId: string, params?: { before?: string; limit?: number }): Promise<MessageListResult> {
  const qs = new URLSearchParams()
  if (params?.before) qs.set('before', params.before)
  if (params?.limit) qs.set('limit', String(params.limit))
  return zapFetch(`/api/inbox/conversations/${conversationId}/messages?${qs}`)
}

export async function sendMessage(conversationId: string, data: { content: string; message_type?: string }): Promise<InboxMessage> {
  return zapFetch(`/api/inbox/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function closeConversation(id: string): Promise<InboxConversation> {
  return updateConversation(id, { status: 'closed' })
}

export async function reopenConversation(id: string): Promise<InboxConversation> {
  return updateConversation(id, { status: 'open' })
}

export async function setPriority(id: string, priority: ConversationPriority): Promise<InboxConversation> {
  return updateConversation(id, { priority })
}

// === Actions ===

export async function handoffConversation(id: string, data?: { reason?: string; summary?: string }): Promise<void> {
  await zapFetch(`/api/inbox/conversations/${id}/handoff`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

export async function returnToBot(id: string): Promise<void> {
  await zapFetch(`/api/inbox/conversations/${id}/return-to-bot`, { method: 'DELETE' })
}

export async function pauseAutomation(id: string, durationMinutes: number, reason?: string): Promise<void> {
  await zapFetch(`/api/inbox/conversations/${id}/pause`, {
    method: 'POST',
    body: JSON.stringify({ duration_minutes: durationMinutes, reason }),
  })
}

export async function resumeAutomation(id: string): Promise<void> {
  await zapFetch(`/api/inbox/conversations/${id}/resume`, { method: 'POST' })
}

export async function assignConversation(id: string, assignedTo: string | null): Promise<InboxConversation> {
  return zapFetch(`/api/inbox/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: assignedTo }),
  })
}

// === Labels ===

export async function listLabels(): Promise<InboxLabel[]> {
  return zapFetch('/api/inbox/labels')
}

// === Quick Replies ===

export async function listQuickReplies(): Promise<InboxQuickReply[]> {
  return zapFetch('/api/inbox/quick-replies')
}

// === AI ===

export async function suggestReply(conversationId: string): Promise<{ suggestion: string; sentiment?: string; confidence?: number }> {
  return zapFetch('/api/inbox/suggest', {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
  })
}

// === Counts ===

export async function getReplyStatusCounts(): Promise<ReplyStatusCounts> {
  return zapFetch('/api/inbox/conversations/reply-counts')
}
