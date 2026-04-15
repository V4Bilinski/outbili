# Database Query Patterns — Banqueiros de Dados

Reusable SQL patterns for PostgreSQL/Supabase diagnostics, inspection, and performance tuning.

---

## Diagnostic Queries

### Top Slow Queries (pg_stat_statements)
```sql
SELECT query, calls, mean_exec_time::numeric(10,2) AS avg_ms,
       total_exec_time::numeric(10,2) AS total_ms, rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 20;
```
**When:** Investigating latency spikes. **Agent:** @performance-tuner

### Unused Indexes
```sql
SELECT schemaname, relname AS table, indexrelname AS index,
       idx_scan, pg_size_pretty(pg_relation_size(i.indexrelid)) AS size
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0 AND NOT indisunique
ORDER BY pg_relation_size(i.indexrelid) DESC;
```
**When:** Reclaiming storage, reducing write overhead. **Agent:** @performance-tuner

### Table Bloat Estimate
```sql
SELECT schemaname, relname, n_live_tup, n_dead_tup,
       ROUND(n_dead_tup::numeric / GREATEST(n_live_tup, 1) * 100, 1) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```
**When:** Before VACUUM decisions, storage audits. **Agent:** @db-architect

### Cache Hit Ratio
```sql
SELECT 'index' AS type, sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit + idx_blks_read), 0) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT 'table', sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)
FROM pg_statio_user_tables;
```
**When:** Evaluating memory allocation. Target > 0.99. **Agent:** @observability-engineer

### Active Connections & Locks
```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

SELECT pid, age(clock_timestamp(), query_start) AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query_start < now() - interval '30 seconds'
ORDER BY query_start;
```
**When:** Connection pool exhaustion, deadlock investigation. **Agent:** @observability-engineer

### Dead Tuples per Table
```sql
SELECT relname, n_dead_tup, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC LIMIT 15;
```
**When:** Autovacuum tuning, maintenance windows. **Agent:** @performance-tuner

---

## Schema Inspection

### All Tables with Row Count
```sql
SELECT schemaname, relname AS table, n_live_tup AS approx_rows
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```
**When:** Initial codebase assessment, brownfield discovery. **Agent:** @db-architect

### Columns with Types
```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
```
**When:** Schema documentation, type generation. **Agent:** @db-architect

### Foreign Keys
```sql
SELECT tc.table_name, kcu.column_name,
       ccu.table_name AS ref_table, ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name, table_schema)
JOIN information_schema.constraint_column_usage ccu USING (constraint_name, table_schema)
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
```
**When:** Dependency mapping, migration planning. **Agent:** @db-architect

### RLS Policies
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```
**When:** Security audits, RLS gap analysis. **Agent:** @security-sentinel

---

## Performance Patterns

### EXPLAIN ANALYZE Wrapper
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM clients WHERE status = 'active' LIMIT 100;
```
**When:** Any slow query investigation. Always run on staging first. **Agent:** @performance-tuner

### Partial Index
```sql
CREATE INDEX CONCURRENTLY idx_clients_active
ON clients (name) WHERE status = 'active';
```
**When:** Queries filter on a small subset of rows. **Agent:** @db-architect

### Batch Upsert
```sql
INSERT INTO metrics (client_id, metric_date, value)
SELECT unnest($1::uuid[]), unnest($2::date[]), unnest($3::numeric[])
ON CONFLICT (client_id, metric_date)
DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```
**When:** Bulk data imports, ETL pipelines. **Agent:** @db-architect

---

## Supabase-Specific

### Auth User Query
```sql
SELECT id, email, raw_user_meta_data->>'full_name' AS name, created_at
FROM auth.users ORDER BY created_at DESC LIMIT 50;
```
**When:** User audit, onboarding verification. **Agent:** @security-sentinel

### RLS Policy Template
```sql
CREATE POLICY "users_own_rows" ON public.tasks
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
**When:** Any new table that stores user-owned data. **Agent:** @security-sentinel

### Edge Function SQL Call (TypeScript)
```typescript
const { data, error } = await supabaseAdmin
  .from('clients')
  .select('id, name, status')
  .eq('status', 'active');
```
**When:** Edge function data access. Always use service_role client server-side. **Agent:** @cloud-infra-engineer
