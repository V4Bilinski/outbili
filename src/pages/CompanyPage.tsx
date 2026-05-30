import { useParams, useNavigate } from 'react-router-dom'
import { useLead, useDeleteLead } from '../hooks/useLeads'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { CopyButton } from '../components/ui/CopyButton'
import { ArrowLeft, MapPin, Phone, UserPlus, Trash2, MoreVertical, ChevronRight, Search, CheckCircle } from 'lucide-react'
import type { Lead, Contact, Activity } from '../types'
import { WhatsAppIcon } from '../components/ui/WhatsAppIcon'
import { Button } from '../components/ui/Button'
import { useContacts, useCreateContact } from '../hooks/useContacts'
import { formatCurrencyShort, calculateSpicedScore, parseJsonField } from '../lib/utils'
import { getEnrichmentLog } from '../services/enrichmentLogService'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reEnrichLead } from '../services/enrichmentService'
import { DigitalPresencePanel } from '../components/ui/DigitalPresencePanel'
import { generateDiscoveryQuestions, generateEligibilityChecklist, detectTravas } from '../services/strategicAnalysisService'
import { generateSpicedDescriptions } from '../services/enrichmentService'
import { getActivities } from '../services/activityService'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'
import { TabReuniao } from '../components/company/TabReuniao'
import { ActivityLog } from '../components/company/ActivityLog'
import { TabSocios } from '../components/company/TabSocios'
import { StakeholderPanel } from '../components/company/StakeholderPanel'
import { TabTravas } from '../components/company/TabTravas'
import { TabProjecaoCompetitiva } from '../components/company/TabProjecaoCompetitiva'
import { TabPlaybookBDR } from '../components/company/TabPlaybookBDR'
import { PipelineJourneyStepper } from '../components/pipeline/PipelineJourneyStepper'
import { parseStageChangeSource } from '../components/pipeline/stageConfig'
import { AssignLeadControl } from '../components/company/AssignLeadControl'
import { FinancialPanel } from '../components/company/FinancialPanel'

const ALL_TABS = [
  { id: 'resumo', label: 'Resumo', group: 'primary' },
  { id: 'spiced', label: 'SPICED', group: 'primary' },
  { id: 'reuniao', label: 'Reunião', group: 'primary' },
  { id: 'historico', label: 'Histórico', group: 'primary' },
  { id: 'travas', label: 'Travas', group: 'analise' },
  { id: 'projecao-competitiva', label: 'Projeção', group: 'analise' },
  { id: 'playbook-bdr', label: 'Playbook', group: 'analise' },
] as const

