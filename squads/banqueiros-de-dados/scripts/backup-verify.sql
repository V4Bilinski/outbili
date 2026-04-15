-- =============================================================================
-- backup-verify.sql
-- Agent: backup-recovery-specialist
-- Verificacao de integridade e status de backups/recovery
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. STATUS DE REPLICATION SLOTS
SELECT
  slot_name,
  plugin,
  slot_type,
  active,
  restart_lsn,
  confirmed_flush_lsn,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS lag
FROM pg_replication_slots;

-- 2. TABELAS E CONTAGEM DE ROWS (snapshot para comparacao pos-restore)
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS estimated_rows,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS total_size,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 3. MIGRACOES APLICADAS (historico para verificar pos-restore)
SELECT
  version,
  name,
  statements
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;

-- 4. VERIFICACAO DE INTEGRIDADE DE FOREIGN KEYS
-- Detecta orphan records (FK pointing to non-existent parent)
DO $$
DECLARE
  r RECORD;
  cnt INTEGER;
BEGIN
  RAISE NOTICE '=== Foreign Key Integrity Check ===';
  FOR r IN
    SELECT
      tc.table_name AS child_table,
      kcu.column_name AS child_column,
      ccu.table_name AS parent_table,
      ccu.column_name AS parent_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I c WHERE c.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = c.%I)',
      r.child_table, r.child_column, r.parent_table, r.parent_column, r.child_column
    ) INTO cnt;
    IF cnt > 0 THEN
      RAISE WARNING '⛔ % orphan records: %.% → %.% (constraint: %)',
        cnt, r.child_table, r.child_column, r.parent_table, r.parent_column, r.constraint_name;
    ELSE
      RAISE NOTICE '✅ %.% → %.% — OK', r.child_table, r.child_column, r.parent_table, r.parent_column;
    END IF;
  END LOOP;
END $$;

-- 5. CHECKSUM DE TABELAS (contagem + max id para verificacao rapida)
SELECT
  t.table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS columns,
  s.n_live_tup AS rows,
  pg_size_pretty(pg_total_relation_size('public.' || t.table_name)) AS size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY s.n_live_tup DESC NULLS LAST;

-- 6. EXTENSOES INSTALADAS (necessarias para restore correto)
SELECT extname, extversion, extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname != 'plpgsql'
ORDER BY extname;

-- 7. ENUMS E TIPOS CUSTOM (necessarios para restore)
SELECT
  n.nspname AS schema,
  t.typname AS type_name,
  t.typtype AS type_kind,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE n.nspname = 'public'
  AND t.typtype IN ('e', 'c')
GROUP BY n.nspname, t.typname, t.typtype
ORDER BY t.typname;

-- 8. STORAGE OBJECTS (Supabase Storage buckets)
SELECT id, name, public, created_at, updated_at
FROM storage.buckets
ORDER BY name;
