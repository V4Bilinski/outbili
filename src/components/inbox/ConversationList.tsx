import { ConversationSearch } from './ConversationSearch'
import { ConversationItem } from './ConversationItem'
import { Skeleton } from '../ui/Skeleton'
import { MessageSquare } from 'lucide-react'
import type { InboxConversation, ConversationMode } from '../../types/inbox'

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

      {/* Search + Tabs */}
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
