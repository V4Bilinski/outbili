import { useState, useEffect, useMemo } from 'react'
import { useZapCampaigns, useZapCampaignMessages, useZapTemplates, useCreateZapCampaign, useDispatchZapCampaign, usePauseZapCampaign, useResumeZapCampaign, useCancelZapCampaign, useImportZapContacts } from '../hooks/useBilinskiZap'
import { useCampaignMetas, useSaveCampaignMeta } from '../hooks/useCampaignMeta'
import { useLeads } from '../hooks/useLeads'
import { getContacts } from '../services/contactService'
import { precheckCampaign, calculateDeliveryRate, calculateReadRate, type ZapCampaign, type ZapTemplate } from '../lib/bilinskizap'
import { VARIABLE_FIELD_OPTIONS, DEFAULT_VARIABLE_MAPPING, resolveVariables, resolveVariableLabel } from '../lib/template-variables'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'
import { cn } from '../lib/cn'
import { SEGMENTS, TEMPERATURES } from '../lib/constants'
import type { Lead, Contact, CampaignMeta } from '../types'
import { CadenceBuilder, type CadenceStep } from '../components/campaigns/CadenceBuilder'
import {
  Smartphone, Plus, Send, Pause, Play, X, CheckCircle, AlertTriangle,
  Filter, Users, Zap, Search, Shield, ArrowRight, Download,
  Phone, Mail, Loader2, RefreshCw, Copy, Trash2, Clock, Eye,
  ArrowLeft, CircleAlert, Target,
} from 'lucide-react'
import { toast } from 'sonner'

