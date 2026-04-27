# Dashboard — Narrativa para o Operador

## Versão 2.0 — Reescrita para SDR, BDR e Closer

**Data:** 2026-04-27
**Squads:** Copy Squad (Kennedy + Collier) + Fábrica de Receita
**Destino:** DashboardPage do OUTBILI — primeira tela do operador comercial
**Sucessor de:** dashboard-narrativa-fdr.md (preservado como spec institucional)

---

## Propósito

A DashboardPage é a **mesa de comando** do SDR, BDR e Closer da Bilinski. Cada card responde a uma pergunta única que o operador faz mentalmente quando bate o ponto:

> **"Onde tá o dinheiro hoje? E o que eu faço primeiro?"**

Não é painel de gestor. É painel de operador. Métrica que não vira ação morre na primeira semana.

Cada card tem que passar nos 3 testes do Collier:
1. **Espelha o que o operador já tá pensando** (mental conversation)
2. **Diz onde tá o dinheiro** (LTP em algum lugar visível)
3. **Termina em verbo no infinitivo** (o que fazer agora)

---

## Bloco 1 — Status da Mesa

**Título:** "Sua mesa hoje"

(Antes era "Sua Fábrica de Receita — Hoje". Trocado: "fábrica" é palavra de gestor. Operador trabalha em mesa, com pipe, com lista.)

| Card | Métrica | Voz do operador | Conexão com Trava |
|------|---------|-----------------|-------------------|
| **Throughput do mês** | Fee fechado no período | "Contrato assinado. Não proposta. Não reunião. Assinado." | Resultado — todas destravadas |
| **Pipe ativo** | Leads em estações 1-5 | "Lead em algum lugar da linha. Cada um numa estação." | T5 — qualificação no estágio certo |
| **Quentes na fila** | Temperatura = Quente | "SPICED ≥ 3.7. Esses são prioridade 1 da semana." | T1 — diagnóstico já feito |
| **Win rate** | Fechados / Total entrados | "Quanto da sua linha vira dinheiro. Acima de 20% é saúde." | Saúde geral da linha |

**Regra Kennedy:** Cada card mostra **número grande** + **traduçao em uma linha** + **verbo de ação** se houver gargalo.

Exemplo de exibição:
```
THROUGHPUT DO MÊS
R$ 47.200
3 contratos fechados — 2 ainda aguardando assinatura
[Ver pipe de fechamento]
```

---

## Bloco 2 — Onde Tá Travando

**Título:** "Diagnóstico — onde os leads estão presos"

(Antes: "As 8 Travas — Visão Rápida". Trocado: operador não tem tempo de "visualizar travas". Ele quer saber **onde tá preso**.)

Distribuição dos leads por trava detectada. Cada linha é uma pergunta concreta:

| Trava | Pergunta que o operador faz | Indicador no painel |
|-------|------------------------------|---------------------|
| **T1 — Cegueira** | "Tenho lead sem dado pra qualificar?" | Leads sem SPICED calculado |
| **T2 — Exposição** | "Tenho lead que ainda não foi tocado?" | Leads novos, zero touchpoint |
| **T3 — Atenção** | "Mandei cold e ninguém respondeu?" | Leads contactados sem resposta há 3+ dias |
| **T4 — Interesse** | "Respondeu mas tá fingindo de morto?" | Leads que abriram mas não engajaram |
| **T5 — Qualificação** | "Tô gastando tempo com lead frio?" | Leads frios no pipe (SPICED < 2.5) |
| **T6 — Compromisso** | "Reunião marcada, lead sumiu?" | Reuniões em "agendada" há mais de 7 dias |
| **T7 — Decisão** | "Proposta na mesa virando zumbi?" | Propostas em aberto há mais de 14 dias |
| **T8 — Dependência** | "Tô dependente de UM canal?" | % do pipe vindo do LeadBroker vs OUTBILI |

**Destaque visual:** A trava com mais leads acumulados é o **gargalo da semana**. Vermelho. Em cima. No olho.

