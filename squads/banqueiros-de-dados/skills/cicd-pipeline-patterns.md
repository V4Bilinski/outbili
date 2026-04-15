# CI/CD Pipeline Patterns — Banqueiros de Dados

Reusable workflows for database migrations, deployments, rollbacks, and security in CI/CD pipelines.

---

## GitHub Actions Patterns

### Migration Workflow (Lint, Test, Deploy)
```yaml
name: Database Migration
on:
  push:
    paths: ['supabase/migrations/**']
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - name: Lint SQL
        run: |
          npx sqlfluff lint supabase/migrations/ --dialect postgres
      - name: Test on branch
        run: |
          supabase db reset --linked
          supabase test db
      - name: Apply to staging
        if: github.ref == 'refs/heads/develop'
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - name: Apply to production
        if: github.ref == 'refs/heads/main'
        run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_PROD_TOKEN }}
```
**When:** Any migration file is added or modified. **Prerequisites:** Supabase CLI, linked project.

### TypeScript Type Generation
```yaml
name: Generate Types
on:
  push:
    paths: ['supabase/migrations/**']
jobs:
  types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase gen types typescript --linked > src/integrations/supabase/types.ts
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: regenerate Supabase types'
          branch: auto/update-types
```
**When:** After any schema change to keep TypeScript types in sync. **Agent:** @devops-pipeline-master

### Database Backup Verification
```yaml
name: Backup Check
on:
  schedule:
    - cron: '0 6 * * *'  # Daily 6AM UTC
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Check backup age
        run: |
          LAST=$(supabase projects list --json | jq -r '.[0].last_backup')
          AGE=$(( ($(date +%s) - $(date -d "$LAST" +%s)) / 3600 ))
          if [ "$AGE" -gt 25 ]; then
            echo "::error::Backup is ${AGE}h old (max 24h)"
            exit 1
          fi
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```
**When:** Daily automated check. Alert if backup is stale. **Agent:** @backup-recovery-specialist

---

## Supabase Branch Patterns

### Create Branch for PR
```bash
# Create ephemeral database branch for the PR
supabase branches create "pr-${PR_NUMBER}" --linked

# Run migrations on the branch
supabase db push --branch "pr-${PR_NUMBER}"

# Run tests against branch
DATABASE_URL=$(supabase branches get "pr-${PR_NUMBER}" --json | jq -r '.db_url')
npx vitest run --env DATABASE_URL="$DATABASE_URL"
```
**When:** Every PR that touches migrations. Isolated testing. **Agent:** @devops-pipeline-master

### Cleanup Stale Branches
```bash
supabase branches list --json | \
  jq -r '.[] | select(.updated_at < (now - 7*86400 | todate)) | .name' | \
  xargs -I {} supabase branches delete "{}" --linked
```
**When:** Weekly cleanup cron job. Prevents resource waste. **Agent:** @cloud-infra-engineer

---

## Deployment Patterns

### Zero-Downtime Migration
```sql
-- Step 1: Add nullable column (no lock)
ALTER TABLE public.clients ADD COLUMN new_field text;

-- Step 2: Backfill in batches (separate migration)
UPDATE public.clients SET new_field = 'default'
WHERE new_field IS NULL AND id IN (
  SELECT id FROM public.clients WHERE new_field IS NULL LIMIT 1000
);

-- Step 3: Add constraint after backfill complete
ALTER TABLE public.clients ALTER COLUMN new_field SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN new_field SET DEFAULT 'default';
```
**When:** Schema changes on high-traffic tables. Never ALTER NOT NULL in one step. **Agent:** @db-architect

### Edge Function Deploy with Canary
```bash
# Deploy new version
supabase functions deploy my-function --no-verify-jwt

# Test canary endpoint
curl -s -o /dev/null -w "%{http_code}" \
  "https://${PROJECT_REF}.supabase.co/functions/v1/my-function" \
  -H "Authorization: Bearer ${ANON_KEY}"

# If 200, promote; otherwise rollback
```
**When:** Edge function updates that need validation before full rollout. **Agent:** @cloud-infra-engineer

---

## Rollback Patterns

### Migration Rollback Script
```sql
-- Always create a matching down migration
-- File: supabase/migrations/20240101_add_field.sql (UP)
ALTER TABLE public.clients ADD COLUMN priority int DEFAULT 0;

-- File: supabase/rollbacks/20240101_add_field.sql (DOWN)
ALTER TABLE public.clients DROP COLUMN IF EXISTS priority;
```
**When:** Every migration must have a corresponding rollback. **Agent:** @db-architect

### Emergency Database Restore
```bash
# List available backups
supabase projects list --json | jq '.[0].backups'

# Restore from point-in-time (Supabase Pro+)
supabase db restore --time "2024-01-15T10:00:00Z" --linked

# Verify data integrity after restore
psql "$DATABASE_URL" -c "SELECT count(*) FROM clients;"
```
**When:** Data corruption or accidental deletion. ALWAYS notify team first. **Agent:** @backup-recovery-specialist

### Edge Function Version Rollback
```bash
# List deployed versions
supabase functions list --json

# Redeploy previous version from git
git checkout HEAD~1 -- supabase/functions/my-function/
supabase functions deploy my-function
```
**When:** New function version causes errors. Revert to last known good. **Agent:** @devops-pipeline-master

---

## Security in CI/CD

### Secret Management
```yaml
# In GitHub Actions — NEVER hardcode secrets
env:
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  # Use environment-specific secrets
  DATABASE_URL: ${{ secrets[format('DB_URL_{0}', github.ref_name == 'main' && 'PROD' || 'STAGING')] }}
```
**When:** Any workflow that accesses Supabase or database. **Agent:** @security-sentinel

### Service Role Key Handling
```text
RULES:
1. service_role key ONLY in GitHub Secrets, NEVER in code
2. Edge Functions access via Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
3. CI/CD jobs use short-lived tokens where possible
4. Rotate keys quarterly — automate with supabase projects api-keys rotate
5. Audit key usage via Supabase dashboard logs monthly
```
**When:** Any pipeline that needs elevated database access. **Agent:** @security-sentinel

### Environment Variable Isolation
```bash
# .env.local — developer machine only, git-ignored
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# CI/CD — separate secrets per environment
# staging: SUPABASE_URL_STAGING, SUPABASE_KEY_STAGING
# production: SUPABASE_URL_PROD, SUPABASE_KEY_PROD

# Validation step in CI
- name: Verify env vars exist
  run: |
    [ -z "$SUPABASE_ACCESS_TOKEN" ] && echo "::error::Missing token" && exit 1
    echo "All required env vars present"
```
**When:** Project setup, new environment provisioning. **Agent:** @devops-pipeline-master
