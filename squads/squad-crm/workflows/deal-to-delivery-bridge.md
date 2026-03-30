# Workflow: Deal-to-Delivery Bridge

## Descricao
Automatiza a transicao de deal fechado para distribuicao e inicio de producao.
Inspirado em Monday.com (deal-to-project) e Ekyte (auto-assignment por tipo).

## Trigger
Deal move para stage `ganho` no pipeline de vendas.

## Steps

### Step 1: Create Client Record
```yaml
agent: crm-master
actions:
  - Criar registro de cliente (se novo) ou atualizar (se existente)
  - Preencher: nome, contato, segmento, valor contrato, servicos contratados
  - Definir health_flag: green (novo cliente)
  - Atribuir account_manager
output: client_id criado/atualizado
```

### Step 2: Create Onboarding Project
```yaml
agent: project-delivery-manager
actions:
  - Criar projeto de onboarding a partir do template
  - Definir timeline: 15 dias para onboarding completo
  - Criar milestones:
    - Kickoff call (D+3)
    - Briefing completo (D+5)
    - Primeiro material entregue (D+10)
    - Review de primeiro mes (D+30)
  - Associar ao client_id
output: project_id criado
```

### Step 3: Assign Squad
```yaml
agent: production-ops-manager
actions:
  - Verificar capacidade dos squads disponiveis
  - Selecionar squad com melhor fit:
    - Segmento do cliente
    - Capacidade disponivel
    - Expertise do squad
  - Atribuir squad ao cliente
  - Notificar lider do squad
  - Criar tasks iniciais de onboarding para cada membro
output: Squad alocado, tasks criadas
```

### Step 4: Create Initial Demands
```yaml
agent: production-ops-manager
actions:
  - Criar demandas iniciais baseado nos servicos contratados:
    - Se inclui Design: criar demanda "Setup criativos iniciais"
    - Se inclui Trafego: criar demanda "Setup campanhas"
    - Se inclui Copy: criar demanda "Briefing de comunicacao"
  - Aplicar templates de demanda por tipo
  - Auto-assign para profissionais do squad
output: Demandas iniciais criadas e atribuidas
```

### Step 5: Setup CS Monitoring
```yaml
agent: cs-retention-strategist
actions:
  - Calcular health score inicial (base: 70, novo cliente)
  - Agendar NPS: D+30 (primeiro mes)
  - Agendar QBR: D+90 (primeiro quarter)
  - Definir CSM responsavel
  - Criar alerta de monitoramento
output: Monitoramento CS ativo
```

### Step 6: Financial Setup
```yaml
agent: revenue-ops-analyst
actions:
  - Registrar MRR do novo contrato
  - Calcular ROI previsto (receita vs custo estimado do squad)
  - Criar alerta de primeiro pagamento
  - Atualizar forecast
output: Financeiro configurado
```

### Step 7: Notify & Update
```yaml
agent: crm-master
actions:
  - Mover deal para stage: distribuido
  - Notificar: coordenador, squad, CSM, financeiro
  - Atualizar Command Center
  - Log no audit trail
output: Bridge completa
```

## Tempo Total Esperado
- Steps 1-7: < 5 minutos (automatico)
- Onboarding completo: 15 dias
- Primeiro deliverable: 10 dias

## Metricas
| Metrica | Meta |
|---------|------|
| Time to onboard | < 15d |
| First delivery | < 10d |
| Client satisfaction (1st month) | > 8.0 |
| Squad utilization pos-bridge | 75-85% |
