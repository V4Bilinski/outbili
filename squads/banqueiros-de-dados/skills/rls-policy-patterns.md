# RLS Policy Patterns — Banqueiros de Dados

Reusable Row Level Security patterns for Supabase/PostgreSQL. Copy, adapt, apply.

---

## Basic Patterns

### User Owns Row
```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.tasks
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
**Use case:** Personal data — tasks, notes, preferences. **Security:** Strictest isolation, one user per row.

### Team-Based Access
```sql
CREATE POLICY "team_read" ON public.projects
FOR SELECT USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

CREATE POLICY "team_write" ON public.projects
FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);
```
**Use case:** Shared resources within a team/squad. **Security:** Ensure team_members table also has RLS.

### Role-Based (Admin / User / Viewer)
```sql
CREATE POLICY "admin_all" ON public.settings
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin'
);

CREATE POLICY "user_read" ON public.settings
FOR SELECT USING (
  (auth.jwt() ->> 'role') IN ('admin', 'user')
);
```
**Use case:** Admin panels, configuration tables. **Security:** Validate role claim is set server-side, never client.

### Public Read / Authenticated Write
```sql
CREATE POLICY "public_read" ON public.announcements
FOR SELECT USING (true);

CREATE POLICY "auth_write" ON public.announcements
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```
**Use case:** Public content, blog posts, announcements. **Security:** Pair with column-level defaults for author_id.

---

## Advanced Patterns

### Hierarchical Access (Manager Sees Team)
```sql
CREATE POLICY "manager_read" ON public.employee_reviews
FOR SELECT USING (
  auth.uid() = employee_id
  OR auth.uid() IN (
    SELECT manager_id FROM public.teams WHERE id = team_id
  )
);
```
**Use case:** Performance reviews, 1:1 notes. **Security:** Avoid deep recursion; flatten hierarchy in a view if > 2 levels.

### Multi-Tenant Isolation
```sql
CREATE POLICY "tenant_isolation" ON public.clients
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);
```
**Use case:** SaaS with multiple organizations. **Security:** Set tenant_id in app_metadata at signup, never from client.

### Time-Based Access
```sql
CREATE POLICY "time_limited" ON public.promotions
FOR SELECT USING (
  starts_at <= now() AND (expires_at IS NULL OR expires_at > now())
);
```
**Use case:** Promotions, time-boxed content, trial features. **Security:** Server clock is authoritative; client cannot manipulate.

### Soft Delete Visibility
```sql
CREATE POLICY "hide_deleted" ON public.documents
FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "admin_see_deleted" ON public.documents
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'admin'
);
```
**Use case:** Soft-deleted records hidden from normal users. **Security:** Ensure DELETE policy also exists or is restricted.

---

## Supabase Auth Patterns

### JWT Claim Extraction
```sql
-- Role from JWT
(auth.jwt() ->> 'role')

-- Custom claim from app_metadata
(auth.jwt() -> 'app_metadata' ->> 'org_id')

-- Email domain check
(auth.jwt() ->> 'email') LIKE '%@bilinski.com'
```
**Use case:** Fine-grained access based on JWT payload. **Security:** Only trust claims set server-side via admin API.

### Service Role Bypass
```text
service_role key bypasses ALL RLS policies.
NEVER expose service_role key to the client.
Use only in: Edge Functions, server-side scripts, migrations.
```

### Anon vs Authenticated
```sql
-- Anon can only read public data
CREATE POLICY "anon_read" ON public.pages
FOR SELECT TO anon USING (is_public = true);

-- Authenticated gets full access to own data
CREATE POLICY "auth_crud" ON public.pages
FOR ALL TO authenticated USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());
```
**Use case:** Mixed public/private content. **Security:** Always specify TO role explicitly.

---

## Testing Patterns

### Test as Specific User
```sql
-- In psql or Supabase SQL editor
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claim.role = 'authenticated';
SET ROLE authenticated;

SELECT * FROM public.tasks; -- Should only see own rows

RESET ROLE;
```
**Use case:** Verify RLS before deployment. **Security:** Never test with service_role and assume it works for users.

### Verify Policy Coverage
```sql
SELECT tablename,
       bool_or(cmd = 'SELECT') AS has_select,
       bool_or(cmd = 'INSERT') AS has_insert,
       bool_or(cmd = 'UPDATE') AS has_update,
       bool_or(cmd = 'DELETE') AS has_delete
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
```
**Use case:** Audit for missing policies per operation. **Security:** Tables without DELETE policy silently block deletes.

---

## Anti-Patterns (Avoid These)

### Overly Permissive
```sql
-- BAD: Allows any authenticated user to see everything
CREATE POLICY "too_open" ON public.salaries
FOR SELECT USING (auth.uid() IS NOT NULL);
```

### Missing WITH CHECK
```sql
-- BAD: User can SELECT own rows but INSERT for any user_id
CREATE POLICY "half_done" ON public.tasks
FOR ALL USING (auth.uid() = user_id);
-- FIX: Add WITH CHECK (auth.uid() = user_id)
```

### Infinite Recursion
```sql
-- BAD: Policy on teams queries teams via subquery → infinite loop
CREATE POLICY "recursive_death" ON public.teams
FOR SELECT USING (
  id IN (SELECT team_id FROM public.teams WHERE manager_id = auth.uid())
);
-- FIX: Use a security definer function or a separate lookup table
```

### Forgetting RLS Enable
```sql
-- Table exists but RLS not enabled = wide open
-- Always run:
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.new_table FORCE ROW LEVEL SECURITY;
-- FORCE ensures even table owners are subject to policies
```
