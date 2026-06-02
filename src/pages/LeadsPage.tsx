import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useLeads } from '../hooks/useLeads'
import { useColumns } from '../hooks/useColumns'
import { cn } from '../lib/cn'
import { useAuth } from '../lib/auth-context'
import { LeadCard } from '../components/leads/LeadCard'
import { listAssignableProfiles } from '../services/leadService'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, Plus, Search, X, ChevronRight, List, LayoutGrid } from 'lucide-react'
import { LEAD_STATUSES, TEMPERATURES, SEGMENTS, TIERS } from '../lib/constants'

const TRAP_OPTIONS = [
  { value: 'T1', label: 'T1 · Aquisição' },
  { value: 'T2', label: 'T2 · Conversão' },
  { value: 'T3', label: 'T3 · Ticket Médio' },
  { value: 'T4', label: 'T4 · Recorrência' },
  { value: 'T5', label: 'T5 · Margem' },
  { value: 'T6', label: 'T6 · Posicionamento' },
  { value: 'T7', label: 'T7 · Escalabilidade' },
  { value: 'T8', label: 'T8 · Dependência' },
]
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import type { Lead } from '../types'

// --- Filters ---
function LeadFilters({
  segment, setSegment, temperature, setTemperature, status, setStatus,
  trava, setTrava, tier, setTier, region, setRegion, regions,
  searchQuery, setSearchQuery, hasActiveFilters, onClearFilters,
}: {
  segment: string; setSegment: (v: string) => void
  temperature: string; setTemperature: (v: string) => void
  status: string; setStatus: (v: string) => void
  trava: string; setTrava: (v: string) => void
  tier: string; setTier: (v: string) => void
  region: string; setRegion: (v: string) => void; regions: string[]
  searchQuery: string; setSearchQuery: (v: string) => void
  hasActiveFilters: boolean; onClearFilters: () => void
}) {
  const selectClass = 'h-9 rounded-xl bg-elevated-1 border border-border text-xs text-text-secondary px-3 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors appearance-none cursor-pointer'
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
          className="h-10 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary pl-10 pr-9 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors"
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
        <select value={trava} onChange={(e) => setTrava(e.target.value)} className={selectClass}>
          <option value="">Trava</option>
          {TRAP_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectClass}>
          <option value="">Tier</option>
          {TIERS.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.range})</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
          <option value="">Região</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
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

// Threshold a partir do qual a lista passa a ser virtualizada.
// Abaixo disso (listas filtradas), o render normal e mantido (comportamento testado, com animacoes de entrada).
const VIRTUALIZE_THRESHOLD = 60

function barColor(score: number): string {
  if (score >= 3.7) return 'bg-red'
  if (score >= 2.5) return 'bg-warning'
  return 'bg-cold'
}

const TABLE_HEAD = (
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
)

const MOBILE_HINT = (
  <p className="text-caption text-text-muted px-4 py-1.5 border-b border-border/30 flex items-center gap-1 md:hidden">
    <ChevronRight className="h-3 w-3" /> Toque para abrir a ficha completa
  </p>
)

