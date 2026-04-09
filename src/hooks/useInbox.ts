import { useState, useCallback, useEffect } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listConversations,
  getConversation,
  listMessages,
  sendMessage as sendMessageApi,
  markConversationRead,
  handoffConversation,
  returnToBot,
  pauseAutomation,
  resumeAutomation,
  closeConversation,
  reopenConversation,
  setPriority as setPriorityApi,
  listLabels,
  listQuickReplies,
  suggestReply,
  getReplyStatusCounts,
} from '../services/inboxService'
import type { ConversationMode, ConversationStatus, ConversationPriority, InboxMessage } from '../types/inbox'
import { toast } from 'sonner'

export function useInbox() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | null>(null)
  const [modeFilter, setModeFilter] = useState<ConversationMode | null>(null)
  const [replyStatusFilter, setReplyStatusFilter] = useState<'all' | 'replied' | 'unreplied'>('all')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('outbili-inbox-theme') as 'dark' | 'light') || 'dark' } catch { return 'dark' }
  })

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('outbili-inbox-theme', next)
      return next
    })
  }, [])

  // Conversations
  const conversationsQuery = useQuery({
    queryKey: ['inbox-conversations', statusFilter, modeFilter, search, replyStatusFilter],
    queryFn: () => listConversations({
      status: statusFilter || undefined,
      mode: modeFilter || undefined,
      search: search || undefined,
      replyStatus: replyStatusFilter,
      limit: 50,
    }),
    staleTime: 8_000,
    refetchInterval: 8_000,
  })

  const conversations = conversationsQuery.data?.conversations || []

  // Selected conversation detail
  const conversationQuery = useQuery({
    queryKey: ['inbox-conversation', selectedId],
    queryFn: () => getConversation(selectedId!),
    enabled: !!selectedId,
    staleTime: 5_000,
  })

  // Messages (infinite scroll)
  const messagesQuery = useInfiniteQuery({
    queryKey: ['inbox-messages', selectedId],
    queryFn: ({ pageParam }) => listMessages(selectedId!, { before: pageParam, limit: 50 }),
    enabled: !!selectedId,
    staleTime: 5_000,
    refetchInterval: 5_000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined
      return lastPage.messages[lastPage.messages.length - 1].created_at
    },
  })

  const messages = (messagesQuery.data?.pages || []).flatMap(p => p.messages).reverse()

  // Auto mark as read when selecting a conversation
  useEffect(() => {
    if (selectedId) {
      markConversationRead(selectedId).catch(() => {})
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
    }
  }, [selectedId, qc])

  // Send message
  const sendMutation = useMutation({
    mutationFn: ({ content }: { content: string }) => sendMessageApi(selectedId!, { content }),
    onMutate: async ({ content }) => {
      const optimistic: InboxMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedId!,
        direction: 'outbound',
        content,
        message_type: 'text',
        media_url: null,
        whatsapp_message_id: null,
        delivery_status: 'pending',
        ai_response_id: null,
        ai_sentiment: null,
        ai_sources: null,
        payload: null,
        created_at: new Date().toISOString(),
      }
      qc.setQueryData(['inbox-messages', selectedId], (old: any) => {
        if (!old?.pages?.length) return { pages: [{ messages: [optimistic], hasMore: false }], pageParams: [undefined] }
        const pages = [...old.pages]
        pages[0] = { ...pages[0], messages: [optimistic, ...pages[0].messages] }
        return { ...old, pages }
      })
    },
    onSuccess: () => {
      // Auto-switch to human mode when operator sends manually
      const conv = conversationQuery.data
      if (conv?.mode === 'bot') {
        handoffConversation(selectedId!).catch(() => {})
        qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
        toast.info('Modo alterado para humano automaticamente')
      }
      qc.invalidateQueries({ queryKey: ['inbox-messages', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
    },
    onError: (err: Error) => toast.error(`Erro ao enviar: ${err.message}`),
  })

  // Actions
  const handoffMutation = useMutation({
    mutationFn: () => handoffConversation(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
      toast.success('Conversa transferida para modo humano')
    },
  })

  const returnToBotMutation = useMutation({
    mutationFn: () => returnToBot(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
      toast.success('Conversa retornada ao bot')
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (minutes: number) => pauseAutomation(selectedId!, minutes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      toast.success('Automacao pausada')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: () => resumeAutomation(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      toast.success('Automacao retomada')
    },
  })

  // Close/Reopen
  const closeMutation = useMutation({
    mutationFn: () => closeConversation(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
      toast.success('Conversa fechada')
    },
  })

  const reopenMutation = useMutation({
    mutationFn: () => reopenConversation(selectedId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
      toast.success('Conversa reaberta')
    },
  })

  // Priority
  const priorityMutation = useMutation({
    mutationFn: (priority: ConversationPriority) => setPriorityApi(selectedId!, priority),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbox-conversation', selectedId] })
      qc.invalidateQueries({ queryKey: ['inbox-conversations'] })
      toast.success('Prioridade atualizada')
    },
  })

  // Labels & Quick Replies (cached long)
  const labelsQuery = useQuery({
    queryKey: ['inbox-labels'],
    queryFn: listLabels,
    staleTime: 5 * 60_000,
  })

  const quickRepliesQuery = useQuery({
    queryKey: ['inbox-quick-replies'],
    queryFn: listQuickReplies,
    staleTime: 5 * 60_000,
  })

  // AI suggest
  const suggestMutation = useMutation({
    mutationFn: () => suggestReply(selectedId!),
  })

  // Reply counts (for sidebar badge)
  const countsQuery = useQuery({
    queryKey: ['inbox-reply-counts'],
    queryFn: getReplyStatusCounts,
    staleTime: 15_000,
    refetchInterval: 15_000,
  })

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  return {
    // Selection
    selectedId,
    setSelectedId,

    // Conversations
    conversations,
    isLoadingConversations: conversationsQuery.isLoading,
    selectedConversation: conversationQuery.data || null,

    // Messages
    messages,
    isLoadingMessages: messagesQuery.isLoading,
    hasMoreMessages: messagesQuery.hasNextPage || false,
    loadMoreMessages: () => messagesQuery.fetchNextPage(),

    // Send
    sendMessage: (content: string) => sendMutation.mutate({ content }),
    isSending: sendMutation.isPending,

    // Actions
    handoff: () => handoffMutation.mutate(),
    returnToBot: () => returnToBotMutation.mutate(),
    pause: (minutes: number) => pauseMutation.mutate(minutes),
    resume: () => resumeMutation.mutate(),
    close: () => closeMutation.mutate(),
    reopen: () => reopenMutation.mutate(),
    setPriority: (p: ConversationPriority) => priorityMutation.mutate(p),

    // AI
    suggest: () => suggestMutation.mutateAsync(),
    isSuggesting: suggestMutation.isPending,

    // Filters
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    replyStatusFilter,
    setReplyStatusFilter,

    // Data
    labels: labelsQuery.data || [],
    quickReplies: quickRepliesQuery.data || [],
    totalUnread,
    replyCounts: countsQuery.data || { all: 0, replied: 0, unreplied: 0 },

    // Theme
    theme,
    toggleTheme,
  }
}
