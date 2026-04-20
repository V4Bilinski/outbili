import { TIERS } from './constants'
import type { Lead } from '../types'

export type LtpSource = 'real' | 'tier-median' | 'none'
export type LtpConfidence = 'high' | 'estimated' | 'none'

export interface LtpResult {
  ltp: number
  revenue: number
  source: LtpSource
  confidence: LtpConfidence
}

function tierMidpointPct(tierLtpRange: string): number {
  const [min, max] = tierLtpRange.split('-').map((v) => parseFloat(v) / 100)
  return (min + max) / 2
}

function findTier(lead: Lead) {
  if (lead.tier) {
    const byName = TIERS.find((t) => t.name === lead.tier)
    if (byName) return byName
  }
  if (typeof lead.monthlyRevenue === 'number') {
    return TIERS.find((t) => lead.monthlyRevenue! >= t.min && lead.monthlyRevenue! < t.max) || TIERS[TIERS.length - 1]
  }
  return null
}

export function estimateLeadRevenue(lead: Lead): { revenue: number; source: LtpSource; confidence: LtpConfidence } {
  if (typeof lead.monthlyRevenue === 'number' && lead.monthlyRevenue > 0) {
    return { revenue: lead.monthlyRevenue, source: 'real', confidence: 'high' }
  }
  const tier = findTier(lead)
  if (tier) {
    return { revenue: (tier.min + tier.max) / 2, source: 'tier-median', confidence: 'estimated' }
  }
  return { revenue: 0, source: 'none', confidence: 'none' }
}

export function calculateLeadLTP(lead: Lead): LtpResult {
  const { revenue, source, confidence } = estimateLeadRevenue(lead)
  if (revenue === 0) return { ltp: 0, revenue: 0, source, confidence }
  const tier = findTier(lead) || TIERS[0]
  const ltp = revenue * tierMidpointPct(tier.ltp) * 12
  return { ltp, revenue, source, confidence }
}

export function isHotLead(lead: Lead): boolean {
  return lead.temperature === 'Quente' || lead.score >= 3.7
}

export type StationKey = 'pesquisa' | 'enriquecimento' | 'qualificacao' | 'inteligencia' | 'prospeccao'

export function getLeadStation(lead: Lead): StationKey | null {
  if (lead.status === 'Fechado' || lead.status === 'Perdido') return null
  if (lead.status === 'Novo') return 'pesquisa'
  if (lead.enrichmentStatus !== 'complete' && lead.status !== 'Novo') return 'enriquecimento'
  if (lead.status === 'Qualificado') return 'qualificacao'
  if (lead.status === 'Contactado' || lead.status === 'Respondeu' || lead.status === 'Reunião') return 'inteligencia'
  if (lead.status === 'Proposta') return 'prospeccao'
  return null
}

export interface StationBreakdown {
  count: number
  ltp: number
  realCount: number
  estimatedCount: number
}

export interface PipelineLtp {
  total: number
  totalLeads: number
  realRevenueCount: number
  estimatedRevenueCount: number
  hot: number
  hotLeads: number
  avgPerLead: number
  avgTicket: number
  stations: Record<StationKey, StationBreakdown>
}

const EMPTY_STATION = (): StationBreakdown => ({ count: 0, ltp: 0, realCount: 0, estimatedCount: 0 })

export function calculatePipelineLTP(leads: Lead[]): PipelineLtp {
  const stations: Record<StationKey, StationBreakdown> = {
    pesquisa: EMPTY_STATION(),
    enriquecimento: EMPTY_STATION(),
    qualificacao: EMPTY_STATION(),
    inteligencia: EMPTY_STATION(),
    prospeccao: EMPTY_STATION(),
  }

  let total = 0
  let totalLeads = 0
  let realRevenueCount = 0
  let estimatedRevenueCount = 0
  let hot = 0
  let hotLeads = 0
  let ticketSum = 0

  for (const lead of leads) {
    const station = getLeadStation(lead)
    if (!station) continue

    const { ltp, source } = calculateLeadLTP(lead)
    const bucket = stations[station]
    bucket.count += 1
    bucket.ltp += ltp
    if (source === 'real') bucket.realCount += 1
    else if (source === 'tier-median') bucket.estimatedCount += 1

    totalLeads += 1
    total += ltp
    if (source === 'real') realRevenueCount += 1
    else if (source === 'tier-median') estimatedRevenueCount += 1
    ticketSum += ltp

    if (isHotLead(lead)) {
      hot += ltp
      hotLeads += 1
    }
  }

  const avgPerLead = totalLeads > 0 ? total / totalLeads : 0
  const avgTicket = totalLeads > 0 ? ticketSum / totalLeads : 0

  return {
    total,
    totalLeads,
    realRevenueCount,
    estimatedRevenueCount,
    hot,
    hotLeads,
    avgPerLead,
    avgTicket,
    stations,
  }
}
