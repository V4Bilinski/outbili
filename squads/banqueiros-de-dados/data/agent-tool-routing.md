# Agent Tool Routing — Decisao Automatica

## Routing por Keyword

Quando o fortress-master recebe um request, roteia para o agente correto baseado em keywords:

### db-architect (Schema)
Keywords: `schema`, `tabela`, `coluna`, `migration`, `index`, `constraint`, `foreign key`,
`type generation`, `DDL`, `CREATE TABLE`, `ALTER TABLE`, `normalizacao`, `desnormalizacao`

### security-sentinel (Aegis)
Keywords: `seguranca`, `RLS`, `policy`, `criptografia`, `encryption`, `threat`, `pentest`,
`vulnerabilidade`, `OWASP`, `JWT`, `auth`, `key management`, `zero trust`

### cloud-infra-engineer (Nimbus)
Keywords: `terraform`, `docker`, `container`, `cloud`, `VPS`, `provisionar`, `escalar`,
`region`, `failover`, `projeto supabase`, `create project`, `pause project`

### devops-pipeline-master (Forge)
Keywords: `pipeline`, `CI/CD`, `deploy`, `release`, `branch`, `rollback`, `edge function`,
`GitHub Actions`, `build`, `artifact`, `canary`, `blue-green`

### performance-tuner (Turbo)
Keywords: `performance`, `lento`, `slow query`, `EXPLAIN`, `index scan`, `seq scan`,
`latencia`, `throughput`, `load test`, `benchmark`, `cache`, `connection pool`

### backup-recovery-specialist (Vault)
Keywords: `backup`, `restore`, `recovery`, `disaster`, `RPO`, `RTO`, `snapshot`,
`point-in-time`, `PITR`, `replicacao`, `failover`, `retencao`

### compliance-auditor (Codex)
Keywords: `LGPD`, `compliance`, `classificacao`, `audit trail`, `consentimento`,
`DPO`, `ROPA`, `custo`, `billing`, `SOC2`, `ISO 27001`, `retencao de dados`

### observability-engineer (Radar)
Keywords: `monitoring`, `log`, `alerta`, `dashboard`, `metricas`, `SLO`, `SLI`,
`error budget`, `anomalia`, `uptime`, `on-call`, `traces`

## Routing por Severidade

| Severidade | Acao |
|-----------|------|
| Critical (servico down) | observability-engineer (detect) → fortress-master (coordinate) |
| High (security breach) | security-sentinel (investigate) → fortress-master (escalate) |
| Medium (performance degradation) | performance-tuner (diagnose) → db-architect (fix) |
| Low (optimization opportunity) | performance-tuner ou compliance-auditor |

## Routing por Workflow

| Workflow | Sequencia de Agentes |
|----------|---------------------|
| Nova feature com dados | db-architect → security-sentinel → devops-pipeline-master |
| Schema change | db-architect → performance-tuner → devops-pipeline-master |
| Security audit | security-sentinel → compliance-auditor → fortress-master |
| Performance issue | observability-engineer → performance-tuner → db-architect |
| Incident response | observability-engineer → security-sentinel → backup-recovery |
| New environment | cloud-infra-engineer → devops-pipeline-master → security-sentinel |
| Cost review | compliance-auditor → cloud-infra-engineer → fortress-master |
