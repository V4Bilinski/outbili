import { useState, useCallback, useRef } from 'react'
import { enrichLead, type EnrichmentProgress } from '../services/enrichmentService'
import type { Lead } from '../types'

export interface LeadEnrichmentStatus {
  leadId: string
  companyName: string
  status: 'queued' | 'enriching' | 'done' | 'error'
  progress: EnrichmentProgress | null
  sourcesFound: number
  error?: string
}

export interface MassEnrichmentState {
  isRunning: boolean
  queue: LeadEnrichmentStatus[]
  currentIndex: number
  totalLeads: number
  completedLeads: number
  failedLeads: number
}

export function useMassEnrichment() {
  const [state, setState] = useState<MassEnrichmentState>({
    isRunning: false,
    queue: [],
    currentIndex: 0,
    totalLeads: 0,
    completedLeads: 0,
    failedLeads: 0,
  })
  const abortRef = useRef(false)

  const enrichAll = useCallback(async (leads: Lead[]) => {
    if (leads.length === 0) return
    abortRef.current = false

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
    })

    let completed = 0
    let failed = 0

    for (let i = 0; i < leads.length; i++) {
      if (abortRef.current) break

      const lead = leads[i]

      // Mark current as enriching
      setState((s) => ({
        ...s,
        currentIndex: i,
        queue: s.queue.map((q, idx) =>
          idx === i ? { ...q, status: 'enriching' } : q,
        ),
      }))

      try {
        await enrichLead(lead.id, lead, (progress) => {
          const sourcesFound = progress.steps.filter((s) => s.status === 'done').length
          setState((s) => ({
            ...s,
            queue: s.queue.map((q, idx) =>
              idx === i ? { ...q, progress, sourcesFound } : q,
            ),
          }))
        })

        completed++
        setState((s) => ({
          ...s,
          completedLeads: completed,
          queue: s.queue.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'done',
                  sourcesFound: q.progress?.steps.filter((s) => s.status === 'done').length || 0,
                }
              : q,
          ),
        }))
      } catch (err: any) {
        failed++
        setState((s) => ({
          ...s,
          failedLeads: failed,
          queue: s.queue.map((q, idx) =>
            idx === i ? { ...q, status: 'error', error: err.message } : q,
          ),
        }))
      }
    }

    setState((s) => ({ ...s, isRunning: false }))
  }, [])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    setState({
      isRunning: false,
      queue: [],
      currentIndex: 0,
      totalLeads: 0,
      completedLeads: 0,
      failedLeads: 0,
    })
  }, [])

  return { ...state, enrichAll, abort, reset }
}
