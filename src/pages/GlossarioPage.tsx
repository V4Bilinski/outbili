import { useState } from 'react'
import { Search } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'

interface GlossaryTerm {
  term: string
  definition: string
  example: string
}

const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'SPICED',
    definition: 'Situation, Pain, Impact, Critical Event, Decision — framework de qualificação em 5 dimensões. Score ponderado: S (25%) + P (25%) + I (20%) + C (15%) + D (15%).',
    example: 'Cada lead recebe score SPICED automático que define a temperatura.',
  },
  {
    term: 'LTP',
    definition: 'Lifetime Throughput do Projeto — quanto ganho a unidade V4 gera com aquele cliente ao longo do contrato. Fórmula: (Fee mensal - Custo variável) x Meses de contrato.',
    example: 'O LTP médio do pipeline é calculado na Dashboard.',
  },
  {
    term: 'Temperatura',
    definition: 'Classificação de prioridade do lead baseada no score SPICED. Quente (3.7–5.0): pronto para contato. Morno (2.5–3.6): qualificar mais. Frio (1.0–2.4): necessita trabalho.',
    example: 'Leads quentes aparecem primeiro nas Próximas Ações.',
  },
  {
    term: 'Tier',
    definition: 'Faixa de faturamento do prospect que define o potencial de investimento. Micro+ (R$ 70k–100k), Small (R$ 100k–200k), Medium- (R$ 200k–830k), Medium= (R$ 830k–2M).',
    example: 'O tier define o percentual de LTP na Tab Projeção.',
  },
  {
    term: 'Trava',
    definition: 'Uma das 8 restrições que limitam a receita de uma empresa, baseadas na Teoria das Restrições (TOC) de Goldratt. T1 (Cegueira) a T8 (Dependência).',
    example: 'O sistema detecta a trava do prospect automaticamente e exibe no card do pipeline.',
  },
  {
    term: 'Destrava Receita',
    definition: 'Metodologia V4 de resolução de travas em ciclos de 90 dias. Produtos: DR-X (diagnóstico rápido), DR-O (operacional), DR-T (tático), DR-E (estratégico).',
    example: 'A Tab Argumentos menciona o Destrava Receita como solução natural.',
  },
  {
    term: 'Cascata',
    definition: '3 níveis de busca Assertiva para encontrar o telefone do decisor. Nível 1: CNPJ (empresa). Nível 2: Decisores (protocolo). Nível 3: CPF do sócio (celular pessoal).',
    example: 'A cascata roda automaticamente durante o enriquecimento.',
  },
  {
    term: 'Stage Gate',
    definition: 'Checklist obrigatória antes de avançar um lead no pipeline. Garante que nenhuma etapa seja pulada.',
    example: 'O pipeline Kanban usa stage gates em cada coluna.',
  },
  {
    term: 'Linha de Montagem',
    definition: 'Metáfora do fluxo completo do OUTBILI: Pesquisa > Enriquecimento > Qualificação > Inteligência > Prospecção. Cada estação tem uma regra de liberação.',
    example: 'O bloco Linha de Montagem na Dashboard mostra leads em cada estação.',
  },
  {
    term: 'Throughput',
    definition: 'Taxa na qual o sistema gera dinheiro ATRAVÉS DAS VENDAS. Não é produção — se produziu e não vendeu, não é ganho. Prioridade absoluta sobre corte de custos.',
    example: 'O card Throughput na Dashboard mostra contratos fechados no período.',
  },
  {
    term: 'Fábrica de Receita',
    definition: 'Metodologia V4 Company para construir sistema previsível de geração de receita. 4 Pilares: Tráfego, Engajamento, Conversão, Retenção. Framework STEP: Situação, Trava, Estratégia, Plano.',
    example: 'A Dashboard inteira é estruturada como painel da Fábrica de Receita.',
  },
  {
    term: 'LeadBroker',
    definition: 'Canal de aquisição de leads gerenciado pela V4 Company (matriz). Canal padrão da rede V4. O OUTBILI foi criado para diversificar aquisição e não depender exclusivamente deste canal.',
    example: 'O bloco Diversificação de Canais na Dashboard mostra % OUTBILI vs LeadBroker.',
  },
]

export function GlossarioPage() {
  const [search, setSearch] = useState('')

  const filtered = GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(search.toLowerCase()) ||
      g.definition.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimateIn>
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Glossário</h1>
          <p className="text-xs text-text-muted mt-0.5">Termos e conceitos do OUTBILI e da metodologia V4</p>
        </div>
      </AnimateIn>

      <SectionDivider />

      {/* Search */}
      <AnimateIn delay={80}>
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar termo ou definição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-red/30 focus:ring-1 focus:ring-red/20 transition-colors"
          />
        </div>
      </AnimateIn>

      {/* Count */}
      {search && (
        <p className="text-xs text-text-muted">
          {filtered.length === 0
            ? 'Nenhum termo encontrado'
            : `${filtered.length} ${filtered.length === 1 ? 'termo encontrado' : 'termos encontrados'}`}
        </p>
      )}

      {/* Terms list */}
      <div className="space-y-3">
        {filtered.map((item, index) => (
          <AnimateIn key={item.term} delay={100 + Math.min(index, 10) * 40}>
            <Card className="space-y-2 hover:border-border-strong hover:-translate-y-0.5 transition-all duration-300">
              <h2 className="text-base font-bold text-text-primary tracking-tight">{item.term}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{item.definition}</p>
              <p className="text-xs text-text-muted italic border-l-2 border-red/20 pl-3">
                {item.example}
              </p>
            </Card>
          </AnimateIn>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum resultado para "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
