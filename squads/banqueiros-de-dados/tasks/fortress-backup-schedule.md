---
name: fortress-backup-schedule
description: Configurar estrategia de backup automatizado com retencao e verificacao
agent: backup-recovery-specialist
---

# Fortress Backup Schedule

## Objetivo
Definir e implementar uma estrategia completa de backup automatizado para o ambiente Supabase/PostgreSQL, incluindo scheduling, retencao, verificacao de integridade e alertas de falha.

## Pre-requisitos
- Acesso ao projeto Supabase (admin)
- Conhecimento do RPO/RTO definido pelo negocio
- Inventario de tabelas criticas (via `scripts/schema-inventory.sql`)

## Passos

### 1. Classificar dados por criticidade

```sql
-- Identificar tabelas criticas por tamanho e atividade
SELECT
  relname AS table_name,
  n_live_tup AS rows,
  pg_size_pretty(pg_total_relation_size(relid)) AS size,
  n_tup_ins + n_tup_upd + n_tup_del AS total_writes,
  CASE
    WHEN n_tup_ins + n_tup_upd + n_tup_del > 10000 THEN 'TIER 1 — Critical'
    WHEN n_tup_ins + n_tup_upd + n_tup_del > 1000 THEN 'TIER 2 — Important'
    ELSE 'TIER 3 — Low activity'
  END AS backup_tier
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY total_writes DESC;
```

### 2. Definir politica de retencao

| Tier | Frequencia | Retencao | Tipo |
|------|-----------|----------|------|
| Tier 1 — Critical | A cada 6h | 30 dias | PITR + daily full |
| Tier 2 — Important | Diario | 14 dias | Daily full |
| Tier 3 — Low activity | Semanal | 7 dias | Weekly full |

### 3. Verificar backups Supabase nativos

```bash
# Verificar status do projeto (backups sao automaticos no Supabase Pro)
supabase projects list
supabase inspect db --project-ref $PROJECT_REF
```

### 4. Configurar backup adicional via pg_dump (se necessario)

```bash
#!/bin/bash
# backup-cron.sh — executar via cron ou GitHub Actions
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --verbose \
  2>"backup_${TIMESTAMP}.log" \
  | gzip > "$BACKUP_FILE"

# Verificar integridade
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backup valido: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "⛔ Backup CORROMPIDO: $BACKUP_FILE"
  exit 1
fi
```

### 5. Configurar alerta de falha

- Webhook para Slack/Discord em caso de falha
- Monitorar idade do ultimo backup (alerta se > 24h sem backup)
- Verificar tamanho do backup (alerta se variacao > 30% vs anterior)

### 6. Documentar runbook de restore

- Preencher `templates/infrastructure-runbook-template.md` com procedimento de restore
- Incluir tempo estimado por tier
- Testar restore em ambiente de staging

## Output
- Politica de backup documentada (tier + frequencia + retencao)
- Script de backup configurado (se extra-Supabase necessario)
- Alertas de falha configurados
- Runbook de restore preenchido

## Validacao
- [ ] Backup executado com sucesso ao menos 1x
- [ ] Restore testado em ambiente isolado
- [ ] Alertas de falha testados (simular falha)
- [ ] Retencao configurada conforme politica
- [ ] Documentacao de restore completa e acessivel
