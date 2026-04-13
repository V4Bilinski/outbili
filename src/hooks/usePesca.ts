import { useState, useRef, useCallback, useEffect } from 'react'
import {
  searchViaCnpja,
  fallbackEnrichLeads,
  loadExistingDedup,
  deduplicateLeads,
  savePescaToAirtable,
  enrichBatchWithAssertiva,
} from '../services/pescaService'
import type { PescaFilters, PescaLead, PescaPhase, PescaProgress } from '../types'
import { useQueryClient } from '@tanstack/react-query'

interface UsePescaReturn {
  phase: PescaPhase
  progress: PescaProgress
  leads: PescaLead[]
  error: string | null
  elapsed: number
  startPesca: (filters: PescaFilters) => Promise<void>
  cancel: () => void
  reset: () => void
  resetExecution: () => void
  retryFromError: () => void
}

const INITIAL_PROGRESS: PescaProgress = { found: 0, enriched: 0, deduped: 0, saved: 0, total: 0 }

export function usePesca(): UsePescaReturn {
  const [phase, setPhase] = useState<PescaPhase>('idle')
  const [progress, setProgress] = useState<PescaProgress>(INITIAL_PROGRESS)
  const [leads, setLeads] = useState<PescaLead[]>([])
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const queryClient = useQueryClient()

  // Timer elapsed — preserva tempo entre mudancas de fase
  useEffect(() => {
    if (phase === 'searching' && startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
    }
    if (phase !== 'idle' && phase !== 'done' && phase !== 'error') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          if (startTimeRef.current > 0) {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
          }
        }, 1000)
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [phase])

  // beforeunload warning
  useEffect(() => {
    if (phase !== 'idle' && phase !== 'done' && phase !== 'error') {
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [phase])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setPhase('idle')
    setProgress(INITIAL_PROGRESS)
    setElapsed(0)
    startTimeRef.current = 0
  }, [])

  const resetExecution = useCallback(() => {
    abortRef.current?.abort()
    setPhase('idle')
    setProgress(INITIAL_PROGRESS)
    setLeads([])
    setError(null)
    setElapsed(0)
    startTimeRef.current = 0
  }, [])

  const reset = useCallback(() => {
    resetExecution()
  }, [resetExecution])

  // Retry from error: only clear phase/error, preserve form state
  const retryFromError = useCallback(() => {
    setPhase('idle')
    setError(null)
    setElapsed(0)
    startTimeRef.current = 0
  }, [])

  const startPesca = useCallback(async (filters: PescaFilters) => {
    // Guard contra double-click
    if (abortRef.current && !abortRef.current.signal.aborted) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller
    const signal = controller.signal

    setError(null)
    setLeads([])
    setElapsed(0)
    startTimeRef.current = 0

    try {
      // Fase 1: Buscar CNPJs via CNPJa API (retorna dados completos)
      setPhase('searching')
      setProgress({ ...INITIAL_PROGRESS })

      const pescaLeads = await searchViaCnpja(
        filters,
        150,
        (found) => setProgress(p => ({ ...p, found, total: found })),
        signal,
      )

      if (signal.aborted) return
      if (pescaLeads.length === 0) {
        setError('Nenhuma empresa encontrada com esses filtros. Tente ampliar a busca.')
        setPhase('error')
        return
      }

      setProgress(p => ({ ...p, found: pescaLeads.length, total: pescaLeads.length }))

      // Fase 2: Fallback cascata CNPJa + Assertiva para leads sem celular
      setPhase('enriching')
      const leadsWithoutMobile = pescaLeads.filter(l => !l.whatsapp).length

      if (leadsWithoutMobile > 0) {
        await fallbackEnrichLeads(
          pescaLeads,
          (enriched) => setProgress(p => ({ ...p, enriched })),
          signal,
        )
      }
      setProgress(p => ({ ...p, enriched: pescaLeads.length }))

      if (signal.aborted) return

      // Fase 3: Deduplicar
      setPhase('deduplicating')

      const { cnpjs: existingCnpjs, phones: existingPhones } = await loadExistingDedup(signal)
      const uniqueLeads = deduplicateLeads(pescaLeads, existingCnpjs, existingPhones)

      if (signal.aborted) return
      setProgress(p => ({ ...p, deduped: uniqueLeads.length }))

      if (uniqueLeads.length === 0) {
        setError('Todas as empresas encontradas ja existem no sistema. Tente outros filtros.')
        setPhase('error')
        return
      }

      // Fase 4: Salvar no Airtable
      setPhase('saving')

      const result = await savePescaToAirtable(
        uniqueLeads,
        (saved) => setProgress(p => ({ ...p, saved })),
        signal,
      )

      if (signal.aborted) return

      setLeads(uniqueLeads)
      setProgress(p => ({ ...p, saved: result.savedLeads }))

      // Fase 5: Enriquecer com Assertiva (automatico, telefones + WhatsApp validados)
      setPhase('assertiva_enriching')

      try {
        await enrichBatchWithAssertiva(
          result.leadIds,
          (enriched) => setProgress(p => ({ ...p, enriched })),
          signal,
        )
      } catch {
        // Assertiva e non-blocking — se falhar, leads mantem dados CNPJa
        console.warn('PESCA: enriquecimento Assertiva falhou, leads mantem dados CNPJa')
      }

      if (signal.aborted) return
      setPhase('done')

      // Invalidar cache de leads para refletir novos dados
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    } catch (err) {
      if (signal.aborted) return
      setError(err instanceof Error ? err.message : 'Erro inesperado na PESCA')
      setPhase('error')
    }
  }, [queryClient])

  return { phase, progress, leads, error, elapsed, startPesca, cancel, reset, resetExecution, retryFromError }
}
