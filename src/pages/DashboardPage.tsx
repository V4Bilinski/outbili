import { useLeads } from '../hooks/useLeads'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, Flame, Calendar, Search, FileDown, Plus, Rocket, MessageCircle, Eye, TrendingUp, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getDaySegment, LEAD_STATUSES } from '../lib/constants'
import { calculateSpicedScore } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Lead } from '../types'

function KPICards({ leads }: { leads: Lead[] }) {
  const hotCount = leads.filter((l) => l.temperature === 'HOT').length
  const warmCount = leads.filter((l) => l.temperature === 'WARM').length
  const meetingsToday = leads.filter((l) => l.status === 'Reunião').length

  const cards = [
    { label: 'Total leads', value: leads.length, icon: Users, color: 'text-text-primary', accent: 'from-white/5 to-transparent' },
    { label: 'HOT ativos', value: hotCount, icon: Flame, color: 'text-hot', accent: 'from-hot/8 to-transparent' },
    { label: 'WARM ativos', value: warmCount, icon: TrendingUp, color: 'text-warm', accent: 'from-warm/8 to-transparent' },
    { label: 'Reuniões', value: meetingsToday, icon: Calendar, color: 'text-success', accent: 'from-success/8 to-transparent' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.accent} backdrop-blur-xl border border-border p-5`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">{card.label}</p>
              <p className={`text-4xl font-bold font-mono mt-2 tracking-tight ${card.color}`}>{card.value}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <card.icon className={`h-5 w-5 ${card.color} opacity-60`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NextActions({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()

  const sorted = [...leads]
    .filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido')
    .sort((a, b) => {
      const tempOrder = { HOT: 0, WARM: 1, COLD: 2 }
      const tempDiff = (tempOrder[a.temperature] ?? 2) - (tempOrder[b.temperature] ?? 2)
      if (tempDiff !== 0) return tempDiff
      return (b.score || 0) - (a.score || 0)
    })
    .slice(0, 6)

  if (sorted.length === 0) return null

  const getAction = (lead: Lead) => {
    switch (lead.status) {
      case 'Reunião': return { text: 'Preparar reunião', type: 'meeting' as const }
      case 'Contactado': return { text: 'Aguardando resposta', type: 'whatsapp' as const }
      case 'Respondeu': return { text: 'Agendar reunião', type: 'meeting' as const }
      case 'Qualificado': return { text: 'Iniciar cadência', type: 'whatsapp' as const }
      default: return { text: 'Qualificar lead', type: 'view' as const }
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <CardTitle>Próximas ações</CardTitle>
        <span className="text-[11px] text-text-muted font-mono">{sorted.length} pendentes</span>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((lead) => {
          const action = getAction(lead)
          const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'
          const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)

          return (
            <div
              key={lead.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                  lead.temperature === 'HOT' ? 'bg-hot/12 text-hot' : lead.temperature === 'WARM' ? 'bg-warm/12 text-warm' : 'bg-cold/12 text-cold'
                }`}>
                  {score}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">{lead.companyName}</p>
                    <Badge variant={tempVariant} size="sm">
                      {lead.temperature}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{action.text} · {lead.segment}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {action.type === 'whatsapp' && (
                  <Button variant="whatsapp" size="sm" icon={<MessageCircle className="h-3.5 w-3.5" />}>
                    WhatsApp
                  </Button>
                )}
                {action.type === 'view' && (
                  <Button variant="ghost" size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                    Ver
                  </Button>
                )}
                {action.type === 'meeting' && (
                  <Button variant="secondary" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
                    Prep
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
      <CardTitle className="mb-5">Pipeline</CardTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={statusCounts} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} width={85} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'rgba(15, 15, 18, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              color: '#F4F4F5',
              fontSize: 12,
              padding: '8px 12px',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
            {statusCounts.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.8} />
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
    { label: 'Nova pesquisa', desc: 'Buscar leads via Apify', icon: Search, onClick: () => navigate('/search') },
    { label: 'Importar relatório', desc: 'Upload HTML existente', icon: FileDown, onClick: () => navigate('/search') },
    { label: 'Nova cadência', desc: 'Criar sequência WhatsApp', icon: Plus, onClick: () => navigate('/campaigns/new') },
    { label: 'Agendar reunião', desc: 'Marcar com lead HOT', icon: Calendar, onClick: () => {} },
  ]

  return (
    <Card>
      <CardTitle className="mb-4">Ações rápidas</CardTitle>
      <div className="space-y-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-left hover:bg-white/[0.03] transition-all duration-200 cursor-pointer group"
          >
            <div className="p-2 rounded-lg bg-red-subtle group-hover:bg-red/12 transition-colors">
              <action.icon className="h-4 w-4 text-red" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{action.label}</p>
              <p className="text-[11px] text-text-muted">{action.desc}</p>
            </div>
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const allLeads = leads || []

  if (allLeads.length === 0) {
    return (
      <div className="animate-[fade-in_0.4s_ease-out]">
        <div className="flex items-center gap-4 mb-8">
          <img src="/outbili/logo-white.png" alt="V4 Bilinski" className="h-8" />
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-bold font-heading gradient-text">OUTBILI</h1>
            <p className="text-[11px] text-text-muted">Sistema de prospecção outbound</p>
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
    <div className="space-y-6 animate-[fade-in_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold font-heading gradient-text">Dashboard</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Segmento: <span className="text-red font-medium">{segment}</span>
            </p>
          </div>
        </div>
        <Button size="sm" icon={<Search className="h-3.5 w-3.5" />} onClick={() => {}}>
          Nova pesquisa
        </Button>
      </div>

      <KPICards leads={allLeads} />
      <NextActions leads={allLeads} />

      <div className="grid md:grid-cols-2 gap-5">
        <PipelineFunnel leads={allLeads} />
        <QuickActions />
      </div>
    </div>
  )
}
