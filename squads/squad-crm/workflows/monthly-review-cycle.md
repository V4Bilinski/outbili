# Workflow: Monthly Review Cycle

## Descricao
Ciclo mensal de revisao de todas as areas para gerar report executivo.

## Timeline: Ultimos 3 dias uteis do mes

### Day -3: Data Collection
```yaml
agents: todos
actions:
  - @revenue-ops-analyst: Consolidar MRR, ARR, NRR, expansion, churn financeiro
  - @sales-pipeline-architect: Pipeline value, conversao, velocity, deals won/lost
  - @cs-retention-strategist: Health distribution, NPS, tickets, renewals
  - @production-ops-manager: Demands completed, SLA, velocity, workload
  - @people-performance-coach: Utilization, OKR progress, performance scores
output: Dados consolidados por area
```

### Day -2: Analysis & Insights
```yaml
agent: data-intelligence-analyst
actions:
  - Comparar metricas com mes anterior
  - Comparar com metas definidas
  - Identificar top 3 wins e top 3 concerns
  - Calcular trending (3 meses rolling)
  - Gerar insights acionaveis
  - Detectar anomalias
output: Analise completa com insights
```

### Day -1: Report Generation
```yaml
agent: data-intelligence-analyst + crm-master
actions:
  - Gerar Executive Monthly Report:
    - Revenue Summary (MRR, NRR, forecast)
    - Sales Performance (pipeline, conversao, deals)
    - Client Health (distribution, churn risk, NPS)
    - Production Metrics (SLA, velocity, quality)
    - People Metrics (utilization, OKRs)
    - Top Wins & Concerns
    - Action Items para proximo mes
  - Enviar report para stakeholders
output: Monthly Report PDF/Markdown
```

## Report Template

```markdown
# V4 Bilinski — Monthly Report [MES/ANO]

## Executive Summary
- MRR: R$X (+Y% vs mes anterior)
- NRR: X%
- Clientes ativos: X (Y novos, Z churns)
- Pipeline: R$X em deals ativos

## Revenue
- New MRR: R$X
- Expansion MRR: R$X
- Churned MRR: R$X
- NRR: X%

## Sales
- Deals won: X (R$Y)
- Deals lost: X
- Conversion rate: X%
- Pipeline velocity: R$X/dia

## Client Health
- 🟢 Green: X%
- 🟡 Yellow: X%
- 🔴 Red: X%
- NPS: X

## Production
- Demands completed: X
- On-time rate: X%
- Avg delivery time: Xd

## People
- Team utilization: X%
- OKR progress: X%

## Top 3 Wins
1. ...
2. ...
3. ...

## Top 3 Concerns
1. ...
2. ...
3. ...

## Action Items
- [ ] ...
- [ ] ...
- [ ] ...
```
