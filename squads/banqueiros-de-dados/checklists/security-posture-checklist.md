# Security Posture Checklist

## Executar: Mensal | Agente: security-sentinel + compliance-auditor

### Row Level Security (RLS)
- [ ] RLS habilitado em TODA tabela com dados de usuario
- [ ] Policies cobrem SELECT, INSERT, UPDATE, DELETE
- [ ] Nenhuma policy com USING(true) em tabela sensivel
- [ ] Service_role bypass documentado e justificado
- [ ] Testado com SET ROLE para cada role (anon, authenticated)

### Authentication
- [ ] JWT expiration configurado (access: 1h, refresh: 7d)
- [ ] Refresh token rotation habilitada
- [ ] Password policy forte (min 12 chars, complexidade)
- [ ] Brute force protection ativo (lockout apos 5 tentativas)
- [ ] MFA habilitado para contas admin

### Key Management
- [ ] Anon key NAO acessa dados sensiveis diretamente
- [ ] Service_role key NUNCA no frontend/client-side code
- [ ] Todas API keys rotacionadas nos ultimos 90 dias
- [ ] .env NAO commitado no repositorio
- [ ] Secrets no GitHub Actions via encrypted secrets

### Network & Headers
- [ ] TLS 1.3 verificado em todos endpoints
- [ ] CORS configurado com origins explicitos (nao wildcard)
- [ ] CSP header configurado
- [ ] X-Frame-Options: DENY
- [ ] Rate limiting em endpoints publicos

### Application Security
- [ ] Zero SQL injection vectors (todas queries parametrizadas)
- [ ] Input validation em todas entradas de usuario
- [ ] Output encoding para prevenir XSS
- [ ] npm audit sem vulnerabilidades HIGH/CRITICAL
- [ ] Dependencias atualizadas (nenhuma > 6 meses desatualizada)

### Monitoring & Audit
- [ ] Audit logs cobrindo operacoes sensiveis
- [ ] Alertas para tentativas de acesso negadas
- [ ] Log de autenticacao (login, logout, failed attempts)
- [ ] Nenhum dado pessoal (PII) em logs
