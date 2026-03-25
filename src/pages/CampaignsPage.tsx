import { useState } from 'react'
import { useZapCampaigns, useZapTemplates, useCreateZapCampaign, useDispatchZapCampaign, usePauseZapCampaign, useCancelZapCampaign } from '../hooks/useBilinskiZap'
import { useLeads } from '../hooks/useLeads'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { cn } from '../lib/cn'
import { calculateDeliveryRate, calculateReadRate, type ZapCampaign } from '../lib/bilinskizap'
import { Smartphone, Plus, Send, Pause, X, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  SCHEDULED: { label: 'Agendada', variant: 'info' },
  SENDING: { label: 'Enviando', variant: 'warning' },
  COMPLETED: { label: 'Concluída', variant: 'success' },
  PAUSED: { label: 'Pausada', variant: 'default' },
  FAILED: { label: 'Falhou', variant: 'error' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
}

function CampaignCard({ campaign, onView }: { campaign: ZapCampaign; onView: () => void }) {
  const status = STATUS_MAP[campaign.status] || STATUS_MAP.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const readRate = calculateReadRate(campaign)

  return (
    <div
      onClick={onView}
      className="p-4 rounded-xl bg-white/[0.02] border border-border hover:border-border-strong transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-text-primary truncate">{campaign.name}</h4>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <p className="text-[11px] text-text-muted">Template: {campaign.templateName} · {campaign.recipients} destinatários</p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors shrink-0" />
      </div>

      {/* Metrics bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-text-primary">{campaign.sent}</p>
          <p className="text-[10px] text-text-muted uppercase">Enviados</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-success">{campaign.delivered}</p>
          <p className="text-[10px] text-text-muted uppercase">Entregues</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-info">{campaign.read}</p>
          <p className="text-[10px] text-text-muted uppercase">Lidos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-error">{campaign.failed}</p>
          <p className="text-[10px] text-text-muted uppercase">Falhos</p>
        </div>
      </div>

      {/* Progress bar */}
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
            <Button size="sm" variant="secondary" icon={<Pause className="h-3.5 w-3.5" />} onClick={() => pause.mutate(campaign.id)} loading={pause.isPending}>
              Pausar
            </Button>
          )}
          {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED' || campaign.status === 'SENDING') && (
            <Button size="sm" variant="danger" icon={<X className="h-3.5 w-3.5" />} onClick={() => cancel.mutate(campaign.id)} loading={cancel.isPending}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Destinatários', value: campaign.recipients, color: 'text-text-primary' },
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

      {/* Funnel visualization */}
      <Card>
        <CardTitle className="mb-4">Funil de entrega</CardTitle>
        <div className="space-y-2">
          {[
            { label: 'Destinatários', value: campaign.recipients, pct: 100, color: 'bg-text-muted' },
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

function NewCampaignWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')

  const { data: leads } = useLeads()
  const { data: templates } = useZapTemplates()
  const createCampaign = useCreateZapCampaign()
  const dispatch = useDispatchZapCampaign()

  const inputClass = 'h-11 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  const eligibleLeads = (leads || []).filter((l) => l.status !== 'Fechado' && l.status !== 'Perdido')

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    const selectedLeads = eligibleLeads.filter((l) => selectedLeadIds.includes(l.id))

    // For now, use company phone as contact (user should add decisor WhatsApp)
    const contacts = selectedLeads.map((lead) => ({
      phone: '5511999999999', // Placeholder - needs real decisor WhatsApp from Contacts
      name: lead.companyName,
      custom_fields: {
        segment: lead.segment || '',
        tier: lead.tier || '',
        leadId: lead.id,
      },
    }))

    try {
      const campaign = await createCampaign.mutateAsync({
        name,
        templateName,
        contacts,
        scheduledAt: scheduledAt || undefined,
      })

      if (!scheduledAt) {
        await dispatch.mutateAsync({ campaignId: campaign.id, templateName })
      }

      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <CardTitle>Nova campanha WhatsApp</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
              step >= s ? 'bg-red text-white' : 'bg-white/5 text-text-muted',
            )}>
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={cn('w-8 h-0.5 rounded', step > s ? 'bg-red' : 'bg-white/5')} />}
          </div>
        ))}
        <span className="text-xs text-text-muted ml-2">
          {step === 1 ? 'Configurar' : step === 2 ? 'Selecionar leads' : 'Revisar e enviar'}
        </span>
      </div>

      {/* Step 1: Config */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da campanha</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cadência Odontologia D+0" className={inputClass} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Template WhatsApp</label>
            <select value={templateName} onChange={(e) => setTemplateName(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
              <option value="">Selecione um template</option>
              {(templates || []).filter((t) => t.status === 'APPROVED').map((t) => (
                <option key={t.name} value={t.name}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Agendar para (opcional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputClass} />
          </div>
          <Button onClick={() => setStep(2)} disabled={!name || !templateName}>Próximo</Button>
        </div>
      )}

      {/* Step 2: Select leads */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{selectedLeadIds.length} de {eligibleLeads.length} leads selecionados</p>
          <div className="max-h-[300px] overflow-y-auto space-y-1.5">
            {eligibleLeads.map((lead) => (
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
                  onChange={() => toggleLead(lead.id)}
                  className="accent-red w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{lead.companyName}</p>
                  <p className="text-[11px] text-text-muted">{lead.segment} · {lead.temperature} · Score {lead.score}</p>
                </div>
                <Badge variant={lead.temperature === 'HOT' ? 'hot' : lead.temperature === 'WARM' ? 'warm' : 'cold'} size="sm">
                  {lead.temperature}
                </Badge>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => setStep(3)} disabled={selectedLeadIds.length === 0}>
              Próximo ({selectedLeadIds.length} leads)
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Campanha</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Template</span>
              <span className="font-medium">{templateName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Leads</span>
              <span className="font-medium">{selectedLeadIds.length} destinatários</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Envio</span>
              <span className="font-medium">{scheduledAt ? new Date(scheduledAt).toLocaleString('pt-BR') : 'Imediato'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-warning/8 border border-warning/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary">
              Confirme que os contatos possuem WhatsApp do <strong>decisor (CEO/dono)</strong> cadastrado antes de disparar.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={handleCreate}
              loading={createCampaign.isPending || dispatch.isPending}
            >
              {scheduledAt ? 'Agendar campanha' : 'Disparar agora'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

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
          <p className="text-xs text-text-muted mt-0.5">Cadências via BilinskiZap · API oficial do WhatsApp</p>
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setShowBuilder(true); setSelectedCampaign(null) }}>
          Nova campanha
        </Button>
      </div>

      {/* Campaign builder */}
      {showBuilder && <NewCampaignWizard onClose={() => setShowBuilder(false)} />}

      {/* Selected campaign detail */}
      {selectedCampaign && (
        <Card>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(null)} className="mb-3">
            ← Voltar para lista
          </Button>
          <CampaignDetail campaign={selectedCampaign} />
        </Card>
      )}

      {/* Campaigns list */}
      {!selectedCampaign && !showBuilder && (
        <>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="Nenhuma campanha ainda"
              description="Crie sua primeira cadência WhatsApp para os leads qualificados."
              action={{ label: 'Nova campanha', onClick: () => setShowBuilder(true) }}
            />
          ) : (
            <div className="space-y-3">
              {/* Summary KPIs */}
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
