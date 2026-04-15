# Disaster Recovery Checklist

## Executar: Mensal (verificacao) + Trimestral (drill) | Agente: backup-recovery-specialist

### Backup Status
- [ ] Backup diario Supabase ativo e verificado
- [ ] Ultimo backup completou com sucesso
- [ ] Backup manual (pg_dump) executado esta semana
- [ ] Backups armazenados em localizacao separada da producao
- [ ] Retencao conforme politica (7d diario, 30d semanal, 90d mensal)

### Recovery Readiness
- [ ] RPO definido e documentado por categoria de dados
- [ ] RTO definido e documentado por servico
- [ ] Restore testado com sucesso no ultimo mes
- [ ] Tempo real de restore dentro do RTO definido
- [ ] Dados restaurados validados (integridade e completude)

### Disaster Recovery Plan
- [ ] DR plan documentado e acessivel
- [ ] Contatos de emergencia atualizados
- [ ] Escalation path definido por severidade
- [ ] Runbooks para cenarios comuns (DB crash, data corruption, infra failure)
- [ ] Comunicacao de crise planejada (quem avisa quem)

### Infrastructure Resilience
- [ ] Supabase project nao depende de single point of failure
- [ ] DNS TTL baixo para permitir failover rapido
- [ ] Secrets e credenciais acessiveis em cenario de emergencia
- [ ] Processo de recreacao de infra documentado (infra as code)

### Drill Results (Trimestral)
- [ ] DR drill executado com sucesso
- [ ] Tempo medido vs RTO target
- [ ] Gaps identificados e action items criados
- [ ] Equipe treinada no processo
- [ ] Postmortem do drill documentado

### Cenarios Cobertos
- [ ] Database crash/corruption → Restore de backup
- [ ] VPS indisponivel → Redeploy em novo servidor
- [ ] Supabase outage → Comunicacao + fallback plan
- [ ] Data breach → Incident response + notification LGPD
- [ ] Ransomware → Isolamento + restore de backup limpo
- [ ] Erro humano (DROP TABLE) → PITR ou restore seletivo
