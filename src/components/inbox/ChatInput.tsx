import { useState, useRef, useCallback } from 'react'
import { Send, Mic, Sparkles, Loader2, FileText, Paperclip } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { InboxQuickReply } from '../../types/inbox'

export function ChatInput({
  onSend,
  isSending,
  quickReplies,
  onSuggest,
  isSuggesting,
}: {
  onSend: (content: string) => void
  isSending: boolean
  quickReplies: InboxQuickReply[]
  onSuggest: () => Promise<{ suggestion: string } | undefined>
  isSuggesting: boolean
}) {
  const [text, setText] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setText('')
    setShowQuickReplies(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, isSending, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setText(val)
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
    // Quick reply trigger
    setShowQuickReplies(val.startsWith('/') && val.length > 1)
  }

  const handleSuggest = async () => {
    const result = await onSuggest()
    if (result?.suggestion) {
      setText(result.suggestion)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        textareaRef.current.focus()
      }
    }
  }

  const filteredQuickReplies = quickReplies.filter(qr => {
    const query = text.slice(1).toLowerCase()
    return qr.title.toLowerCase().includes(query) || (qr.shortcut && qr.shortcut.toLowerCase().includes(query))
  })

  return (
    <div className="relative">
      {/* Quick replies dropdown */}
      {showQuickReplies && filteredQuickReplies.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-[var(--wa-panel)] border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto" style={{ borderColor: 'var(--wa-border)' }}>
          {filteredQuickReplies.map(qr => (
            <button
              key={qr.id}
              onClick={() => { setText(qr.content); setShowQuickReplies(false); textareaRef.current?.focus() }}
              className="w-full text-left px-3 py-2 hover:bg-[var(--wa-hover)] transition-colors"
            >
              <span className="text-[13px] font-medium text-[var(--wa-text)]">{qr.title}</span>
              {qr.shortcut && <span className="text-[11px] text-[var(--wa-text-secondary)] ml-2">/{qr.shortcut}</span>}
              <p className="text-[11px] text-[var(--wa-text-secondary)] truncate">{qr.content.slice(0, 60)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 px-3 py-2.5 bg-[var(--wa-panel-header)]">
        {/* Attachment placeholder */}
        <button
          className="shrink-0 p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors"
          title="Anexar arquivo"
          onClick={() => {}}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Template button */}
        <button
          className="shrink-0 p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-unread-badge)] hover:bg-[var(--wa-hover)] transition-colors"
          title="Enviar template"
          onClick={() => window.open('/#/campaigns', '_self')}
        >
          <FileText className="h-5 w-5" />
        </button>

        {/* AI suggest */}
        <button
          onClick={handleSuggest}
          disabled={isSuggesting}
          className="shrink-0 p-2 rounded-full text-[var(--wa-text-secondary)] hover:text-[var(--wa-unread-badge)] hover:bg-[var(--wa-hover)] transition-colors disabled:opacity-40"
          title="Sugestao IA"
        >
          {isSuggesting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        </button>

        {/* Textarea */}
        <div className="flex-1 bg-[var(--wa-input-bg)] rounded-lg px-3 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem"
            rows={1}
            className="w-full text-[15px] leading-[20px] text-[var(--wa-text)] placeholder:text-[var(--wa-text-secondary)] bg-transparent border-none outline-none resize-none"
            style={{ maxHeight: 120 }}
          />
        </div>

        {/* Send / Mic */}
        <button
          onClick={handleSend}
          disabled={isSending}
          className={cn(
            'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
            text.trim()
              ? 'bg-[var(--wa-unread-badge)] text-white hover:opacity-90'
              : 'text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)]',
          )}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : text.trim() ? (
            <Send className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}
