import { useParams, useNavigate } from 'react-router-dom'
import { useLead } from '../hooks/useLeads'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { CopyButton } from '../components/ui/CopyButton'
import { ArrowLeft, MapPin, MessageCircle, Phone, UserPlus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useContacts } from '../hooks/useContacts'
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
  { id: 'contatos', label: 'Contatos' },
  { id: 'spiced', label: 'SPICED' },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'projecao', label: 'Projeção' },
  { id: 'competitiva', label: 'Competitiva' },
  { id: 'argumentos', label: 'Argumentos' },
] as const

export function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: lead, isLoading } = useLead(id)
  const { data: contacts } = useContacts(id)
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

  const mainContact = contacts?.find((c) => c.contactType === 'decisor') || contacts?.[0]
  const whatsappLink = mainContact?.whatsapp ? `https://wa.me/${mainContact.whatsapp.replace(/\D/g, '')}` : null

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
            <p className="text-2xl md:text-3xl font-bold font-mono text-red leading-none">{score}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mt-1">SPICED</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Faturamento/ano', value: lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue * 12) : '-' },
            { label: 'Funcionários', value: lead.employees || '-' },
            { label: 'Anos no mercado', value: lead.yearsInMarket || '-' },
            { label: 'Trava dominante', value: lead.hypotheticalTrap?.replace(/^T\d+\s*[-–]\s*/, '') || lead.status, isHighlight: true },
          ].map((stat: any) => (
            <div key={stat.label} className={`p-3 rounded-xl border-l-[3px] ${stat.isHighlight ? 'bg-red/5 border-l-red' : 'bg-white/[0.02] border-l-red'}`}>
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${stat.isHighlight ? 'text-red text-sm' : ''}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick action: WhatsApp decisor — compact */}
        {mainContact && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-whatsapp/6 border border-whatsapp/15">
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-whatsapp/15 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-whatsapp" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{mainContact.name}</p>
                <p className="text-[11px] text-text-muted truncate">
                  {mainContact.role || (mainContact.contactType === 'decisor' ? 'Decisor' : 'Stakeholder')}
                  {mainContact.whatsapp && <span className="text-whatsapp font-mono ml-1.5">· {mainContact.whatsapp}</span>}
                </p>
              </div>
            </div>
            {whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener" className="shrink-0">
                <Button variant="whatsapp" size="sm" icon={<MessageCircle className="h-4 w-4" />}>
                  WhatsApp
                </Button>
              </a>
            ) : (
              <Button variant="secondary" size="sm" icon={<Phone className="h-4 w-4" />} onClick={() => setActiveTab('contatos')}>
                Add WhatsApp
              </Button>
            )}
          </div>
        )}
        {!mainContact && (
          <button
            onClick={() => setActiveTab('contatos')}
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-warning/6 border border-warning/15 border-dashed cursor-pointer hover:bg-warning/10 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warning">Adicionar decisor</p>
              <p className="text-[11px] text-text-muted">CEO/proprietário com WhatsApp para iniciar prospecção</p>
            </div>
          </button>
        )}

        {/* Links — formato pills clicáveis com destaque */}
        <div className="flex gap-2 flex-wrap">
          {lead.website && !lead.website.includes('instagram.com') && (
            <a href={lead.website} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2.5 py-1 border border-red/30 rounded-md transition-all hover:bg-red hover:text-white hover:border-red font-medium">
              site
            </a>
          )}
          {lead.instagram && (
            <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2.5 py-1 border border-red/30 rounded-md transition-all hover:bg-red hover:text-white hover:border-red font-medium">
              @{lead.instagram.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/[/?#].*/,'')}
            </a>
          )}
          {lead.linkedin && (
            <a href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://linkedin.com/in/${lead.linkedin}`} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2.5 py-1 border border-red/30 rounded-md transition-all hover:bg-red hover:text-white hover:border-red font-medium">
              LinkedIn
            </a>
          )}
          {lead.facebook && (
            <a href={lead.facebook} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2.5 py-1 border border-red/30 rounded-md transition-all hover:bg-red hover:text-white hover:border-red font-medium">
              Facebook
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
        {/* Tab: Resumo — Ficha técnica completa (formato referência HTML) */}
        {activeTab === 'resumo' && (
          <div className="space-y-5">
            {/* Tags/Pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.tier}</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.segment}</span>
              {lead.yearsInMarket && <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.yearsInMarket}+ anos</span>}
              {lead.employees && <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.employees} func.</span>}
              {lead.hypotheticalTrap && <span className="text-[11px] px-2.5 py-1 rounded-full bg-red/10 border border-red/20 text-red font-medium">{lead.hypotheticalTrap}</span>}
            </div>

            {/* Business summary */}
            {lead.businessSummary && (
              <p className="text-sm text-text-primary leading-relaxed">{lead.businessSummary}</p>
            )}

            {/* WTP anual — destaque */}
            {lead.monthlyRevenue && (
              <div className="p-3 rounded-xl bg-red/5 border border-red/15">
                <span className="text-xs text-text-muted">WTP anual: </span>
                <span className="font-mono text-base font-bold text-red">
                  {formatCurrencyShort(lead.monthlyRevenue * 12 * 0.10)}–{formatCurrencyShort(lead.monthlyRevenue * 12 * 0.15)}
                </span>
              </div>
            )}

            {/* Decisor contact card — dados reais do Airtable */}
            {mainContact ? (
              <div>
                <p className="text-[11px] text-text-muted mb-2 uppercase tracking-wider">
                  {mainContact.contactType === 'decisor' ? 'decisor:' : 'stakeholder:'}
                </p>
                <div className="p-4 rounded-xl bg-surface-md border border-border">
                  <p className="text-base font-bold text-text-primary uppercase tracking-wide">{mainContact.name}</p>
                  {mainContact.role && <p className="text-xs text-text-secondary mt-1">{mainContact.role}</p>}
                  <div className="mt-3 space-y-1.5">
                    {mainContact.whatsapp && (
                      <a href={`https://wa.me/${mainContact.whatsapp}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs text-whatsapp hover:underline">
                        <span>📱</span> +{mainContact.whatsapp}
                      </a>
                    )}
                    {mainContact.email && (
                      <p className="flex items-center gap-2 text-xs text-text-secondary">
                        <span>✉️</span> {mainContact.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/15">
                <p className="text-xs text-warning">Decisor não cadastrado — adicione na aba Contatos</p>
              </div>
            )}

            {/* CNPJ + Receita + Localização */}
            <div className="space-y-2 pt-2 border-t border-border">
              {lead.cnpj && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted">CNPJ:</span>
                  <span className="font-mono text-text-primary font-medium">{lead.cnpj}</span>
                  <CopyButton text={lead.cnpj} />
                </div>
              )}
              {lead.monthlyRevenue && (
                <div className="text-xs">
                  <span className="text-text-muted">Receita mensal estimada: </span>
                  <span className="font-mono text-text-primary font-bold">{formatCurrencyShort(lead.monthlyRevenue)}</span>
                </div>
              )}
              {(lead.address || lead.city) && (
                <div className="text-xs">
                  <span className="text-text-muted">Localização: </span>
                  <span className="text-text-primary">{lead.address || `${lead.city}, ${lead.state}`}</span>
                </div>
              )}
            </div>

            {/* Social links (red bordered pills) */}
            <div className="flex flex-wrap gap-2">
              {lead.website && !lead.website.includes('instagram.com') && (
                <a href={lead.website} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2 py-0.5 border border-red/30 rounded transition-all hover:bg-red hover:text-white hover:border-red">
                  site
                </a>
              )}
              {lead.instagram && (
                <a href={lead.instagram} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2 py-0.5 border border-red/30 rounded transition-all hover:bg-red hover:text-white hover:border-red">
                  @{lead.instagram.replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/[/?].*/,'')}
                </a>
              )}
              {lead.linkedin && (
                <a href={lead.linkedin} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2 py-0.5 border border-red/30 rounded transition-all hover:bg-red hover:text-white hover:border-red">
                  LinkedIn
                </a>
              )}
              {lead.facebook && (
                <a href={lead.facebook} target="_blank" rel="noopener" className="text-[11px] text-red-vivid px-2 py-0.5 border border-red/30 rounded transition-all hover:bg-red hover:text-white hover:border-red">
                  Facebook
                </a>
              )}
            </div>

            {/* Market context */}
            {lead.marketContext && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-base font-bold font-heading mb-3">Contexto de mercado</h4>
                <p className="text-[13px] text-text-secondary leading-[1.8]">{lead.marketContext}</p>
              </div>
            )}

            {/* Product portfolio */}
            {lead.productPortfolio && (
              <div>
                <h4 className="text-base font-bold font-heading mb-3">Portfólio de produtos</h4>
                <p className="text-[13px] text-text-secondary leading-[1.8]">{lead.productPortfolio}</p>
              </div>
            )}

            {/* Tech stack */}
            {lead.techStack && (
              <div>
                <h4 className="text-base font-bold font-heading mb-3">Tecnologias observadas</h4>
                <p className="text-[13px] text-text-secondary">{lead.techStack}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: SPICED — Design system replicado do HTML de referência */}
        {activeTab === 'spiced' && (
          <div>
            {/* Header: Análise SPICED */}
            <h2 className="text-xl font-bold font-heading mb-6">Análise SPICED</h2>

            {/* Score ponderado final */}
            <div className="flex items-center gap-3 md:gap-4 pb-6 mb-8 border-b-2 border-red/20 flex-wrap">
              <span className="text-sm text-text-secondary">Score ponderado final:</span>
              <span className="text-2xl md:text-3xl font-extrabold font-mono text-red px-4 py-1.5 bg-red/10 rounded-lg shadow-[0_0_16px_rgba(204,0,0,0.2)] animate-[scale-in_0.4s_ease-out]">
                {score}/5
              </span>
              <span className="text-base text-text-muted">—</span>
              <Badge variant={tempVariant} pulse={lead.temperature === 'HOT'} className="text-xs px-3 py-1">
                {lead.temperature === 'HOT' ? '🔥' : lead.temperature === 'WARM' ? '🟡' : '⚪'} {lead.temperature}
              </Badge>
            </div>

            {/* Dimensões */}
            <div className="space-y-8">
              {[
                { key: 'S', label: 'Situação', value: lead.spicedS, weight: '25%', noteKey: 'S', delay: '0.1s' },
                { key: 'P', label: 'Dor', value: lead.spicedP, weight: '25%', noteKey: 'P', delay: '0.15s' },
                { key: 'I', label: 'Impacto', value: lead.spicedI, weight: '20%', noteKey: 'I', delay: '0.2s' },
                { key: 'CE', label: 'Evento crítico', value: lead.spicedC, weight: '15%', noteKey: 'C', delay: '0.25s' },
                { key: 'D', label: 'Decisão', value: lead.spicedD, weight: '15%', noteKey: 'D', delay: '0.3s' },
              ].map((dim) => (
                <div
                  key={dim.key}
                  className="animate-[slide-up_0.6s_ease-out_both]"
                  style={{ animationDelay: dim.delay }}
                >
                  {/* Dimension header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold font-heading text-text-primary">
                        {dim.key} — {dim.label}
                      </h3>
                      <p className="text-xs text-text-muted">Peso {dim.weight}</p>
                    </div>
                    <span className="bg-red text-white px-3 py-1 rounded-md font-extrabold font-mono text-sm shadow-[0_0_12px_rgba(204,0,0,0.3)] animate-[scale-in_0.4s_ease-out_both]" style={{ animationDelay: dim.delay }}>
                      {dim.value || 0}/5
                    </span>
                  </div>

                  {/* Progress bar — 24px height like reference */}
                  <div className="relative h-6 bg-surface-md rounded-md overflow-hidden mb-3 group">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-red-vivid to-red transition-all duration-700"
                      style={{
                        width: `${((dim.value || 0) / 5) * 100}%`,
                        animation: `bar-grow 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${dim.delay} both`,
                      }}
                    />
                    {/* Hover tooltip */}
                    <span className="absolute -top-8 right-0 bg-surface-md px-2.5 py-1 rounded text-[11px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Peso: {dim.weight}
                    </span>
                  </div>

                  {/* Justification text */}
                  {spicedNotes[dim.noteKey] && (
                    <p className="text-[15px] text-text-secondary leading-[1.8]">
                      {spicedNotes[dim.noteKey]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Trava dominante hipotética */}
            {lead.hypotheticalTrap && (
              <div className="mt-10 p-6 rounded-xl border border-red/30 bg-red/5">
                <h3 className="text-lg font-bold text-red mb-3">Trava dominante hipotética</h3>
                <p className="text-base font-bold text-text-primary mb-2">{lead.hypotheticalTrap}</p>
                {spicedNotes['trap'] && (
                  <p className="text-[15px] text-text-secondary leading-[1.8]">{spicedNotes['trap']}</p>
                )}
              </div>
            )}

            {/* Eligibility checklist */}
            {eligibility.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base font-bold font-heading mb-4">Checklist de elegibilidade DR-X</h3>
                <div className="space-y-2">
                  {eligibility.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                      <span className={cn('text-lg', item.value ? 'text-success' : 'text-error')}>{item.value ? '✅' : '❌'}</span>
                      <span className="text-sm text-text-secondary">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovery questions */}
            {discoveryQuestions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base font-bold font-heading mb-4">Perguntas de discovery</h3>
                <div className="space-y-3">
                  {discoveryQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border-l-[3px] border-l-red/40">
                      <span className="text-sm font-mono font-bold text-red shrink-0">{i + 1}.</span>
                      <p className="text-[15px] text-text-secondary leading-[1.8] flex-1">{q}</p>
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
