import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { leadNeedsReEnrich, type ReEnrichResult } from '../services/enrichmentService'
import { getLeads } from '../services/leadService'
import { enqueueEnrichmentBatch } from '../services/socioService'
import type { Lead } from '../types'

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

export interface ReEnrichDiagnostics {
  totalLeads: number
  missingEmployees: number
  missingFoundingDate: number
  estimateOnly: number
  needsReEnrich: number
  alreadyComplete: number
}

const INITIAL_STATE: ReEnrichState = {
  isRunning: false, total: 0, completed: 0, failed: 0, skipped: 0,
  currentLead: '', etaSeconds: 0, results: [],
}

export function useReEnrichment() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<ReEnrichState>(INITIAL_STATE)
  const [diagnostics, setDiagnostics] = useState<ReEnrichDiagnostics | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)

  // Feedback no título da aba enquanto enfileira
  useEffect(() => {
    if (state.isRunning) {
      document.title = 'Enfileirando re-enriquecimento...'
    } else if (state.completed > 0) {
      document.title = 'Re-enriquecimento enfileirado'
      const t = setTimeout(() => { document.title = 'Outbili' }, 5000)
      return () => clearTimeout(t)
    }
  }, [state.isRunning, state.completed])

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

  // W3-08 + ADMIN-ENRICH-01 (F3B): em vez de processar no browser (fragil: trava se a aba
  // fechar; lento), ENFILEIRA os leads elegiveis no worker server-side no modo 'cadastral'
  // (leve: 1 consulta CNPJ Assertiva por lead, grava employees/idade/data de abertura).
  // O worker (pg_cron, ~30s) processa em segundo plano. Robusto e escalavel.
  const startReEnrich = useCallback(async (mode: 'missing' | 'all') => {
    setState({ ...INITIAL_STATE, isRunning: true, currentLead: 'Carregando leads...' })

    let allLeads: Lead[]
    try {
      allLeads = await getLeads()
    } catch {
      setState({ ...INITIAL_STATE, currentLead: 'Erro ao carregar leads' })
      return
    }

    const eligible = allLeads.filter(l => leadNeedsReEnrich(l, mode === 'all'))
    if (eligible.length === 0) {
      setState({ ...INITIAL_STATE, currentLead: 'Nenhum lead precisa de re-enriquecimento' })
      return
    }

    setState({ ...INITIAL_STATE, isRunning: true, total: eligible.length, currentLead: `Enfileirando ${eligible.length} leads no worker...` })

    const ids = eligible.map(l => l.id)
    const r = await enqueueEnrichmentBatch(ids, 'high', 'cadastral')

    if (!r.ok) {
      setState({ ...INITIAL_STATE, total: eligible.length, currentLead: `Erro ao enfileirar: ${r.error || 'desconhecido'}` })
      return
    }

    setState({
      ...INITIAL_STATE,
      total: eligible.length,
      completed: r.enqueued,
      currentLead: `${r.enqueued} leads enfileirados. O worker processa em segundo plano (alguns minutos). Atualize o diagnostico para acompanhar.`,
    })
    queryClient.invalidateQueries({ queryKey: ['leads'] })
  }, [queryClient])

  const abort = useCallback(() => {
    // Enfileiramento e instantaneo; o processamento e assincrono no worker.
    // Nao ha o que abortar no client (jobs ja na fila seguem ate o worker drenar).
    setState(INITIAL_STATE)
  }, [])

  return { state, diagnostics, diagLoading, loadDiagnostics, startReEnrich, abort }
}
