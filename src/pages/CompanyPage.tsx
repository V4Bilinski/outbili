import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../hooks/useLeads'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { ArrowLeft, Globe, MapPin, ExternalLink } from 'lucide-react'
import { formatCurrencyShort, calculateSpicedScore } from '../lib/utils'
import { useState } from 'react'
import { cn } from '../lib/cn'

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'spiced', label: 'SPICED' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'projecao', label: 'Projeção' },
  { id: 'vulnerabilidades', label: 'Vulnerab.' },
  { id: 'competitiva', label: 'Compet.' },
  { id: 'argumentos', label: 'Argum.' },
  { id: 'contatos', label: 'Contatos' },
] as const

export function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: lead, isLoading } = useLead(id)
  const [activeTab, setActiveTab] = useState('resumo')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!lead) {
    return <p className="text-text-secondary">Lead não encontrada.</p>
  }

  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'

  return (
    <div className="space-y-4 animate-[fade-in_0.3s_ease-out]">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary cursor-pointer">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Header */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'}>
                {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
              </Badge>
              <Badge variant="outline">{lead.tier}</Badge>
              <Badge variant="outline">{lead.segment}</Badge>
            </div>
            <h1 className="text-2xl font-bold font-heading">{lead.companyName}</h1>
            {lead.tradeName && <p className="text-sm text-text-secondary">{lead.tradeName}</p>}
            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
              {lead.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city}, {lead.state}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono text-red">{score}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">SPICED</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-surface-md border-l-3 border-l-red">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Faturamento/ano</p>
            <p className="text-lg font-bold font-mono">{lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue * 12) : '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-md border-l-3 border-l-red">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Funcionários</p>
            <p className="text-lg font-bold font-mono">{lead.employees || '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-md border-l-3 border-l-red">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Anos no mercado</p>
            <p className="text-lg font-bold font-mono">{lead.yearsInMarket || '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-md border-l-3 border-l-red">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Status</p>
            <p className="text-lg font-bold font-mono">{lead.status}</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2">
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener" className="p-2 rounded-lg bg-surface-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
              <Globe className="h-4 w-4" />
            </a>
          )}
          {lead.instagram && (
            <a href={lead.instagram} target="_blank" rel="noopener" className="flex items-center gap-1 p-2 rounded-lg bg-surface-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs">
              <ExternalLink className="h-3 w-3" /> IG
            </a>
          )}
          {lead.linkedin && (
            <a href={lead.linkedin} target="_blank" rel="noopener" className="flex items-center gap-1 p-2 rounded-lg bg-surface-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs">
              <ExternalLink className="h-3 w-3" /> IN
            </a>
          )}
          {lead.facebook && (
            <a href={lead.facebook} target="_blank" rel="noopener" className="flex items-center gap-1 p-2 rounded-lg bg-surface-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors text-xs">
              <ExternalLink className="h-3 w-3" /> FB
            </a>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 min-w-max bg-surface rounded-lg p-1 border border-stone-800/50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                activeTab === tab.id
                  ? 'bg-red text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Card className="min-h-[300px]">
        {activeTab === 'resumo' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold font-heading">Snapshot executivo</h3>
            {lead.businessSummary && <p className="text-sm text-text-secondary">{lead.businessSummary}</p>}
            {lead.hypotheticalTrap && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-xs font-semibold text-error mb-1">Trava dominante</p>
                <p className="text-sm text-text-primary">{lead.hypotheticalTrap}</p>
              </div>
            )}
            {lead.productPortfolio && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Portfólio</p>
                <p className="text-sm text-text-secondary">{lead.productPortfolio}</p>
              </div>
            )}
            {lead.marketContext && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Contexto de mercado</p>
                <p className="text-sm text-text-secondary">{lead.marketContext}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'spiced' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-4xl font-bold font-mono text-red">{score}/5</p>
              <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'} className="mt-2">
                {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
              </Badge>
            </div>
            {[
              { key: 'S', label: 'Situação', value: lead.spicedS, weight: '25%' },
              { key: 'P', label: 'Dor (Pain)', value: lead.spicedP, weight: '25%' },
              { key: 'I', label: 'Impacto', value: lead.spicedI, weight: '20%' },
              { key: 'CE', label: 'Evento Crítico', value: lead.spicedC, weight: '15%' },
              { key: 'D', label: 'Decisão', value: lead.spicedD, weight: '15%' },
            ].map((dim) => (
              <div key={dim.key} className="p-3 rounded-lg bg-surface-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{dim.key} — {dim.label}</span>
                  <span className="text-xs text-text-muted">{dim.weight}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-surface-lt overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red transition-all"
                      style={{ width: `${((dim.value || 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold w-6 text-right">{dim.value || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab !== 'resumo' && activeTab !== 'spiced' && (
          <div className="flex items-center justify-center h-64 text-text-muted text-sm">
            Conteúdo da tab "{activeTab}" — implementação Dia 2
          </div>
        )}
      </Card>
    </div>
  )
}
