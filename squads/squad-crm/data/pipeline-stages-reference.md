# Referência de Estágios do Pipeline — V4 Bilinski

## Pipeline 1: New Business (Novos Clientes)

### Estágios Atuais (já no Brabissimo)
```
reuniao_agendada → show → noshow_reagendar → proposta_enviada → contrato_na_rua → ganho → distribuido → perdido
```

### Estágios Recomendados (baseado em benchmarking)
```
LEAD QUALIFICADO (Score >= 60)
    ↓
REUNIÃO AGENDADA (prob: 10%, rotting: 3d)
    ├── SHOW (prob: 25%)
    │   ↓
    │   PROPOSTA ENVIADA (prob: 50%, rotting: 5d)
    │   ↓
    │   NEGOCIAÇÃO (prob: 60%, rotting: 7d)  [NOVO]
    │   ↓
    │   CONTRATO NA RUA (prob: 75%, rotting: 5d)
    │   ├── GANHO → DISTRIBUIÇÃO AUTOMÁTICA
    │   └── PERDIDO → WIN/LOSS ANALYSIS
    │
    └── NO-SHOW → REAGENDAR (rotting: 2d)
```

### Melhorias vs Atual
| Melhoria | Inspiração | Impacto |
|----------|-----------|---------|
| Probabilidade por estágio | Pipedrive | Forecasting weighted |
| Tempo de rotting por estágio | Pipedrive | Alerta de deals parados |
| Estágio NEGOCIAÇÃO | HubSpot | Granularidade no funil |
| Win/Loss analysis | Salesforce | Aprendizado contínuo |
| Distribuição automática | Monday.com | Deal-to-Squad bridge |

## Pipeline 2: Upsell/Expansão

```
OPORTUNIDADE IDENTIFICADA (prob: 20%)
    ↓
PROPOSTA DE EXPANSÃO (prob: 50%)
    ↓
EM NEGOCIAÇÃO (prob: 70%)
    ↓
FECHADO / NÃO FECHADO
```

## Pipeline 3: Renewal

```
RENEWAL EM 90 DIAS (automático)
    ↓
EM TRATATIVAS (prob: 80%)
    ↓
RENOVADO / CHURN
```

## Activity-Based Selling (Padrão Pipedrive)

Cada deal SEMPRE tem uma "próxima ação" visível:
| Estágio | Próxima Ação Padrão |
|---------|---------------------|
| Lead Qualificado | Agendar reunião |
| Reunião Agendada | Confirmar presença |
| Show | Enviar proposta |
| Proposta Enviada | Follow-up em 3d |
| Negociação | Resolver objeção |
| Contrato | Coletar assinatura |
