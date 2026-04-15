---
name: fortress-connection-pool-tuning
description: Diagnosticar e otimizar connection pool (PgBouncer/Supavisor) para o ambiente Supabase
agent: performance-tuner
---

# Fortress Connection Pool Tuning

## Objetivo
Analisar o uso de conexoes, identificar gargalos de connection pool (PgBouncer/Supavisor managed pelo Supabase), e otimizar configuracoes para evitar connection exhaustion e melhorar throughput.

## Pre-requisitos
- Acesso ao projeto Supabase
- Script `scripts/performance-diagnostic.sql` disponivel
- Conhecimento do tier do projeto (Free, Pro, Team, Enterprise)

## Passos

### 1. Diagnosticar estado atual de conexoes

```sql
-- Total de conexoes por estado
SELECT
  state,
  count(*) AS connections,
  max(now() - state_change) AS longest_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state
ORDER BY connections DESC;

-- Conexoes por aplicacao/usuario
SELECT
  usename,
  application_name,
  state,
  count(*) AS connections
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY usename, application_name, state
ORDER BY connections DESC;

-- Limite de conexoes do servidor
SHOW max_connections;
```

### 2. Identificar connection leaks

```sql
-- Conexoes idle ha muito tempo (potencial leak)
SELECT
  pid,
  usename,
  application_name,
  state,
  now() - state_change AS idle_duration,
  now() - backend_start AS connection_age,
  left(query, 100) AS last_query
FROM pg_stat_activity
WHERE state = 'idle'
  AND now() - state_change > interval '10 minutes'
  AND datname = current_database()
ORDER BY idle_duration DESC;

-- Conexoes idle in transaction (CRITICO — seguram locks)
SELECT
  pid,
  usename,
  now() - xact_start AS transaction_duration,
  left(query, 100) AS query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND datname = current_database()
ORDER BY transaction_duration DESC;
```

### 3. Analisar pool utilization ao longo do tempo

```sql
-- Snapshot de utilizacao (executar em intervalos)
SELECT
  now() AS snapshot_time,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') AS idle_in_tx,
  (SELECT count(*) FROM pg_stat_activity) AS total,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_allowed;
```

### 4. Calcular pool size ideal

```
Formula:
  pool_size = (num_cores * 2) + effective_spindle_count

Para Supabase (tipicamente):
  Free:  max_connections = 60 (15 direct + 45 pooled)
  Pro:   max_connections = 200 (60 direct + 140 pooled)
  Team:  max_connections = 400

Regra pratica:
  - API (PostgREST): 80% do pool (transaction mode)
  - Edge Functions: 10% (transaction mode)
  - Realtime: 5% (session mode)
  - Admin/migrations: 5% (direct, session mode)
```

### 5. Otimizar configuracoes da aplicacao

```typescript
// Supabase client — configuracao recomendada
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  db: {
    // Usar pooler URL (porta 6543), nao direct (porta 5432)
    // Format: postgres://user:pass@host:6543/postgres
  },
  auth: {
    persistSession: true, // Reutilizar sessao, reduz auth round-trips
  },
  global: {
    headers: {
      'x-connection-pool': 'transaction', // Supavisor transaction mode
    },
  },
})
```

### 6. Configurar alertas de saturacao

| Metrica | Threshold Warning | Threshold Critical |
|---------|------------------|-------------------|
| Conexoes ativas / max | > 70% | > 90% |
| Idle in transaction | > 5 | > 10 |
| Connection age > 1h | > 10 | > 20 |
| Connection wait time | > 100ms | > 500ms |

### 7. Documentar resultados

| Metrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Max concurrent connections | | | |
| Avg idle connections | | | |
| Idle in transaction count | | | |
| P99 query latency | | | |
| Connection errors/hour | | | |

## Output
- Diagnostico de connection pool com metricas atuais
- Pool size recomendado por tier e workload
- Configuracoes de aplicacao otimizadas
- Alertas de saturacao configurados
- Before/after metrics documentados

## Validacao
- [ ] Zero conexoes idle in transaction > 5 minutos
- [ ] Utilizacao do pool < 80% no pico
- [ ] Nenhum connection timeout nos ultimos 7 dias
- [ ] Aplicacao usando pooler URL (porta 6543)
- [ ] Alertas de saturacao testados
