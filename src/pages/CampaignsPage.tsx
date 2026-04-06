import { useState, useEffect, useMemo } from 'react'
import { useZapCampaigns, useZapCampaignMessages, useZapTemplates, useCreateZapCampaign, useDispatchZapCampaign, usePauseZapCampaign, useCancelZapCampaign, useImportZapContacts } from '../hooks/useBilinskiZap'
import { useLeads } from '../hooks/useLeads'
import { getContacts } from '../services/contactService'
import { precheckCampaign, calculateDeliveryRate, calculateReadRate, type ZapCampaign, type ZapTemplate, type ZapMessageStatus } from '../lib/bilinskizap'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { cn } from '../lib/cn'
import { SEGMENTS, TEMPERATURES } from '../lib/constants'
import type { Lead, Contact } from '../types'
import {
  Smartphone, Plus, Send, Pause, X, CheckCircle, AlertTriangle,
  ChevronRight, Filter, Users, Zap, Search, Shield, ArrowRight,
  Phone, Mail, Loader2, RefreshCw, Copy, Trash2, Clock, Eye,
  ChevronDown, ArrowLeft, Tag, BarChart3, CircleAlert,
} from 'lucide-react'
import { toast } from 'sonner'

// --- Status Config ---
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  SCHEDULED: { label: 'Agendada', variant: 'info' },
  SENDING: { label: 'Enviando', variant: 'warning' },
  COMPLETED: { label: 'Concluido', variant: 'success' },
  PAUSED: { label: 'Pausada', variant: 'default' },
  FAILED: { label: 'Falhou', variant: 'error' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
}

const MSG_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  pending: { label: 'Pendente', variant: 'default' },
  sent: { label: 'Enviado', variant: 'info' },
  delivered: { label: 'Entregue', variant: 'success' },
  read: { label: 'Lido', variant: 'success' },
  skipped: { label: 'Ignorado', variant: 'warning' },
  failed: { label: 'Falhou', variant: 'error' },
}

// ============================================================
// CAMPAIGN TABLE ROW
// ============================================================
function CampaignRow({ campaign, onView }: { campaign: ZapCampaign; onView: () => void }) {
  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const sendTime = campaign.startedAt && campaign.completedAt
    ? `${Math.round((new Date(campaign.completedAt).getTime() - new Date(campaign.startedAt).getTime()) / 1000)}s`
    : campaign.startedAt ? 'Em andamento' : '-'

  return (
    <tr
      onClick={onView}
      className="border-b border-border hover:bg-white/[0.02] cursor-pointer transition-colors group"
    >
      {/* Nome + Template */}
      <td className="py-4 px-4">
        <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{campaign.name}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{campaign.templateName}</p>
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <Badge variant={status.variant} size="sm">{status.label}</Badge>
      </td>

      {/* Destinatarios */}
      <td className="py-4 px-4 text-center">
        <span className="text-sm font-mono text-text-primary">{campaign.recipients}</span>
      </td>

      {/* Entrega (barra + %) */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                deliveryRate >= 80 ? 'bg-success' : deliveryRate >= 50 ? 'bg-warning' : 'bg-error',
              )}
              style={{ width: `${deliveryRate}%` }}
            />
          </div>
          <span className={cn(
            'text-sm font-mono font-semibold',
            deliveryRate >= 80 ? 'text-success' : deliveryRate >= 50 ? 'text-warning' : 'text-error',
          )}>
            {deliveryRate}%
          </span>
        </div>
      </td>

      {/* Envio (tempo) */}
      <td className="py-4 px-4 text-center">
        <span className="text-sm font-mono text-text-secondary">{sendTime}</span>
      </td>

      {/* Criado em */}
      <td className="py-4 px-4">
        <span className="text-sm text-text-secondary">
          {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </td>

      {/* Acoes */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); toast.info('Funcao de duplicar em breve') }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            title="Duplicar"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toast.info('Funcao de excluir em breve') }}
            className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================
