import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import { createActivity } from '../services/activityService'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Columns3, Plus, CheckCircle, AlertCircle, ArrowRight, X, Trophy, Filter } from 'lucide-react'
import { TEMPERATURES, SEGMENTS } from '../lib/constants'
import { calculateSpicedScore } from '../lib/utils'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import type { Lead } from '../types'

// --- Pipeline columns (all statuses from prospect to close) ---
const PIPELINE_COLUMNS = [
  { value: 'Novo', label: 'Prospecção', color: '#6366F1', accent: 'border-l-indigo-500' },
  { value: 'Qualificado', label: 'Qualificação', color: '#A855F7', accent: 'border-l-purple-500' },
  { value: 'Contactado', label: 'Contactado', color: '#F59E0B', accent: 'border-l-amber-500' },
  { value: 'Respondeu', label: 'Respondeu', color: '#22C55E', accent: 'border-l-green-500' },
  { value: 'Reunião', label: 'Reunião', color: '#EC4899', accent: 'border-l-pink-500' },
  { value: 'Proposta', label: 'Proposta', color: '#F97316', accent: 'border-l-orange-500' },
  { value: 'Fechado', label: 'Fechado', color: '#10B981', accent: 'border-l-emerald-500' },
]

// --- Stage gate checklists (required: true = obrigatório, false = opcional) ---
interface GateCheck { text: string; required: boolean }
const STAGE_GATES: Record<string, { emoji: string; title: string; checks: GateCheck[] }> = {
  Qualificado: {
    emoji: '🎯',
    title: 'Qualificar lead',
    checks: [
      { text: 'CNPJ validado e empresa ativa', required: true },
      { text: 'Faturamento estimado compatível com ICP', required: true },
      { text: 'Decisor identificado (nome + cargo)', required: true },
      { text: 'Score SPICED >= 3.0', required: false },
    ],
  },
  Contactado: {
    emoji: '📞',
    title: 'Marcar como contactado',
    checks: [
      { text: 'Primeiro contato realizado (WhatsApp, email ou LinkedIn)', required: true },
      { text: 'Mensagem personalizada enviada', required: true },
      { text: 'Canal de contato registrado no lead', required: false },
    ],
  },
  Respondeu: {
    emoji: '💬',
    title: 'Lead respondeu',
    checks: [
      { text: 'Resposta recebida do decisor', required: true },
      { text: 'Interesse confirmado ou objeção mapeada', required: true },
      { text: 'Próximo passo definido (reunião, proposta, follow-up)', required: false },
    ],
  },
  'Reunião': {
    emoji: '🤝',
    title: 'Reunião agendada',
    checks: [
      { text: 'Data e horário da reunião confirmados', required: true },
      { text: 'Pauta/diagnóstico preparado', required: true },
      { text: 'Participantes definidos (quem do lado do cliente)', required: false },
    ],
  },
  Proposta: {
    emoji: '📋',
    title: 'Proposta enviada',
    checks: [
      { text: 'Proposta comercial elaborada e enviada', required: true },
      { text: 'Valor e escopo alinhados com o decisor', required: true },
      { text: 'Prazo de resposta combinado', required: false },
    ],
  },
  Fechado: {
    emoji: '🏆',
    title: 'Negócio fechado!',
    checks: [
      { text: 'Contrato assinado ou aceite formal', required: true },
      { text: 'Pagamento confirmado ou faturado', required: true },
      { text: 'Onboarding iniciado', required: false },
    ],
  },
}

