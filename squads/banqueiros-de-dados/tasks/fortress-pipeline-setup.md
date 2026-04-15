---
task: Pipeline Setup
responsavel: "@devops-pipeline-master"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - repo_url: URL do repositorio
  - environments: Lista de ambientes (dev/staging/prod)
  - migration_tool: Ferramenta de migration (supabase default)
  - notification_channel: Canal de notificacao
Saida: |
  - workflow_file: GitHub Actions workflow YAML
  - pipeline_docs: Documentacao do pipeline
  - environment_matrix: Matriz de ambientes
Checklist:
  - "[ ] Pipeline triggers configurados"
  - "[ ] Stage de lint SQL incluido"
  - "[ ] Stage de migration testado"
  - "[ ] Rollback mecanismo definido"
  - "[ ] Notificacoes configuradas"
  - "[ ] Branch protection rules set"
---

# Task: fortress-pipeline-setup

**Agent:** @devops-pipeline-master
**Trigger:** `*pipeline-setup`
**Objetivo:** Configurar CI/CD pipeline para migrations e deploys de banco

---

## Inputs

```yaml
elicit: true
fields:
  - repo_url: "URL do repositorio GitHub?"
  - environments: "Quais ambientes? (dev, staging, prod)"
  - migration_tool: "Ferramenta de migration? (supabase/prisma/knex)"
  - notification_channel: "Canal de notificacao? (slack/email/webhook)"
```

---

## Execucao

### FASE 1 — Design do Pipeline

```
lint-sql → test-migration (branch) → deploy-staging → approval → deploy-prod → verify
```

| Stage | Trigger | Acao | Timeout | Retry |
|-------|---------|------|---------|-------|
| Lint SQL | Push/PR | sqlfluff + custom rules | 5min | 0 |
| Test Migration | PR | Apply em Supabase branch | 10min | 1 |
| Deploy Staging | Merge to main | Apply migration staging | 10min | 1 |
| Approval Gate | Manual | Reviewer aprova | 24h | 0 |
| Deploy Prod | Post-approval | Apply migration prod | 10min | 0 |
| Verify | Post-deploy | Health checks | 5min | 2 |

### FASE 2 — GitHub Actions Workflow

```yaml
name: Database Pipeline
on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']
  pull_request:
    paths: ['supabase/migrations/**']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint SQL migrations
        run: npx sqlfluff lint supabase/migrations/

  test-migration:
    needs: lint
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create Supabase branch
        run: supabase db branch create pr-${{ github.event.number }}
      - name: Apply migration to branch
        run: supabase db push --db-url ${{ secrets.SUPABASE_BRANCH_URL }}
      - name: Generate types
        run: supabase gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_ID }}

  deploy-staging:
    needs: lint
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Apply migration
        run: supabase db push --db-url ${{ secrets.STAGING_DB_URL }}
      - name: Verify
        run: supabase db lint

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Apply migration
        run: supabase db push --db-url ${{ secrets.PROD_DB_URL }}
      - name: Health check
        run: curl -f ${{ secrets.PROD_HEALTH_URL }}
```

### FASE 3 — Rollback Strategy

| Cenario | Rollback | Automatico? |
|---------|----------|------------|
| Migration falhou | Nao aplicar (transactional) | Sim |
| Bug pos-deploy | Rollback SQL manual | Nao |
| Data corruption | Restore backup PITR | Nao |

---

## Outputs

- GitHub Actions workflow file (.github/workflows/database-pipeline.yml)
- Pipeline documentation
- Environment matrix com secrets necessarios
