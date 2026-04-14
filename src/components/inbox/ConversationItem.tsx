import { memo } from 'react'
import { cn } from '../../lib/cn'
import type { InboxConversation } from '../../types/inbox'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getPreviewPrefix(preview: string | null): string {
  if (!preview) return 'Sem mensagens'
  return preview.length > 55 ? preview.slice(0, 55) + '...' : preview
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: InboxConversation
  isSelected: boolean
  onClick: () => void
}) {
  const displayName = conversation.contact?.name || conversation.phone
  const initials = displayName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '#'

  const timeAgo = formatRelativeTime(conversation.last_message_at)
  const hasUnread = conversation.unread_count > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-3 text-left transition-colors duration-150',
        'hover:bg-[var(--wa-hover)]',
        isSelected && 'bg-[var(--wa-selected)]',
        !isSelected && hasUnread && 'bg-[var(--wa-hover)]/30',
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="h-[49px] w-[49px] rounded-full bg-[var(--wa-unread-badge)]/20 flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color: 'var(--wa-unread-badge)' }}>{initials}</span>
        </div>
        {/* Mode dot */}
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2',
          'border-[var(--wa-panel)]',
          conversation.mode === 'bot' ? 'bg-red-500' : 'bg-amber-500',
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-[15px] truncate',
            hasUnread ? 'font-semibold text-[var(--wa-text)]' : 'text-[var(--wa-text)]',
          )}>
            {displayName}
          </span>
          <span className={cn(
            'text-label shrink-0',
            hasUnread ? 'text-[var(--wa-unread-badge)] font-medium' : 'text-[var(--wa-text-secondary)]',
          )}>
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[13px] text-[var(--wa-text-secondary)] truncate">
            {getPreviewPrefix(conversation.last_message_preview)}
          </span>
          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--wa-unread-badge)] text-white text-label font-bold flex items-center justify-center">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
})
