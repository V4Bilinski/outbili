# Workflow: Sales Lifecycle

## Descricao
Ciclo completo de vendas desde lead qualificado ate distribuicao para squad.

## Stages

### Stage 1: Lead Qualification (@pre-sales-specialist)
```yaml
input: Novo lead (WhatsApp, indicacao, inbound)
actions:
  - Calcular lead score (fit + engagement)
  - Classificar: HOT / WARM / COOL / COLD
  - Se HOT: auto-agendar reuniao
  - Se WARM: iniciar cadencia de nurturing
  - Se COOL/COLD: adicionar a sequencia de longo prazo
output: Lead qualificado com score >= 60
next: Stage 2
```

### Stage 2: Meeting Scheduled (@sales-pipeline-architect)
```yaml
input: Lead qualificado
actions:
  - Criar oportunidade no pipeline (stage: reuniao_agendada)
  - Enviar confirmacao + reminder automatico
  - Preparar briefing do lead (historico, segmento, potencial)
  - Definir proxima acao: confirmar presenca 1d antes
output: Reuniao confirmada
next: Stage 3a ou 3b
```

### Stage 3a: Show (@sales-pipeline-architect)
```yaml
input: Lead compareceu na reuniao
actions:
  - Registrar notas da reuniao
  - Mover para stage: show (prob: 25%)
  - Registrar necessidades identificadas
  - Definir proxima acao: enviar proposta em Xd
output: Lead com necessidades mapeadas
next: Stage 4
```

### Stage 3b: No-Show (@sales-pipeline-architect)
```yaml
input: Lead nao compareceu
actions:
  - Mover para stage: noshow_reagendar
  - Iniciar cadencia de reagendamento (3 tentativas)
  - Se reagendado: voltar para Stage 2
  - Se 3 tentativas sem resposta: mover para perdido
output: Reagendado ou perdido
```

### Stage 4: Proposal (@sales-pipeline-architect)
```yaml
input: Reuniao realizada com interesse
actions:
  - Gerar proposta com template padrao
  - Enviar proposta (email + WhatsApp)
  - Mover para stage: proposta_enviada (prob: 50%)
  - Definir rotting: 5 dias sem resposta = alerta
  - Definir proxima acao: follow-up em 3d
output: Proposta enviada
next: Stage 5
```

### Stage 5: Negotiation (@sales-pipeline-architect)
```yaml
input: Proposta em negociacao
actions:
  - Registrar objecoes e contra-propostas
  - Mover para stage: negociacao (prob: 60%)
  - Sugerir playbook por tipo de objecao
  - Definir rotting: 7 dias sem atividade
output: Acordo ou desistencia
next: Stage 6a ou 6b
```

### Stage 6a: Won (@sales-pipeline-architect + @production-ops-manager)
```yaml
input: Cliente aceitou proposta
actions:
  - Mover para stage: ganho (prob: 100%)
  - Registrar valor do contrato e data de assinatura
  - TRIGGER: Deal-to-Squad Bridge
    - Criar projeto de onboarding
    - Atribuir squad automaticamente
    - Notificar coordenador
    - Criar checklist de onboarding
  - Mover para stage: distribuido
  - Atualizar MRR do cliente
output: Cliente ativo + projeto criado + squad alocado
```

### Stage 6b: Lost (@sales-pipeline-architect)
```yaml
input: Cliente desistiu
actions:
  - Mover para stage: perdido
  - Registrar motivo da perda (loss_category)
  - Registrar loss_notes detalhados
  - Criar task de win/loss analysis
  - Adicionar a cadencia de reativacao (6 meses)
output: Deal fechado com analysis registrada
```

## Metricas do Workflow

| Metrica | Calculo | Meta |
|---------|---------|------|
| Pipeline Velocity | (Deals * Win% * ACV) / Days | Crescente |
| Stage Conversion | % que avanca por stage | Crescente |
| Rotting Rate | Deals parados / Total | < 15% |
| Avg Cycle Time | Dias lead -> won | < 30d |
| Show Rate | Shows / Agendados | > 70% |
| Proposal Win Rate | Won / Propostas | > 40% |
