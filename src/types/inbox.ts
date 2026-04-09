// Tipos do Inbox — espelhados do BilinskiZap types.ts (linhas 536-698)

export type ConversationStatus = 'open' | 'closed'
export type ConversationMode = 'bot' | 'human'
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MessageDirection = 'inbound' | 'outbound'
export type InboxMessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'template' | 'interactive' | 'internal_note'
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'frustrated'

export interface InboxConversation {
  id: string
  contact_id: string | null
  ai_agent_id: string | null
  phone: string
  status: ConversationStatus
  mode: ConversationMode
  priority: ConversationPriority
  unread_count: number
  total_messages: number
  last_message_at: string | null
  last_message_preview: string | null
  automation_paused_until: string | null
  automation_paused_by: string | null
  handoff_summary: string | null
  human_mode_expires_at: string | null
  assigned_to: string | null
  campaign_id: string | null
  source: 'organic' | 'campaign' | 'flow' | 'manual'
  reply_status: 'replied' | 'unreplied'
  created_at: string
  updated_at: string
  contact?: {
    id: string
    name: string
    phone: string
    email?: string
    tags?: string[]
    custom_fields?: Record<string, string>
  }
  labels?: InboxLabel[]
  ai_agent?: {
    id: string
    name: string
  }
}

export interface InboxMessage {
  id: string
  conversation_id: string
  direction: MessageDirection
  content: string
  message_type: InboxMessageType
  media_url: string | null
  whatsapp_message_id: string | null
  delivery_status: DeliveryStatus
  ai_response_id: string | null
  ai_sentiment: Sentiment | null
  ai_sources: Array<{ title: string; content: string }> | null
  payload: Record<string, unknown> | null
  created_at: string
}

export interface InboxLabel {
  id: string
  name: string
  color: string
  created_at: string
}

export interface InboxQuickReply {
  id: string
  title: string
  content: string
  shortcut: string | null
  created_at: string
}

export interface ConversationListParams {
  page?: number
  limit?: number
  status?: ConversationStatus
  mode?: ConversationMode
  search?: string
  labelId?: string
  replyStatus?: 'replied' | 'unreplied' | 'all'
}

export interface ConversationListResult {
  conversations: InboxConversation[]
  total: number
  page: number
  totalPages: number
}

export interface MessageListResult {
  messages: InboxMessage[]
  hasMore: boolean
}

export interface ReplyStatusCounts {
  all: number
  replied: number
  unreplied: number
}
