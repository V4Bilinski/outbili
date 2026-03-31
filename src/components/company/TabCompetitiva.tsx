import { normalizeCompetitiveAnalysis, COMPETITIVE_DIMENSIONS } from '../../lib/competitive'
import type { Lead, Competitor } from '../../types'
import type { DimensionLevel } from '../../lib/competitive'
import { cn } from '../../lib/cn'
import { Swords } from 'lucide-react'

function buildDefaultCompetitors(lead: Lead): Competitor[] {
  return [
    { nome: `Concorrente A (${lead.segment})`, dimensoes: { 'Presença digital': 'Forte', 'Variedade de produtos': 'Média', 'Preço médio': 'Forte', 'Qualidade percebida': 'Média', 'Atendimento': 'Fraca', 'Margem estimada': 'Média', 'Inovação': 'Fraca', 'Força da marca': 'Forte' } },
    { nome: 'Concorrente B (Regional)', dimensoes: { 'Presença digital': 'Fraca', 'Variedade de produtos': 'Forte', 'Preço médio': 'Média', 'Qualidade percebida': 'Forte', 'Atendimento': 'Forte', 'Margem estimada': 'Fraca', 'Inovação': 'Média', 'Força da marca': 'Média' } },
    { nome: 'Concorrente C (Nacional)', dimensoes: { 'Presença digital': 'Forte', 'Variedade de produtos': 'Forte', 'Preço médio': 'Fraca', 'Qualidade percebida': 'Média', 'Atendimento': 'Média', 'Margem estimada': 'Forte', 'Inovação': 'Forte', 'Força da marca': 'Forte' } },
  ]
}

const levelStyles: Record<string, { bg: string; text: string }> = {
  Forte: { bg: 'bg-success/15', text: 'text-success' },
  Média: { bg: 'bg-warning/15', text: 'text-warning' },
  Fraca: { bg: 'bg-error/15', text: 'text-error' },
}

export function TabCompetitiva({ lead }: { lead: Lead }) {
  const normalized = normalizeCompetitiveAnalysis(lead.competitiveAnalysis, lead.companyName)
  const data = normalized ?? { lead: {}, competitors: buildDefaultCompetitors(lead) }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-info" />
        <h3 className="text-sm font-semibold font-heading">Análise competitiva — 8 dimensões</h3>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-[11px] font-medium text-text-muted uppercase tracking-wider w-[180px]">Dimensão</th>
              <th className="text-center py-3 px-3 text-[11px] font-medium text-red uppercase tracking-wider">
                {lead.companyName}
              </th>
              {data.competitors.map((c) => (
                <th key={c.nome} className="text-center py-3 px-3 text-[11px] font-medium text-text-muted uppercase tracking-wider">{c.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPETITIVE_DIMENSIONS.map((dim) => {
              const leadLevel = data.lead[dim] as DimensionLevel | undefined
              const leadStyle = leadLevel ? levelStyles[leadLevel] : null
              return (
                <tr key={dim} className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-xs text-text-secondary font-medium">{dim}</td>
                  <td className="py-2.5 px-3 text-center">
                    {leadStyle ? (
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-md', leadStyle.bg, leadStyle.text)}>
                        {leadLevel}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-text-muted bg-white/[0.04] px-2 py-1 rounded-md">A definir</span>
                    )}
                  </td>
                  {data.competitors.map((c) => {
                    const level = c.dimensoes[dim] || 'Média'
                    const style = levelStyles[level] || levelStyles.Média
                    return (
                      <td key={c.nome} className="py-2.5 px-3 text-center">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-md', style.bg, style.text)}>
                          {level}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
        <p className="text-xs font-semibold text-text-secondary mb-2">Oportunidades de diferenciação</p>
        <ul className="space-y-1.5 text-xs text-text-muted">
          <li>• Dimensões onde concorrentes são "Fraca" representam oportunidades de posicionamento</li>
          <li>• Investir em dimensões de alto impacto onde {lead.companyName} pode se destacar rapidamente</li>
          <li>• Foco inicial recomendado: presença digital + atendimento (maior gap competitivo)</li>
        </ul>
      </div>
    </div>
  )
}
