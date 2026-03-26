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

    try {
      // Phase 1: Send to n8n
      setState({ phase: 'sending', leads: [], error: null, elapsed: 0, leadsCreated: 0 })

      // Phase 2: n8n is processing (webhook call — may take 1-5 min)
      setState((s) => ({ ...s, phase: 'processing' }))
      const result = await triggerN8nSearch(params)

      if (!result.success) {
        throw new Error(result.error || 'Erro no n8n')
      }

      setState((s) => ({ ...s, phase: 'polling', leadsCreated: result.leadsCreated }))

      // Phase 3: Poll Airtable for the new leads
      await new Promise((r) => setTimeout(r, 2000)) // Wait 2s for Airtable consistency
      const leads = await getLeads()

      setState({
        phase: 'done',
        leads,
        error: null,
        elapsed: Math.round((Date.now() - startTime) / 1000),
        leadsCreated: result.leadsCreated,
      })
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
