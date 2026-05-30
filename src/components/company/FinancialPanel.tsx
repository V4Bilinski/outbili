import { Card } from '../ui/Card'
import { DollarSign, TrendingUp, Landmark, Gauge, UserRound, Users, CalendarClock, Building2, Sparkles } from 'lucide-react'
import { formatCurrencyShort } from '../../lib/utils'
import { cn } from '../../lib/cn'
import type { Lead } from '../../types'

// Perfil financeiro do lead — agrupa os sinais de porte/poder de compra que o
// re-enriquecimento (Assertiva + Receita) captura. Tira do limbo o score de crédito
// (antes invisível) e a renda do decisor (antes só na tela de cadastro), e separa
// Faturamento de Capital (que disputavam o mesmo slot no resumo).

const TAX_REGIME_LABEL: Record<string, string> = {
  simples: 'Simples Nacional',
  mei: 'MEI',
  lucro_presumido: 'Lucro Presumido',
  lucro_real: 'Lucro Real',
  nao_optante: 'Não optante',
}

// Score de crédito Assertiva (escala 0 a 1000). Faixa define cor + rótulo.
function creditBand(score: number): { label: string; tone: 'success' | 'warning' | 'error' } {
  if (score >= 700) return { label: 'Alto', tone: 'success' }
  if (score >= 400) return { label: 'Médio', tone: 'warning' }
  return { label: 'Baixo', tone: 'error' }
}

const TONE_CLASS = {
  success: { text: 'text-success', bg: 'bg-success/10', dot: 'bg-success' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  error: { text: 'text-error', bg: 'bg-error/10', dot: 'bg-error' },
} as const

interface Metric {
  key: string
  icon: typeof DollarSign
  label: string
  value: string
  source: string
  filled: boolean
  badge?: { label: string; tone: 'success' | 'warning' | 'error' }
  highlight?: boolean
}

// yearsInMarket vem como prop ja calculado pelo CompanyPage (evita Date.now() no render,
// que o eslint react bloqueia como funcao impura).
export function FinancialPanel({ lead, yearsInMarket }: { lead: Lead; yearsInMarket?: number | null }) {
  const credit = lead.assertivaCreditScore != null ? creditBand(lead.assertivaCreditScore) : undefined

  const metrics: Metric[] = [
    {
      key: 'faturamento',
      icon: TrendingUp,
      label: 'Faturamento/ano',
      value: lead.monthlyRevenue ? formatCurrencyShort(lead.monthlyRevenue * 12) : '—',
      source: 'Assertiva · presumido',
      filled: !!lead.monthlyRevenue,
      highlight: true,
    },
    {
      key: 'capital',
      icon: Landmark,
      label: 'Capital social',
      value: lead.capitalSocial ? formatCurrencyShort(lead.capitalSocial) : '—',
      source: 'Receita Federal',
      filled: !!lead.capitalSocial,
    },
    {
      key: 'score-credito',
      icon: Gauge,
      label: 'Score de crédito',
      value: lead.assertivaCreditScore != null ? String(lead.assertivaCreditScore) : '—',
      source: 'Assertiva · escala 0 a 1000',
      filled: lead.assertivaCreditScore != null,
      badge: credit,
    },
    {
      key: 'renda-decisor',
      icon: UserRound,
      label: 'Renda do decisor',
      value: lead.assertivaIncomeEstimate ? `${formatCurrencyShort(lead.assertivaIncomeEstimate)}/mês` : '—',
      source: 'Assertiva · presumida',
      filled: !!lead.assertivaIncomeEstimate,
    },
    {
      key: 'funcionarios',
      icon: Users,
      label: 'Funcionários',
      value: lead.employees != null ? String(lead.employees) : '—',
      source: 'Assertiva · RAIS/CAGED',
      filled: lead.employees != null,
    },
    {
      key: 'anos',
      icon: CalendarClock,
      label: 'Anos no mercado',
      value: yearsInMarket != null ? `${yearsInMarket} ${yearsInMarket === 1 ? 'ano' : 'anos'}` : '—',
      source: 'Receita Federal',
      filled: yearsInMarket != null,
    },
    {
      key: 'porte',
      icon: Building2,
      label: 'Porte (tier)',
      value: lead.tier || '—',
      source: 'Classificação SPICED',
      filled: !!lead.tier,
    },
    {
      key: 'regime',
      icon: DollarSign,
      label: 'Regime tributário',
      value: lead.taxRegime ? (TAX_REGIME_LABEL[lead.taxRegime] || lead.taxRegime) : '—',
      source: 'Receita Federal',
      filled: !!lead.taxRegime,
    },
  ]

  const filledCount = metrics.filter((m) => m.filled).length
  const total = metrics.length

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-red rounded-full" />
          <h3 className="text-sm font-bold text-text-primary">Perfil financeiro</h3>
        </div>
        <span className="text-caption text-text-muted">
          {filledCount}/{total} preenchido{filledCount === 1 ? '' : 's'} · Assertiva · Receita
        </span>
      </div>

      {filledCount === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-elevated-1 border border-dashed border-border">
          <Sparkles className="h-4 w-4 text-text-muted shrink-0" />
          <p className="text-xs text-text-muted">
            Sem dados financeiros ainda. Rode o re-enriquecimento (painel Admin) para preencher faturamento, score de crédito e renda do decisor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {metrics.map((m) => {
            const Icon = m.icon
            const tone = m.badge ? TONE_CLASS[m.badge.tone] : null
            return (
              <div
                key={m.key}
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  m.filled
                    ? m.highlight
                      ? 'bg-red/[0.04] border-red/20'
                      : 'bg-elevated-1 border-border'
                    : 'bg-elevated-1/40 border-border/50',
                )}
                title={m.source}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={cn('h-3.5 w-3.5 shrink-0', m.filled ? 'text-red' : 'text-text-muted')} />
                  <p className="text-caption uppercase tracking-wider text-text-muted truncate">{m.label}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className={cn(
                    'text-base font-bold font-mono leading-none',
                    m.filled ? 'text-text-primary' : 'text-text-muted',
                  )}>
                    {m.value}
                  </p>
                  {m.badge && tone && (
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-micro font-semibold', tone.bg, tone.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', tone.dot)} />
                      {m.badge.label}
                    </span>
                  )}
                </div>
                <p className="text-micro text-text-muted mt-1 truncate">{m.filled ? m.source : 'não disponível'}</p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
