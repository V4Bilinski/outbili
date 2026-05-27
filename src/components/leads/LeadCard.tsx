import type { Lead } from '../../types'
import { calculateSpicedScore } from '../../lib/utils'
import { Building2, UserCircle2 } from 'lucide-react'

interface Props {
  lead: Lead
  ownerName?: string | null
  onClick?: () => void
}

const tempStyle: Record<string, string> = {
  Quente: 'bg-red text-white',
  Morno: 'bg-warning text-black',
  Frio: 'bg-cold text-white',
}

function barColor(score: number): string {
  if (score >= 3.7) return 'bg-red'
  if (score >= 2.5) return 'bg-warning'
  return 'bg-cold'
}

// Card de lead para o modo de visualizacao "cards" da LeadsPage (alternativa a lista).
export function LeadCard({ lead, ownerName, onClick }: Props) {
  const score = lead.score || calculateSpicedScore(lead.spicedS || 0, lead.spicedP || 0, lead.spicedI || 0, lead.spicedC || 0, lead.spicedD || 0)
  const temp = lead.temperature || 'Frio'

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full rounded-2xl border border-border bg-elevated-1 hover:bg-elevated-2 hover:border-red/30 transition-all duration-300 p-4 flex flex-col gap-3 group"
    >
      {/* Header: empresa + temperatura */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-elevated-3 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary truncate group-hover:text-text-primary transition-colors">{lead.tradeName || lead.companyName}</p>
            <p className="text-label text-text-muted truncate">
              {lead.tier || 'Sem tier'}{lead.city ? ` · ${lead.city}${lead.state ? `, ${lead.state}` : ''}` : ''}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[9px] font-medium px-1.5 py-[3px] rounded-full uppercase tracking-wide leading-none ${tempStyle[temp] || tempStyle.Frio}`}>{temp}</span>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {lead.enrichmentStatus === 'complete' && <span className="text-[9px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded leading-none">Enriquecido</span>}
      </div>

      {/* Rodape: score SPICED + responsavel */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-14 h-2 rounded-full bg-elevated-2 overflow-hidden">
            <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${(score / 5) * 100}%` }} />
          </div>
          <span className="text-xs font-mono font-bold text-text-primary">{score}</span>
          <span className="text-[9px] uppercase tracking-wider text-text-muted">SPICED</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-text-muted min-w-0">
          <UserCircle2 className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[90px]">{ownerName || 'Sem dono'}</span>
        </span>
      </div>
    </button>
  )
}
