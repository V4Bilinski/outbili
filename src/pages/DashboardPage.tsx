import { useLeads } from '../hooks/useLeads'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Users, Flame, Calendar, Search, FileDown, Plus, Eye, TrendingUp, ArrowUpRight, Sparkles, Target, BarChart3, Smartphone, ArrowRight, Zap } from 'lucide-react'
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon'
import { useNavigate } from 'react-router-dom'
import { LEAD_STATUSES } from '../lib/constants'
import { calculateSpicedScore } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Lead } from '../types'
import { ImportModal } from '../components/ImportModal'
import { useState, useCallback } from 'react'
import { useMassEnrichment } from '../hooks/useMassEnrichment'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'
import { AnimateIn } from '../components/ui/AnimateIn'

function CountUpValue({ end, color, isInView }: { end: number; color: string; isInView: boolean }) {
  const value = useCountUp({ end, duration: 1200, enabled: isInView })
  return <p className={`text-4xl font-bold font-mono mt-2 tracking-tight ${color}`}>{value}</p>
}

function KPICards({ leads }: { leads: Lead[] }) {
  const hotCount = leads.filter((l) => l.temperature === 'Quente').length
  const warmCount = leads.filter((l) => l.temperature === 'Morno').length
  const meetingsToday = leads.filter((l) => l.status === 'Reunião').length
  const { ref, isInView } = useInView({ threshold: 0.2 })

  const cards = [
    { label: 'Total leads', value: leads.length, icon: Users, color: 'text-text-primary', accent: 'from-white/5 to-transparent', pulse: false },
    { label: 'Quentes', value: hotCount, icon: Flame, color: 'text-hot', accent: 'from-hot/8 to-transparent', pulse: true },
    { label: 'Mornos', value: warmCount, icon: TrendingUp, color: 'text-warm', accent: 'from-warm/8 to-transparent', pulse: false },
    { label: 'Reuniões', value: meetingsToday, icon: Calendar, color: 'text-success', accent: 'from-success/8 to-transparent', pulse: false },
  ]

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.accent} backdrop-blur-xl border border-border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 ${card.pulse ? 'animate-[pulse-glow_2.5s_ease-in-out_1.5s_infinite]' : ''}`}
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
            transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 100 + 200}ms`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">{card.label}</p>
              <CountUpValue end={card.value} color={card.color} isInView={isInView} />
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
      const tempOrder: Record<string, number> = { Quente: 0, Morno: 1, Frio: 2 }
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
          const tempVariant = lead.temperature === 'Quente' ? 'hot' : lead.temperature === 'Morno' ? 'warm' : 'cold'
          const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)

          return (
            <div
              key={lead.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                  lead.temperature === 'Quente' ? 'bg-hot/12 text-hot' : lead.temperature === 'Morno' ? 'bg-warm/12 text-warm' : 'bg-cold/12 text-cold'
                }`}>
                  {score}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">{lead.companyName}</p>
                    <Badge variant={tempVariant} size="sm">
                      {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{action.text} · {lead.segment}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {action.type === 'whatsapp' && (
                  <Button variant="whatsapp" size="sm" icon={<WhatsAppIcon className="text-sm" />}>
                    WhatsApp
                  </Button>
                )}
                {action.type === 'view' && (
                  <Button variant="primary" size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                    Ver ficha
                  </Button>
                )}
                {action.type === 'meeting' && (
                  <Button variant="secondary" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
                    Preparar
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
    { label: 'Agendar reunião', desc: 'Marcar com lead Quente', icon: Calendar, onClick: () => {} },
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
  const navigate = useNavigate()
  const [showImport, setShowImport] = useState(false)
  const massEnrichment = useMassEnrichment()

  const handleEnrichRequest = useCallback((importedLeads: any[]) => {
    if (importedLeads.length > 0 && !massEnrichment.isRunning) {
      massEnrichment.enrichAll(importedLeads)
    }
  }, [massEnrichment])

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
      <div className="animate-[fade-in_0.4s_ease-out] space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red/10 via-surface to-surface border border-red/10 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red/5 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-red" />
              <span className="text-[11px] uppercase tracking-[0.15em] text-red font-semibold">Sistema de prospecção outbound</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading gradient-text mb-3">
              Bem-vindo ao OUTBILI
            </h1>
            <p className="text-sm text-text-secondary max-w-lg leading-relaxed mb-8">
              Pesquise, analise e prospecte empresas com inteligência de marketing completa.
              Encontre vulnerabilidades, mapeie concorrentes e prepare reuniões com dados reais.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" icon={<Search className="h-4 w-4" />} onClick={() => navigate('/search')}>
                Iniciar pesquisa de leads
              </Button>
              <Button size="lg" variant="secondary" icon={<FileDown className="h-4 w-4" />} onClick={() => setShowImport(true)}>
                Importar relatório
              </Button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-sm font-semibold font-heading text-text-secondary uppercase tracking-[0.1em] mb-4">Como funciona</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', icon: Search, title: 'Pesquisar', desc: 'Selecione segmento, região e palavras-chave. O sistema analisa presença digital, anúncios, SEO e concorrentes automaticamente.', color: 'text-red' },
              { step: '02', icon: Target, title: 'Qualificar', desc: 'Cada lead recebe um score SPICED, vulnerabilidades mapeadas e projeção de cenários com dados reais.', color: 'text-warning' },
              { step: '03', icon: Smartphone, title: 'Prospectar', desc: 'Crie cadências WhatsApp personalizadas via BilinskiZap com templates aprovados e merge tags.', color: 'text-whatsapp' },
              { step: '04', icon: BarChart3, title: 'Converter', desc: 'Acompanhe funil de conversão, métricas de entrega e relatórios estratégicos em tempo real.', color: 'text-success' },
            ].map((item) => (
              <div key={item.step} className="group p-5 rounded-2xl bg-white/[0.02] border border-border hover:border-border-strong transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold font-mono text-text-muted/30">{item.step}</span>
                  <div className={`p-2 rounded-xl bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1.5">{item.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/search')}
            className="group p-6 rounded-2xl bg-gradient-to-br from-red/8 to-transparent border border-red/15 hover:border-red/30 transition-all duration-300 text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="p-2.5 rounded-xl bg-red/10 inline-flex mb-3">
                  <Zap className="h-5 w-5 text-red" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">Pesquisa rápida</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Configure segmento, região e faturamento.
                  Em minutos receba análise completa de presença digital, vulnerabilidades e concorrentes.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-red group-hover:translate-x-1 transition-all mt-2 shrink-0" />
            </div>
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="group p-6 rounded-2xl bg-white/[0.02] border border-border hover:border-border-strong transition-all duration-300 text-left cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] inline-flex mb-3">
                  <FileDown className="h-5 w-5 text-text-secondary" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">Importar lista de empresas</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Importe planilhas, listas, PDFs ou arquivos HTML.
                  O sistema reconhece automaticamente os dados das empresas.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all mt-2 shrink-0" />
            </div>
          </button>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Leads no pipeline', value: '0', sub: 'Comece pesquisando' },
            { label: 'Pesquisas realizadas', value: '0', sub: 'Nenhuma ainda' },
            { label: 'Campanhas WhatsApp', value: '0', sub: 'Crie após importar' },
            { label: 'Taxa de conversão', value: '—', sub: 'Dados em breve' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.015] border border-border">
              <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium">{stat.label}</p>
              <p className="text-2xl font-bold font-mono text-text-muted/40 mt-1">{stat.value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        <ImportModal open={showImport} onClose={() => setShowImport(false)} onEnrichRequest={handleEnrichRequest} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimateIn delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading gradient-text">Dashboard</h1>
            <p className="text-xs text-text-muted mt-0.5">{allLeads.length} leads no pipeline</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<Search className="h-3.5 w-3.5" />} onClick={() => navigate('/search')}>
              Nova pesquisa
            </Button>
          </div>
        </div>
      </AnimateIn>

      <KPICards leads={allLeads} />

      <AnimateIn delay={100}>
        <NextActions leads={allLeads} />
      </AnimateIn>

      <div className="grid md:grid-cols-2 gap-5">
        <AnimateIn delay={0}>
          <PipelineFunnel leads={allLeads} />
        </AnimateIn>
        <AnimateIn delay={80}>
          <QuickActions />
        </AnimateIn>
      </div>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onEnrichRequest={handleEnrichRequest} />
    </div>
  )
}
