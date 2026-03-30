# Workflow: CS Retention Cycle

## Descricao
Ciclo continuo de monitoramento e retencao de clientes baseado em health score.
Inspirado em HubSpot CS Workspace e Salesforce Customer Success Score.

## Trigger
Execucao diaria (batch) + eventos on-demand (ticket, pagamento, reuniao).

## Cycle

### Phase 1: Health Score Calculation (Daily)
```yaml
agent: cs-retention-strategist
actions:
  - Recalcular health score de todos os clientes ativos
  - Comparar com score anterior
  - Identificar mudancas significativas (> 10 pontos)
  - Atualizar health_flag (green/yellow/orange/red)
output: Scores atualizados para todos os clientes
```

### Phase 2: Alert Generation
```yaml
agent: automation-engineer
triggers:
  - Score caiu para Yellow: notificar CSM
  - Score caiu para Orange: criar ticket CS + notificar coordenador
  - Score caiu para Red: alerta executivo + agendar meeting urgente
  - Score subiu para Green: marcar como expansion opportunity
actions:
  - Gerar notificacoes por role
  - Criar tickets automaticos
  - Agendar meetings se necessario
output: Alertas disparados
```

### Phase 3: CSM Response
```yaml
agent: cs-retention-strategist
actions:
  - CSM revisa clientes em risco (Yellow + Orange + Red)
  - Para Yellow: agendar touchpoint proativo
  - Para Orange: ativar playbook de retencao
  - Para Red: intervencao imediata
  - Registrar acoes tomadas no timeline do cliente
output: Acoes de retencao iniciadas
```

### Phase 4: Playbook Execution
```yaml
agent: cs-retention-strategist
playbooks:
  price_concern:
    - Agendar reuniao de valor
    - Apresentar ROI do servico
    - Oferecer ajuste de escopo se necessario
  quality_concern:
    - Revisar demandas recentes
    - Agendar alinhamento com squad
    - Criar plano de melhoria de 30 dias
  fit_concern:
    - Avaliar se servicos atendem necessidades
    - Propor ajuste de portfolio
    - Considerar downsell proativo vs churn
  unresponsive:
    - Cadencia de reengajamento (3 touchpoints em 15 dias)
    - Escalar para coordenador se sem resposta
output: Playbook executado com resultado registrado
```

### Phase 5: NPS Survey (Milestones)
```yaml
agent: cs-retention-strategist
milestones:
  - D+30: Primeiro mes (satisfacao inicial)
  - D+90: Primeiro quarter (QBR)
  - D+180: Seis meses (retencao)
  - D+330: Pre-renewal (30d antes da renovacao)
actions:
  - Enviar pesquisa NPS
  - Registrar resultado
  - Atualizar health score com fator NPS
  - Se NPS <= 6: criar ticket CS automatico
output: NPS registrado e acoes disparadas
```

### Phase 6: Renewal Tracking
```yaml
agent: cs-retention-strategist + revenue-ops-analyst
timeline:
  - 90d antes: alertar CSM, iniciar preparacao
  - 60d antes: agendar QBR de renovacao
  - 30d antes: preparar proposta de renovacao
  - 15d antes: follow-up final
actions:
  - Gerar relatorio de valor entregue no periodo
  - Calcular ROI para o cliente
  - Preparar proposta de renovacao (mesmo valor ou expansion)
  - Se expansion: gerar proposta de upsell
output: Renovacao realizada ou churn documentado
```

### Phase 7: Monthly Review
```yaml
agent: data-intelligence-analyst
actions:
  - Gerar relatorio mensal de CS:
    - NRR do mes
    - Clientes por health flag
    - Tickets abertos/resolvidos
    - Churn e motivos
    - Expansion realizada
  - Comparar com mes anterior e meta
  - Identificar tendencias
output: CS Monthly Report
```

## Metricas do Workflow

| Metrica | Meta | Alerta |
|---------|------|--------|
| NRR | > 110% | < 100% |
| Churn Rate | < 3% | > 5% |
| NPS | > 50 | < 30 |
| Avg Health Score | > 75 | < 60 |
| Response Time (tickets) | < 24h | > 48h |
| Renewal Rate | > 90% | < 80% |
| Recovery Rate | > 60% | < 30% |
