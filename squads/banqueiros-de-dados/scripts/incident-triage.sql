-- =============================================================================
-- incident-triage.sql
-- Agent: observability-engineer + fortress-master
-- Triage rapido durante incidentes — execute imediatamente ao detectar problema
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. CONEXOES POR ESTADO (identificar connection leak ou pool exhaustion)
SELECT
  state,
  count(*) AS count,
  max(now() - state_change) AS max_idle_time
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY count DESC;

-- 2. QUERIES RODANDO AGORA (identificar long-running ou bloqueios)
SELECT
  pid,
  usename,
  state,
  now() - query_start AS duration,
  wait_event_type,
  wait_event,
  left(query, 200) AS query
FROM pg_stat_activity
WHERE datname = current_database()
  AND state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY duration DESC NULLS LAST;

-- 3. QUERIES BLOQUEADAS (quem esta esperando quem)
SELECT
  blocked.pid AS blocked_pid,
  now() - blocked.query_start AS blocked_duration,
  left(blocked.query, 100) AS blocked_query,
  blocking.pid AS blocking_pid,
  now() - blocking.query_start AS blocking_duration,
  left(blocking.query, 100) AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks kl ON kl.transactionid = bl.transactionid AND kl.pid != blocked.pid AND kl.granted
JOIN pg_stat_activity blocking ON blocking.pid = kl.pid
WHERE blocked.datname = current_database();

-- 4. LOCKS EXCLUSIVOS (potenciais causadores de deadlock)
SELECT
  l.pid,
  l.locktype,
  l.relation::regclass AS table_name,
  l.mode,
  l.granted,
  a.state,
  now() - a.query_start AS duration,
  left(a.query, 150) AS query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.mode LIKE '%Exclusive%'
  AND a.datname = current_database()
ORDER BY a.query_start;

-- 5. TABELAS COM ALTA ATIVIDADE (hot tables no momento)
SELECT
  schemaname,
  relname AS table_name,
  seq_scan + idx_scan AS total_scans,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_dead_tup AS dead_tuples
FROM pg_stat_user_tables
WHERE (n_tup_ins + n_tup_upd + n_tup_del) > 0
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
LIMIT 10;

-- 6. DISK USAGE (se esta enchendo)
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS database_size,
  (SELECT count(*) FROM pg_stat_user_tables) AS table_count,
  (SELECT sum(n_live_tup) FROM pg_stat_user_tables) AS total_rows,
  (SELECT sum(n_dead_tup) FROM pg_stat_user_tables) AS total_dead_tuples;

-- 7. REPLICATION LAG (se aplicavel)
SELECT
  slot_name,
  active,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots;

-- 8. CANCELAR QUERIES LENTAS (> 5 min) — DESCOMENTE APENAS SE NECESSARIO
-- SELECT pg_cancel_backend(pid)
-- FROM pg_stat_activity
-- WHERE state = 'active'
--   AND now() - query_start > interval '5 minutes'
--   AND pid != pg_backend_pid();

-- 9. TERMINAR CONEXOES IDLE IN TRANSACTION (> 10 min) — DESCOMENTE SE NECESSARIO
-- SELECT pg_terminate_backend(pid)
-- FROM pg_stat_activity
-- WHERE state = 'idle in transaction'
--   AND now() - state_change > interval '10 minutes'
--   AND pid != pg_backend_pid();
