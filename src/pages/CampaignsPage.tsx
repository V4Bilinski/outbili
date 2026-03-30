import { useState, useEffect, useMemo } from 'react'
import { useZapCampaigns, useZapTemplates, useCreateZapCampaign, useDispatchZapCampaign, usePauseZapCampaign, useCancelZapCampaign, useImportZapContacts } from '../hooks/useBilinskiZap'
import { useLeads } from '../hooks/useLeads'
import { getContacts } from '../services/contactService'
import { precheckCampaign, type ZapTemplate } from '../lib/bilinskizap'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { cn } from '../lib/cn'
import { calculateDeliveryRate, calculateReadRate, type ZapCampaign } from '../lib/bilinskizap'
import { SEGMENTS, TEMPERATURES } from '../lib/constants'
import type { Lead, Contact } from '../types'
import {
  Smartphone, Plus, Send, Pause, X, CheckCircle, AlertTriangle,
  ChevronRight, Filter, Users, Zap, Search, Shield, ArrowRight,
  Phone, Mail, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  SCHEDULED: { label: 'Agendada', variant: 'info' },
  SENDING: { label: 'Enviando', variant: 'warning' },
  COMPLETED: { label: 'Concluida', variant: 'success' },
  PAUSED: { label: 'Pausada', variant: 'default' },
  FAILED: { label: 'Falhou', variant: 'error' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
}

// --- Campaign Card ---
function CampaignCard({ campaign, onView }: { campaign: ZapCampaign; onView: () => void }) {
  const status = STATUS_MAP[campaign.status] || STATUS_MAP.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const readRate = calculateReadRate(campaign)

  return (
    <div onClick={onView} className="p-4 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-text-primary truncate">{campaign.name}</h4>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <p className="text-[11px] text-text-muted">Template: {campaign.templateName} · {campaign.recipients} destinatarios</p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { v: campaign.sent, l: 'Enviados', c: '' },
          { v: campaign.delivered, l: 'Entregues', c: 'text-success' },
          { v: campaign.read, l: 'Lidos', c: 'text-info' },
          { v: campaign.failed, l: 'Falhos', c: 'text-error' },
        ].map((m) => (
          <div key={m.l} className="text-center">
            <p className={`text-lg font-bold font-mono ${m.c || 'text-text-primary'}`}>{m.v}</p>
            <p className="text-[10px] text-text-muted uppercase">{m.l}</p>
          </div>
        ))}
      </div>
      {campaign.recipients > 0 && (
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden flex">
          <div className="h-full bg-success" style={{ width: `${(campaign.delivered / campaign.recipients) * 100}%` }} />
          <div className="h-full bg-info" style={{ width: `${(campaign.read / campaign.recipients) * 100}%` }} />
          <div className="h-full bg-error" style={{ width: `${(campaign.failed / campaign.recipients) * 100}%` }} />
        </div>
      )}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
        <span>Entrega: <span className="text-text-secondary font-mono">{deliveryRate}%</span></span>
        <span>Leitura: <span className="text-text-secondary font-mono">{readRate}%</span></span>
        {campaign.scheduledAt && <span>Agendada: {new Date(campaign.scheduledAt).toLocaleDateString('pt-BR')}</span>}
      </div>
    </div>
  )
}

