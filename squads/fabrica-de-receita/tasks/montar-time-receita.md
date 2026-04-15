# Montar Time de Receita

---
name: montar-time-receita
description: Arquitetura completa do time de receita (SDR, closer, CS) com perfis, metricas e rituais
agent: revenue-team-architect
---

## Objetivo

Projetar a arquitetura ideal do time de receita para o estagio atual e o proximo estagio
da empresa. Definir quais papeis existem (SDR, AE/Closer, CS, RevOps), os perfis de cada
um, as metricas de performance, o plano de compensacao e os rituais de gestao. O output
e um playbook de time de receita pronto para implantar.

## Pre-requisitos

- Faturamento atual e meta de crescimento para 12 meses
- Modelo de negocio (recorrente, projeto, produto, hibrido)
- Ciclo de venda atual (dias do primeiro contato ao fechamento)
- Ticket medio atual e target
- Time atual de vendas/CS (se existe) e suas capacidades
- Budget disponivel para contratacao e compensacao

## Passos

### Step 1: Definir o Modelo de Time pelo Estagio

**Estagio 1 — Founder-Led Sales (R$0 - R$2M ARR)**
- Quem vende: O proprio fundador
- Objetivo: Encontrar o ICP perfeito e o processo de vendas que funciona
- Time necessario: 0-1 vendedor (se o fundador precisar de ajuda)
- Foco: Aprender, nao escalar

**Estagio 2 — Primeiros Vendedores (R$2M - R$10M ARR)**
- Time minimo: 1 AE/Closer + 1 SDR (ou 1 vendedor full-cycle)
- Foco: Replicar o processo do fundador em outro humano
- Perigo: Contratar generalistas demais ou especialistas cedo demais

**Estagio 3 — Time Estruturado (R$10M - R$50M ARR)**
- Time: SDR (1-3), AE (2-4), CS (1-2), RevOps (1)
- Foco: Especializar papeis, criar playbooks, implantar CRM robusto

**Estagio 4 — Scale (R$50M+ ARR)**
- Time: SDR Lead, BDR, AE mid-market, AE enterprise, CSM, CS ops, RevOps
- Foco: Segmentacao de mercado, verticalizacao, playbooks por segmento

**Qual estagio e o cliente hoje?** → Montar arquitetura para o estagio atual + proximo.

### Step 2: Definir os Papeis e Responsabilidades

**SDR (Sales Development Representative)**
- **Responsabilidade:** Prospectar, qualificar e agendar reunioes para o AE
- **Nao faz:** Fechar deals (nunca envia proposta ou negocia)
- **Metrica principal:** Reunioes qualificadas agendadas por mes
- **Meta benchmark:** 15-25 reunioes qualificadas/mes (B2B, ticket medio)
- **Perfil:** Resiliente, comunicacao clara, nao tem medo de ligacao/rejeicao
- **Salario referencia:** R$2.500-4.000 fixo + variavel por reuniao + bônus fechamento

**AE / Closer (Account Executive)**
- **Responsabilidade:** Conduzir demos, apresentar propostas e fechar deals
- **Nao faz:** Prospectar ativamente (a nao ser no estagio 1-2)
- **Metrica principal:** Receita fechada por mes (ARR ou MRR)
- **Meta benchmark:** 8-12 deals novos/mes (B2B mid-market)
- **Perfil:** Orientado a resultado, bom ouvinte, disciplinado com follow-up
- **Salario referencia:** R$4.000-8.000 fixo + comissao 10-20% da receita gerada

**CS / CSM (Customer Success Manager)**
- **Responsabilidade:** Garantir resultado do cliente, prevenir churn, gerar expansao
- **Nao faz:** Atendimento tecnico reativo (isso e suporte, nao CS)
- **Metrica principal:** Net Revenue Retention (NRR) e NPS
- **Meta benchmark:** NRR > 110% (expansao maior que churn), NPS > 40
- **Perfil:** Empatico, organizado, orientado a resultado (nao so relacionamento)
- **Salario referencia:** R$3.500-7.000 fixo + bonus por NRR e renovacoes

**RevOps (Revenue Operations)**
- **Responsabilidade:** CRM, dados, processos, ferramentas, forecast
- **Nao faz:** Vender ou fazer CS diretamente
- **Metrica principal:** Acuracia do forecast, velocidade do pipeline, adocao do CRM
- **Perfil:** Analitico, domina Excel/SQL/BI, entende processos de vendas
- **Salario referencia:** R$5.000-9.000 fixo (raramente variavel)

### Step 3: Dimensionar o Time

**Formula de dimensionamento:**

Para SDR:
```
SDRs necessarios = Reunioes necessarias / Reunioes por SDR/mes
Ex: Meta = 60 reunioes/mes / 20 reunioes/SDR = 3 SDRs
```

