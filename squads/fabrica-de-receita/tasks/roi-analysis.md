# ROI Analysis

---
name: roi-analysis
description: Analise de ROI completa com attribution, forecast e dashboard executivo
agent: roi-analyst
---

## Objetivo

Realizar uma analise completa de retorno sobre investimento (ROI) das iniciativas de growth,
com modelo de atribuicao correto, forecast de receita para 90 dias e um dashboard executivo
para acompanhamento. O objetivo e transformar dados em decisoes de alocacao de budget.

## Pre-requisitos

- Dados de vendas dos ultimos 90 dias (receita, novos clientes, ticket medio)
- Dados de marketing (investimento por canal, leads gerados por canal)
- Dados de retencao (churn, LTV, NPS)
- Acesso a ferramentas de analytics (Google Analytics, CRM, plataformas de anuncio)
- Budget atual por canal e total de growth

## Passos

### Step 1: Mapeamento de Todos os Investimentos

**Investimentos diretos (midia paga):**
| Canal | Investimento/mes | Leads | Clientes | CAC | Receita Gerada |
|-------|-----------------|-------|----------|-----|----------------|
| Meta Ads | R$[X] | [N] | [N] | R$[X] | R$[X] |
| Google Ads | R$[X] | [N] | [N] | R$[X] | R$[X] |
| LinkedIn Ads | R$[X] | [N] | [N] | R$[X] | R$[X] |
| Outros | R$[X] | [N] | [N] | R$[X] | R$[X] |

**Investimentos indiretos (time e ferramentas):**
| Categoria | Investimento/mes |
|-----------|-----------------|
| Time de marketing (proporcional) | R$[X] |
| Time de vendas (proporcional) | R$[X] |
| Ferramentas (CRM, email, analytics) | R$[X] |
| Agencia/consultoria | R$[X] |
| Conteudo e criativo | R$[X] |
| **Total investimento indireto** | **R$[X]** |

**Investimento total de growth:**
```
Total direto: R$[X]
Total indireto: R$[X]
TOTAL GROWTH: R$[X]/mes
```

### Step 2: Modelo de Atribuicao

**Problema da atribuicao:** Um cliente geralmente tem multiplos touchpoints antes de comprar.
Escolher o modelo certo evita decisoes erradas de budget.

**Modelos de atribuicao:**
| Modelo | Como funciona | Quando usar |
|--------|--------------|-------------|
| Last Touch | 100% do credito ao ultimo canal | Ciclo de venda curto (< 7 dias) |
| First Touch | 100% do credito ao primeiro canal | Quem atrai novos leads |
| Linear | Credito igual para todos os canais | Ciclo medio (7-30 dias) |
| Time Decay | Mais credito para os canais recentes | Ciclo longo (> 30 dias) |
| Data-Driven | ML distribui com base em dados reais | Volumes altos (> 500 conversoes/mes) |

**Recomendacao para maioria dos casos:** Linear (simples e justo).

**Mapeamento de touchpoints dos ultimos 10 clientes:**
Para cada cliente fechado no periodo, listar todos os canais que tocaram antes do fechamento:
```
Cliente 1: Google Ads → Email Nurture → Reuniao → Proposta → Fechado
Cliente 2: LinkedIn → Webinar → Email → Reuniao → Fechado
...
```

Identificar: qual e o canal que aparece mais no inicio da jornada? E no final?

### Step 3: Calcular ROI por Canal

**Formula de ROI:**
```
ROI = (Receita Atribuida - Investimento) / Investimento x 100%

ROAS = Receita Atribuida / Investimento (vezes)
```

**Tabela de ROI por canal:**
| Canal | Investimento | Receita Atribuida | ROI% | ROAS |
|-------|-------------|-------------------|------|------|
| Meta Ads | R$[X] | R$[X] | [%] | [X]x |
| Google Ads | R$[X] | R$[X] | [%] | [X]x |
| Organico/SEO | R$[X] | R$[X] | [%] | [X]x |
| Email/Nurture | R$[X] | R$[X] | [%] | [X]x |
| Indicacoes | R$[X] | R$[X] | [%] | [X]x |
| **TOTAL** | **R$[X]** | **R$[X]** | **[%]** | **[X]x** |

**Benchmarks de ROAS por tipo de negocio:**
- Ecommerce: ROAS > 4x = bom, > 8x = excelente
- SaaS/Recorrencia: ROAS > 3x = bom, > 6x = excelente
- Servicos B2B: ROAS > 2.5x = bom, > 5x = excelente

