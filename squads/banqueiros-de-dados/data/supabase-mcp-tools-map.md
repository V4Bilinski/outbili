# Supabase MCP Tools Map — Routing por Agente

## Mapeamento Completo: 29 Tools → 9 Agentes

### db-architect (Schema) — 6 tools
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `execute_sql` | Executar SQL direto | Schema DDL, queries ad-hoc, EXPLAIN ANALYZE |
| `list_tables` | Listar tabelas do banco | Auditoria de schema, discovery |
| `list_extensions` | Listar extensoes PostgreSQL | Verificar pgcrypto, uuid-ossp, etc. |
| `apply_migration` | Aplicar migracao SQL | Deploy de schema changes |
| `list_migrations` | Listar migracoes aplicadas | Verificar estado atual, rollback planning |
| `generate_typescript_types` | Gerar tipos TS do schema | Sync types apos schema change |

### devops-pipeline-master (Forge) — 9 tools
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `create_branch` | Criar branch do banco | Preview environment para PR |
| `list_branches` | Listar branches | Verificar branches ativos |
| `merge_branch` | Merge de branch | Aplicar changes em production |
| `rebase_branch` | Rebase de branch | Sync branch com production |
| `reset_branch` | Resetar branch | Limpar branch para recomeco |
| `delete_branch` | Deletar branch | Cleanup apos merge |
| `deploy_edge_function` | Deploy Edge Function | Publicar serverless function |
| `get_edge_function` | Detalhes Edge Function | Inspecionar function existente |
| `list_edge_functions` | Listar Edge Functions | Inventario de functions |

### cloud-infra-engineer (Nimbus) — 6 tools
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `create_project` | Criar novo projeto | Provisioning de ambiente |
| `get_project` | Info do projeto | Verificar configuracao |
| `get_project_url` | URL do projeto | Obter endpoint |
| `list_projects` | Listar projetos | Inventario de infra |
| `pause_project` | Pausar projeto | Cost saving em ambientes inativos |
| `restore_project` | Restaurar projeto pausado | Reativar ambiente |

### observability-engineer (Radar) — 1 tool
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `get_logs` | Ver logs do projeto | Diagnostico, monitoring, incident response |

### performance-tuner (Turbo) — 1 tool
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `get_advisors` | Recomendacoes de performance | Otimizacao proativa |

### security-sentinel (Aegis) — 1 tool
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `get_publishable_keys` | Chaves publicas (anon, URL) | Auditoria de key exposure |

### compliance-auditor (Codex) — 2 tools
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `get_cost` | Ver custos do projeto | Budget tracking, cost optimization |
| `confirm_cost` | Confirmar operacao com custo | Aprovar operacoes com billing |

### fortress-master (Bastion) — 3 tools
| Tool | Funcao | Quando Usar |
|------|--------|-------------|
| `list_organizations` | Listar organizacoes | Visao geral de orgs |
| `get_organization` | Info da organizacao | Detalhes de org especifica |
| `search_docs` | Buscar na documentacao | Research de features e APIs |

## Resumo de Distribuicao

| Agente | Tools | % do Total |
|--------|-------|-----------|
| devops-pipeline-master | 9 | 31% |
| db-architect | 6 | 21% |
| cloud-infra-engineer | 6 | 21% |
| fortress-master | 3 | 10% |
| compliance-auditor | 2 | 7% |
| observability-engineer | 1 | 3% |
| performance-tuner | 1 | 3% |
| security-sentinel | 1 | 3% |
| backup-recovery-specialist | 0 | 0% (usa SQL via db-architect) |
| **TOTAL** | **29** | **100%** |