// CAMPAIGN DETAIL — KPIs + Velocity + Logs
// ============================================================
function CampaignDetail({ campaign, onBack }: { campaign: ZapCampaign; onBack: () => void }) {
  const { data: messagesData, isLoading: loadingMessages } = useZapCampaignMessages(campaign.id)
  const pause = usePauseZapCampaign()
  const cancel = useCancelZapCampaign()
  const [logSearch, setLogSearch] = useState('')
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all')

  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const readRate = calculateReadRate(campaign)
  const messages = messagesData?.messages || []
  const stats = messagesData?.stats

  // Compute velocity
  const velocity = useMemo(() => {
    if (!campaign.startedAt) return null
    const endTime = campaign.completedAt || new Date().toISOString()
    const durationMs = new Date(endTime).getTime() - new Date(campaign.startedAt).getTime()
    const durationSec = Math.max(durationMs / 1000, 1)
    const throughput = campaign.sent / durationSec
    return {
      throughput: throughput.toFixed(2),
      throughputMin: (throughput * 60).toFixed(1),
      totalTime: durationSec < 60 ? `${Math.round(durationSec)}s` : `${Math.round(durationSec / 60)}min`,
    }
  }, [campaign])

  // Filtered logs
  const filteredMessages = useMemo(() => {
    let filtered = messages
    if (logStatusFilter !== 'all') filtered = filtered.filter((m) => m.status === logStatusFilter)
    if (logSearch) filtered = filtered.filter((m) =>
      m.contactName?.toLowerCase().includes(logSearch.toLowerCase()) ||
      m.contactPhone?.includes(logSearch),
    )
    return filtered
  }, [messages, logStatusFilter, logSearch])

  // KPI cards config
  const kpis = [
    {
      label: 'Enviadas', value: campaign.sent, sub: `${campaign.recipients} destinatarios`,
      icon: <Send className="h-5 w-5" />, borderColor: 'border-text-muted/20', iconColor: 'text-text-muted',
    },
    {
      label: 'Entregues', value: campaign.delivered, sub: `${deliveryRate}% taxa de entrega${campaign.sent - campaign.delivered > 0 ? ` - ${campaign.sent - campaign.delivered} nao entregues` : ''}`,
      icon: <CheckCircle className="h-5 w-5" />, borderColor: 'border-success/30', iconColor: 'text-success',
    },
    {
      label: 'Lidas', value: campaign.read, sub: campaign.read > 0 ? `${readRate}% taxa de leitura` : 'Aguardando webhook',
      icon: <Eye className="h-5 w-5" />, borderColor: 'border-info/30', iconColor: 'text-info',
    },
    {
      label: 'Ignoradas', value: stats?.skipped || 0, sub: 'Variaveis/telefones invalidos (pre-check)',
      icon: <CircleAlert className="h-5 w-5" />, borderColor: 'border-warning/30', iconColor: 'text-warning',
    },
    {
      label: 'Falhas', value: campaign.failed, sub: 'Numeros invalidos ou bloqueio',
      icon: <AlertTriangle className="h-5 w-5" />, borderColor: 'border-error/30', iconColor: 'text-error',
    },
  ]

  return (
    <div className="space-y-5 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-text-muted hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-heading">{campaign.name}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              ID: {campaign.id.slice(0, 8)}... · Template: {campaign.templateName} · Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'SENDING' && (
            <Button size="sm" variant="secondary" icon={<Pause className="h-3.5 w-3.5" />} onClick={() => pause.mutate(campaign.id)} loading={pause.isPending}>
              Pausar
            </Button>
          )}
          {['DRAFT', 'SCHEDULED', 'SENDING'].includes(campaign.status) && (
            <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => cancel.mutate(campaign.id)} loading={cancel.isPending}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards — 5 cards like BilinskiZap */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn('p-4 rounded-xl bg-white/[0.02] border transition-colors', kpi.borderColor)}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-text-muted font-medium">{kpi.label}</p>
              <span className={kpi.iconColor}>{kpi.icon}</span>
            </div>
            <p className="text-3xl font-bold font-mono text-text-primary">{kpi.value}</p>
            <p className="text-[11px] text-text-muted mt-1 leading-tight">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Velocidade do disparo */}
      {velocity && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Velocidade do disparo</CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">Conta apenas o periodo do primeiro envio ate o ultimo envio (sent-only).</p>
            </div>
            <Badge variant="outline" size="sm">DADOS: AVANCADOS</Badge>
          </div>
          <div className="grid md:grid-cols-[1fr,auto] gap-3">
            {/* Throughput */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-text-muted mb-1">Velocidade (throughput)</p>
                  <p className="text-2xl font-bold font-mono text-text-primary">
                    {velocity.throughput} msg/s <span className="text-lg text-text-secondary">({velocity.throughputMin} msg/min)</span>
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">Baseline (mediana): 1.30 msg/s</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
              </div>
            </div>
            {/* Tempo total */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border min-w-[180px]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-text-muted mb-1">Tempo total</p>
                  <p className="text-2xl font-bold font-mono text-text-primary">{velocity.totalTime}</p>
                  <p className="text-[11px] text-text-muted mt-1">Do primeiro envio ate o ultimo envio</p>
                </div>
                <Clock className="h-5 w-5 text-text-muted shrink-0" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Logs de Envio */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CardTitle>Logs de Envio</CardTitle>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] font-mono text-text-secondary">{messages.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Buscar destinatario..."
                className="h-8 w-52 rounded-lg bg-white/[0.03] border border-border text-xs text-text-primary pl-8 pr-3 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors"
              />
            </div>
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="h-8 rounded-lg bg-white/[0.03] border border-border text-xs text-text-primary px-2 cursor-pointer focus:border-red/30 focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="delivered">Entregue</option>
              <option value="read">Lido</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falhou</option>
              <option value="skipped">Ignorado</option>
            </select>
            <button
              onClick={() => toast.info('Logs atualizados automaticamente a cada 15s')}
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loadingMessages ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : filteredMessages.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            {messages.length === 0 ? 'Nenhum log de envio ainda' : 'Nenhum resultado com os filtros atuais'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Destinatario</th>
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Telefone</th>
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Status</th>
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Horario</th>
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Info</th>
                  <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => {
                  const msgStatus = MSG_STATUS_CONFIG[msg.status] || MSG_STATUS_CONFIG.pending
                  return (
                    <tr key={msg.id} className="border-b border-border/50 hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 px-4 text-sm text-text-primary">{msg.contactName || '-'}</td>
                      <td className="py-3 px-4 text-sm font-mono text-text-secondary">{msg.contactPhone ? `+${msg.contactPhone}` : '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={msgStatus.variant} size="sm">
                          {msg.status === 'delivered' || msg.status === 'read' ? <CheckCircle className="h-2.5 w-2.5" /> : null}
                          {msgStatus.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-secondary">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-muted">
                        {msg.readAt ? `Lido ${new Date(msg.readAt).toLocaleTimeString('pt-BR')}` : msg.error || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-text-muted">-</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// TEMPLATE PREVIEW
// ============================================================
function TemplatePreview({ template }: { template: ZapTemplate | null }) {
  if (!template) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.02] border border-border text-center">
        <Smartphone className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">Selecione um template</p>
      </div>
    )
  }

  const header = template.components?.find((c) => c.type === 'HEADER')
  const body = template.components?.find((c) => c.type === 'BODY')
  const footer = template.components?.find((c) => c.type === 'FOOTER')
  const buttons = template.components?.find((c) => c.type === 'BUTTONS')

  return (
    <div className="p-4 rounded-2xl bg-[#0B141A] border border-border">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
          <Smartphone className="h-4 w-4 text-success" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text-primary">BilinskiZap</p>
          <p className="text-[10px] text-text-muted">Preview do template</p>
        </div>
        <Badge variant="info" size="sm" className="ml-auto">{template.category}</Badge>
      </div>
      <div className="rounded-xl bg-[#1F2C34] p-3 space-y-2">
        {header?.text && <p className="text-sm font-semibold text-text-primary">{header.text}</p>}
        {header?.format === 'IMAGE' && <div className="h-32 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-xs">Imagem</div>}
        {body?.text && (
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {body.text.replace(/\{\{(\d+)\}\}/g, (_: string, n: string) => `[Variavel ${n}]`)}
          </p>
        )}
        {footer?.text && <p className="text-[11px] text-text-muted italic">{footer.text}</p>}
        {buttons?.buttons && buttons.buttons.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-white/5">
            {buttons.buttons.map((btn, i) => (
              <div key={i} className="text-center py-1.5 rounded-lg bg-white/[0.04] text-xs font-medium text-info">
                {btn.text}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[9px] text-text-muted text-center mt-2">Status: {template.status}</p>
    </div>
  )
}

// ============================================================
// NEW CAMPAIGN WIZARD (preserved, with minor fixes)
// ============================================================
type LeadWithContact = Lead & {
  decisorContact?: Contact
  allContacts: Contact[]
}

function NewCampaignWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(`Campanha ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}`)
  const [templateName, setTemplateName] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tempFilter, setTempFilter] = useState<string>('all')
  const [segFilter, setSegFilter] = useState<string>('all')
  const [contactOnly, setContactOnly] = useState(true)
  const [leadsWithContacts, setLeadsWithContacts] = useState<LeadWithContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [precheckResult, setPrecheckResult] = useState<{ ok: boolean; totals: { total: number; valid: number; skipped: number } } | null>(null)
  const [precheckLoading, setPrecheckLoading] = useState(false)

  const { data: leads } = useLeads()
  const { data: templates } = useZapTemplates()
  const createCampaign = useCreateZapCampaign()
  const dispatch = useDispatchZapCampaign()
  const importZapContacts = useImportZapContacts()

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  useEffect(() => {
    if (!leads?.length) return
    let cancelled = false
    setLoadingContacts(true)
    async function loadAll() {
      const results: LeadWithContact[] = []
      for (const lead of leads!) {
        try {
          const contacts = await getContacts(lead.id)
          const decisor = contacts.find((c) => c.whatsapp && c.whatsapp.length >= 10) || null
          results.push({ ...lead, decisorContact: decisor || undefined, allContacts: contacts })
        } catch {
          results.push({ ...lead, decisorContact: undefined, allContacts: [] })
        }
      }
      if (!cancelled) {
        setLeadsWithContacts(results)
        setLoadingContacts(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leadsWithContacts.filter((l) => {
      if (l.status === 'Fechado' || l.status === 'Perdido') return false
      if (contactOnly && !l.decisorContact) return false
      if (tempFilter !== 'all' && l.temperature !== tempFilter) return false
      if (segFilter !== 'all' && !l.segment?.toLowerCase().includes(segFilter.toLowerCase())) return false
      return true
    })
  }, [leadsWithContacts, contactOnly, tempFilter, segFilter])

  const selectedTemplate = useMemo(() => (templates || []).find((t) => t.name === templateName) || null, [templates, templateName])

  const variableCount = useMemo(() => {
    if (!selectedTemplate) return 0
    const body = selectedTemplate.components?.find((c) => c.type === 'BODY')?.text || ''
    return body.match(/\{\{\d+\}\}/g)?.length || 0
  }, [selectedTemplate])

  const filteredTemplates = useMemo(() => {
    let t = (templates || []).filter((t) => t.status === 'APPROVED')
    if (categoryFilter !== 'all') t = t.filter((x) => x.category === categoryFilter)
    if (templateSearch) t = t.filter((x) => x.name.toLowerCase().includes(templateSearch.toLowerCase()))
    return t
  }, [templates, categoryFilter, templateSearch])

  const buildContacts = () => {
    const selected = leadsWithContacts.filter((l) => selectedLeadIds.includes(l.id) && l.decisorContact)
    return selected.map((lead) => {
      const contact = lead.decisorContact!
      const phone = contact.whatsapp.replace(/\D/g, '').replace(/^0+/, '')
      const normalizedPhone = phone.startsWith('55') ? phone : `55${phone}`
      return {
        phone: normalizedPhone,
        name: contact.name || lead.companyName,
        email: contact.email,
        custom_fields: {
          segment: lead.segment || '',
          tier: lead.tier || '',
          leadId: lead.id,
          companyName: lead.companyName,
          contactRole: contact.role || '',
          city: lead.city || '',
          state: lead.state || '',
          score: String(lead.score || 0),
        },
      }
    })
  }

  const runPrecheck = async () => {
    setPrecheckLoading(true)
    try {
      const contacts = buildContacts()
      const result = await precheckCampaign({
        templateName,
        contacts: contacts.map((c) => ({ phone: c.phone, name: c.name })),
      })
      setPrecheckResult(result)
    } catch (err: any) {
      toast.error(`Erro no precheck: ${err.message}`)
      setPrecheckResult(null)
    }
    setPrecheckLoading(false)
  }

  const handleCreate = async () => {
    const contacts = buildContacts()
    if (contacts.length === 0) {
      toast.error('Nenhum contato valido para enviar')
      return
    }
    try {
      await importZapContacts.mutateAsync(
        contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          tags: [c.custom_fields.segment, c.custom_fields.tier].filter(Boolean),
          custom_fields: c.custom_fields,
        })),
      )
      const campaign = await createCampaign.mutateAsync({ name, templateName, contacts, scheduledAt: scheduledAt || undefined })
      if (!scheduledAt) {
        await dispatch.mutateAsync({ campaignId: campaign.id, templateName })
      }
      toast.success(scheduledAt ? 'Campanha agendada!' : 'Campanha disparada!')
      onClose()
    } catch {
      // Error handled by mutations
    }
  }

  const stepLabels = ['Template', 'Publico', 'Validacao', 'Disparar']

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <CardTitle>Nova campanha WhatsApp</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-6">
        {stepLabels.map((_label, i) => {
          const s = i + 1
          return (
            <div key={s} className="flex items-center gap-1.5">
              <button
                onClick={() => s < step && setStep(s)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step >= s ? 'bg-red text-white' : 'bg-white/5 text-text-muted',
                  s < step && 'cursor-pointer hover:bg-red/80',
                )}
              >
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </button>
              {i < 3 && <div className={cn('w-6 h-0.5 rounded', step > s ? 'bg-red' : 'bg-white/5')} />}
            </div>
          )
        })}
        <span className="text-xs text-text-muted ml-2">{stepLabels[step - 1]}</span>
      </div>

      {/* STEP 1: Template Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da campanha</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cadencia Odontologia D+0" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Agendar para (opcional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
          </div>
          <div className="grid md:grid-cols-[1fr,320px] gap-4">
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium block">Selecionar template</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} placeholder="Buscar template..." className={cn(inputClass, 'pl-9')} />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={cn(inputClass, 'w-auto cursor-pointer')}>
                  <option value="all">Todos</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utilidade</option>
                  <option value="AUTHENTICATION">Autenticacao</option>
                </select>
              </div>
              <div className="max-h-[260px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
                {filteredTemplates.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">Nenhum template aprovado encontrado</p>
                ) : (
                  filteredTemplates.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setTemplateName(t.name)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl transition-all cursor-pointer',
                        templateName === t.name
                          ? 'bg-red/8 border border-red/20'
                          : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-border',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text-primary">{t.name}</p>
                        <Badge variant={t.category === 'UTILITY' ? 'success' : t.category === 'MARKETING' ? 'warning' : 'info'} size="sm">
                          {t.category === 'UTILITY' ? 'Utilidade' : t.category === 'MARKETING' ? 'Marketing' : t.category}
                        </Badge>
                      </div>
                      {t.components?.find((c) => c.type === 'BODY')?.text && (
                        <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                          {t.components.find((c) => c.type === 'BODY')!.text!.slice(0, 120)}...
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-3 block">Preview</label>
              <TemplatePreview template={selectedTemplate} />
              {selectedTemplate && variableCount > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-info/5 border border-info/15">
                  <p className="text-[10px] text-info font-medium">
                    {variableCount} variavel(is) — serao preenchidas automaticamente com dados do lead
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name || !templateName} icon={<ArrowRight className="h-4 w-4" />}>
              Selecionar publico
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Audience Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/[0.02] border border-border">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Filter className="h-3.5 w-3.5" />
              Filtros:
            </div>
            <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)} className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1 text-text-primary cursor-pointer">
              <option value="all">Temperatura</option>
              {TEMPERATURES.map((t) => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
            </select>
            <select value={segFilter} onChange={(e) => setSegFilter(e.target.value)} className="text-xs bg-white/[0.04] border border-border rounded-lg px-2 py-1 text-text-primary cursor-pointer">
              <option value="all">Segmento</option>
              {SEGMENTS.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer">
              <input type="checkbox" checked={contactOnly} onChange={(e) => setContactOnly(e.target.checked)} className="accent-red w-3.5 h-3.5" />
              Somente com WhatsApp
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {filteredLeads.length} leads disponiveis</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {filteredLeads.filter((l) => l.decisorContact).length} com WhatsApp</span>
              <span className="font-semibold text-red">{selectedLeadIds.length} selecionados</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedLeadIds(filteredLeads.map((l) => l.id))} className="text-[11px] text-red cursor-pointer hover:underline">Todos</button>
              <button onClick={() => setSelectedLeadIds([])} className="text-[11px] text-text-muted cursor-pointer hover:underline">Nenhum</button>
            </div>
          </div>
          {loadingContacts ? (
            <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando contatos dos decisores...</span>
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
              {filteredLeads.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  {contactOnly ? 'Nenhum lead com WhatsApp de decisor cadastrado.' : 'Nenhum lead encontrado com os filtros atuais.'}
                </p>
              ) : (
                filteredLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                      selectedLeadIds.includes(lead.id) ? 'bg-red/8 border border-red/20' : 'bg-white/[0.02] border border-border hover:bg-white/[0.04]',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => setSelectedLeadIds((prev) => prev.includes(lead.id) ? prev.filter((x) => x !== lead.id) : [...prev, lead.id])}
                      className="accent-red w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">{lead.companyName}</p>
                        <Badge variant={lead.temperature === 'Quente' ? 'hot' : lead.temperature === 'Morno' ? 'warm' : 'cold'} size="sm">
                          {lead.temperature === 'Quente' ? 'Quente' : lead.temperature === 'Morno' ? 'Morno' : 'Frio'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-[11px] text-text-muted">{lead.segment || 'Sem segmento'}</span>
                        <span className="text-[11px] text-text-muted">Score {lead.score}</span>
                      </div>
                      {lead.decisorContact ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-success bg-success/8 px-1.5 py-0.5 rounded-md">
                            <Phone className="h-2.5 w-2.5" />
                            {lead.decisorContact.name || 'Decisor'}
                            {lead.decisorContact.role ? ` (${lead.decisorContact.role})` : ''}
                          </span>
                          {lead.decisorContact.email && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-info bg-info/8 px-1.5 py-0.5 rounded-md">
                              <Mail className="h-2.5 w-2.5" />
                              {lead.decisorContact.email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-warning mt-1 inline-block">Sem contato WhatsApp</span>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
          <div className="flex gap-2 justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => { setPrecheckResult(null); setStep(3) }} disabled={selectedLeadIds.length === 0} icon={<Shield className="h-4 w-4" />}>
              Validar ({selectedLeadIds.length} leads)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Validation + Dispatch */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Campanha</span>
              <span className="font-medium text-text-primary">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Template</span>
              <span className="font-medium text-text-primary">{templateName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Categoria</span>
              <Badge variant={selectedTemplate?.category === 'UTILITY' ? 'success' : 'warning'} size="sm">
                {selectedTemplate?.category === 'UTILITY' ? 'Utilidade' : 'Marketing'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Destinatarios</span>
              <span className="font-medium text-text-primary">{selectedLeadIds.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Envio</span>
              <span className="font-medium text-text-primary">{scheduledAt ? new Date(scheduledAt).toLocaleString('pt-BR') : 'Imediato'}</span>
            </div>
            {selectedTemplate?.category === 'UTILITY' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Custo estimado</span>
                <span className="font-medium text-success">~R$ {(selectedLeadIds.length * 0.04).toFixed(2)}</span>
              </div>
            )}
            {selectedTemplate?.category === 'MARKETING' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Custo estimado</span>
                <span className="font-medium text-warning">~R$ {(selectedLeadIds.length * 0.32).toFixed(2)}</span>
              </div>
            )}
          </div>
          {!precheckResult && (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-text-secondary">Valide os numeros antes de disparar para evitar falhas.</p>
              <Button
                icon={precheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                onClick={runPrecheck}
                loading={precheckLoading}
                variant="secondary"
              >
                {precheckLoading ? 'Validando numeros...' : 'Validar numeros (Precheck)'}
              </Button>
            </div>
          )}
          {precheckResult && (
            <div className={cn(
              'p-4 rounded-xl border',
              precheckResult.ok ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20',
            )}>
              <div className="flex items-center gap-2 mb-2">
                {precheckResult.ok ? <CheckCircle className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                <span className="text-sm font-semibold text-text-primary">
                  {precheckResult.ok ? 'Validacao OK' : 'Atencao'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold font-mono text-text-primary">{precheckResult.totals.total}</p>
                  <p className="text-[10px] text-text-muted">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-success">{precheckResult.totals.valid}</p>
                  <p className="text-[10px] text-text-muted">Validos</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-warning">{precheckResult.totals.skipped}</p>
                  <p className="text-[10px] text-text-muted">Ignorados</p>
                </div>
              </div>
            </div>
          )}
          {variableCount > 0 && (
            <div className="p-3 rounded-xl bg-info/5 border border-info/15 space-y-2">
              <p className="text-xs font-semibold text-info flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Personalizacao automatica
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">{'{{1}}'}</span>
                  <span className="text-text-primary font-medium">Nome do decisor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">{'{{2}}'}</span>
                  <span className="text-text-primary font-medium">Nome da empresa</span>
                </div>
                {variableCount >= 3 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{'{{3}}'}</span>
                    <span className="text-text-primary font-medium">Segmento</span>
                  </div>
                )}
                {variableCount >= 4 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">{'{{4}}'}</span>
                    <span className="text-text-primary font-medium">Cidade</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={handleCreate}
              loading={createCampaign.isPending || dispatch.isPending || importZapContacts.isPending}
              disabled={!precheckResult}
            >
              {scheduledAt ? 'Agendar campanha' : 'Disparar agora'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export function CampaignsPage() {
  const { data, isLoading, refetch } = useZapCampaigns()
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<ZapCampaign | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')

  const campaigns = data?.data || []

  // Filtered + sorted campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns

    // Search
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) || c.templateName.toLowerCase().includes(q),
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'delivery': return calculateDeliveryRate(b) - calculateDeliveryRate(a)
        case 'read': return calculateReadRate(b) - calculateReadRate(a)
        case 'recipients': return b.recipients - a.recipients
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })

    return filtered
  }, [campaigns, search, statusFilter, sortBy])

  // Global stats
  const globalStats = useMemo(() => {
    const total = campaigns.length
    const totalSent = campaigns.reduce((a, c) => a + c.sent, 0)
    const totalDelivered = campaigns.reduce((a, c) => a + c.delivered, 0)
    const totalRead = campaigns.reduce((a, c) => a + c.read, 0)
    const totalFailed = campaigns.reduce((a, c) => a + c.failed, 0)
    const sending = campaigns.filter((c) => c.status === 'SENDING').length
    const avgDelivery = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0
    const avgRead = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0
    return { total, totalSent, totalDelivered, totalRead, totalFailed, sending, avgDelivery, avgRead }
  }, [campaigns])

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of campaigns) counts[c.status] = (counts[c.status] || 0) + 1
    return counts
  }, [campaigns])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-14" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  // Detail view
  if (selectedCampaign) {
    return <CampaignDetail campaign={selectedCampaign} onBack={() => setSelectedCampaign(null)} />
  }

  return (
    <div className="space-y-5 animate-[fade-in_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Campanhas</h1>
          <p className="text-xs text-text-muted mt-0.5">Gerencie e acompanhe seus disparos de mensagens</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowBuilder(true)}>
          Nova campanha
        </Button>
      </div>

      {/* Wizard */}
      {showBuilder && <NewCampaignWizard onClose={() => setShowBuilder(false)} />}

      {!showBuilder && (
        <>
          {/* Filter Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campanhas..."
                className="h-10 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary pl-10 pr-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="h-10 w-10 rounded-xl bg-white/[0.03] border border-border flex items-center justify-center hover:bg-white/[0.06] transition-colors text-text-muted hover:text-text-primary"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-3 cursor-pointer focus:border-red/30 focus:outline-none"
            >
              <option value="all">Todos os Status ({campaigns.length})</option>
              <option value="SENDING">Enviando ({statusCounts.SENDING || 0})</option>
              <option value="COMPLETED">Concluido ({statusCounts.COMPLETED || 0})</option>
              <option value="DRAFT">Rascunho ({statusCounts.DRAFT || 0})</option>
              <option value="SCHEDULED">Agendada ({statusCounts.SCHEDULED || 0})</option>
              <option value="FAILED">Falhou ({statusCounts.FAILED || 0})</option>
              <option value="CANCELLED">Cancelada ({statusCounts.CANCELLED || 0})</option>
              <option value="PAUSED">Pausada ({statusCounts.PAUSED || 0})</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-3 cursor-pointer focus:border-red/30 focus:outline-none"
            >
              <option value="recent">Mais recentes</option>
              <option value="delivery">Melhor entrega</option>
              <option value="read">Melhor leitura</option>
              <option value="recipients">Mais destinatarios</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>

          {/* Campaigns Table */}
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="Nenhuma campanha ainda"
              description="Crie sua primeira cadencia WhatsApp para os leads qualificados."
              action={{ label: 'Nova campanha', onClick: () => setShowBuilder(true) }}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Nome</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Status</th>
                      <th className="text-center text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Destinatarios</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Entrega</th>
                      <th className="text-center text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Envio</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Criado em</th>
                      <th className="text-left text-[10px] uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                          Nenhuma campanha encontrada com os filtros atuais
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map((campaign) => (
                        <CampaignRow
                          key={campaign.id}
                          campaign={campaign}
                          onView={() => setSelectedCampaign(campaign)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              <div className="border-t border-border px-4 py-3 flex items-center justify-between text-[11px] text-text-muted">
                <span>{filteredCampaigns.length} de {campaigns.length} campanhas</span>
                <div className="flex items-center gap-4">
                  <span>Entrega media: <span className="font-mono font-semibold text-success">{globalStats.avgDelivery}%</span></span>
                  <span>Leitura media: <span className="font-mono font-semibold text-info">{globalStats.avgRead}%</span></span>
                  <span>Total enviadas: <span className="font-mono font-semibold text-text-primary">{globalStats.totalSent}</span></span>
                  {globalStats.sending > 0 && (
                    <span className="text-warning font-semibold">{globalStats.sending} em andamento</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
