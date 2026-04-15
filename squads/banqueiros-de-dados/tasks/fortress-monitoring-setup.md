---
task: Monitoring Setup
responsavel: "@observability-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - monitoring_scope: Escopo (database/infrastructure/all)
  - notification_channels: Canais de notificacao (slack/email/webhook)
  - alert_severity_levels: Niveis de severidade
Saida: |
  - monitoring_config: Documento de configuracao
  - metric_catalog: Catalogo de metricas
  - alert_threshold_matrix: Matriz de thresholds
Checklist:
  - "[ ] Metricas-chave identificadas"
  - "[ ] Collection endpoints configurados"
  - "[ ] Dashboard panels definidos"
  - "[ ] Alert thresholds definidos"
  - "[ ] Notification channels testados"
---

# Task: fortress-monitoring-setup

**Agent:** @observability-engineer
**Trigger:** `*monitoring-setup`
**Objetivo:** Configurar monitoring completo para database e infraestrutura

---

## Inputs

```yaml
elicit: true
fields:
  - monitoring_scope: "Escopo? (database/infrastructure/all)"
  - notification_channels: "Canais de notificacao? (slack/email/webhook)"
  - alert_severity_levels: "Niveis de alerta? (critical/high/medium/low)"
```

---

## Execucao

### FASE 1 — Definicao de Metricas

**Database Metrics:**

| Metrica | Query/Fonte | Frequencia | Threshold |
|---------|-------------|-----------|-----------|
| Active connections | `pg_stat_activity` | 30s | >80% max |
| Cache hit ratio | `pg_statio_user_tables` | 1min | <95% |
| Dead tuples | `pg_stat_user_tables` | 5min | >20% |
| Long transactions | `pg_stat_activity` | 1min | >5min |
| Replication lag | `pg_stat_replication` | 30s | >5s |
| Query latency p95 | `pg_stat_statements` | 1min | >500ms |
| Disk usage | `pg_database_size` | 5min | >80% |
| Lock waits | `pg_stat_activity` | 30s | >10 |

**Infrastructure Metrics:**

| Metrica | Fonte | Frequencia | Threshold |
|---------|-------|-----------|-----------|
| CPU usage | OS/VPS | 30s | >80% sustained |
| Memory usage | OS/VPS | 30s | >85% |
| Disk I/O | OS/VPS | 1min | >90% |
| Network traffic | OS/VPS | 1min | >80% bandwidth |
| Container health | Docker/Easypanel | 30s | Unhealthy |

### FASE 2 — Collection Setup

```sql
-- View consolidada de health (criar no Supabase)
CREATE OR REPLACE VIEW system_health AS
SELECT
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
  (SELECT count(*) FROM pg_stat_activity) as total_connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  (SELECT ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2)
   FROM pg_statio_user_tables) as cache_hit_ratio,
  (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size;
```

### FASE 3 — Dashboard Design

| Panel | Tipo | Metricas | Refresh |
|-------|------|----------|---------|
| Connection Pool | Gauge | active/idle/max | 30s |
| Query Performance | Time series | p50/p95/p99 | 1min |
| Storage Growth | Line chart | DB size over time | 5min |
| Cache Hit Ratio | Single stat | ratio % | 1min |
| Error Rate | Bar chart | errors/min | 1min |
| Top Slow Queries | Table | top 10 by avg_ms | 5min |

### FASE 4 — Alert Thresholds

| Alerta | Condicao | Severidade | Acao |
|--------|---------|-----------|------|
| Connection saturation | >80% max por 5min | CRITICAL | Notificar + investigar |
| Cache hit drop | <95% por 10min | HIGH | Investigar queries |
| Disk critical | >90% | CRITICAL | Cleanup imediato |
| Long transaction | >5min | HIGH | Kill + investigar |
| Error spike | >10 errors/min | HIGH | Investigar logs |

---

## Outputs

- Documento de configuracao de monitoring
- Catalogo de metricas com fontes e frequencias
- Matriz de alert thresholds
- SQL para views de health check
