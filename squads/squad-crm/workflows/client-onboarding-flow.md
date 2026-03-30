# Workflow: Client Onboarding Flow

## Descricao
Onboarding estruturado de 15 dias para novos clientes, do kickoff ate primeira entrega.

## Timeline

### D+0: Deal Fechado
- Deal-to-Delivery Bridge executa (automatico)
- Cliente criado, squad alocado, projeto criado

### D+1-3: Kickoff
```yaml
agent: project-delivery-manager
actions:
  - Agendar kickoff call com cliente + squad
  - Preparar agenda de kickoff
  - Coletar acessos (Google Ads, Meta, Analytics, etc)
  - Definir canais de comunicacao (WhatsApp grupo, email)
  - Registrar expectativas do cliente
```

### D+3-5: Briefing & Planejamento
```yaml
agent: production-ops-manager
actions:
  - Coletar briefing completo do cliente (marca, publico, objetivos)
  - Criar plano de acao para primeiro mes
  - Distribuir demandas iniciais para o squad
  - Configurar templates de demanda por tipo
```

### D+5-10: Primeira Producao
```yaml
agent: production-ops-manager
actions:
  - Squad executa demandas iniciais
  - Monitorar SLA de primeira entrega
  - Enviar para aprovacao do cliente
  - Ajustar baseado no feedback
```

### D+10-15: Setup Completo
```yaml
agent: cs-retention-strategist
actions:
  - Verificar que todos acessos foram configurados
  - Confirmar campanhas ativas (se trafego)
  - Agendar reuniao de alinhamento pos-setup
  - Calcular health score inicial
```

### D+30: First Month Review
```yaml
agent: cs-retention-strategist
actions:
  - Enviar NPS do primeiro mes
  - Gerar report de resultados iniciais
  - Agendar reuniao de review
  - Ajustar plano se necessario
```

## Checklist de Onboarding

- [ ] Contrato assinado e registrado
- [ ] Squad alocado
- [ ] Kickoff realizado
- [ ] Acessos coletados (Google, Meta, Analytics)
- [ ] Briefing completo
- [ ] Plano de primeiro mes aprovado
- [ ] Primeira demanda entregue
- [ ] Campanhas ativas (se trafego)
- [ ] Canais de comunicacao configurados
- [ ] NPS D+30 enviado

## Metricas

| Metrica | Meta |
|---------|------|
| Time to kickoff | < 3 dias |
| Time to first delivery | < 10 dias |
| Onboarding completion | < 15 dias |
| 1st month NPS | > 8.0 |
| Client satisfaction | > 85% |
