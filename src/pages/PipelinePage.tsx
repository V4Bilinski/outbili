import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import { useAuth } from '../lib/auth-context'
import { createActivity } from '../services/activityService'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Columns3, Plus, Filter, Search } from 'lucide-react'
import { TEMPERATURES, SEGMENTS } from '../lib/constants'
import { calculateSpicedScore } from '../lib/utils'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import type { Lead } from '../types'
import { StageGatePopup } from '../components/pipeline/StageGate'
import { PIPELINE_COLUMNS, buildStageChangeDescription } from '../components/pipeline/stageConfig'

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

// --- Lead card for pipeline ---
function PipelineCard({ lead, onDragStart }: { lead: Lead; onDragStart: () => void }) {
  const navigate = useNavigate()
  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const trapAbbrev = getTrapAbbrev(lead.hypotheticalTrap)
  const scoreColorClass = score >= 3.7 ? 'text-red bg-red/10' : score >= 2.5 ? 'text-warning bg-warning/10' : 'text-cold bg-cold/10'

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart()
        e.dataTransfer.effectAllowed = 'move'
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = '0.5'
          setTimeout(() => { if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1' }, 0)
        }
      }}
      onClick={() => navigate(`/leads/${lead.id}`)}
      className="p-3 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className={`text-[11px] font-bold font-mono tabular-nums tracking-tight leading-none px-1.5 py-1 rounded ${scoreColorClass}`}>{score.toFixed(1)}</span>
        <div className="flex items-center gap-1.5">
          {trapAbbrev && (
            <span className={`text-[11px] font-bold tracking-tight leading-none px-1.5 py-1 rounded ${trapBadgeClass(trapAbbrev)}`}>{trapAbbrev}</span>
          )}
          <span className={`text-[11px] font-semibold tracking-tight leading-none px-1.5 py-1 rounded ${
            lead.temperature === 'Quente' ? 'bg-hot/15 text-hot' : lead.temperature === 'Morno' ? 'bg-warm/15 text-warm' : 'bg-cold/15 text-cold'
          }`}>
            {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-white transition-colors">{lead.companyName}</p>
      <p className="text-label text-text-muted mt-0.5">{lead.segment || '-'} · {lead.tier || '-'}</p>
      {lead.city && <p className="text-caption text-text-muted mt-0.5">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {lead.enrichmentStatus === 'complete' && (
          <span className="text-micro font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">Dados completos</span>
        )}
        {lead.enrichmentStatus && lead.enrichmentStatus !== 'complete' && lead.enrichmentStatus !== 'none' && (
          <span className="text-micro font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse">Enriquecendo...</span>
        )}
      </div>
    </div>
  )
}

