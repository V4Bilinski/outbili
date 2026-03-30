import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeads } from '../hooks/useLeads'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, Plus } from 'lucide-react'
import { LEAD_STATUSES, TEMPERATURES, SEGMENTS } from '../lib/constants'
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import type { Lead } from '../types'

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
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider hidden md:table-cell">Status</th>
            <th className="text-center py-3 px-4 text-[11px] font-medium text-text-muted uppercase tracking-wider">Temperatura</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => {
            const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
            const tempColors: Record<string, string> = { Quente: 'bg-red text-white', Morno: 'bg-warning text-black', Frio: 'bg-cold text-white' }
            const statusInfo = LEAD_STATUSES.find((s) => s.value === lead.status)
            return (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="border-b border-border/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group animate-[fade-in_0.4s_ease-out_both]" style={{ animationDelay: `${index * 50}ms` }}>
                <td className="py-4 px-4 text-sm text-text-muted font-mono">{index + 1}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary group-hover:text-white transition-colors">{lead.companyName}</span>
                    {lead.enrichmentStatus === 'complete' && <span className="text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">IA</span>}
                    {lead.enrichmentStatus === 'pending' && <span className="text-[9px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded animate-pulse">...</span>}
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {lead.segment || 'Sem segmento'}
                    {lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ''}` : ''}
                    {lead.monthlyRevenue ? ` · ${formatCurrencyShort(lead.monthlyRevenue)}/mes` : ''}
                  </p>
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
                  {statusInfo && (
                    <Badge variant={lead.status === 'Fechado' ? 'success' : lead.status === 'Perdido' ? 'error' : 'default'} size="sm">
                      {statusInfo.label}
                    </Badge>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-md ${tempColors[lead.temperature] || tempColors.Frio}`}>
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
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/search')}>
            Novo
          </Button>
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
      ) : (
        <AnimateIn delay={120}>
          <Card className="p-0 overflow-hidden">
            <LeadTable leads={filteredLeads} />
          </Card>
        </AnimateIn>
      )}
    </div>
  )
}
