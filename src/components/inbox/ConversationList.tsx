import { ConversationSearch } from './ConversationSearch'
import { ConversationItem } from './ConversationItem'
import { Skeleton } from '../ui/Skeleton'
import { MessageSquare } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { InboxConversation, ConversationMode, ReplyStatusCounts } from '../../types/inbox'

function ReplyStatusTabs({
  active,
  onChange,
  counts,
}: {
  active: 'all' | 'replied' | 'unreplied'
  onChange: (v: 'all' | 'replied' | 'unreplied') => void
  counts: ReplyStatusCounts
}) {
  const tabs = [
    { id: 'all' as const, label: 'Todas', count: counts.all },
    { id: 'unreplied' as const, label: 'Pendentes', count: counts.unreplied },
    { id: 'replied' as const, label: 'Respondidas', count: counts.replied },
  ]

  return (
    <div className="flex border-b" style={{ borderColor: 'var(--wa-border)' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 py-2.5 text-[12px] font-medium transition-colors relative',
            active === tab.id
              ? 'text-[var(--wa-unread-badge)]'
              : 'text-[var(--wa-text-secondary)] hover:text-[var(--wa-text)]',
          )}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={cn(
              'ml-1 text-[10px] font-bold',
              active === tab.id ? 'text-[var(--wa-unread-badge)]' : 'text-[var(--wa-text-secondary)]',
            )}>
              {tab.count}
            </span>
          )}
          {active === tab.id && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-[var(--wa-unread-badge)]" />
          )}
        </button>
      ))}
    </div>
  )
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  search,
  onSearchChange,
  modeFilter,
  onModeFilterChange,
  unreadOnly,
  onUnreadFilterChange,
  replyStatusFilter,
  onReplyStatusChange,
  replyCounts,
}: {
  conversations: InboxConversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
  search: string
  onSearchChange: (v: string) => void
  modeFilter: ConversationMode | null
  onModeFilterChange: (v: ConversationMode | null) => void
  unreadOnly: boolean
  onUnreadFilterChange: (v: boolean) => void
  replyStatusFilter: 'all' | 'replied' | 'unreplied'
  onReplyStatusChange: (v: 'all' | 'replied' | 'unreplied') => void
  replyCounts: ReplyStatusCounts
}) {
  const filtered = unreadOnly
    ? conversations.filter(c => c.unread_count > 0)
    : conversations

  return (
    <div className="flex flex-col h-full bg-[var(--wa-panel)] border-r" style={{ borderColor: 'var(--wa-border)' }}>
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--wa-panel-header)] shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--wa-text)]">Inbox</h2>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono text-[var(--wa-text-secondary)]">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Reply Status Tabs */}
      <ReplyStatusTabs active={replyStatusFilter} onChange={onReplyStatusChange} counts={replyCounts} />

      {/* Search + Mode Tabs */}
      <ConversationSearch
        search={search}
        onSearchChange={onSearchChange}
        modeFilter={modeFilter}
        onModeFilterChange={onModeFilterChange}
        onUnreadFilterChange={onUnreadFilterChange}
      />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-3 space-y-3 py-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-[49px] w-[49px] rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageSquare className="h-10 w-10 text-[var(--wa-text-secondary)] opacity-30 mb-3" />
            <p className="text-sm text-[var(--wa-text-secondary)]">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
