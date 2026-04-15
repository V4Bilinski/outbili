# Database Health Checklist

## Executar: Semanal | Agente: db-architect + performance-tuner

### Schema Integrity
- [ ] Todas tabelas tem primary key definida
- [ ] Foreign keys declaradas para todas relacoes
- [ ] Constraints NOT NULL em colunas obrigatorias
- [ ] COMMENT ON TABLE/COLUMN em tabelas principais
- [ ] Nenhuma tabela orfao (sem referencias nem uso)

### Index Health
- [ ] Zero indices duplicados
- [ ] Zero indices nao utilizados (idx_scan = 0, exceto PKs)
- [ ] Indices compostos seguem ordem de seletividade
- [ ] Partial indexes para filtros frequentes
- [ ] Index bloat < 30% (reindex se necessario)

### Query Performance
- [ ] Cache hit ratio > 99%
- [ ] Zero seq scans em tabelas > 10K rows (com filtro)
- [ ] Top 10 slow queries documentadas e otimizadas
- [ ] Zero N+1 queries detectadas em producao
- [ ] Statement timeout configurado (30s default)

### Data Integrity
- [ ] Zero dead tuples > 10% em qualquer tabela
- [ ] Autovacuum rodando normalmente
- [ ] Nenhuma transacao longa (> 5min) presa
- [ ] Disk usage < 80% do limite do plano
- [ ] Connection usage < 80% do maximo

### Migrations
- [ ] Todas migrations aplicadas com sucesso
- [ ] Nenhuma migration pendente
- [ ] Ultimo `generate_typescript_types` esta sincronizado
- [ ] Migration mais recente tem rollback testado
