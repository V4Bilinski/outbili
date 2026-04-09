import { useState } from 'react'
import { useInbox } from '../hooks/useInbox'
import { ConversationList } from '../components/inbox/ConversationList'
import { ChatPanel } from '../components/inbox/ChatPanel'
import { EmptyChat } from '../components/inbox/EmptyChat'
import { ContactPanel } from '../components/inbox/ContactPanel'
import { cn } from '../lib/cn'
import { useSidebar } from '../lib/sidebar-context'

export function InboxPage() {
  const inbox = useInbox()
  const { collapsed } = useSidebar()
  const [showChat, setShowChat] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const handleSelectConversation = (id: string) => {
    inbox.setSelectedId(id)
    setShowChat(true)
  }

  const handleBack = () => {
    setShowChat(false)
    setShowContact(false)
    inbox.setSelectedId(null)
  }

  return (
    <div
      className={cn(
        'wa-inbox fixed inset-0 flex',
        inbox.theme === 'light' && 'wa-light',
        collapsed ? 'md:left-[72px]' : 'md:left-[260px]',
      )}
      style={{ transition: 'left 0.3s ease-in-out' }}
    >
      {/* Conversation List */}
      <div className={cn(
        'w-full md:w-[380px] md:min-w-[380px] shrink-0 h-full',
        showChat ? 'hidden md:block' : 'block',
      )}>
        <ConversationList
          conversations={inbox.conversations}
          selectedId={inbox.selectedId}
          onSelect={handleSelectConversation}
          isLoading={inbox.isLoadingConversations}
          search={inbox.search}
          onSearchChange={inbox.setSearch}
          modeFilter={inbox.modeFilter}
          onModeFilterChange={inbox.setModeFilter}
          unreadOnly={unreadOnly}
          onUnreadFilterChange={setUnreadOnly}
          replyStatusFilter={inbox.replyStatusFilter}
          onReplyStatusChange={inbox.setReplyStatusFilter}
          replyCounts={inbox.replyCounts}
        />
      </div>

      {/* Chat Panel or Empty state */}
      <div className={cn(
        'flex-1 h-full',
        !showChat ? 'hidden md:flex' : 'flex',
      )}>
        {inbox.selectedConversation ? (
          <ChatPanel
            conversation={inbox.selectedConversation}
            messages={inbox.messages}
            isLoadingMessages={inbox.isLoadingMessages}
            hasMoreMessages={inbox.hasMoreMessages}
            onLoadMore={inbox.loadMoreMessages}
            onSend={inbox.sendMessage}
            isSending={inbox.isSending}
            quickReplies={inbox.quickReplies}
            onSuggest={inbox.suggest}
            isSuggesting={inbox.isSuggesting}
            onBack={handleBack}
            onHandoff={inbox.handoff}
            onReturnToBot={inbox.returnToBot}
            onPause={() => inbox.pause(30)}
            onResume={inbox.resume}
            onClose={inbox.close}
            onReopen={inbox.reopen}
            onSetPriority={inbox.setPriority}
            theme={inbox.theme}
            onToggleTheme={inbox.toggleTheme}
            onToggleContactPanel={() => setShowContact(!showContact)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Contact Panel (desktop only, collapsible) */}
      {showContact && inbox.selectedConversation && (
        <div className="hidden md:block h-full">
          <ContactPanel
            conversation={inbox.selectedConversation}
            onClose={() => setShowContact(false)}
          />
        </div>
      )}
    </div>
  )
}
