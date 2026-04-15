# Tech Stack — Squad Banqueiros de Dados

## Core Database
| Tecnologia | Uso | Versao |
|-----------|-----|--------|
| PostgreSQL | Database engine | 15+ (via Supabase) |
| Supabase | BaaS (Auth, Realtime, Storage, Edge Functions) | Latest |
| PgBouncer / Supavisor | Connection pooling | Managed by Supabase |

## Infrastructure
| Tecnologia | Uso |
|-----------|-----|
| Docker | Containerizacao (nginx, builds) |
| Easypanel | Orquestracao no VPS |
| GitHub Actions | CI/CD pipelines |
| Terraform | Infrastructure as Code (quando aplicavel) |

## Monitoring & Observability
| Tecnologia | Uso |
|-----------|-----|
| Supabase Logs | Database, Auth, API, Realtime logs |
| Supabase Advisors | Performance recommendations |
| pg_stat_statements | Query performance stats |
| pg_stat_user_tables | Table-level stats |

## Security
| Tecnologia | Uso |
|-----------|-----|
| Supabase Auth | JWT-based authentication |
| RLS (Row Level Security) | Authorization at database level |
| TLS 1.3 | Encryption in transit |
| AES-256 | Encryption at rest (Supabase managed) |

## Skills Integradas
| Skill | Tools |
|-------|-------|
| /senior-security | Threat Modeler, Security Auditor, Pentest Automator |
| /senior-devops | Pipeline Generator, Terraform Scaffolder, Deployment Manager |
| /senior-backend | API Scaffolder, Database Migration Tool, API Load Tester |

## MCP Tools (29 Supabase)
| Categoria | Quantidade | Tools Principais |
|-----------|-----------|-----------------|
| SQL & Schema | 3 | execute_sql, list_tables, list_extensions |
| Migrations | 2 | apply_migration, list_migrations |
| Types | 1 | generate_typescript_types |
| Branches | 6 | create/list/merge/rebase/reset/delete_branch |
| Edge Functions | 3 | deploy/get/list_edge_functions |
| Projects | 6 | create/get/list/pause/restore_project, get_project_url |
| Logs & Advisors | 2 | get_logs, get_advisors |
| Orgs & Keys | 4 | get/list_organizations, get_publishable_keys, search_docs |
| Costs | 2 | get_cost, confirm_cost |

## Ambiente Brabissimo
| Item | Detalhe |
|------|---------|
| VPS | Hostinger 76.13.171.91, Ubuntu 24.04 |
| Orquestracao | Easypanel + Docker |
| Dominio | brabissimo.bilinski.cloud |
| CI/CD | GitHub Actions → SCP dist/ → Docker nginx |
| Frontend | Vite + React 18.3 + TypeScript + Tailwind |
