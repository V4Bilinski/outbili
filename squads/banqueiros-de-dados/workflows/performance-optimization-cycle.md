# Workflow: Performance Optimization Cycle

## Visao Geral
Ciclo de otimizacao: Profile → Diagnose → Optimize → Validate

## Fases

### Phase 1: Profile (performance-tuner)
- Coletar metricas baseline (latencia, throughput, error rate)
- Identificar top 20 slow queries (`pg_stat_statements`)
- Verificar cache hit ratio
- Analisar connection usage
- Check `get_advisors` para recomendacoes Supabase
- **Output:** Performance baseline report

### Phase 2: Diagnose (performance-tuner + observability-engineer)
- EXPLAIN ANALYZE nas queries mais lentas
- Identificar missing indexes
- Detectar N+1 queries
- Verificar table bloat e dead tuples
- Correlacionar com logs (`get_logs`)
- **Output:** Diagnosis report com root causes

### Phase 3: Plan (performance-tuner + db-architect)
- Priorizar otimizacoes por impacto (Quick Wins primeiro)
- Planejar index additions/removals
- Planejar query rewrites
- Estimar melhoria esperada
- **Output:** Optimization plan

### Phase 4: Optimize (db-architect)
- Criar migrations para novos indices
- Rewrite queries problematicas
- Ajustar autovacuum se necessario
- Aplicar em Supabase branch primeiro
- **Output:** Optimizations applied

### Phase 5: Validate (performance-tuner)
- Re-profile com mesmas metricas
- Comparar antes/depois
- Verificar que nao houve regressao
- Load test se mudanca significativa
- **Output:** Validation report (improvement %)

### Phase 6: Monitor (observability-engineer)
- Atualizar alertas com novos thresholds
- Adicionar metricas das queries otimizadas ao dashboard
- Configurar trending alerts (degradacao gradual)
- **Output:** Monitoring updated

## Quick Wins (executar primeiro)
1. Adicionar indices missing (maior impacto, menor risco)
2. Fix N+1 queries (batch com IN clause)
3. Converter OFFSET pagination para cursor-based
4. Adicionar partial indexes para filtros frequentes
5. VACUUM ANALYZE em tabelas com alto dead tuple %

## Frequencia
- **Full cycle:** Mensal
- **Quick profiling:** Semanal
- **Load test:** Antes de cada release significativo
- **Index review:** A cada 50 migrations acumuladas
