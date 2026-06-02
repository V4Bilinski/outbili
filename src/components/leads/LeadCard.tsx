import type { Lead } from '../../types'
import { calculateSpicedScore } from '../../lib/utils'
import { AnimatedScore } from '../ui/AnimatedScore'
import { UserCircle2 } from 'lucide-react'

interface Props {
  lead: Lead
  ownerName?: string | null
  onClick?: () => void
}

// Temperatura: pill suave (tinted), consistente com o card do pipeline.
const tempPill: Record<string, string> = {
  Quente: 'bg-hot/15 text-hot',
  Morno: 'bg-warm/15 text-warm',
  Frio: 'bg-cold/15 text-cold',
}

// Score como sinal: chip tintado por faixa. Vermelho da marca fica reservado a interacao.
function scoreChip(score: number): string {
  if (score >= 3.7) return 'text-hot bg-hot/10'
  if (score >= 2.5) return 'text-warm bg-warm/10'
  return 'text-cold bg-cold/10'
}

// Card de lead para o modo "cards" da LeadsPage (alternativa a lista).
// Design minimalista: nome como ancora, temperatura como unico acento visual,
// rodape com score SPICED e responsavel. Funciona em dark e light via tokens.
export function LeadCard({ lead, ownerName, onClick }: Props) {
  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const temp = lead.temperature || 'Frio'
  const name = lead.tradeName || lead.companyName || 'Sem nome'
  const enriched = lead.enrichmentStatus === 'complete'

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-2xl border border-border bg-elevated-1 hover:border-red/30 hover:bg-elevated-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 transition-colors duration-200 p-4 flex flex-col gap-3.5 cursor-pointer"
    >
      {/* Header: nome + local (esquerda), temperatura (direita) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-text-primary truncate leading-tight">{name}</p>
          <p className="text-xs text-text-muted truncate mt-1">
            {lead.tier || 'Sem tier'}{lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ''}` : ''}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none ${tempPill[temp] || tempPill.Frio}`}>{temp}</span>
      </div>

      {/* Rodape: score SPICED (esquerda), responsavel (direita) */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <AnimatedScore score={score} className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${scoreChip(score)}`} />
          <span className="text-[10px] uppercase tracking-wider text-text-muted">SPICED</span>
          {enriched && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Dados completos" />}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-text-muted min-w-0">
          <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[100px]">{ownerName || 'Sem dono'}</span>
        </span>
      </div>
    </button>
  )
}
