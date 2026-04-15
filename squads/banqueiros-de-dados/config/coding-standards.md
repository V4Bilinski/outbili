# Coding Standards — Squad Banqueiros de Dados

## SQL Standards

### Naming
- Tabelas: `snake_case`, plural (`clients`, `team_members`)
- Colunas: `snake_case` (`created_at`, `client_id`)
- Indexes: `idx_{table}_{columns}` (`idx_clients_email`)
- Constraints: `{table}_{type}_{column}` (`clients_pkey_id`)
- RLS Policies: `{action}_{table}_{role}` (`select_clients_authenticated`)
- Functions: `fn_{domain}_{action}` (`fn_auth_get_user_role`)
- Triggers: `trg_{table}_{event}` (`trg_clients_after_insert`)

### Migrations
- Arquivo: `{timestamp}_{description}.sql` (e.g., `20260406120000_add_clients_index.sql`)
- SEMPRE reversivel (include rollback section)
- NUNCA alterar migration ja aplicada
- Testar em Supabase branch antes de merge
- Incluir `COMMENT ON TABLE/COLUMN`

### Queries
- UPPERCASE para keywords SQL (`SELECT`, `FROM`, `WHERE`, `JOIN`)
- Alias significativos (`c` para clients, `tm` para team_members)
- CTEs preferidas sobre subqueries complexas
- EXPLAIN ANALYZE antes de qualquer query em producao
- Parametrized queries SEMPRE (nunca concatenar strings)

## Infrastructure Standards

### Terraform
- State remoto obrigatorio (S3/GCS)
- Modules para componentes reutilizaveis
- Variables tipadas com descriptions
- Outputs documentados
- `terraform fmt` + `terraform validate` no CI

### Docker
- Multi-stage builds
- Non-root user
- HEALTHCHECK definido
- Pinned versions (nao usar `:latest` em prod)
- `.dockerignore` atualizado

### CI/CD
- Pipeline roda lint + typecheck + test antes de build
- Secrets via GitHub Secrets (nunca hardcoded)
- Cache de dependencias habilitado
- Rollback automatico se health check falhar

## Security Standards

### RLS
- TODA tabela com dados de usuario tem RLS habilitado
- Policy por role: anon, authenticated, service_role
- Testar com `SET ROLE` antes de deploy
- Documentar bypass patterns explicitamente

### Secrets
- `.env` NUNCA commitado
- Rotacao a cada 90 dias
- Service role key NUNCA no frontend
- Audit log de acesso a secrets

### Logging
- Structured logging (JSON)
- NUNCA logar dados pessoais (PII)
- Niveis: DEBUG, INFO, WARN, ERROR, FATAL
- Correlation ID em todo request
