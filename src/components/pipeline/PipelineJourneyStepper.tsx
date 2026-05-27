import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'
import { useUpdateLead } from '../../hooks/useLeads'
import { useAuth } from '../../lib/auth-context'
import { createActivity } from '../../services/activityService'
import { toast } from 'sonner'
import { StageGatePopup } from './StageGate'
import {
  PIPELINE_COLUMNS,
  getStageIndex,
  buildStageChangeDescription,
  type StageChangeSource,
} from './stageConfig'

interface PipelineJourneyStepperProps {
  lead: Lead
  source: StageChangeSource
  className?: string
}

interface MenuPosition {
  top: number
  left: number
  width: number
}

/**
 * Botão compacto da fase atual + dropdown portado para o body
 * (para não ser cortado por overflow/stacking de containers pai).
 */
export function PipelineJourneyStepper({ lead, source, className }: PipelineJourneyStepperProps) {
  const { user } = useAuth()
  const updateLead = useUpdateLead()
  const [pendingTo, setPendingTo] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentIdx = getStageIndex(lead.status)
  const current = PIPELINE_COLUMNS[currentIdx]
  const fromStatus = lead.status || 'Novo'
  const MENU_MIN_WIDTH = 220

  // Calcula posição do menu em viewport — chamado ao abrir e em scroll/resize
  const updateMenuPosition = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, MENU_MIN_WIDTH)
    // Preferir alinhar à esquerda; se estourar a direita, ancorar pela direita
    const overflowRight = rect.left + width - window.innerWidth
    const left = overflowRight > 0 ? Math.max(8, rect.left - overflowRight - 8) : rect.left
    setMenuPos({ top: rect.bottom + 6, left, width })
  }

  useLayoutEffect(() => {
    if (menuOpen) updateMenuPosition()
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onScrollOrResize = () => updateMenuPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [menuOpen])

  // Fecha dropdown ao clicar fora ou ESC
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleSelectStage = (toValue: string) => {
    setMenuOpen(false)
    if (toValue === fromStatus) return
    setPendingTo(toValue)
  }

  const handleConfirm = (notes: string) => {
    if (!pendingTo) return
    const toValue = pendingTo
    updateLead.mutate({ id: lead.id, data: { status: toValue } })

    const description = buildStageChangeDescription(fromStatus, toValue, notes, source)
    createActivity({
      leadId: lead.id,
      type: 'status_change',
      description,
      createdBy: user?.fullName || user?.email || 'Sistema',
    }).catch(() => {})

    const toLabel = PIPELINE_COLUMNS.find((s) => s.value === toValue)?.label || toValue
    if (toValue === 'Fechado') {
      toast.success(`🏆 ${lead.companyName}: negócio fechado.`, { duration: 5000 })
    } else {
      const emoji = toValue === 'Reunião' ? '📅' : toValue === 'Proposta' ? '📝' : '✅'
      toast.success(`${emoji} ${lead.companyName} → ${toLabel}`, { duration: 3000 })
    }
    setPendingTo(null)
  }

  const dropdown = menuOpen && menuPos ? createPortal(
    <div
      ref={menuRef}
      data-stepper-menu="true"
      role="listbox"
      aria-label="Selecionar fase"
      className="fixed z-[9998] rounded-xl bg-surface border border-border shadow-2xl shadow-black/50 py-1.5 animate-[fade-in_0.15s_ease-out]"
      style={{
        top: menuPos.top,
        left: menuPos.left,
        minWidth: menuPos.width,
        maxHeight: 'min(70vh, 420px)',
        overflowY: 'auto',
      }}
    >
      <p className="text-caption uppercase tracking-[0.12em] text-text-muted font-semibold px-3 py-1.5 sticky top-0 bg-surface">
        Mover para
      </p>
      {PIPELINE_COLUMNS.filter((c) => c.value !== fromStatus).map((col) => {
        const colIdx = PIPELINE_COLUMNS.findIndex((c) => c.value === col.value)
        const isPast = colIdx < currentIdx
        return (
          <button
            key={col.value}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => handleSelectStage(col.value)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-colors text-left',
              'text-text-secondary hover:bg-elevated-2 hover:text-text-primary',
            )}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: col.color }}
            />
            <span className="flex-1 font-medium">{col.label}</span>
            {isPast && <Check className="h-3 w-3 text-success shrink-0" strokeWidth={3} />}
          </button>
        )
      })}
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        aria-label={`Fase atual: ${current.label}. Clique para mover.`}
        className={cn(
          'group inline-flex items-center gap-2 rounded-lg border-l-[3px] bg-elevated-2 px-3 py-1.5 cursor-pointer',
          'transition-all duration-200 hover:bg-elevated-hover focus:outline-none focus:ring-1 focus:ring-white/20',
          menuOpen && 'bg-elevated-hover',
          className,
        )}
        style={{ borderLeftColor: current.color }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: current.color, boxShadow: `0 0 0 2px ${current.color}33` }}
        />
        <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
          {current.label}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-text-muted transition-transform duration-200 shrink-0',
            menuOpen && 'rotate-180',
          )}
        />
      </button>

      {dropdown}

      {/* Popup de validação (reutiliza o mesmo do kanban) */}
      {pendingTo && (
        <StageGatePopup
          lead={lead}
          fromStatus={fromStatus}
          toStatus={pendingTo}
          source={source}
          onConfirm={handleConfirm}
          onCancel={() => setPendingTo(null)}
        />
      )}
    </>
  )
}
