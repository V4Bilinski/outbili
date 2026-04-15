---
task: Alerting Rules
responsavel: "@observability-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - alert_domains: Dominios de alerta (database/security/performance/infrastructure)
  - on_call_contacts: Contatos de plantao
  - escalation_timeout_minutes: Timeout de escalacao (default: 15)
Saida: |
  - alert_catalog: Catalogo de regras de alerta
  - escalation_matrix: Matriz de escalacao
  - runbook_index: Indice de runbooks por alerta
Checklist:
  - "[ ] Taxonomia de alertas definida"
  - "[ ] Regras configuradas por dominio"
  - "[ ] Escalation matrix completa"
  - "[ ] Runbook linkado por alerta"
  - "[ ] Test alerts disparados"
---

# Task: fortress-alerting-rules

**Agent:** @observability-engineer (com @performance-tuner)
**Trigger:** `*alerting-rules`
**Objetivo:** Projetar regras de alerta para deteccao proativa de incidentes

---

## Inputs

```yaml
elicit: true
fields:
  - alert_domains: "Dominios? (database/security/performance/infrastructure)"
  - on_call_contacts: "Contatos de plantao?"
  - escalation_timeout_minutes: "Timeout de escalacao em minutos? (default: 15)"
```

---

## Execucao

### FASE 1 — Taxonomia de Alertas

| Severidade | Descricao | Response Time | Notificacao |
|-----------|-----------|---------------|-------------|
| CRITICAL (P1) | Servico down ou data loss | Imediato | Call + SMS + Slack |
| HIGH (P2) | Degradacao significativa | 15min | Slack + Email |
| MEDIUM (P3) | Performance reduzida | 1h | Slack |
| LOW (P4) | Oportunidade de melhoria | Next business day | Email digest |

### FASE 2 — Regras por Dominio

**Database Alerts:**

| Alerta | Condicao | Duracao | Severidade | Cooldown |
|--------|---------|---------|-----------|----------|
| connection_saturation | connections > 80% max | 5min | CRITICAL | 30min |
| cache_hit_drop | cache_hit_ratio < 95% | 10min | HIGH | 1h |
| dead_tuples_high | dead_tup > 20% any table | 30min | MEDIUM | 4h |
| long_transaction | duration > 5min | immediate | HIGH | 15min |
| disk_critical | usage > 90% | immediate | CRITICAL | 1h |
| disk_warning | usage > 80% | 1h | MEDIUM | 4h |

**Security Alerts:**

| Alerta | Condicao | Duracao | Severidade | Cooldown |
|--------|---------|---------|-----------|----------|
| auth_failure_spike | failed_auth > 10/min | 5min | HIGH | 30min |
| rls_bypass_attempt | unauthorized access logged | immediate | CRITICAL | 0 |
| new_admin_created | admin role granted | immediate | HIGH | 0 |
| service_role_abuse | service_role from frontend | immediate | CRITICAL | 0 |

**Performance Alerts:**

| Alerta | Condicao | Duracao | Severidade | Cooldown |
|--------|---------|---------|-----------|----------|
| query_latency_p95 | p95 > 500ms | 5min | HIGH | 30min |
| error_rate_spike | errors > 1%/min | 5min | HIGH | 15min |
| throughput_drop | rps < 50% baseline | 10min | HIGH | 1h |

### FASE 3 — Escalation Matrix

| Nivel | Tempo | Quem | Acao |
|-------|-------|------|------|
| L1 | 0min | On-call engineer | Investigar + mitigar |
| L2 | [escalation_timeout]min | Tech lead | Coordenar resposta |
| L3 | 2x timeout | CTO/Management | Decisao de negocio |

### FASE 4 — Runbook Links

| Alerta | Runbook | Agente Responsavel |
|--------|---------|-------------------|
| connection_saturation | runbook-connection-pool.md | @performance-tuner |
| cache_hit_drop | runbook-cache-investigation.md | @db-architect |
| auth_failure_spike | runbook-auth-incident.md | @security-sentinel |
| disk_critical | runbook-disk-cleanup.md | @cloud-infra-engineer |

---

## Outputs

- Catalogo completo de alertas com condicoes e thresholds
- Escalation matrix com tempos e responsaveis
- Indice de runbooks por alerta
