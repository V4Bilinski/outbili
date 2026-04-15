---
task: Scaling Strategy
responsavel: "@cloud-infra-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - growth_rate_monthly: Taxa de crescimento mensal (%)
  - planning_horizon_months: Horizonte de planejamento (default: 12)
  - current_users: Numero atual de usuarios
  - peak_concurrent_connections: Conexoes concorrentes de pico
Saida: |
  - scaling_roadmap: Roadmap de escalabilidade
  - capacity_plan: Plano de capacidade
  - trigger_thresholds: Thresholds para upgrades
Checklist:
  - "[ ] Capacidade atual mapeada"
  - "[ ] Projecao de crescimento calculada"
  - "[ ] Bottlenecks identificados"
  - "[ ] Estrategia de scaling definida"
  - "[ ] Thresholds de trigger documentados"
  - "[ ] Impacto de custo estimado"
---

# Task: fortress-scaling-strategy

**Agent:** @cloud-infra-engineer (com @performance-tuner)
**Trigger:** `*scaling-strategy`
**Objetivo:** Projetar estrategia de escalabilidade para banco e infraestrutura

---

## Inputs

```yaml
elicit: true
fields:
  - growth_rate_monthly: "Taxa de crescimento mensal? (%)"
  - planning_horizon_months: "Horizonte de planejamento? (default: 12 meses)"
  - current_users: "Numero atual de usuarios?"
  - peak_concurrent_connections: "Conexoes concorrentes de pico?"
```

---

## Execucao

### FASE 1 — Capacidade Atual

```sql
-- Metricas de capacidade
SELECT setting as max_connections FROM pg_settings WHERE name = 'max_connections';
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
SELECT count(*) as active_connections FROM pg_stat_activity;
```

| Recurso | Atual | Limite | Utilizacao |
|---------|-------|--------|-----------|
| Connections | [X] | [max] | [%] |
| Storage | [X]GB | [max]GB | [%] |
| CPU | [avg]% | 100% | [avg]% |
| Memory | [X]MB | [max]MB | [%] |
| Bandwidth | [X]GB/mes | [max]GB | [%] |

### FASE 2 — Projecao de Crescimento

| Mes | Usuarios | Dados (GB) | Connections | Custo Est. |
|-----|----------|-----------|-------------|------------|
| Atual | [X] | [Y] | [Z] | $[W] |
| +3 | [X] | [Y] | [Z] | $[W] |
| +6 | [X] | [Y] | [Z] | $[W] |
| +12 | [X] | [Y] | [Z] | $[W] |

### FASE 3 — Bottleneck Analysis

| Recurso | Esgota Em | Impacto | Mitigacao |
|---------|----------|---------|-----------|
| Connections | [X] meses | Usuarios bloqueados | Connection pooling |
| Storage | [X] meses | Writes falham | Cleanup + upgrade |
| CPU | [X] meses | Queries lentas | Read replicas |

**Primeiro bottleneck:** [recurso] em [X] meses

### FASE 4 — Scaling Plan

| Trigger | Threshold | Acao | Tipo | Custo Adicional |
|---------|-----------|------|------|-----------------|
| Connections > 80% | [N] conexoes | PgBouncer / Supavisor | Vertical | $0 |
| Storage > 70% | [N]GB | Cleanup + archive | Operacional | $0 |
| Storage > 90% | [N]GB | Upgrade plano | Vertical | $[X]/mes |
| CPU > 70% avg | sustained 1h | Read replica | Horizontal | $[X]/mes |
| Latency p95 > 500ms | sustained | Partitioning | Structural | Dev time |

---

## Outputs

- Scaling roadmap com timeline de 12 meses
- Capacity planning document
- Trigger thresholds para upgrades automaticos/manuais