// --- Histórico das Fases (jornada do lead no pipeline) ---
function PhaseHistory({ lead, activities, contacts }: { lead: Lead; activities: Activity[]; contacts: Contact[] }) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const mainContact = contacts?.find((c) => c.contactType === 'decisor') || contacts?.[0]

  // Montar fases: sempre começa com "Cadastro Inicial" + status_changes
  const phases: Array<{
    id: string
    label: string
    status: 'completed' | 'current'
    description?: string
    createdBy?: string
    createdAt?: string
    notes?: string
    source?: string | null
  }> = []

  // Fase 0: Cadastro inicial
  const isManualEntry = lead.sourceHtmlReport === 'cadastro_manual'
  phases.push({
    id: 'cadastro',
    label: 'Cadastro Inicial',
    status: 'completed',
    description: isManualEntry
      ? 'Cadastro manual com enriquecimento automático (CNPJá + Assertiva). Lead criado direto em Contactado.'
      : `Lead criado via ${lead.enrichmentStatus === 'complete' ? 'pesquisa em massa' : 'importação'}`,
    createdBy: isManualEntry ? 'Cadastro Manual' : 'Sistema',
    createdAt: lead.createdAt,
  })

  // Fases de movimentação do pipeline (status_change activities)
  const statusChanges = activities.filter((a) => a.type === 'status_change')
  for (const activity of statusChanges) {
    // Remove sufixo [via: ...] antes de parsear o "para X"
    const descWithoutSource = activity.description?.replace(/\s*\[via:[^\]]+\]/, '') || ''
    const match = descWithoutSource.match(/Movido de (.+) para (.+?)(\n|$)/)
    const toStage = match ? match[2].trim() : descWithoutSource.split('\n')[0] || 'Movimentação'
    const notesMatch = descWithoutSource.split('\n\n')
    const notes = notesMatch.length > 1 ? notesMatch.slice(1).join('\n') : undefined
    const source = parseStageChangeSource(activity.description)

    phases.push({
      id: activity.id,
      label: toStage,
      status: 'completed',
      description: descWithoutSource.split('\n')[0] || '',
      createdBy: activity.createdBy || 'Usuário',
      createdAt: activity.createdAt,
      notes,
      source,
    })
  }

  // Fase atual
  if (lead.status && lead.status !== 'Novo') {
    const alreadyHasCurrentStage = phases.some(p => p.label === lead.status)
    if (!alreadyHasCurrentStage) {
      phases.push({
        id: 'current',
        label: lead.status,
        status: 'current',
      })
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="border-t border-border pt-5">
      <button
        onClick={() => setExpandedPhase(expandedPhase === 'history' ? null : 'history')}
        className="flex items-center justify-between w-full cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-elevated-1">
            <svg className="h-4 w-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span className="text-sm font-semibold text-text-primary">Histórico das Fases</span>
          <span className="text-caption text-text-muted">({phases.length})</span>
        </div>
        <ChevronRight className={cn('h-4 w-4 text-text-muted transition-transform duration-200', expandedPhase === 'history' && 'rotate-90')} />
      </button>

      {expandedPhase === 'history' && (
        <div className="mt-4 space-y-2 animate-[fade-in_0.2s_ease-out]">
          {phases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              lead={lead}
              mainContact={mainContact}
              isFirst={idx === 0}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PhaseCard({ phase, lead, mainContact, isFirst, formatDate }: {
  phase: { id: string; label: string; status: string; description?: string; createdBy?: string; createdAt?: string; notes?: string; source?: string | null }
  lead: Lead
  mainContact?: Contact
  isFirst: boolean
  formatDate: (d?: string) => string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer hover:bg-elevated-1 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn(
            'text-micro font-bold px-2 py-0.5 rounded shrink-0',
            phase.status === 'current' ? 'bg-red/10 text-red' : 'bg-success/10 text-success',
          )}>
            {isFirst ? 'Lead' : 'Pipeline'}
          </span>
          <span className="text-sm font-medium text-text-primary truncate">{phase.label}</span>
          {phase.status === 'completed' && (
            <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
          )}
          {phase.source && (
            <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded shrink-0">
              via {phase.source}
            </span>
          )}
        </div>
        <ChevronRight className={cn('h-3.5 w-3.5 text-text-muted transition-transform duration-200 shrink-0', expanded && 'rotate-90')} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-[fade-in_0.2s_ease-out]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-caption">
            <div>
              <span className="text-text-muted">Empresa: </span>
              <span className="text-text-primary">{lead.companyName}</span>
            </div>
            <div>
              <span className="text-text-muted">Stakeholder: </span>
              <span className="text-text-primary">{mainContact?.name || '-'}</span>
            </div>
            <div>
              <span className="text-text-muted">Telefone: </span>
              <span className="text-text-primary">{mainContact?.whatsapp || lead.rfPhone || '-'}</span>
            </div>
            <div>
              <span className="text-text-muted">Email: </span>
              <span className="text-text-primary">{mainContact?.email || lead.rfEmail || '-'}</span>
            </div>
            <div>
              <span className="text-text-muted">Origem: </span>
              <span className="text-text-primary">{lead.enrichmentStatus === 'complete' ? 'Pesca CNPJa' : 'Cadastro manual'}</span>
            </div>
            <div>
              <span className="text-text-muted">Segmento: </span>
              <span className="text-text-primary">{lead.segment || '-'}</span>
            </div>
            <div>
              <span className="text-text-muted">Faturamento: </span>
              <span className="text-text-primary">{lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue) + '/mês' : lead.tier || '-'}</span>
            </div>
            <div>
              <span className="text-text-muted">Score: </span>
              <span className="text-text-primary">{lead.score || '-'} · {lead.temperature}</span>
            </div>
          </div>
          {phase.notes && (
            <div className="mt-2 p-2 rounded-lg bg-elevated-1 border border-border/50">
              <p className="text-caption text-text-secondary italic">{phase.notes}</p>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-border/30">
            {phase.source && (
              <p className="text-caption text-text-muted">Origem: {phase.source}</p>
            )}
            <p className="text-caption text-text-muted">Criado em: {formatDate(phase.createdAt)}</p>
            <p className="text-caption text-text-muted">Criado por: {phase.createdBy || '-'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function CompanyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: lead, isLoading } = useLead(id)
  const { data: contacts } = useContacts(id)
  const { data: enrichmentLog } = useQuery({ queryKey: ['enrichmentLog', id], queryFn: () => getEnrichmentLog(id!), enabled: !!id })
  const { data: activities } = useQuery({ queryKey: ['activities', id], queryFn: () => getActivities(id!), enabled: !!id })
  const [activeTab, setActiveTab] = useState('resumo')
  const [_showMoreTabs, _setShowMoreTabs] = useState(false) // legacy — tabs agora são inline
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const createContact = useCreateContact()
  const deleteLead = useDeleteLead()
  const queryClient = useQueryClient()
  const [isReExtractingSocial, setIsReExtractingSocial] = useState(false)

  const handleReExtractSocial = async () => {
    if (!lead || isReExtractingSocial) return
    setIsReExtractingSocial(true)
    const toastId = toast.loading('Re-extraindo redes sociais…')
    try {
      const result = await reEnrichLead(lead.id, lead, { forceAll: true })
      await queryClient.invalidateQueries({ queryKey: ['lead', lead.id] })
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      if (result.skipped) {
        toast.info('Nenhuma rede social nova encontrada', { id: toastId })
      } else {
        const found = [
          result.updated.instagram && 'Instagram',
          result.updated.linkedin && 'LinkedIn',
          result.updated.tiktok && 'TikTok',
          result.updated.facebook && 'Facebook',
        ].filter(Boolean)
        toast.success(found.length ? `Redes atualizadas: ${found.join(', ')}` : 'Redes sociais atualizadas', { id: toastId })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao re-extrair'
      toast.error(`Falha: ${msg}`, { id: toastId })
    } finally {
      setIsReExtractingSocial(false)
    }
  }

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
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-[fade-in_0.4s_ease-out]">
        <div className="p-5 rounded-2xl bg-error/[0.06] border border-error/20 mb-6">
          <Search className="h-10 w-10 text-error" strokeWidth={1.2} />
        </div>
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-2">Lead não encontrado</h3>
        <p className="text-sm text-text-muted max-w-sm mb-8 leading-relaxed">
          Este lead pode ter sido removido ou o link está incorreto. Volte para a lista de leads.
        </p>
        <Button onClick={() => navigate('/leads')} size="lg" icon={<ArrowLeft className="h-4 w-4" />}>
          Voltar para Leads
        </Button>
      </div>
    )
  }

  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)

  // Trava dominante: detectar via Fábrica de Receita (dados reais do lead)
  const travasDetectadas = detectTravas(lead)
  const travaDominante = travasDetectadas[0]

  // Anos no mercado: fallback dinâmico via foundingDate
  const yearsInMarket = lead.yearsInMarket
    ?? (lead.foundingDate
      ? Math.floor((Date.now() - new Date(lead.foundingDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined)

  const mainContact = contacts?.find((c) => c.contactType === 'decisor') || contacts?.[0]
  const whatsappLink = mainContact?.whatsapp ? `https://wa.me/${mainContact.whatsapp.replace(/\D/g, '')}` : null
  const contactPhone = mainContact?.whatsapp || mainContact?.phone || lead.rfPhone || ''
  const hasWhatsapp = !!mainContact?.whatsapp

  const discoveryQuestions = parseJsonField<string[]>(lead.discoveryQuestions, generateDiscoveryQuestions(lead))
  const eligibility = parseJsonField<{ label: string; value: boolean }[]>(lead.eligibilityChecklist, generateEligibilityChecklist(lead))
  const spicedNotes = parseJsonField<Record<string, string>>(lead.spicedNotes, {})
  const spicedDescriptions = generateSpicedDescriptions(lead)

  return (
    <div className="space-y-4 animate-[fade-in_0.4s_ease-out]">
      {/* Breadcrumb + Actions menu */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm">
          <button onClick={() => navigate('/leads')} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors">
            Leads
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted/50" />
          <span className="text-text-primary font-medium truncate max-w-[200px]">{lead.companyName}</span>
        </nav>
        <div className="relative">
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="p-2 rounded-lg hover:bg-elevated-2 transition-colors cursor-pointer"
            aria-label="Acoes do lead"
          >
            <MoreVertical className="h-4 w-4 text-text-muted" />
          </button>
          {showActionMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-surface border border-border shadow-xl shadow-black/30 py-1.5 z-50 animate-[fade-in_0.15s_ease-out]">
                <button
                  onClick={() => { setShowActionMenu(false); navigate(-1) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:bg-elevated-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { setShowActionMenu(false); setShowDeleteConfirm(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-error hover:bg-error/5 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir lead
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-surface border border-border p-6 space-y-4 animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-error" />
              </div>
              <h3 className="text-base font-bold text-text-primary">Excluir lead?</h3>
              <p className="text-sm text-text-muted mt-1">
                <strong>{lead.companyName}</strong> será excluído permanentemente, junto com seus contatos e histórico de atividades. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button
                variant="danger"
                className="flex-1"
                icon={<Trash2 className="h-4 w-4" />}
                loading={deleteLead.isPending}
                onClick={() => {
                  deleteLead.mutate(lead.id, {
                    onSuccess: () => {
                      toast.success(`${lead.companyName} excluído`)
                      navigate('/leads')
                    },
                  })
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[9px] uppercase tracking-wide leading-none font-medium px-1.5 py-[3px] rounded-full ${
                lead.temperature === 'Quente' ? 'bg-hot/15 text-hot' : lead.temperature === 'Morno' ? 'bg-warm/15 text-warm' : 'bg-cold/15 text-cold'
              }`}>
                {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
              </span>
              <span className="text-[9px] uppercase tracking-wide leading-none font-medium px-1.5 py-[3px] rounded-full bg-elevated-2 text-text-secondary">{lead.tier}</span>
              <span className="text-[9px] leading-none font-medium px-1.5 py-[3px] rounded-full bg-elevated-2 text-text-secondary">{lead.segment}</span>
              {lead.sourceHtmlReport === 'cadastro_manual' && (
                <span
                  title="Lead adicionado manualmente. Enriquecimento automático via CNPJá e Assertiva executado na criação."
                  className="inline-flex items-center gap-1 text-[9px] leading-none font-semibold uppercase tracking-wide px-1.5 py-[3px] rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 cursor-help"
                >
                  Manual
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold font-heading truncate">{lead.tradeName || lead.companyName}</h1>
            {lead.tradeName && <p className="text-sm text-text-secondary">{lead.companyName}</p>}
            {lead.city && (
              <p className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3" />{lead.city}{lead.state ? `, ${lead.state}` : ''}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl md:text-2xl font-bold font-mono text-red leading-none">{score}</p>
            <p className="text-caption uppercase tracking-wider text-text-muted mt-1 cursor-help" title="SPICED: Score de qualificação (Suitable, Problem, Implement, Champion, Decision). Escala 0 a 5.">SPICED</p>
            <p className="text-caption text-text-muted mt-0.5">{score >= 3.7 ? 'Lead qualificado' : score >= 2.5 ? 'Potencial médio' : 'Necessita qualificação'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: lead.monthlyRevenue ? 'Faturamento/ano' : 'Capital Social', value: lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue * 12) : lead.capitalSocial ? formatCurrencyShort(lead.capitalSocial) : '-', tooltip: lead.monthlyRevenue ? 'Receita mensal × 12 meses' : 'Capital social registrado na Receita Federal' },
            { label: 'Funcionários', value: lead.employees ? `${lead.employees}${!['assertiva','complete'].includes(lead.enrichmentStatus || '') ? ' (est. via CNPJá)' : ''}` : '-', tooltip: 'Quantidade de funcionários estimada ou confirmada' },
            { label: 'Anos no mercado', value: yearsInMarket != null ? `${yearsInMarket} anos` : '-', tooltip: yearsInMarket != null ? (yearsInMarket >= 10 ? 'Empresa consolidada' : yearsInMarket >= 3 ? 'Empresa em crescimento' : 'Empresa recente') : '' },
            { label: 'Trava dominante', value: travaDominante ? `${travaDominante.codigo} ${travaDominante.nome}` : lead.hypotheticalTrap?.replace(/^T\d+\s*[-–]\s*/, '') || '-', isHighlight: true, tooltip: travaDominante ? `${travaDominante.severidade}: ${travaDominante.impactoEstimado}` : 'Principal barreira de receita identificada pela análise' },
          ].map((stat: any) => (
            <div key={stat.label} className={`p-3 rounded-xl border-l-[3px] ${stat.isHighlight ? 'bg-red/5 border-l-red' : 'bg-elevated-1 border-l-red'}`} title={stat.tooltip || ''}>
              <p className="text-caption uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${stat.isHighlight ? 'text-red text-sm' : ''}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick action: Decisor + WhatsApp (compacto) — sem vínculo com o stepper */}
        {mainContact && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className={cn(
              'flex items-center gap-2.5 p-2.5 rounded-xl flex-1 min-w-0',
              hasWhatsapp ? 'bg-whatsapp/6 border border-whatsapp/15' : 'bg-elevated-1 border border-border',
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                hasWhatsapp ? 'bg-whatsapp/15' : 'bg-elevated-3',
              )}>
                {hasWhatsapp ? <WhatsAppIcon className="text-base text-whatsapp" /> : <Phone className="h-4 w-4 text-text-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">{mainContact.name}</p>
                {contactPhone && (
                  <p className={cn(
                    'text-label font-mono truncate leading-tight mt-0.5',
                    hasWhatsapp ? 'text-whatsapp' : 'text-text-secondary',
                  )}>
                    {contactPhone}
                    {!hasWhatsapp && <span className="text-micro text-text-muted ml-1">(fixo)</span>}
                  </p>
                )}
              </div>
              {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noopener" className="shrink-0">
                  <Button variant="whatsapp" size="sm" icon={<WhatsAppIcon className="text-sm" />}>
                    WhatsApp
                  </Button>
                </a>
              ) : contactPhone ? (
                <a href={`tel:+${contactPhone.replace(/\D/g, '')}`} className="shrink-0">
                  <Button variant="secondary" size="sm" icon={<Phone className="h-4 w-4" />}>
                    Ligar
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" size="sm" icon={<Phone className="h-4 w-4" />} onClick={() => setShowAddContact(true)}>
                  Add
                </Button>
              )}
            </div>

            {/* Responsável + Fase do pipeline — mesma linha do decisor */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <AssignLeadControl leadId={lead.id} assignedTo={lead.assignedTo} />
              <div className="flex items-center gap-2">
                <span className="text-caption uppercase tracking-wider text-text-muted font-semibold hidden sm:inline">
                  Fase
                </span>
                <PipelineJourneyStepper lead={lead} source="company-page" />
              </div>
            </div>
          </div>
        )}
        {!mainContact && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-3 flex-1 min-w-0 p-3 rounded-xl bg-warning/6 border border-warning/15 border-dashed cursor-pointer hover:bg-warning/10 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                <UserPlus className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warning">Adicionar decisor</p>
                <p className="text-label text-text-muted">Adicione o decisor com WhatsApp para liberar a prospecção</p>
              </div>
            </button>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <AssignLeadControl leadId={lead.id} assignedTo={lead.assignedTo} />
              <div className="flex items-center gap-2">
                <span className="text-caption uppercase tracking-wider text-text-muted font-semibold hidden sm:inline">Fase</span>
                <PipelineJourneyStepper lead={lead} source="company-page" />
              </div>
            </div>
          </div>
        )}

        {/* Presença Digital — pills com ícones, re-extração e auditoria */}
        <DigitalPresencePanel
          lead={lead}
          onReExtract={handleReExtractSocial}
          isReExtracting={isReExtractingSocial}
        />
      </Card>

      {/* Inline add contact form */}
      {showAddContact && (
        <Card className="animate-[slide-up_0.3s_ease-out] border-red/20">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const data = new FormData(form)
              createContact.mutate({
                leadId: lead.id,
                name: data.get('name') as string,
                role: data.get('role') as string,
                contactType: 'decisor',
                whatsapp: data.get('whatsapp') as string,
                email: '',
              }, { onSuccess: () => setShowAddContact(false) })
            }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-red uppercase tracking-wider">Adicionar decisor</p>
              <button type="button" onClick={() => setShowAddContact(false)} className="text-xs text-text-muted hover:text-text-primary cursor-pointer">Cancelar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-caption uppercase tracking-[0.1em] text-text-muted font-medium mb-1.5 flex items-center gap-1 block">Nome <span className="text-red">*</span></label>
                <input name="name" type="text" placeholder="Nome completo" required className="h-10 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary px-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors invalid:border-error/40" />
              </div>
              <div>
                <label className="text-caption uppercase tracking-[0.1em] text-text-muted font-medium mb-1.5 block">Cargo</label>
                <input name="role" type="text" placeholder="CEO, Proprietário..." className="h-10 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary px-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors" />
              </div>
              <div>
                <label className="text-caption uppercase tracking-[0.1em] text-text-muted font-medium mb-1.5 flex items-center gap-1 block">WhatsApp <span className="text-red">*</span></label>
                <input name="whatsapp" type="tel" placeholder="11999998888" required pattern="[0-9]{10,13}" className="h-10 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary px-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors invalid:border-error/40" />
              </div>
            </div>
            <Button type="submit" size="sm" loading={createContact.isPending} icon={<UserPlus className="h-3.5 w-3.5" />}>
              Salvar contato
            </Button>
          </form>
        </Card>
      )}

      {/* Tabs navigation — todas inline com scroll horizontal */}
      <div className="border-b border-border">
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex gap-0.5 min-w-max pb-0">
            {ALL_TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-all duration-300 whitespace-nowrap cursor-pointer',
                  'hover:text-text-primary',
                  activeTab === tab.id ? 'text-red' : 'text-text-muted hover:bg-elevated-1',
                  i === 3 && 'ml-3 pl-4 border-l border-border',
                )}
              >
                {tab.label}
                <span className={cn(
                  'absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-300',
                  activeTab === tab.id ? 'bg-red scale-x-100 opacity-100' : 'bg-transparent scale-x-0 opacity-0',
                )} />
              </button>
            ))}
          </div>
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
              <span className="text-label px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.tier}</span>
              <span className="text-label px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.segment}</span>
              {lead.yearsInMarket && <span className="text-label px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.yearsInMarket}+ anos</span>}
              {lead.employees && <span className="text-label px-2.5 py-1 rounded-full bg-surface-md border border-border text-text-secondary">{lead.employees} func.</span>}
              {travaDominante && <span className="text-label px-2.5 py-1 rounded-full bg-red/10 border border-red/20 text-red font-medium">{travaDominante.codigo} {travaDominante.nome}</span>}
            </div>

            {/* Business summary */}
            {lead.businessSummary && (
              <p className="text-sm text-text-primary leading-relaxed">{lead.businessSummary}</p>
            )}

            {/* LTP anual — destaque */}
            {lead.monthlyRevenue && (
              <div className="p-3 rounded-xl bg-red/5 border border-red/15">
                <span className="text-xs text-text-muted" title="LTP: Lifetime Throughput do Projeto">Potencial de investimento anual (LTP): </span>
                <span className="font-mono text-base font-bold text-red">
                  {formatCurrencyShort(lead.monthlyRevenue * 12 * 0.10)} a {formatCurrencyShort(lead.monthlyRevenue * 12 * 0.15)}
                </span>
                <p className="text-caption text-text-muted mt-1">Baseado em 10-15% do faturamento anual estimado</p>
              </div>
            )}

            {/* Decisor: info já está no header — aqui só alerta se não existe */}
            {!mainContact && (
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-2.5 w-full p-3 rounded-xl bg-warning/6 border border-warning/15 border-dashed cursor-pointer hover:bg-warning/10 transition-colors text-left"
              >
                <span className="text-warning">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-warning">Sem decisor cadastrado</p>
                  <p className="text-label text-text-muted">Toque para adicionar nome e WhatsApp do decisor</p>
                </div>
              </button>
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

            {/* Perfil financeiro — faturamento, capital, score de crédito, renda do decisor */}
            <FinancialPanel lead={lead} yearsInMarket={yearsInMarket} />

            {/* Stakeholder (pessoa-chave) — vinculado e validado, junto aos dados cadastrais */}
            <StakeholderPanel lead={lead} contacts={contacts} onAdd={() => setShowAddContact(true)} />

            {/* Dados cadastrais CNPJa */}
            {(lead.capitalSocial || lead.legalNature || lead.registrationStatus || lead.taxRegime || lead.simplesOptant !== undefined || lead.isHeadquarters !== undefined) && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-caption font-bold uppercase tracking-wider text-text-muted">Dados Cadastrais</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {lead.registrationStatus && (
                    <div className="text-xs"><span className="text-text-muted">Situacao: </span><span className={cn('font-medium', lead.registrationStatus === 'Ativa' ? 'text-success' : 'text-error')}>{lead.registrationStatus}</span></div>
                  )}
                  {lead.capitalSocial && (
                    <div className="text-xs"><span className="text-text-muted">Capital: </span><span className="font-mono text-text-primary">R$ {Number(lead.capitalSocial).toLocaleString('pt-BR')}</span></div>
                  )}
                  {lead.legalNature && (
                    <div className="text-xs col-span-2"><span className="text-text-muted">Natureza: </span><span className="text-text-primary">{lead.legalNature}</span></div>
                  )}
                  {lead.cnaePrimary && (
                    <div className="text-xs col-span-2"><span className="text-text-muted">CNAE: </span><span className="text-text-primary">{lead.cnaePrimary}</span></div>
                  )}
                  {lead.foundingDate && (
                    <div className="text-xs"><span className="text-text-muted">Abertura: </span><span className="text-text-primary">{lead.foundingDate}</span></div>
                  )}
                  {lead.taxRegime && (
                    <div className="text-xs"><span className="text-text-muted">Regime: </span><span className="text-text-primary">{lead.taxRegime}</span></div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.isHeadquarters !== undefined && (
                    <span className={cn('text-caption px-2 py-0.5 rounded-full border', lead.isHeadquarters ? 'bg-red-subtle border-red/20 text-red' : 'bg-surface-md border-border text-text-muted')}>{lead.isHeadquarters ? 'Matriz' : 'Filial'}</span>
                  )}
                  {lead.simplesOptant && (
                    <span className="text-caption px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Simples Nacional</span>
                  )}
                  {lead.phoneType && (
                    <span className={cn('text-caption px-2 py-0.5 rounded-full border', lead.phoneType === 'MOBILE' ? 'bg-whatsapp/10 border-whatsapp/20 text-whatsapp' : 'bg-surface-md border-border text-text-muted')}>{lead.phoneType === 'MOBILE' ? 'Celular' : 'Fixo'}</span>
                  )}
                  {lead.emailDomain && (
                    <span className="text-caption px-2 py-0.5 rounded-full bg-surface-md border border-border text-text-muted">{lead.emailDomain}</span>
                  )}
                </div>
                {(lead.zipCode || lead.district) && (
                  <div className="text-xs"><span className="text-text-muted">Bairro/CEP: </span><span className="text-text-primary">{[lead.district, lead.zipCode].filter(Boolean).join(' · ')}</span></div>
                )}
                {lead.cnpjaLastUpdate && (
                  <div className="text-caption text-text-muted">Atualizado: {new Date(lead.cnpjaLastUpdate).toLocaleDateString('pt-BR')}</div>
                )}
              </div>
            )}

            {/* Sócios e decisores (deep enrichment Assertiva + redes Apify) — indexado no Resumo.
                Substitui o antigo "Quadro Societário + Contatos"; a aba Sócios deixou de existir. */}
            <div className="pt-2 border-t border-border">
              <TabSocios lead={lead} />
            </div>

            {/* Timeline de Enriquecimento */}
            {enrichmentLog && enrichmentLog.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-caption font-bold uppercase tracking-wider text-text-muted">Enriquecimento ({enrichmentLog.length} etapas)</p>
                <div className="space-y-1">
                  {enrichmentLog.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-label">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', entry.status === 'done' ? 'bg-success' : entry.status === 'error' ? 'bg-error' : 'bg-text-muted')} />
                      <span className={cn('font-medium', entry.source?.includes('cnpja') ? 'text-source-cnpja' : entry.source?.includes('assertiva') ? 'text-source-assertiva' : entry.source?.includes('apify') ? 'text-source-apify' : 'text-text-secondary')}>{entry.source}</span>
                      <span className="text-text-muted truncate">{entry.detail}</span>
                      {entry.timestamp && <span className="text-text-muted ml-auto shrink-0">{new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Histórico das Fases */}
            <PhaseHistory lead={lead} activities={activities || []} contacts={contacts || []} />
          </div>
        )}

        {/* Tab: SPICED — Design system replicado do HTML de referência */}
        {activeTab === 'spiced' && (
          <div>
            {/* Header: Análise SPICED */}
            <h2 className="text-xl font-bold font-heading mb-6">Análise SPICED</h2>

            {/* Score ponderado final */}
            <div className="flex items-center gap-3 pb-5 mb-6 border-b border-red/20 flex-wrap">
              <span className="text-sm text-text-secondary">Score ponderado final:</span>
              <span className="text-base md:text-lg font-bold font-mono text-red px-2.5 py-1 bg-red/10 rounded-md shadow-[0_0_8px_rgba(204,0,0,0.15)] animate-[scale-in_0.4s_ease-out]">
                {score}/5
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className={`text-[9px] uppercase tracking-wide font-medium px-1.5 py-[3px] rounded-full leading-none ${
                lead.temperature === 'Quente' ? 'bg-hot/15 text-hot' : lead.temperature === 'Morno' ? 'bg-warm/15 text-warm' : 'bg-cold/15 text-cold'
              }`}>
                {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
              </span>
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
                    <span className="absolute -top-8 right-0 bg-surface-md px-2.5 py-1 rounded text-label text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Peso: {dim.weight}
                    </span>
                  </div>

                  {/* Justification text — manual notes or auto-generated */}
                  {(spicedNotes[dim.noteKey] || spicedDescriptions[dim.noteKey]) && (
                    <p className="text-sm text-text-secondary leading-relaxed mt-1">
                      {spicedNotes[dim.noteKey] || spicedDescriptions[dim.noteKey]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Trava dominante — Fábrica de Receita */}
            {travaDominante && (
              <div className="mt-10 p-6 rounded-xl border border-red/30 bg-red/5">
                <h3 className="text-lg font-bold text-red mb-3">Trava dominante: {travaDominante.codigo} {travaDominante.nome}</h3>
                <p className="text-base font-bold text-text-primary mb-2">{travaDominante.step.trava}</p>
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
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-elevated-1">
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
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-elevated-1 border-l-[3px] border-l-red/40">
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

        {/* Tab: Histórico de ações */}
        {activeTab === 'historico' && (
          <ActivityLog
            leadId={lead.id}
            activities={activities || []}
            onLogged={() => queryClient.invalidateQueries({ queryKey: ['activities', id] })}
          />
        )}

        {/* Tab: Diagnóstico de Travas */}
        {activeTab === 'travas' && <TabTravas lead={lead} />}

        {/* Tab: Projeção Competitiva */}
        {activeTab === 'projecao-competitiva' && <TabProjecaoCompetitiva lead={lead} />}

        {/* Tab: Playbook BDR */}
        {activeTab === 'playbook-bdr' && <TabPlaybookBDR lead={lead} contacts={contacts} />}


        </div>
      </Card>
    </div>
  )
}
