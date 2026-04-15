---
task: RLS Setup
responsavel: "@db-architect"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - target_tables: Tabelas para configurar RLS
  - auth_strategy: Estrategia de auth (jwt/service_role)
  - role_hierarchy: Hierarquia de roles (admin/user/viewer)
Saida: |
  - rls_policies_sql: Scripts SQL das policies
  - verification_results: Resultados dos testes de verificacao
Checklist:
  - "[ ] Tabelas classificadas por sensibilidade"
  - "[ ] RLS habilitado nas tabelas alvo"
  - "[ ] Policies USING definidas (SELECT)"
  - "[ ] Policies WITH CHECK definidas (INSERT/UPDATE)"
  - "[ ] DELETE policies definidas"
  - "[ ] Testado com SET ROLE"
  - "[ ] Service role bypass documentado"
---

# Task: fortress-rls-setup

**Agent:** @db-architect (review: @security-sentinel)
**Trigger:** `*rls-setup`
**Objetivo:** Projetar e implementar Row Level Security policies com verificacao completa

---

## Inputs

```yaml
elicit: true
fields:
  - target_tables: "Quais tabelas precisam de RLS?"
  - auth_strategy: "Estrategia de auth? (jwt com auth.uid() / service_role)"
  - role_hierarchy: "Hierarquia de roles? (ex: admin > coordinator > user)"
```

---

## Execucao

### FASE 1 — Classificacao de Dados

| Tabela | Sensibilidade | RLS Necessario? | Estrategia |
|--------|--------------|-----------------|------------|
| [tbl]  | Public/Internal/Confidential | Sim/Nao | user_owns/team/role |

### FASE 2 — Design de Policies

**Padrao: User Owns Row**
```sql
-- Habilitar RLS
ALTER TABLE [TABLE] ENABLE ROW LEVEL SECURITY;

-- SELECT: usuario ve apenas seus registros
CREATE POLICY select_own_[TABLE] ON [TABLE]
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: usuario so insere para si mesmo
CREATE POLICY insert_own_[TABLE] ON [TABLE]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: usuario so atualiza seus registros
CREATE POLICY update_own_[TABLE] ON [TABLE]
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: usuario so deleta seus registros
CREATE POLICY delete_own_[TABLE] ON [TABLE]
  FOR DELETE USING (auth.uid() = user_id);
```

**Padrao: Role-Based**
```sql
-- Admin ve tudo
CREATE POLICY admin_all_[TABLE] ON [TABLE]
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- User ve apenas seu time
CREATE POLICY team_select_[TABLE] ON [TABLE]
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );
```

### FASE 3 — Implementacao

```sql
-- Executar via Supabase MCP apply_migration
BEGIN;

-- 1. Habilitar RLS em todas as tabelas alvo
ALTER TABLE [TABLE_1] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [TABLE_2] ENABLE ROW LEVEL SECURITY;

-- 2. Criar policies (conforme design da Fase 2)
-- [POLICIES SQL]

COMMIT;
```

### FASE 4 — Verificacao

```sql
-- Testar como usuario autenticado
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "[TEST_USER_ID]", "role": "user"}';

-- Deve retornar apenas registros do usuario
SELECT * FROM [TABLE] LIMIT 5;

-- Deve falhar (inserir para outro usuario)
INSERT INTO [TABLE] (user_id, ...) VALUES ('[OTHER_USER_ID]', ...);

RESET ROLE;

-- Testar como admin
SET request.jwt.claims = '{"sub": "[ADMIN_ID]", "role": "admin"}';
SELECT COUNT(*) FROM [TABLE]; -- Deve ver tudo
RESET ROLE;
```

| Teste | Esperado | Resultado | Status |
|-------|----------|-----------|--------|
| User SELECT own | Apenas seus registros | [n] rows | PASS/FAIL |
| User INSERT other | Error/denied | [result] | PASS/FAIL |
| Admin SELECT all | Todos registros | [n] rows | PASS/FAIL |
| Anon SELECT | Nenhum ou public only | [result] | PASS/FAIL |

---

## Outputs

- SQL completo de RLS policies (pronto para migration)
- Resultados de verificacao com SET ROLE
- Documentacao de service_role bypass points
