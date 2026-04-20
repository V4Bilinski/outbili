import { useLeads } from '../hooks/useLeads'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Flame, Search, FileDown, Eye, TrendingUp, ArrowUpRight, Sparkles, Target, BarChart3, Smartphone, ArrowRight, Zap, Send, Snowflake, Database, Filter, Brain, Info } from 'lucide-react'
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatCurrencyShort } from '../lib/utils'
import { calculatePipelineLTP, type StationKey } from '../lib/ltpCalculator'
import type { Lead } from '../types'
import { ImportModal } from '../components/ImportModal'
import { useState, useCallback } from 'react'
import { useMassEnrichment } from '../hooks/useMassEnrichment'
import { useCountUp } from '../hooks/useCountUp'
import { useInView } from '../hooks/useInView'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'

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
              <p className="text-label text-text-muted mt-0.5">
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
                  <span className="text-caption text-text-muted">{t.label}</span>
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
              <p className="text-caption text-text-muted uppercase tracking-[0.08em] font-medium">Distribuição de temperatura</p>
              <div className="flex items-center gap-3">
                {hotPct > 0 && <span className="flex items-center gap-1.5 text-caption text-hot font-medium"><span className="w-2 h-2 rounded-full bg-hot" />{hotPct}% Quentes</span>}
                {warmPct > 0 && <span className="flex items-center gap-1.5 text-caption text-warm font-medium"><span className="w-2 h-2 rounded-full bg-warm" />{warmPct}% Mornos</span>}
                {coldPct > 0 && <span className="flex items-center gap-1.5 text-caption text-text-muted font-medium"><span className="w-2 h-2 rounded-full bg-text-muted/60" />{coldPct}% Frios</span>}
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
              <p className={`text-caption uppercase tracking-[0.1em] font-semibold ${card.color}`}>{card.label}</p>
              <card.icon className={`h-4 w-4 ${card.color} opacity-40 group-hover:opacity-70 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-2">
              <CountUpValue end={card.value} className={`text-3xl font-bold font-mono tracking-tight ${card.color}`} isInView={isInView} />
              {card.pct > 0 && <span className={`text-label font-mono ${card.color} opacity-50`}>{card.pct}%</span>}
            </div>

            {/* Micro-barra de proporção dentro do card */}
            <div className="w-full h-1 rounded-full bg-white/[0.04] mt-2.5 mb-2 overflow-hidden">
              <div className={`h-full rounded-full ${card.label === 'Quentes' ? 'bg-hot' : card.label === 'Mornos' ? 'bg-warm' : 'bg-success/60'} transition-all duration-700`} style={{ width: `${card.pct}%` }} />
            </div>

            {/* Hint narrativo */}
            <p className="text-caption text-text-muted leading-relaxed group-hover:text-text-secondary transition-colors">{card.hint}</p>
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
        <span className="text-label text-text-muted font-mono">{sorted.length} requerem ação</span>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((lead) => {
          const action = getAction(lead)
          const daysIdle = lead.createdAt ? Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
          const isStale = daysIdle >= 7

          return (
            <div
              key={lead.id}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-text-primary truncate">{lead.companyName}</p>
                    <span className={`text-micro font-medium px-1.5 py-0.5 rounded shrink-0 ${
                      lead.temperature === 'Quente' ? 'bg-hot/15 text-hot' : lead.temperature === 'Morno' ? 'bg-warm/15 text-warm' : 'bg-cold/15 text-cold'
                    }`}>
                      {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
                    </span>
                    {isStale && (
                      <span className="text-micro font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">{daysIdle}d parado</span>
                    )}
                  </div>
                  <p className="text-label text-text-muted mt-0.5">{action.text} · {lead.segment}</p>
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


// --- Trap short names mapped to T1-T8 ---
const TRAP_META: Record<string, { short: string }> = {
  '1': { short: 'Aquisição' },
  '2': { short: 'Conversão' },
  '3': { short: 'Ticket Médio' },
  '4': { short: 'Recorrência' },
  '5': { short: 'Margem' },
  '6': { short: 'Posicionamento' },
  '7': { short: 'Escalabilidade' },
  '8': { short: 'Dependência' },
}

function TrapDiagnostic({ leads }: { leads: Lead[] }) {
  const counts: Record<string, number> = {}
  for (const lead of leads) {
    if (!lead.hypotheticalTrap) continue
    const match = lead.hypotheticalTrap.match(/T(\d)/)
    if (!match) continue
    const key = match[1]
    counts[key] = (counts[key] || 0) + 1
  }

  const maxCount = Math.max(0, ...Object.values(counts))

  return (
    <Card>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-0.5 bg-red" />
          <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">DIAGNÓSTICO DE TRAVAS</span>
        </div>
        <CardTitle>Diagnóstico de Travas</CardTitle>
        <p className="text-xs text-text-muted mt-1">Distribuição dos prospects por trava detectada</p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {Array.from({ length: 8 }, (_, i) => {
          const key = String(i + 1)
          const count = counts[key] || 0
          const isBottleneck = maxCount > 0 && count === maxCount
          const meta = TRAP_META[key]
          return (
            <div
              key={key}
              className={`relative overflow-hidden flex flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
                isBottleneck
                  ? 'border-red/60 bg-red/[0.07] shadow-[0_0_20px_rgba(204,0,0,0.3)] hover:shadow-[0_0_28px_rgba(204,0,0,0.4)] hover:-translate-y-0.5'
                  : count > 0
                  ? 'border-border bg-white/[0.02] hover:border-red/40 hover:shadow-[0_0_12px_rgba(204,0,0,0.15)] hover:-translate-y-0.5'
                  : 'border-border/40 bg-transparent opacity-40'
              }`}
            >
              <div className={`w-full h-0.5 ${isBottleneck ? 'bg-red' : count > 0 ? 'bg-red/30' : 'bg-border/20'}`} />
              <div className="flex flex-col items-center justify-center p-3">
                <span className={`text-caption font-bold font-mono uppercase tracking-wider ${isBottleneck ? 'text-red' : count > 0 ? 'text-text-secondary' : 'text-text-muted'}`}>
                  T{key}
                </span>
                <span className={`text-2xl font-bold font-mono mt-1 ${isBottleneck ? 'text-red' : count > 0 ? 'text-text-primary' : 'text-text-muted/30'}`}>
                  {count}
                </span>
                <span className={`text-micro text-center mt-1 leading-tight ${isBottleneck ? 'text-red/80' : 'text-text-muted'}`}>
                  {meta?.short}
                </span>
                {isBottleneck && (
                  <span className="text-[8px] font-semibold text-red mt-1 uppercase tracking-wide">gargalo</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AssemblyLine({ pipeline }: { pipeline: ReturnType<typeof calculatePipelineLTP> }) {
  const stationDefs: Array<{ name: string; icon: typeof Search; key: StationKey; hint: string }> = [
    { name: 'Pesquisa', icon: Search, key: 'pesquisa', hint: 'Leads novos descobertos, ainda sem enriquecimento.' },
    { name: 'Enriquecimento', icon: Database, key: 'enriquecimento', hint: 'Leads em coleta de dados (CNPJá, Assertiva, Firecrawl).' },
    { name: 'Qualificação', icon: Filter, key: 'qualificacao', hint: 'Leads enriquecidos com SPICED calculado — prontos para abordagem.' },
    { name: 'Inteligência', icon: Brain, key: 'inteligencia', hint: 'Leads em contato ativo (mensagem enviada, respondeu ou reunião marcada).' },
    { name: 'Prospecção', icon: Send, key: 'prospeccao', hint: 'Leads com proposta entregue, próximos do fechamento.' },
  ]

  const stations = stationDefs.map((def) => ({
    name: def.name,
    icon: def.icon,
    hint: def.hint,
    count: pipeline.stations[def.key].count,
    ltp: pipeline.stations[def.key].ltp,
  }))

  const maxCount = Math.max(0, ...stations.map((s) => s.count))

  return (
    <Card>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-0.5 bg-red" />
          <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">LINHA DE MONTAGEM</span>
        </div>
        <CardTitle>Linha de Montagem</CardTitle>
        <p className="text-xs text-text-muted mt-1 max-w-2xl">
          Leads avançam estação por estação. Onde houver gargalo, está sua ação prioritária do dia.
        </p>
      </div>
      <div className="flex items-stretch gap-0 overflow-x-auto">
        {stations.map((station, i) => {
          const isBottleneck = maxCount > 0 && station.count === maxCount
          return (
            <div key={station.name} className="flex items-center min-w-0 flex-1">
              <div
                title={station.hint}
                className={`relative overflow-hidden flex flex-col items-center justify-center rounded-xl border flex-1 cursor-help transition-all duration-200 ${
                  isBottleneck
                    ? 'border-red/40 bg-red/[0.07] shadow-[0_0_16px_rgba(204,0,0,0.25)] hover:shadow-[0_0_20px_rgba(204,0,0,0.35)] hover:-translate-y-0.5'
                    : station.count > 0
                    ? 'border-border bg-white/[0.02] hover:border-red/40 hover:shadow-[0_0_12px_rgba(204,0,0,0.15)] hover:-translate-y-0.5'
                    : 'border-border/40 bg-transparent opacity-50'
                }`}
              >
                <div className={`w-full h-1 rounded-t-xl ${isBottleneck ? 'bg-red' : station.count > 0 ? 'bg-red/20' : 'bg-border/10'}`} />
                <div className="flex flex-col items-center justify-center p-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${isBottleneck ? 'bg-red/20' : station.count > 0 ? 'bg-red/10' : 'bg-white/[0.02]'}`}>
                    <station.icon
                      className={`h-5 w-5 ${isBottleneck ? 'text-red' : station.count > 0 ? 'text-text-secondary' : 'text-text-muted'}`}
                    />
                  </div>
                  <span className={`text-2xl font-bold font-mono ${isBottleneck ? 'text-red' : station.count > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                    {station.count}
                  </span>
                  <span className={`text-caption text-center mt-1 leading-tight ${isBottleneck ? 'text-red/80' : 'text-text-muted'}`}>
                    {station.name}
                  </span>
                  {station.ltp > 0 && (
                    <span className={`text-[10px] font-mono mt-1 tracking-tight ${isBottleneck ? 'text-red/90' : 'text-text-muted'}`}>
                      {formatCurrencyShort(station.ltp)}
                    </span>
                  )}
                  {isBottleneck && (
                    <span className="text-[8px] font-semibold text-red mt-1 uppercase tracking-wide">gargalo</span>
                  )}
                </div>
              </div>
              {i < stations.length - 1 && (
                <ArrowRight className="h-4 w-4 text-red/40 mx-1 shrink-0" />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function LTPPipeline({ pipeline }: { pipeline: ReturnType<typeof calculatePipelineLTP> }) {
  const { total, totalLeads, realRevenueCount, estimatedRevenueCount, hot, hotLeads, avgPerLead } = pipeline

  const realLabel = realRevenueCount > 0 ? `${realRevenueCount} real` : null
  const estLabel = estimatedRevenueCount > 0 ? `${estimatedRevenueCount} estimado` : null
  const totalSub = [realLabel, estLabel].filter(Boolean).join(' · ') || `${totalLeads} leads no pipeline`

  const stats = [
    {
      label: 'LTP Total Pipeline',
      value: formatCurrency(total),
      sub: totalSub,
      hint: 'Teto de receita se todos os leads fecharem em 12 meses.',
    },
    {
      label: 'LTP Leads Quentes',
      value: formatCurrency(hot),
      sub: hotLeads > 0 ? `${hotLeads} lead${hotLeads > 1 ? 's' : ''} prioridade` : 'Nenhum lead quente',
      highlight: true,
      hint: 'Grupo prioritário pronto para fechar. Comece seu dia por aqui.',
    },
    {
      label: 'LTP Médio por Lead',
      value: formatCurrency(avgPerLead),
      sub: totalLeads > 0 ? `Base: ${totalLeads} leads ativos` : 'Sem leads ativos',
      hint: 'Valor projetado por oportunidade — use para priorizar onde investir tempo.',
    },
  ]

  return (
    <Card>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-0.5 bg-red" />
            <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">LTP DO PIPELINE</span>
          </div>
          <CardTitle>LTP do Pipeline</CardTitle>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-xs text-text-muted max-w-2xl">
              Receita projetada do pipeline. Priorize os Quentes — são os leads prontos para fechar.
            </p>
            <div className="border-l-4 border-red/60 pl-2 ml-1">
              <span
                title="LTP = Lifetime Throughput: faturamento mensal × percentual de captura por tier × 12 meses."
                className="flex items-center cursor-help"
              >
                <Info className="h-3 w-3 text-text-muted/60" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            title={s.hint}
            className={`relative overflow-hidden p-4 rounded-xl border cursor-help transition-all duration-200 ${
              s.highlight
                ? 'border-red/40 bg-red/[0.07] shadow-[0_0_20px_rgba(204,0,0,0.2)] hover:shadow-[0_0_28px_rgba(204,0,0,0.35)] hover:-translate-y-0.5'
                : 'border-border bg-white/[0.02] hover:border-red/40 hover:shadow-[0_0_12px_rgba(204,0,0,0.15)] hover:-translate-y-0.5'
            }`}
          >
            {s.highlight && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(204,0,0,0.12) 0%, transparent 70%)' }} />
            )}
            <p className="text-caption uppercase tracking-[0.1em] text-text-muted font-medium mb-2">{s.label}</p>
            <p className={`text-2xl font-bold font-mono tracking-tight ${s.highlight ? 'text-red' : 'text-text-primary'}`}>
              {s.value}
            </p>
            <p className="text-label text-text-muted mt-1">{s.sub}</p>
            <p className={`text-[11px] leading-snug mt-2 pt-2 border-t ${s.highlight ? 'border-red/20 text-text-muted' : 'border-border/40 text-text-muted'}`}>
              {s.hint}
            </p>
          </div>
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
  const pipeline = calculatePipelineLTP(allLeads)

  if (allLeads.length === 0) {
    return (
      <div className="animate-[fade-in_0.4s_ease-out] space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red/10 via-surface to-surface border border-red/10 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red/5 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-red" />
              <span className="text-label uppercase tracking-[0.15em] text-red font-semibold">Sistema de prospecção outbound</span>
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
              <p className="text-caption uppercase tracking-[0.12em] text-text-muted font-medium">{stat.label}</p>
              <p className="text-2xl font-bold font-mono text-text-muted/40 mt-1">{stat.value}</p>
              <p className="text-caption text-text-muted mt-0.5">{stat.sub}</p>
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

      {/* CampaignStats, PipelineFunnel e QuickActions ocultos — funcionalidades em desenvolvimento */}

      <SectionDivider />

      {/* Fábrica de Receita */}
      <AnimateIn delay={100}>
        <TrapDiagnostic leads={allLeads} />
      </AnimateIn>

      <AnimateIn delay={150}>
        <AssemblyLine pipeline={pipeline} />
      </AnimateIn>

      <AnimateIn delay={200}>
        <LTPPipeline pipeline={pipeline} />
      </AnimateIn>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} onEnrichRequest={handleEnrichRequest} />
    </div>
  )
}
