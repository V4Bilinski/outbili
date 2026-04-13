import { X, Phone, Mail, Tag } from 'lucide-react'
import type { InboxConversation } from '../../types/inbox'

export function ContactPanel({
  conversation,
  onClose,
}: {
  conversation: InboxConversation
  onClose: () => void
}) {
  const contact = conversation.contact
  const displayName = contact?.name || conversation.phone

  return (
    <div className="w-[320px] h-full border-l flex flex-col bg-[var(--wa-panel)]" style={{ borderColor: 'var(--wa-border)' }}>
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--wa-panel-header)] shrink-0 border-b" style={{ borderColor: 'var(--wa-border)' }}>
        <h3 className="text-[14px] font-medium text-[var(--wa-text)]">Dados do contato</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar + Name */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--wa-unread-badge)]/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold" style={{ color: 'var(--wa-unread-badge)' }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h4 className="text-[16px] font-semibold text-[var(--wa-text)]">{displayName}</h4>
          <p className="text-[13px] text-[var(--wa-text-secondary)]">{conversation.phone}</p>
          {conversation.mode && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
              backgroundColor: conversation.mode === 'bot' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              color: conversation.mode === 'bot' ? '#f87171' : '#fbbf24',
            }}>
              {conversation.mode === 'bot' ? 'Bot' : 'Humano'}
            </span>
          )}
        </div>

        {/* Contact Details */}
        {contact && (
          <div className="space-y-2.5">
            <h5 className="text-[10px] uppercase tracking-wider text-[var(--wa-text-secondary)] font-medium">Informacoes</h5>

            {contact.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[var(--wa-text-secondary)] shrink-0" />
                <span className="text-[13px] text-[var(--wa-text)] truncate">{contact.email}</span>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[var(--wa-text-secondary)] shrink-0" />
                <span className="text-[13px] text-[var(--wa-text)]">{contact.phone}</span>
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex items-start gap-2.5">
                <Tag className="h-4 w-4 text-[var(--wa-text-secondary)] shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--wa-unread-badge)]/10 text-[var(--wa-unread-badge)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Fields */}
        {contact?.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[10px] uppercase tracking-wider text-[var(--wa-text-secondary)] font-medium">Campos personalizados</h5>
            {Object.entries(contact.custom_fields).map(([key, value]) => (
              <div key={key} className="flex justify-between text-[12px]">
                <span className="text-[var(--wa-text-secondary)] capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-[var(--wa-text)] font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conversation Stats */}
        <div className="space-y-2">
          <h5 className="text-[10px] uppercase tracking-wider text-[var(--wa-text-secondary)] font-medium">Conversa</h5>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--wa-search-bg)' }}>
              <p className="text-[16px] font-bold text-[var(--wa-text)]">{conversation.total_messages}</p>
              <p className="text-[10px] text-[var(--wa-text-secondary)]">Mensagens</p>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--wa-search-bg)' }}>
              <p className="text-[16px] font-bold text-[var(--wa-text)]">{conversation.unread_count}</p>
              <p className="text-[10px] text-[var(--wa-text-secondary)]">Não lidas</p>
            </div>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--wa-text-secondary)]">Origem</span>
            <span className="text-[var(--wa-text)] capitalize">{conversation.source}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--wa-text-secondary)]">Status</span>
            <span className="text-[var(--wa-text)] capitalize">{conversation.status}</span>
          </div>
          {conversation.last_message_at && (
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--wa-text-secondary)]">Ultima mensagem</span>
              <span className="text-[var(--wa-text)]">{new Date(conversation.last_message_at).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {conversation.labels && conversation.labels.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-[10px] uppercase tracking-wider text-[var(--wa-text-secondary)] font-medium">Etiquetas</h5>
            <div className="flex flex-wrap gap-1.5">
              {conversation.labels.map(label => (
                <span key={label.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[var(--wa-text)]" style={{ backgroundColor: label.color + '20', borderLeft: `3px solid ${label.color}` }}>
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
