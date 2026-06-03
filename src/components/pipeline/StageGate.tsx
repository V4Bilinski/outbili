import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, ArrowRight, X, Trophy, ClipboardList } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'
import {
  STAGE_GATES,
  STAGE_SOURCE_LABEL,
  getStageLabel,
  getStageColor,
  type StageChangeSource,
} from './stageConfig'

export interface StageGatePopupProps {
  lead: Lead
  fromStatus: string
  toStatus: string
  source: StageChangeSource
  onConfirm: (notes: string, validatedItems: string[]) => void
  onCancel: () => void
}

export function StageGatePopup({ lead, fromStatus, toStatus, source, onConfirm, onCancel }: StageGatePopupProps) {
  const { user } = useAuth()
  const gate = STAGE_GATES[toStatus]
  const GateIcon = gate?.icon || ClipboardList
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState('')
  const totalChecks = gate?.checks.length || 0
  const checkedCount = checked.size
  // Textos dos checks marcados — viram a descrição da validação no registro de mudança.
  const validatedItems = gate?.checks.filter((_, i) => checked.has(i)).map((c) => c.text) || []
  const handleConfirm = () => onConfirm(notes, validatedItems)
  const fromLabel = getStageLabel(fromStatus)
  const toLabel = getStageLabel(toStatus)
  const toColor = getStageColor(toStatus)
  const isCelebration = toStatus === 'Fechado'
  const sourceLabel = STAGE_SOURCE_LABEL[source]

  const now = new Date()
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  // Bloqueia scroll do body enquanto popup está aberto + fecha com ESC
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  const popup = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-[fade-in_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={gate?.title || `Mover para ${toLabel}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onCancel} />
      {/* Popup card centralizado */}
      <div className={cn(
        'relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl shadow-black/50 overflow-y-auto max-h-[90vh] animate-[scale-in_0.2s_ease-out]',
        isCelebration
          ? 'bg-gradient-to-b from-amber-900/95 to-surface border-amber-400/20'
          : 'bg-surface border-border',
      )}>
        <div className="p-5 space-y-3.5">
          {/* Header — título proeminente */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <GateIcon className="size-5 shrink-0 text-text-secondary" />
              <div className="min-w-0">
                <p className="text-base font-bold text-text-primary font-heading leading-tight">
                  {gate?.title || `Mover para ${toLabel}`}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-text-muted">{fromLabel}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-text-muted shrink-0" />
                  <span className="text-[11px] font-semibold" style={{ color: toColor }}>{toLabel}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onCancel}
              aria-label="Fechar"
              className="p-1.5 rounded-lg hover:bg-elevated-2 text-text-muted hover:text-text-primary cursor-pointer transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lead info — ligeiramente reduzido para ceder destaque ao título */}
          <div className="px-3 py-2 rounded-lg bg-elevated-1 border border-border">
            <p className="text-[12px] font-semibold text-text-primary leading-tight">{lead.companyName}</p>
            <p className="text-[10px] text-text-muted leading-tight mt-0.5">
              {lead.segment} · {lead.tier} · Score {lead.score || '-'}
            </p>
          </div>

          {/* Checklist */}
          {gate && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">
                  {isCelebration ? 'Checklist final' : 'Validar antes de mover'}
                </p>
                <span className="text-[10px] text-text-muted font-medium">
                  {checkedCount}/{totalChecks} validados
                </span>
              </div>
              <div className="space-y-1">
                {gate.checks.map((check, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggle(idx)}
                    className={cn(
                      'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all duration-200',
                      checked.has(idx)
                        ? 'bg-success/10 border-success/30'
                        : 'bg-elevated-1 border-border hover:border-border-strong',
                    )}
                  >
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300',
                      checked.has(idx) ? 'bg-success border-success' : 'border-border',
                    )}>
                      {checked.has(idx) && <CheckCircle className="h-2 w-2 text-white" />}
                    </div>
                    <span className={cn('text-[12px] leading-snug flex-1 transition-colors', checked.has(idx) ? 'text-text-primary' : 'text-text-secondary')}>
                      {check.text}
                    </span>
                    <span className="text-[9px] text-text-muted/50 shrink-0 uppercase tracking-wider">opcional</span>
                  </button>
                ))}
              </div>
              <div className="h-0.5 w-full rounded-full bg-elevated-2 overflow-hidden mt-2">
                <div className="h-full bg-gradient-to-r from-red to-success rounded-full transition-all duration-500" style={{ width: `${(checked.size / gate.checks.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Descrição da validação — texto livre que descreve a validação no registro de mudança */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Descrição da validação (opcional)..." rows={2}
            className="w-full rounded-lg bg-elevated-1 border border-border text-[12px] text-text-primary placeholder:text-text-muted p-2.5 focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors resize-none" />

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={onCancel} className="flex-1" size="sm">Cancelar</Button>
            <Button onClick={handleConfirm} className="flex-1" size="sm"
              icon={isCelebration ? <Trophy className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}>
              {isCelebration ? 'Fechar negócio!' : 'Confirmar'}
            </Button>
          </div>

          {/* Registro de autor, origem e data */}
          <div className="pt-2.5 border-t border-border/50 space-y-0.5">
            <p className="text-[10px] text-text-muted leading-tight">Origem: <span className="text-text-secondary">{sourceLabel}</span></p>
            <p className="text-[10px] text-text-muted leading-tight">Criado em: <span className="text-text-secondary">{dateStr}</span></p>
            <p className="text-[10px] text-text-muted leading-tight">Criado por: <span className="text-text-secondary">{user?.fullName || user?.email || 'Usuário'}</span></p>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(popup, document.body)
}
