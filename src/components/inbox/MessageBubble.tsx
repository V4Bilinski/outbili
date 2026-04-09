import { memo } from 'react'
import { Check, CheckCheck, Clock, AlertCircle, FileText, Play } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { InboxMessage, DeliveryStatus } from '../../types/inbox'

function DeliveryIcon({ status }: { status: DeliveryStatus }) {
  const base = 'h-[14px] w-[14px] shrink-0'
  switch (status) {
    case 'pending': return <Clock className={cn(base, 'text-[var(--wa-timestamp)]')} />
    case 'sent': return <Check className={cn(base, 'text-[var(--wa-timestamp)]')} />
    case 'delivered': return <CheckCheck className={cn(base, 'text-[var(--wa-timestamp)]')} />
    case 'read': return <CheckCheck className={cn(base, 'text-[var(--wa-check-read)]')} />
    case 'failed': return <AlertCircle className={cn(base, 'text-red-400')} />
    default: return null
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">$1</a>',
  )
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isFirstInGroup,
}: {
  message: InboxMessage
  isFirstInGroup?: boolean
}) {
  const isOutbound = message.direction === 'outbound'
  const isNote = message.message_type === 'internal_note'

  // Internal note style
  if (isNote) {
    return (
      <div className="flex justify-center my-1 px-16">
        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-md">
          <p className="text-[11px] text-amber-400 font-medium mb-0.5">Nota interna</p>
          <p className="text-[12px] text-amber-200/80 whitespace-pre-wrap">{message.content}</p>
          <p className="text-[10px] text-amber-400/50 mt-1 text-right">{formatTime(message.created_at)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex mb-0.5 px-[7%]', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[65%] rounded-lg px-2.5 py-1.5',
          'shadow-sm',
          isOutbound ? 'bg-[var(--wa-outgoing)]' : 'bg-[var(--wa-incoming)]',
          isFirstInGroup && isOutbound && 'wa-bubble-tail-right rounded-tr-none',
          isFirstInGroup && !isOutbound && 'wa-bubble-tail-left rounded-tl-none',
        )}
        style={{ boxShadow: `0 1px 0.5px var(--wa-bubble-shadow)` }}
      >
        {/* Content by type */}
        {message.message_type === 'image' && message.media_url && (
          <div className="mb-1">
            <img
              src={message.media_url}
              alt="Imagem"
              className="rounded-md max-w-[330px] w-full cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {message.message_type === 'video' && message.media_url && (
          <div className="mb-1 relative">
            <video src={message.media_url} className="rounded-md max-w-[330px] w-full" controls preload="metadata" />
          </div>
        )}

        {message.message_type === 'audio' && message.media_url && (
          <div className="flex items-center gap-2 py-1 min-w-[200px]">
            <button className="shrink-0 w-8 h-8 rounded-full bg-[var(--wa-unread-badge)] flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </button>
            <audio src={message.media_url} controls className="flex-1 h-8" style={{ maxWidth: 240 }} />
          </div>
        )}

        {message.message_type === 'document' && (
          <a
            href={message.media_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-md bg-[var(--wa-panel)] hover:opacity-80 transition-opacity mb-1"
          >
            <FileText className="h-8 w-8 text-[var(--wa-text-secondary)] shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--wa-text)] truncate">{message.content || 'Documento'}</p>
              <p className="text-[11px] text-[var(--wa-text-secondary)]">Abrir documento</p>
            </div>
          </a>
        )}

        {/* Text content */}
        {(message.message_type === 'text' || message.message_type === 'template' || message.message_type === 'interactive') && (
          <p
            className="text-[14.2px] leading-[19px] text-[var(--wa-text)] whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: linkify(message.content) }}
          />
        )}

        {/* Timestamp + delivery status */}
        <div className={cn(
          'flex items-center justify-end gap-1 mt-0.5',
          '-mb-0.5',
        )}>
          <span className="text-[11px] leading-none" style={{ color: 'var(--wa-timestamp)' }}>
            {formatTime(message.created_at)}
          </span>
          {isOutbound && <DeliveryIcon status={message.delivery_status} />}
        </div>
      </div>
    </div>
  )
})
