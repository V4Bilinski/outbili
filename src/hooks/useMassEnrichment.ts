import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { enrichLead, type EnrichmentProgress } from '../services/enrichmentService'
import { getLead } from '../services/leadService'
import type { Lead } from '../types'

const STORAGE_KEY = 'outbili_enrichment_queue'
const CONCURRENCY = 2

export interface LeadEnrichmentStatus {
  leadId: string
  companyName: string
  status: 'queued' | 'enriching' | 'done' | 'error'
  progress: EnrichmentProgress | null
  sourcesFound: number
  error?: string
  startedAt?: number
  finishedAt?: number
}

export interface MassEnrichmentState {
  isRunning: boolean
  queue: LeadEnrichmentStatus[]
  currentIndex: number
  totalLeads: number
  completedLeads: number
  failedLeads: number
  avgTimePerLead: number
  etaSeconds: number
}

// --- localStorage persistence ---

function saveQueue(queue: LeadEnrichmentStatus[]) {
  try {
    const pending = queue.filter((q) => q.status === 'queued' || q.status === 'enriching')
    if (pending.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending.map((q) => ({
      leadId: q.leadId,
      companyName: q.companyName,
    }))))
  } catch { /* quota exceeded or private mode */ }
}

export function loadPendingQueue(): Array<{ leadId: string; companyName: string }> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export function clearPendingQueue() {
  localStorage.removeItem(STORAGE_KEY)
}

// --- Browser notifications ---

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' })
  }
}

// --- Main hook ---

export function useMassEnrichment() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<MassEnrichmentState>({
    isRunning: false,
    queue: [],
    currentIndex: 0,
    totalLeads: 0,
    completedLeads: 0,
    failedLeads: 0,
    avgTimePerLead: 0,
    etaSeconds: 0,
  })
  const abortRef = useRef(false)
  const originalTitle = useRef(document.title)

  // Restore document title on unmount
  useEffect(() => {
    return () => { document.title = originalTitle.current }
  }, [])

  // Update document title with progress
  useEffect(() => {
    if (state.isRunning && state.totalLeads > 0) {
      document.title = `(${state.completedLeads}/${state.totalLeads}) Outbili`
    } else if (!state.isRunning && state.totalLeads > 0 && state.completedLeads > 0) {
      document.title = originalTitle.current
    }
  }, [state.isRunning, state.completedLeads, state.totalLeads])

  const processLead = useCallback(async (
    lead: Lead,
    index: number,
    counters: { completed: number; failed: number; times: number[] },
  ) => {
    // Mark as enriching
    setState((s) => ({
      ...s,
      queue: s.queue.map((q, idx) =>
        idx === index ? { ...q, status: 'enriching', startedAt: Date.now() } : q,
      ),
    }))

    const startTime = Date.now()

    try {
      await enrichLead(lead.id, lead, (progress) => {
        const sourcesFound = progress.steps.filter((s) => s.status === 'done').length
        setState((s) => ({
          ...s,
          queue: s.queue.map((q, idx) =>
            idx === index ? { ...q, progress, sourcesFound } : q,
          ),
        }))
      })

      const elapsed = (Date.now() - startTime) / 1000
      counters.completed++
      counters.times.push(elapsed)
      const avg = counters.times.reduce((a, b) => a + b, 0) / counters.times.length
      const remaining = state.totalLeads - counters.completed - counters.failed

      setState((s) => ({
        ...s,
        completedLeads: counters.completed,
        avgTimePerLead: Math.round(avg),
        etaSeconds: Math.round(avg * remaining / CONCURRENCY),
        queue: s.queue.map((q, idx) =>
          idx === index
            ? {
                ...q,
                status: 'done' as const,
                finishedAt: Date.now(),
                sourcesFound: q.progress?.steps.filter((s) => s.status === 'done').length || 0,
              }
            : q,
        ),
      }))

      // Invalidate React Query so dashboard updates in real-time
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', lead.id] })
    } catch (err: any) {
      counters.failed++
      setState((s) => ({
        ...s,
        failedLeads: counters.failed,
        queue: s.queue.map((q, idx) =>
          idx === index ? { ...q, status: 'error' as const, error: err.message, finishedAt: Date.now() } : q,
        ),
      }))
    }

    // Persist remaining queue
    setState((s) => {
      saveQueue(s.queue)
      return s
    })
  }, [queryClient, state.totalLeads])

  const enrichAll = useCallback(async (leads: Lead[]) => {
    if (leads.length === 0) return
    abortRef.current = false
    requestNotificationPermission()

    const queue: LeadEnrichmentStatus[] = leads.map((l) => ({
      leadId: l.id,
      companyName: l.companyName || 'Lead sem nome',
      status: 'queued',
      progress: null,
      sourcesFound: 0,
    }))

    setState({
      isRunning: true,
      queue,
      currentIndex: 0,
      totalLeads: leads.length,
      completedLeads: 0,
      failedLeads: 0,
      avgTimePerLead: 0,
      etaSeconds: 0,
    })

    saveQueue(queue)
    const counters = { completed: 0, failed: 0, times: [] as number[] }

    // Process with concurrency pool
    let nextIndex = 0
    const total = leads.length

    async function runNext(): Promise<void> {
      while (nextIndex < total && !abortRef.current) {
        const i = nextIndex++
        await processLead(leads[i], i, counters)
      }
    }

    // Launch CONCURRENCY workers
    const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => runNext())
    await Promise.all(workers)

    setState((s) => ({ ...s, isRunning: false }))
    clearPendingQueue()

    // Browser notification
    sendNotification(
      'Enriquecimento concluído',
      `${counters.completed} leads enriquecidos com sucesso${counters.failed > 0 ? ` (${counters.failed} com erro)` : ''}`,
    )

    // Final React Query invalidation
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  }, [processLead, queryClient])

  // Resume from localStorage
  const resumeFromStorage = useCallback(async () => {
    const pending = loadPendingQueue()
    if (!pending || pending.length === 0) return

    // Fetch full lead data from Airtable
    const leads: Lead[] = []
    for (const item of pending) {
      try {
        const lead = await getLead(item.leadId)
        leads.push(lead)
      } catch {
        // Lead may have been deleted
      }
    }

    if (leads.length > 0) {
      await enrichAll(leads)
    } else {
      clearPendingQueue()
    }
  }, [enrichAll])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    clearPendingQueue()
    document.title = originalTitle.current
    setState({
      isRunning: false,
      queue: [],
      currentIndex: 0,
      totalLeads: 0,
      completedLeads: 0,
      failedLeads: 0,
      avgTimePerLead: 0,
      etaSeconds: 0,
    })
  }, [])

  return { ...state, enrichAll, resumeFromStorage, abort, reset }
}