// --- Campaign Detail ---
function CampaignDetail({ campaign }: { campaign: ZapCampaign }) {
  const pause = usePauseZapCampaign()
  const cancel = useCancelZapCampaign()
  const status = STATUS_MAP[campaign.status] || STATUS_MAP.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const readRate = calculateReadRate(campaign)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-heading">{campaign.name}</h2>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Template: {campaign.templateName} · Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'SENDING' && (
            <Button size="sm" variant="secondary" icon={<Pause className="h-3.5 w-3.5" />} onClick={() => pause.mutate(campaign.id)} loading={pause.isPending}>Pausar</Button>
          )}
          {['DRAFT', 'SCHEDULED', 'SENDING'].includes(campaign.status) && (
            <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => cancel.mutate(campaign.id)} loading={cancel.isPending}>Cancelar</Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Destinatarios', value: campaign.recipients, color: 'text-text-primary' },
          { label: 'Enviados', value: campaign.sent, color: 'text-text-primary' },
          { label: 'Entregues', value: campaign.delivered, color: 'text-success', sub: `${deliveryRate}%` },
          { label: 'Lidos', value: campaign.read, color: 'text-info', sub: `${readRate}%` },
          { label: 'Falharam', value: campaign.failed, color: 'text-error' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
            <p className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-text-muted uppercase mt-0.5">{kpi.label}</p>
            {kpi.sub && <p className="text-xs font-mono text-text-secondary">{kpi.sub}</p>}
          </div>
        ))}
      </div>
      <Card>
        <CardTitle className="mb-4">Funil de entrega</CardTitle>
        <div className="space-y-2">
          {[
            { label: 'Destinatarios', value: campaign.recipients, pct: 100, color: 'bg-text-muted' },
            { label: 'Enviados', value: campaign.sent, pct: campaign.recipients ? (campaign.sent / campaign.recipients) * 100 : 0, color: 'bg-warning' },
            { label: 'Entregues', value: campaign.delivered, pct: campaign.recipients ? (campaign.delivered / campaign.recipients) * 100 : 0, color: 'bg-success' },
            { label: 'Lidos', value: campaign.read, pct: campaign.recipients ? (campaign.read / campaign.recipients) * 100 : 0, color: 'bg-info' },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-24 text-right">{step.label}</span>
              <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
                <div className={`h-full rounded-lg ${step.color} transition-all duration-500`} style={{ width: `${step.pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold text-white">
                  {step.value} ({Math.round(step.pct)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// --- Template Preview ---
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

// --- Lead + Contact type for wizard ---
type LeadWithContact = Lead & {
  decisorContact?: Contact
  allContacts: Contact[]
}

// --- New Campaign Wizard (4 steps) ---
function NewCampaignWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(`Campanha ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}`)
  const [templateName, setTemplateName] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filters
  const [tempFilter, setTempFilter] = useState<string>('all')
  const [segFilter, setSegFilter] = useState<string>('all')
  const [contactOnly, setContactOnly] = useState(true)

  // Contacts loaded for leads
  const [leadsWithContacts, setLeadsWithContacts] = useState<LeadWithContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  // Precheck
  const [precheckResult, setPrecheckResult] = useState<{ ok: boolean; totals: { total: number; valid: number; skipped: number } } | null>(null)
  const [precheckLoading, setPrecheckLoading] = useState(false)

  const { data: leads } = useLeads()
  const { data: templates } = useZapTemplates()
  const createCampaign = useCreateZapCampaign()
  const dispatch = useDispatchZapCampaign()
  const importZapContacts = useImportZapContacts()

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  // Load contacts for all leads
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

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leadsWithContacts.filter((l) => {
      if (l.status === 'Fechado' || l.status === 'Perdido') return false
      if (contactOnly && !l.decisorContact) return false
      if (tempFilter !== 'all' && l.temperature !== tempFilter) return false
      if (segFilter !== 'all' && !l.segment?.toLowerCase().includes(segFilter.toLowerCase())) return false
      return true
    })
  }, [leadsWithContacts, contactOnly, tempFilter, segFilter])

  // Selected template
  const selectedTemplate = useMemo(() => {
    return (templates || []).find((t) => t.name === templateName) || null
  }, [templates, templateName])

  // Template variable count
  const variableCount = useMemo(() => {
    if (!selectedTemplate) return 0
    const body = selectedTemplate.components?.find((c) => c.type === 'BODY')?.text || ''
    const matches = body.match(/\{\{\d+\}\}/g)
    return matches?.length || 0
  }, [selectedTemplate])

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let t = (templates || []).filter((t) => t.status === 'APPROVED')
    if (categoryFilter !== 'all') t = t.filter((x) => x.category === categoryFilter)
    if (templateSearch) t = t.filter((x) => x.name.toLowerCase().includes(templateSearch.toLowerCase()))
    return t
  }, [templates, categoryFilter, templateSearch])

  // Build contacts for dispatch
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

  // Run precheck
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

  // Create + dispatch
  const handleCreate = async () => {
    const contacts = buildContacts()
    if (contacts.length === 0) {
      toast.error('Nenhum contato valido para enviar')
      return
    }

    try {
      // 1. Sync contacts to BilinskiZap
      await importZapContacts.mutateAsync(
        contacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          tags: [c.custom_fields.segment, c.custom_fields.tier].filter(Boolean),
          custom_fields: c.custom_fields,
        })),
      )

      // 2. Create campaign
      const campaign = await createCampaign.mutateAsync({
        name,
        templateName,
        contacts,
        scheduledAt: scheduledAt || undefined,
      })

      // 3. Dispatch if immediate
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

      {/* ===== STEP 1: Template Selection ===== */}
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
            {/* Template selector */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium block">Selecionar template</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Buscar template..."
                    className={cn(inputClass, 'pl-9')}
                  />
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

            {/* Preview */}
            <div>
              <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-3 block">Preview</label>
              <TemplatePreview template={selectedTemplate} />
              {selectedTemplate && variableCount > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-info/5 border border-info/15">
                  <p className="text-[10px] text-info font-medium">
                    {variableCount} variavel(is) — serao preenchidas automaticamente com dados do lead (nome, empresa, segmento)
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

      {/* ===== STEP 2: Audience Selection ===== */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Filters */}
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

          {/* Stats */}
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

          {/* Lead list */}
          {loadingContacts ? (
            <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando contatos dos decisores...</span>
            </div>
          ) : (
            <div className="max-h-[340px] overflow-y-auto space-y-1.5 rounded-xl border border-border p-2">
              {filteredLeads.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  {contactOnly ? 'Nenhum lead com WhatsApp de decisor cadastrado. Enriqueca os leads primeiro.' : 'Nenhum lead encontrado com os filtros atuais.'}
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
                      {/* Contact info */}
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

      {/* ===== STEP 3: Validation (Precheck) ===== */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary */}
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

          {/* Precheck */}
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

          {/* Variable mapping info */}
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

// --- Main Page ---
export function CampaignsPage() {
  const { data, isLoading } = useZapCampaigns()
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<ZapCampaign | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  const campaigns = data?.data || []

  return (
    <div className="space-y-5 animate-[fade-in_0.4s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Campanhas WhatsApp</h1>
          <p className="text-xs text-text-muted mt-0.5">Cadencias via BilinskiZap · API oficial do WhatsApp</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setShowBuilder(true); setSelectedCampaign(null) }}>
          Nova campanha
        </Button>
      </div>

      {showBuilder && <NewCampaignWizard onClose={() => setShowBuilder(false)} />}

      {selectedCampaign && (
        <Card>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(null)} className="mb-3">
            ← Voltar para lista
          </Button>
          <CampaignDetail campaign={selectedCampaign} />
        </Card>
      )}

      {!selectedCampaign && !showBuilder && (
        <>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="Nenhuma campanha ainda"
              description="Crie sua primeira cadencia WhatsApp para os leads qualificados."
              action={{ label: 'Nova campanha', onClick: () => setShowBuilder(true) }}
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                  <p className="text-2xl font-bold font-mono">{campaigns.length}</p>
                  <p className="text-[10px] text-text-muted uppercase">Campanhas</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                  <p className="text-2xl font-bold font-mono text-success">{campaigns.reduce((a, c) => a + c.delivered, 0)}</p>
                  <p className="text-[10px] text-text-muted uppercase">Total entregues</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                  <p className="text-2xl font-bold font-mono text-info">{campaigns.reduce((a, c) => a + c.read, 0)}</p>
                  <p className="text-[10px] text-text-muted uppercase">Total lidos</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-border text-center">
                  <p className="text-2xl font-bold font-mono">{campaigns.filter((c) => c.status === 'SENDING').length}</p>
                  <p className="text-[10px] text-text-muted uppercase">Em envio</p>
                </div>
              </div>
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} onView={() => setSelectedCampaign(campaign)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
