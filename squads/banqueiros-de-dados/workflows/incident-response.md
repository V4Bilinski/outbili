# Workflow: Incident Response

## Visao Geral
Resposta a incidentes: Detect → Triage → Resolve → Postmortem

## Severidades

| Sev | Descricao | Response Time | Exemplos |
|-----|-----------|---------------|----------|
| SEV-1 | Servico indisponivel / data breach | < 5 min | DB down, auth broken, data leaked |
| SEV-2 | Degradacao significativa | < 30 min | Latencia 10x, error rate > 5% |
| SEV-3 | Issue parcial sem impacto critico | < 4h | Feature especifica broken, slow queries |
| SEV-4 | Baixo impacto, nao urgente | Next business day | Warning trends, optimization needed |

## Fases

### Phase 1: Detect (observability-engineer)
- Alertas automaticos ou report manual
- Verificar `get_logs` para timeline
- Classificar severidade
- **Output:** Incident ticket com severidade

### Phase 2: Triage (fortress-master)
- Avaliar impacto (usuarios afetados, dados em risco)
- Rotear para agente(s) correto(s)
- Comunicar stakeholders se SEV-1/SEV-2
- **Output:** Incident commander assigned, team mobilized

### Phase 3: Investigate (agente especialista)
- **DB issue:** db-architect analisa com `execute_sql` + EXPLAIN
- **Security issue:** security-sentinel analisa com Security Auditor
- **Infra issue:** cloud-infra-engineer verifica com `get_project`
- **Performance:** performance-tuner profila com `get_advisors`
- **Output:** Root cause identified

### Phase 4: Resolve (agente especialista)
- Aplicar fix (migration, config change, rollback)
- Se necessario: restore de backup (backup-recovery-specialist)
- Verificar que fix resolveu o problema
- **Output:** Incident resolved

### Phase 5: Verify (observability-engineer)
- Confirmar metricas voltaram ao normal
- Monitorar por 1h apos fix (SEV-1) ou 30min (SEV-2+)
- **Output:** Resolution confirmed

### Phase 6: Postmortem (fortress-master)
- Documentar timeline completa
- Root cause analysis (5 Whys)
- Action items para prevencao
- Atualizar runbooks e alertas
- **Output:** Postmortem document

## Template de Postmortem
```
# Incident Postmortem: [Titulo]

**Severidade:** SEV-X
**Duracao:** HH:MM (inicio → resolucao)
**Impacto:** X usuarios afetados, Y minutos de downtime

## Timeline
- HH:MM — Alerta detectado
- HH:MM — Triage iniciada
- HH:MM — Root cause identificada
- HH:MM — Fix aplicado
- HH:MM — Resolucao confirmada

## Root Cause
[Descricao detalhada]

## 5 Whys
1. Por que aconteceu? → ...
2. Por que isso nao foi detectado antes? → ...
3. Por que o alerta nao disparou? → ...
4. Por que nao tinhamos protecao? → ...
5. Por que o processo nao preveniu? → ...

## Action Items
- [ ] Fix permanente (owner, deadline)
- [ ] Adicionar alerta (owner, deadline)
- [ ] Atualizar runbook (owner, deadline)
- [ ] Prevencao futura (owner, deadline)
```
