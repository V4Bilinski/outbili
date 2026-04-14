import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { reEnrichLead, leadNeedsReEnrich, type ReEnrichResult } from '../services/enrichmentService'
import { getLeads } from '../services/leadService'
import type { Lead } from '../types'

const STORAGE_KEY = 'outbili_reenrich_queue'
const CONCURRENCY = 2
const DELAY_BETWEEN_LEADS_MS = 1000

export interface ReEnrichState {
  isRunning: boolean
  total: number
  completed: number
  failed: number
  skipped: number
  currentLead: string
  etaSeconds: number
  results: ReEnrichResult[]
}

function saveState(state: Pick<ReEnrichState, 'total' | 'completed' | 'failed' | 'skipped'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded */ }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

export interface ReEnrichDiagnostics {
  totalLeads: number
  missingEmployees: number
  missingFoundingDate: number
  estimateOnly: number
  needsReEnrich: number
  alreadyComplete: number
}

export function useReEnrichment() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<ReEnrichState>({
    isRunning: false,
    total: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    currentLead: '',
    etaSeconds: 0,
    results: [],
  })
  const [diagnostics, setDiagnostics] = useState<ReEnrichDiagnostics | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const abortRef = useRef(false)
  const startTimeRef = useRef(0)

  // Update document title with progress
  useEffect(() => {
    if (state.isRunning) {
      document.title = `(${state.completed}/${state.total}) Re-enriquecendo...`
    } else if (state.completed > 0 && !state.isRunning) {
      document.title = `Re-enriquecimento concluido!`
      const timer = setTimeout(() => { document.title = 'Outbili' }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.isRunning, state.completed, state.total])

  const loadDiagnostics = useCallback(async () => {
    setDiagLoading(true)
    try {
      const allLeads = await getLeads()
      const ESTIMATE_VALUES = new Set([5, 30, 100])

      const diag: ReEnrichDiagnostics = {
        totalLeads: allLeads.length,
        missingEmployees: allLeads.filter(l => l.cnpj && !l.employees).length,
        missingFoundingDate: allLeads.filter(l => l.cnpj && !l.foundingDate).length,
        estimateOnly: allLeads.filter(l =>
          l.cnpj && l.employees && ESTIMATE_VALUES.has(l.employees) &&
          !['assertiva', 'complete'].includes(l.enrichmentStatus || '')
        ).length,
        needsReEnrich: allLeads.filter(l => leadNeedsReEnrich(l, false)).length,
        alreadyComplete: allLeads.filter(l => l.enrichmentStatus === 'complete' || l.enrichmentStatus === 'assertiva').length,
      }
      setDiagnostics(diag)
    } catch (err) {
      console.error('Erro ao carregar diagnostico:', err)
    } finally {
      setDiagLoading(false)
    }
  }, [])

  const startReEnrich = useCallback(async (mode: 'missing' | 'all') => {
    abortRef.current = false
    startTimeRef.current = Date.now()

    setState(s => ({ ...s, isRunning: true, completed: 0, failed: 0, skipped: 0, results: [], currentLead: 'Carregando leads...' }))

    let allLeads: Lead[]
    try {
      allLeads = await getLeads()
    } catch {
      setState(s => ({ ...s, isRunning: false, currentLead: 'Erro ao carregar leads' }))
      return
    }

    const forceAll = mode === 'all'
    const eligible = allLeads.filter(l => leadNeedsReEnrich(l, forceAll))

    setState(s => ({ ...s, total: eligible.length, currentLead: `${eligible.length} leads para processar` }))

    if (eligible.length === 0) {
      setState(s => ({ ...s, isRunning: false, currentLead: 'Nenhum lead precisa de re-enriquecimento' }))
      return
    }

    const results: ReEnrichResult[] = []
    let completed = 0
    let failed = 0
    let skipped = 0

    // Process leads with concurrency
    const processLead = async (lead: Lead) => {
      if (abortRef.current) return

      setState(s => ({ ...s, currentLead: lead.companyName || lead.cnpj || lead.id }))

      try {
        const result = await reEnrichLead(lead.id, lead, { forceAll })
        results.push(result)
        if (result.skipped) skipped++
        else completed++
      } catch (err: any) {
        failed++
        results.push({ leadId: lead.id, updated: {}, source: 'cnpja', skipped: false, error: err.message })
      }

      const total = completed + failed + skipped
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const avgTime = total > 0 ? elapsed / total : 0
      const remaining = eligible.length - total
      const eta = Math.round(avgTime * remaining)

      setState(s => ({
        ...s,
        completed,
        failed,
        skipped,
        etaSeconds: eta,
        results: [...results],
      }))
      saveState({ total: eligible.length, completed, failed, skipped })

      // Delay between leads to respect rate limits
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_LEADS_MS))
    }

    // Concurrent processing pool
    let index = 0
    const next = async (): Promise<void> => {
      while (index < eligible.length && !abortRef.current) {
        const lead = eligible[index++]
        await processLead(lead)
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, eligible.length) }, () => next())
    await Promise.all(workers)

    // Done
    setState(s => ({
      ...s,
      isRunning: false,
      currentLead: abortRef.current ? 'Abortado pelo usuario' : 'Concluido!',
      results: [...results],
    }))
    clearState()

    // Refresh all leads in cache
    queryClient.invalidateQueries({ queryKey: ['leads'] })

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Re-enriquecimento concluido', {
        body: `${completed} atualizados, ${failed} erros, ${skipped} pulados`,
        icon: '/favicon.ico',
      })
    }
  }, [queryClient])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  return { state, diagnostics, diagLoading, loadDiagnostics, startReEnrich, abort }
}
