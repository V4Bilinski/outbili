import { AccordionItem } from '../ui/AccordionItem'
import type { Lead } from '../../types'
import { Clock, Shield, CheckSquare, Lightbulb, Target, Zap, Brain, Heart, AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/Badge'

interface AgendaBlock {
  minutos: string
  titulo: string
  objetivo: string
  gatilho: string
  gatilhoIcon: 'rapport' | 'dor' | 'impacto' | 'autoridade' | 'urgencia'
  tom: string
  sugestaoInteracao: string
  perguntasChave: string[]
  sinaisPositivos: string[]
  sinaisAlerta: string[]
  dicaTatica: string
}

function buildAgenda(lead: Lead): AgendaBlock[] {
  const empresa = lead.companyName
  const segmento = lead.segment || 'seu segmento'
  const trava = lead.hypotheticalTrap || 'gargalo de receita'
  const faturamento = lead.monthlyRevenue ? `R$ ${(lead.monthlyRevenue / 1000).toFixed(0)}k/mês` : 'o faturamento atual'

  return [
    {
      minutos: '0–5 min',
      titulo: 'Abertura e rapport',
      objetivo: 'Criar conexão genuína e definir expectativa da conversa',
      gatilho: 'Reciprocidade + Rapport',
      gatilhoIcon: 'rapport',
      tom: 'Leve, curioso, humano. Não vender nada nesse momento.',
      sugestaoInteracao: `Comece reconhecendo algo específico sobre a ${empresa} — um projeto, o tempo de mercado, uma avaliação no Google. Demonstre que fez o dever de casa. Depois, alinhe que o objetivo é entender se faz sentido trabalharem juntos — sem compromisso.`,
      perguntasChave: [
        `Como está sendo o ritmo comercial da ${empresa} nesse trimestre?`,
        'O que te motivou a aceitar essa conversa?',
      ],
      sinaisPositivos: ['Fala abertamente sobre desafios', 'Demonstra curiosidade', 'Menciona metas de crescimento'],
      sinaisAlerta: ['Respostas monossilábicas', 'Parece com pressa', 'Delega para outra pessoa'],
      dicaTatica: `Mencionar que conhece o segmento de ${segmento} e que trabalha com empresas similares — isso ativa o viés de prova social antes mesmo de apresentar qualquer coisa.`,
    },
    {
      minutos: '5–15 min',
      titulo: 'Discovery — situação e dor',
      objetivo: `Fazer o decisor verbalizar os problemas que a ${empresa} enfrenta`,
      gatilho: 'Aversão a perda + Comprometimento',
      gatilhoIcon: 'dor',
      tom: 'Consultivo, empático, investigativo. Faça perguntas abertas e escute mais do que fala.',
      sugestaoInteracao: `Nesse bloco, o objetivo é que o decisor fale 80% do tempo. Cada resposta dele é munição para o posicionamento da solução. Use espelhamento: repita as últimas palavras que ele disse para aprofundar. Quando ele mencionar um problema, pergunte "e quanto isso custa por mês?" para ativar aversão a perda.`,
      perguntasChave: [
        `Hoje, de onde vêm os novos clientes da ${empresa}? Indicação, tráfego orgânico, algum canal pago?`,
        `Se amanhã o melhor vendedor sair, quanto de receita vai junto com ele?`,
        `Qual é a meta de faturamento para este ano? Vocês estão no ritmo ou tem meses de vale?`,
        `O que vocês já tentaram para resolver isso e por que não funcionou?`,
      ],
      sinaisPositivos: ['Compartilha números reais', 'Reconhece gaps na operação', 'Faz perguntas de volta'],
      sinaisAlerta: ['Diz que "está tudo bem"', 'Não compartilha números', 'Desvia das perguntas de dor'],
      dicaTatica: 'Se ele disser "está tudo bem", use a técnica do contraste: "Entendo, mas se eu perguntasse ao time comercial, eles diriam a mesma coisa?" — isso quebra a barreira do ego do decisor.',
    },
    {
      minutos: '15–25 min',
      titulo: 'Quantificação de impacto',
      objetivo: `Transformar problemas abstratos em números concretos (R$) que o decisor não pode ignorar`,
      gatilho: 'Ancoragem + Aversão a perda',
      gatilhoIcon: 'impacto',
      tom: 'Direto, factual, sem julgamento. Use números para criar urgência natural.',
      sugestaoInteracao: `Agora é o momento de pegar tudo que ele disse no discovery e traduzir em impacto financeiro. Se ele mencionou que perde clientes, calcule junto: "Se vocês perdem X clientes por mês e o ticket médio é Y, estamos falando de R$ Z/mês saindo pela porta". Ancore no maior número possível — o cérebro vai usar esse valor como referência para todo o resto da conversa.`,
      perguntasChave: [
        `Faturando ${faturamento}, quantos % disso depende de 1-2 canais ou pessoas específicas?`,
        `Se resolvêssemos ${trava} nos próximos 90 dias, qual o impacto no faturamento anual?`,
        `Quanto vocês estimam que gastam "apagando incêndio" no comercial em vez de crescendo?`,
      ],
      sinaisPositivos: ['Calcula junto com você', 'Fica surpreso com os números', 'Pede para agendar próxima conversa'],
      sinaisAlerta: ['Minimiza os números', 'Diz que "não é tanto assim"', 'Muda de assunto'],
      dicaTatica: `Use a projeção de cenários: "No cenário conservador, resolver apenas ${trava} já representa R$ X/mês. No agressivo, com todas as travas resolvidas, estamos falando de R$ Y/ano". O cenário agressivo ancora alto, o conservador parece "o mínimo" — ambos favorecem a decisão.`,
    },
    {
      minutos: '25–35 min',
      titulo: 'Posicionamento da solução',
      objetivo: 'Conectar as dores expostas ao Destrava Receita como solução natural',
      gatilho: 'Autoridade + Prova social',
      gatilhoIcon: 'autoridade',
      tom: 'Confiante, sem ser arrogante. Fale de resultados, não de features.',
      sugestaoInteracao: `Não apresente o Destrava Receita como "produto" — posicione como a solução lógica para tudo que foi discutido. Use a estrutura: "Empresas do segmento de ${segmento} que tinham exatamente esse cenário conseguiram [resultado] em [prazo]". Cite números reais de cases similares. O decisor precisa pensar "isso funciona para empresas como a minha".`,
      perguntasChave: [
        'Faz sentido o que estou descrevendo? Consegue ver isso aplicado na operação de vocês?',
        'O que mais te preocupa em implementar algo assim?',
      ],
      sinaisPositivos: ['Pergunta "como funciona"', 'Pede exemplos/cases', 'Fala sobre implementação prática'],
      sinaisAlerta: ['Fica em silêncio', 'Diz "vou pensar"', 'Compara com agência anterior'],
      dicaTatica: `Se ele comparar com experiência anterior ruim, use: "Exatamente por isso o diagnóstico vem primeiro. Diferente de agência que executa sem entender o negócio, nós mapeamos onde o R$ está travado antes de qualquer ação". Isso neutraliza a objeção e posiciona diferencial.`,
    },
    {
      minutos: '35–45 min',
      titulo: 'Fechamento e próximos passos',
      objetivo: 'Garantir compromisso concreto — diagnóstico agendado ou próxima reunião com sócios',
      gatilho: 'Urgência + Escassez + Comprometimento',
      gatilhoIcon: 'urgencia',
      tom: 'Firme, objetivo, sem pressão artificial. O decisor precisa sentir que a decisão é dele.',
      sugestaoInteracao: `Não pergunte "o que acha?" — pergunte "faz sentido avançarmos para o diagnóstico na quinta ou sexta?" (escolha binária, ambas avançam). Se precisar de sócio, marque a próxima reunião ali mesmo — "Vou mandar o convite agora, qual o melhor horário?". Cada dia sem compromisso concreto é um dia de esfriamento.`,
      perguntasChave: [
        `Com base no que conversamos, faz sentido fazermos o diagnóstico detalhado de ${trava}?`,
        'Quinta ou sexta funciona melhor para iniciarmos?',
        'Tem mais alguém que precisa participar dessa decisão?',
      ],
      sinaisPositivos: ['Confirma data', 'Pergunta sobre próximos passos', 'Pede para incluir sócio na próxima'],
      sinaisAlerta: ['"Vou pensar e te retorno"', '"Manda uma proposta por email"', 'Não se compromete com data'],
      dicaTatica: 'Se ele disser "vou pensar", pergunte: "Claro, respeito. Me ajuda a entender — o que especificamente precisa avaliar? Talvez eu consiga esclarecer agora e a gente economiza uma semana". Isso transforma a objeção em oportunidade de resolver na hora.',
    },
  ]
}

const OBJECTIONS = [
  {
    objecao: '"Estamos crescendo bem do jeito que estamos."',
    gatilho: 'Viés do status quo',
    abordagem: 'Não confronte. Valide e use contraste temporal.',
    resposta: 'Fico feliz em ouvir isso — empresas que crescem são as que mais se beneficiam de estrutura. A pergunta não é se vocês estão bem agora, é se daqui 12 meses com o mesmo modelo vão atingir o dobro. Geralmente a resposta revela a oportunidade.',
  },
  {
    objecao: '"Não temos budget agora."',
    gatilho: 'Aversão a perda (invertida)',
    abordagem: 'Reframe: o custo é não fazer nada.',
    resposta: 'Entendo a priorização de recursos. Mas se a trava está custando R$ X por mês, em 3 meses de espera são R$ 3X que não voltam. O diagnóstico é justamente para mostrar com precisão qual é esse número — muitas vezes o investimento se paga no mês 1.',
  },
  {
    objecao: '"Já tentamos com agência e não funcionou."',
    gatilho: 'Viés de confirmação negativo',
    abordagem: 'Diferencie o processo, não o serviço.',
    resposta: 'Isso confirma o que fazemos de diferente. Agência vende execução, nós fazemos diagnóstico de receita. Antes de qualquer campanha, entendemos onde o R$ trava no processo comercial inteiro. Se o funil está quebrado, investir em tráfego só joga dinheiro num balde furado.',
  },
  {
    objecao: '"Preciso alinhar com meu sócio."',
    gatilho: 'Diluição de decisão',
    abordagem: 'Não bloqueie. Facilite e mantenha controle.',
    resposta: 'Total sentido. Para facilitar: posso preparar um resumo executivo de 1 página com o diagnóstico preliminar e a projeção. Quando seria a melhor janela para uma call de 15 minutos com os dois? Assim o sócio já entra com o contexto e decidem juntos.',
  },
  {
    objecao: '"Manda uma proposta por email."',
    gatilho: 'Fuga de compromisso',
    abordagem: 'Redirecione para compromisso presencial.',
    resposta: 'Posso mandar sim. Mas pela experiência, propostas no email viram PDF esquecido. O que funciona é uma apresentação ao vivo de 20 minutos com projeção personalizada. Consigo encaixar amanhã ou quinta — qual prefere?',
  },
]

const gatilhoIcons = {
  rapport: Heart,
  dor: AlertTriangle,
  impacto: Target,
  autoridade: Brain,
  urgencia: Zap,
}

const gatilhoColors = {
  rapport: 'text-success',
  dor: 'text-error',
  impacto: 'text-warning',
  autoridade: 'text-info',
  urgencia: 'text-red',
}

export function TabReuniao({ lead }: { lead: Lead }) {
  const agenda = buildAgenda(lead)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-red" />
          <h3 className="text-sm font-semibold font-heading">Guia consultivo de reunião — 45 minutos</h3>
        </div>
        <Badge variant="info" size="sm">Gatilhos mentais ativos</Badge>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Este guia prepara o vendedor para cada momento da call com tom, gatilhos e sinais de leitura do cliente.
        Não é um script rígido — é uma bússola consultiva para adaptar em tempo real.
      </p>

      {/* Agenda blocks */}
      <div className="space-y-4">
        {agenda.map((block, i) => {
          const GatilhoIcon = gatilhoIcons[block.gatilhoIcon]
          const gatilhoColor = gatilhoColors[block.gatilhoIcon]

          return (
            <div key={i} className="rounded-2xl bg-white/[0.02] border border-border overflow-hidden">
              {/* Block header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-white/[0.01]">
                <span className="text-label font-mono text-red bg-red/10 px-2.5 py-1 rounded-lg font-bold">{block.minutos}</span>
                <h4 className="text-sm font-bold text-text-primary flex-1">{block.titulo}</h4>
                <div className={`flex items-center gap-1.5 ${gatilhoColor}`}>
                  <GatilhoIcon className="h-3.5 w-3.5" />
                  <span className="text-caption font-semibold uppercase tracking-wider">{block.gatilho}</span>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Objetivo */}
                <div>
                  <p className="text-caption uppercase tracking-wider text-text-muted font-medium mb-1">Objetivo</p>
                  <p className="text-sm text-text-primary font-medium">{block.objetivo}</p>
                </div>

                {/* Tom */}
                <div className="p-3 rounded-xl bg-white/[0.03] border-l-[3px] border-l-info">
                  <p className="text-caption uppercase tracking-wider text-info font-medium mb-1">Tom e postura</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{block.tom}</p>
                </div>

                {/* Sugestão de interação */}
                <div className="p-3 rounded-xl bg-red/5 border-l-[3px] border-l-red">
                  <p className="text-caption uppercase tracking-wider text-red font-medium mb-1">Como conduzir este momento</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{block.sugestaoInteracao}</p>
                </div>

                {/* Perguntas-chave */}
                <div>
                  <p className="text-caption uppercase tracking-wider text-text-muted font-medium mb-2">Perguntas para fazer</p>
                  <div className="space-y-1.5">
                    {block.perguntasChave.map((q, j) => (
                      <div key={j} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.02]">
                        <Lightbulb className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                        <p className="text-sm text-text-secondary italic">"{q}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sinais de leitura */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-success/5 border border-success/10">
                    <p className="text-caption uppercase tracking-wider text-success font-medium mb-2">Sinais positivos</p>
                    <ul className="space-y-1">
                      {block.sinaisPositivos.map((s, j) => (
                        <li key={j} className="text-xs text-text-secondary flex items-start gap-1.5">
                          <span className="text-success mt-0.5">+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-error/5 border border-error/10">
                    <p className="text-caption uppercase tracking-wider text-error font-medium mb-2">Sinais de alerta</p>
                    <ul className="space-y-1">
                      {block.sinaisAlerta.map((s, j) => (
                        <li key={j} className="text-xs text-text-secondary flex items-start gap-1.5">
                          <span className="text-error mt-0.5">!</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Dica tática */}
                <div className="p-3 rounded-xl bg-warning/5 border border-warning/10">
                  <p className="text-caption uppercase tracking-wider text-warning font-medium mb-1">Dica tática</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{block.dicaTatica}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tratamento de objeções */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold font-heading">Quebra de objeções — gatilhos de resposta</h3>
        </div>
        <p className="text-xs text-text-muted mb-4">
          Respostas preparadas para os bloqueios mais prováveis. Cada uma usa um gatilho psicológico específico.
        </p>

        <div className="space-y-3">
          {OBJECTIONS.map((obj, i) => (
            <AccordionItem
              key={i}
              accentColor="var(--color-warning)"
              title={
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">{obj.objecao}</span>
                  <Badge variant="warning" size="sm">{obj.gatilho}</Badge>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-warning/5">
                  <p className="text-caption uppercase tracking-wider text-warning font-medium mb-1">Abordagem</p>
                  <p className="text-xs text-text-secondary">{obj.abordagem}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border-l-[3px] border-l-success">
                  <p className="text-caption uppercase tracking-wider text-success font-medium mb-1">Sugestão de resposta</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{obj.resposta}</p>
                </div>
              </div>
            </AccordionItem>
          ))}
        </div>
      </div>

      {/* Checklist pré-reunião */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckSquare className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold font-heading">Checklist pré-reunião</h3>
        </div>
        <div className="space-y-2">
          {[
            'Revisar ficha completa + tab SPICED da empresa',
            'Anotar 2 dados específicos para rapport (tempo de mercado, avaliação Google, certificação)',
            'Preparar cálculo de impacto financeiro da trava dominante',
            'Ter projeção de 3 cenários aberta na tab Projeção',
            'Revisar vulnerabilidades na tab Vulnerabilidades',
            'Testar link da videoconferência 5 min antes',
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded accent-red cursor-pointer" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
