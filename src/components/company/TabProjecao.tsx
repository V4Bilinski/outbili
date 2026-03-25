import { parseJsonField, formatCurrency } from '../../lib/utils'
import type { Lead, ProjectionScenario } from '../../types'
import { TrendingUp } from 'lucide-react'

function buildDefaultScenarios(lead: Lead): ProjectionScenario[] {
  const revenue = lead.monthlyRevenue || 200000
  return [
    {
      label: 'Agressivo',
      receitaIncrementalMes: Math.round(revenue * 0.25),
      custoOperacional: Math.round(revenue * 0.03),
      investimentoMarketing: Math.round(revenue * 0.08),
      resultadoMensal: Math.round(revenue * 0.25 - revenue * 0.03 - revenue * 0.08),
      resultadoAnual: Math.round((revenue * 0.25 - revenue * 0.03 - revenue * 0.08) * 12),
      margemLiquida: 56,
    },
    {
      label: 'Moderado',
      receitaIncrementalMes: Math.round(revenue * 0.15),
      custoOperacional: Math.round(revenue * 0.03),
      investimentoMarketing: Math.round(revenue * 0.06),
      resultadoMensal: Math.round(revenue * 0.15 - revenue * 0.03 - revenue * 0.06),
      resultadoAnual: Math.round((revenue * 0.15 - revenue * 0.03 - revenue * 0.06) * 12),
      margemLiquida: 40,
    },
    {
      label: 'Conservador',
      receitaIncrementalMes: Math.round(revenue * 0.08),
      custoOperacional: Math.round(revenue * 0.02),
      investimentoMarketing: Math.round(revenue * 0.04),
      resultadoMensal: Math.round(revenue * 0.08 - revenue * 0.02 - revenue * 0.04),
      resultadoAnual: Math.round((revenue * 0.08 - revenue * 0.02 - revenue * 0.04) * 12),
      margemLiquida: 25,
    },
  ]
}

const scenarioColors: Record<string, { border: string; bg: string; text: string }> = {
  Agressivo: { border: 'border-success', bg: 'bg-success/8', text: 'text-success' },
  Moderado: { border: 'border-warning', bg: 'bg-warning/8', text: 'text-warning' },
  Conservador: { border: 'border-text-muted', bg: 'bg-white/[0.03]', text: 'text-text-secondary' },
}

export function TabProjecao({ lead }: { lead: Lead }) {
  const scenarios = parseJsonField<ProjectionScenario[]>(lead.projectionData, buildDefaultScenarios(lead))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold font-heading">Projeção de faturamento — 3 cenários</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const colors = scenarioColors[scenario.label] || scenarioColors.Conservador
          return (
            <div
              key={scenario.label}
              className={`rounded-2xl p-5 border-t-[3px] ${colors.border} ${colors.bg} space-y-4`}
            >
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>{scenario.label}</h4>
                <span className={`text-xs font-mono ${colors.text}`}>{scenario.margemLiquida}% margem</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Receita incremental/mês</p>
                  <p className="text-xl font-bold font-mono text-success">{formatCurrency(scenario.receitaIncrementalMes)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Custo operacional</p>
                    <p className="text-sm font-mono text-text-secondary">{formatCurrency(scenario.custoOperacional)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Investimento mkt</p>
                    <p className="text-sm font-mono text-text-secondary">{formatCurrency(scenario.investimentoMarketing)}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Resultado mensal</p>
                  <p className="text-lg font-bold font-mono text-text-primary">{formatCurrency(scenario.resultadoMensal)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Resultado anual</p>
                  <p className="text-2xl font-bold font-mono text-success">{formatCurrency(scenario.resultadoAnual)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-secondary">Premissas:</strong> Cenários baseados no faturamento estimado de {formatCurrency(lead.monthlyRevenue || 200000)}/mês.
          O cenário agressivo considera implementação completa do Destrava Receita com otimização de todas as travas identificadas.
          O moderado considera resolução das 2 travas principais. O conservador considera apenas a trava dominante ({lead.hypotheticalTrap || 'a ser identificada'}).
        </p>
      </div>
    </div>
  )
}
