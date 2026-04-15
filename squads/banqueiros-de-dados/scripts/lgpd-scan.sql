-- =============================================================================
-- lgpd-scan.sql
-- Agent: compliance-auditor
-- Scan de dados pessoais e compliance LGPD no schema
-- Uso: execute via Supabase MCP (execute_sql) ou psql
-- =============================================================================

-- 1. COLUNAS COM DADOS PESSOAIS (deteccao por nome)
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  CASE
    WHEN column_name ~* '(email|e_mail)' THEN 'EMAIL'
    WHEN column_name ~* '(phone|telefone|celular|whatsapp)' THEN 'TELEFONE'
    WHEN column_name ~* '(cpf|cnpj|documento|rg|identidade)' THEN 'DOCUMENTO'
    WHEN column_name ~* '(nome|name|first_name|last_name|sobrenome)' THEN 'NOME'
    WHEN column_name ~* '(endereco|address|cep|zip|cidade|city|estado|state|bairro|logradouro|rua)' THEN 'ENDERECO'
    WHEN column_name ~* '(birth|nascimento|idade|age|data_nascimento)' THEN 'DATA_NASCIMENTO'
    WHEN column_name ~* '(ip|user_agent|device|browser|fingerprint)' THEN 'DADO_TECNICO'
    WHEN column_name ~* '(salario|salary|renda|income|wage)' THEN 'DADO_FINANCEIRO'
    WHEN column_name ~* '(saude|health|doenca|medical|alergia)' THEN 'DADO_SENSIVEL_SAUDE'
    WHEN column_name ~* '(religiao|religion|etnia|raca|orientacao|genero|gender)' THEN 'DADO_SENSIVEL'
    WHEN column_name ~* '(senha|password|secret|token|api_key)' THEN 'CREDENCIAL'
    WHEN column_name ~* '(foto|photo|avatar|imagem|image)' THEN 'IMAGEM_PESSOAL'
    ELSE 'OUTRO_PII'
  END AS pii_category,
  CASE
    WHEN column_name ~* '(saude|health|doenca|medical|religiao|religion|etnia|raca|orientacao|biometri)' THEN '🔴 ULTRA-SENSIVEL'
    WHEN column_name ~* '(cpf|cnpj|senha|password|salario|salary|renda)' THEN '🟠 SENSIVEL'
    WHEN column_name ~* '(email|phone|telefone|nome|name|endereco|address|birth|nascimento)' THEN '🟡 PESSOAL'
    ELSE '🟢 BAIXO RISCO'
  END AS risk_level
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ~* '(email|e_mail|phone|telefone|celular|whatsapp|cpf|cnpj|documento|rg|identidade|nome|name|first_name|last_name|sobrenome|endereco|address|cep|zip|cidade|city|estado|state|bairro|birth|nascimento|idade|age|ip|user_agent|device|salario|salary|renda|income|saude|health|religiao|etnia|raca|orientacao|genero|gender|senha|password|secret|token|foto|photo|avatar)'
ORDER BY risk_level, table_name, column_name;

-- 2. TABELAS COM DADOS PESSOAIS (resumo)
SELECT
  table_name,
  count(*) AS pii_columns,
  string_agg(column_name, ', ' ORDER BY column_name) AS columns_list,
  CASE
    WHEN bool_or(column_name ~* '(saude|health|religiao|etnia|biometri)') THEN '🔴 ULTRA-SENSIVEL'
    WHEN bool_or(column_name ~* '(cpf|cnpj|senha|password|salario)') THEN '🟠 SENSIVEL'
    ELSE '🟡 PESSOAL'
  END AS max_risk
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ~* '(email|phone|telefone|cpf|cnpj|nome|name|endereco|address|birth|nascimento|salario|saude|senha|password|foto)'
GROUP BY table_name
ORDER BY max_risk, pii_columns DESC;

-- 3. VERIFICAR SE TABELAS COM PII TEM RLS
SELECT
  pii.table_name,
  pii.pii_columns,
  CASE WHEN c.relrowsecurity THEN '✅ RLS habilitado' ELSE '⛔ RLS DESABILITADO' END AS rls_status,
  (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = pii.table_name) AS policy_count
FROM (
  SELECT table_name, count(*) AS pii_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name ~* '(email|phone|telefone|cpf|cnpj|nome|name|endereco|address|birth|nascimento|salario|saude|senha|password)'
  GROUP BY table_name
) pii
JOIN pg_class c ON c.relname = pii.table_name
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
ORDER BY c.relrowsecurity, pii.pii_columns DESC;

-- 4. COLUNAS DE CONSENTIMENTO E AUDIT TRAIL
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name ~* '(consent|consentimento|lgpd|aceite|opt_in|opt_out)' THEN '📋 CONSENTIMENTO'
    WHEN column_name ~* '(deleted_at|removed_at|anonymized|purged)' THEN '🗑️ SOFT DELETE'
    WHEN column_name ~* '(created_at|updated_at|modified_at)' THEN '📅 AUDIT TRAIL'
    WHEN column_name ~* '(created_by|updated_by|modified_by)' THEN '👤 AUDIT AUTHOR'
  END AS category
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name ~* '(consent|consentimento|lgpd|aceite|opt_in|opt_out|deleted_at|removed_at|anonymized|purged|created_at|updated_at|modified_at|created_by|updated_by|modified_by)'
ORDER BY category, table_name;

-- 5. TABELAS SEM SOFT DELETE (risco de impossibilidade de exclusao LGPD)
SELECT
  t.table_name,
  '⚠️ Sem coluna deleted_at — exclusao LGPD pode exigir hard delete' AS warning
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name ~* '(email|phone|cpf|cnpj|nome|name)'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name ~* '(deleted_at|removed_at|anonymized|purged)'
  )
ORDER BY t.table_name;

-- 6. POLITICA DE RETENCAO — TABELAS SEM RETENTION POLICY
-- Verifica se tabelas com PII tem algum mecanismo de limpeza
SELECT
  t.table_name,
  s.n_live_tup AS rows,
  '⚠️ Verificar politica de retencao — dados pessoais sem cleanup automatico' AS action
FROM information_schema.tables t
JOIN pg_stat_user_tables s ON s.relname = t.table_name
WHERE t.table_schema = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name ~* '(email|phone|cpf|cnpj|nome|name)'
  )
  AND s.n_live_tup > 0
ORDER BY s.n_live_tup DESC;