Para AE:
```
AEs necessarios = Deals necessarios / Deals por AE/mes
Ex: Meta = 20 deals/mes / 8 deals/AE = 2.5 → 3 AEs
```

Para CS:
```
CSMs necessarios = Clientes ativos / Capacidade por CSM
  B2B high-touch: 20-30 clientes/CSM
  B2B mid-touch: 50-80 clientes/CSM
  B2B low-touch: 100-200 clientes/CSM
```

**Tabela de dimensionamento atual vs necessario:**
| Papel | Atual | Necessario (90d) | Necessario (12m) | Contratar quando |
|-------|-------|-----------------|------------------|-----------------|
| SDR | [N] | [N] | [N] | [criterio] |
| AE | [N] | [N] | [N] | [criterio] |
| CS | [N] | [N] | [N] | [criterio] |
| RevOps | [N] | [N] | [N] | [criterio] |

### Step 4: Plano de Compensacao

**Principios de compensacao em receita:**
1. Fixo suficiente para nao gerar ansiedade, variavel alto o suficiente para motivar
2. Variavel deve ser simples — no maximo 2 metricas
3. Pagar na velocidade certa (mensal > trimestral para SDR e AE)
4. Acelerador para quem supera meta (nao so penalizacao para quem nao bate)

**Estrutura modelo:**

SDR:
- Fixo: R$[X]
- Variavel: R$[X] por reuniao qualificada (que vira oportunidade)
- Bonus: R$[X] por deal fechado que ele gerou
- OTE (On-Target Earnings): R$[X]/mes

AE:
- Fixo: R$[X]
- Comissao: [%] da receita fechada (MRR ou ARR)
- Acelerador: [%+X]pp acima de [Y]% da meta
- OTE: R$[X]/mes

CS:
- Fixo: R$[X]
- Bonus de retencao: R$[X] se NRR >= [%]
- Bonus de expansao: [%] da receita de upsell/cross-sell
- OTE: R$[X]/mes

### Step 5: Rituais de Gestao do Time

**Rituais diarios (15 min — standup):**
- O que fechei ontem?
- O que vou fechar hoje?
- Qual meu maior bloqueio?

**Rituais semanais (60 min — pipeline review):**
- Status de cada deal no pipeline (stage, valor, proximo passo, data)
- Forecast da semana (o que vai fechar com alta probabilidade?)
- Roleplays de 1 objecao que apareceu na semana

**Rituais mensais (90 min — performance review):**
- Review de metricas vs metas do mes
- Top 3 wins e top 3 losses — o que aprendemos?
- Ajuste de playbook baseado nos aprendizados
- Reconhecimento do top performer

**Rituais trimestrais (half-day — QBR do time):**
- Review dos 90 dias vs meta
- Anuncio das metas do proximo trimestre
- Treinamento de uma habilidade nova (negociacao, objecoes, etc.)
- Calibragem de ICP e processo

### Step 6: Playbook de Onboarding de Novos Vendedores

**Cronograma de ramping (primeiros 90 dias do novo vendedor):**

| Semana | Foco | Atividade | Marco |
|--------|------|-----------|-------|
| 1-2 | Produto e mercado | Estudo do produto, calls de shadow, ICP | Conhece o produto e o ICP |
| 3-4 | Processo e ferramentas | CRM, playbook, scripts, roleplay | Primeira prospeccao |
| 5-6 | Execucao supervisionada | Calls com gerente, feedback diario | Primeira reuniao agendada |
| 7-8 | Execucao independente | Calls solo com debrief semanal | Pipeline proprio criado |
| 9-12 | Rampa de producao | Meta reduzida (50-70% da meta cheia) | Primeiro deal fechado |

**Materiais obrigatorios para onboarding:**
- [ ] Playbook de vendas (ICP, script, objecoes, follow-up)
- [ ] Gravacoes das 5 melhores calls da historia da empresa
- [ ] Acesso e treinamento no CRM
- [ ] Lista de 50 prospects para comecar a prospectar
- [ ] Buddy (vendedor senior como mentor nos primeiros 30 dias)

## Output

- **Organograma do time de receita** atual e ideal para 12 meses
- **Job descriptions** para cada papel (SDR, AE, CS, RevOps)
- **Plano de compensacao** detalhado por papel
- **Dashboard de metricas** por papel com metas mensais
- **Rituais de gestao** — calendario de reunioes e pautas
- **Plano de contratacao** — quando contratar cada papel e por que

## Validacao

- [ ] O dimensionamento do time e compativel com as metas de receita?
- [ ] A compensacao e competitiva com o mercado e sustentavel para a empresa?
- [ ] Os papeis e responsabilidades sao claros (sem sobreposicao)?
- [ ] Os rituais cobrem todas as frequencias necessarias (diario, semanal, mensal)?
- [ ] O plano de onboarding tem marcos claros de ramping?
