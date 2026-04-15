---
task: Log Aggregation
responsavel: "@observability-engineer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - log_sources: Fontes de log (database/edge_functions/auth/all)
  - retention_days: Dias de retencao (default: 30)
  - include_query_logs: Incluir logs de queries (bool)
Saida: |
  - aggregation_config: Configuracao de agregacao
  - search_queries_doc: Documento de queries comuns
  - retention_policy: Politica de retencao
Checklist:
  - "[ ] Fontes de log inventariadas"
  - "[ ] Estrategia de coleta definida"
  - "[ ] Queries de busca comuns documentadas"
  - "[ ] Anomaly detection baseline criado"
  - "[ ] Politica de retencao definida"
---

# Task: fortress-log-aggregation

**Agent:** @observability-engineer
**Trigger:** `*log-aggregation`
**Objetivo:** Configurar agregacao centralizada de logs com analise e retencao

---

## Inputs

```yaml
elicit: true
fields:
  - log_sources: "Fontes de log? (database/edge_functions/auth/all)"
  - retention_days: "Dias de retencao? (default: 30)"
  - include_query_logs: "Incluir logs de queries SQL? (sim/nao)"
```

---

## Execucao

### FASE 1 — Inventario de Fontes

| Fonte | Tipo | Volume Estimado | Formato | Tool |
|-------|------|-----------------|---------|------|
| PostgreSQL logs | Database | [X] MB/dia | Structured | Supabase get_logs |
| Edge Function logs | Application | [X] MB/dia | JSON | Supabase get_logs |
| Auth logs | Security | [X] MB/dia | JSON | Supabase get_logs |
| API request logs | Access | [X] MB/dia | JSON | Supabase get_logs |
| Realtime logs | WebSocket | [X] MB/dia | JSON | Supabase get_logs |

### FASE 2 — Estrategia de Coleta

| Nivel | Log Level | Quando | Retencao |
|-------|-----------|--------|----------|
| Always | ERROR, FATAL | Producao | [retention_days] dias |
| Always | WARNING | Producao | [retention_days] dias |
| Sampling | INFO | Producao (10%) | 7 dias |
| On-demand | DEBUG | Dev/Troubleshooting | 24h |
| If enabled | STATEMENT | Query logging | 7 dias |

### FASE 3 — Queries de Busca Comuns

**Troubleshooting:**
```
-- Erros nas ultimas 24h
Supabase get_logs: level=error, period=24h

-- Auth failures
Supabase get_logs: source=auth, status_code=401, period=1h

-- Slow queries (se query logging habilitado)
Supabase get_logs: source=database, duration>1000ms

-- Edge function errors
Supabase get_logs: source=edge_function, level=error
```

**Security Investigation:**
```
-- Tentativas de login falhadas por IP
filter: source=auth AND status=failure GROUP BY ip

-- Acessos fora de horario
filter: timestamp NOT BETWEEN '08:00' AND '22:00'

-- Admin actions
filter: role=admin AND action IN (DELETE, UPDATE, ALTER)
```

### FASE 4 — Anomaly Detection

| Metrica | Baseline | Desvio Tolerado | Alerta Se |
|---------|---------|-----------------|-----------|
| Error rate | [X]/h | 2x | >2x baseline por 15min |
| Auth failures | [X]/h | 3x | >3x baseline por 10min |
| Log volume | [X] MB/h | 5x | >5x (possivel ataque/loop) |
| Unique IPs | [X]/h | 10x | >10x (possivel DDoS) |

### FASE 5 — Politica de Retencao

| Tipo de Log | Retencao | Compressao | Archival |
|-------------|----------|-----------|----------|
| Error/Fatal | [retention_days]d | Sim | Cold storage 1 ano |
| Warning | [retention_days]d | Sim | Nao |
| Info | 7d | Sim | Nao |
| Debug | 24h | Nao | Nao |
| Audit trail | 365d | Sim | Obrigatorio (LGPD) |

---

## Outputs

- Configuracao de log aggregation por fonte
- Documento de queries de busca comuns
- Politica de retencao com compliance (LGPD audit trail = 365d)
