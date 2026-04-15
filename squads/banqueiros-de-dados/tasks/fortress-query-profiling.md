---
task: Query Profiling
responsavel: "@performance-tuner"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - min_exec_time_ms: Tempo minimo de execucao para captura (default: 100)
  - max_queries: Numero maximo de queries a analisar (default: 20)
Saida: |
  - profiling_report: Relatorio com before/after por query
  - optimization_sql: Scripts de otimizacao
Checklist:
  - "[ ] pg_stat_statements coletado"
  - "[ ] Top N queries identificadas"
  - "[ ] EXPLAIN ANALYZE executado para cada"
  - "[ ] Recomendacoes geradas (index/rewrite)"
  - "[ ] Benchmark before/after documentado"
---

# Task: fortress-query-profiling

**Agent:** @performance-tuner
**Trigger:** `*query-profiling`
**Objetivo:** Identificar e otimizar queries lentas com EXPLAIN ANALYZE e benchmarks

---

## Inputs

```yaml
elicit: true
fields:
  - min_exec_time_ms: "Tempo minimo de execucao em ms? (default: 100)"
  - max_queries: "Quantas queries analisar? (default: 20)"
```

---

## Execucao

### FASE 1 — Coleta de Queries Lentas

```sql
-- Top N queries por tempo medio de execucao
SELECT
  queryid,
  LEFT(query, 100) as query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(total_exec_time::numeric, 2) as total_ms,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > [MIN_EXEC_TIME_MS]
ORDER BY mean_exec_time DESC
LIMIT [MAX_QUERIES];
```

### FASE 2 — EXPLAIN ANALYZE

Para cada query identificada:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
[QUERY];
```

**Analise por query:**

| # | Query | Avg (ms) | Calls | Scan Type | Bottleneck | Recomendacao |
|---|-------|----------|-------|-----------|------------|--------------|
| 1 | [preview] | [X] | [N] | Seq/Index | [desc] | [fix] |

**Red Flags:**
- `Seq Scan` em tabela > 10K rows com WHERE
- `Nested Loop` com tabela grande no inner
- `Sort` sem indice correspondente
- `Hash Join` com estimativa de rows muito errada

### FASE 3 — Recomendacoes

| Tipo | Query | Otimizacao | SQL | Impacto Estimado |
|------|-------|------------|-----|------------------|
| Index | #1 | Criar indice em [col] | `CREATE INDEX CONCURRENTLY ...` | -80% tempo |
| Rewrite | #2 | Substituir subquery por JOIN | [new SQL] | -60% tempo |
| Cache | #3 | Materialized view | `CREATE MATERIALIZED VIEW ...` | -90% tempo |

### FASE 4 — Benchmark Before/After

```markdown
#### RESULTADOS
| Query | Before (ms) | After (ms) | Melhoria | Metodo |
|-------|------------|------------|----------|--------|
| #1    | [X]        | [Y]        | [Z]%     | Index  |
| #2    | [X]        | [Y]        | [Z]%     | Rewrite |

**SLA Compliance:**
| Metrica | Target | Atual | Status |
|---------|--------|-------|--------|
| p50     | <100ms | [X]   | PASS/FAIL |
| p95     | <500ms | [X]   | PASS/FAIL |
| p99     | <1000ms| [X]   | PASS/FAIL |
```

---

## Outputs

- Profiling report com top N queries e analise EXPLAIN
- Optimization SQL (indices, rewrites, materialized views)
- Benchmark before/after com SLA compliance
