# Security Patterns — Knowledge Base

## 1. Defense in Depth (Camadas de Seguranca)

### Camada 1: Network
- TLS 1.3 obrigatorio para todas comunicacoes
- CORS configurado com origins explicitos (nao usar `*`)
- CSP (Content Security Policy) header configurado
- Rate limiting em endpoints publicos (100 req/min default)
- WAF para protecao contra ataques comuns

### Camada 2: Authentication (Supabase Auth)
- JWT com expiracao curta (1h access token, 7d refresh)
- Refresh token rotation habilitada
- MFA recomendado para admins
- Session management com revogacao
- Brute force protection (lockout apos 5 tentativas)

### Camada 3: Authorization (RLS + RBAC)
- RLS habilitado em TODA tabela com dados de usuario
- Roles definidos: anon, authenticated, admin, service_role
- Principio do menor privilegio — dar acesso minimo necessario
- Service_role APENAS server-side, NUNCA no frontend
- Audit log de toda operacao privilegiada

### Camada 4: Data Protection
- Encryption at rest (AES-256, gerenciado pelo Supabase)
- Encryption in transit (TLS 1.3)
- Pseudonimizacao de dados sensiveis em logs
- Data masking em ambientes nao-production
- Tokenizacao para dados de pagamento

### Camada 5: Application
- Input validation em toda entrada (Zod schemas)
- Parameterized queries SEMPRE (nunca concatenar SQL)
- Output encoding para prevenir XSS
- CSRF tokens em forms
- Sanitizacao de uploads de arquivo

### Camada 6: Monitoring
- Audit logs imutaveis (INSERT only)
- Anomaly detection em padroes de acesso
- Alertas para tentativas de acesso negadas
- Dashboard de security posture

## 2. OWASP Top 10 — Checklist para Supabase

### A01: Broken Access Control
- [x] RLS habilitado em todas tabelas
- [ ] Policies testadas com SET ROLE
- [ ] Funcoes server-side validam permissoes
- [ ] Edge Functions verificam JWT

### A02: Cryptographic Failures
- [x] TLS 1.3 (Supabase managed)
- [x] Encryption at rest (Supabase managed)
- [ ] Secrets nao hardcoded no frontend
- [ ] Chaves rotacionadas a cada 90 dias

### A03: Injection
- [x] Supabase client usa parameterized queries
- [ ] Edge Functions com input validation
- [ ] Nao usar `execute_sql` com strings concatenadas
- [ ] Stored procedures com SECURITY DEFINER auditadas

### A04: Insecure Design
- [ ] Threat model documentado para features sensiveis
- [ ] Rate limiting em operacoes criticas
- [ ] Business logic flaws revisados

### A05: Security Misconfiguration
- [ ] Anon key nao acessa dados sensiveis
- [ ] Service_role key nao exposta
- [ ] CORS nao usa wildcard
- [ ] Debug mode desabilitado em producao

### A06: Vulnerable Components
- [ ] npm audit regular (zero high/critical)
- [ ] Dependencias atualizadas mensalmente
- [ ] Supabase client na versao mais recente

### A07: Auth Failures
- [ ] MFA para contas admin
- [ ] Session timeout configurado
- [ ] Password policy forte (min 12 chars)
- [ ] Brute force protection ativo

### A08: Software/Data Integrity
- [ ] CI/CD pipeline nao modificavel por non-admins
- [ ] GitHub branch protection em main
- [ ] Migrations assinadas/verificadas

### A09: Logging/Monitoring Failures
- [ ] Audit logs de acesso a dados sensiveis
- [ ] Alertas para padroes anomalos
- [ ] Log retention adequado (min 1 ano)

### A10: SSRF
- [ ] Edge Functions nao fazem fetch para URLs arbitrarias
- [ ] Webhooks validam origem
- [ ] Redirect URLs whitelistadas

## 3. Supabase-Specific Security Patterns

### Anon Key vs Service Role Key
```
ANON KEY (publica):
- Pode estar no frontend
- Limitada por RLS policies
- Acessa APENAS o que RLS permite

SERVICE ROLE KEY (secreta):
- APENAS server-side (Edge Functions, backend)
- Bypassa RLS completamente
- NUNCA expor no frontend
- Audit log de cada uso
```

### RLS Anti-Patterns
```sql
-- PERIGOSO: permite tudo
CREATE POLICY bad_policy ON sensitive_data FOR ALL USING (true);

-- PERIGOSO: USING sem WITH CHECK (data leak via INSERT)
CREATE POLICY leak_policy ON data FOR INSERT USING (user_id = auth.uid());
-- Correto: usar WITH CHECK para INSERT
CREATE POLICY safe_policy ON data FOR INSERT WITH CHECK (user_id = auth.uid());

-- PERIGOSO: Function com SECURITY DEFINER sem validacao
CREATE FUNCTION admin_action() RETURNS void SECURITY DEFINER AS $$
  DELETE FROM users;  -- Qualquer um pode chamar!
$$ LANGUAGE sql;
```

### JWT Claims Validation
```sql
-- Extrair claim do JWT na RLS policy
CREATE POLICY team_isolation ON clients
  FOR ALL TO authenticated
  USING (
    team_id = (auth.jwt() -> 'app_metadata' ->> 'team_id')::uuid
  );
```

## 4. Incident Response Playbook

### Severidade 1: Data Breach / DB Compromised
1. ISOLAR: Revogar todas sessions (`auth.admin.signOutAll()`)
2. BLOQUEAR: Pausar projeto se necessario (`pause_project`)
3. INVESTIGAR: `get_logs` para timeline do incidente
4. CONTER: Revogar keys comprometidas
5. RECUPERAR: Restore de backup pre-incidente
6. REPORTAR: Notificar DPO em < 72h (LGPD)
7. REMEDIAR: Fix root cause, add monitoring

### Severidade 2: Unauthorized Access Detected
1. INVESTIGAR: Verificar logs de auth e API
2. REVOGAR: Sessao do usuario suspeito
3. AUDITAR: RLS policies da tabela afetada
4. CORRIGIR: Patch na vulnerabilidade
5. MONITORAR: Alerta adicional por 30 dias

### Severidade 3: Vulnerability Discovered
1. CLASSIFICAR: CVSS score + impacto no sistema
2. PRIORIZAR: Critical/High = fix em 24h
3. CORRIGIR: Patch + teste
4. VALIDAR: Security Auditor re-scan
5. DOCUMENTAR: Postmortem + lesson learned
