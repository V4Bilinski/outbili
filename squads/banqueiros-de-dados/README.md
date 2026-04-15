# Squad Data Fortress

Squad de Inteligencia de Infraestrutura, Seguranca de Dados & Database Engineering.

## Visao Geral

O Data Fortress organiza **38 capabilities** (9 skills + 29 Supabase MCP tools) em **9 agentes especializados** com workflows operacionais completos.

## Organograma

```
                    fortress-master (Tier 0)
                    Orquestrador Central
                           |
          +----------------+----------------+
          |                |                |
     Tier 1: Core Engineering              |
          |                |                |
    db-architect    security-sentinel   cloud-infra-engineer
    (Schema/SQL)    (RLS/Crypto/Pen)    (Terraform/Docker)
          |                |                |
          +-------devops-pipeline-master----+
                  (CI/CD/Deploy/Release)
                           |
          +----------------+----------------+
          |                |                |
     Tier 2: Especialistas                 |
          |                |                |
  performance-tuner  backup-recovery  compliance-auditor
  (Query/Load/Index) (DR/Restore)    (LGPD/SOC2/Audit)
          |
  observability-engineer
  (Logs/Alerts/Dashboards)
```

## Mapeamento de Skills → Agentes

### /senior-security (3 tools)

| Tool | Agente Primario | Agente Secundario |
|------|----------------|-------------------|
| Threat Modeler | security-sentinel | compliance-auditor |
| Security Auditor | security-sentinel | compliance-auditor |
| Pentest Automator | security-sentinel | — |

### /senior-devops (3 tools)

| Tool | Agente Primario | Agente Secundario |
|------|----------------|-------------------|
| Pipeline Generator | devops-pipeline-master | cloud-infra-engineer |
| Terraform Scaffolder | cloud-infra-engineer | devops-pipeline-master |
| Deployment Manager | devops-pipeline-master | cloud-infra-engineer |

### /senior-backend (3 tools)

| Tool | Agente Primario | Agente Secundario |
|------|----------------|-------------------|
| API Scaffolder | devops-pipeline-master | db-architect |
| Database Migration Tool | db-architect | performance-tuner |
| API Load Tester | performance-tuner | observability-engineer |

### Supabase MCP (29 tools)

| Categoria | Tools | Agente |
|-----------|-------|--------|
| SQL & Schema | execute_sql, list_tables, list_extensions | db-architect |
| Migrations | apply_migration, list_migrations | db-architect |
| Types | generate_typescript_types | db-architect |
| Branches | create_branch, list_branches, merge_branch, rebase_branch, reset_branch, delete_branch | devops-pipeline-master |
| Edge Functions | deploy_edge_function, get_edge_function, list_edge_functions | devops-pipeline-master |
| Logs | get_logs | observability-engineer |
| Advisors | get_advisors | performance-tuner |
| Projects | create_project, get_project, get_project_url, list_projects, pause_project, restore_project | cloud-infra-engineer |
| Orgs | get_organization, list_organizations | fortress-master |
| Keys | get_publishable_keys | security-sentinel |
| Costs | get_cost, confirm_cost | compliance-auditor |
| Docs | search_docs | fortress-master |

## Fluxo Operacional

```
DESIGN          IMPLEMENT        SECURE           OPTIMIZE         RECOVER
db-architect →  db-architect →   security →       perf-tuner →    backup →
security        devops           compliance       db-architect     db-architect →
(RLS review)    pipeline         (LGPD)           (refactor)       observability
→ master        cloud-infra      → master         observability    (confirm)
(approve)       (provision)      (certify)        (monitor)
```

## Comandos Rapidos

```bash
# Ativar o squad
@fortress-master

# Database
*schema-audit                    # Auditoria completa do schema
*migration-plan                  # Plano de migracao
*index-optimization              # Otimizacao de indices
*rls-setup                       # Configurar Row Level Security
*query-profiling                 # Profiling de queries lentas
*type-generation                 # Gerar tipos TypeScript

# Security
*threat-model                    # Modelagem de ameacas
*vulnerability-scan              # Scan de vulnerabilidades
*encryption-setup                # Configurar criptografia
*access-control-audit            # Auditoria de controle de acesso
*lgpd-audit                      # Auditoria LGPD
*data-classification             # Classificacao de dados

# DevOps
*pipeline-setup                  # Setup de CI/CD
*deployment-strategy             # Estrategia de deploy
*iac-review                      # Revisao de IaC
*container-orchestration         # Orquestracao de containers

# Performance & Cloud
*cost-optimization               # Otimizacao de custos
*scaling-strategy                # Estrategia de scaling
*disaster-recovery-plan          # Plano de DR
*performance-benchmark           # Benchmark de performance

# Observability
*monitoring-setup                # Setup de monitoramento
*alerting-rules                  # Regras de alerta
*log-aggregation                 # Agregacao de logs
*dashboard-creation              # Criacao de dashboards
```

## Workflows

1. **Database Lifecycle** — Design → Implement → Optimize → Monitor
2. **Security Hardening** — Assess → Remediate → Validate → Certify
3. **Infrastructure Provisioning** — Plan → Provision → Validate → Deploy
4. **Incident Response** — Detect → Triage → Resolve → Postmortem
5. **Compliance Audit** — Scope → Assess → Remediate → Certify
6. **Performance Optimization** — Profile → Diagnose → Optimize → Validate