> Mensagem default: "Seu gargalo essa semana é {trava}. Resolve isso primeiro — o resto é distração."

---

## Bloco 3 — Onde Tá o Gargalo (Linha de Montagem)

**Título:** "Sua linha agora"

Visualização horizontal das 5 estações com contagem em cada uma:

```
Pesquisa: 12   →   Enriquecimento: 8   →   Qualificação: 23   →   Inteligência: 5   →   Prospecção: 3
```

**Código de cor (regra Collier — comunica antes de ler):**

| Cor | Significado | O que isso quer dizer pro operador |
|-----|-------------|-------------------------------------|
| **Verde** | Estação com mais leads que a próxima | Linha alimentada, fluxo saudável |
| **Amarelo** | Estação com MENOS leads que a próxima | Vai faltar matéria-prima — pesca mais |
| **Vermelho** | Lead parado há +7 dias | Estagnação. Move ou descarta. |

**Mensagem dinâmica abaixo do gráfico** (Kennedy — sempre fecha em ação):

- Se gargalo na 1: *"Linha vazia. Abre a SearchPage agora."*
- Se gargalo na 3: *"23 lead esperando qualificação. Roda SPICED em todos."*
- Se gargalo na 5: *"5 lead pronto pra cold. Manda no BilinskiZap."*

---

## Bloco 4 — O Que Você Faz Agora

**Título:** "Próxima ação"

(Antes: "Ações Rápidas Orientadas pela Trava". Trocado: nome longo. Operador quer ler 2 segundos e clicar.)

O sistema lê o gargalo dominante e gera UMA recomendação. Uma só. Sem menu de 5 opções:

| Gargalo lido | Mensagem | Botão |
|--------------|----------|-------|
| T2 (poucos leads) | "Linha sem matéria-prima. Vai pescar." | **[Pescar leads agora]** |
| T3 (sem resposta) | "Lead contactado mas calado. Disparar follow-up." | **[Abrir BilinskiZap]** |
| T5 (leads frios) | "Pipe entupido de lead frio. Re-qualifica ou descarta." | **[Ver pipe morno/frio]** |
| T6 (reunião parada) | "Reunião agendada virando zumbi. Confirma e prepara." | **[Ver reuniões esta semana]** |
| T7 (proposta parada) | "Proposta há 14 dias na mesa. Follow-up de fechamento.” | **[Ver propostas em aberto]** |

**Regra Kennedy de CTA:** Verbo no infinitivo. Sempre. Nunca "Visualizar". Sempre **"Pescar"**, **"Disparar"**, **"Confirmar"**, **"Fechar"**.

---

## Bloco 5 — Quanto Tem na Mesa (LTP)

**Título:** "LTP no pipe"

(Antes: "LTP Pipeline" / "LTP Projetado do Pipeline". Trocado: vendedor pensa "quanto tem na mesa" — não pensa "LTP projetado".)

| Métrica | Cálculo | Como o operador lê |
|---------|---------|--------------------|
| **LTP no pipe** | Soma do LTP de todos os leads ativos | "Quanto a sua linha pode gerar se TUDO fechar" |
| **LTP nos quentes** | LTP só dos leads Quentes | "Receita mais provável — quem tá com a caneta perto" |
| **LTP médio** | LTP total / nº leads | "Valor médio da oportunidade que tá entrando" |
| **LTP/Closer/mês** | LTP quentes / nº closers / meses | "Throughput projetado por Closer no horizonte" |

**Fórmula LTP por lead** (mantida do v1, é o ativo intelectual):
```
LTP = (monthlyRevenue × tier.ltp_percentage) × 12
```
Onde `tier.ltp_percentage` vem da tabela TIERS em `constants.ts`.

**Display sugerido:**
```
LTP NO PIPE
R$ 487 mil
─ R$ 184 mil em lead quente
─ R$ 32 mil/Closer/mês de teto

[Ver leads por LTP]
```

---

