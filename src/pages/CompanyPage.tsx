import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../hooks/useLeads'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { CopyButton } from '../components/ui/CopyButton'
import { ArrowLeft, Globe, MapPin, ExternalLink } from 'lucide-react'
import { formatCurrencyShort, calculateSpicedScore, parseJsonField } from '../lib/utils'
import { useState } from 'react'
import { cn } from '../lib/cn'
import { TabReuniao } from '../components/company/TabReuniao'
import { TabProjecao } from '../components/company/TabProjecao'
import { TabVulnerabilidades } from '../components/company/TabVulnerabilidades'
import { TabCompetitiva } from '../components/company/TabCompetitiva'
import { TabArgumentos } from '../components/company/TabArgumentos'
import { TabContatos } from '../components/company/TabContatos'

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'spiced', label: 'SPICED' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'projecao', label: 'Projeção' },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades' },
  { id: 'competitiva', label: 'Competitiva' },
  { id: 'argumentos', label: 'Argumentos' },
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
        <Skeleton className="h-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (!lead) {
    return <p className="text-text-secondary">Lead não encontrada.</p>
  }

  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const tempVariant = lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'

  const discoveryQuestions = parseJsonField<string[]>(lead.discoveryQuestions, [])
  const eligibility = parseJsonField<{ label: string; value: boolean }[]>(lead.eligibilityChecklist, [])
  const spicedNotes = parseJsonField<Record<string, string>>(lead.spicedNotes, {})

  return (
    <div className="space-y-4 animate-[fade-in_0.4s_ease-out]">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Header */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'}>
                {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
              </Badge>
              <Badge variant="outline">{lead.tier}</Badge>
              <Badge variant="outline">{lead.segment}</Badge>
            </div>
            <h1 className="text-2xl font-bold font-heading truncate">{lead.companyName}</h1>
            {lead.tradeName && <p className="text-sm text-text-secondary">{lead.tradeName}</p>}
            {lead.city && (
              <p className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3" />{lead.city}{lead.state ? `, ${lead.state}` : ''}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold font-mono text-red">{score}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">SPICED</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Faturamento/ano', value: lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue * 12) : '-' },
            { label: 'Funcionários', value: lead.employees || '-' },
            { label: 'Anos no mercado', value: lead.yearsInMarket || '-' },
            { label: 'Status', value: lead.status },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-white/[0.02] border-l-[3px] border-l-red">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className="text-lg font-bold font-mono mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-2 flex-wrap">
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary text-xs transition-colors">
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
          {lead.instagram && (
            <a href={lead.instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary text-xs transition-colors">
              <ExternalLink className="h-3 w-3" /> Instagram
            </a>
          )}
          {lead.linkedin && (
            <a href={lead.linkedin} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary text-xs transition-colors">
              <ExternalLink className="h-3 w-3" /> LinkedIn
            </a>
          )}
          {lead.facebook && (
            <a href={lead.facebook} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-text-secondary text-xs transition-colors">
              <ExternalLink className="h-3 w-3" /> Facebook
            </a>
          )}
        </div>
      </Card>

      {/* Tabs navigation */}
      <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
        <div className="flex gap-0.5 min-w-max border-b border-border pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-all duration-300 whitespace-nowrap cursor-pointer',
                'hover:text-text-primary',
                activeTab === tab.id
                  ? 'text-red'
                  : 'text-text-muted hover:bg-white/[0.02]',
              )}
            >
              {tab.label}
              {/* Active indicator — animated underline */}
              <span
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-300',
                  activeTab === tab.id
                    ? 'bg-red scale-x-100 opacity-100'
                    : 'bg-transparent scale-x-0 opacity-0',
                )}
              />
              {/* Hover glow */}
              <span
                className={cn(
                  'absolute inset-0 rounded-lg transition-all duration-200',
                  activeTab !== tab.id && 'group-hover:bg-white/[0.02]',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <Card className="min-h-[300px]" key={activeTab}>
        <div className="animate-[fade-in_0.3s_ease-out]">
        {/* Tab: Resumo */}
        {activeTab === 'resumo' && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold font-heading uppercase tracking-wider text-text-muted">Snapshot executivo</h3>
            {lead.businessSummary && (
              <p className="text-sm text-text-secondary leading-relaxed">{lead.businessSummary}</p>
            )}
            {lead.hypotheticalTrap && (
              <div className="p-4 rounded-xl bg-error/8 border border-error/20">
                <p className="text-[11px] font-semibold text-error uppercase tracking-wider mb-1">Trava dominante</p>
                <p className="text-sm text-text-primary font-medium">{lead.hypotheticalTrap}</p>
              </div>
            )}
            {lead.productPortfolio && (
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Portfólio de produtos/serviços</p>
                <p className="text-sm text-text-secondary leading-relaxed">{lead.productPortfolio}</p>
              </div>
            )}
            {lead.marketContext && (
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Contexto de mercado</p>
                <p className="text-sm text-text-secondary leading-relaxed">{lead.marketContext}</p>
              </div>
            )}
            {lead.techStack && (
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">Tecnologias observadas</p>
                <p className="text-sm text-text-secondary">{lead.techStack}</p>
              </div>
            )}
            {lead.cnpj && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>CNPJ: <span className="font-mono text-text-secondary">{lead.cnpj}</span></span>
                <CopyButton text={lead.cnpj} />
              </div>
            )}
          </div>
        )}

        {/* Tab: SPICED */}
        {activeTab === 'spiced' && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <p className="text-4xl font-bold font-mono text-red">{score}/5</p>
              <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'} className="mt-2">
                {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
              </Badge>
            </div>

            {[
              { key: 'S', label: 'Situação', value: lead.spicedS, weight: '25%', noteKey: 'S' },
              { key: 'P', label: 'Dor (Pain)', value: lead.spicedP, weight: '25%', noteKey: 'P' },
              { key: 'I', label: 'Impacto', value: lead.spicedI, weight: '20%', noteKey: 'I' },
              { key: 'CE', label: 'Evento Crítico', value: lead.spicedC, weight: '15%', noteKey: 'C' },
              { key: 'D', label: 'Decisão', value: lead.spicedD, weight: '15%', noteKey: 'D' },
            ].map((dim) => (
              <div key={dim.key} className="p-4 rounded-xl bg-white/[0.02] border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{dim.key} — {dim.label}</span>
                  <span className="text-xs text-text-muted font-mono">{dim.weight}</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-500"
                      style={{ width: `${((dim.value || 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-bold w-8 text-right">{dim.value || 0}/5</span>
                </div>
                {spicedNotes[dim.noteKey] && (
                  <p className="text-xs text-text-muted leading-relaxed mt-1">{spicedNotes[dim.noteKey]}</p>
                )}
              </div>
            ))}

            {/* Eligibility checklist */}
            {eligibility.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Checklist de elegibilidade</p>
                <div className="space-y-1.5">
                  {eligibility.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={item.value ? 'text-success' : 'text-error'}>{item.value ? '✅' : '❌'}</span>
                      <span className="text-text-secondary">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovery questions */}
            {discoveryQuestions.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Perguntas de discovery</p>
                <div className="space-y-2">
                  {discoveryQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs font-mono text-red shrink-0">{i + 1}.</span>
                      <p className="text-sm text-text-secondary flex-1">{q}</p>
                      <CopyButton text={q} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Reunião */}
        {activeTab === 'reuniao' && <TabReuniao lead={lead} />}

        {/* Tab: Projeção */}
        {activeTab === 'projecao' && <TabProjecao lead={lead} />}

        {/* Tab: Vulnerabilidades */}
        {activeTab === 'vulnerabilidades' && <TabVulnerabilidades lead={lead} />}

        {/* Tab: Competitiva */}
        {activeTab === 'competitiva' && <TabCompetitiva lead={lead} />}

        {/* Tab: Argumentos */}
        {activeTab === 'argumentos' && <TabArgumentos lead={lead} />}

        {/* Tab: Contatos */}
        {activeTab === 'contatos' && <TabContatos lead={lead} />}
        </div>
      </Card>
    </div>
  )
}
