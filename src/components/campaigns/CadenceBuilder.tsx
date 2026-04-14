import { Plus, Trash2, Clock, ArrowDown, MessageSquare } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../ui/Badge'
import type { ZapTemplate } from '../../lib/bilinskizap'

export interface CadenceStep {
  id: string
  templateName: string
  delayHours: number
  condition: 'always' | 'if_no_reply' | 'if_no_read'
}

const DELAY_OPTIONS = [
  { value: 0, label: 'Imediato' },
  { value: 24, label: '24 horas (D+1)' },
  { value: 48, label: '48 horas (D+2)' },
  { value: 72, label: '72 horas (D+3)' },
  { value: 120, label: '5 dias (D+5)' },
  { value: 168, label: '7 dias (D+7)' },
]

const CONDITION_OPTIONS = [
  { value: 'always', label: 'Sempre enviar' },
  { value: 'if_no_reply', label: 'Se não respondeu' },
  { value: 'if_no_read', label: 'Se não leu' },
]

export function CadenceBuilder({
  steps,
  onStepsChange,
  templates,
}: {
  steps: CadenceStep[]
  onStepsChange: (steps: CadenceStep[]) => void
  templates: ZapTemplate[]
}) {
  const approvedTemplates = templates.filter(t => t.status === 'APPROVED')

  const addStep = () => {
    onStepsChange([
      ...steps,
      {
        id: `step-${Date.now()}`,
        templateName: approvedTemplates[0]?.name || '',
        delayHours: steps.length === 0 ? 0 : 24,
        condition: steps.length === 0 ? 'always' : 'if_no_reply',
      },
    ])
  }

  const updateStep = (id: string, updates: Partial<CadenceStep>) => {
    onStepsChange(steps.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeStep = (id: string) => {
    onStepsChange(steps.filter(s => s.id !== id))
  }

  const inputClass = 'h-9 rounded-lg bg-white/[0.03] border border-border text-xs text-text-primary px-3 cursor-pointer focus:border-red/30 focus:outline-none'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Cadência de mensagens</h3>
          <p className="text-label text-text-muted mt-0.5">Configure a sequência de follow-ups automáticos</p>
        </div>
        <Badge variant="info" size="sm">{steps.length} step{steps.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id}>
            {/* Connector */}
            {index > 0 && (
              <div className="flex items-center gap-2 py-1.5 pl-6">
                <ArrowDown className="h-3.5 w-3.5 text-text-muted" />
                <div className="flex items-center gap-1.5 text-caption text-text-muted">
                  <Clock className="h-3 w-3" />
                  <span>Aguardar {DELAY_OPTIONS.find(d => d.value === step.delayHours)?.label || `${step.delayHours}h`}</span>
                  <span className="text-text-muted/50">·</span>
                  <span>{CONDITION_OPTIONS.find(c => c.value === step.condition)?.label}</span>
                </div>
              </div>
            )}

            {/* Step card */}
            <div className={cn(
              'p-3 rounded-xl border transition-colors',
              index === 0
                ? 'bg-red/5 border-red/15'
                : 'bg-white/[0.02] border-border hover:border-border-strong',
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold',
                    index === 0 ? 'bg-red text-white' : 'bg-white/5 text-text-muted',
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-label font-semibold text-text-primary">
                    {index === 0 ? 'Mensagem inicial' : `Follow-up ${index}`}
                  </span>
                </div>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-1 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Template */}
                <div>
                  <label className="text-micro uppercase tracking-wider text-text-muted mb-1 block">Template</label>
                  <select
                    value={step.templateName}
                    onChange={(e) => updateStep(step.id, { templateName: e.target.value })}
                    className={cn(inputClass, 'w-full')}
                  >
                    <option value="">Selecionar...</option>
                    {approvedTemplates.map(t => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Delay */}
                {index > 0 && (
                  <div>
                    <label className="text-micro uppercase tracking-wider text-text-muted mb-1 block">Delay</label>
                    <select
                      value={step.delayHours}
                      onChange={(e) => updateStep(step.id, { delayHours: Number(e.target.value) })}
                      className={cn(inputClass, 'w-full')}
                    >
                      {DELAY_OPTIONS.filter(d => d.value > 0).map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Condition */}
                {index > 0 && (
                  <div>
                    <label className="text-micro uppercase tracking-wider text-text-muted mb-1 block">Condicao</label>
                    <select
                      value={step.condition}
                      onChange={(e) => updateStep(step.id, { condition: e.target.value as CadenceStep['condition'] })}
                      className={cn(inputClass, 'w-full')}
                    >
                      {CONDITION_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add step */}
      {steps.length < 5 && (
        <button
          onClick={addStep}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border hover:border-red/30 hover:bg-red/5 transition-colors text-text-muted hover:text-red text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar follow-up
        </button>
      )}

      {/* Summary */}
      {steps.length > 1 && (
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-border">
          <p className="text-caption text-text-muted">
            <MessageSquare className="inline h-3 w-3 mr-1" />
            Cadência: {steps.length} mensagens ao longo de{' '}
            {Math.max(...steps.map(s => s.delayHours))} horas.
            Follow-ups condicionais baseados em resposta/leitura.
          </p>
        </div>
      )}
    </div>
  )
}
