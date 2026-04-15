-- =============================================================================
-- performance-diagnostic.sql
-- Agent: performance-tuner
-- Diagnostico completo de performance PostgreSQL/Supabase
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. SEQ SCANS vs INDEX SCANS (tabelas grandes sem indice)
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS rows,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE WHEN seq_scan > 0
    THEN round(seq_tup_read::numeric / seq_scan, 0)
    ELSE 0
  END AS avg_rows_per_seq_scan,
  CASE WHEN (seq_scan + idx_scan) > 0
    THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 2)
    ELSE 0
  END AS idx_usage_pct
FROM pg_stat_user_tables
WHERE n_live_tup > 1000
ORDER BY seq_scan DESC
LIMIT 20;

-- 2. TABELAS QUE PRECISAM DE VACUUM
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup,
  n_dead_tup,
  round(100.0 * n_dead_tup / greatest(n_live_tup, 1), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 500
ORDER BY n_dead_tup DESC;

-- 3. TOP QUERIES POR TEMPO TOTAL (requer pg_stat_statements)
SELECT
  queryid,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  rows,
  round(100.0 * shared_blks_hit / greatest(shared_blks_hit + shared_blks_read, 1), 2) AS cache_hit_pct,
  left(query, 150) AS query_preview
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- 4. QUERIES COM PIOR CACHE HIT RATIO
SELECT
  queryid,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  shared_blks_hit,
  shared_blks_read,
  round(100.0 * shared_blks_hit / greatest(shared_blks_hit + shared_blks_read, 1), 2) AS cache_hit_pct,
  left(query, 150) AS query_preview
FROM pg_stat_statements
WHERE (shared_blks_hit + shared_blks_read) > 100
ORDER BY cache_hit_pct ASC
LIMIT 15;

-- 5. INDICES CANDIDATOS (tabelas com muitos seq scans e poucas idx scans)
SELECT
  relname AS table_name,
  seq_scan,
  idx_scan,
  n_live_tup,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  '⚠️ Candidata para indice — muitos seq scans' AS recommendation
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND idx_scan < seq_scan * 0.1
  AND n_live_tup > 500
ORDER BY seq_scan DESC;

-- 6. INDICES INEFICIENTES (baixo uso relativo ao tamanho)
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched,
  CASE WHEN idx_scan = 0 THEN '🔴 Nunca usado'
       WHEN idx_scan < 10 THEN '🟡 Raramente usado'
       ELSE '🟢 Ativo'
  END AS status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- 7. CONNECTION POOL STATUS
SELECT
  state,
  wait_event_type,
  wait_event,
  count(*) AS connections,
  max(now() - state_change) AS max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type, wait_event
ORDER BY connections DESC;

-- 8. BLOQUEIOS EM ANDAMENTO
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  now() - blocked.query_start AS blocked_duration
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks kl ON kl.transactionid = bl.transactionid AND kl.pid != blocked.pid AND kl.granted
JOIN pg_stat_activity blocking ON blocking.pid = kl.pid
WHERE blocked.datname = current_database();

-- 9. TAMANHO DO WAL E REPLICATION STATUS
SELECT
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) AS total_wal_generated,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS replication_lag
FROM pg_replication_slots
WHERE active = true;

-- 10. RESUMO DE PERFORMANCE
SELECT 'Cache Hit Ratio (tables)' AS metric,
  round(100.0 * sum(heap_blks_hit) / greatest(sum(heap_blks_hit + heap_blks_read), 1), 2)::text || '%' AS value
FROM pg_statio_user_tables
UNION ALL
SELECT 'Cache Hit Ratio (indexes)',
  round(100.0 * sum(idx_blks_hit) / greatest(sum(idx_blks_hit + idx_blks_read), 1), 2)::text || '%'
FROM pg_statio_user_indexes
UNION ALL
SELECT 'Active Connections',
  count(*)::text
FROM pg_stat_activity WHERE state = 'active'
UNION ALL
SELECT 'Total Dead Tuples',
  sum(n_dead_tup)::text
FROM pg_stat_user_tables
UNION ALL
SELECT 'Tables Needing Vacuum (dead > 10%)',
  count(*)::text
FROM pg_stat_user_tables
WHERE n_dead_tup > n_live_tup * 0.1 AND n_live_tup > 100;
