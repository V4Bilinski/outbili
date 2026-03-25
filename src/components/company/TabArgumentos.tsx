import { parseJsonField } from '../../lib/utils'
import { AccordionItem } from '../ui/AccordionItem'
import { CopyButton } from '../ui/CopyButton'
import type { Lead, SalesArgument } from '../../types'
import { Lightbulb, MessageSquareWarning, Reply, DollarSign } from 'lucide-react'

function buildDefaultArguments(lead: Lead): SalesArgument[] {
  const segment = lead.segment || 'seu segmento'
  const trap = lead.hypotheticalTrap || 'gargalo de receita'
  return [
    {
      eixo: 'Diagnóstico baseado em dados',
      argumento: `A ${lead.companyName} opera no segmento de ${segment} há ${lead.yearsInMarket || 'vários'} anos, mas sem um diagnóstico estruturado de receita é impossível saber exatamente onde os R$ estão travados. Nosso processo identifica com precisão as travas que impedem o crescimento.`,
      objecao: 'Já sei onde estão meus problemas, não preciso de diagnóstico.',
      resposta: 'Se soubesse, já teria resolvido. O diagnóstico revela os gargalos invisíveis — aqueles que parecem normais mas custam R$ 10k-30k/mês. 90% dos nossos clientes se surpreendem com o que descobrimos.',
      impactoROI: 'ROI médio do diagnóstico: 8x em 6 meses',
    },
    {
      eixo: 'Especialização no segmento',
      argumento: `Trabalhamos com mais de 50 empresas do segmento de ${segment}. Isso significa que já mapeamos os padrões de sucesso e fracasso do setor — não estamos experimentando, estamos aplicando o que funciona.`,
      objecao: 'Vocês entendem do meu mercado? Cada negócio é diferente.',
      resposta: `Exatamente por isso o diagnóstico é personalizado. Mas os padrões de ${segment} se repetem: ${trap} é uma das travas mais comuns. A diferença está na execução, e é aí que nossa experiência no setor faz a diferença.`,
      impactoROI: 'Empresas do setor que implementaram: +18% faturamento em 6 meses',
    },
    {
      eixo: 'Resultado mensurável',
      argumento: 'Diferente de agências que entregam "mais seguidores" ou "mais cliques", nosso compromisso é com receita. Cada ação é vinculada a um KPI financeiro — se não gera R$, não fazemos.',
      objecao: 'Marketing nunca trouxe resultado pra gente.',
      resposta: 'Isso confirma exatamente o que fazemos de diferente. Não somos marketing — somos consultoria de receita. Antes de qualquer campanha, estruturamos o funil comercial inteiro. Sem isso, investir em marketing é jogar dinheiro fora.',
      impactoROI: 'Taxa de sucesso: 87% dos clientes atingem meta no trimestre 2',
    },
    {
      eixo: 'Velocidade de implementação',
      argumento: 'O Destrava Receita foi desenhado para gerar resultado em 90 dias. Não é um projeto de 12 meses — é uma operação ágil com sprints de implementação quinzenais e checkpoints de resultado.',
      objecao: 'Não tenho tempo para mais um projeto longo.',
      resposta: 'Justamente. São 90 dias focados, com dedicação de 2-3h/semana do seu lado. Nós executamos 80% do trabalho. O primeiro resultado aparece nas primeiras 2-3 semanas.',
      impactoROI: 'Time-to-value médio: 21 dias até primeiro resultado mensurável',
    },
    {
      eixo: 'Custo da inação',
      argumento: `A cada mês sem resolver ${trap}, a ${lead.companyName} está deixando na mesa entre R$ 15.000 e R$ 50.000 em receita potencial. Em 6 meses, isso soma R$ 90.000 a R$ 300.000. O investimento no diagnóstico é uma fração disso.`,
      objecao: 'Preciso pensar, não é o momento.',
      resposta: 'Respeito. Mas cada mês de "não é o momento" tem um custo real. Se a trava custa R$ 20k/mês, em 3 meses de reflexão são R$ 60k desperdiçados. O diagnóstico leva 2 semanas e custa menos que um mês de trava.',
      impactoROI: 'Custo da inação: R$ 180k–600k/ano em receita perdida',
    },
  ]
}

export function TabArgumentos({ lead }: { lead: Lead }) {
  const args = parseJsonField<SalesArgument[]>(lead.salesArguments, buildDefaultArguments(lead))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold font-heading">Arsenal de argumentos — 5 eixos</h3>
      </div>

      <div className="space-y-3">
        {args.map((arg, i) => (
          <AccordionItem
            key={i}
            defaultOpen={i === 0}
            accentColor="var(--color-red)"
            title={
              <span className="text-sm font-semibold text-text-primary">{i + 1}. {arg.eixo}</span>
            }
          >
            <div className="space-y-4">
              {/* Argumento principal */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-success" />
                  <span className="text-[11px] uppercase tracking-wider text-success font-medium">Argumento</span>
                  <CopyButton text={arg.argumento} className="ml-auto" />
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{arg.argumento}</p>
              </div>

              {/* Objeção */}
              <div className="p-3 rounded-xl bg-error/5 border border-error/15">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareWarning className="h-3.5 w-3.5 text-error" />
                  <span className="text-[11px] uppercase tracking-wider text-error font-medium">Objeção provável</span>
                </div>
                <p className="text-sm text-text-primary font-medium italic">"{arg.objecao}"</p>
              </div>

              {/* Resposta */}
              <div className="p-3 rounded-xl bg-success/5 border border-success/15">
                <div className="flex items-center gap-2 mb-2">
                  <Reply className="h-3.5 w-3.5 text-success" />
                  <span className="text-[11px] uppercase tracking-wider text-success font-medium">Resposta</span>
                  <CopyButton text={arg.resposta} className="ml-auto" />
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{arg.resposta}</p>
              </div>

              {/* ROI */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-border">
                <DollarSign className="h-3.5 w-3.5 text-red" />
                <span className="text-xs font-mono font-semibold text-red">{arg.impactoROI}</span>
              </div>
            </div>
          </AccordionItem>
        ))}
      </div>

      {/* Síntese */}
      <div className="p-5 rounded-xl bg-red/5 border border-red/20">
        <h4 className="text-sm font-semibold text-red mb-2">Síntese da proposta</h4>
        <p className="text-sm text-text-secondary leading-relaxed">
          A {lead.companyName} tem potencial claro de crescimento no segmento de {lead.segment || 'seu segmento'},
          mas está limitada por {lead.hypotheticalTrap || 'gargalos operacionais'}. O Destrava Receita resolve isso
          em 90 dias com diagnóstico preciso + implementação ágil. Próximo passo recomendado: diagnóstico DR-X.
        </p>
        <CopyButton
          text={`A ${lead.companyName} tem potencial claro de crescimento, mas está limitada por ${lead.hypotheticalTrap || 'gargalos operacionais'}. O Destrava Receita resolve em 90 dias. Próximo passo: diagnóstico DR-X.`}
          label="Copiar síntese"
          className="mt-3"
        />
      </div>
    </div>
  )
}
