import { CopyButton } from '../ui/CopyButton'
import { AccordionItem } from '../ui/AccordionItem'
import { parseJsonField } from '../../lib/utils'
import type { Lead, MeetingPrep } from '../../types'
import { Clock, Shield, CheckSquare } from 'lucide-react'

const DEFAULT_AGENDA: MeetingPrep['agenda'] = [
  { minutos: '0–5 min', objetivo: 'Abertura e rapport', script: 'Olá [decisor], obrigado pelo tempo. Vi que a [empresa] atua no segmento de [segmento] há [anos] anos — parabéns pela trajetória. Quero entender melhor o cenário atual para ver se faz sentido conversarmos sobre crescimento.' },
  { minutos: '5–15 min', objetivo: 'Discovery — entender a situação atual', script: 'Como está estruturada a operação comercial hoje? Quantas pessoas no time? Como vocês geram demanda atualmente? Qual o ticket médio e a recorrência dos clientes?' },
  { minutos: '15–25 min', objetivo: 'Quantificar impacto e dor', script: 'Se eu entendi bem, hoje vocês faturam aproximadamente [faturamento] e a principal trava é [trava]. Quanto vocês estimam que isso custa por mês em oportunidades perdidas? Se resolvêssemos isso nos próximos 6 meses, qual seria o impacto no faturamento?' },
  { minutos: '25–35 min', objetivo: 'Posicionar solução', script: 'Nós trabalhamos com empresas do segmento de [segmento] que tinham exatamente esse cenário. Com o Destrava Receita, conseguimos [resultado]. O processo funciona em 3 etapas: diagnóstico, implementação e otimização contínua.' },
  { minutos: '35–45 min', objetivo: 'Fechamento e próximos passos', script: 'Com base no que conversamos, faz sentido avançarmos para um diagnóstico detalhado? Seria uma análise aprofundada de [trava] com projeção de resultados. Posso preparar para [data]?' },
]

const DEFAULT_OBJECTIONS = [
  { objecao: 'Já temos uma agência', resposta: 'Entendo. A questão não é substituir, é complementar. Muitas agências focam em execução tática. O que proponho é um diagnóstico estratégico da operação de receita — que identifica onde os R$ estão travados, independente de quem executa depois.' },
  { objecao: 'Não é prioridade agora', resposta: 'Respeito totalmente. Só uma pergunta: o faturamento está onde vocês gostariam? Se a trava de [trava] persistir mais 6 meses, quanto isso representa em receita perdida? Às vezes o "agora" é justamente o melhor momento.' },
  { objecao: 'Preciso falar com meu sócio', resposta: 'Claro, faz sentido alinhar. Para facilitar a conversa, posso preparar um resumo executivo com a projeção de resultados para vocês analisarem juntos. Quando seria a melhor data para reconectarmos?' },
  { objecao: 'Quanto custa?', resposta: 'Depende do escopo do diagnóstico. Mas para contextualizar: se a trava de [trava] está custando R$ [impacto]/mês, o investimento no diagnóstico se paga no primeiro mês de implementação. Posso detalhar os cenários?' },
  { objecao: 'Já tentamos marketing digital e não funcionou', resposta: 'Entendo a frustração. A diferença é que não somos uma agência de marketing — somos consultoria de receita. Antes de qualquer ação, fazemos o diagnóstico para identificar exatamente onde a operação está travada. Muitas vezes o problema não é o marketing, é a operação comercial.' },
]

export function TabReuniao({ lead }: { lead: Lead }) {
  const meetingData = parseJsonField<MeetingPrep>(lead.meetingPrep, {
    agenda: DEFAULT_AGENDA,
    objecoes: DEFAULT_OBJECTIONS,
    checklist: ['Revisar ficha completa da empresa', 'Anotar 3 perguntas personalizadas', 'Preparar case similar do segmento', 'Testar link da videoconferência', 'Ter projeção de cenários aberta'],
  })

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\[decisor\]/g, lead.companyName)
      .replace(/\[empresa\]/g, lead.companyName)
      .replace(/\[segmento\]/g, lead.segment || 'seu segmento')
      .replace(/\[anos\]/g, String(lead.yearsInMarket || 'X'))
      .replace(/\[faturamento\]/g, lead.monthlyRevenue ? `R$ ${(lead.monthlyRevenue / 1000).toFixed(0)}k/mês` : 'R$ X/mês')
      .replace(/\[trava\]/g, lead.hypotheticalTrap || 'principal gargalo')
      .replace(/\[impacto\]/g, 'X')
      .replace(/\[resultado\]/g, 'destravar a receita em até 90 dias')
      .replace(/\[data\]/g, 'esta semana')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-red" />
        <h3 className="text-sm font-semibold font-heading">Agenda de reunião — 45 minutos</h3>
      </div>

      {/* Agenda */}
      <div className="space-y-3">
        {meetingData.agenda.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-red bg-red/10 px-2 py-0.5 rounded-md">{item.minutos}</span>
                <span className="text-sm font-semibold text-text-primary">{item.objetivo}</span>
              </div>
              <CopyButton text={replacePlaceholders(item.script)} label="Copiar" />
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{replacePlaceholders(item.script)}</p>
          </div>
        ))}
      </div>

      {/* Objeções */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold font-heading">Tratamento de objeções</h3>
        </div>
        <div className="space-y-2">
          {meetingData.objecoes.map((obj, i) => (
            <AccordionItem
              key={i}
              title={
                <span className="text-sm font-medium text-text-primary">"{obj.objecao}"</span>
              }
              accentColor="var(--color-warning)"
            >
              <div className="space-y-2">
                <p className="text-sm text-text-secondary leading-relaxed">{replacePlaceholders(obj.resposta)}</p>
                <CopyButton text={replacePlaceholders(obj.resposta)} label="Copiar resposta" />
              </div>
            </AccordionItem>
          ))}
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold font-heading">Checklist pré-reunião</h3>
        </div>
        <div className="space-y-2">
          {meetingData.checklist.map((item, i) => (
            <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-red" />
              <span className="text-sm text-text-secondary">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
