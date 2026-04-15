import type { Lead, Competitor } from '../types'

// 8 canonical dimensions — single source of truth
export const COMPETITIVE_DIMENSIONS = [
  'Presença digital', 'Variedade de produtos', 'Preço médio', 'Qualidade percebida',
  'Atendimento', 'Margem estimada', 'Inovação', 'Força da marca',
] as const

export type DimensionLevel = 'Fraca' | 'Média' | 'Forte'

export interface CompetitiveAnalysisData {
  lead: Record<string, DimensionLevel>
  competitors: Competitor[]
}

// --- Accent normalization ---
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Map legacy dimension names → canonical names
const DIMENSION_ALIAS_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  // Build reverse lookup from canonical names (accent-stripped → canonical)
  for (const dim of COMPETITIVE_DIMENSIONS) {
    map[removeAccents(dim).toLowerCase()] = dim
  }
  // Legacy strategicAnalysisService dimension aliases
  map['redes sociais'] = 'Inovação'
  map['reputacao online'] = 'Qualidade percebida'
  map['diversificacao'] = 'Variedade de produtos'
  // Legacy dimension aliases
  map['avaliacao google'] = 'Qualidade percebida'
  map['volume de avaliacoes'] = 'Força da marca'
  // Short-form aliases from legacy data (e.g. "Variedade", "Preço", "Marca")
  map['variedade'] = 'Variedade de produtos'
  map['preco'] = 'Preço médio'
  map['qualidade'] = 'Qualidade percebida'
  map['margem'] = 'Margem estimada'
  map['inovacao'] = 'Inovação'
  map['marca'] = 'Força da marca'
  return map
})()

function normalizeDimensionName(name: string): string {
  const key = removeAccents(name).toLowerCase().trim()
  return DIMENSION_ALIAS_MAP[key] || name
}

function normalizeLevel(value: string): DimensionLevel {
  const lower = removeAccents(value).toLowerCase().trim()
  // Exact matches
  if (lower === 'forte') return 'Forte'
  if (lower === 'fraca') return 'Fraca'
  if (lower === 'media') return 'Média'
  // Descriptive values from legacy data (e.g. "Alta", "Premium", "Excelente")
  const strongWords = ['forte', 'alta', 'alto', 'excelente', 'premium', 'consolidada', 'nacional', 'muito']
  const weakWords = ['fraca', 'fraco', 'baixa', 'baixo', 'ausente', 'nenhum', 'zero', 'limitada']
  if (strongWords.some((w) => lower.includes(w))) return 'Forte'
  if (weakWords.some((w) => lower.includes(w))) return 'Fraca'
  return 'Média'
}

function normalizeDimensions(raw: Record<string, string>): Record<string, DimensionLevel> {
  const result: Record<string, DimensionLevel> = {}
  for (const [key, value] of Object.entries(raw)) {
    const canonicalName = normalizeDimensionName(key)
    result[canonicalName] = normalizeLevel(value)
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompetitorEntry(raw: any): Competitor {
  return {
    nome: raw.nome || raw.name || 'Concorrente',
    website: raw.website,
    rating: raw.rating,
    reviews: raw.reviews,
    category: raw.category,
    dimensoes: normalizeDimensions(raw.dimensoes || raw.dimensions || {}),
  }
}

/**
 * Parse and normalize competitiveAnalysis from any legacy format to canonical.
 * Returns null if data is empty/unparseable (caller should use defaults).
 */
export function normalizeCompetitiveAnalysis(
  raw: string | undefined | null,
  leadCompanyName?: string,
): CompetitiveAnalysisData | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)

    // Format C (canonical): { lead: {...}, competitors: [...] }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.competitors) {
      return {
        lead: normalizeDimensions(parsed.lead || {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competitors: (parsed.competitors as any[]).map(normalizeCompetitorEntry),
      }
    }

    // Format A/B (legacy): plain array of competitors
    if (Array.isArray(parsed)) {
      let leadDims: Record<string, DimensionLevel> = {}
      const competitors: Competitor[] = []

      for (const entry of parsed) {
        const name = entry.nome || entry.name || ''
        // If the entry matches the lead's company name, extract as lead dimensions
        if (leadCompanyName && removeAccents(name).toLowerCase() === removeAccents(leadCompanyName).toLowerCase()) {
          leadDims = normalizeDimensions(entry.dimensoes || entry.dimensions || {})
        } else {
          competitors.push(normalizeCompetitorEntry(entry))
        }
      }

      return { lead: leadDims, competitors }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Build canonical JSON string for Airtable storage.
 */
export function buildCanonicalCompetitiveJson(
  leadDims: Record<string, DimensionLevel>,
  competitors: Competitor[],
): string {
  return JSON.stringify({ lead: leadDims, competitors })
}

/**
 * Compute the lead's own dimension levels from enrichment data.
 */
export function computeLeadDimensions(lead: Partial<Lead>): Record<string, DimensionLevel> {
  const dims: Record<string, DimensionLevel> = {}
  const hasWebsite = !!lead.website
  const hasInstagram = !!lead.instagram
  const followers = lead.instagramFollowers || 0
  const rating = lead.googleRating || 0
  const reviews = lead.googleReviewsCount || 0
  const revenue = lead.monthlyRevenue || 0
  const employees = lead.employees || 0

  // Presença digital
  if (hasWebsite && (hasInstagram || followers > 500)) dims['Presença digital'] = 'Forte'
  else if (hasWebsite || hasInstagram) dims['Presença digital'] = 'Média'
  else dims['Presença digital'] = 'Fraca'

  // Qualidade percebida (via Google rating)
  if (rating >= 4.5) dims['Qualidade percebida'] = 'Forte'
  else if (rating >= 3.5) dims['Qualidade percebida'] = 'Média'
  else dims['Qualidade percebida'] = 'Fraca'

  // Atendimento (inferred from rating + reviews)
  if (rating >= 4.5 && reviews >= 50) dims['Atendimento'] = 'Forte'
  else if (rating >= 4.0 || reviews >= 20) dims['Atendimento'] = 'Média'
  else dims['Atendimento'] = 'Fraca'

  // Força da marca (reviews + followers as social proof)
  if (reviews >= 100 || followers >= 5000) dims['Força da marca'] = 'Forte'
  else if (reviews >= 30 || followers >= 1000) dims['Força da marca'] = 'Média'
  else dims['Força da marca'] = 'Fraca'

  // Margem estimada (revenue vs employees as proxy)
  if (revenue >= 500000 || (revenue >= 100000 && employees <= 10)) dims['Margem estimada'] = 'Forte'
  else if (revenue >= 50000) dims['Margem estimada'] = 'Média'
  else dims['Margem estimada'] = 'Fraca'

  // Inovação (digital presence + social activity as proxy)
  if (hasWebsite && hasInstagram && followers >= 2000) dims['Inovação'] = 'Forte'
  else if (hasWebsite || (hasInstagram && followers >= 500)) dims['Inovação'] = 'Média'
  else dims['Inovação'] = 'Fraca'

  // Variedade de produtos (default to Média, hard to infer without more data)
  dims['Variedade de produtos'] = 'Média'

  // Preço médio (default to Média)
  dims['Preço médio'] = 'Média'

  return dims
}
