---
task: Access Control Audit
responsavel: "@security-sentinel"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - include_edge_functions: Incluir edge functions na auditoria (bool)
  - include_third_party: Incluir integracoes terceiras (bool)
Saida: |
  - access_matrix: Matriz de acesso completa
  - gap_report: Relatorio de gaps identificados
  - remediation_priorities: Prioridades de correcao
Checklist:
  - "[ ] Todos os caminhos de acesso inventariados"
  - "[ ] RLS coverage table-by-table verificada"
  - "[ ] API keys auditadas (exposicao, rotacao)"
  - "[ ] Service role usage documentado"
  - "[ ] JWT claims validados"
  - "[ ] Gaps identificados e priorizados"
---

# Task: fortress-access-control-audit

**Agent:** @security-sentinel (com @compliance-auditor)
**Trigger:** `*access-control-audit`
**Objetivo:** Auditar todos os controles de acesso — RLS, API keys, service roles, JWT

---

## Inputs

```yaml
elicit: true
fields:
  - include_edge_functions: "Incluir edge functions? (sim/nao)"
  - include_third_party: "Incluir integracoes terceiras? (sim/nao)"
```

---

## Execucao

### FASE 1 — Inventario de Caminhos de Acesso

| Caminho | Autenticacao | Autorizacao | Dados Acessiveis |
|---------|-------------|-------------|------------------|
| Browser → Supabase REST | JWT (anon/auth) | RLS | Conforme policies |
| Browser → Edge Functions | JWT | Custom logic | Conforme funcao |
| Server → Supabase | service_role key | Bypassa RLS | Tudo |
| Third Party → Webhook | API key/secret | Custom | Limitado |

### FASE 2 — RLS Coverage

```sql
-- Coverage completa de RLS
SELECT
  t.tablename,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename
  ) THEN 'RLS ON' ELSE 'NO RLS' END as rls_status,
  (SELECT string_agg(DISTINCT cmd, ', ') FROM pg_policies p
   WHERE p.tablename = t.tablename) as operations_covered
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;
```

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE | Gaps |
|--------|-----|--------|--------|--------|--------|------|
| [tbl] | ON/OFF | PASS/MISS | PASS/MISS | PASS/MISS | PASS/MISS | [desc] |

### FASE 3 — Key Management Audit

```sql
-- Verificar publishable keys
-- Tool: Supabase MCP get_publishable_keys
```

| Key | Tipo | Exposta em Frontend? | Rotacao | Status |
|-----|------|---------------------|---------|--------|
| anon key | Public | Sim (esperado) | N/A | OK |
| service_role | Secret | **NAO pode** | 90d | CHECK |

### FASE 4 — Matriz de Acesso por Role

| Recurso | anon | authenticated | admin | service_role |
|---------|------|---------------|-------|-------------|
| [table1] SELECT | Nao | Own rows | All | All (bypass) |
| [table1] INSERT | Nao | Own | All | All |
| [table1] UPDATE | Nao | Own | All | All |
| [table1] DELETE | Nao | Nao | All | All |

### FASE 5 — Gap Analysis

| # | Gap | Severidade | Impacto | Remediacao |
|---|-----|-----------|---------|------------|
| 1 | [desc] | CRITICAL/HIGH/MEDIUM | [impact] | [fix] |

---

## Outputs

- Matriz de acesso completa (role x recurso x operacao)
- Gap report com severidades
- Prioridades de remediacao
