---
task: Deployment Strategy
responsavel: "@devops-pipeline-master"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - change_type: Tipo de mudanca (schema/data/edge_function/full)
  - downtime_tolerance: Tolerancia a downtime (zero/minimal/scheduled)
  - rollback_requirement: Requisito de rollback (auto/manual/none)
Saida: |
  - deployment_runbook: Runbook de deploy
  - sequence_diagram: Sequencia de passos
  - rollback_procedure: Procedimento de rollback
Checklist:
  - "[ ] Estrategia selecionada"
  - "[ ] Sequencia de deploy definida"
  - "[ ] Zero-downtime patterns aplicados"
  - "[ ] Rollback testado"
  - "[ ] Smoke tests definidos"
  - "[ ] Communication plan pronto"
---

# Task: fortress-deployment-strategy

**Agent:** @devops-pipeline-master (com @cloud-infra-engineer)
**Trigger:** `*deployment-strategy`
**Objetivo:** Projetar estrategia de deploy para mudancas de banco e edge functions

---

## Inputs

```yaml
elicit: true
fields:
  - change_type: "Tipo de mudanca? (schema/data/edge_function/full)"
  - downtime_tolerance: "Tolerancia a downtime? (zero/minimal/scheduled)"
  - rollback_requirement: "Requisito de rollback? (auto/manual/none)"
```

---

## Execucao

### FASE 1 — Selecao de Estrategia

| Tipo | Downtime Zero | Downtime Minimo | Downtime Agendado |
|------|-------------|-----------------|-------------------|
| Schema (additive) | Direct apply | Direct apply | Direct apply |
| Schema (breaking) | Expand-Contract | Blue-Green | Maintenance window |
| Data migration | Background job | Batch + verify | Lock table |
| Edge function | Canary deploy | Direct replace | Direct replace |

**Expand-Contract Pattern (zero-downtime schema):**
1. **Expand:** Add new column (nullable) — no breaking change
2. **Migrate:** Backfill data in batches
3. **Switch:** Update app code to use new column
4. **Contract:** Drop old column after verification

### FASE 2 — Sequencia de Deploy

| Step | Acao | Pre-Condition | Verificacao | Rollback |
|------|------|---------------|-------------|----------|
| 1 | Backup snapshot | None | Snapshot ID confirmado | N/A |
| 2 | Apply DDL | Backup OK | Tables altered | Rollback SQL |
| 3 | Backfill data | DDL OK | Row count matches | Restore snapshot |
| 4 | Update RLS | Data OK | SET ROLE test pass | Revert policies |
| 5 | Deploy edge functions | RLS OK | Function responds | Previous version |
| 6 | Update types | Functions OK | tsc passes | Previous types |
| 7 | Smoke tests | All above | All pass | Full rollback |

### FASE 3 — Edge Function Deploy

```bash
# Supabase MCP: deploy_edge_function
# Canary: deploy com flag, testar, promover

# 1. Deploy nova versao
supabase functions deploy [FUNCTION_NAME]

# 2. Verificar
curl -f https://[PROJECT].supabase.co/functions/v1/[FUNCTION_NAME]

# 3. Rollback se necessario
supabase functions deploy [FUNCTION_NAME] --version [PREVIOUS]
```

### FASE 4 — Communication Plan

| Quando | Quem | Mensagem |
|--------|------|----------|
| Pre-deploy | Team | "Deploy agendado: [desc], [hora]" |
| Deploy start | Ops | "Deploy iniciado, monitorando" |
| Deploy OK | Team | "Deploy concluido com sucesso" |
| Rollback | Team + Management | "Rollback executado: [motivo]" |

---

## Outputs

- Deployment runbook com passos detalhados
- Rollback procedure por cenario
- Communication plan template
