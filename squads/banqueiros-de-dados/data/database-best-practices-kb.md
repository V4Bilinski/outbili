# Database Best Practices — Knowledge Base

## 1. Schema Design

### Normalizacao vs Desnormalizacao
- **3NF** como default: elimina redundancia, garante consistencia
- **Desnormalizar** APENAS quando:
  - Query e executada > 1000x/dia e JOIN custa > 50ms
  - Dados raramente mudam (lookup tables)
  - Materialized view nao resolve
- **Regra de ouro:** Normalize para escrita, desnormalize para leitura

### Primary Keys
- UUID v4 como default (evita enumeration attacks, distribuido)
- Serial/BIGSERIAL apenas para tabelas internas sem exposicao
- NUNCA usar dados de negocio como PK (CPF, email)
- `gen_random_uuid()` nativo do PostgreSQL (extensao pgcrypto)

### Foreign Keys
- SEMPRE declarar FK constraints (integridade referencial)
- `ON DELETE CASCADE` apenas quando child nao faz sentido sem parent
- `ON DELETE SET NULL` quando child pode existir orfao
- `ON DELETE RESTRICT` como default (previne exclusao acidental)

### Timestamps
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` + trigger de auto-update
- SEMPRE usar `TIMESTAMPTZ` (com timezone), NUNCA `TIMESTAMP`
- Armazenar em UTC, converter no frontend

### Soft Delete
- `deleted_at TIMESTAMPTZ NULL` (NULL = ativo, timestamp = deletado)
- Filtrar com `WHERE deleted_at IS NULL` no RLS ou view
- NUNCA hard delete dados de usuario sem processo de compliance

## 2. Indexing Strategy

### Quando Criar Index
- Coluna usada em WHERE com alta cardinalidade
- Coluna usada em JOIN como FK
- Coluna usada em ORDER BY frequentemente
- EXPLAIN ANALYZE mostra Seq Scan em tabela > 10K rows

### Quando NAO Criar Index
- Tabela pequena (< 1000 rows) — Seq Scan e mais rapido
- Coluna com baixa cardinalidade (boolean, status com 3 valores)
- Tabela com mais writes que reads
- Index duplicado de outro ja existente

### Tipos de Index
| Tipo | Quando Usar | Exemplo |
|------|------------|---------|
| B-tree (default) | Igualdade, range, ORDER BY | `CREATE INDEX idx_clients_email ON clients(email)` |
| GIN | JSONB, arrays, full-text search | `CREATE INDEX idx_data_gin ON table USING gin(metadata)` |
| GiST | Geometria, range types, proximity | `CREATE INDEX idx_geo ON locations USING gist(coordinates)` |
| BRIN | Dados sequenciais (timestamps append-only) | `CREATE INDEX idx_logs_created ON logs USING brin(created_at)` |
| Partial | Subset frequente | `CREATE INDEX idx_active ON clients(email) WHERE active = true` |
| Composite | Multi-coluna em query | `CREATE INDEX idx_client_status ON clients(team_id, status)` |

### Ordem em Composite Index
1. Coluna de igualdade primeiro (mais seletiva)
2. Coluna de range/ORDER BY depois
3. Exemplo: `WHERE team_id = X AND created_at > Y` → `(team_id, created_at)`

## 3. Query Optimization

### Regras de Ouro
- EXPLAIN ANALYZE **ANTES** de otimizar (medir, nao chutar)
- CTEs sao materialized por default no PostgreSQL < 12, fence no 12+
- `EXISTS` e geralmente mais rapido que `IN` para subqueries
- `LIMIT` nao salva se o planner ja fez full scan
- `SELECT *` e proibido em producao — listar colunas explicitamente

### N+1 Detection
```sql
-- RUIM: N+1 (1 query por client)
SELECT * FROM clients WHERE id = $1;  -- executado N vezes

-- BOM: Batch query
SELECT * FROM clients WHERE id = ANY($1::uuid[]);  -- 1 query
```

### Window Functions vs GROUP BY
```sql
-- Window function para ranking sem perder rows
SELECT name, revenue,
       RANK() OVER (PARTITION BY team_id ORDER BY revenue DESC) as rank
FROM clients;

-- GROUP BY quando precisa agregar
SELECT team_id, SUM(revenue) as total
FROM clients
GROUP BY team_id;
```

### Pagination
```sql
-- RUIM: OFFSET (performance degrada com paginas altas)
SELECT * FROM clients ORDER BY id LIMIT 20 OFFSET 1000;

-- BOM: Cursor-based (keyset pagination)
SELECT * FROM clients WHERE id > $last_id ORDER BY id LIMIT 20;
```

## 4. RLS (Row Level Security)

### Padrao Basico
```sql
-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT para authenticated users
CREATE POLICY select_clients_authenticated ON clients
  FOR SELECT TO authenticated
  USING (team_id = auth.jwt() ->> 'team_id');

-- Policy de INSERT
CREATE POLICY insert_clients_authenticated ON clients
  FOR INSERT TO authenticated
  WITH CHECK (team_id = auth.jwt() ->> 'team_id');

-- Policy de UPDATE
CREATE POLICY update_clients_authenticated ON clients
  FOR UPDATE TO authenticated
  USING (team_id = auth.jwt() ->> 'team_id')
  WITH CHECK (team_id = auth.jwt() ->> 'team_id');

-- Policy de DELETE (restrita)
CREATE POLICY delete_clients_admin ON clients
  FOR DELETE TO authenticated
  USING (
    team_id = auth.jwt() ->> 'team_id'
    AND auth.jwt() ->> 'role' = 'admin'
  );
```

### Checklist de RLS
- [ ] Todas tabelas com dados de usuario tem RLS habilitado?
- [ ] Policies cobrem SELECT, INSERT, UPDATE, DELETE?
- [ ] Service_role bypass esta documentado?
- [ ] Anon key nao acessa dados sensiveis?
- [ ] USING e WITH CHECK sao consistentes?
- [ ] Testado com SET ROLE?

## 5. Connection Management

### Pool Sizing
- Formula: `connections = (cores * 2) + effective_spindle_count`
- Supabase default: depende do plano (varia de 60 a 500)
- Aplicacao: pool size = min(plan_max / 2, worker_count * 4)
- NUNCA usar 100% das conexoes — reservar 20% para admin/monitoring

### Timeouts
- Statement timeout: 30s para queries normais, 120s para reports
- Idle timeout: 60s (liberar conexoes ociosas)
- Connect timeout: 5s (fail fast)

## 6. Backup & Recovery

### Strategy
| Tipo | Frequencia | Retencao | RTO |
|------|-----------|----------|-----|
| Supabase daily | Automatico | 7-30 dias (plano) | < 1h |
| pg_dump manual | Semanal | 90 dias | < 2h |
| PITR (WAL) | Continuo | 7 dias | < 15min |

### Teste de Restore
- Semanal: restore do backup mais recente em ambiente de teste
- Mensal: DR drill completo com tempo medido
- Trimestral: failover test com stakeholders

## 7. Monitoring Essentials

### Queries de Diagnostico
```sql
-- Conexoes ativas por estado
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- Tabelas maiores
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Cache hit ratio (deve ser > 99%)
SELECT sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as ratio
FROM pg_statio_user_tables;

-- Top 10 queries mais lentas
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```
