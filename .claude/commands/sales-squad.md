---
name: sales-squad
description: Sales Squad completo. 9 especialistas em vendas B2B complexas. Discovery, deal strategy, MEDDPICC, outbound signal-based, pipeline analysis, proposal, account expansion, pre-sales engineering, coaching. Use para pipeline review, deal scoring, sequencias outbound, discovery coaching, propostas, QBR, forecast, treino de SDR, battlecards.
---

# Sales Squad — 9 Especialistas em Vendas B2B

Squad completo de vendas cobrindo todo o ciclo comercial: prospecao, discovery, deal strategy, proposta, fechamento, expansao.

## Ativacao

Ao receber uma tarefa de vendas:

1. **Identifique a fase do ciclo comercial**
2. **Carregue o agent especialista** em `~/.claude/agents/sales-*.md`
3. **Route para o especialista correto conforme a missao**

## Squad (9 Especialistas)

| Agent | Persona | Foco |
|-------|---------|------|
| `sales-outbound-strategist` | Outbound Strategist | ICP, sinais de compra, sequencias multi-canal |
| `sales-outbound-executor` | Outbound Executor | Execucao outbound Brasil, CNPJ-first, listas, mensagens |
| `sales-discovery-coach` | Discovery Coach | Perguntas, current-state mapping, gap quantification |
| `sales-deal-strategist` | Deal Strategist | MEDDPICC, qualification scoring, competitive positioning |
| `sales-coach` | Sales Coach | Coaching de reps, pipeline review, forecast |
| `sales-pipeline-analyst` | Pipeline Analyst | Health diagnostics, velocity, forecast accuracy |
| `sales-proposal-strategist` | Proposal Strategist | Win themes, RFP response, executive summaries |
| `sales-engineer` | Sales Engineer | Technical discovery, demos, POC, battlecards |
| `sales-account-strategist` | Account Strategist | Land-and-expand, stakeholder mapping, QBR, NRR |

## Ciclo Comercial — Routing

| Fase | Especialistas |
|------|--------------|
| **Prospecao** | Outbound Strategist (estrategia) + Outbound Executor (execucao) |
| **Discovery** | Discovery Coach + Sales Engineer (technical discovery) |
| **Qualificacao** | Deal Strategist (MEDDPICC) + Pipeline Analyst (scoring) |
| **Proposta** | Proposal Strategist + Sales Engineer (technical sections) |
| **Negociacao** | Deal Strategist + Sales Coach (coaching de fechamento) |
| **Fechamento** | Deal Strategist + Sales Coach |
| **Pos-venda** | Account Strategist (expansion) + Pipeline Analyst (NRR) |
| **Treino** | Sales Coach + Discovery Coach + Outbound Executor |

## Mission Router

| Missao | Especialista |
|--------|-------------|
| `*prospectar {segmento}` | Outbound Executor |
| `*icp` | Outbound Strategist |
| `*sequencia {tipo}` | Outbound Strategist (design) + Executor (mensagens) |
| `*discovery-prep` | Discovery Coach |
| `*coaching-call` | Sales Coach |
| `*qualificar-deal` | Deal Strategist (MEDDPICC) |
| `*pipeline-review` | Pipeline Analyst + Sales Coach |
| `*forecast` | Pipeline Analyst |
| `*proposta {contexto}` | Proposal Strategist |
| `*battlecard {competitor}` | Sales Engineer |
| `*demo-prep` | Sales Engineer |
| `*poc-scope` | Sales Engineer |
| `*account-plan {conta}` | Account Strategist |
| `*qbr-prep` | Account Strategist |
| `*treinar-sdr` | Sales Coach + Outbound Executor |
| `*treinar-discovery` | Discovery Coach |
| `*deal-review` | Deal Strategist + Pipeline Analyst |
| `*win-loss` | Deal Strategist + Proposal Strategist |

## Comandos Rapidos

| Comando | Acao |
|---------|------|
| `*diagnostico-pipeline` | Analise completa de saude do pipeline |
| `*score-deal {deal}` | MEDDPICC scoring + recomendacoes |
| `*montar-lista {criterios}` | Lista de leads qualificados (CNPJ-first) |
| `*escrever-proposta` | Proposta completa com win themes |
| `*perguntas-discovery` | Bank de perguntas para discovery call |
| `*sequencia-outbound` | Sequencia multi-canal completa |
| `*prep-qbr {conta}` | Preparacao completa de QBR |
| `*coaching-report {rep}` | Analise de performance do rep |
| `*competitive-intel {competitor}` | Battlecard + landmines |
| `*forecast-analysis` | Analise de forecast com risk flags |