// Linha da tabela. `animate` aplica a entrada por-index (so no modo nao-virtualizado; na
// virtualizacao re-dispararia a cada scroll). `rowRef` recebe o measureElement do virtualizer.
function LeadTableRow({ lead, index, animate, rowRef }: {
  lead: Lead; index: number; animate: boolean; rowRef?: (el: HTMLTableRowElement | null) => void
}) {
  const navigate = useNavigate()
  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const tempColors: Record<string, string> = { Quente: 'bg-red text-white', Morno: 'bg-warning text-black', Frio: 'bg-cold text-white' }
  const statusInfo = LEAD_STATUSES.find((s) => s.value === lead.status)
  return (
    <tr
      ref={rowRef}
      data-index={index}
      onClick={() => navigate(`/leads/${lead.id}`)}
      className={cn('border-b border-border/30 hover:bg-elevated-2 transition-all duration-300 cursor-pointer group', animate && 'animate-[fade-in_0.4s_ease-out_both]')}
      style={animate ? { animationDelay: `${Math.min(index, 20) * 30}ms` } : undefined}
    >
      <td className="py-4 px-4 text-sm text-text-muted font-mono">{index + 1}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-text-primary group-hover:text-text-primary transition-colors">{lead.companyName}</span>
          {lead.sourceHtmlReport === 'cadastro_manual' && (
            <span
              title="Cadastrado manualmente com enriquecimento automático (CNPJá + Assertiva)"
              className="text-[9px] font-semibold uppercase tracking-wide bg-amber-400/10 border border-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded cursor-help leading-none"
            >
              Manual
            </span>
          )}
          {lead.enrichmentStatus === 'complete' && <span className="text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded leading-none">Enriquecido</span>}
          {(lead.enrichmentStatus === 'cnpja' || lead.enrichmentStatus === 'cnpja_n8n' || lead.enrichmentStatus === 'assertiva') && <span className="text-[9px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse leading-none">Processando...</span>}
        </div>
        <p className="text-label text-text-muted mt-0.5">
          {lead.segment || 'Segmento pendente'}
          {lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ''}` : ''}
          {lead.monthlyRevenue ? ` · ${formatCurrencyShort(lead.monthlyRevenue)}/mês` : ''}
        </p>
      </td>
      <td className="py-4 px-4 text-center hidden md:table-cell"><span className="text-xs font-semibold text-text-primary">{lead.tier}</span></td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 h-2 rounded-full bg-elevated-2 overflow-hidden">
            <div className={cn('h-full rounded-full', barColor(score), animate && 'animate-[bar-grow_0.8s_cubic-bezier(0.4,0,0.2,1)_both]')} style={{ width: `${(score / 5) * 100}%`, ...(animate ? { animationDelay: `${Math.min(index, 20) * 30 + 200}ms` } : {}) }} />
          </div>
          <span className="text-sm font-mono font-bold text-text-primary w-7 text-right">{score}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-center hidden md:table-cell">
        {statusInfo && (
          <Badge variant={lead.status === 'Fechado' ? 'success' : lead.status === 'Perdido' ? 'error' : 'default'} size="xs">
            {statusInfo.label}
          </Badge>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        <span className={`inline-block text-[9px] font-medium px-1.5 py-[3px] rounded-full uppercase tracking-wide leading-none ${tempColors[lead.temperature] || tempColors.Frio}`}>
          {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
        </span>
      </td>
    </tr>
  )
}

// --- Table view (virtualiza acima do threshold) ---
function LeadTable({ leads }: { leads: Lead[] }) {
  if (leads.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div className="overflow-x-auto">
        {MOBILE_HINT}
        <table className="w-full">
          {TABLE_HEAD}
          <tbody>
            {leads.map((lead, index) => <LeadTableRow key={lead.id} lead={lead} index={index} animate />)}
          </tbody>
        </table>
      </div>
    )
  }
  return <VirtualLeadTable leads={leads} />
}

// Tabela virtualizada por janela (spacer rows top/bottom). Score/markup identicos a versao normal.
function VirtualLeadTable({ leads }: { leads: Lead[] }) {
  const [scrollMargin, setScrollMargin] = useState(0)
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setScrollMargin(node.offsetTop)
  }, [])
  const virt = useWindowVirtualizer({
    count: leads.length,
    estimateSize: () => 73,
    overscan: 12,
    scrollMargin,
  })
  const items = virt.getVirtualItems()
  const paddingTop = items.length ? Math.max(0, items[0].start - scrollMargin) : 0
  const paddingBottom = items.length ? Math.max(0, virt.getTotalSize() - (items[items.length - 1].end - scrollMargin)) : 0
  return (
    <div ref={measureRef} className="overflow-x-auto">
      {MOBILE_HINT}
      <table className="w-full">
        {TABLE_HEAD}
        <tbody>
          {paddingTop > 0 && <tr aria-hidden><td colSpan={6} style={{ height: paddingTop }} /></tr>}
          {items.map((vi) => (
            <LeadTableRow key={leads[vi.index].id} lead={leads[vi.index]} index={vi.index} animate={false} rowRef={virt.measureElement} />
          ))}
          {paddingBottom > 0 && <tr aria-hidden><td colSpan={6} style={{ height: paddingBottom }} /></tr>}
        </tbody>
      </table>
    </div>
  )
}

// Grid de cards virtualizado por janela. Agrupa leads em linhas conforme o numero de colunas do breakpoint.
function VirtualCardGrid({ leads, profilesMap, onOpen }: {
  leads: Lead[]; profilesMap: Record<string, string>; onOpen: (id: string) => void
}) {
  const cols = useColumns()
  const [scrollMargin, setScrollMargin] = useState(0)
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setScrollMargin(node.offsetTop)
  }, [])
  const rowCount = Math.ceil(leads.length / cols)
  const virt = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 132,
    overscan: 4,
    scrollMargin,
  })
  return (
    <div ref={measureRef} style={{ height: virt.getTotalSize(), position: 'relative', width: '100%' }}>
      {virt.getVirtualItems().map((vrow) => {
        const start = vrow.index * cols
        const rowLeads = leads.slice(start, start + cols)
        return (
          <div
            key={vrow.key}
            data-index={vrow.index}
            ref={virt.measureElement}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vrow.start - scrollMargin}px)` }}
          >
            <div className="grid gap-3 pb-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {rowLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} ownerName={lead.assignedTo ? profilesMap[lead.assignedTo] : null} onClick={() => onOpen(lead.id)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Main page ---
