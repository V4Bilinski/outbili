---
task: Migration Plan
responsavel: "@db-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - change_description: Descricao das mudancas necessarias
  - target_tables: Tabelas afetadas
  - is_breaking_change: Mudanca quebra compatibilidade (bool)
Saida: |
  - migration_sql: Script SQL forward
  - rollback_sql: Script SQL de rollback
  - risk_assessment: Avaliacao de risco
Checklist:
  - "[ ] Estado atual documentado"
  - "[ ] Mudancas DDL especificadas"
  - "[ ] Risco avaliado (data loss, downtime)"
  - "[ ] Migration SQL escrito e reversivel"
  - "[ ] Rollback SQL testado"
  - "[ ] Impacto em RLS verificado"
  - "[ ] TypeScript types atualizados"
---

# Task: fortress-migration-plan

**Agent:** @db-architect
**Trigger:** `*migration-plan`
**Objetivo:** Planejar e gerar migrations seguras com rollback garantido

---

## Inputs

```yaml
elicit: true
fields:
  - change_description: "Descreva as mudancas necessarias no banco"
  - target_tables: "Quais tabelas serao afetadas?"
  - is_breaking_change: "Essa mudanca quebra compatibilidade? (sim/nao)"
```

---

## Execucao

### FASE 1 — Snapshot do Estado Atual

```sql
-- Estrutura atual das tabelas afetadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('[TARGET_TABLES]')
ORDER BY table_name, ordinal_position;

-- Constraints existentes
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name IN ('[TARGET_TABLES]');

-- RLS policies ativas
SELECT tablename, policyname, cmd, qual
FROM pg_policies WHERE tablename IN ('[TARGET_TABLES]');
```

### FASE 2 — Definicao das Mudancas

| # | Tipo | Tabela | Mudanca | Reversivel? | Risco |
|---|------|--------|---------|-------------|-------|
| 1 | DDL  | [tbl]  | [desc]  | Sim/Nao     | Low/Med/High |

### FASE 3 — Avaliacao de Risco

| Fator | Nivel | Justificativa |
|-------|-------|---------------|
| Data Loss | None/Partial/Full | [detalhe] |
| Downtime | Zero/Seconds/Minutes | [detalhe] |
| RLS Impact | None/Requires Update | [detalhe] |
| Rollback Complexity | Simple/Complex/Impossible | [detalhe] |
| **Risco Geral** | **Low/Medium/High/Critical** | |

### FASE 4 — Migration Script

```sql
-- Forward Migration
-- Migration: [DESCRIPTION]
-- Date: [DATE]
-- Author: @db-architect
-- Risk: [LEVEL]

BEGIN;

-- Step 1: [description]
ALTER TABLE ... ;

-- Step 2: [description]
CREATE INDEX CONCURRENTLY ... ;

COMMIT;
```

### FASE 5 — Rollback Script

```sql
-- Rollback Migration: [DESCRIPTION]
BEGIN;

-- Reverse Step 2
DROP INDEX IF EXISTS ... ;

-- Reverse Step 1
ALTER TABLE ... ;

COMMIT;
```

### FASE 6 — Verificacao Pos-Migration

```sql
-- Verificar integridade
SELECT COUNT(*) FROM [TABLE] WHERE [CONSTRAINT_CHECK];

-- Verificar RLS ainda funciona
SET ROLE authenticated;
SELECT * FROM [TABLE] LIMIT 1;
RESET ROLE;

-- Gerar types atualizados
-- Tool: Supabase MCP generate_typescript_types
```

---

## Outputs

- Migration SQL (forward) pronto para apply_migration
- Rollback SQL testado
- Risk assessment documentado
- Checklist de verificacao pos-migration
