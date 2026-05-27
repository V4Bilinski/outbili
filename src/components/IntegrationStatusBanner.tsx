import { useIntegrationHealth } from '../hooks/useIntegrationHealth'
import { AlertTriangle, CheckCircle2, XCircle, MinusCircle, RefreshCw, HelpCircle } from 'lucide-react'
import { cn } from '../lib/cn'
import type { IntegrationState } from '../services/integrationHealthService'

// Torna visivel a degradacao de integracoes externas. Sem este sinal o sistema
// "parecia bugado" quando uma integracao caia (degradava em silencio).
//   variant="banner" : faixa que so aparece quando uma integracao core esta fora.
//   variant="panel"  : painel completo com o estado das tres integracoes.

const STATE_UI: Record<IntegrationState, { icon: typeof CheckCircle2; text: string; chip: string; label: string }> = {
  ok:       { icon: CheckCircle2,  text: 'text-success',    chip: 'bg-success/10 text-success border-success/20', label: 'Operando' },
  degraded: { icon: AlertTriangle, text: 'text-warning',    chip: 'bg-warning/10 text-warning border-warning/20', label: 'Parcial' },
  down:     { icon: XCircle,       text: 'text-error',      chip: 'bg-error/10 text-error border-error/20',       label: 'Indisponivel' },
  optional: { icon: MinusCircle,   text: 'text-text-muted', chip: 'bg-elevated-2 text-text-muted border-border', label: 'Nao configurado' },
  unknown:  { icon: HelpCircle,    text: 'text-text-muted', chip: 'bg-elevated-2 text-text-muted border-border', label: 'Nao verificado' },
}

function relativeTime(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60000)
  if (min < 1) return 'agora'
  if (min === 1) return 'ha 1 min'
  if (min < 60) return `ha ${min} min`
  const h = Math.round(min / 60)
  return h === 1 ? 'ha 1 h' : `ha ${h} h`
}

export function IntegrationStatusBanner({ variant = 'banner' }: { variant?: 'banner' | 'panel' }) {
  const { data, refetch, isFetching } = useIntegrationHealth()
  if (!data) return null

  if (variant === 'banner') {
    if (data.needsAttention.length === 0) return null
    const hasDown = data.needsAttention.some((i) => i.state === 'down')
    return (
      <div
        role="status"
        className={cn(
          'mb-5 rounded-xl border px-4 py-3 flex items-start gap-3 animate-[fade-in_0.3s_ease-out]',
          hasDown ? 'border-error/30 bg-error/[0.07]' : 'border-warning/30 bg-warning/[0.07]',
        )}
      >
        <AlertTriangle className={cn('h-5 w-5 shrink-0 mt-0.5', hasDown ? 'text-error' : 'text-warning')} />
        <div className="space-y-1 min-w-0">
          <p className={cn('text-sm font-semibold', hasDown ? 'text-error' : 'text-warning')}>
            {data.needsAttention.length === 1
              ? `${data.needsAttention[0].label} ${data.needsAttention[0].state === 'down' ? 'indisponivel' : 'degradada'}`
              : 'Integracoes externas com instabilidade'}
          </p>
          {data.needsAttention.map((i) => (
            <p key={i.id} className="text-xs text-text-secondary leading-snug">{i.detail}</p>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface border border-border p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text-primary">Status das integracoes</h3>
        <div className="flex items-center gap-3">
          <span className="text-micro text-text-muted">Verificado {relativeTime(data.checkedAt)}</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 text-micro text-text-secondary hover:text-text-primary disabled:opacity-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
            Verificar
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {data.integrations.map((i) => {
          const ui = STATE_UI[i.state]
          const Icon = ui.icon
          return (
            <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-elevated-1 border border-border">
              <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', ui.text)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{i.label}</span>
                  <span className={cn('text-micro px-1.5 py-0.5 rounded border', ui.chip)}>{ui.label}</span>
                </div>
                <p className="text-xs text-text-secondary leading-snug mt-0.5">{i.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
