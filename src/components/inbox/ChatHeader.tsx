import { useState } from 'react'
import { ArrowLeft, Bot, User, Pause, Play, ArrowRightLeft, Sun, Moon, X, RotateCcw, Flag, MoreVertical, UserCircle } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { InboxConversation, ConversationPriority } from '../../types/inbox'

const PRIORITY_CONFIG: Record<ConversationPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-[var(--wa-text-secondary)]' },
  normal: { label: 'Normal', color: 'text-[var(--wa-text)]' },
  high: { label: 'Alta', color: 'text-amber-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' },
}

export function ChatHeader({
  conversation,
  onBack,
  onHandoff,
  onReturnToBot,
  onPause,
  onResume,
  onClose,
  onReopen,
  onSetPriority,
  theme,
  onToggleTheme,
  onToggleContactPanel,
}: {
  conversation: InboxConversation
  onBack?: () => void
  onHandoff: () => void
  onReturnToBot: () => void
  onPause: () => void
  onResume: () => void
  onClose: () => void
  onReopen: () => void
  onSetPriority: (p: ConversationPriority) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onToggleContactPanel?: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const displayName = conversation.contact?.name || conversation.phone
  const isBot = conversation.mode === 'bot'
  const isPaused = !!conversation.automation_paused_until
  const isClosed = conversation.status === 'closed'
  const priorityCfg = PRIORITY_CONFIG[conversation.priority] || PRIORITY_CONFIG.normal
  const conversationLabels = conversation.labels || []

  return (
    <div className="h-[60px] px-3 flex items-center gap-3 bg-[var(--wa-panel-header)] border-b shrink-0 relative" style={{ borderColor: 'var(--wa-border)' }}>
      {/* Back (mobile) */}
      {onBack && (
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      {/* Avatar */}
      <div className="h-10 w-10 rounded-full bg-[var(--wa-unread-badge)]/20 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--wa-unread-badge)' }}>
          {displayName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-[var(--wa-text)] truncate">{displayName}</p>
          {/* Priority badge */}
          {conversation.priority !== 'normal' && (
            <span className={cn('text-caption font-semibold px-1.5 py-0.5 rounded', priorityCfg.color, 'bg-current/10')}>
              {priorityCfg.label}
            </span>
          )}
          {/* Labels */}
          {conversationLabels.length > 0 && (
            <div className="flex gap-1">
              {conversationLabels.slice(0, 3).map(l => (
                <span key={l.id} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} title={l.name} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isBot ? (
            <span className="flex items-center gap-1 text-[12px] text-red-400"><Bot className="h-3 w-3" /> Bot</span>
          ) : (
            <span className="flex items-center gap-1 text-[12px] text-amber-400"><User className="h-3 w-3" /> Humano</span>
          )}
          {isPaused && <span className="text-caption text-amber-400 px-1 py-0.5 rounded bg-amber-400/10">Pausado</span>}
          {isClosed && <span className="text-caption text-red-400 px-1 py-0.5 rounded bg-red-400/10">Fechada</span>}
          <span className="text-[12px] text-[var(--wa-text-secondary)]">{conversation.phone}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5">
        {onToggleContactPanel && (
          <button onClick={onToggleContactPanel} className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-unread-badge)] hover:bg-[var(--wa-hover)] transition-colors" title="Dados do contato">
            <UserCircle className="h-4 w-4" />
          </button>
        )}
        <button onClick={onToggleTheme} className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors" title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {isBot ? (
          <button onClick={onHandoff} className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-amber-400 hover:bg-[var(--wa-hover)] transition-colors" title="Transferir para humano">
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={onReturnToBot} className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-red-400 hover:bg-[var(--wa-hover)] transition-colors" title="Retornar ao bot">
            <Bot className="h-4 w-4" />
          </button>
        )}

        {/* More menu */}
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-[56px] right-3 z-50 w-56 py-1.5 rounded-lg shadow-xl border" style={{ backgroundColor: 'var(--wa-panel)', borderColor: 'var(--wa-border)' }}>
            {/* Priority */}
            <div className="px-3 py-1.5">
              <p className="text-caption uppercase tracking-wider text-[var(--wa-text-secondary)] font-medium mb-1 flex items-center gap-1"><Flag className="h-3 w-3" /> Prioridade</p>
              <div className="flex gap-1">
                {(['low', 'normal', 'high', 'urgent'] as ConversationPriority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => { onSetPriority(p); setShowMenu(false) }}
                    className={cn(
                      'px-2 py-1 rounded text-label font-medium transition-colors',
                      conversation.priority === p
                        ? 'bg-[var(--wa-unread-badge)]/15 text-[var(--wa-unread-badge)]'
                        : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)]',
                    )}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t my-1" style={{ borderColor: 'var(--wa-border)' }} />

            {/* Pause/Resume */}
            {isPaused ? (
              <button onClick={() => { onResume(); setShowMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors">
                <Play className="h-4 w-4 text-[var(--wa-unread-badge)]" /> Retomar automacao
              </button>
            ) : (
              <button onClick={() => { onPause(); setShowMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors">
                <Pause className="h-4 w-4 text-amber-400" /> Pausar automacao (30min)
              </button>
            )}

            {/* Close/Reopen */}
            {isClosed ? (
              <button onClick={() => { onReopen(); setShowMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors">
                <RotateCcw className="h-4 w-4 text-[var(--wa-unread-badge)]" /> Reabrir conversa
              </button>
            ) : (
              <button onClick={() => { onClose(); setShowMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-[var(--wa-hover)] transition-colors">
                <X className="h-4 w-4" /> Fechar conversa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
