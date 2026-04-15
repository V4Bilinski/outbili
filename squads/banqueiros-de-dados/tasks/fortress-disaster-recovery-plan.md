---
task: Disaster Recovery Plan
responsavel: "@backup-recovery-specialist"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - rpo_target: Recovery Point Objective (ex: 1h)
  - rto_target: Recovery Time Objective (ex: 4h)
  - critical_tables: Tabelas criticas (lista)
  - include_edge_functions: Incluir edge functions (bool)
Saida: |
  - dr_plan: Documento de DR completo
  - backup_schedule: Cronograma de backups
  - recovery_runbook: Runbook de recuperacao
  - test_calendar: Calendario de testes DR
Checklist:
  - "[ ] RPO/RTO definidos por tier"
  - "[ ] Cenarios de falha ranqueados"
  - "[ ] Estrategia de backup documentada"
  - "[ ] Procedimentos de recovery testados"
  - "[ ] Communication plan pronto"
  - "[ ] DR drill agendado"
---

# Task: fortress-disaster-recovery-plan

**Agent:** @backup-recovery-specialist (com @cloud-infra-engineer)
**Trigger:** `*disaster-recovery-plan`
**Objetivo:** Projetar plano de disaster recovery com RPO/RTO definidos

---

## Inputs

```yaml
elicit: true
fields:
  - rpo_target: "RPO alvo? (ex: 1h, 15min)"
  - rto_target: "RTO alvo? (ex: 4h, 1h)"
  - critical_tables: "Quais tabelas sao criticas?"
  - include_edge_functions: "Incluir edge functions no DR? (sim/nao)"
```

---

## Execucao

### FASE 1 — Risk Assessment

| Cenario | Probabilidade | Impacto | RPO Necessario | RTO Necessario |
|---------|-------------|---------|----------------|----------------|
| Database corruption | Baixa | Critico | 15min | 1h |
| Datacenter failure | Muito baixa | Critico | 1h | 4h |
| Accidental deletion | Media | Alto | Imediato | 30min |
| Ransomware | Baixa | Critico | 1h | 2h |
| Provider outage | Baixa | Alto | N/A | Provider SLA |

### FASE 2 — RPO/RTO por Tier

| Tier | Dados | RPO | RTO | Estrategia |
|------|-------|-----|-----|------------|
| Critical | [tabelas criticas] | 15min | 1h | PITR + snapshot |
| Important | [tabelas de negocio] | 1h | 4h | Daily backup + WAL |
| Standard | [tabelas auxiliares] | 24h | 8h | Daily backup |
| Disposable | [cache, temp] | N/A | N/A | Recreate |

### FASE 3 — Backup Strategy

| Tipo | Frequencia | Retencao | Destino | Verificacao |
|------|-----------|----------|---------|-------------|
| PITR (WAL) | Continuo | 7 dias | Supabase managed | Automatico |
| Snapshot | Diario (2am) | 30 dias | [storage] | Semanal |
| Logical dump | Semanal | 90 dias | [offsite] | Mensal |
| Edge functions | Por deploy | Versionado | GitHub | Por deploy |

### FASE 4 — Recovery Procedures

**Cenario: Accidental Deletion**
1. Identificar timestamp exato do DELETE
2. Supabase PITR: restaurar para timestamp - 1min
3. Extrair dados restaurados
4. Inserir dados na database de producao
5. Verificar integridade referencial
6. Confirmar com equipe

**Cenario: Database Corruption**
1. Parar todas as conexoes (maintenance mode)
2. Avaliar extensao da corrupcao
3. Restaurar ultimo snapshot valido
4. Aplicar WAL logs ate ponto seguro
5. Verificar integridade de todas as tabelas
6. Reconectar aplicacao
7. Monitorar por 1h

### FASE 5 — DR Drill Schedule

| Drill | Frequencia | Participantes | Duracao | Proximo |
|-------|-----------|---------------|---------|---------|
| Tabletop exercise | Trimestral | Team leads | 2h | [data] |
| Restore test | Mensal | DBA + DevOps | 1h | [data] |
| Full DR drill | Semestral | Todos | 4h | [data] |

---

## Outputs

- Plano de DR completo com cenarios e procedimentos
- Cronograma de backup por tier
- Recovery runbook step-by-step
- Calendario de DR drills
