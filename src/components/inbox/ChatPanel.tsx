import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import type { InboxConversation, InboxMessage, InboxQuickReply, ConversationPriority } from '../../types/inbox'

export function ChatPanel({
  conversation,
  messages,
  isLoadingMessages,
  hasMoreMessages,
  onLoadMore,
  onSend,
  isSending,
  quickReplies,
  onSuggest,
  isSuggesting,
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
}: {
  conversation: InboxConversation
  messages: InboxMessage[]
  isLoadingMessages: boolean
  hasMoreMessages: boolean
  onLoadMore: () => void
  onSend: (content: string) => void
  isSending: boolean
  quickReplies: InboxQuickReply[]
  onSuggest: () => Promise<{ suggestion: string } | undefined>
  isSuggesting: boolean
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
}) {
  return (
    <div className="flex flex-col h-full bg-[var(--wa-bg)]">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onHandoff={onHandoff}
        onReturnToBot={onReturnToBot}
        onPause={onPause}
        onResume={onResume}
        onClose={onClose}
        onReopen={onReopen}
        onSetPriority={onSetPriority}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        hasMore={hasMoreMessages}
        onLoadMore={onLoadMore}
      />
      <ChatInput
        onSend={onSend}
        isSending={isSending}
        quickReplies={quickReplies}
        onSuggest={onSuggest}
        isSuggesting={isSuggesting}
      />
    </div>
  )
}
