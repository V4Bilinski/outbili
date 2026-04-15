# Skills Capability Matrix — 9 Skills → 9 Agentes

## /senior-security (3 tools)

### Threat Modeler
- **Agente primario:** security-sentinel (Aegis)
- **Agente secundario:** compliance-auditor (Codex)
- **Capabilities:** Modelagem STRIDE/DREAD, attack trees, threat analysis automatizada
- **Quando usar:** Nova feature com dados sensiveis, integracao externa, mudanca de auth flow

### Security Auditor
- **Agente primario:** security-sentinel (Aegis)
- **Agente secundario:** compliance-auditor (Codex)
- **Capabilities:** Scan de vulnerabilidades, analise profunda, metricas de seguranca, auto-fix
- **Quando usar:** Pre-release audit, revisao periodica, apos incidente

### Pentest Automator
- **Agente primario:** security-sentinel (Aegis)
- **Agente secundario:** — (exclusivo)
- **Capabilities:** Automacao de pentest, recon, exploitation controlada, reporting
- **Quando usar:** Teste trimestral, validacao pos-remediation, compliance audit

---

## /senior-devops (3 tools)

### Pipeline Generator
- **Agente primario:** devops-pipeline-master (Forge)
- **Agente secundario:** cloud-infra-engineer (Nimbus)
- **Capabilities:** Scaffolding de pipelines CI/CD, templates, quality checks
- **Quando usar:** Novo projeto, refactor de pipeline, adicionar stages

### Terraform Scaffolder
- **Agente primario:** cloud-infra-engineer (Nimbus)
- **Agente secundario:** devops-pipeline-master (Forge)
- **Capabilities:** Scaffolding de IaC, analise, metricas, recomendacoes
- **Quando usar:** Nova infra, refactor de modules, multi-environment setup

### Deployment Manager
- **Agente primario:** devops-pipeline-master (Forge)
- **Agente secundario:** cloud-infra-engineer (Nimbus)
- **Capabilities:** Gestao de deploys, configs, integracao, production-grade
- **Quando usar:** Deploy strategy definition, rollback planning, release management

---

## /senior-backend (3 tools)

### API Scaffolder
- **Agente primario:** devops-pipeline-master (Forge)
- **Agente secundario:** db-architect (Schema)
- **Capabilities:** Scaffolding de APIs, templates, quality checks
- **Quando usar:** Nova API endpoint, Edge Function setup, webhook handler

### Database Migration Tool
- **Agente primario:** db-architect (Schema)
- **Agente secundario:** performance-tuner (Turbo)
- **Capabilities:** Analise e otimizacao de migrations, metricas, auto-fix
- **Quando usar:** Migration planning, schema evolution, version control de DB

### API Load Tester
- **Agente primario:** performance-tuner (Turbo)
- **Agente secundario:** observability-engineer (Radar)
- **Capabilities:** Testes de carga, configs customizaveis, metricas de throughput/latency
- **Quando usar:** Pre-release benchmark, capacity planning, regression testing

---

## Matriz de Cobertura

| Dominio | Skills | MCP Tools | Agente Responsavel |
|---------|--------|-----------|-------------------|
| Schema Design | DB Migration Tool | execute_sql, list_tables | db-architect |
| Migrations | DB Migration Tool | apply_migration, list_migrations | db-architect |
| Type Safety | — | generate_typescript_types | db-architect |
| RLS Policies | Security Auditor | execute_sql | security-sentinel + db-architect |
| Threat Analysis | Threat Modeler, Pentest | — | security-sentinel |
| Vulnerability Scan | Security Auditor | — | security-sentinel |
| Key Management | — | get_publishable_keys | security-sentinel |
| CI/CD Pipelines | Pipeline Generator | — | devops-pipeline-master |
| DB Branching | — | create/merge/delete_branch | devops-pipeline-master |
| Edge Functions | API Scaffolder | deploy/get/list_edge_functions | devops-pipeline-master |
| Deployment | Deployment Manager | — | devops-pipeline-master |
| Cloud Provisioning | Terraform Scaffolder | create/get/list_projects | cloud-infra-engineer |
| Cost Control | — | get_cost, confirm_cost | compliance-auditor |
| Query Performance | — | get_advisors, execute_sql (EXPLAIN) | performance-tuner |
| Load Testing | API Load Tester | — | performance-tuner |
| Logs & Monitoring | — | get_logs | observability-engineer |
| Backup/Recovery | — | (via execute_sql) | backup-recovery-specialist |
| LGPD/Compliance | Security Auditor | — | compliance-auditor |
