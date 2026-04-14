import { useLeads } from '../hooks/useLeads'
import { useZapCampaigns } from '../hooks/useBilinskiZap'
// bilinskizap metrics are computed inline in CampaignStats
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Flame, Search, FileDown, Plus, Eye, TrendingUp, ArrowUpRight, Sparkles, Target, BarChart3, Smartphone, ArrowRight, Zap, Send, CheckCircle, Snowflake } from 'lucide-react'
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

function CountUpValue({ end, className, isInView }: { end: number; className: string; isInView: boolean }) {
  const value = useCountUp({ end, duration: 1200, enabled: isInView })
  return <span className={className}>{value}</span>
}

function KPICards({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate()
  const hotCount = leads.filter((l) => l.temperature === 'Quente').length
  const warmCount = leads.filter((l) => l.temperature === 'Morno').length
  const coldCount = leads.filter((l) => l.temperature === 'Frio').length
  const meetingsCount = leads.filter((l) => l.status === 'Reunião').length
  const contactedCount = leads.filter((l) => l.status === 'Contactado' || l.status === 'Respondeu').length
  const closedCount = leads.filter((l) => l.status === 'Fechado').length
  const total = leads.length
  const { ref, isInView } = useInView({ threshold: 0.2 })

  const hotPct = total > 0 ? Math.round((hotCount / total) * 100) : 0
  const warmPct = total > 0 ? Math.round((warmCount / total) * 100) : 0
  const coldPct = total > 0 ? Math.round((coldCount / total) * 100) : 0

  return (
    <div ref={ref} className="space-y-4">
      {/* Hero card — Total leads com contexto narrativo */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-md to-surface border border-border p-6 transition-all duration-300"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 200ms',
        }}
      >
        {/* Glow sutil no canto */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          {/* Bloco principal: número grande + contexto */}
          <div className="flex items-baseline gap-3">
            <CountUpValue end={total} className="text-5xl md:text-6xl font-bold font-mono text-text-primary tracking-tighter leading-none" isInView={isInView} />
            <div>
              <p className="text-sm font-semibold text-text-secondary">leads no pipeline</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {closedCount > 0 && <span className="text-success">{closedCount} fechado{closedCount > 1 ? 's' : ''} </span>}
                {meetingsCount > 0 && <span>· {meetingsCount} em reunião </span>}
                {contactedCount > 0 && <span>· {contactedCount} em contato</span>}
                {closedCount === 0 && meetingsCount === 0 && contactedCount === 0 && 'Comece qualificando seus leads'}
              </p>
            </div>
          </div>

          {/* Mini spark: distribuição rápida */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              {[
                { label: 'Quentes', count: hotCount, color: 'bg-hot', textColor: 'text-hot' },
                { label: 'Mornos', count: warmCount, color: 'bg-warm', textColor: 'text-warm' },
                { label: 'Frios', count: coldCount, color: 'bg-text-muted/60', textColor: 'text-text-muted' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">{t.label}</span>
                  <span className={`text-xs font-mono font-bold ${t.textColor}`}>{t.count}</span>
                  <div className="w-12 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className={`h-full rounded-full ${t.color} transition-all duration-700`} style={{ width: total > 0 ? `${(t.count / total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barra de distribuição — estilo "tanque sendo preenchido" */}
        {total > 0 && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[10px] text-text-muted uppercase tracking-[0.08em] font-medium">Distribuição de temperatura</p>
              <div className="flex items-center gap-3">
                {hotPct > 0 && <span className="flex items-center gap-1.5 text-[10px] text-hot font-medium"><span className="w-2 h-2 rounded-full bg-hot" />{hotPct}% Quentes</span>}
                {warmPct > 0 && <span className="flex items-center gap-1.5 text-[10px] text-warm font-medium"><span className="w-2 h-2 rounded-full bg-warm" />{warmPct}% Mornos</span>}
                {coldPct > 0 && <span className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium"><span className="w-2 h-2 rounded-full bg-text-muted/60" />{coldPct}% Frios</span>}
              </div>
            </div>
            {/* Tanque */}
            <div className="relative h-3.5 rounded-lg overflow-hidden bg-white/[0.03] border border-white/[0.04]">
              {/* Segmentos preenchendo da esquerda para a direita */}
              <div className="absolute inset-0 flex">
                {hotCount > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-hot to-hot/80 animate-[bar-grow_1s_cubic-bezier(0.4,0,0.2,1)_0.3s_both]"
                    style={{ width: `${hotPct}%` }}
                  />
                )}
                {warmCount > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-warm to-warm/80 animate-[bar-grow_1s_cubic-bezier(0.4,0,0.2,1)_0.6s_both]"
                    style={{ width: `${warmPct}%` }}
                  />
                )}
                {coldCount > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-text-muted/30 to-text-muted/20 animate-[bar-grow_1.2s_cubic-bezier(0.4,0,0.2,1)_0.9s_both]"
                    style={{ width: `${coldPct}%` }}
                  />
                )}
              </div>
              {/* Shimmer de "alimentação" contínuo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-[bar-shimmer_3s_ease-in-out_infinite] pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* 3 cards de temperatura — compactos, acionáveis */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Quentes', emoji: '🔥', value: hotCount, pct: hotPct, icon: Flame,
            color: 'text-hot', borderColor: 'border-hot/20', bgAccent: 'bg-hot/[0.06]',
            hint: hotCount > 0 ? 'Prontos para contato direto' : 'Nenhum lead quente ainda',
            action: () => navigate('/leads?temperatura=Quente'),
          },
          {
            label: 'Mornos', emoji: '🟡', value: warmCount, pct: warmPct, icon: TrendingUp,
            color: 'text-warm', borderColor: 'border-warm/20', bgAccent: 'bg-warm/[0.04]',
            hint: warmCount > 0 ? 'Qualificar para avançar no funil' : 'Nenhum lead morno',
            action: () => navigate('/leads?temperatura=Morno'),
          },
          {
            label: 'Frios', emoji: '❄️', value: coldCount, pct: coldPct, icon: Snowflake,
            color: 'text-success', borderColor: 'border-success/20', bgAccent: 'bg-success/[0.04]',
            hint: coldCount > 0 ? 'Iniciar cadência de aquecimento' : 'Nenhum lead frio',
            action: () => navigate('/leads?temperatura=Frio'),
          },
        ].map((card, i) => (
          <button
            key={card.label}
            onClick={card.action}
            className={`relative overflow-hidden rounded-xl ${card.bgAccent} border ${card.borderColor} p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 cursor-pointer group`}
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(8px)',
              transition: `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 80 + 400}ms`,
            }}
          >
            {/* Número + label */}
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[10px] uppercase tracking-[0.1em] font-semibold ${card.color}`}>{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color} opacity-40 group-hover:opacity-70 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-2">
              <CountUpValue end={card.value} className={`text-3xl font-bold font-mono tracking-tight ${card.color}`} isInView={isInView} />
              {card.pct > 0 && <span className={`text-[11px] font-mono ${card.color} opacity-50`}>{card.pct}%</span>}
            </div>

            {/* Micro-barra de proporção dentro do card */}
            <div className="w-full h-1 rounded-full bg-white/[0.04] mt-2.5 mb-2 overflow-hidden">
              <div className={`h-full rounded-full ${card.label === 'Quentes' ? 'bg-hot' : card.label === 'Mornos' ? 'bg-warm' : 'bg-success/60'} transition-all duration-700`} style={{ width: `${card.pct}%` }} />
            </div>

            {/* Hint narrativo */}
            <p className="text-[10px] text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">{card.hint}</p>
          </button>
        ))}
      </div>
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
      default: return { text: 'Analisar e qualificar', type: 'view' as const }
    }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <CardTitle>Próximas ações</CardTitle>
        <span className="text-[11px] text-text-muted font-mono">{sorted.length} requerem ação</span>
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

function CampaignStats() {
  const navigate = useNavigate()
  const { data: campaignsData } = useZapCampaigns()
  const campaigns = campaignsData?.data || []

  if (campaigns.length === 0) return null

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0)
  const totalDelivered = campaigns.reduce((a, c) => a + c.delivered, 0)
  const totalRead = campaigns.reduce((a, c) => a + c.read, 0)
  const sending = campaigns.filter((c) => c.status === 'SENDING').length
  const avgDelivery = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0
  const avgRead = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0

  const stats = [
    { label: 'Campanhas', value: campaigns.length, icon: Smartphone, color: 'text-text-primary' },
    { label: 'Enviadas', value: totalSent, icon: Send, color: 'text-info' },
    { label: 'Entrega', value: `${avgDelivery}%`, icon: CheckCircle, color: avgDelivery >= 80 ? 'text-success' : avgDelivery >= 50 ? 'text-warning' : 'text-error' },
    { label: 'Leitura', value: `${avgRead}%`, icon: Eye, color: avgRead >= 50 ? 'text-success' : avgRead >= 25 ? 'text-warning' : 'text-text-muted' },
  ]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CardTitle>Campanhas WhatsApp</CardTitle>
          {sending > 0 && <Badge variant="warning" size="sm">{sending} ativa{sending > 1 ? 's' : ''}</Badge>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate('/campaigns')}>
          Ver campanhas
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color} opacity-60`} />
            <p className="text-lg font-bold font-mono text-text-primary">{s.value}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { label: 'Nova pesquisa', desc: 'Encontrar empresas por segmento e estado via CNPJa', icon: Search, onClick: () => navigate('/search') },
    { label: 'Importar relatório', desc: 'Importe sua lista (Excel, CSV, HTML ou PDF)', icon: FileDown, onClick: () => navigate('/search') },
    { label: 'Nova cadência', desc: 'Criar sequência WhatsApp com template aprovado', icon: Plus, onClick: () => navigate('/campaigns/new') },
    { label: 'Ver pipeline', desc: 'Funil visual — arraste leads entre etapas', icon: Target, onClick: () => navigate('/pipeline') },
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
            { label: 'Pesquisas realizadas', value: '0', sub: 'Faça sua primeira' },
            { label: 'Campanhas WhatsApp', value: '0', sub: 'Crie após importar' },
            { label: 'Taxa de conversão', value: '—', sub: 'Aparece após seu primeiro fechamento' },
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

      <AnimateIn delay={150}>
        <CampaignStats />
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