### Step 4: Analise de Unit Economics

**Metricas de unit economics:**

```
CAC MEDIO = Total investido em growth / Novos clientes no periodo
LTV MEDIO = Ticket medio mensal x Tempo medio de retencao
LTV:CAC = LTV / CAC (ideal: >= 3:1)
Payback Period = CAC / (Ticket medio x Margem bruta) (meses)
```

**Analise de cohort (por mes de entrada):**
| Cohort | Clientes | MRR inicial | MRR M+3 | MRR M+6 | Churn | LTV estimado |
|--------|----------|-------------|---------|---------|-------|-------------|
| Jan | [N] | R$[X] | R$[X] | R$[X] | [%] | R$[X] |
| Fev | [N] | R$[X] | R$[X] | R$[X] | [%] | R$[X] |
| Mar | [N] | R$[X] | R$[X] | R$[X] | [%] | R$[X] |

**Insight chave da cohort:** Identificar qual mes teve o melhor LTV e por que.

### Step 5: Forecast de Receita 90 Dias

**Metodologia de forecast:**
Usar o modelo de forecast baseado em pipeline:

```
RECEITA PREVISTA (90 dias) =
  MRR Atual x (1 - Churn Rate)^3
  + Novos Clientes Esperados x Ticket Medio
  + Expansao Esperada da Base Atual

ONDE:
  Novos Clientes = Leads no Pipeline x Taxa de Conversao Historica
  Expansao = % da base com health score verde x Taxa de Upsell historica
```

**Cenarios de forecast:**
| Cenario | Premissa | Receita M+1 | Receita M+2 | Receita M+3 |
|---------|----------|-------------|-------------|-------------|
| Conservador | CVR -20% vs historico | R$[X] | R$[X] | R$[X] |
| Base | CVR no historico atual | R$[X] | R$[X] | R$[X] |
| Otimista | CVR +20% com melhorias | R$[X] | R$[X] | R$[X] |

### Step 6: Recomendacoes de Alocacao de Budget

Com base na analise, recomendar a redistribuicao de budget:

**Matriz de decisao por canal:**
| Canal | ROAS Atual | Volume Potencial | Recomendacao | Nova Alocacao |
|-------|-----------|-----------------|--------------|---------------|
| Canal A | [X]x | Alto | Escalar (+50%) | R$[X] |
| Canal B | [X]x | Medio | Manter | R$[X] |
| Canal C | [X]x | Baixo | Reduzir (-30%) | R$[X] |
| Canal D | - | Alto | Testar | R$[X] |

**Regra de decisao:**
- ROAS > benchmark + volume escalavel = Escalar (+30-100% budget)
- ROAS proximo ao benchmark = Manter e otimizar
- ROAS < benchmark = Reduzir, otimizar ou pausar
- Canal novo com potencial = Alocar 10% para teste estruturado

### Step 7: Dashboard Executivo

**KPIs para review semanal (simples, 1 tela):**
```
RECEITA
├── MRR Atual: R$[X] (+/-X% vs mes anterior)
├── Novos Clientes: [N] (meta: [N])
└── Churn: [N] clientes (R$[X] MRR perdido)

AQUISICAO
├── Leads gerados: [N] (meta: [N])
├── CAC Medio: R$[X] (limite: R$[X])
└── Pipeline Qualificado: R$[X] (meta: R$[X])

RETENCAO
├── NPS: [pts] (meta: [pts])
├── Churn Rate: [%] (limite: [%])
└── LTV:CAC: [X]x (meta: [X]x)

CRESCIMENTO
└── MRR Growth MoM: [%] (meta: [%])
```

## Output

- **Analise de ROI completa** por canal com modelo de atribuicao definido
- **Unit economics** calculadas (CAC, LTV, LTV:CAC, Payback)
- **Analise de cohort** dos ultimos 3 meses
- **Forecast de receita 90 dias** em 3 cenarios
- **Recomendacao de alocacao de budget** por canal
- **Dashboard executivo** configurado para revisao semanal

## Validacao

- [ ] O modelo de atribuicao foi escolhido e documentado?
- [ ] O ROI de cada canal e calculado com investimento total (direto + indireto)?
- [ ] O LTV:CAC e >= 3:1? Se nao, o problema esta no CAC ou no LTV?
- [ ] O forecast considera os 3 cenarios (conservador, base, otimista)?
- [ ] O dashboard e simples o suficiente para o C-level revisar em 5 minutos?
