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

    // Snapshot current leads to detect new ones
    let initialIds: Set<string> = new Set()
    try {
      const existing = await getLeads()
      initialIds = new Set(existing.map((l) => l.id))
    } catch { /* ignore */ }

    try {
      setState({ phase: 'sending', leads: [], error: null, elapsed: 0, leadsCreated: 0 })

      // Strategy: race between n8n response and polling
      // n8n may respond with leadsCreated count, OR may timeout (the webhook can be slow)
      // Meanwhile, poll Airtable for new leads
      let resolved = false

      const finalize = async (leadsCreated: number) => {
        if (resolved) return
        resolved = true

        if (leadsCreated > 0) {
          setState((s) => ({ ...s, phase: 'polling', leadsCreated }))
          // Wait for remaining leads to be saved (scale with count: 2s per lead, min 5s, max 30s)
          const waitMs = Math.min(30_000, Math.max(5_000, leadsCreated * 2_000))
          await new Promise((r) => setTimeout(r, waitMs))
        }

        // Final count from Airtable
        try {
          const finalLeads = await getLeads()
          const newLeads = finalLeads.filter((l) => !initialIds.has(l.id))
          setState({
            phase: 'done',
            leads: newLeads,
            error: null,
            elapsed: Math.round((Date.now() - startTime) / 1000),
            leadsCreated: Math.max(leadsCreated, newLeads.length),
          })
        } catch {
          setState({
            phase: 'done',
            leads: [],
            error: null,
            elapsed: Math.round((Date.now() - startTime) / 1000),
            leadsCreated,
          })
        }
      }

      // Path A: Wait for n8n webhook response
      const n8nPromise = triggerN8nSearch(params).then(async (response) => {
        if (resolved) return
        if (response.success && response.leadsCreated > 0) {
          await finalize(response.leadsCreated)
        }
        // If response.success but 0 leads, or failed — let polling handle it
      }).catch(() => {})

      // Path B: Poll Airtable for new leads (but don't finalize too early)
      setState((s) => ({ ...s, phase: 'processing' }))

      let lastNewCount = 0
      let stableChecks = 0
      const maxWait = 240_000 // 4 min (increased for 15+ leads)
      while (!resolved && Date.now() - startTime < maxWait) {
        await new Promise((r) => setTimeout(r, 8_000))
        if (resolved) break

        try {
          const currentLeads = await getLeads()
          const newLeads = currentLeads.filter((l) => !initialIds.has(l.id))

          if (newLeads.length > 0) {
            setState((s) => ({ ...s, phase: 'polling', leadsCreated: newLeads.length }))

            // Wait for count to stabilize (same count for 2 consecutive checks = all saved)
            if (newLeads.length === lastNewCount) {
              stableChecks++
              if (stableChecks >= 2) {
                await finalize(newLeads.length)
                break
              }
            } else {
              stableChecks = 0
              lastNewCount = newLeads.length
            }
          }
        } catch { /* retry */ }
      }

      // Timeout — force conclusion
      if (!resolved) {
        await Promise.race([n8nPromise, new Promise((r) => setTimeout(r, 10_000))])
        if (!resolved) {
          await finalize(lastNewCount)
        }
      }
    } catch (err: any) {
      setState((s) => ({
        ...s,
        phase: 'done',
        leads: [],
        error: null,
        elapsed: Math.round((Date.now() - startTime) / 1000),
        leadsCreated: 0,
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
