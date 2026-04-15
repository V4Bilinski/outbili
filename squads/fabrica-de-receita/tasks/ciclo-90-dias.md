# Ciclo de 90 Dias

---
name: ciclo-90-dias
description: Montar ciclo de 90 dias para destravar trava especifica com alavancas priorizadas
agent: fabrica-de-receita-master + growth-planner
---

## Objetivo

Transformar o diagnostico de travas em um plano de execucao concreto de 90 dias.
O ciclo e composto por 3 fases mensais com metas, alavancas, responsaveis e metricas
de sucesso. Cada ciclo foca em uma trava principal e no maximo 3 alavancas simultaneas.

## Pre-requisitos

- Diagnostico de travas concluido (task: diagnostico-travas.md)
- Trava principal identificada e validada com o cliente
- Metricas baseline coletadas (ponto de partida)
- Time disponivel mapeado (quem pode executar o que)
- Budget disponivel para o ciclo (estimativa de investimento)

## Passos

### Step 1: Definir a Meta do Ciclo

A meta deve seguir o formato SMART adaptado para receita:

```
META DO CICLO:
"Aumentar [metrica principal] de [valor atual] para [valor alvo]
em 90 dias, destrancando a Trava [TX - Nome], com investimento
de ate R$[budget]."
```

**Metricas candidatas a meta principal (escolher 1):**
- MRR/ARR (ideal para SaaS/recorrencia)
- Novos clientes/mes (ideal para aquisicao)
- CAC (ideal quando custo e o gargalo)
- Churn rate (ideal quando retencao e o gargalo)
- Win rate do time (ideal quando conversao comercial e o gargalo)

### Step 2: Selecionar as 3 Alavancas do Ciclo

**Regra de ouro:** Maximo 3 alavancas por ciclo. Mais do que isso dilui foco.

Para cada trava, as alavancas padrao sao:

**T1 Cegueira:**
- Alavanca 1: Implantar dashboard de metricas (Data Studio / Metabase)
- Alavanca 2: Definir KPIs por area e por pessoa
- Alavanca 3: Reuniao semanal de numeros (rituais de dados)

**T2 Silencio:**
- Alavanca 1: Ativar canal de trafego de maior ROI (pago ou SEO)
- Alavanca 2: Campanha de brand awareness no canal mais relevante do ICP
- Alavanca 3: Parcerias e co-marketing com marcas complementares

**T3 Frieza:**
- Alavanca 1: Reescrever hooks e copy das principais pecas de conteudo
- Alavanca 2: Criar lead magnet de alto valor percebido
- Alavanca 3: Ativar nurture automatizado (sequencia de emails)

**T4 Desconfianca:**
- Alavanca 1: Producao de 3+ cases de sucesso em video com ROI real
- Alavanca 2: Construir pagina de provas (depoimentos, logos, dados)
- Alavanca 3: Criar garantia ousada que elimine risco percebido

**T5 Abandono:**
- Alavanca 1: Simplificar checkout (remover fricoes, passos desnecessarios)
- Alavanca 2: Criar sequencia de recuperacao de carrinho abandonado
- Alavanca 3: Implantar script de contorno de objecoes na proposta

**T6 Incompetencia:**
- Alavanca 1: Criar playbook de vendas com script validado
- Alavanca 2: Treinamento do time com roleplay semanal
- Alavanca 3: Implantar CRM com pipeline visual e SLA por etapa

**T7 Complexidade:**
- Alavanca 1: Mapear e eliminar etapas desnecessarias do processo
- Alavanca 2: Criar fast-track para decisores (proposta de 1 pagina)
- Alavanca 3: Definir gatilhos de urgencia eticos (trial, prazo, bonus)

**T8 Evasao:**
- Alavanca 1: Construir onboarding estruturado com marco de ativacao
- Alavanca 2: Implantar health score e CSM proativo
- Alavanca 3: Criar programa de expansao (upsell natural + referral)

