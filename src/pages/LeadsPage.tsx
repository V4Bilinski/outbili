import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import { createActivity } from '../services/activityService'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, LayoutGrid, List, Plus, CheckCircle, AlertCircle, ArrowRight, X, Trophy } from 'lucide-react'
import { LEAD_STATUSES, TEMPERATURES, SEGMENTS } from '../lib/constants'
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import type { Lead } from '../types'

type ViewMode = 'table' | 'kanban'

// --- Stage gate checklists for gamification ---
const STAGE_GATES: Record<string, { emoji: string; title: string; checks: string[] }> = {
  Qualificado: {
    emoji: '🎯',
    title: 'Qualificar lead',
    checks: [
      'CNPJ validado e empresa ativa',
      'Faturamento estimado compativel com ICP',
      'Decisor identificado (nome + cargo)',
      'Score SPICED >= 3.0',
    ],
  },
  Contactado: {
    emoji: '📞',
    title: 'Marcar como contactado',
    checks: [
      'Primeiro contato realizado (WhatsApp, email ou LinkedIn)',
      'Mensagem personalizada enviada',
      'Canal de contato registrado no lead',
    ],
  },
  Respondeu: {
    emoji: '💬',
    title: 'Lead respondeu',
    checks: [
      'Resposta recebida do decisor',
      'Interesse confirmado ou objecao mapeada',
      'Proximo passo definido (reuniao, proposta, follow-up)',
    ],
  },
  'Reunião': {
    emoji: '🤝',
    title: 'Reuniao agendada',
    checks: [
      'Data e horario da reuniao confirmados',
      'Pauta/diagnostico preparado',
      'Participantes definidos (quem do lado do cliente)',
    ],
  },
  Proposta: {
    emoji: '📋',
    title: 'Proposta enviada',
    checks: [
      'Proposta comercial elaborada e enviada',
      'Valor e escopo alinhados com o decisor',
      'Prazo de resposta combinado',
    ],
  },
  Fechado: {
    emoji: '🏆',
    title: 'Negocio fechado!',
    checks: [
      'Contrato assinado ou aceite formal',
      'Pagamento confirmado ou faturado',
      'Onboarding iniciado',
    ],
  },
  Perdido: {
    emoji: '❌',
    title: 'Lead perdido',
    checks: [
      'Motivo da perda registrado',
      'Follow-up futuro agendado (se aplicavel)',
    ],
  },
}

// --- Filters ---
function LeadFilters({
  segment, setSegment, temperature, setTemperature, status, setStatus,
}: {
  segment: string; setSegment: (v: string) => void
  temperature: string; setTemperature: (v: string) => void
  status: string; setStatus: (v: string) => void
}) {
  const selectClass = 'h-9 rounded-xl bg-white/[0.03] border border-border text-xs text-text-secondary px-3 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors appearance-none cursor-pointer'
  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  )
}

