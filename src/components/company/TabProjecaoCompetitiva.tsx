import { Badge } from '../ui/Badge'
import { TrendingUp, ArrowUp, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'
import { generateProjecaoCompetitiva } from '../../services/strategicAnalysisService'
import { formatCurrencyShort } from '../../lib/utils'

const levelStyles: Record<string, { variant: 'success' | 'warning' | 'error' }> = {
  Forte: { variant: 'success' },
  Média: { variant: 'warning' },
  Fraca: { variant: 'error' },
}

export function TabProjecaoCompetitiva({ lead }: { lead: Lead }) {
  const data = generateProjecaoCompetitiva(lead)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold font-heading">Projeção Competitiva</h3>
        </div>
        <span className="text-caption px-2.5 py-1 rounded-full bg-white/[0.05] text-text-secondary">
          {data.nichoAnalise.segmento}
        </span>
      </div>

      {/* Benchmark dimensional — tabela */}
      <div className="rounded-xl bg-white/[0.02] border border-border overflow-hidden">
        <div className="grid grid-cols-4 gap-0 text-caption uppercase tracking-wider text-text-muted font-medium p-3 border-b border-border">
          <span>Dimensão</span>
          <span className="text-center">{lead.companyName?.slice(0, 15) || 'Lead'}</span>
          <span className="text-center">Benchmark</span>
          <span className="text-center">Gap</span>
        </div>
        {data.nichoAnalise.benchmarkDigital.map((item, i) => (
          <div key={i} className={cn('grid grid-cols-4 gap-0 items-center p-3', i % 2 === 0 ? 'bg-white/[0.01]' : '')}>
            <span className="text-xs text-text-secondary">{item.dimensao}</span>
            <div className="text-center">
              <Badge variant={levelStyles[item.leadNivel]?.variant || 'default'} size="sm">{item.leadNivel}</Badge>
            </div>
            <div className="text-center">
              <Badge variant="success" size="sm">{item.benchmarkNivel}</Badge>
            </div>
            <div className="text-center">
              {item.gap === '✓' ? (
                <span className="text-xs text-success">✓</span>
              ) : item.gap === '↑' ? (
                <ArrowUp className="h-3.5 w-3.5 text-warning mx-auto" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5 text-error mx-auto" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cenários — ancoragem: Com Destrava PRIMEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.projecaoDestrava.cenarios.map((cenario, i) => {
          const styles = i === 0
            ? { border: 'border-success/30', bg: 'bg-success/[0.04]', labelColor: 'text-success', valueColor: 'text-success', label: 'CENÁRIO OTIMISTA' }
            : i === 1
            ? { border: 'border-border', bg: 'bg-white/[0.02]', labelColor: 'text-text-muted', valueColor: 'text-text-muted', label: 'CENÁRIO ATUAL' }
            : { border: 'border-error/30', bg: 'bg-error/[0.04]', labelColor: 'text-error', valueColor: 'text-error', label: 'CENÁRIO DE RISCO' }

          return (
            <div key={i} className={cn('p-4 rounded-xl border', styles.border, styles.bg, i === 0 && 'md:order-first')}>
              <span className={cn('text-caption uppercase tracking-wider font-medium', styles.labelColor)}>
                {styles.label}
              </span>
              <p className={cn('text-xl font-bold font-mono mt-2', styles.valueColor)}>
                {cenario.impactoMes > 0 ? '+' : ''}{formatCurrencyShort(cenario.impactoMes)}/mês
              </p>
              <p className={cn('text-sm font-mono mt-1', styles.valueColor)}>
                {cenario.impactoAno > 0 ? '+' : ''}{formatCurrencyShort(cenario.impactoAno)}/ano
              </p>
              {cenario.travasResolvidas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {cenario.travasResolvidas.map((t, j) => (
                    <span key={j} className="text-caption px-2 py-0.5 rounded-full bg-success/10 text-success">{t}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-muted mt-3 leading-relaxed">{cenario.descricao}</p>
            </div>
          )
        })}
      </div>

      {/* Gaps para resolver */}
      {data.comparativoCompetitivo.gapsParaResolver.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Gaps para resolver</h4>
          {data.comparativoCompetitivo.gapsParaResolver.map((gap, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-border">
              <span className="text-sm text-text-secondary flex-1">{gap.dimensao}</span>
              <Badge variant="error" size="sm">{gap.de}</Badge>
              <ArrowUp className="h-3 w-3 text-text-muted" />
              <Badge variant="success" size="sm">{gap.para}</Badge>
              <span className="text-caption text-text-muted ml-1">com {gap.comoProduto}</span>
            </div>
          ))}
        </div>
      )}

      {/* Oportunidades do segmento */}
      <div className="p-4 rounded-xl bg-surface-md border border-border">
        <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Oportunidades do segmento</h4>
        <div className="space-y-2">
          {data.nichoAnalise.oportunidadesMercado.map((opp, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">{opp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
