---
task: IaC Review
responsavel: "@cloud-infra-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - iac_path: Caminho para arquivos Terraform/Docker
  - provider: Provider (supabase/aws/gcp/hostinger)
  - scope: Escopo da revisao (full/security_only/cost_only)
Saida: |
  - review_report: Relatorio de revisao IaC
  - security_findings: Achados de seguranca
  - cost_estimate: Estimativa de custo
Checklist:
  - "[ ] Arquivos IaC escaneados"
  - "[ ] Seguranca verificada (secrets, IAM, network)"
  - "[ ] Best practices checadas (modules, state, naming)"
  - "[ ] Custo estimado"
  - "[ ] Recomendacoes geradas"
---

# Task: fortress-iac-review

**Agent:** @cloud-infra-engineer
**Trigger:** `*iac-review`
**Objetivo:** Revisar Infrastructure as Code para best practices e seguranca

---

## Inputs

```yaml
elicit: true
fields:
  - iac_path: "Caminho dos arquivos IaC? (terraform/, docker/)"
  - provider: "Provider principal? (supabase/aws/gcp/hostinger)"
  - scope: "Escopo? (full/security_only/cost_only)"
```

---

## Execucao

### FASE 1 — Scan de Codigo

| Arquivo | Tipo | Recursos Definidos | Issues |
|---------|------|-------------------|--------|
| [file] | Terraform/Docker/Compose | [recursos] | [N] |

### FASE 2 — Security Check

| Verificacao | Status | Severidade | Detalhe |
|------------|--------|-----------|---------|
| Secrets hardcoded | PASS/FAIL | CRITICAL | Nenhum secret em plaintext |
| IAM least privilege | PASS/FAIL | HIGH | Permissions minimas |
| Network exposure | PASS/FAIL | HIGH | Ports expostas necessarias apenas |
| State file seguro | PASS/FAIL | CRITICAL | Remote state com encryption |
| Base images atualizadas | PASS/FAIL | MEDIUM | Sem CVEs conhecidos |
| Non-root containers | PASS/FAIL | MEDIUM | USER directive presente |

### FASE 3 — Best Practices

| Pratica | Status | Recomendacao |
|---------|--------|-------------|
| Modularizacao | PASS/FAIL | Usar modules para componentes reutilizaveis |
| State management | PASS/FAIL | Remote state com locking |
| Naming convention | PASS/FAIL | Prefixo projeto + ambiente + recurso |
| Versionamento | PASS/FAIL | Pin de versoes de providers/modules |
| Variables/outputs | PASS/FAIL | Descriptions em todas variables |
| Tagging | PASS/FAIL | Tags de ambiente, projeto, custo |

### FASE 4 — Estimativa de Custo

| Recurso | Tipo | Especificacao | Custo/Mes (USD) |
|---------|------|-------------|-----------------|
| Supabase | Database | Pro plan | $25 |
| VPS | Compute | KVM2 4GB | $12 |
| Storage | Blob | 10GB | $2 |
| **Total** | | | **$39** |

### FASE 5 — Recomendacoes

| # | Prioridade | Categoria | Recomendacao | Impacto |
|---|-----------|-----------|--------------|---------|
| 1 | P0 | Security | [desc] | [impact] |
| 2 | P1 | Cost | [desc] | [impact] |

---

## Outputs

- Review report completo (security + best practices)
- Security findings priorizados
- Estimativa de custo mensal
