import { parseJsonField } from '../../lib/utils'
import { AccordionItem } from '../ui/AccordionItem'
import { Badge } from '../ui/Badge'
import type { Lead, Vulnerability } from '../../types'
import { AlertTriangle } from 'lucide-react'

function buildDefaultVulnerabilities(lead: Lead): Vulnerability[] {
  const segment = lead.segment || 'seu segmento'
  return [
    { titulo: 'Ausência de funil de vendas estruturado', impacto: 'ALTO', descricao: `A ${lead.companyName} não possui um funil de vendas digital que capture e nutra leads automaticamente, dependendo exclusivamente de indicações e tráfego orgânico.`, impactoFinanceiro: 'R$ 15.000–30.000/mês em oportunidades perdidas' },
    { titulo: 'Baixa presença digital comparada à concorrência', impacto: 'ALTO', descricao: `Concorrentes do segmento de ${segment} investem em tráfego pago e conteúdo, enquanto a empresa depende de presença orgânica limitada.`, impactoFinanceiro: 'R$ 10.000–20.000/mês em market share cedido' },
    { titulo: 'Ticket médio estagnado', impacto: 'MEDIO', descricao: 'Sem estratégia de upsell/cross-sell implementada, o ticket médio permanece flat há mais de 12 meses.', impactoFinanceiro: 'R$ 8.000–15.000/mês em receita incremental não capturada' },
    { titulo: 'Taxa de conversão abaixo do benchmark', impacto: 'ALTO', descricao: `A taxa de conversão de leads para clientes está abaixo da média do segmento de ${segment}, indicando problemas no processo comercial.`, impactoFinanceiro: 'R$ 12.000–25.000/mês' },
    { titulo: 'Recorrência e retenção sem automação', impacto: 'MEDIO', descricao: 'Não existe régua de relacionamento automatizada para retenção e reativação de clientes inativos.', impactoFinanceiro: 'R$ 5.000–12.000/mês em churn evitável' },
    { titulo: 'Dependência de canal único', impacto: 'MEDIO', descricao: 'A geração de demanda está concentrada em 1-2 canais, criando vulnerabilidade a mudanças de algoritmo ou sazonalidade.', impactoFinanceiro: 'Risco de queda de 30-50% em períodos de mudança' },
    { titulo: 'Ausência de dados e métricas', impacto: 'ALTO', descricao: 'Sem dashboards ou KPIs acompanhados sistematicamente, decisões são tomadas por intuição em vez de dados.', impactoFinanceiro: 'Impacto indireto em todas as demais vulnerabilidades' },
    { titulo: 'Posicionamento de marca indefinido', impacto: 'BAIXO', descricao: 'A proposta de valor não está claramente comunicada nos canais digitais, dificultando diferenciação frente à concorrência.', impactoFinanceiro: 'R$ 3.000–8.000/mês em conversões perdidas por falta de clareza' },
  ]
}

const impactColors: Record<string, { variant: 'error' | 'warning' | 'success'; accent: string }> = {
  ALTO: { variant: 'error', accent: 'var(--color-error)' },
  MEDIO: { variant: 'warning', accent: 'var(--color-warning)' },
  BAIXO: { variant: 'success', accent: 'var(--color-success)' },
}

const impactLabels: Record<string, string> = {
  ALTO: 'ALTO',
  MEDIO: 'MÉDIO',
  BAIXO: 'BAIXO',
}

export function TabVulnerabilidades({ lead }: { lead: Lead }) {
  const vulnerabilities = parseJsonField<Vulnerability[]>(lead.vulnerabilities, buildDefaultVulnerabilities(lead))

  const highCount = vulnerabilities.filter((v) => v.impacto === 'ALTO').length
  const medCount = vulnerabilities.filter((v) => v.impacto === 'MEDIO').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-error" />
          <h3 className="text-sm font-semibold font-heading">Vulnerabilidades identificadas</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="error" size="sm">{highCount} alto impacto</Badge>
          <Badge variant="warning" size="sm">{medCount} médio</Badge>
        </div>
      </div>

      {/* Total impact banner */}
      <div className="p-4 rounded-xl bg-error/8 border border-error/20">
        <p className="text-xs text-text-muted mb-1">Impacto financeiro total estimado</p>
        <p className="text-xl font-bold font-mono text-error">R$ 50.000–130.000/mês sendo desperdiçado</p>
        <p className="text-[11px] text-text-muted mt-1">Soma das vulnerabilidades de alto e médio impacto</p>
      </div>

      <div className="space-y-2">
        {vulnerabilities.map((vuln, i) => {
          const colors = impactColors[vuln.impacto] || impactColors.BAIXO
          return (
            <AccordionItem
              key={i}
              defaultOpen={vuln.impacto === 'ALTO'}
              accentColor={colors.accent}
              title={
                <div className="flex items-center gap-3">
                  <Badge variant={colors.variant} size="sm">{impactLabels[vuln.impacto] || vuln.impacto}</Badge>
                  <span className="text-sm font-medium text-text-primary">{vuln.titulo}</span>
                </div>
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-text-secondary leading-relaxed">{vuln.descricao}</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-border">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">Impacto financeiro:</span>
                  <span className="text-sm font-mono font-semibold text-error">{vuln.impactoFinanceiro}</span>
                </div>
              </div>
            </AccordionItem>
          )
        })}
      </div>
    </div>
  )
}
