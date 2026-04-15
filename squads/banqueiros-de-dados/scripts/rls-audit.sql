-- =============================================================================
-- rls-audit.sql
-- Agent: security-sentinel + db-architect
-- Auditoria completa de Row Level Security do Supabase
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. TABELAS SEM RLS HABILITADO (CRITICO)
SELECT
  schemaname,
  tablename,
  '⛔ RLS DESABILITADO' AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
ORDER BY tablename;

-- 2. TABELAS COM RLS HABILITADO
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
ORDER BY c.relname;

-- 3. TODAS AS POLICIES (detalhado)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 4. TABELAS COM RLS MAS SEM POLICIES (dados inacessiveis!)
SELECT
  c.relname AS table_name,
  '⚠️ RLS habilitado mas SEM policies — dados bloqueados!' AS warning
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname
  );

-- 5. COBERTURA DE POLICIES POR OPERACAO
SELECT
  tablename,
  bool_or(cmd = 'SELECT') AS has_select,
  bool_or(cmd = 'INSERT') AS has_insert,
  bool_or(cmd = 'UPDATE') AS has_update,
  bool_or(cmd = 'DELETE') AS has_delete,
  bool_or(cmd = 'ALL') AS has_all,
  count(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 6. POLICIES COM USING(true) — PERMISSIVAS DEMAIS
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  '🔴 USANDO true — acesso irrestrito!' AS risk
FROM pg_policies
WHERE schemaname = 'public'
  AND qual = 'true';

-- 7. POLICIES SEM WITH CHECK (INSERT/UPDATE podem vazar dados)
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_expr,
  '⚠️ Sem WITH CHECK — possivel data leak via INSERT/UPDATE' AS warning
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE', 'ALL')
  AND with_check IS NULL;

-- 8. FUNCOES USADAS EM POLICIES (verificar SECURITY DEFINER)
SELECT DISTINCT
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  CASE WHEN p.prosecdef THEN '⚠️ SECURITY DEFINER — bypass RLS!' ELSE '✅ INVOKER' END AS security_mode
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'auth')
  AND p.proname IN (
    SELECT DISTINCT
      regexp_matches(qual || ' ' || coalesce(with_check, ''), '(\w+)\s*\(', 'g')
    FROM pg_policies
    WHERE schemaname = 'public'
  );

-- 9. RESUMO DE SEGURANCA
SELECT
  'Tabelas public' AS metric,
  count(*) AS value
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT
  'Com RLS habilitado',
  count(*)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
UNION ALL
SELECT
  'Sem RLS (RISCO)',
  count(*)
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = pg_tables.tablename
      AND c.relrowsecurity = true
  )
UNION ALL
SELECT
  'Total de policies',
  count(*)
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT
  'Policies com USING(true)',
  count(*)
FROM pg_policies WHERE schemaname = 'public' AND qual = 'true';
