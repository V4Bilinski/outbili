import { MessageSquare } from 'lucide-react'

export function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--wa-bg)] wa-wallpaper">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-full bg-[var(--wa-unread-badge)]/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8" style={{ color: 'var(--wa-unread-badge)' }} />
        </div>
        <h3 className="text-xl font-medium text-[var(--wa-text)] mb-2">Mensagens WhatsApp</h3>
        <p className="text-[14px] text-[var(--wa-text-secondary)] leading-relaxed">
          Selecione uma conversa ao lado para visualizar mensagens e interagir com seus contatos.
        </p>
      </div>
    </div>
  )
}
