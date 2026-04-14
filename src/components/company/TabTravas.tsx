import { AccordionItem } from '../ui/AccordionItem'
import { Badge } from '../ui/Badge'
import { CopyButton } from '../ui/CopyButton'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'
import { detectTravas } from '../../services/strategicAnalysisService'

export function TabTravas({ lead }: { lead: Lead }) {
  const travas = detectTravas(lead)

  if (travas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-text-muted mb-3 opacity-40" />
        <p className="text-sm font-medium text-text-secondary mb-1">Nenhuma trava detectada</p>
        <p className="text-xs text-text-muted">Enriqueça o lead para gerar o diagnóstico completo</p>
      </div>
    )
  }

  const principal = travas[0]
  const severidadeConfig = {
    CRITICA: { variant: 'error' as const, accent: 'var(--color-error)', pulse: true },
    ALTA: { variant: 'warning' as const, accent: 'var(--color-warning)', pulse: false },
    MEDIA: { variant: 'default' as const, accent: 'var(--color-text-muted)', pulse: false },
  }

  const stepColors = [
    { border: 'border-red/40', bg: 'bg-red/[0.03]', label: 'Situação' },
    { border: 'border-error/40', bg: 'bg-error/[0.03]', label: 'Trava' },
    { border: 'border-warning/40', bg: 'bg-warning/[0.03]', label: 'Estratégia' },
    { border: 'border-success/40', bg: 'bg-success/[0.03]', label: 'Produto' },
  ]
  const stepKeys = ['situacao', 'trava', 'estrategia', 'produto'] as const

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-error" />
          <h3 className="text-sm font-semibold font-heading">Diagnóstico de Travas</h3>
        </div>
        <Badge variant="default" size="sm">{travas.length} trava{travas.length > 1 ? 's' : ''}</Badge>
      </div>

      {/* Card destaque TOC — restrição principal */}
      <div className="p-5 rounded-xl bg-error/[0.06] border border-error/20">
        <span className="text-caption uppercase tracking-wider text-error font-medium">Restrição principal</span>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant="error" pulse size="sm">{principal.codigo}</Badge>
          <span className="text-lg font-bold text-text-primary font-heading">{principal.nome}</span>
        </div>
        <p className="text-xl font-bold font-mono text-error mt-2">{principal.impactoEstimado}</p>
        <div className="mt-3 p-3 rounded-lg bg-error/[0.05]">
          <p className="text-sm text-text-secondary">{principal.acaoImediata}</p>
        </div>
      </div>

      {/* Grid de travas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {travas.map((trava) => {
          const config = severidadeConfig[trava.severidade]
          return (
            <AccordionItem
              key={trava.codigo}
              defaultOpen={true}
              accentColor={config.accent}
              className={trava.severidade === 'CRITICA' ? 'shadow-[0_0_12px_rgba(239,68,68,0.08)]' : undefined}
              title={
                <div className="flex items-center gap-3 w-full">
                  <Badge variant={config.variant} pulse={config.pulse} size="sm">{trava.severidade}</Badge>
                  <span className="text-sm font-semibold text-text-primary">{trava.codigo} {trava.nome}</span>
                  <span className="ml-auto text-xs font-mono text-error whitespace-nowrap">{trava.impactoEstimado}</span>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Sinais detectados — chips */}
                <div className="flex flex-wrap gap-1.5">
                  {trava.sinaisDetectados.map((sinal, j) => (
                    <span key={j} className="text-caption px-2 py-0.5 rounded-full bg-white/[0.05] text-text-secondary">
                      {sinal}
                    </span>
                  ))}
                </div>

                {/* Bloco STEP */}
                <div className="space-y-0">
                  {stepKeys.map((key, j) => (
                    <div key={key} className={cn('border-l-2 px-3 py-2.5', stepColors[j].border, stepColors[j].bg)}>
                      <span className="text-caption uppercase tracking-wider text-text-muted font-medium">
                        {'STEP'[j]} — {stepColors[j].label}
                      </span>
                      <p className="text-sm text-text-secondary mt-0.5">{trava.step[key]}</p>
                    </div>
                  ))}
                </div>

                {/* Ação BDR */}
                <div className="p-3 rounded-lg bg-red/[0.05] border border-red/15">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption uppercase tracking-wider text-red font-medium">Ação imediata</span>
                    <CopyButton text={trava.acaoImediata} />
                  </div>
                  <p className="text-sm text-text-secondary">{trava.acaoImediata}</p>
                </div>
              </div>
            </AccordionItem>
          )
        })}
      </div>

      {/* Footer — Produto DR recomendado */}
      <div className="p-5 rounded-xl bg-red/[0.05] border border-red/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-caption uppercase tracking-wider text-red font-medium">Produto recomendado</span>
            <p className="text-sm font-semibold text-red mt-1">
              {principal.step.produto}
            </p>
          </div>
          <CopyButton
            text={`A ${lead.companyName} tem ${travas.length} trava${travas.length > 1 ? 's' : ''} de receita identificada${travas.length > 1 ? 's' : ''}, sendo a principal ${principal.codigo} ${principal.nome} (${principal.impactoEstimado}). Recomendamos ${principal.step.produto} para destravar o crescimento em 90 dias.`}
            label="Copiar pitch"
          />
        </div>
      </div>
    </div>
  )
}
