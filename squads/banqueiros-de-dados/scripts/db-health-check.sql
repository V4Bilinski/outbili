-- =============================================================================
-- db-health-check.sql
-- Agent: db-architect + performance-tuner
-- Diagnostico completo de saude do banco PostgreSQL/Supabase
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. TAMANHO DAS TABELAS (top 20)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
JOIN pg_tables USING (schemaname, tablename)
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- 2. TABELAS SEM PRIMARY KEY
SELECT
  t.schemaname,
  t.tablename
FROM pg_tables t
LEFT JOIN (
  SELECT tc.table_schema, tc.table_name
  FROM information_schema.table_constraints tc
  WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON t.schemaname = pk.table_schema AND t.tablename = pk.table_name
WHERE t.schemaname = 'public'
  AND pk.table_name IS NULL;

-- 3. INDICES NAO UTILIZADOS (candidates para remocao)
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS times_used,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 4. INDICES DUPLICADOS
SELECT
  a.indrelid::regclass AS table_name,
  a.indexrelid::regclass AS index_a,
  b.indexrelid::regclass AS index_b,
  pg_size_pretty(pg_relation_size(a.indexrelid)) AS size_a,
  pg_size_pretty(pg_relation_size(b.indexrelid)) AS size_b
FROM pg_index a
JOIN pg_index b ON a.indrelid = b.indrelid
  AND a.indexrelid < b.indexrelid
  AND a.indkey::text = b.indkey::text
WHERE a.indrelid::regclass::text LIKE 'public.%';

-- 5. TABELAS COM BLOAT (tuplas mortas alto)
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup,
  n_dead_tup,
  CASE WHEN n_live_tup > 0
    THEN round(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS dead_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 20;

-- 6. QUERIES MAIS LENTAS (requer pg_stat_statements)
SELECT
  queryid,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(max_exec_time::numeric, 2) AS max_ms,
  rows,
  left(query, 120) AS query_preview
FROM pg_stat_statements
WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
ORDER BY mean_exec_time DESC
LIMIT 15;

-- 7. CONEXOES ATIVAS
SELECT
  state,
  count(*) AS connections,
  max(now() - state_change) AS longest_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connections DESC;

-- 8. LOCKS ATIVOS
SELECT
  pid,
  locktype,
  relation::regclass AS table_name,
  mode,
  granted,
  now() - pg_stat_activity.query_start AS duration,
  left(pg_stat_activity.query, 80) AS query
FROM pg_locks
JOIN pg_stat_activity USING (pid)
WHERE NOT granted
  OR mode LIKE '%Exclusive%'
ORDER BY duration DESC NULLS LAST
LIMIT 10;

-- 9. CACHE HIT RATIO
SELECT
  'index' AS type,
  sum(idx_blks_hit) AS hits,
  sum(idx_blks_read) AS reads,
  CASE WHEN sum(idx_blks_hit + idx_blks_read) > 0
    THEN round(100.0 * sum(idx_blks_hit) / sum(idx_blks_hit + idx_blks_read), 2)
    ELSE 0
  END AS hit_ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'table' AS type,
  sum(heap_blks_hit) AS hits,
  sum(heap_blks_read) AS reads,
  CASE WHEN sum(heap_blks_hit + heap_blks_read) > 0
    THEN round(100.0 * sum(heap_blks_hit) / sum(heap_blks_hit + heap_blks_read), 2)
    ELSE 0
  END AS hit_ratio
FROM pg_statio_user_tables;

-- 10. EXTENSOES INSTALADAS
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;
