import type { Lead, Contact } from '../../types'
import { resolveStakeholder, stakeholderSourceClass } from '../../lib/stakeholder'
import { WhatsAppIcon } from '../ui/WhatsAppIcon'
import { Mail, Phone, UserPlus } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  lead: Lead
  contacts?: Contact[]
  onAdd?: () => void
}

function initial(name: string): string {
  const c = name.trim().charAt(0)
  return c ? c.toUpperCase() : '?'
}

// Painel da pessoa-chave (stakeholder) integrado a secao de dados cadastrais.
// Usa a cascata resolveStakeholder + selo de origem = vinculo validado e visivel.
export function StakeholderPanel({ lead, contacts, onAdd }: Props) {
  const sk = resolveStakeholder(lead, contacts)
  const waDigits = sk?.whatsapp ? sk.whatsapp.replace(/\D/g, '') : ''

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-caption font-bold uppercase tracking-wider text-text-muted">Stakeholder</p>

      {sk ? (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-elevated-1 border border-border">
          <div className="w-9 h-9 rounded-xl bg-elevated-3 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-text-secondary">{initial(sk.name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary truncate leading-tight">{sk.name}</p>
              <span className={cn('shrink-0 text-micro font-semibold px-1.5 py-0.5 rounded-full leading-none', stakeholderSourceClass(sk.source))}>
                {sk.sourceLabel}
              </span>
            </div>
            {sk.role && <p className="text-xs text-text-muted truncate mt-0.5">{sk.role}</p>}

            {(sk.email || sk.whatsapp) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                {sk.email && (
                  <a
                    href={`mailto:${sk.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors min-w-0"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="truncate">{sk.email}</span>
                  </a>
                )}
                {sk.whatsapp && (
                  waDigits ? (
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 text-xs text-whatsapp hover:opacity-80 transition-opacity font-mono"
                    >
                      <WhatsAppIcon className="text-sm" />
                      <span className="truncate">{sk.whatsapp}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                      <span className="truncate">{sk.whatsapp}</span>
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-warning/6 border border-warning/15 border-dashed cursor-pointer hover:bg-warning/10 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <UserPlus className="h-4 w-4 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warning">Sem stakeholder</p>
            <p className="text-label text-text-muted">Adicionar a pessoa-chave deste lead</p>
          </div>
        </button>
      )}
    </div>
  )
}