// --- Status Config ---
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  SCHEDULED: { label: 'Agendada', variant: 'info' },
  SENDING: { label: 'Enviando', variant: 'warning' },
  COMPLETED: { label: 'Concluída', variant: 'success' },
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
function CampaignRow({ campaign, meta, onView, onDuplicate, onDelete }: { campaign: ZapCampaign; meta?: CampaignMeta; onView: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT
  const deliveryRate = calculateDeliveryRate(campaign)
  const sendTime = campaign.startedAt && campaign.completedAt
    ? `${Math.round((new Date(campaign.completedAt).getTime() - new Date(campaign.startedAt).getTime()) / 1000)}s`
    : campaign.startedAt ? 'Enviando agora...' : '-'

  const topSegments = meta?.segmentBreakdown
    ? Object.entries(meta.segmentBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : []

  return (
    <tr
      onClick={onView}
      className="border-b border-border hover:bg-white/[0.02] cursor-pointer transition-colors group"
    >
      {/* Nome + Template + Segmentos PESCA */}
      <td className="py-4 px-4">
        <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{campaign.name}</p>
        <p className="text-label text-text-muted mt-0.5">
          {campaign.templateName}
          {meta && ` · ${meta.totalLeadsTargeted} leads`}
        </p>
        {topSegments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {topSegments.map(([seg, count]) => (
              <span key={seg} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] text-caption text-text-muted">
                {seg} ({count})
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <Badge variant={status.variant} size="xs">{status.label}</Badge>
      </td>

      {/* Destinatários */}
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

      {/* Ações */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            title="Duplicar"
          >
            <Copy className="h-4 w-4" />
          </button>
          {['COMPLETED', 'FAILED', 'CANCELLED'].includes(campaign.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ============================================================
// CAMPAIGN DETAIL — KPIs + Velocity + Logs
// ============================================================
function CampaignDetail({ campaign, meta, onBack }: { campaign: ZapCampaign; meta?: CampaignMeta; onBack: () => void }) {
  const { data: messagesData, isLoading: loadingMessages } = useZapCampaignMessages(campaign.id)
  const pause = usePauseZapCampaign()
  const resume = useResumeZapCampaign()
  const cancel = useCancelZapCampaign()
  const [logSearch, setLogSearch] = useState('')
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all')
  const [logPage, setLogPage] = useState(1)
  const LOG_PAGE_SIZE = 50

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
      label: 'Enviadas', value: campaign.sent, sub: `${campaign.recipients} destinatários`,
      icon: <Send className="h-5 w-5" />, borderColor: 'border-text-muted/20', iconColor: 'text-text-muted',
    },
    {
      label: 'Entregues', value: campaign.delivered, sub: `${deliveryRate}% taxa de entrega${campaign.sent - campaign.delivered > 0 ? ` - ${campaign.sent - campaign.delivered} não entregues` : ''}`,
      icon: <CheckCircle className="h-5 w-5" />, borderColor: 'border-success/30', iconColor: 'text-success',
    },
    {
      label: 'Lidas', value: campaign.read, sub: campaign.read > 0 ? `${readRate}% taxa de leitura` : 'Aguardando webhook',
      icon: <Eye className="h-5 w-5" />, borderColor: 'border-info/30', iconColor: 'text-info',
    },
    {
      label: 'Ignoradas', value: stats?.skipped || 0, sub: 'Ignoradas pelo pré-check (telefone inválido ou template incompleto)',
      icon: <CircleAlert className="h-5 w-5" />, borderColor: 'border-warning/30', iconColor: 'text-warning',
    },
    {
      label: 'Falhas', value: campaign.failed, sub: 'Falhas de envio (número inválido, bloqueado ou indisponível)',
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
          {campaign.status === 'PAUSED' && (
            <Button size="sm" variant="primary" icon={<Play className="h-3.5 w-3.5" />} onClick={() => resume.mutate(campaign.id)} loading={resume.isPending}>
              Retomar
            </Button>
          )}
          {['DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED'].includes(campaign.status) && (
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
            <p className="text-label text-text-muted mt-1 leading-tight">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Leads PESCA Alvo */}
      {meta && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red" />
              <CardTitle>Leads PESCA Alvo</CardTitle>
            </div>
            <Badge variant="outline" size="sm">{meta.totalLeadsTargeted} leads</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {/* Segmentos */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-xs text-text-muted font-medium mb-2">Segmentos</p>
              <div className="space-y-1.5">
                {Object.entries(meta.segmentBreakdown).length > 0
                  ? Object.entries(meta.segmentBreakdown).sort((a, b) => b[1] - a[1]).map(([seg, count]) => (
                    <div key={seg} className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{seg}</span>
                      <span className="text-sm font-mono text-text-secondary">{count}</span>
                    </div>
                  ))
                  : <p className="text-label text-text-muted">Sem dados</p>
                }
              </div>
            </div>
            {/* Tiers */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-xs text-text-muted font-medium mb-2">Tiers</p>
              <div className="space-y-1.5">
                {Object.entries(meta.tierBreakdown).length > 0
                  ? Object.entries(meta.tierBreakdown).sort((a, b) => b[1] - a[1]).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{tier}</span>
                      <span className="text-sm font-mono text-text-secondary">{count}</span>
                    </div>
                  ))
                  : <p className="text-label text-text-muted">Sem dados</p>
                }
              </div>
            </div>
            {/* Mapeamento de variáveis */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
              <p className="text-xs text-text-muted font-medium mb-2">Variáveis do template</p>
              <div className="space-y-1.5">
                {Object.entries(meta.variableMapping).map(([num, field]) => (
                  <div key={num} className="flex items-center gap-2">
                    <span className="text-sm font-mono text-text-muted">{`{{${num}}}`}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-sm text-text-primary">{resolveVariableLabel(field)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {meta.filters && (meta.filters.temperature || meta.filters.segment) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-label text-text-muted">Filtros aplicados:</span>
              {meta.filters.temperature && <Badge variant="default" size="sm">Temp: {meta.filters.temperature}</Badge>}
              {meta.filters.segment && <Badge variant="default" size="sm">Seg: {meta.filters.segment}</Badge>}
              {meta.filters.contactOnly && <Badge variant="default" size="sm">Somente c/ WhatsApp</Badge>}
            </div>
          )}
        </Card>
      )}

      {/* Velocidade do disparo */}
      {velocity && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Velocidade do disparo</CardTitle>
              <p className="text-label text-text-muted mt-0.5">Conta apenas o período do primeiro envio até o último envio (sent-only).</p>
            </div>
            <Badge variant="outline" size="sm">DADOS: AVANÇADOS</Badge>
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
                  <p className="text-label text-text-muted mt-1">Baseline (mediana): 1.30 msg/s</p>
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
                  <p className="text-label text-text-muted mt-1">Do primeiro envio até o último envio</p>
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
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-label font-mono text-text-secondary">{messages.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Buscar destinatário..."
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
              onClick={() => {
                if (messages.length === 0) { toast.error('Nenhum log para exportar'); return }
                const header = 'Destinatário,Telefone,Status,Enviado em,Lido em,Erro\n'
                const rows = filteredMessages.map((m) =>
                  [m.contactName || '', m.contactPhone || '', m.status, m.sentAt || '', m.readAt || '', m.error || '']
                    .map(v => `"${String(v).replace(/"/g, '""')}"`)
                    .join(','),
                ).join('\n')
                const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `logs-${campaign.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
                toast.success(`${filteredMessages.length} registros exportados`)
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" />
            </button>
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Destinatário</th>
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Telefone</th>
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Status</th>
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Horário</th>
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Info</th>
                    <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE).map((msg) => {
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
            {filteredMessages.length > LOG_PAGE_SIZE && (
              <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                <span className="text-label text-text-muted">
                  {(logPage - 1) * LOG_PAGE_SIZE + 1}–{Math.min(logPage * LOG_PAGE_SIZE, filteredMessages.length)} de {filteredMessages.length}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage === 1}
                    className="px-3 py-1 rounded-lg text-xs bg-white/[0.03] border border-border text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-xs text-text-muted font-mono">
                    {logPage}/{Math.ceil(filteredMessages.length / LOG_PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => setLogPage(p => Math.min(Math.ceil(filteredMessages.length / LOG_PAGE_SIZE), p + 1))}
                    disabled={logPage >= Math.ceil(filteredMessages.length / LOG_PAGE_SIZE)}
                    className="px-3 py-1 rounded-lg text-xs bg-white/[0.03] border border-border text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.06] transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// TEMPLATE PREVIEW
// ============================================================
function TemplatePreview({ template, sampleLead, variableMapping }: { template: ZapTemplate | null; sampleLead?: Lead & { decisorContact?: Contact }; variableMapping?: Record<string, string> }) {
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
          <p className="text-caption text-text-muted">Preview do template</p>
        </div>
        <Badge variant="info" size="sm" className="ml-auto">{template.category}</Badge>
      </div>
      <div className="rounded-xl bg-[#1F2C34] p-3 space-y-2">
        {header?.text && <p className="text-sm font-semibold text-text-primary">{header.text}</p>}
        {header?.format === 'IMAGE' && <div className="h-32 rounded-lg bg-white/5 flex items-center justify-center text-text-muted text-xs">Imagem</div>}
        {body?.text && (
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {body.text.replace(/\{\{(\d+)\}\}/g, (_: string, n: string) => {
              if (!sampleLead) return `[${resolveVariableLabel((variableMapping || DEFAULT_VARIABLE_MAPPING)[n] || '')}]`
              const mapping = variableMapping || DEFAULT_VARIABLE_MAPPING
              const resolved = resolveVariables(mapping, sampleLead as Lead & { decisorContact?: Contact })
              return resolved[n] || `[Variável ${n}]`
            })}
          </p>
        )}
        {footer?.text && <p className="text-label text-text-muted italic">{footer.text}</p>}
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
      <p className="text-micro text-text-muted text-center mt-2">Status: {template.status}</p>
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

function NewCampaignWizard({ onClose, initialTemplate }: { onClose: () => void; initialTemplate?: string }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(`Campanha ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}`)
  const [templateName, setTemplateName] = useState(initialTemplate || '')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [templateSearch, setTemplateSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tempFilter, setTempFilter] = useState<string>('all')
  const [segFilter, setSegFilter] = useState<string>('all')
  const [contactOnly, setContactOnly] = useState(true)
  const [leadsWithContacts, setLeadsWithContacts] = useState<LeadWithContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [precheckResult, setPrecheckResult] = useState<{ ok: boolean; totals: { total: number; valid: number; skipped: number } } | null>(null)
  const [precheckLoading, setPrecheckLoading] = useState(false)
  const [isCadence, setIsCadence] = useState(false)
  const [isABTest, setIsABTest] = useState(false)
  const [templateNameB, setTemplateNameB] = useState('')
  const [abSplit, setAbSplit] = useState(50)
  const [cadenceSteps, setCadenceSteps] = useState<CadenceStep[]>([
    { id: 'step-1', templateName: '', delayHours: 0, condition: 'always' as const },
  ])
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({ ...DEFAULT_VARIABLE_MAPPING })

  const { data: leads } = useLeads()
  const { data: templates } = useZapTemplates()
  const { data: recentCampaignsData } = useZapCampaigns()
  const createCampaign = useCreateZapCampaign()
  const dispatch = useDispatchZapCampaign()
  const importZapContacts = useImportZapContacts()
  const saveMeta = useSaveCampaignMeta()

  // Cooldown: check if recent campaigns exist (for warning display)
  const hasRecentCampaigns = useMemo(() => {
    const campaigns = recentCampaignsData?.data || []
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return campaigns.some(c => c.status === 'COMPLETED' && c.completedAt && new Date(c.completedAt).getTime() > cutoff)
  }, [recentCampaignsData])

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
      toast.error('Nenhum contato válido para enviar')
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

      // Salvar metadados PESCA vinculados à campanha
      const selectedLeads = leadsWithContacts.filter((l) => selectedLeadIds.includes(l.id))
      const segmentBreakdown: Record<string, number> = {}
      const tierBreakdown: Record<string, number> = {}
      for (const lead of selectedLeads) {
        const seg = lead.segment || 'Sem segmento'
        const tier = lead.tier || 'Sem tier'
        segmentBreakdown[seg] = (segmentBreakdown[seg] || 0) + 1
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1
      }

      saveMeta.mutate({
        zapCampaignId: campaign.id,
        leadIds: selectedLeadIds,
        templateName,
        variableMapping,
        filters: {
          temperature: tempFilter !== 'all' ? tempFilter : undefined,
          segment: segFilter !== 'all' ? segFilter : undefined,
          contactOnly,
        },
        totalLeadsTargeted: selectedLeadIds.length,
        segmentBreakdown,
        tierBreakdown,
      })

      if (!scheduledAt) {
        await dispatch.mutateAsync({ campaignId: campaign.id, templateName })
      }
      toast.success(scheduledAt ? 'Campanha agendada!' : 'Campanha disparada!')
      onClose()
    } catch {
      // Error handled by mutations
    }
  }

  const stepLabels = ['Template', 'Público', 'Validação', 'Disparar']

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <CardTitle>Nova campanha WhatsApp</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Step indicator — labels visiveis em cada step */}
      <div className="flex items-center mb-6">
        {stepLabels.map((label, i) => {
          const s = i + 1
          const isActive = step === s
          const isDone = step > s
          return (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => s < step && setStep(s)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    isDone ? 'bg-success text-white cursor-pointer hover:bg-success/80' : isActive ? 'bg-red text-white ring-2 ring-red/30' : 'bg-white/5 text-text-muted',
                  )}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : s}
                </button>
                <span className={cn('text-caption font-medium transition-colors whitespace-nowrap', isActive ? 'text-red' : isDone ? 'text-success' : 'text-text-muted')}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && <div className={cn('h-0.5 flex-1 rounded mx-2 mt-[-14px]', isDone ? 'bg-success' : 'bg-white/5')} />}
            </div>
          )
        })}
      </div>

      {/* STEP 1: Template Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da campanha</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cadência Odontologia D+0" className={inputClass} />
          </div>
          <div>
            <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Agendar para (opcional)</label>
            <div className="flex gap-2">
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={cn(inputClass, 'flex-1')} />
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={cn(inputClass, 'w-auto min-w-[200px]')}>
                <option value="America/Sao_Paulo">Brasilia (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Belem">Belem (GMT-3)</option>
                <option value="America/Recife">Recife (GMT-3)</option>
                <option value="America/Cuiaba">Cuiaba (GMT-4)</option>
                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
              </select>
            </div>
            {scheduledAt && (
              <p className="text-caption text-text-muted mt-1">
                Destinatarios receberao no horario de {timezone.split('/')[1].replace('_', ' ')}
              </p>
            )}
          </div>
          {/* Campaign mode toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border">
            <span className="text-label text-text-muted">Tipo:</span>
            <button
              onClick={() => setIsCadence(false)}
              className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', !isCadence ? 'bg-red/10 text-red' : 'text-text-secondary hover:text-text-primary')}
            >
              Campanha simples
            </button>
            <button
              onClick={() => setIsCadence(true)}
              className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors', isCadence ? 'bg-red/10 text-red' : 'text-text-secondary hover:text-text-primary')}
            >
              Cadencia (multi-step)
            </button>
          </div>

          {/* Cadence builder (when cadence mode is active) */}
          {isCadence && (
            <CadenceBuilder
              steps={cadenceSteps}
              onStepsChange={(newSteps) => {
                setCadenceSteps(newSteps)
                if (newSteps.length > 0 && newSteps[0].templateName) setTemplateName(newSteps[0].templateName)
              }}
              templates={templates || []}
            />
          )}

          {/* Simple campaign template selector (when not cadence) */}
          {!isCadence && (
          <div className="grid md:grid-cols-[1fr,320px] gap-4">
            <div className="space-y-3">
              <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium block">Selecionar template</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} placeholder="Buscar template..." className={cn(inputClass, 'pl-9')} />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={cn(inputClass, 'w-auto cursor-pointer')}>
                  <option value="all">Todos</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utilidade</option>
                  <option value="AUTHENTICATION">Autenticação</option>
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
                        <p className="text-label text-text-muted mt-1 line-clamp-2">
                          {t.components.find((c) => c.type === 'BODY')!.text!.slice(0, 120)}...
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-label uppercase tracking-[0.1em] text-text-muted font-medium mb-3 block">Preview</label>
              <TemplatePreview template={selectedTemplate} sampleLead={selectedLeadIds.length > 0 ? leadsWithContacts.find(l => l.id === selectedLeadIds[0]) : undefined} variableMapping={variableMapping} />
              {selectedTemplate && variableCount > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-info/5 border border-info/15">
                  <p className="text-caption text-info font-medium">
                    {variableCount} variável(is) — serão preenchidas automaticamente com dados do lead
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* A/B Test toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border">
            <label className="flex items-center gap-2 text-[12px] text-text-primary cursor-pointer">
              <input type="checkbox" checked={isABTest} onChange={(e) => setIsABTest(e.target.checked)} className="accent-red w-3.5 h-3.5" />
              Teste A/B
            </label>
            {isABTest && (
              <span className="text-caption text-text-muted">Divide o público em dois grupos com templates diferentes</span>
            )}
          </div>

          {/* A/B Template B selector */}
          {isABTest && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-label font-semibold text-text-primary">Variante B</span>
                <div className="flex items-center gap-2 text-caption">
                  <span className="text-text-muted">A: {abSplit}%</span>
                  <input type="range" min={20} max={80} step={10} value={abSplit} onChange={(e) => setAbSplit(Number(e.target.value))} className="w-20 accent-red" />
                  <span className="text-text-muted">B: {100 - abSplit}%</span>
                </div>
              </div>
              <select
                value={templateNameB}
                onChange={(e) => setTemplateNameB(e.target.value)}
                className="h-10 w-full rounded-xl bg-white/[0.03] border border-border text-sm text-text-primary px-3 cursor-pointer focus:border-red/30 focus:outline-none"
              >
                <option value="">Selecionar template B...</option>
                {filteredTemplates.filter(t => t.name !== templateName).map(t => (
                  <option key={t.name} value={t.name}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!name || (!isCadence && !templateName) || (isCadence && cadenceSteps.some(s => !s.templateName)) || (isABTest && !templateNameB)} icon={<ArrowRight className="h-4 w-4" />}>
              Selecionar público
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
          <div className="p-2.5 rounded-lg bg-info/5 border border-info/15">
            <p className="text-caption text-info">
              <Shield className="inline h-3 w-3 mr-1" />
              Contatos com opt-out serão filtrados automaticamente na etapa de validação (Precheck).
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {filteredLeads.length} leads disponíveis</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {filteredLeads.filter((l) => l.decisorContact).length} com WhatsApp</span>
              <span className="font-semibold text-red">{selectedLeadIds.length} selecionados</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedLeadIds(filteredLeads.map((l) => l.id))} className="text-label text-red cursor-pointer hover:underline">Todos</button>
              <button onClick={() => setSelectedLeadIds([])} className="text-label text-text-muted cursor-pointer hover:underline">Nenhum</button>
            </div>
          </div>
          {/* Cooldown warning */}
          {hasRecentCampaigns && (
            <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/15">
              <p className="text-caption text-warning">
                <Clock className="inline h-3 w-3 mr-1" />
                Campanhas concluidas nas ultimas 24h detectadas. Contatos duplicados serao filtrados no Precheck para evitar spam.
              </p>
            </div>
          )}
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
                        <span className="text-label text-text-muted">{lead.segment || 'Segmento pendente'}</span>
                        <span className="text-label text-text-muted">Score {lead.score}</span>
                      </div>
                      {lead.decisorContact ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-caption text-success bg-success/8 px-1.5 py-0.5 rounded-md">
                            <Phone className="h-2.5 w-2.5" />
                            {lead.decisorContact.name || 'Decisor'}
                            {lead.decisorContact.role ? ` (${lead.decisorContact.role})` : ''}
                          </span>
                          {lead.decisorContact.email && (
                            <span className="inline-flex items-center gap-1 text-caption text-info bg-info/8 px-1.5 py-0.5 rounded-md">
                              <Mail className="h-2.5 w-2.5" />
                              {lead.decisorContact.email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-caption text-warning mt-1 inline-block">Sem contato WhatsApp</span>
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
              <span className="text-text-muted">Destinatários</span>
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
              <p className="text-sm text-text-secondary">Valide os números antes de disparar para evitar falhas.</p>
              <Button
                icon={precheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                onClick={runPrecheck}
                loading={precheckLoading}
                variant="secondary"
              >
                {precheckLoading ? 'Validando números...' : 'Validar números (Precheck)'}
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
                  {precheckResult.ok ? 'Validação OK' : 'Atenção'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold font-mono text-text-primary">{precheckResult.totals.total}</p>
                  <p className="text-caption text-text-muted">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-success">{precheckResult.totals.valid}</p>
                  <p className="text-caption text-text-muted">Válidos</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono text-warning">{precheckResult.totals.skipped}</p>
                  <p className="text-caption text-text-muted">Ignorados</p>
                </div>
              </div>
            </div>
          )}
          {variableCount > 0 && (
            <div className="p-3 rounded-xl bg-info/5 border border-info/15 space-y-2">
              <p className="text-xs font-semibold text-info flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Personalização — mapeamento de variáveis
              </p>
              <div className="space-y-1.5">
                {Array.from({ length: variableCount }, (_, i) => i + 1).map(n => (
                  <div key={n} className="flex items-center gap-2 text-label">
                    <span className="text-text-muted font-mono w-10 shrink-0">{`{{${n}}}`}</span>
                    <span className="text-text-muted">→</span>
                    <select
                      value={variableMapping[String(n)] || 'decisorName'}
                      onChange={(e) => setVariableMapping((prev) => ({ ...prev, [String(n)]: e.target.value }))}
                      className="flex-1 h-7 rounded-lg bg-white/[0.03] border border-border text-label text-text-primary px-2 cursor-pointer focus:border-red/30 focus:outline-none"
                    >
                      {VARIABLE_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
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
  const { data: metas, isLoading: metasLoading } = useCampaignMetas()
  const cancelCampaign = useCancelZapCampaign()
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<ZapCampaign | null>(null)
  const [duplicateTemplate, setDuplicateTemplate] = useState<string>('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')

  const allCampaigns = data?.data || []

  // Map campaign ID -> meta (deve vir antes de campaigns)
  const metaMap = useMemo(() => {
    const map = new Map<string, CampaignMeta>()
    for (const m of metas || []) map.set(m.zapCampaignId, m)
    return map
  }, [metas])

  // Somente campanhas vinculadas a leads PESCA (com CampaignMeta)
  const campaigns = useMemo(() => {
    return allCampaigns.filter((c) => metaMap.has(c.id))
  }, [allCampaigns, metaMap])

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

  // PESCA stats
  const pescaStats = useMemo(() => {
    const allMetas = metas || []
    const totalLeads = new Set(allMetas.flatMap((m) => m.leadIds)).size
    const allSegments = new Set<string>()
    for (const m of allMetas) {
      for (const seg of Object.keys(m.segmentBreakdown)) allSegments.add(seg)
    }
    const templateUsage: Record<string, number> = {}
    for (const m of allMetas) templateUsage[m.templateName] = (templateUsage[m.templateName] || 0) + 1
    const topTemplate = Object.entries(templateUsage).sort((a, b) => b[1] - a[1])[0]
    return { totalLeads, segmentCount: allSegments.size, topTemplate: topTemplate?.[0] || '-' }
  }, [metas])

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

  if (isLoading || metasLoading) {
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
    return <CampaignDetail campaign={selectedCampaign} meta={metaMap.get(selectedCampaign.id)} onBack={() => setSelectedCampaign(null)} />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <AnimateIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading gradient-text">Campanhas BilinskiZap</h1>
            <p className="text-xs text-text-muted mt-0.5">Cadências de WhatsApp em massa para leads qualificados.</p>
          </div>
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowBuilder(true)}>
            Nova campanha
          </Button>
        </div>
      </AnimateIn>

      <SectionDivider />

      {/* Wizard */}
      {showBuilder && <AnimateIn delay={80}><NewCampaignWizard onClose={() => { setShowBuilder(false); setDuplicateTemplate('') }} initialTemplate={duplicateTemplate} /></AnimateIn>}

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
              <option value="COMPLETED">Concluída ({statusCounts.COMPLETED || 0})</option>
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
              <option value="recipients">Mais destinatários</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>

          {/* Campaigns Table */}
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Smartphone}
              title="Nenhum disparo ainda"
              description="Crie seu primeiro disparo WhatsApp para os leads qualificados da PESCA."
              action={{ label: 'Nova campanha', onClick: () => setShowBuilder(true) }}
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Nome</th>
                      <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Status</th>
                      <th className="text-center text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Destinatários</th>
                      <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Entrega</th>
                      <th className="text-center text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Envio</th>
                      <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Criado em</th>
                      <th className="text-left text-caption uppercase tracking-[0.12em] text-text-muted font-medium py-3 px-4">Ações</th>
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
                          meta={metaMap.get(campaign.id)}
                          onView={() => setSelectedCampaign(campaign)}
                          onDuplicate={() => {
                            setDuplicateTemplate(campaign.templateName)
                            setShowBuilder(true)
                            toast.success(`Duplicando campanha "${campaign.name}"`)
                          }}
                          onDelete={() => setDeleteConfirmId(campaign.id)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              <div className="border-t border-border px-4 py-3 flex items-center justify-between text-label text-text-muted">
                <span>{filteredCampaigns.length} de {campaigns.length} campanhas</span>
                <div className="flex items-center gap-4">
                  <span>Leads PESCA: <span className="font-mono font-semibold text-red">{pescaStats.totalLeads}</span></span>
                  <span>Segmentos: <span className="font-mono font-semibold text-text-primary">{pescaStats.segmentCount}</span></span>
                  <span>Entrega: <span className="font-mono font-semibold text-success">{globalStats.avgDelivery}%</span></span>
                  <span>Leitura: <span className="font-mono font-semibold text-info">{globalStats.avgRead}%</span></span>
                  {globalStats.sending > 0 && (
                    <span className="text-warning font-semibold">{globalStats.sending} em andamento</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-surface/95 to-surface-md/90 border border-border p-5 animate-[scale-in_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-error/10"><Trash2 className="h-5 w-5 text-error" /></div>
              <div>
                <p className="text-sm font-bold text-text-primary">Excluir campanha</p>
                <p className="text-label text-text-muted">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Tem certeza que deseja excluir a campanha <span className="font-semibold text-text-primary">"{campaigns.find(c => c.id === deleteConfirmId)?.name}"</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="flex-1">Cancelar</Button>
              <Button
                variant="danger"
                className="flex-1"
                icon={<Trash2 className="h-4 w-4" />}
                loading={cancelCampaign.isPending}
                onClick={() => {
                  cancelCampaign.mutate(deleteConfirmId, {
                    onSuccess: () => {
                      toast.success('Campanha excluída')
                      setDeleteConfirmId(null)
                      refetch()
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
    </div>
  )
}
