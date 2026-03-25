import { useState, useCallback } from 'react'
import {
  startGoogleMapsSearch,
  pollRunUntilDone,
  getDatasetItems,
  buildSearchQuery,
  type SearchConfig,
  type GoogleMapsResult,
} from '../lib/apify'

export type SearchPhase = 'idle' | 'maps' | 'enriching' | 'done' | 'error'

interface SearchState {
  phase: SearchPhase
  mapsStatus: 'pending' | 'running' | 'done' | 'error'
  results: GoogleMapsResult[]
  error: string | null
  elapsed: number
}

export function useApifySearch() {
  const [state, setState] = useState<SearchState>({
    phase: 'idle',
    mapsStatus: 'pending',
    results: [],
    error: null,
    elapsed: 0,
  })

  const search = useCallback(async (config: SearchConfig) => {
    const startTime = Date.now()
    const tick = setInterval(() => {
      setState((s) => ({ ...s, elapsed: Math.round((Date.now() - startTime) / 1000) }))
    }, 1000)

    try {
      setState({ phase: 'maps', mapsStatus: 'running', results: [], error: null, elapsed: 0 })

      // 1. Google Maps search
      const { query, location } = buildSearchQuery(config)
      const runId = await startGoogleMapsSearch(query, location, 15)

      const datasetId = await pollRunUntilDone(runId, 'compass~crawler-google-places', (status) => {
        setState((s) => ({ ...s, mapsStatus: status === 'SUCCEEDED' ? 'done' : 'running' }))
      })

      setState((s) => ({ ...s, mapsStatus: 'done', phase: 'enriching' }))

      // 2. Get results
      const items = await getDatasetItems<GoogleMapsResult>(datasetId)

      // Filter by revenue range if provided (based on reviews as proxy)
      const filtered = items.filter((item) => {
        if (!item.title) return false
        return true
      })

      setState({
        phase: 'done',
        mapsStatus: 'done',
        results: filtered,
        error: null,
        elapsed: Math.round((Date.now() - startTime) / 1000),
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
    setState({ phase: 'idle', mapsStatus: 'pending', results: [], error: null, elapsed: 0 })
  }, [])

  return { ...state, search, reset }
}
