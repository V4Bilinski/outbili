import { useLeads } from '../hooks/useLeads'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, Flame, Smartphone, Calendar, Search, FileDown, Plus, Rocket, MessageCircle, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getDaySegment, LEAD_STATUSES } from '../lib/constants'
import { calculateSpicedScore } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Lead } from '../types'

function KPICards({ leads }: { leads: Lead[] }) {
  const hotCount = leads.filter((l) => l.temperature === 'HOT').length
  const activeCampaigns = 0 // TODO: from campaigns hook
  const meetingsToday = leads.filter((l) => l.status === 'Reunião').length

  const cards = [
    { label: 'Leads hoje', value: leads.length, icon: Users, color: 'text-text-primary' },
    { label: 'HOT ativos', value: hotCount, icon: Flame, color: 'text-hot' },
    { label: 'Cadências ativas', value: activeCampaigns, icon: Smartphone, color: 'text-info' },
    { label: 'Reuniões', value: meetingsToday, icon: Calendar, color: 'text-success' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} accent="red">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{card.label}</p>
              <p className={`text-3xl font-bold font-mono mt-1 ${card.color}`}>{card.value}</p>
            </div>
            <card.icon className="h-5 w-5 text-text-muted" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function NextActions({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()

  // Sort: HOT first, then WARM, then COLD. Within each, by score desc.
  const sorted = [...leads]
    .filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido')
    .sort((a, b) => {
      const tempOrder = { HOT: 0, WARM: 1, COLD: 2 }
      const tempDiff = (tempOrder[a.temperature] ?? 2) - (tempOrder[b.temperature] ?? 2)
      if (tempDiff !== 0) return tempDiff
      return (b.score || 0) - (a.score || 0)
    })
    .slice(0, 8)

  if (sorted.length === 0) return null

  const getAction = (lead: Lead) => {
    switch (lead.status) {
      case 'Reunião': return { text: `Reunião com ${lead.companyName}`, type: 'meeting' as const }
      case 'Contactado': return { text: `Aguardando resposta`, type: 'whatsapp' as const }
      case 'Novo': return { text: `Qualificar lead`, type: 'view' as const }
      default: return { text: `Ver ficha`, type: 'view' as const }
    }
  }

  return (
    <Card className="col-span-full">
      <CardTitle className="mb-4">Próximas ações</CardTitle>
      <div className="space-y-2">
        {sorted.map((lead) => {
          const action = getAction(lead)
          const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'
          return (
            <div
              key={lead.id}
              className={`flex items-center justify-between p-3 rounded-lg bg-surface-md border border-stone-800/30 hover:bg-surface-hover transition-colors cursor-pointer ${
                lead.temperature === 'HOT' ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''
              }`}
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'}>
                  {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{lead.companyName}</p>
                  <p className="text-xs text-text-secondary">
                    Score {lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)} · {action.text}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {action.type === 'whatsapp' && (
                  <Button variant="whatsapp" size="sm" icon={<MessageCircle className="h-3 w-3" />}>
                    WhatsApp
                  </Button>
                )}
                {action.type === 'view' && (
                  <Button variant="ghost" size="sm" icon={<Eye className="h-3 w-3" />}>
                    Ver
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PipelineFunnel({ leads }: { leads: Lead[] }) {
  const statusCounts = LEAD_STATUSES.map((s) => ({
    name: s.label,
    count: leads.filter((l) => l.status === s.value).length,
    color: s.color,
  })).filter((s) => s.count > 0)

  if (statusCounts.length === 0) return null

  return (
    <Card>
      <CardTitle className="mb-4">Funil semanal</CardTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={statusCounts} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" tick={{ fill: '#B0B0B0', fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#B0B0B0', fontSize: 12 }} width={75} />
          <Tooltip
            contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, color: '#fff' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {statusCounts.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Nova pesquisa', icon: Search, onClick: () => navigate('/search') },
    { label: 'Importar relatório', icon: FileDown, onClick: () => navigate('/search') },
    { label: 'Nova cadência', icon: Plus, onClick: () => navigate('/campaigns/new') },
    { label: 'Agendar reunião', icon: Calendar, onClick: () => {} },
  ]

  return (
    <Card>
      <CardTitle className="mb-4">Ações rápidas</CardTitle>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const { data: leads, isLoading } = useLeads()
  const segment = getDaySegment()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const allLeads = leads || []

  if (allLeads.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading">OUTBILI</h1>
            <p className="text-sm text-text-secondary">Segmento do dia: {segment}</p>
          </div>
        </div>
        <EmptyState
          icon={Rocket}
          title="Bem-vindo ao OUTBILI!"
          description="Seu sistema de prospecção V4 Bilinski &Co. Comece pesquisando leads ou importando um relatório existente."
          action={{ label: 'Fazer primeira pesquisa', onClick: () => {} }}
          secondaryAction={{ label: 'Importar relatório HTML', onClick: () => {} }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">OUTBILI</h1>
          <p className="text-sm text-text-secondary">Segmento do dia: <span className="text-red font-semibold">{segment}</span></p>
        </div>
      </div>

      <KPICards leads={allLeads} />
      <NextActions leads={allLeads} />

      <div className="grid md:grid-cols-2 gap-4">
        <PipelineFunnel leads={allLeads} />
        <QuickActions />
      </div>
    </div>
  )
}
