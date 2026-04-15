import { useLeads } from '../hooks/useLeads'
import { useZapCampaigns } from '../hooks/useBilinskiZap'
import { Card, CardTitle } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'
import { SEGMENTS } from '../lib/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { TrendingUp, Target, Zap, AlertTriangle, Trophy, Activity, Download } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'
import { useState } from 'react'

const chartTooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 15, 18, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    color: '#F4F4F5',
    fontSize: 12,
    padding: '8px 12px',
  },
}

const PERIOD_OPTIONS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Tudo', days: 0 },
]

function exportLeadsCsv(leads: any[]) {
  const headers = ['Empresa', 'CNPJ', 'Segmento', 'Temperatura', 'Status', 'Score', 'Cidade', 'UF', 'Tier']
  const rows = leads.map(l => [
    l.companyName || '', l.cnpj || '', l.segment || '', l.temperature || '',
    l.status || '', l.score || 0, l.city || '', l.state || '', l.tier || '',
  ])
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `outbili-leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads()
  const { data: campaignsData, isLoading: campaignsLoading } = useZapCampaigns()
  const [periodDays, setPeriodDays] = useState(0)

  if (leadsLoading || campaignsLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12" />
        <div className="grid md:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      </div>
    )
  }

  const cutoff = periodDays > 0 ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString() : ''
  const allLeads = (leads || []).filter(l => !cutoff || (l.createdAt && l.createdAt >= cutoff))
  const campaigns = campaignsData?.data || []

  // --- KPIs ---
  const totalLeads = allLeads.length
  const hotLeads = allLeads.filter((l) => l.temperature === 'Quente').length
  const warmLeads = allLeads.filter((l) => l.temperature === 'Morno').length
  const contactados = allLeads.filter((l) => ['Contactado', 'Respondeu', 'Reunião', 'Proposta', 'Fechado'].includes(l.status)).length
  const responderam = allLeads.filter((l) => ['Respondeu', 'Reunião', 'Proposta', 'Fechado'].includes(l.status)).length
  const reunioes = allLeads.filter((l) => ['Reunião', 'Proposta', 'Fechado'].includes(l.status)).length
  const propostas = allLeads.filter((l) => ['Proposta', 'Fechado'].includes(l.status)).length
  const fechados = allLeads.filter((l) => l.status === 'Fechado').length
  const perdidos = allLeads.filter((l) => l.status === 'Perdido').length

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0)
  const totalDelivered = campaigns.reduce((a, c) => a + c.delivered, 0)
  const totalRead = campaigns.reduce((a, c) => a + c.read, 0)
  const totalFailed = campaigns.reduce((a, c) => a + c.failed, 0)

  // ROI estimado (custo por categoria)
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED')
  const estimatedCost = completedCampaigns.reduce((a, c) => a + (c.sent * 0.15), 0) // Media ponderada Utility/Marketing
  const costPerDelivery = totalDelivered > 0 ? (estimatedCost / totalDelivered) : 0
  const costPerRead = totalRead > 0 ? (estimatedCost / totalRead) : 0

  // --- Conversion rates ---
  const contactRate = totalLeads > 0 ? Math.round((contactados / totalLeads) * 100) : 0
  const responseRate = contactados > 0 ? Math.round((responderam / contactados) * 100) : 0
  const closeRate = reunioes > 0 ? Math.round((fechados / reunioes) * 100) : 0

  // --- Funnel data ---
  const funnelData = [
    { name: 'Pesquisados', value: totalLeads, color: '#71717A' },
    { name: 'Quente + Morno', value: hotLeads + warmLeads, color: '#FF9F0A' },
    { name: 'Contactados', value: contactados, color: '#F59E0B' },
    { name: 'Responderam', value: responderam, color: '#22C55E' },
    { name: 'Reuniões', value: reunioes, color: '#E63329' },
    { name: 'Propostas', value: propostas, color: '#FF3B30' },
    { name: 'Fechados', value: fechados, color: '#22C55E' },
  ]

  // --- Segment analysis ---
  const segmentData = SEGMENTS.map((seg) => {
    const segLeads = allLeads.filter((l) => l.segment === seg.name)
    const segHot = segLeads.filter((l) => l.temperature === 'Quente').length
    const segClosed = segLeads.filter((l) => l.status === 'Fechado').length
    return {
      name: seg.name,
      total: segLeads.length,
      hot: segHot,
      fechados: segClosed,
      conversionRate: segLeads.length > 0 ? Math.round((segClosed / segLeads.length) * 100) : 0,
    }
  }).filter((s) => s.total > 0).sort((a, b) => b.conversionRate - a.conversionRate)

  // --- Temperature distribution ---
  const tempData = [
    { name: 'Quente', value: hotLeads, color: '#FF3B30' },
    { name: 'Morno', value: warmLeads, color: '#FF9F0A' },
    { name: 'Frio', value: allLeads.filter((l) => l.temperature === 'Frio').length, color: '#71717A' },
  ].filter((d) => d.value > 0)

  // --- Predictive metrics ---
  const avgScoreHot = hotLeads > 0 ? (allLeads.filter((l) => l.temperature === 'Quente').reduce((a, l) => a + (l.score || 0), 0) / hotLeads).toFixed(1) : '0'
  const pipelineValue = allLeads
    .filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido')
    .reduce((a, l) => a + (l.monthlyRevenue || 0) * 0.12, 0) // 12% LTP estimate
  const projectedMonthlyClose = reunioes > 0 ? Math.round(reunioes * (closeRate / 100)) : 0

  return (
    <div className="space-y-6">
      <AnimateIn>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Relatórios de performance</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Performance completa da sua operação outbound
            {periodDays > 0 ? ` · Últimos ${periodDays} dias` : ' · Todos os dados'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-border">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.days}
                onClick={() => setPeriodDays(opt.days)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-label font-medium transition-all cursor-pointer',
                  periodDays === opt.days ? 'bg-red text-white' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportLeadsCsv(allLeads)}>
            CSV
          </Button>
        </div>
      </div>
      </AnimateIn>

      <SectionDivider />

      {/* Strategic KPIs */}
      <AnimateIn delay={80}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total no pipeline', value: totalLeads, sub: `${hotLeads} Quentes · ${warmLeads} Mornos`, icon: Target, color: 'text-text-primary', accent: 'from-white/5 to-transparent' },
          { label: 'Taxa de contato', value: `${contactRate}%`, sub: contactRate >= 50 ? `${contactados} contactados — bom ritmo` : `${contactados} de ${totalLeads} leads — aumentar cadências`, icon: Zap, color: 'text-warning', accent: 'from-warning/8 to-transparent' },
          { label: 'Taxa de resposta', value: `${responseRate}%`, sub: responseRate >= 30 ? `${responderam} responderam — acima do benchmark` : `${responderam} responderam — benchmark é 30%`, icon: Activity, color: 'text-success', accent: 'from-success/8 to-transparent' },
          { label: 'Conversão final', value: `${closeRate}%`, sub: `${fechados} fechados · ${perdidos} perdidos`, icon: Trophy, color: 'text-red', accent: 'from-red/8 to-transparent' },
        ].map((kpi) => (
          <div key={kpi.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.accent} backdrop-blur-xl border border-border p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-label uppercase tracking-[0.12em] text-text-muted font-medium">{kpi.label}</p>
                <p className={`text-3xl font-bold font-mono mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                <p className="text-label text-text-muted mt-0.5">{kpi.sub}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.04]">
                <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-60`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      </AnimateIn>

      <SectionDivider />

      {/* Conversion Funnel + WhatsApp Metrics */}
      <AnimateIn delay={120}>
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardTitle className="mb-4">Funil de conversão</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle className="mb-4">Performance WhatsApp</CardTitle>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-text-primary">{totalSent}</p>
              <p className="text-caption text-text-muted uppercase">Enviados</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-success">{totalDelivered}</p>
              <p className="text-caption text-text-muted uppercase">Entregues</p>
              {totalSent > 0 && <p className="text-label font-mono text-success">{Math.round((totalDelivered / totalSent) * 100)}%</p>}
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-info">{totalRead}</p>
              <p className="text-caption text-text-muted uppercase">Lidos</p>
              {totalDelivered > 0 && <p className="text-label font-mono text-info">{Math.round((totalRead / totalDelivered) * 100)}%</p>}
            </div>
          </div>
          {/* ROI estimado */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-warning">R$ {estimatedCost.toFixed(0)}</p>
              <p className="text-caption text-text-muted uppercase">Custo estimado</p>
              <p className="text-micro text-text-muted mt-0.5">R$ 0,15/msg média</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-text-primary">R$ {costPerDelivery.toFixed(2)}</p>
              <p className="text-caption text-text-muted uppercase">Custo/entrega</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-2xl font-bold font-mono text-text-primary">R$ {costPerRead.toFixed(2)}</p>
              <p className="text-caption text-text-muted uppercase">Custo/leitura</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
            <p className="text-label text-text-muted mb-1">Campanhas</p>
            <p className="text-sm text-text-secondary">
              {campaigns.length} campanhas · {completedCampaigns.length} concluídas · {campaigns.filter((c) => c.status === 'SENDING').length} em envio · {totalFailed} falhas
            </p>
          </div>
        </Card>
      </div>
      </AnimateIn>

      <SectionDivider />

      {/* Segment Analysis + Temperature Distribution */}
      <AnimateIn delay={160}>
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardTitle className="mb-4">Performance por segmento</CardTitle>
          {segmentData.length > 0 ? (
            <div className="space-y-3">
              {segmentData.map((seg) => (
                <div key={seg.name} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-24 text-right truncate">{seg.name}</span>
                  <div className="flex-1 h-5 rounded-lg bg-white/5 overflow-hidden relative">
                    <div className="h-full rounded-lg bg-red/60" style={{ width: `${(seg.total / Math.max(...segmentData.map((s) => s.total), 1)) * 100}%` }} />
                    <span className="absolute inset-0 flex items-center px-2 text-caption font-mono text-white">
                      {seg.total} leads · {seg.hot} Quentes · {seg.conversionRate}% conv.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-8">Sem dados por segmento</p>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Distribuição por temperatura</CardTitle>
          {tempData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tempData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" strokeWidth={0}>
                    {tempData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <Legend formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-8">Sem dados</p>
          )}
        </Card>
      </div>

      {/* Predictive / Strategic insights */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-red" />
          <CardTitle>Indicadores preditivos e estratégicos</CardTitle>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
            <p className="text-caption uppercase tracking-wider text-text-muted mb-1">Valor do pipeline ativo</p>
            <p className="text-xl font-bold font-mono text-success">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(pipelineValue)}
              <span className="text-xs text-text-muted font-normal">/mês</span>
            </p>
            <p className="text-caption text-text-muted mt-1">Baseado em 12% do faturamento dos leads ativos (benchmark V4)</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
            <p className="text-caption uppercase tracking-wider text-text-muted mb-1">Projeção de fechamento</p>
            <p className="text-xl font-bold font-mono text-red">
              {projectedMonthlyClose}
              <span className="text-xs text-text-muted font-normal"> leads/mês</span>
            </p>
            <p className="text-caption text-text-muted mt-1">Projeção baseada na sua taxa atual: {closeRate}% das reuniões convertem</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
            <p className="text-caption uppercase tracking-wider text-text-muted mb-1">Score médio leads Quentes</p>
            <p className="text-xl font-bold font-mono text-hot">{avgScoreHot}/5</p>
            <p className="text-caption text-text-muted mt-1">{hotLeads} leads Quentes ativos no pipeline</p>
          </div>
        </div>

        {/* Strategic recommendations */}
        <div className="mt-4 p-4 rounded-xl bg-red/5 border border-red/15">
          <p className="text-xs font-semibold text-red uppercase tracking-wider mb-2">Recomendações estratégicas</p>
          <ul className="space-y-1.5 text-xs text-text-secondary">
            {hotLeads > 0 && contactRate < 50 && (
              <li className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> {hotLeads} leads Quentes sem contato — criar cadência WhatsApp hoje (maior probabilidade de conversão)</li>
            )}
            {responseRate < 30 && contactados > 5 && (
              <li className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" /> Taxa de resposta em {responseRate}%, abaixo do benchmark (30%) — revisar scripts e personalização das mensagens</li>
            )}
            {segmentData.length > 0 && (
              <li className="flex items-start gap-2"><TrendingUp className="h-3 w-3 text-success mt-0.5 shrink-0" /> Segmento com melhor conversão: <strong>{segmentData[0]?.name}</strong> ({segmentData[0]?.conversionRate}%) — aumentar volume de pesquisa</li>
            )}
            {perdidos > 0 && (
              <li className="flex items-start gap-2"><Activity className="h-3 w-3 text-info mt-0.5 shrink-0" /> {perdidos} leads perdidos — analisar motivos e criar cadência de reengajamento após 60 dias</li>
            )}
            <li className="flex items-start gap-2"><Target className="h-3 w-3 text-red mt-0.5 shrink-0" /> Meta recomendada: {Math.max(10, Math.ceil(totalLeads * 1.5))} leads pesquisados/mês para manter pipeline saudável</li>
          </ul>
        </div>
      </Card>
      </AnimateIn>
    </div>
  )
}
