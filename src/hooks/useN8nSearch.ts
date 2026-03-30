import { useState, useCallback } from 'react'
import { triggerN8nSearch, type SearchRequest } from '../lib/n8n-webhook'
import { getLeads } from '../services/leadService'
import type { Lead } from '../types'

export type N8nSearchPhase = 'idle' | 'sending' | 'processing' | 'polling' | 'done' | 'error'

interface N8nSearchState {
  phase: N8nSearchPhase
  leads: Lead[]
  error: string | null
  elapsed: number
  leadsCreated: number
}

export function useN8nSearch() {
  const [state, setState] = useState<N8nSearchState>({
    phase: 'idle',
    leads: [],
    error: null,
    elapsed: 0,
    leadsCreated: 0,
  })

  const search = useCallback(async (params: SearchRequest) => {
    const startTime = Date.now()
    const tick = setInterval(() => {
      setState((s) => ({ ...s, elapsed: Math.round((Date.now() - startTime) / 1000) }))
    }, 1000)

    // Count ALL leads before search to detect new ones (any status)
    let initialIds: Set<string> = new Set()
    try {
      const existing = await getLeads()
      initialIds = new Set(existing.map((l) => l.id))
    } catch { /* ignore */ }

    try {
      // Phase 1: Send to n8n (fire-and-forget — don't wait for response)
      setState({ phase: 'sending', leads: [], error: null, elapsed: 0, leadsCreated: 0 })

      // Trigger n8n webhook — don't await response (it times out)
      triggerN8nSearch(params).catch(() => {}) // fire and forget

      // Phase 2: Poll Airtable for new leads (every 10s for up to 3 min)
      setState((s) => ({ ...s, phase: 'processing' }))

      const maxWait = 180_000 // 3 min
      while (Date.now() - startTime < maxWait) {
        await new Promise((r) => setTimeout(r, 10_000)) // poll every 10s

        try {
          const currentLeads = await getLeads()
          const newLeads = currentLeads.filter((l) => !initialIds.has(l.id))

          if (newLeads.length > 0) {
            // New leads appeared — n8n is saving them
            setState((s) => ({ ...s, phase: 'polling', leadsCreated: newLeads.length }))

            // Wait a bit more for remaining leads
            await new Promise((r) => setTimeout(r, 15_000))

            // Final count
            const finalLeads = await getLeads()
            const finalNewLeads = finalLeads.filter((l) => !initialIds.has(l.id))

            setState({
              phase: 'done',
              leads: finalNewLeads,
              error: null,
              elapsed: Math.round((Date.now() - startTime) / 1000),
              leadsCreated: finalNewLeads.length,
            })
            return
          }
        } catch { /* airtable error — retry */ }
      }

      // Timeout — check one last time
      try {
        const finalCheck = await getLeads()
        const newLeads = finalCheck.filter((l) => !initialIds.has(l.id))

        // Always conclude — even with 0 leads
        setState({
          phase: 'done',
          leads: newLeads,
          error: null,
          elapsed: Math.round((Date.now() - startTime) / 1000),
          leadsCreated: newLeads.length,
        })
      } catch {
        setState({
          phase: 'done',
          leads: [],
          error: null,
          elapsed: Math.round((Date.now() - startTime) / 1000),
          leadsCreated: 0,
        })
      }
    } catch (err: any) {
      setState((s) => ({
        ...s,
        phase: 'error',
        error: err.message || 'Erro na pesquisa',
      }))
    } finally {
      clearInterval(tick)
    }
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle', leads: [], error: null, elapsed: 0, leadsCreated: 0 })
  }, [])

  return { ...state, search, reset }
}
