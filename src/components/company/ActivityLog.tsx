import { useState } from 'react'
import { createActivity } from '../../services/activityService'
import type { Activity } from '../../types'
import { toast } from 'sonner'
import { MessageSquare, FileText, CalendarDays, FileSignature, ArrowRightLeft, Send, Loader2, UserCircle2 } from 'lucide-react'

interface Props {
  leadId: string
  activities: Activity[]
  onLogged?: () => void
}

// Tipos que o usuario registra manualmente (status_change e' automatico no pipeline)
const TYPE_OPTIONS = [
  { value: 'nota', label: 'Nota' },
  { value: 'whatsapp_enviado', label: 'WhatsApp enviado' },
  { value: 'whatsapp_recebido', label: 'WhatsApp recebido' },
  { value: 'reunião', label: 'Reunião' },
  { value: 'proposta', label: 'Proposta' },
] as const

function typeMeta(type: string): { icon: typeof FileText; label: string; color: string } {
  switch (type) {
    case 'whatsapp_enviado': return { icon: Send, label: 'WhatsApp enviado', color: 'text-whatsapp' }
    case 'whatsapp_recebido': return { icon: MessageSquare, label: 'WhatsApp recebido', color: 'text-whatsapp' }
    case 'reunião': return { icon: CalendarDays, label: 'Reunião', color: 'text-pink-400' }
    case 'proposta': return { icon: FileSignature, label: 'Proposta', color: 'text-orange-400' }
    case 'status_change': return { icon: ArrowRightLeft, label: 'Mudança de etapa', color: 'text-text-secondary' }
    default: return { icon: FileText, label: 'Nota', color: 'text-text-secondary' }
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

// FASE 3: registro de contato/atividade pelo usuario + historico (autor, data e hora).
export function ActivityLog({ leadId, activities, onLogged }: Props) {
  const [type, setType] = useState<Activity['type']>('nota')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!description.trim()) { toast.error('Escreva uma descrição para o registro.'); return }
    setSaving(true)
    try {
      await createActivity({ leadId, type, description: description.trim() })
      setDescription('')
      toast.success('Atividade registrada.')
      onLogged?.()
    } catch (e: any) {
      toast.error(`Falha ao registrar: ${e?.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  const sorted = [...activities].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return (
    <div className="space-y-4">
      {/* Registro de atividade */}
      <div className="rounded-2xl border border-border bg-elevated-1 p-4 space-y-3">
        <p className="text-sm font-semibold text-text-primary">Registrar contato / atividade</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Activity['type'])}
            className="text-xs bg-elevated-2 border border-border rounded-lg px-2 py-2 text-text-primary sm:w-44 focus:outline-none focus:ring-1 focus:ring-red/40"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que aconteceu? (ex.: liguei, o decisor pediu proposta até sexta)"
            rows={2}
            className="flex-1 text-xs bg-elevated-2 border border-border rounded-lg px-3 py-2 text-text-primary resize-none focus:outline-none focus:ring-1 focus:ring-red/40"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red text-white text-xs font-semibold hover:bg-red/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Registrar
          </button>
        </div>
      </div>

      {/* Histórico de ações */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Histórico de ações ({sorted.length})</p>
        {sorted.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">Nenhuma atividade registrada ainda.</p>
        ) : (
          sorted.map((a) => {
            const meta = typeMeta(a.type)
            const Icon = meta.icon
            return (
              <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-elevated-1 border border-border/40">
                <div className="w-7 h-7 rounded-lg bg-elevated-3 flex items-center justify-center shrink-0">
                  <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-primary">{meta.label}</span>
                    <span className="text-[10px] text-text-muted shrink-0">{formatDateTime(a.createdAt)}</span>
                  </div>
                  {a.description && <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap break-words">{a.description}</p>}
                  <p className="flex items-center gap-1 text-[10px] text-text-muted mt-1">
                    <UserCircle2 className="h-3 w-3" />{a.createdByName || 'Sistema'}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