// --- Table view ---
function LeadTable({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  const barColor = (score: number) => {
    if (score >= 4) return 'bg-red'
    if (score >= 3) return 'bg-warning'
    return 'bg-cold'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider w-10">#</th>
            <th className="text-left py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider">Nome</th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Tier</th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider">Score</th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Trava</th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider">Temperatura</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => {
            const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
            const tempColors = { HOT: 'bg-red text-white', WARM: 'bg-warning text-black', COLD: 'bg-cold text-white' }
            const trap = lead.hypotheticalTrap?.replace(/^T\d+\s*[-–]\s*/, '') || ''
            const trapCode = lead.hypotheticalTrap?.match(/^(T\d+)/)?.[1] || ''
            return (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="border-b border-border/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group animate-[fade-in_0.4s_ease-out_both]" style={{ animationDelay: `${index * 50}ms` }}>
                <td className="py-4 px-4 text-sm text-text-muted font-mono">{index + 1}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary group-hover:text-white transition-colors">{lead.companyName}</span>
                    {lead.enrichmentStatus === 'complete' && <span className="text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">IA</span>}
                    {lead.enrichmentStatus === 'pending' && <span className="text-[9px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse">...</span>}
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">{lead.city}{lead.state ? `, ${lead.state}` : ''}{lead.monthlyRevenue ? ` · ${formatCurrencyShort(lead.monthlyRevenue)}/mês` : ''}</p>
                </td>
                <td className="py-4 px-4 text-center hidden md:table-cell"><span className="text-xs text-text-secondary">{lead.tier}</span></td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(score)} animate-[bar-grow_0.8s_cubic-bezier(0.4,0,0.2,1)_both]`} style={{ width: `${(score / 5) * 100}%`, animationDelay: `${index * 50 + 200}ms` }} />
                    </div>
                    <span className="text-sm font-mono font-bold text-text-primary w-7 text-right">{score}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center hidden md:table-cell">
                  {lead.hypotheticalTrap && (
                    <span className="text-[11px] font-medium text-text-secondary bg-white/[0.05] border border-border px-2.5 py-1 rounded-md whitespace-nowrap">
                      {trapCode} {trap.length > 15 ? trap.slice(0, 15) + '…' : trap}
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-md ${tempColors[lead.temperature] || tempColors.COLD}`}>{lead.temperature === 'HOT' ? 'Quente' : lead.temperature === 'WARM' ? 'Morno' : 'Frio'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// (DnD uses native HTML5 — no @dnd-kit components needed)

// --- Stage gate modal (gamification) ---
function StageGateModal({ lead, fromStatus, toStatus, onConfirm, onCancel }: {
  lead: Lead; fromStatus: string; toStatus: string; onConfirm: (notes: string) => void; onCancel: () => void
}) {
  const gate = STAGE_GATES[toStatus]
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')
  const allChecked = gate ? checked.size === gate.checks.length : true
  const fromLabel = LEAD_STATUSES.find((s) => s.value === fromStatus)?.label || fromStatus
  const toLabel = LEAD_STATUSES.find((s) => s.value === toStatus)?.label || toStatus
  const toColor = LEAD_STATUSES.find((s) => s.value === toStatus)?.color || '#FF6B1A'

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  // Special celebration for "Fechado"
  const isCelebration = toStatus === 'Fechado'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={cn(
        'relative w-full max-w-sm rounded-2xl border p-5 animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)]',
        isCelebration
          ? 'bg-gradient-to-br from-amber-900/80 to-surface-md/90 border-amber-400/30'
          : 'bg-gradient-to-br from-surface/95 to-surface-md/90 border-border',
      )}>
        {/* Close */}
        <button onClick={onCancel} className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{gate?.emoji || '📋'}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-text-primary">{gate?.title || `Mover para ${toLabel}`}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted">{fromLabel}</span>
              <ArrowRight className="h-3 w-3 text-text-muted" />
              <span className="text-[11px] font-semibold" style={{ color: toColor }}>{toLabel}</span>
            </div>
          </div>
        </div>

        {/* Lead info */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-border mb-3">
          <p className="text-xs font-semibold text-text-primary">{lead.companyName}</p>
          <p className="text-[10px] text-text-muted">{lead.segment} · {lead.tier} · Score {lead.score || '—'}</p>
        </div>

        {/* Checklist (gamification) */}
        {gate && (
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold mb-1.5">
              {isCelebration ? '🎉 Checklist final' : 'Validar antes de mover'}
            </p>
            <div className="space-y-1.5">
              {gate.checks.map((check, idx) => (
                <button
                  key={idx}
                  onClick={() => toggle(idx)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border text-left cursor-pointer transition-all duration-200',
                    checked.has(idx)
                      ? 'bg-success/10 border-success/30'
                      : 'bg-white/[0.02] border-border hover:border-border-strong',
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300',
                    checked.has(idx)
                      ? 'bg-success border-success'
                      : 'border-border',
                  )}>
                    {checked.has(idx) && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className={cn(
                    'text-[11px] transition-colors',
                    checked.has(idx) ? 'text-text-primary' : 'text-text-secondary',
                  )}>
                    {check}
                  </span>
                </button>
              ))}
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-red to-success rounded-full transition-all duration-500"
                style={{ width: `${(checked.size / gate.checks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Observacoes */}
        <div className="mb-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observacoes (opcional)..."
            rows={2}
            className="w-full rounded-lg bg-white/[0.03] border border-border text-[11px] text-text-primary placeholder:text-text-muted p-2.5 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => onConfirm(notes)}
            disabled={!allChecked}
            className="flex-1"
            icon={isCelebration ? <Trophy className="h-4 w-4" /> : allChecked ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          >
            {isCelebration ? 'Fechar negocio!' : allChecked ? 'Confirmar' : `${gate ? gate.checks.length - checked.size : 0} pendente${gate && gate.checks.length - checked.size > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Kanban DnD view ---
function KanbanView({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  const updateLead = useUpdateLead()
  const columns = LEAD_STATUSES.filter((s) => s.value !== 'Perdido')

  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ lead: Lead; from: string; to: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    setOverId(null)

    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const newStatus = over.id as string
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Open stage gate modal
    setPendingMove({ lead, from: lead.status, to: newStatus })
  }, [leads])

  const handleConfirmMove = useCallback((notes: string) => {
    if (!pendingMove) return

    const { lead, from, to } = pendingMove
    updateLead.mutate({ id: lead.id, data: { status: to } })

    const fromLabel = LEAD_STATUSES.find((s) => s.value === from)?.label || from
    const toLabel = LEAD_STATUSES.find((s) => s.value === to)?.label || to

    // Save stage change as activity (with notes if provided)
    const content = notes.trim()
      ? `Movido de ${fromLabel} para ${toLabel}\n\n${notes.trim()}`
      : `Movido de ${fromLabel} para ${toLabel}`

    createActivity({
      leadId: lead.id,
      type: 'status_change',
      description: content,
    }).catch(() => { /* non-critical */ })

    if (to === 'Fechado') {
      toast.success(`🏆 ${lead.companyName} — Negocio fechado!`)
    } else {
      toast.success(`${lead.companyName} movido para ${toLabel}`)
    }

    setPendingMove(null)
  }, [pendingMove, updateLead])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0 md:overflow-x-visible snap-x snap-mandatory md:snap-none">
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.value)
            return (
              <DroppableColumn
                key={col.value}
                id={col.value}
                label={col.label}
                color={col.color}
                leads={colLeads}
                isOver={overId === col.value}
                onCardClick={(id) => navigate(`/leads/${id}`)}
              />
            )
          })}
        </div>

        {/* Drag overlay (floating card) */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeLead && (
            <div style={{ width: 260 }}>
              <Card
                accent={activeLead.temperature === 'HOT' ? 'hot' : activeLead.temperature === 'WARM' ? 'warm' : 'cold'}
                className="p-4 shadow-2xl shadow-black/50 ring-2 ring-red/40 scale-[1.03] cursor-grabbing"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <Badge variant={activeLead.temperature === 'HOT' ? 'hot' : activeLead.temperature === 'WARM' ? 'warm' : 'cold'} size="sm">
                    {activeLead.temperature}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-text-muted">
                    {activeLead.score || '—'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">{activeLead.companyName}</p>
                <p className="text-[11px] text-text-muted">{activeLead.segment} · {activeLead.tier}</p>
              </Card>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Stage gate modal */}
      {pendingMove && (
        <StageGateModal
          lead={pendingMove.lead}
          fromStatus={pendingMove.from}
          toStatus={pendingMove.to}
          onConfirm={handleConfirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </>
  )
}

// --- Main page ---
export function LeadsPage() {
  const { data: leads, isLoading } = useLeads()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('table')
  const [segment, setSegment] = useState('')
  const [temperature, setTemperature] = useState('')
  const [status, setStatus] = useState('')

  const filteredLeads = (leads || []).filter((l) => {
    if (segment && l.segment !== segment) return false
    if (temperature && l.temperature !== temperature) return false
    if (status && l.status !== status) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AnimateIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading gradient-text">Leads</h1>
            <p className="text-xs text-text-muted mt-0.5">{filteredLeads.length} leads encontrados</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex rounded-xl p-0.5 bg-white/[0.03] border border-border">
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${view === 'table' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${view === 'kanban' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
              Novo
            </Button>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={80}>
        <LeadFilters segment={segment} setSegment={setSegment} temperature={temperature} setTemperature={setTemperature} status={status} setStatus={setStatus} />
      </AnimateIn>

      {filteredLeads.length === 0 ? (
        <AnimateIn delay={120}>
          <EmptyState
            icon={Users}
            title="Nenhum lead encontrado"
            description="Faca sua primeira pesquisa ou ajuste os filtros."
            action={{ label: 'Nova pesquisa', onClick: () => navigate('/search') }}
          />
        </AnimateIn>
      ) : view === 'table' ? (
        <AnimateIn delay={120}>
          <Card className="p-0 overflow-hidden">
            <LeadTable leads={filteredLeads} />
          </Card>
        </AnimateIn>
      ) : (
        <AnimateIn delay={120}>
          <KanbanView leads={filteredLeads} />
        </AnimateIn>
      )}
    </div>
  )
}
