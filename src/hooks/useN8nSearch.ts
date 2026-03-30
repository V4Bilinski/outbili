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
          // Wait for remaining leads to be saved
          await new Promise((r) => setTimeout(r, 10_000))
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

      // Path B: Poll Airtable for new leads
      setState((s) => ({ ...s, phase: 'processing' }))

      const maxWait = 180_000 // 3 min
      while (!resolved && Date.now() - startTime < maxWait) {
        await new Promise((r) => setTimeout(r, 10_000))
        if (resolved) break

        try {
          const currentLeads = await getLeads()
          const newLeads = currentLeads.filter((l) => !initialIds.has(l.id))

          if (newLeads.length > 0) {
            await finalize(newLeads.length)
            break
          }
        } catch { /* retry */ }
      }

      // Timeout — force conclusion
      if (!resolved) {
        // Wait for n8n one more time (5s)
        await Promise.race([n8nPromise, new Promise((r) => setTimeout(r, 5000))])
        if (!resolved) {
          await finalize(0)
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