## Bloco 6 — De Onde Vem o Pipe (Independência de Canal)

**Título:** "Sua independência"

(Antes: "Canal de Aquisição — Independência" / "Diversificação de Canais". Trocado: operador entende "independência" — é a Trava T8 traduzida em uma palavra.)

| Métrica | O que mostra | Voz do operador |
|---------|-------------|-----------------|
| **% via OUTBILI** | Leads vindo de prospecção própria | "Quanto do pipe é seu, não é dado" |
| **% via LeadBroker** | Leads vindo do canal da matriz | "Quanto depende da matriz" |
| **% via outros** | Indicação, networking, inbound | "Quanto vem por sorte" |
| **Meta:** | ≥ 40% via OUTBILI | "Abaixo disso você é refém" |

**Mensagem narrativa (Collier — fala com o operador, não sobre ele):**

> "A Trava T8 só destrava quando nenhum canal sozinho passa de 60% do pipe. Hoje você está {x}% no LeadBroker. Quanto disso você quer mudar até o fim do trimestre?"

(Pergunta direta no fim. Provoca resposta mental — Collier puro.)

---

## Bloco extra (opcional) — A Lista do Dia

**Título:** "Sua lista de hoje"

3 cards rápidos, ordem fixa, sem rolar:

```
HOJE VOCÊ TEM:

1 — Fazer cold em 3 leads quentes (Tier Medium=, SPICED ≥ 4.2)
    [Abrir lista]

2 — Confirmar 2 reuniões marcadas pra amanhã
    [Confirmar agora]

3 — Follow-up em 1 proposta há 12 dias na mesa
    [Abrir proposta]
```

**Regra:** No máximo 3 itens. Se aparece um quarto, alguma coisa já tá morrendo no pipe.

---

## Copy Standards — Dashboard

(Mantido do v1 com tradução pra voz do operador)

| Elemento | Padrão v2 |
|----------|-----------|
| **Título de card** | Pergunta ou afirmação curta. "Sua mesa hoje", "Onde tá travando", "Sua independência". Nunca "Visão geral de métricas". |
| **Métrica principal** | Número grande + tradução em 1 linha. "R$ 47.200 — 3 fee fechado, 2 aguardando ass." |
| **CTA** | Verbo no infinitivo, primeira pessoa do operador. **Pescar**, **Disparar**, **Subir**, **Matar**, **Fechar**. Nunca **Visualizar**, **Acessar**, **Consultar**. |
| **Cor** | Vermelho = gargalo/zumbi. Amarelo = atenção. Verde = throughput. Cinza = frio. |
| **Tom** | Direto, com peso, na voz do operador comercial. Zero corporativês. Zero "experiência transformacional". |
| **Referência FDR** | Todo card explicável em termos de Trava (T1-T8) ou Estação (1-5). Se não dá pra explicar, o card não devia estar lá. |
| **Densidade** | 3-6 segundos de leitura por card. Mais que isso, perdeu o operador. |

---

## Regra Mãe (válida pra TODA decisão de copy na Dashboard)

> Se o card não responde "onde tá o dinheiro?" ou "o que eu faço agora?", o card não fica.

Toda métrica de gestor (CAC, CSAT, NPS) vai pra um relatório separado, não na Dashboard. Aqui é mesa de operação. Métrica que não vira ação é distração.

---

## Diagnóstico Tier 0 — Aplicado a esta peça

| Dimensão | Valor |
|----------|-------|
| **Público** | SDR/BDR/Closer V4 Bilinski (uso diário, alta frequência) |
| **Schwartz Awareness** | Nível 5 (Most Aware) — opera o sistema todo dia |
| **Schwartz Sophistication** | Nível 5 — exige mecanismo único + densidade operacional |
| **Copywriter principal** | Dan Kennedy (direct response, every-card-is-an-offer) |
| **Copywriter auxiliar** | Robert Collier (mental conversation do operador) |
| **Hopkins v1 baseline** | 72/100 |
| **Hopkins v2 alvo** | 92/100 |
