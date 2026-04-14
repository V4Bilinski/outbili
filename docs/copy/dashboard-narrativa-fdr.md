# Dashboard — Narrativa Fábrica de Receita

## Propósito

A DashboardPage não é um painel de métricas genéricas. É o **painel de controle da Fábrica de Receita** da V4 Bilinski & Co. Cada número, cada card, cada ação rápida deve ser mapeado para a metodologia.

---

## Estrutura Narrativa da Dashboard

### Bloco 1: Status da Linha de Montagem

**Título:** "Sua Fábrica de Receita — Hoje"

| Card | Métrica | Narrativa FDR | Conexão com Trava |
|------|---------|---------------|-------------------|
| **Throughput** | Contratos fechados no período | "Receita gerada ATRAVÉS de vendas — não propostas enviadas, não reuniões feitas. Contratos assinados." | Resultado final — todas as travas destravadas |
| **Pipeline Ativo** | Leads em estações 1-5 | "Leads em processamento na linha de montagem. Cada um numa estação diferente." | T5 (Qualificação) — leads precisam estar no estágio certo |
| **Leads Quentes** | Temperatura = Quente | "Leads com SPICED >= 3.7. Prontos para reunião. Esses são prioridade 1." | T1 (Cegueira eliminada) — diagnóstico feito |
| **Taxa de Conversão** | Fechados / Total de leads | "Eficiência da linha. Quanto maior, menos desperdício." | Saúde geral do sistema |

### Bloco 2: As 8 Travas — Visão Rápida

**Título:** "Diagnóstico de Travas — Seus Prospects"

Distribuição dos leads por trava detectada:

| Trava | Label | Indicador |
|-------|-------|-----------|
| T1 | Cegueira | Leads sem dados suficientes para SPICED |
| T2 | Exposição | Leads novos ainda não contactados |
| T3 | Atenção | Leads contactados sem resposta |
| T4 | Interesse | Leads que responderam mas não avançaram |
| T5 | Qualificação | Leads frios no pipeline (SPICED < 2.5) |
| T6 | Compromisso | Leads em "Reunião" há mais de 7 dias sem avançar |
| T7 | Decisão | Leads em "Proposta" há mais de 14 dias |
| T8 | Dependência | % de leads vindos do LeadBroker vs OUTBILI |

**Destaque visual:** A trava com mais leads acumulados é o **gargalo atual**. Destacar em vermelho.

### Bloco 3: Estações da Linha de Montagem

**Título:** "Fluxo da Linha"

Visualização horizontal das 5 estações com contagem de leads em cada uma:

```
[Pesquisa: 12] --> [Enriquecimento: 8] --> [Qualificação: 23] --> [Inteligência: 5] --> [Prospecção: 3]
```

**Regra visual:**
- Estação com MAIS leads que a próxima: cor normal (fluxo saudável)
- Estação com MENOS leads que a próxima: amarelo (acúmulo à frente, falta alimentação)
- Estação com leads parados há +7 dias: vermelho (estagnação)

### Bloco 4: Ações Rápidas Orientadas pela Trava

**Título:** "Próxima Ação — Baseada no Gargalo"

O sistema identifica a trava dominante e sugere a ação:

| Gargalo Detectado | Ação Sugerida | Botão |
|-------------------|---------------|-------|
| T2 (poucos leads) | "Sua linha está sem matéria-prima. Pescar novos leads." | [Pesquisar Leads] |
| T3 (sem resposta) | "Leads contactados sem resposta. Disparar follow-up." | [Campanhas WhatsApp] |
| T5 (leads frios) | "Pipeline com leads frios. Re-qualificar ou descartar." | [Ver Pipeline] |
| T6 (reunião parada) | "Leads em Reunião parados. Preparar e agendar." | [Ver Lead Quente] |
| T7 (proposta parada) | "Propostas em aberto. Follow-up de fechamento." | [Ver Propostas] |

### Bloco 5: LTP Pipeline

**Título:** "LTP Projetado do Pipeline"

| Métrica | Cálculo | Descrição |
|---------|---------|-----------|
| LTP Total (pipeline) | Soma do LTP estimado de todos os leads ativos | "Quanto sua linha de montagem pode gerar se tudo fechar" |
| LTP Quentes | LTP apenas dos leads com temperatura Quente | "Receita mais provável — leads prontos para fechar" |
| LTP Médio por Lead | LTP Total / n leads | "Valor médio de cada oportunidade na linha" |
| LTP/Closer/Mês | LTP Quentes / n closers / meses | "Throughput projetado por closer" |

**Fórmula LTP por lead:**
```
LTP = (monthlyRevenue * tier.ltp_percentage) * 12
```

Onde `tier.ltp_percentage` vem da tabela TIERS em constants.ts (campo `ltp`).

### Bloco 6: Canal de Aquisição — Independência

**Título:** "Diversificação de Canais"

| Métrica | O que mostra |
|---------|-------------|
| % Leads via OUTBILI (outbound) | Quantos leads vieram da prospecção própria |
| % Leads via LeadBroker | Quantos vieram do canal da matriz |
| % Leads via outros canais | Indicação, networking, inbound |
| **Meta:** | >= 40% via OUTBILI para independência saudável |

**Narrativa:** "A Trava T8 (Dependência de Canal) só é destravada quando nenhum canal sozinho representa mais de 60% da aquisição."

---

## Copy Standards para Dashboard

| Elemento | Padrão |
|----------|--------|
| Títulos de card | Curtos, orientados a ação ("Leads Quentes", não "Quantidade de leads com temperatura quente") |
| Métricas | Número grande + contexto pequeno ("23 leads — 8 prontos para reunião") |
| Ações | Verbo no infinitivo ("Pesquisar", "Disparar", "Preparar") |
| Cor | Vermelho = gargalo/urgente, Verde = throughput/fechado, Amarelo = atenção, Cinza = frio |
| Tom | Operacional-direto, sem jargão desnecessário. O operador olha e sabe o que fazer. |
| Referência FDR | Todo card deve poder ser explicado em termos de trava ou estação da linha |