### Step 3: Estruturar as 3 Fases do Ciclo

**Fase 1 — Mes 1: Diagnostico Profundo + Quick Wins (semanas 1-4)**

| Semana | Foco | Responsavel | Entregavel |
|--------|------|-------------|------------|
| 1 | Diagnostico detalhado da trava + mapeamento completo | [Agente DR] | Relatorio de diagnostico |
| 2 | Quick win 1 (menor esforco, maior impacto visivel) | [Time cliente] | Primeiro resultado |
| 3 | Quick win 2 + preparacao da Alavanca 1 | [Time cliente] | Setup Alavanca 1 |
| 4 | Review do mes 1 + ajuste de rota | [Fabio + cliente] | Report mensal |

**Fase 2 — Mes 2: Implantacao das 3 Alavancas (semanas 5-8)**

| Semana | Foco | Responsavel | Entregavel |
|--------|------|-------------|------------|
| 5 | Alavanca 1 em execucao completa | [Time cliente] | Alavanca 1 ativa |
| 6 | Alavanca 2 lancada + primeiros dados | [Time cliente] | Alavanca 2 ativa |
| 7 | Alavanca 3 lancada + otimizacao Alavanca 1 | [Time cliente] | 3 alavancas ativas |
| 8 | Review do mes 2 + medicao de impacto | [Fabio + cliente] | Report mensal |

**Fase 3 — Mes 3: Medicao + Ajuste + Proximo Ciclo (semanas 9-12)**

| Semana | Foco | Responsavel | Entregavel |
|--------|------|-------------|------------|
| 9 | Otimizacao de tudo que esta rodando | [Time cliente] | Versao 2.0 das alavancas |
| 10 | Medicao de resultados vs metas | [Data] | Scorecard de resultados |
| 11 | Ajustes finais + documentacao de aprendizados | [Time cliente] | Playbook do ciclo |
| 12 | Planejamento do Ciclo 2 (proxima trava) | [Fabio + cliente] | Plano Ciclo 2 |

### Step 4: Definir KPIs de Acompanhamento

Para cada alavanca, definir:

| Alavanca | KPI Principal | Meta 30d | Meta 60d | Meta 90d | Frequencia |
|----------|--------------|----------|----------|----------|------------|
| Alavanca 1 | | | | | Semanal |
| Alavanca 2 | | | | | Semanal |
| Alavanca 3 | | | | | Semanal |

**KPI da Meta Principal do Ciclo:**
- Baseline (dia 0): [valor]
- Meta dia 30: [valor] (+__%)
- Meta dia 60: [valor] (+__%)
- Meta dia 90: [valor] (+__%)

### Step 5: Mapa de Responsabilidades (RACI simplificado)

| Atividade | Quem Faz | Quem Aprova | Quem e Informado |
|-----------|----------|-------------|-----------------|
| Execucao das alavancas | Time do cliente | DR Lead | Fabio |
| Medicao semanal de KPIs | Data (ROI Analyst) | DR Lead | C-level cliente |
| Reviews mensais | Fabio | C-level cliente | Time cliente |
| Ajustes de rota | Fabio + DR Lead | C-level cliente | Time cliente |

## Output

- **Plano de ciclo 90 dias** em formato visual (timeline por semana)
- **3 alavancas priorizadas** com descricao, responsavel e KPI
- **Meta SMART do ciclo** com baseline e targets por mes
- **Rituais de acompanhamento** (quando, quem, o que revisar)
- **Kick-off deck** para apresentar ao time do cliente

## Validacao

- [ ] A meta do ciclo e especifica, mensuravel e alinhada com a trava principal?
- [ ] As 3 alavancas sao executaveis com o time e budget disponivel?
- [ ] O plano semanal e realista (nao sobrecarrega o time)?
- [ ] Os KPIs de acompanhamento sao simples de coletar?
- [ ] O cliente e o DR Lead validaram e aprovaram o plano?
