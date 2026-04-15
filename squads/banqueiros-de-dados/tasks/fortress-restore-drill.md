---
name: fortress-restore-drill
description: Executar drill de restore para validar RPO/RTO e integridade dos backups
agent: backup-recovery-specialist
---

# Fortress Restore Drill

## Objetivo
Executar um drill completo de disaster recovery para validar que os backups funcionam, medir RPO/RTO real, e identificar gaps no processo de recuperacao.

## Pre-requisitos
- Backup recente disponivel (Supabase PITR ou pg_dump)
- Ambiente isolado para restore (Supabase branch ou projeto de staging)
- Script `scripts/backup-verify.sql` disponivel
- Cronometro para medir RTO real

## Passos

### 1. Preparar ambiente de drill

```bash
# Opcao A: Criar branch Supabase para teste
supabase branches create drill-restore --project-ref $PROJECT_REF

# Opcao B: Usar projeto de staging separado
# supabase projects list (identificar staging)
```

### 2. Capturar baseline pre-restore

```sql
-- Executar no banco PRODUCAO para comparacao posterior
-- Salvar resultado como baseline.json
SELECT
  table_name,
  n_live_tup AS rows,
  pg_size_pretty(pg_total_relation_size('public.' || table_name)) AS size
FROM information_schema.tables t
JOIN pg_stat_user_tables s ON s.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY n_live_tup DESC;
```

### 3. Executar restore

```bash
# Iniciar cronometro
START_TIME=$(date +%s)

# Opcao A: PITR Supabase (via dashboard ou CLI)
# Selecionar ponto no tempo desejado

# Opcao B: Restore de pg_dump
pg_restore \
  --dbname="$STAGING_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  backup_file.sql.gz \
  2>restore.log

END_TIME=$(date +%s)
RTO_SECONDS=$((END_TIME - START_TIME))
echo "RTO medido: ${RTO_SECONDS}s ($(echo "scale=1; $RTO_SECONDS/60" | bc)min)"
```

### 4. Validar integridade pos-restore

```sql
-- Executar scripts/backup-verify.sql no ambiente restaurado
-- Comparar com baseline:

-- 4a. Contagem de rows (deve bater com baseline)
SELECT relname, n_live_tup FROM pg_stat_user_tables
WHERE schemaname = 'public' ORDER BY relname;

-- 4b. Integridade de foreign keys
-- (usar bloco DO $$ do backup-verify.sql)

-- 4c. Extensoes presentes
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- 4d. RLS policies intactas
SELECT tablename, count(*) as policies
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;

-- 4e. Migracoes aplicadas
SELECT version, name FROM supabase_migrations.schema_migrations
ORDER BY version DESC LIMIT 5;
```

### 5. Testar aplicacao contra banco restaurado

- Conectar app ao ambiente restaurado
- Executar smoke tests basicos (login, CRUD, queries criticas)
- Verificar que edge functions respondem

### 6. Medir e documentar RPO

```
RPO declarado: _____ (ex: 6 horas)
RPO real medido: _____ (timestamp do backup vs timestamp do incidente simulado)
Gap: _____
```

### 7. Cleanup

```bash
# Remover branch de drill
supabase branches delete drill-restore --project-ref $PROJECT_REF
```

### 8. Preencher drill report

| Metrica | Target | Resultado | Status |
|---------|--------|-----------|--------|
| RTO | < __min | __min | ✅/⛔ |
| RPO | < __h | __h | ✅/⛔ |
| Data integrity | 100% | __% | ✅/⛔ |
| FK integrity | 0 orphans | __ orphans | ✅/⛔ |
| RLS policies | All intact | __/__ | ✅/⛔ |
| App smoke test | Pass | Pass/Fail | ✅/⛔ |

## Output
- Drill report com metricas RPO/RTO reais
- Lista de gaps identificados
- Action items para correcao
- Timestamp do proximo drill agendado

## Validacao
- [ ] Restore completou sem erros
- [ ] Contagem de rows bate com baseline (tolerancia < 1%)
- [ ] Zero orphan records em foreign keys
- [ ] RLS policies todas intactas
- [ ] Aplicacao funcional contra banco restaurado
- [ ] RTO dentro do target declarado
- [ ] RPO dentro do target declarado
- [ ] Report documentado e compartilhado
