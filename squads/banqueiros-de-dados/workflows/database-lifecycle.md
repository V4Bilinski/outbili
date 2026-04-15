# Workflow: Database Lifecycle

## Visao Geral
Ciclo completo de vida do banco: Design → Implement → Optimize → Monitor

## Fases

### Phase 1: Design (db-architect)
- Analisar requisitos e modelar schema
- Definir tabelas, colunas, constraints, FKs
- Planejar indices iniciais
- Consultar security-sentinel para RLS requirements
- **Output:** Schema design document + DDL scripts

### Phase 2: Security Review (security-sentinel)
- Revisar RLS policies necessarias
- Classificar dados por sensibilidade
- Definir access control matrix
- **Output:** RLS policies + data classification

### Phase 3: Implement (db-architect + devops-pipeline-master)
- Criar migration files
- Testar em Supabase branch (`create_branch`)
- Aplicar migration (`apply_migration`)
- Gerar TypeScript types (`generate_typescript_types`)
- **Output:** Migration applied + types generated

### Phase 4: Optimize (performance-tuner)
- EXPLAIN ANALYZE nas queries principais
- Verificar index usage
- Tunar connection pool se necessario
- **Output:** Performance baseline report

### Phase 5: Monitor (observability-engineer)
- Setup alertas para novas tabelas
- Configurar log filters
- Adicionar metricas ao dashboard
- **Output:** Monitoring configured

### Phase 6: Validate (fortress-master)
- Verificar que todas fases completaram
- Cross-check: schema + RLS + performance + monitoring
- **Output:** Database lifecycle COMPLETE

## Fluxo

```
db-architect     security-sentinel    devops-pipeline     performance-tuner    observability
    |                  |                    |                    |                  |
 DESIGN ──────► RLS REVIEW ──────► IMPLEMENT ──────────► OPTIMIZE ──────► MONITOR
 (schema)       (policies)         (migration)           (EXPLAIN)         (alerts)
    |                                   |                    |                  |
    └───────────────────────────────────┴────────────────────┴──────────────────┘
                                fortress-master VALIDATE
```
