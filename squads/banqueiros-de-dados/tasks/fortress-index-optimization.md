---
task: Index Optimization
responsavel: "@db-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - target_tables: Tabelas alvo (opcional, todas se vazio)
  - min_table_size: Minimo de rows para analise (default: 1000)
Saida: |
  - relatorio_indices: Relatorio de indices atual vs recomendado
  - ddl_commands: Scripts DDL para otimizacao
Checklist:
  - "[ ] Inventario de indices existentes"
  - "[ ] Indices duplicados identificados"
  - "[ ] Indices nao utilizados identificados"
  - "[ ] Indices faltantes sugeridos"
  - "[ ] Bloat de indices verificado"
  - "[ ] DDL de otimizacao gerado"
---

# Task: fortress-index-optimization

**Agent:** @db-architect (secundario: @performance-tuner)
**Trigger:** `*index-optimization`
**Objetivo:** Analisar e otimizar indices do banco para performance maxima

---

## Inputs

```yaml
elicit: true
fields:
  - target_tables: "Tabelas especificas ou todas? (default: todas)"
  - min_table_size: "Minimo de registros para analisar? (default: 1000)"
```

---

## Execucao

### FASE 1 — Inventario de Indices

```sql
-- Todos os indices com tamanho e uso
SELECT
  schemaname, tablename, indexname,
  idx_scan as scans, idx_tup_read as tuples_read,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### FASE 2 — Indices Duplicados

```sql
-- Detectar indices com mesmas colunas
SELECT
  a.indexrelid::regclass AS index1,
  b.indexrelid::regclass AS index2,
  a.indrelid::regclass AS table_name
FROM pg_index a
JOIN pg_index b ON a.indrelid = b.indrelid
  AND a.indexrelid < b.indexrelid
  AND a.indkey = b.indkey;
```

**Acao:** DROP INDEX duplicado (manter o mais antigo/nomeado corretamente).

### FASE 3 — Indices Nao Utilizados

```sql
-- Indices com zero scans (candidatos a remocao)
SELECT indexrelid::regclass, idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### FASE 4 — Indices Faltantes (via Slow Queries)

```sql
-- Queries com seq scan em tabelas grandes
SELECT relname, seq_scan, seq_tup_read,
  idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > [MIN_TABLE_SIZE]
ORDER BY seq_tup_read DESC LIMIT 20;
```

Para cada seq scan: `EXPLAIN ANALYZE` da query → sugerir indice.

### FASE 5 — Index Bloat

```sql
-- Bloat estimado por indice
SELECT
  indexrelid::regclass,
  pg_size_pretty(pg_relation_size(indexrelid)) as current_size,
  ROUND(100 * (1 - (pg_stat_get_dead_tuples(indexrelid)::float /
    GREATEST(pg_stat_get_live_tuples(indexrelid), 1)))) as health_pct
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 1048576;
```

**Acao:** REINDEX CONCURRENTLY se bloat > 30%.

### FASE 6 — Relatorio e DDL

| Acao | Indice | Tabela | Motivo | DDL |
|------|--------|--------|--------|-----|
| DROP | idx_dup_xxx | [tbl] | Duplicado | `DROP INDEX idx_dup_xxx;` |
| DROP | idx_unused | [tbl] | Zero scans | `DROP INDEX idx_unused;` |
| CREATE | idx_new | [tbl] | Seq scan | `CREATE INDEX CONCURRENTLY ...;` |
| REINDEX | idx_bloat | [tbl] | Bloat >30% | `REINDEX INDEX CONCURRENTLY ...;` |

---

## Outputs

- Relatorio completo de indices (existentes, duplicados, unused, faltantes)
- DDL commands prontos para execucao (CONCURRENTLY para zero downtime)
- Estimativa de melhoria de performance
