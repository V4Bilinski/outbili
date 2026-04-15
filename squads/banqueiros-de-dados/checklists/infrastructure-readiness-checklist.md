# Infrastructure Readiness Checklist

## Executar: Antes de cada release | Agente: cloud-infra-engineer + devops-pipeline-master

### CI/CD Pipeline
- [ ] Pipeline roda lint + typecheck + test + build
- [ ] Cache de dependencias habilitado (node_modules)
- [ ] Build time < 5 minutos
- [ ] Deploy automatico em push to main
- [ ] Rollback procedure documentado e testado

### Docker & Containers
- [ ] Imagem usando multi-stage build
- [ ] Non-root user configurado
- [ ] HEALTHCHECK definido e funcionando
- [ ] Versoes pinned (nao :latest em producao)
- [ ] .dockerignore atualizado (exclui node_modules, .git, .env)
- [ ] Scan de vulnerabilidades sem CRITICAL

### Hosting & Network
- [ ] VPS respondendo (health check OK)
- [ ] Easypanel operacional
- [ ] Domain brabissimo.bilinski.cloud resolvendo
- [ ] SSL certificado valido (nao expirando em < 30 dias)
- [ ] DNS configurado corretamente

### Supabase
- [ ] Projeto ativo (nao pausado)
- [ ] Todas migrations aplicadas
- [ ] Edge Functions deployadas e respondendo
- [ ] Connection pool com capacidade disponivel
- [ ] Backup diario ativo

### Environment
- [ ] Variaveis de ambiente configuradas em producao
- [ ] VITE_SUPABASE_URL correto
- [ ] VITE_SUPABASE_ANON_KEY correto
- [ ] Nenhum secret hardcoded no codigo
- [ ] .env.example atualizado com todas variaveis necessarias

### Monitoring
- [ ] Uptime monitoring ativo
- [ ] Alertas configurados (downtime, latencia, errors)
- [ ] Dashboard de saude acessivel
- [ ] On-call rotation definida (se aplicavel)
