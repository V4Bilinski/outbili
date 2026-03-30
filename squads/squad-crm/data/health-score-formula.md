# Fórmula de Health Score — V4 Bilinski

## Conceito
Health Score composto que combina múltiplos fatores para gerar um score 0-100.
Inspirado em HubSpot (fatores positivos/negativos com pesos) e Salesforce (ML-powered).

## Fórmula

```
Health Score = Base(50) + Soma(Fatores Positivos) − Soma(Fatores Negativos)
Limitado entre 0 e 100
```

## Fatores Positivos (adicionam ao score)

| Fator | Peso | Condição | Fonte |
|-------|------|----------|-------|
| NPS Promotor (9-10) | +20 | Última pesquisa | surveys |
| NPS Passivo (7-8) | +10 | Última pesquisa | surveys |
| Demandas no prazo (>80%) | +15 | Últimos 30d | production_demands |
| Upsell realizado | +15 | Últimos 90d | upsell_tickets |
| Reunião recente | +10 | Últimos 30d | meetings |
| Pagamento em dia | +10 | Status atual | client financials |
| Engajamento alto | +5 | Mensagens respondidas | messages |

**Máximo positivo possível: +85 (total máx: 135, limitado a 100)**

## Fatores Negativos (subtraem do score)

| Fator | Peso | Condição | Fonte |
|-------|------|----------|-------|
| Ticket CS aberto | -20 | Qualquer aberto | cs_tickets |
| NPS Detrator (0-6) | -20 | Última pesquisa | surveys |
| Sem reunião | -15 | > 30 dias | meetings |
| Demandas atrasadas | -15 | Qualquer atrasada | production_demands |
| Pagamento atrasado | -10 | > 15 dias | client financials |
| Em aviso prévio | -25 | Status atual | clients.status |
| Sem atividade | -10 | > 15 dias sem interação | audit_logs |

**Máximo negativo possível: -115 (total mín: -65, limitado a 0)**

## Classificação

| Score | Flag | Cor | Ação Recomendada |
|-------|------|-----|------------------|
| 80-100 | Saudável | 🟢 Verde | Buscar expansão, QBR proativo |
| 60-79 | Atenção | 🟡 Amarelo | Monitorar, agendar touchpoint |
| 40-59 | Risco | 🟠 Laranja | Ativar playbook de retenção, escalar CSM |
| 0-39 | Crítico | 🔴 Vermelho | Intervenção imediata, reunião urgente |

## Triggers Automáticos

| Condição | Automação |
|----------|----------|
| Score cai para Amarelo | Notificar CSM |
| Score cai para Laranja | Criar ticket CS + notificar coordenador |
| Score cai para Vermelho | Alerta executivo + reunião urgente |
| Score sobe para Verde | Marcar como oportunidade de expansão |

## Recálculo
- **Frequência:** Diário (batch job noturno)
- **On-demand:** Quando evento relevante ocorre (ticket, pagamento, reunião)
- **Histórico:** Manter snapshots semanais para análise de tendência

## Comparação com Mercado

| Plataforma | Abordagem | Diferencial do Brabissimo |
|-----------|---------|----------------------|
| HubSpot | Fatores customizáveis, visual board | Inclui PRODUÇÃO como fator |
| Salesforce | Predição baseada em ML | Dados integrados cross-área |
| Brabissimo | Fórmula configurável + produção | Único que considera qualidade de entregas |
