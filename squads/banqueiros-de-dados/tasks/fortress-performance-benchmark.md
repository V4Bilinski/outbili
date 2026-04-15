---
task: Performance Benchmark
responsavel: "@performance-tuner"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - benchmark_duration_minutes: Duracao do benchmark (default: 5)
  - concurrent_users: Usuarios concorrentes (10/50/100)
  - target_endpoints: Endpoints alvo (lista, opcional)
Saida: |
  - benchmark_report: Relatorio de performance
  - sla_compliance: Matriz de compliance SLA
  - bottleneck_list: Lista de gargalos com recomendacoes
Checklist:
  - "[ ] Baseline coletado"
  - "[ ] Top 50 queries benchmarked"
  - "[ ] Connection pool testado"
  - "[ ] API latency medido"
  - "[ ] SLA compliance verificado"
  - "[ ] Gargalos documentados"
---

# Task: fortress-performance-benchmark

**Agent:** @performance-tuner
**Trigger:** `*performance-benchmark`
**Objetivo:** Benchmark completo de performance do banco e API

---

## Inputs

```yaml
elicit: true
fields:
  - benchmark_duration_minutes: "Duracao do benchmark? (default: 5 min)"
  - concurrent_users: "Usuarios concorrentes? (10/50/100)"
  - target_endpoints: "Endpoints especificos? (opcional, todos se vazio)"
```

---

## Execucao

### FASE 1 — Baseline Collection

```sql
-- Snapshot de metricas atuais
SELECT
  (SELECT count(*) FROM pg_stat_activity) as active_connections,
  (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
  (SELECT ROUND(
    100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2
  ) FROM pg_statio_user_tables) as cache_hit_ratio,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries;
```

| Metrica | Valor Atual | Target | Status |
|---------|------------|--------|--------|
| Cache hit ratio | [X]% | >99% | PASS/FAIL |
| Active connections | [X] | <80% max | PASS/FAIL |
| Avg query time | [X]ms | <100ms | PASS/FAIL |
| Dead tuples % | [X]% | <10% | PASS/FAIL |

### FASE 2 — Query Benchmark

```sql
-- Top 50 queries por impacto total
SELECT
  LEFT(query, 80) as query,
  calls, ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(total_exec_time::numeric, 2) as total_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 50;
```

| # | Query | Calls | Avg (ms) | p95 (ms) | p99 (ms) | SLA |
|---|-------|-------|----------|----------|----------|-----|
| 1 | [preview] | [N] | [X] | [Y] | [Z] | PASS/FAIL |

### FASE 3 — Connection Pool Stress Test

| Concurrent | Latency p50 | Latency p95 | Latency p99 | Errors | Throughput |
|-----------|------------|------------|------------|--------|------------|
| 10 | [X]ms | [Y]ms | [Z]ms | [N] | [rps] |
| 50 | [X]ms | [Y]ms | [Z]ms | [N] | [rps] |
| 100 | [X]ms | [Y]ms | [Z]ms | [N] | [rps] |

### FASE 4 — API Latency (Edge Functions + REST)

| Endpoint | Method | p50 | p95 | p99 | Cold Start | SLA |
|----------|--------|-----|-----|-----|------------|-----|
| /rest/v1/[table] | GET | [X] | [Y] | [Z] | N/A | PASS/FAIL |
| /functions/v1/[fn] | POST | [X] | [Y] | [Z] | [W]ms | PASS/FAIL |

### FASE 5 — SLA Compliance Matrix

| Metrica | Target | Resultado | Margem | Veredicto |
|---------|--------|-----------|--------|-----------|
| p50 latency | <100ms | [X]ms | [Y]% | PASS/FAIL |
| p95 latency | <500ms | [X]ms | [Y]% | PASS/FAIL |
| p99 latency | <1000ms | [X]ms | [Y]% | PASS/FAIL |
| Error rate | <0.1% | [X]% | [Y]% | PASS/FAIL |
| Throughput | >[N] rps | [X] rps | [Y]% | PASS/FAIL |

**Gargalos identificados:**

| # | Gargalo | Componente | Impacto | Recomendacao |
|---|---------|-----------|---------|--------------|
| 1 | [desc] | DB/API/Network | [impact] | [fix] |

---

## Outputs

- Benchmark report completo com metricas
- SLA compliance matrix
- Lista de gargalos com recomendacoes priorizadas