// --- Stage gate slide-over (painel lateral para nao bloquear visao do kanban) ---
function StageGateSlideOver({ lead, fromStatus, toStatus, onConfirm, onCancel }: {
  lead: Lead; fromStatus: string; toStatus: string; onConfirm: (notes: string) => void; onCancel: () => void
}) {
  const gate = STAGE_GATES[toStatus]
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')
  const requiredCount = gate?.checks.filter(c => c.required).length || 0
  const requiredChecked = gate?.checks.filter((c, i) => c.required && checked.has(i)).length || 0
  const allRequiredDone = requiredChecked >= requiredCount
  const fromLabel = PIPELINE_COLUMNS.find((s) => s.value === fromStatus)?.label || fromStatus
  const toLabel = PIPELINE_COLUMNS.find((s) => s.value === toStatus)?.label || toStatus
  const toColor = PIPELINE_COLUMNS.find((s) => s.value === toStatus)?.color || '#FF6B1A'
  const isCelebration = toStatus === 'Fechado'

  const toggle = (idx: number) => {
    setChecked((prev) => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next })
  }

  return (
    <div className="fixed inset-0 z-[60] animate-[fade-in_0.15s_ease-out]">
      {/* Backdrop semi-transparente — usuario ainda ve o kanban */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      {/* Slide-over lateral */}
      <div className={cn(
        'absolute right-0 top-0 bottom-0 w-full max-w-sm border-l shadow-2xl shadow-black/40 overflow-y-auto animate-[slide-in-right_0.3s_cubic-bezier(0.16,1,0.3,1)]',
        isCelebration
          ? 'bg-gradient-to-b from-amber-900/90 to-surface border-amber-400/20'
          : 'bg-surface border-border',
      )}>
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{gate?.emoji || '📋'}</span>
              <div>
                <p className="text-sm font-bold text-text-primary">{gate?.title || `Mover para ${toLabel}`}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-text-muted">{fromLabel}</span>
                  <ArrowRight className="h-3 w-3 text-text-muted" />
                  <span className="text-[11px] font-semibold" style={{ color: toColor }}>{toLabel}</span>
                </div>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-text-muted hover:text-text-primary cursor-pointer transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lead info */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-border">
            <p className="text-xs font-semibold text-text-primary">{lead.companyName}</p>
            <p className="text-[10px] text-text-muted">{lead.segment} · {lead.tier} · Score {lead.score || '—'}</p>
          </div>

          {/* Checklist com prioridade visual */}
          {gate && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">
                  {isCelebration ? 'Checklist final' : 'Validar antes de mover'}
                </p>
                <span className="text-[10px] text-text-muted">
                  {requiredChecked}/{requiredCount} obrigatórios
                </span>
              </div>
              <div className="space-y-1.5">
                {gate.checks.map((check, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggle(idx)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200',
                      checked.has(idx)
                        ? 'bg-success/10 border-success/30'
                        : check.required
                          ? 'bg-white/[0.02] border-border hover:border-red/30'
                          : 'bg-white/[0.01] border-border/50 hover:border-border opacity-70',
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300',
                      checked.has(idx) ? 'bg-success border-success' : check.required ? 'border-red/40' : 'border-border',
                    )}>
                      {checked.has(idx) && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className={cn('text-[11px] flex-1 transition-colors', checked.has(idx) ? 'text-text-primary' : 'text-text-secondary')}>
                      {check.text}
                    </span>
                    {check.required ? (
                      <span className="text-[9px] text-red/60 font-bold shrink-0">*</span>
                    ) : (
                      <span className="text-[9px] text-text-muted/50 shrink-0">opcional</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-red to-success rounded-full transition-all duration-500" style={{ width: `${(checked.size / gate.checks.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Notes */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações (opcional)..." rows={2}
            className="w-full rounded-lg bg-white/[0.03] border border-border text-[11px] text-text-primary placeholder:text-text-muted p-2.5 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors resize-none" />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel} className="flex-1">Cancelar</Button>
            <Button onClick={() => onConfirm(notes)} disabled={!allRequiredDone} className="flex-1"
              icon={isCelebration ? <Trophy className="h-4 w-4" /> : allRequiredDone ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}>
              {isCelebration ? 'Fechar negócio!' : allRequiredDone ? 'Confirmar' : `${requiredCount - requiredChecked} obrigatório${requiredCount - requiredChecked > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Lead card for pipeline ---
function PipelineCard({ lead, onDragStart }: { lead: Lead; onDragStart: () => void }) {
  const navigate = useNavigate()
  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)

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
      <div className="flex items-start justify-between mb-1.5">
        <Badge variant={lead.temperature === 'Quente' ? 'hot' : lead.temperature === 'Morno' ? 'warm' : 'cold'} size="sm">
          {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
        </Badge>
        <span className="text-xs font-mono font-bold text-text-muted">{score.toFixed(1)}</span>
      </div>
      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-white transition-colors">{lead.companyName}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{lead.segment || 'Sem segmento'} · {lead.tier || '—'}</p>
      {lead.city && <p className="text-[10px] text-text-muted mt-0.5">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>}
      {lead.enrichmentStatus === 'complete' && (
        <span className="inline-block mt-1.5 text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">Enriquecido</span>
      )}
    </div>
  )
}

// --- Main Pipeline Page ---
export function PipelinePage() {
  const { data: leads, isLoading } = useLeads()
  const updateLead = useUpdateLead()
  const navigate = useNavigate()
  const dragLeadId = useRef<string | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ lead: Lead; from: string; to: string } | null>(null)

  // Filters
  const [segFilter, setSegFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')

  const allLeads = (leads || []).filter((l) => {
    if (l.status === 'Perdido') return false
    if (segFilter && l.segment !== segFilter) return false
    if (tempFilter && l.temperature !== tempFilter) return false
    return true
  })

  const handleConfirmMove = useCallback((notes: string) => {
    if (!pendingMove) return
    const { lead, from, to } = pendingMove
    updateLead.mutate({ id: lead.id, data: { status: to } })

    const fromLabel = PIPELINE_COLUMNS.find((s) => s.value === from)?.label || from
    const toLabel = PIPELINE_COLUMNS.find((s) => s.value === to)?.label || to
    const desc = notes.trim() ? `Movido de ${fromLabel} para ${toLabel}\n\n${notes.trim()}` : `Movido de ${fromLabel} para ${toLabel}`
    createActivity({ leadId: lead.id, type: 'status_change', description: desc }).catch(() => {})

    toast.success(to === 'Fechado' ? `${lead.companyName} — Negócio fechado!` : `${lead.companyName} movido para ${toLabel}`)
    setPendingMove(null)
  }, [pendingMove, updateLead])

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Columns3 className="h-5 w-5 text-red" />
              <h1 className="text-xl font-bold font-heading gradient-text">Pipeline</h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Gerencie seus leads através do funil de vendas · {allLeads.length} leads
              {closedCount > 0 && <span className="text-success"> · {closedCount} fechados</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filters */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-text-muted" />
              <select value={segFilter} onChange={(e) => setSegFilter(e.target.value)}
                className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1.5 text-text-primary cursor-pointer">
                <option value="">Segmento</option>
                {SEGMENTS.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
              <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}
                className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1.5 text-text-primary cursor-pointer">
                <option value="">Temperatura</option>
                {TEMPERATURES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
              Novo Lead
            </Button>
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
        <AnimateIn delay={80}>
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
                    <span className="text-[11px] text-text-muted font-mono bg-white/5 rounded-md px-1.5 py-0.5 ml-auto">{colLeads.length}</span>
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
                        <p className={cn('text-[11px]', isOver ? 'text-red font-medium' : 'text-text-muted')}>
                          {isOver ? 'Solte aqui' : 'Nenhum lead'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </AnimateIn>
      )}

      {/* Stage gate slide-over */}
      {pendingMove && (
        <StageGateSlideOver
          lead={pendingMove.lead}
          fromStatus={pendingMove.from}
          toStatus={pendingMove.to}
          onConfirm={handleConfirmMove}
          onCancel={() => setPendingMove(null)}
        />
      )}
    </div>
  )
}
