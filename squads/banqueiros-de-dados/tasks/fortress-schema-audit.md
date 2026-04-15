---
task: Schema Audit
responsavel: "@db-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - schema: Schema alvo (default: public)
  - include_views: Incluir views na auditoria (bool)
Saida: |
  - relatorio_auditoria: Relatorio completo com findings por severidade
  - acoes_corretivas: Lista priorizada de correcoes
Checklist:
  - "[ ] Todas as tabelas inventariadas"
  - "[ ] Naming conventions verificadas"
  - "[ ] Constraints (PK, FK, NOT NULL) auditadas"
  - "[ ] Indices analisados"
  - "[ ] Tabelas orfas identificadas"
  - "[ ] Documentacao (COMMENT ON) verificada"
  - "[ ] Relatorio gerado com severidades"
---

# Task: fortress-schema-audit

**Agent:** @db-architect
**Trigger:** `*schema-audit`
**Objetivo:** Auditar schema do banco de dados para integridade, naming conventions, constraints faltantes e tabelas orfas

---

## Inputs

```yaml
elicit: true
fields:
  - schema: "Qual schema auditar? (default: public)"
  - include_views: "Incluir views na auditoria? (sim/nao)"
```

---

## Execucao

### FASE 1 — Discovery

Inventario completo do schema usando Supabase MCP:

```sql
-- Listar todas as tabelas com row count
SELECT schemaname, tablename, n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = '[SCHEMA]'
ORDER BY n_live_tup DESC;

-- Listar views (se include_views = true)
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = '[SCHEMA]';
```

**Output:** Inventario de tabelas/views com contagem de registros.

### FASE 2 — Analise de Naming Conventions

| Regra | Padrao Esperado | Verificacao |
|-------|----------------|-------------|
| Tabelas | snake_case, plural | `SELECT tablename FROM pg_tables WHERE tablename !~ '^[a-z][a-z0-9_]*$'` |
| Colunas | snake_case | Verificar info_schema.columns |
| Indices | idx_{table}_{columns} | `SELECT indexname FROM pg_indexes WHERE indexname !~ '^idx_'` |
| FK constraints | fk_{table}_{ref_table} | Verificar pg_constraint |
| RLS policies | {action}_{table}_{role} | Verificar pg_policies |

### FASE 3 — Analise de Constraints

```sql
-- Tabelas SEM primary key
SELECT t.tablename FROM pg_tables t
LEFT JOIN information_schema.table_constraints tc
  ON t.tablename = tc.table_name AND tc.constraint_type = 'PRIMARY KEY'
WHERE t.schemaname = '[SCHEMA]' AND tc.constraint_name IS NULL;

-- Colunas sem NOT NULL que deveriam ter (heuristica: _id, _at, _by)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = '[SCHEMA]'
  AND column_name LIKE '%_id' AND is_nullable = 'YES';
```

### FASE 4 — Analise de Indices e Tabelas Orfas

```sql
-- Indices duplicados
SELECT indrelid::regclass, array_agg(indexrelid::regclass)
FROM pg_index GROUP BY indrelid, indkey HAVING COUNT(*) > 1;

-- Tabelas sem FK referenciando (potencial orfa)
SELECT t.tablename FROM pg_tables t
WHERE t.schemaname = '[SCHEMA]'
  AND t.tablename NOT IN (
    SELECT DISTINCT tc.table_name FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
  );
```

### FASE 5 — Relatorio

```markdown
#### SCHEMA AUDIT REPORT
| # | Severidade | Categoria | Tabela | Finding | Recomendacao |
|---|-----------|-----------|--------|---------|--------------|
| 1 | CRITICAL  | constraint | [tbl]  | [desc]  | [fix]        |
| 2 | HIGH      | naming    | [tbl]  | [desc]  | [fix]        |
| 3 | MEDIUM    | index     | [tbl]  | [desc]  | [fix]        |

**Resumo:** [N] findings — [X] CRITICAL, [Y] HIGH, [Z] MEDIUM, [W] LOW
```

---

## Outputs

- Relatorio de auditoria com findings categorizados por severidade
- Lista de acoes corretivas priorizadas (CRITICAL primeiro)
- SQL scripts para correcoes automatizaveis
