import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLeads } from '../hooks/useLeads'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, Plus, Search, X, ChevronRight } from 'lucide-react'
import { LEAD_STATUSES, TEMPERATURES, SEGMENTS } from '../lib/constants'
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import type { Lead } from '../types'

// --- Filters ---
function LeadFilters({
  segment, setSegment, temperature, setTemperature, status, setStatus,
  searchQuery, setSearchQuery, hasActiveFilters, onClearFilters,
}: {
  segment: string; setSegment: (v: string) => void
  temperature: string; setTemperature: (v: string) => void
  status: string; setStatus: (v: string) => void
  searchQuery: string; setSearchQuery: (v: string) => void
  hasActiveFilters: boolean; onClearFilters: () => void
}) {
  const selectClass = 'h-9 rounded-xl bg-white/[0.03] border border-border text-xs text-text-secondary px-3 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors appearance-none cursor-pointer'
  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por empresa, segmento, cidade..."
          className="h-10 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary pl-10 pr-9 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* Dropdown filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className={selectClass}>
          <option value="">Todos segmentos</option>
          {SEGMENTS.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
        </select>
        <select value={temperature} onChange={(e) => setTemperature(e.target.value)} className={selectClass}>
          <option value="">Temperatura</option>
          {TEMPERATURES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Status</option>
          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="h-9 px-3 rounded-xl text-xs font-medium text-red hover:bg-red/10 border border-red/20 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}

// --- Trap badge helpers ---
function getTrapAbbrev(trap?: string): string | null {
  if (!trap) return null
  const match = trap.match(/^(T\d+)/)
  return match ? match[1] : null
}

function trapBadgeClass(abbrev: string): string {
  const num = parseInt(abbrev.replace('T', ''), 10)
  if (num >= 7) return 'text-red bg-red/10'
  if (num >= 4) return 'text-orange-400 bg-orange-400/10'
  return 'text-amber-400 bg-amber-400/10'
}

// --- Table view ---
function LeadTable({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  const barColor = (score: number) => {
    if (score >= 3.7) return 'bg-red'
    if (score >= 2.5) return 'bg-warning'
    return 'bg-cold'
  }

  return (
    <div className="overflow-x-auto">
      {/* Indicador mobile para colunas ocultas */}
      <p className="text-caption text-text-muted px-4 py-1.5 border-b border-border/30 flex items-center gap-1 md:hidden">
        <ChevronRight className="h-3 w-3" /> Toque para abrir a ficha completa
      </p>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider w-10">#</th>
            <th className="text-left py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider">Nome</th>
            <th className="text-center py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Tier</th>
            <th className="text-center py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider">Score</th>
            <th className="text-center py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
            <th className="text-center py-3 px-4 text-label font-medium text-text-muted uppercase tracking-wider">Temperatura</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => {
            const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
            const tempColors: Record<string, string> = { Quente: 'bg-red text-white', Morno: 'bg-warning text-black', Frio: 'bg-cold text-white' }
            const statusInfo = LEAD_STATUSES.find((s) => s.value === lead.status)
            return (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="border-b border-border/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group animate-[fade-in_0.4s_ease-out_both]" style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}>
                <td className="py-4 px-4 text-sm text-text-muted font-mono">{index + 1}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text-primary group-hover:text-white transition-colors">{lead.companyName}</span>
                    {lead.enrichmentStatus === 'complete' && <span className="text-micro font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">Enriquecido</span>}
                    {(lead.enrichmentStatus === 'cnpja' || lead.enrichmentStatus === 'cnpja_n8n' || lead.enrichmentStatus === 'assertiva') && <span className="text-micro font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse">Processando...</span>}
                    {(() => {
                      const abbrev = getTrapAbbrev(lead.hypotheticalTrap)
                      if (!abbrev) return null
                      return (
                        <span className={`text-micro font-bold px-1.5 py-0.5 rounded ${trapBadgeClass(abbrev)}`}>{abbrev}</span>
                      )
                    })()}
                    {(() => {
                      const days = lead.createdAt ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
                      if (days < 7 || lead.status === 'Fechado' || lead.status === 'Perdido') return null
                      return <span className={`text-micro font-bold px-1.5 py-0.5 rounded ${days >= 14 ? 'text-error bg-error/10' : 'text-warning bg-warning/10'}`}>{days}d parado</span>
                    })()}
                  </div>
                  <p className="text-label text-text-muted mt-0.5">
                    {lead.segment || 'Segmento pendente'}
                    {lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ''}` : ''}
                    {lead.monthlyRevenue ? ` · ${formatCurrencyShort(lead.monthlyRevenue)}/mês` : ''}
                  </p>
                </td>
                <td className="py-4 px-4 text-center hidden md:table-cell"><span className="text-xs text-text-secondary">{lead.tier}</span></td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(score)} animate-[bar-grow_0.8s_cubic-bezier(0.4,0,0.2,1)_both]`} style={{ width: `${(score / 5) * 100}%`, animationDelay: `${Math.min(index, 20) * 30 + 200}ms` }} />
                    </div>
                    <span className="text-sm font-mono font-bold text-text-primary w-7 text-right">{score}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center hidden md:table-cell">
                  {statusInfo && (
                    <Badge variant={lead.status === 'Fechado' ? 'success' : lead.status === 'Perdido' ? 'error' : 'default'} size="sm">
                      {statusInfo.label}
                    </Badge>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-block text-label font-bold px-3 py-1 rounded-md ${tempColors[lead.temperature] || tempColors.Frio}`}>
                    {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- Main page ---
export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [segment, setSegment] = useState('')
  const [temperature, setTemperature] = useState(() => searchParams.get('temperatura') || '')
  const [status, setStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const hasActiveFilters = !!segment || !!temperature || !!status || !!searchQuery

  const clearFilters = () => {
    setSegment('')
    setTemperature('')
    setStatus('')
    if (searchParams.has('temperatura')) setSearchParams({}, { replace: true })
    setSearchQuery('')
  }

  const filteredLeads = (leads || []).filter((l) => {
    if (segment && l.segment !== segment) return false
    if (temperature && l.temperature !== temperature) return false
    if (status && l.status !== status) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matches = l.companyName?.toLowerCase().includes(q)
        || l.segment?.toLowerCase().includes(q)
        || l.city?.toLowerCase().includes(q)
        || l.state?.toLowerCase().includes(q)
        || l.tradeName?.toLowerCase().includes(q)
        || l.cnpj?.includes(q)
      if (!matches) return false
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Leads</h1>
          <p className="text-xs text-text-muted mt-0.5">Carregando...</p>
        </div>
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  const totalLeads = leads?.length || 0
  const isFilteredEmpty = filteredLeads.length === 0 && totalLeads > 0

  return (
    <div className="space-y-5">
      <AnimateIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading gradient-text">Leads</h1>
            <p className="text-xs text-text-muted mt-0.5">
              {hasActiveFilters
                ? `${filteredLeads.length} de ${totalLeads} leads`
                : `${totalLeads} leads encontrados`}
            </p>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
            Novo
          </Button>
        </div>
      </AnimateIn>

      <AnimateIn delay={80}>
        <LeadFilters
          segment={segment} setSegment={setSegment}
          temperature={temperature} setTemperature={setTemperature}
          status={status} setStatus={setStatus}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}
        />
      </AnimateIn>

      {totalLeads === 0 ? (
        <AnimateIn delay={120}>
          <EmptyState
            icon={Users}
            title="Nenhum lead encontrado"
            description="Inicie uma pesquisa para encontrar empresas compatíveis com seu ICP."
            action={{ label: 'Nova pesquisa', onClick: () => navigate('/search') }}
          />
        </AnimateIn>
      ) : isFilteredEmpty ? (
        <AnimateIn delay={120}>
          <EmptyState
            icon={Search}
            title="Nenhum lead encontrado com esses filtros"
            description={`${totalLeads} leads no sistema, mas nenhum corresponde aos filtros aplicados.`}
            action={{ label: 'Limpar filtros', onClick: clearFilters }}
          />
        </AnimateIn>
      ) : (
        <div className="animate-[fade-in_0.4s_ease-out]">
          <Card className="p-0 overflow-hidden">
            <LeadTable leads={filteredLeads} />
          </Card>
        </div>
      )}
    </div>
  )
}
