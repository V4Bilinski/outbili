import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Persiste os filtros da listagem de Leads durante a sessao de trabalho.
// sessionStorage (nao localStorage): a jornada sobrevive a navegacao ida/volta
// da ficha e ao refresh, mas comeca limpa a cada nova abertura do navegador.
// Espelha o padrao de persistencia do app (theme-context + useMassEnrichment):
// STORAGE_KEY no topo, initializer + useEffect de escrita, try/catch silencioso.
const STORAGE_KEY = 'outbili-leads-filters-v1'

export interface LeadsFiltersState {
  segment: string
  region: string
  temperature: string
  status: string
  trava: string
  tier: string
  searchQuery: string
  mineOnly: boolean
}

const DEFAULTS: LeadsFiltersState = {
  segment: '',
  region: '',
  temperature: '',
  status: '',
  trava: '',
  tier: '',
  searchQuery: '',
  mineOnly: false,
}

// Le e valida o shape campo-a-campo. Chave ausente, JSON invalido ou campo
// corrompido caem no default por campo. Nunca lanca (chave corrompida nao quebra a tela).
function readStored(): LeadsFiltersState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<LeadsFiltersState> | null
    if (!p || typeof p !== 'object') return DEFAULTS
    return {
      segment: typeof p.segment === 'string' ? p.segment : '',
      region: typeof p.region === 'string' ? p.region : '',
      temperature: typeof p.temperature === 'string' ? p.temperature : '',
      status: typeof p.status === 'string' ? p.status : '',
      trava: typeof p.trava === 'string' ? p.trava : '',
      tier: typeof p.tier === 'string' ? p.tier : '',
      searchQuery: typeof p.searchQuery === 'string' ? p.searchQuery : '',
      mineOnly: typeof p.mineOnly === 'boolean' ? p.mineOnly : false,
    }
  } catch {
    return DEFAULTS
  }
}

// Precedencia: URL > storage > default. Os deep-links do Dashboard
// (?temperatura= / ?trava= / ?tier=) sobrescrevem o valor salvo na inicializacao.
function getInitialFilters(params: URLSearchParams): LeadsFiltersState {
  const stored = readStored()
  const urlTemp = params.get('temperatura')
  const urlTrava = params.get('trava')
  const urlTier = params.get('tier')
  return {
    ...stored,
    ...(urlTemp ? { temperature: urlTemp } : {}),
    ...(urlTrava ? { trava: urlTrava } : {}),
    ...(urlTier ? { tier: urlTier } : {}),
  }
}

export function useLeadsFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  // O initializer roda 1x na montagem e captura a URL de entrada (deep-link).
  const [filters, setFilters] = useState<LeadsFiltersState>(() => getInitialFilters(searchParams))

  // Grava a cada mudanca (espelha o useEffect de persistencia do ThemeProvider).
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch {
      /* quota exceeded or private mode */
    }
  }, [filters])

  // Setters individuais que mantem a assinatura (v) => void usada pelo JSX existente.
  const setSegment = (v: string) => setFilters((f) => ({ ...f, segment: v }))
  const setRegion = (v: string) => setFilters((f) => ({ ...f, region: v }))
  const setTemperature = (v: string) => setFilters((f) => ({ ...f, temperature: v }))
  const setStatus = (v: string) => setFilters((f) => ({ ...f, status: v }))
  const setTrava = (v: string) => setFilters((f) => ({ ...f, trava: v }))
  const setTier = (v: string) => setFilters((f) => ({ ...f, tier: v }))
  const setSearchQuery = (v: string) => setFilters((f) => ({ ...f, searchQuery: v }))
  const setMineOnly = (v: boolean) => setFilters((f) => ({ ...f, mineOnly: v }))

  const hasActiveFilters =
    !!filters.segment ||
    !!filters.temperature ||
    !!filters.status ||
    !!filters.trava ||
    !!filters.tier ||
    !!filters.region ||
    !!filters.searchQuery ||
    filters.mineOnly

  // Zera estado + storage + params de URL. O removeItem e essencial: sem ele,
  // "Limpar filtros" pareceria nao funcionar ao voltar da ficha (o storage reidrataria).
  const clearFilters = () => {
    setFilters(DEFAULTS)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (searchParams.has('temperatura') || searchParams.has('trava') || searchParams.has('tier')) {
      setSearchParams({}, { replace: true })
    }
  }

  return {
    ...filters,
    setSegment,
    setRegion,
    setTemperature,
    setStatus,
    setTrava,
    setTier,
    setSearchQuery,
    setMineOnly,
    hasActiveFilters,
    clearFilters,
  }
}
