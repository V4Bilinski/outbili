import { useState, useEffect } from 'react'
import { Search, Inbox, Bell, Bot, User } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ConversationMode } from '../../types/inbox'

type Tab = 'all' | 'unread' | 'bot' | 'human'

export function ConversationSearch({
  search,
  onSearchChange,
  onModeFilterChange,
  onUnreadFilterChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  modeFilter: ConversationMode | null
  onModeFilterChange: (v: ConversationMode | null) => void
  onUnreadFilterChange: (v: boolean) => void
}) {
  const [input, setInput] = useState(search)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => onSearchChange(input), 300)
    return () => clearTimeout(t)
  }, [input, onSearchChange])

  const handleTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'all') { onModeFilterChange(null); onUnreadFilterChange(false) }
    else if (tab === 'unread') { onModeFilterChange(null); onUnreadFilterChange(true) }
    else if (tab === 'bot') { onModeFilterChange('bot'); onUnreadFilterChange(false) }
    else if (tab === 'human') { onModeFilterChange('human'); onUnreadFilterChange(false) }
  }

  const tabs: { id: Tab; label: string; icon: typeof Inbox }[] = [
    { id: 'all', label: 'Todas', icon: Inbox },
    { id: 'unread', label: 'Nao lidas', icon: Bell },
    { id: 'bot', label: 'Automatico', icon: Bot },
    { id: 'human', label: 'Manual', icon: User },
  ]

  return (
    <div className="px-3 py-2 space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--wa-text-secondary)]" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pesquisar ou comecar uma nova conversa"
          className="w-full h-[35px] rounded-lg pl-10 pr-3 text-[13px] placeholder:text-[var(--wa-text-secondary)] text-[var(--wa-text)] bg-[var(--wa-search-bg)] border-none outline-none focus:ring-1 focus:ring-[var(--wa-unread-badge)]/30 transition-all"
        />
      </div>

      {/* Tabs com icones */}
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer',
              activeTab === tab.id
                ? 'bg-[var(--wa-unread-badge)]/15 text-[var(--wa-unread-badge)]'
                : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-hover)]',
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