export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mineOnly, setMineOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    try { return (localStorage.getItem('outbili-leads-view') as 'list' | 'cards') || 'list' } catch { return 'list' }
  })
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({})
  const [segment, setSegment] = useState('')
  const [region, setRegion] = useState('')
  const [temperature, setTemperature] = useState(() => searchParams.get('temperatura') || '')
  const [status, setStatus] = useState('')
  const [trava, setTrava] = useState(() => searchParams.get('trava') || '')
  const [tier, setTier] = useState(() => searchParams.get('tier') || '')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { try { localStorage.setItem('outbili-leads-view', viewMode) } catch { /* ignore */ } }, [viewMode])
  useEffect(() => {
    listAssignableProfiles().then((ps) => {
      const m: Record<string, string> = {}
      for (const p of ps) m[p.id] = p.fullName
      setProfilesMap(m)
    }).catch(() => {})
  }, [])

  const regions = [...new Set((leads || []).map((l) => l.state).filter(Boolean) as string[])].sort()

  const hasActiveFilters = !!segment || !!temperature || !!status || !!trava || !!tier || !!region || !!searchQuery || mineOnly

  const clearFilters = () => {
    setSegment('')
    setTemperature('')
    setStatus('')
    setTrava('')
    setTier('')
    setRegion('')
    if (searchParams.has('temperatura') || searchParams.has('trava') || searchParams.has('tier')) {
      setSearchParams({}, { replace: true })
    }
    setSearchQuery('')
    setMineOnly(false)
  }

  const filteredLeads = (leads || []).filter((l) => {
    if (mineOnly && l.assignedTo !== user?.profileId) return false
    if (region && l.state !== region) return false
    if (segment && l.segment !== segment) return false
    if (temperature && l.temperature !== temperature) return false
    if (status && l.status !== status) return false
    if (trava) {
      const abbrev = getTrapAbbrev(l.hypotheticalTrap)
      if (abbrev !== trava) return false
    }
    if (tier && l.tier !== tier) return false
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
                : `${totalLeads} leads no pipeline`}
            </p>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
            Adicionar lead
          </Button>
        </div>
      </AnimateIn>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!mineOnly ? 'bg-red/15 text-red' : 'bg-elevated-2 text-text-muted hover:text-text-secondary'}`}
          >Todos</button>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${mineOnly ? 'bg-red/15 text-red' : 'bg-elevated-2 text-text-muted hover:text-text-secondary'}`}
          >Meus leads</button>
        </div>
        <div className="flex items-center gap-1 bg-elevated-1 border border-border rounded-lg p-0.5" title="Formato de visualização">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Visualizar em lista"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-red/15 text-red' : 'text-text-muted hover:text-text-secondary'}`}
          ><List className="h-4 w-4" /></button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Visualizar em cards"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-red/15 text-red' : 'text-text-muted hover:text-text-secondary'}`}
          ><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      <AnimateIn delay={80}>
        <LeadFilters
          segment={segment} setSegment={setSegment}
          temperature={temperature} setTemperature={setTemperature}
          status={status} setStatus={setStatus}
          trava={trava} setTrava={setTrava}
          tier={tier} setTier={setTier}
          region={region} setRegion={setRegion} regions={regions}
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
      ) : viewMode === 'cards' ? (
        filteredLeads.length <= VIRTUALIZE_THRESHOLD ? (
          <div className="animate-[fade-in_0.4s_ease-out] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                ownerName={lead.assignedTo ? profilesMap[lead.assignedTo] : null}
                onClick={() => navigate(`/leads/${lead.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="animate-[fade-in_0.4s_ease-out]">
            <VirtualCardGrid leads={filteredLeads} profilesMap={profilesMap} onOpen={(id) => navigate(`/leads/${id}`)} />
          </div>
        )
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
