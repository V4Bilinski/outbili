# Qualificacao SPICED

---
name: qualificar-spiced
description: Qualificacao SPICED completa do prospect para definir fit, urgencia e produto DR adequado
agent: especialista-spiced
---

## Objetivo

Qualificar o prospect usando o framework SPICED (Situation, Pain, Impact, Critical Event, Decision)
para determinar se existe fit real para um produto DR, qual o nivel de urgencia, e qual produto
e mais adequado para o contexto do cliente.

## Pre-requisitos

- Nome da empresa e contato (quem sera qualificado)
- Canal de entrada do lead (inbound, outbound, indicacao, evento)
- Informacoes iniciais disponiveis (site, LinkedIn, pitch, reuniao anterior)
- Produto DR target (ou deixar em aberto para definir na qualificacao)

## Passos

### Step 1: Preparacao Pre-Call

Antes da conversa de qualificacao, pesquisar:

**Sobre a empresa:**
- Faturamento estimado (Receita Federal, LinkedIn, Glassdoor, SimilarWeb)
- Segmento e modelo de negocio (B2B, B2C, B2B2C, SaaS, servicos, ecommerce)
- Tamanho do time (LinkedIn, site de carreira)
- Noticias recentes (expansao, contratacoes, funding, problemas)
- Stack de tecnologia em uso (BuiltWith, LinkedIn Tech Skills)

**Sobre o contato:**
- Cargo e nivel hierarquico (decisor, influenciador, usuario)
- Tempo na empresa e historico
- Conteudo que publicou recentemente (sinais de dores)
- Conexoes em comum

**Hipotese de trava:**
Com base na pesquisa, qual a trava mais provavel? Preparar perguntas direcionadas.

### Step 2: Qualificacao S — Situacao

**Objetivo:** Entender onde a empresa esta hoje.

**Perguntas SPICED - Situacao:**
1. "Como esta estruturada hoje a operacao de growth e vendas de voces?"
2. "Qual o modelo de aquisicao principal — inbound, outbound ou ambos?"
3. "Voces usam algum CRM? Como e o processo de vendas hoje?"
4. "Qual o faturamento mensal atual (aproximado ou faixa)?"
5. "Ha quanto tempo a empresa esta no mercado e qual o tamanho do time?"

**Registro:**
```
Situacao atual:
  Faturamento: R$[valor]/mes
  Time comercial: [N] pessoas ([cargo])
  Modelo de aquisicao: [inbound/outbound/misto]
  Stack principal: [CRM, marketing, analytics]
  Momento da empresa: [crescendo/estavel/com dificuldades]
```

### Step 3: Qualificacao P — Pain (Dor)

**Objetivo:** Identificar a dor real, nao o sintoma.

**Perguntas SPICED - Dor:**
1. "Qual e o maior obstaculo para voces crescerem mais rapido hoje?"
2. "Se voce olhar para os ultimos 90 dias, o que mais te frustrou nos numeros?"
3. "Onde voce sente que esta deixando mais dinheiro na mesa?"
4. "Se voce pudesse consertar uma coisa amanha, o que seria?"
5. "Qual e o maior risco que voce ve no crescimento dos proximos 12 meses?"

**Mapeamento de dor para trava:**
| Resposta tipica | Trava Provavel |
|-----------------|---------------|
| "Nao sei o que esta funcionando" | T1 Cegueira |
| "Pouco trafego, poucos leads" | T2 Silencio |
| "Leads chegam mas nao engajam" | T3 Frieza |
| "Engajam mas nao compram" | T4 Desconfianca |
| "Muito abandono no processo" | T5 Abandono |
| "Time nao fecha bem" | T6 Incompetencia |
| "Ciclo de venda muito longo" | T7 Complexidade |
| "Clientes saem muito rapido" | T8 Evasao |

**Registro:**
```
Dor principal: [descricao]
Trava provavel: T[N] — [nome]
Intensidade da dor (1-10): [N]
Quanto tempo com essa dor: [X meses/anos]
```

### Step 4: Qualificacao I — Impact (Impacto)

**Objetivo:** Quantificar o impacto financeiro da dor.