// --- Main Pipeline Page ---
export function PipelinePage() {
  const { data: leads, isLoading } = useLeads()
  const updateLead = useUpdateLead()
  const { user } = useAuth()
  const navigate = useNavigate()
  const dragLeadId = useRef<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ lead: Lead; from: string; to: string } | null>(null)

  // Filters
  const [segFilter, setSegFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const allLeads = (leads || []).filter((l) => {
    if (mineOnly && l.assignedTo !== user?.profileId) return false
    if (segFilter && l.segment !== segFilter) return false
    if (tempFilter && l.temperature !== tempFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matches = l.companyName?.toLowerCase().includes(q)
        || l.tradeName?.toLowerCase().includes(q)
        || l.city?.toLowerCase().includes(q)
        || l.cnpj?.includes(q)
      if (!matches) return false
    }
    return true
  })

  const handleConfirmMove = (notes: string) => {
    if (!pendingMove) return
    const { lead, from, to } = pendingMove
    updateLead.mutate({ id: lead.id, data: { status: to } })

    const toLabel = PIPELINE_COLUMNS.find((s) => s.value === to)?.label || to
    const desc = buildStageChangeDescription(from, to, notes, 'pipeline-kanban')
    createActivity({ leadId: lead.id, type: 'status_change', description: desc, createdBy: user?.fullName || user?.email || 'Sistema' }).catch(() => {})

    if (to === 'Fechado') {
      toast.success(`🏆 ${lead.companyName}: negócio fechado.`, { duration: 5000 })
    } else if (to === 'Perdido') {
      toast(`🚫 ${lead.companyName} marcado como perdido.`, { duration: 4000 })
    } else {
      const emoji = to === 'Reunião' ? '📅' : to === 'Proposta' ? '📝' : '✅'
      toast.success(`${emoji} ${lead.companyName} → ${toLabel}`, { duration: 3000 })
    }
    setPendingMove(null)
  }

  const closedCount = allLeads.filter((l) => l.status === 'Fechado').length

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-96 flex-1" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <AnimateIn>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Columns3 className="h-5 w-5 text-red" />
              <h1 className="text-xl font-bold font-heading gradient-text">Pipeline</h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Funil de vendas. Arraste leads entre etapas · {allLeads.length} leads
              {closedCount > 0 && <span className="text-success"> · {closedCount} fechados</span>}
            </p>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
            Adicionar lead
          </Button>
        </div>
      </AnimateIn>

      {/* Controles: busca + visão + filtros (card dedicado, mais espaçado e legível) */}
      <AnimateIn delay={60}>
        <div className="rounded-2xl border border-border bg-white/[0.02] p-3 md:p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lead por nome, CNPJ ou cidade..."
              className="h-10 w-full bg-white/[0.04] border border-border rounded-xl pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red/40 transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setMineOnly(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!mineOnly ? 'bg-red/15 text-red' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>Todos</button>
              <button type="button" onClick={() => setMineOnly(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mineOnly ? 'bg-red/15 text-red' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>Meus leads</button>
            </div>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <Filter className="h-4 w-4 text-text-muted hidden sm:block" />
            <select value={segFilter} onChange={(e) => setSegFilter(e.target.value)}
              className="h-9 text-xs bg-white/[0.04] border border-border rounded-xl px-3 text-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors">
              <option value="">Segmento</option>
              {SEGMENTS.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
            </select>
            <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}
              className="h-9 text-xs bg-white/[0.04] border border-border rounded-xl px-3 text-text-secondary cursor-pointer focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors">
              <option value="">Temperatura</option>
              {TEMPERATURES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
            </select>
          </div>
        </div>
      </AnimateIn>

      {/* Kanban board */}
      {allLeads.length === 0 ? (
        <AnimateIn delay={80}>
          <EmptyState
            icon={Columns3}
            title="Pipeline vazio"
            description="Pesquise ou importe leads para começar a gerenciar seu funil de vendas."
            action={{ label: 'Nova pesquisa', onClick: () => navigate('/search') }}
          />
        </AnimateIn>
      ) : (
        <div className="animate-[fade-in_0.4s_ease-out]">
          <div className="relative">
          {/* Mobile scroll hint */}
          <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-bg to-transparent z-10" />
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
            {PIPELINE_COLUMNS.map((col) => {
              const colLeads = allLeads.filter((l) => (l.status || 'Novo') === col.value)
              const isOver = overColumn === col.value

              return (
                <div
                  key={col.value}
                  className="min-w-[220px] md:min-w-0 md:flex-1 flex-shrink-0 snap-start"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverColumn(col.value) }}
                  onDragLeave={() => setOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setOverColumn(null)
                    const leadId = dragLeadId.current
                    if (!leadId) return
                    const lead = allLeads.find((l) => l.id === leadId)
                    if (!lead || lead.status === col.value) return
                    setPendingMove({ lead, from: lead.status, to: col.value })
                    dragLeadId.current = null
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: col.color }} />
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <span className="text-xs font-semibold text-text-secondary">{col.label}</span>
                    </div>
                    <span className="text-label text-text-muted font-mono bg-white/5 rounded-md px-1.5 py-0.5 ml-auto">{colLeads.length}</span>
                  </div>

                  {/* Column body */}
                  <div className={cn(
                    'space-y-2 min-h-[140px] rounded-2xl p-2 transition-all duration-200',
                    isOver ? 'bg-red/5 border-2 border-dashed border-red/30' : 'border-2 border-dashed border-border/30',
                  )}>
                    {colLeads.map((lead) => (
                      <PipelineCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={() => { dragLeadId.current = lead.id }}
                      />
                    ))}
                    {colLeads.length === 0 && (
                      <div className={cn(
                        'rounded-xl border border-dashed p-8 text-center transition-all',
                        isOver ? 'border-red/40 bg-red/5' : 'border-border/40',
                      )}>
                        <p className={cn('text-label', isOver ? 'text-red font-medium' : 'text-text-muted')}>
                          {isOver ? 'Solte aqui' : 'Arraste um lead aqui'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {/* Stage gate popup */}
      {pendingMove && (
        <StageGatePopup
          lead={pendingMove.lead}
          fromStatus={pendingMove.from}
          toStatus={pendingMove.to}
          source="pipeline-kanban"
          onConfirm={handleConfirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  )
}
