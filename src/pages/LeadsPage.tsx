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
  segment,
  setSegment,
  temperature,
  setTemperature,
  status,
  setStatus,
}: {
  segment: string
  setSegment: (v: string) => void
  temperature: string
  setTemperature: (v: string) => void
  status: string
  setStatus: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={segment}
        onChange={(e) => setSegment(e.target.value)}
        className="h-8 rounded-lg bg-surface-md border border-stone-700 text-xs text-text-secondary px-2 focus:border-red/50 focus:outline-none"
      >
        <option value="">Todos segmentos</option>
        {SEGMENTS.map((s) => (
          <option key={s.slug} value={s.name}>{s.name}</option>
        ))}
      </select>
      <select
        value={temperature}
        onChange={(e) => setTemperature(e.target.value)}
        className="h-8 rounded-lg bg-surface-md border border-stone-700 text-xs text-text-secondary px-2 focus:border-red/50 focus:outline-none"
      >
        <option value="">Temperatura</option>
        {TEMPERATURES.map((t) => (
          <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-8 rounded-lg bg-surface-md border border-stone-700 text-xs text-text-secondary px-2 focus:border-red/50 focus:outline-none"
      >
        <option value="">Status</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
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
          <tr className="border-b border-stone-800/50">
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Empresa</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Temp.</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Score</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Segmento</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden lg:table-cell">Tier</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-text-muted uppercase tracking-wider hidden xl:table-cell">Faturamento</th>
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
                className="border-b border-stone-800/30 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <td className="py-3 px-3">
                  <p className="font-semibold text-text-primary">{lead.companyName}</p>
                  <p className="text-xs text-text-muted">{lead.city}, {lead.state}</p>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'}>
                    {lead.temperature}
                  </Badge>
                </td>
                <td className="py-3 px-3 hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-surface-lt overflow-hidden">
                      <div className="h-full rounded-full bg-red" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-text-secondary">{score}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge variant="outline">{lead.status}</Badge>
                </td>
                <td className="py-3 px-3 hidden lg:table-cell">
                  <span className="text-xs text-text-secondary">{lead.segment}</span>
                </td>
                <td className="py-3 px-3 hidden lg:table-cell">
                  <span className="text-xs text-text-secondary">{lead.tier}</span>
                </td>
                <td className="py-3 px-3 hidden xl:table-cell">
                  <span className="text-xs font-mono text-text-secondary">
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
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {columns.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.value)
        return (
          <div key={col.value} className="min-w-[260px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-text-muted font-mono">{colLeads.length}</span>
            </div>
            <div className="space-y-2">
              {colLeads.map((lead) => {
                const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'
                return (
                  <Card
                    key={lead.id}
                    accent={lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'}
                    hover
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={tempVariant} className="text-[10px]">
                        {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'}
                      </Badge>
                      <span className="text-xs font-mono text-text-muted">{lead.score || '-'}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">{lead.companyName}</p>
                    <p className="text-xs text-text-secondary">{lead.segment} · {lead.tier}</p>
                  </Card>
                )
              })}
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
    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-heading">Leads</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-md rounded-lg p-0.5 border border-stone-700">
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === 'table' ? 'bg-red text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === 'kanban' ? 'bg-red text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
            Novo
          </Button>
        </div>
      </div>

      <LeadFilters
        segment={segment}
        setSegment={setSegment}
        temperature={temperature}
        setTemperature={setTemperature}
        status={status}
        setStatus={setStatus}
      />

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

      <p className="text-xs text-text-muted text-center">{filteredLeads.length} leads</p>
    </div>
  )
}
