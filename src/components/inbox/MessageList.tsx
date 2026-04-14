import { useRef, useEffect, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { Skeleton } from '../ui/Skeleton'
import { Lock, ChevronDown } from 'lucide-react'
import type { InboxMessage } from '../../types/inbox'

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (d.toDateString() === today.toDateString()) label = 'HOJE'
  else if (d.toDateString() === yesterday.toDateString()) label = 'ONTEM'
  else label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-lg text-[12px] font-medium shadow-sm" style={{
        backgroundColor: 'var(--wa-system-bubble)',
        color: 'var(--wa-text-secondary)',
      }}>
        {label}
      </span>
    </div>
  )
}

function shouldShowDate(messages: InboxMessage[], index: number): boolean {
  if (index === 0) return true
  const prev = new Date(messages[index - 1].created_at).toDateString()
  const curr = new Date(messages[index].created_at).toDateString()
  return prev !== curr
}

function isFirstInGroup(messages: InboxMessage[], index: number): boolean {
  if (index === 0) return true
  return messages[index].direction !== messages[index - 1].direction
}

export function MessageList({
  messages,
  isLoading,
  hasMore,
  onLoadMore,
}: {
  messages: InboxMessage[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length - prevLengthRef.current <= 2 ? 'smooth' : 'auto' })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto wa-wallpaper relative"
      onScroll={() => {
        if (!containerRef.current) return
        if (hasMore && containerRef.current.scrollTop < 100) onLoadMore()
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200)
      }}
    >
      <div className="min-h-full flex flex-col justify-end py-3">
        {/* Encryption notice */}
        <div className="flex justify-center mb-4 px-12">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
            backgroundColor: 'var(--wa-system-bubble)',
          }}>
            <Lock className="h-3 w-3 text-[var(--wa-text-secondary)]" />
            <span className="text-label text-[var(--wa-text-secondary)]">
              Mensagens protegidas com criptografia de ponta a ponta
            </span>
          </div>
        </div>

        {isLoading && messages.length === 0 ? (
          <div className="px-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} px-[7%]`}>
                <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-lg`} />
              </div>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id}>
              {shouldShowDate(messages, i) && <DateSeparator date={msg.created_at} />}
              <MessageBubble message={msg} isFirstInGroup={isFirstInGroup(messages, i)} />
            </div>
          ))
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-4 right-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--wa-panel)', border: '1px solid var(--wa-border)' }}
        >
          <ChevronDown className="h-5 w-5 text-[var(--wa-text-secondary)]" />
        </button>
      )}
    </div>
  )
}
