---
task: Cost Optimization
responsavel: "@compliance-auditor"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - include_supabase: Incluir custos Supabase (bool, default true)
  - include_vps: Incluir custos VPS (bool)
  - budget_target_monthly: Orcamento alvo mensal (USD)
Saida: |
  - cost_report: Relatorio de custos atual vs otimizado
  - savings_projection: Projecao de economia
  - action_items: Acoes priorizadas
Checklist:
  - "[ ] Custos atuais documentados"
  - "[ ] Uso vs capacidade analisado"
  - "[ ] Top 5 oportunidades de economia"
  - "[ ] ROI calculado"
  - "[ ] Plano de acao com owners"
---

# Task: fortress-cost-optimization

**Agent:** @compliance-auditor (com @cloud-infra-engineer)
**Trigger:** `*cost-optimization`
**Objetivo:** Analisar e otimizar custos de infraestrutura cloud/database

---

## Inputs

```yaml
elicit: true
fields:
  - include_supabase: "Incluir custos Supabase? (sim/nao, default: sim)"
  - include_vps: "Incluir custos VPS/Hostinger? (sim/nao)"
  - budget_target_monthly: "Orcamento alvo mensal em USD?"
```

---

## Execucao

### FASE 1 — Inventario de Custos

| Servico | Plano | Custo/Mes (USD) | Uso Atual | Capacidade |
|---------|-------|-----------------|-----------|------------|
| Supabase | [plan] | [X] | [Y]% | [spec] |
| VPS Hostinger | [plan] | [X] | [Y]% | [spec] |
| Domain/SSL | [provider] | [X] | N/A | N/A |
| Storage | [type] | [X] | [Y]GB / [Z]GB | [Z]GB |
| **Total** | | **[TOTAL]** | | |

### FASE 2 — Analise de Uso vs Provisionado

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Connections usage
SELECT count(*) as active, max_conn
FROM pg_stat_activity, (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') s
GROUP BY max_conn;

-- Storage por tabela
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC LIMIT 10;
```

| Recurso | Provisionado | Uso Real | Utilizacao | Acao |
|---------|-------------|----------|-----------|------|
| Connections | [max] | [avg] | [%] | Downgrade se <30% |
| Storage | [max]GB | [used]GB | [%] | Cleanup se <50% |
| Compute | [cores] | [avg CPU] | [%] | Rightsize |

### FASE 3 — Oportunidades de Economia

| # | Oportunidade | Economia/Mes | Esforco | Risco | ROI |
|---|-------------|-------------|---------|-------|-----|
| 1 | [desc] | $[X] | Baixo | Baixo | [X]x |
| 2 | [desc] | $[X] | Medio | Baixo | [X]x |
| 3 | [desc] | $[X] | Baixo | Medio | [X]x |

**Economia total projetada:** $[X]/mes ([Y]% do custo atual)

### FASE 4 — Action Plan

| Acao | Responsavel | Prazo | Economia | Status |
|------|-------------|-------|----------|--------|
| [acao1] | @cloud-infra-engineer | [data] | $[X]/mes | Pendente |
| [acao2] | @db-architect | [data] | $[X]/mes | Pendente |

---

## Outputs

- Relatorio de custos detalhado (atual vs otimizado)
- Projecao de economia com ROI
- Action items priorizados com owners