**Perguntas SPICED - Impacto:**
1. "Se voce nao resolver isso nos proximos 12 meses, o que acontece com o negocio?"
2. "Quantos clientes novos voce esta deixando de fechar por conta disso?"
3. "O que esse problema custa, em termos financeiros, por mes?"
4. "Como essa situacao afeta o time? Tem impacto em motivacao ou retencao?"
5. "Qual seria o valor de resolver isso completamente?"

**Calculo do impacto:**
```
Impacto direto:
  Receita perdida/mes: R$[valor]
  Custo do problema/mes: R$[valor]
  Total: R$[valor]/mes = R$[valor]/ano

Impacto indireto:
  Oportunidade de custo: [descricao]
  Risco estrategico: [descricao]
```

**Criterio de qualificacao por impacto:**
- Impacto > 5x o valor do produto DR = FORTE (seguir)
- Impacto 2-5x = MODERADO (seguir com cautela)
- Impacto < 2x = FRACO (refinar hipotese ou desqualificar)

### Step 5: Qualificacao C — Critical Event (Evento Critico)

**Objetivo:** Identificar urgencia real ou criar urgencia legitima.

**Perguntas SPICED - Evento Critico:**
1. "Ha algum prazo ou evento que torna esse problema urgente agora?"
2. "O que acontece especificamente se voce nao resolver isso ate [data]?"
3. "Existe alguma iniciativa planejada que depende disso estar resolvido?"
4. "Qual o melhor momento para comecar — agora ou em [mes]? Por que?"
5. "Tem alguma janela de decisao no seu planejamento para isso?"

**Tipos de eventos criticos:**
- **Organico:** Meta de crescimento para o ano, expansao planejada, funding esperado
- **Sazonal:** Alta temporada se aproximando, campanha planejada
- **Competitivo:** Concorrente ganhando mercado, risco de perda de posicao
- **Operacional:** Time crescendo, precisam de processo antes de escalar
- **Financeiro:** Meta de faturamento, prazo do investidor, break-even

**Registro:**
```
Evento critico: [descricao]
Data limite: [data ou "nao identificado"]
Urgencia (1-10): [N]
```

### Step 6: Qualificacao D — Decision (Decisao)

**Objetivo:** Mapear o processo de decisao e os stakeholders.

**Perguntas SPICED - Decisao:**
1. "Quem mais seria envolvido na decisao de contratar uma solucao dessas?"
2. "Como voces tomam decisoes de investimento nessa faixa de valor?"
3. "Existe budget aprovado ou precisa passar por aprovacao?"
4. "Qual seria o processo ate a assinatura — quantas etapas?"
5. "O que poderia travar ou atrasar essa decisao?"

**Mapa de stakeholders:**
```
Decision Maker: [nome, cargo] — [contato direto: sim/nao]
Champion: [nome, cargo] — [nossa dor: alta/media/baixa]
Influenciadores: [nomes, cargos]
Bloqueadores potenciais: [nomes, motivos]

Processo de decisao: [X etapas, prazo estimado de X dias]
Budget: [aprovado / precisa aprovacao / nao definido]
```

### Step 7: Scoring Final SPICED

| Dimensao | Score (1-5) | Justificativa |
|----------|-------------|---------------|
| Situacao mapeada | /5 | |
| Dor clara e confirmada | /5 | |
| Impacto quantificado | /5 | |
| Evento critico identificado | /5 | |
| Decisao mapeada | /5 | |
| **TOTAL** | **/25** | |

**Classificacao:**
- 20-25: QUENTE — avançar para proposta DR imediatamente
- 14-19: MORNO — nutrir e marcar follow-up em 2 semanas
- 8-13: FRIO — adicionar em nurture de longo prazo
- 0-7: DESQUALIFICADO — registrar motivo e arquivar

## Output

- **Ficha SPICED** completa do prospect
- **Trava provavel** com justificativa
- **Impacto financeiro** quantificado
- **Score SPICED** (0-25) e classificacao (quente/morno/frio)
- **Recomendacao:** produto DR e proximo passo

## Validacao

- [ ] Todos os 5 elementos SPICED foram cobertos na conversa?
- [ ] O impacto foi quantificado em termos financeiros (nao so qualitativo)?
- [ ] O decision maker foi identificado?
- [ ] O score SPICED foi calculado de forma objetiva?
- [ ] O proximo passo e claro e tem data definida?
