---
task: Dashboard Creation
responsavel: "@observability-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - dashboard_type: Tipo (technical/executive/on-call)
  - target_audience: Publico alvo
  - refresh_interval_seconds: Intervalo de refresh (default: 30)
Saida: |
  - dashboard_spec: Especificacao do dashboard
  - sql_queries: Queries SQL para paineis
  - access_matrix: Matriz de acesso
Checklist:
  - "[ ] Audiencia definida"
  - "[ ] Paineis desenhados por audiencia"
  - "[ ] Data sources conectadas"
  - "[ ] Layout organizado"
  - "[ ] Acesso controlado"
---

# Task: fortress-dashboard-creation

**Agent:** @observability-engineer (aprovacao: @fortress-master)
**Trigger:** `*dashboard-creation`
**Objetivo:** Criar dashboards operacionais para visibilidade de banco e infraestrutura

---

## Inputs

```yaml
elicit: true
fields:
  - dashboard_type: "Tipo? (technical/executive/on-call)"
  - target_audience: "Publico alvo? (DBA/DevOps/Management)"
  - refresh_interval_seconds: "Intervalo de refresh? (default: 30s)"
```

---

## Execucao

### FASE 1 — Definicao por Audiencia

| Dashboard | Audiencia | Foco | Refresh | Complexidade |
|-----------|----------|------|---------|-------------|
| Technical | DBA/DevOps | Metricas detalhadas | 30s | Alta |
| Executive | Management | KPIs e tendencias | 5min | Baixa |
| On-Call | Plantao | Alertas e status | 10s | Media |

### FASE 2 — Panel Design: Technical

| Panel | Tipo | SQL/Fonte | Posicao |
|-------|------|-----------|---------|
| Connections | Gauge | `SELECT count(*) FROM pg_stat_activity` | Top-left |
| Cache Hit Ratio | Single stat | `SELECT cache_hit_ratio FROM system_health` | Top-center |
| DB Size | Single stat | `SELECT pg_size_pretty(pg_database_size(...))` | Top-right |
| Query Latency | Time series | `pg_stat_statements avg over time` | Middle-left |
| Top Slow Queries | Table | `SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10` | Middle-right |
| Dead Tuples | Bar chart | `SELECT relname, n_dead_tup FROM pg_stat_user_tables` | Bottom-left |
| Index Usage | Table | `SELECT indexrelid::regclass, idx_scan FROM pg_stat_user_indexes` | Bottom-right |

### FASE 3 — Panel Design: Executive

| Panel | Tipo | Metrica | Posicao |
|-------|------|---------|---------|
| Uptime | Single stat (green) | 99.9% target | Top-left |
| Response Time | Single stat | p95 latency | Top-center |
| Storage Trend | Line chart | DB size over 30 days | Top-right |
| Error Rate | Single stat | Errors/hour | Middle-left |
| Cost vs Budget | Progress bar | Monthly cost vs target | Middle-right |
| Incidents (30d) | Counter | P1+P2 incidents | Bottom |

### FASE 4 — Panel Design: On-Call

| Panel | Tipo | Prioridade | Posicao |
|-------|------|-----------|---------|
| Active Alerts | Alert list | P1 first | Top (full width) |
| System Status | Traffic light | Green/Yellow/Red per service | Middle-left |
| Error Stream | Live log | Last 100 errors | Middle-right |
| Quick Actions | Buttons | Restart, Scale, Rollback | Bottom |

### FASE 5 — Access Control

| Dashboard | Role | Acesso |
|-----------|------|--------|
| Technical | DBA, DevOps | Full (edit + view) |
| Technical | Developer | View only |
| Executive | Management | View only |
| On-Call | On-call engineer | Full |
| On-Call | Others | No access |

---

## Outputs

- Especificacao de dashboard por audiencia
- SQL queries para cada panel
- Matriz de acesso (role x dashboard x permissao)
