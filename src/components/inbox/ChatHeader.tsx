import { ArrowLeft, Bot, User, Pause, Play, ArrowRightLeft, Sun, Moon } from 'lucide-react'
import type { InboxConversation } from '../../types/inbox'

export function ChatHeader({
  conversation,
  onBack,
  onHandoff,
  onReturnToBot,
  onPause,
  onResume,
  theme,
  onToggleTheme,
}: {
  conversation: InboxConversation
  onBack?: () => void
  onHandoff: () => void
  onReturnToBot: () => void
  onPause: () => void
  onResume: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}) {
  const displayName = conversation.contact?.name || conversation.phone
  const isBot = conversation.mode === 'bot'
  const isPaused = !!conversation.automation_paused_until

  return (
    <div className="h-[60px] px-3 flex items-center gap-3 bg-[var(--wa-panel-header)] border-b shrink-0" style={{ borderColor: 'var(--wa-border)' }}>
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
        <p className="text-[16px] font-medium text-[var(--wa-text)] truncate">{displayName}</p>
        <div className="flex items-center gap-1.5">
          {isBot ? (
            <span className="flex items-center gap-1 text-[12px] text-red-400">
              <Bot className="h-3 w-3" /> Bot
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[12px] text-amber-400">
              <User className="h-3 w-3" /> Humano
            </span>
          )}
          {isPaused && (
            <span className="text-[11px] text-warning px-1.5 py-0.5 rounded bg-warning/10">Pausado</span>
          )}
          <span className="text-[12px] text-[var(--wa-text-secondary)]">{conversation.phone}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)] hover:bg-[var(--wa-hover)] transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Mode toggle */}
        {isBot ? (
          <button
            onClick={onHandoff}
            className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-amber-400 hover:bg-[var(--wa-hover)] transition-colors"
            title="Transferir para humano"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onReturnToBot}
            className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-red-400 hover:bg-[var(--wa-hover)] transition-colors"
            title="Retornar ao bot"
          >
            <Bot className="h-4 w-4" />
          </button>
        )}

        {/* Pause/Resume */}
        {isPaused ? (
          <button
            onClick={onResume}
            className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-[var(--wa-unread-badge)] hover:bg-[var(--wa-hover)] transition-colors"
            title="Retomar automacao"
          >
            <Play className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className="p-2 rounded-lg text-[var(--wa-text-secondary)] hover:text-warning hover:bg-[var(--wa-hover)] transition-colors"
            title="Pausar automacao"
          >
            <Pause className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
