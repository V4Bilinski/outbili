import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../hooks/useLeads'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, LayoutGrid, List, Plus } from 'lucide-react'
import { LEAD_STATUSES, TEMPERATURES, SEGMENTS } from '../lib/constants'
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import type { Lead } from '../types'

type ViewMode = 'table' | 'kanban'

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

function LeadTable({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Empresa', 'Temp.', 'Score', 'Status', 'Segmento', 'Tier', 'Faturamento'].map((h, i) => (
              <th key={h} className={`text-left py-3.5 px-4 text-[11px] font-medium text-text-muted uppercase tracking-[0.1em] ${i > 1 && i < 5 ? 'hidden md:table-cell' : ''} ${i >= 5 ? 'hidden lg:table-cell' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'
            const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
            return (
              <tr
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="border-b border-border/50 hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                      lead.temperature === 'HOT' ? 'bg-hot/10 text-hot' : lead.temperature === 'WARM' ? 'bg-warm/10 text-warm' : 'bg-white/5 text-text-muted'
                    }`}>
                      {score}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-text-primary group-hover:text-white transition-colors">{lead.companyName}</p>
                        {lead.sourceHtmlReport === 'importado_manual' && (
                          <span className="text-[9px] font-medium text-info bg-info/10 px-1.5 py-0.5 rounded">Importado</span>
                        )}
                        {lead.enrichmentStatus === 'pending' && (
                          <span className="text-[9px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse">Enriquecendo...</span>
                        )}
                        {lead.enrichmentStatus === 'complete' && (
                          <span className="text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">IA</span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={tempVariant} size="sm">{lead.temperature}</Badge>
                </td>
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-dark to-red" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">{score}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <Badge variant="outline" size="sm">{lead.status}</Badge>
                </td>
                <td className="py-3.5 px-4 hidden lg:table-cell">
                  <span className="text-xs text-text-secondary">{lead.segment}</span>
                </td>
                <td className="py-3.5 px-4 hidden lg:table-cell">
                  <span className="text-xs text-text-muted">{lead.tier}</span>
                </td>
                <td className="py-3.5 px-4 hidden lg:table-cell">
                  <span className="text-xs font-mono text-text-muted">
                    {lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue) + '/mês' : '-'}
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

function KanbanView({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  const columns = LEAD_STATUSES.filter((s) => s.value !== 'Perdido')

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0 snap-x">
      {columns.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.value)
        return (
          <div key={col.value} className="min-w-[280px] flex-shrink-0 snap-start">
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-text-secondary">{col.label}</span>
              <span className="text-[11px] text-text-muted font-mono bg-white/5 rounded-md px-1.5 py-0.5">{colLeads.length}</span>
            </div>
            <div className="space-y-2.5">
              {colLeads.map((lead) => {
                const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
                return (
                  <Card
                    key={lead.id}
                    accent={lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'}
                    hover
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <Badge variant={lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'} size="sm">
                        {lead.temperature}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-text-muted">{score}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">{lead.companyName}</p>
                    <p className="text-[11px] text-text-muted">{lead.segment} · {lead.tier}</p>
                  </Card>
                )
              })}
              {colLeads.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="text-xs text-text-muted">Vazio</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
    <div className="space-y-5 animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center justify-between">
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

      <LeadFilters segment={segment} setSegment={setSegment} temperature={temperature} setTemperature={setTemperature} status={status} setStatus={setStatus} />

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead encontrado"
          description="Faça sua primeira pesquisa ou ajuste os filtros."
          action={{ label: 'Nova pesquisa', onClick: () => navigate('/search') }}
        />
      ) : view === 'table' ? (
        <Card className="p-0 overflow-hidden">
          <LeadTable leads={filteredLeads} />
        </Card>
      ) : (
        <KanbanView leads={filteredLeads} />
      )}
    </div>
  )
}
