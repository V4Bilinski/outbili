# Definições de KPIs — V4 Bilinski CRM

## Tier 1: Executivo (CEO / Dono)

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **MRR** | Soma(valor_contrato) de clientes ativos | clients | Crescente | < meta mensal |
| **ARR** | MRR × 12 | clients | Crescente | N/A |
| **NRR** | (MRR_início + expansão − downsell − churn) / MRR_início × 100 | revenue_history | > 110% | < 100% |
| **Taxa de Churn** | Clientes perdidos / Total × 100 | cs_tickets | < 3% | > 5% |
| **Valor do Pipeline** | Soma(valor_deal × probabilidade) | sales_opportunities | > 3× MRR | < 2× MRR |
| **Saúde dos Clientes** | % de clientes verdes | health_scores | > 70% | < 50% |
| **Receita por Funcionário** | MRR / headcount | clients + profiles | Crescente | Declinante |

## Tier 2: Gestão (Coordenador)

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **Taxa de Conversão** | Deals ganhos / Total × 100 | sales_opportunities | > 25% | < 15% |
| **Tamanho Médio de Deal** | Receita total / Deals ganhos | sales_opportunities | Crescente | Declinante |
| **Ciclo de Venda** | Média de dias Lead → Won | sales_opportunities | < 30d | > 45d |
| **Demandas no Prazo** | No prazo / Total × 100 | production_demands | > 85% | < 70% |
| **Score CSAT** | Média de satisfação por entrega | surveys | > 8,5 | < 7,0 |
| **Utilização da Equipe** | Horas produtivas / Horas disponíveis | time_entries | 75-85% | < 65% ou > 95% |
| **Variação de Orçamento** | (Realizado − Orçado) / Orçado × 100 | projects | < 10% | > 20% |

## Tier 3: Individual (Colaborador)

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **Tasks Concluídas** | Tasks finalizadas na semana | tasks | >= meta | < 50% meta |
| **Horas Registradas** | Horas registradas/dia | time_entries | >= 6h | < 4h |
| **Qualidade de Demandas** | Aprovações / Total de demandas | production_approvals | > 85% | < 70% |
| **Progresso de Meta** | % do OKR concluído | goals | On track | < 50% no meio |
| **Tempo de Resposta** | Tempo médio de resposta | messages | < 4h | > 24h |

## Tier 4: Específico de Vendas

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **Leads Qualificados** | Leads com score >= 60 | sales_leads | Crescente | Declinante |
| **Taxa de Show** | Shows / Reuniões agendadas × 100 | sales_opportunities | > 70% | < 50% |
| **Taxa de Aceitação de Proposta** | Propostas aceitas / Enviadas | sales_opportunities | > 40% | < 20% |
| **Pipeline Velocity** | (Deals × Win Rate × ACV) / Dias de Ciclo | sales_opportunities | Crescente | Declinante |
| **Deals em Rotting** | Deals sem atividade > 7d / Total | sales_opportunities | < 15% | > 25% |
| **CAC** | Custo total de aquisição / Novos clientes | financial + clients | Declinante | Crescente |
| **LTV** | MRR médio × Meses de permanência média | clients + revenue | Crescente | Declinante |
| **LTV:CAC** | LTV / CAC | calculado | > 3:1 | < 2:1 |

## Tier 5: Específico de CS

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **NPS** | % Promotores − % Detratores | surveys | > 50 | < 30 |
| **Tickets Abertos** | Contagem de tickets com status=aberto | cs_tickets | Declinante | Crescente |
| **Tempo de Resolução** | Média de dias abertura → resolução | cs_tickets | < 7d | > 15d |
| **Taxa de Recuperação** | Valor recuperado / Valor em risco | cs_tickets | > 60% | < 30% |
| **Taxa de Renovação** | Renovações / Total de vencimentos | clients | > 90% | < 80% |

## Tier 6: Financeiro

| KPI | Fórmula | Fonte | Meta | Alerta |
|-----|---------|-------|------|--------|
| **ROI por Cliente** | (Receita − Custo) / Custo × 100 | calculado | > 100% | < 50% |
| **Margem por Cliente** | Receita − Custo operacional | calculado | Positiva | Negativa |
| **Custo por Demanda** | Horas × Custo/hora | time_entries + demands | Declinante | Crescente |
| **Inadimplência** | Clientes atrasados / Total × 100 | clients | < 5% | > 10% |
| **Fluxo de Caixa** | Entradas − Saídas no período | financial | Positivo | Negativo |
