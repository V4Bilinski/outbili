import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { enrichLead, type EnrichmentProgress } from '../services/enrichmentService'
import type { Lead } from '../types'

export function useLeadEnrichment() {
  const queryClient = useQueryClient()
  const [isEnriching, setIsEnriching] = useState(false)
  const [progress, setProgress] = useState<EnrichmentProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enrich = useCallback(async (leadId: string, leadData: Partial<Lead>) => {
    setIsEnriching(true)
    setError(null)
    setProgress({
      steps: [],
      currentStep: 0,
      totalSteps: 7,
      isDone: false,
    })

    try {
      await enrichLead(leadId, leadData, (p) => {
        setProgress(p)
      })

      // Invalidate React Query so dashboard updates immediately
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    } catch (err: any) {
      setError(err.message || 'Erro no enriquecimento')
    } finally {
      setIsEnriching(false)
    }
  }, [queryClient])

  const reset = useCallback(() => {
    setIsEnriching(false)
    setProgress(null)
    setError(null)
  }, [])

  return { isEnriching, progress, error, enrich, reset }
}
