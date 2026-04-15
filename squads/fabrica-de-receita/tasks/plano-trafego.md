# Plano de Trafego

---
name: plano-trafego
description: Plano de trafego pago e organico com budget, canais, ROAS target e cronograma
agent: traffic-hunter
---

## Objetivo

Construir um plano de trafego completo e executavel que maximize a aquisicao do ICP dentro
do budget disponivel. O plano cobre trafego pago (Meta Ads, Google Ads, LinkedIn Ads) e
organico (SEO, conteudo, social media), com distribuicao de budget, ROAS target por canal
e cronograma de ativacao.

## Pre-requisitos

- ICP definido (demograficos, psicograficos, canais onde passa o tempo)
- Oferta principal e ticket medio (para calcular CAC maximo viavel)
- LTV estimado (para definir quanto pode-se gastar para adquirir um cliente)
- Budget mensal disponivel para midia paga
- Historico de campanhas anteriores (se existir — para benchmarking)
- Meta de novos clientes/mes do ciclo 90 dias

## Passos

### Step 1: Calcular o CAC Maximo Viavel

Antes de qualquer canal, definir o teto de CAC:

```
LTV = Ticket Medio x Tempo Medio de Retencao (meses)
CAC Maximo = LTV / 3 (regra LTV:CAC >= 3:1)

Ex: LTV = R$5.000/mes x 18 meses = R$90.000
    CAC Maximo = R$90.000 / 3 = R$30.000

Resultado: Posso gastar ate R$30.000 para adquirir 1 cliente
```

**Para negocios com ticket unico:**
```
CAC Maximo = Ticket Medio x Margem Bruta x 0.5
(nao gastar mais de 50% da margem para adquirir)
```

### Step 2: Definir a Distribuicao de Budget por Canal

**Regra de distribuicao para quem esta comecando:**
- 70% em canal de performance principal (Meta ou Google)
- 20% em canal de retargeting/remarketing
- 10% em canal experimental (LinkedIn, YouTube, etc.)

**Regra de distribuicao para operacao madura:**
- 40-50% no canal de maior ROAS historico
- 20-30% em canais de expansao validados
- 10-20% em testes de novos canais
- 10% em retargeting

**Template de distribuicao:**
| Canal | Budget/mes | % do Total | CPL Target | Leads/mes | CAC Target |
|-------|-----------|------------|------------|-----------|------------|
| Meta Ads | R$[X] | [%] | R$[X] | [N] | R$[X] |
| Google Ads | R$[X] | [%] | R$[X] | [N] | R$[X] |
| LinkedIn Ads | R$[X] | [%] | R$[X] | [N] | R$[X] |
| YouTube Ads | R$[X] | [%] | R$[X] | [N] | R$[X] |
| Retargeting | R$[X] | [%] | R$[X] | [N] | R$[X] |
| **TOTAL** | **R$[X]** | **100%** | | **[N]** | **R$[X]** |

### Step 3: Plano por Canal

**META ADS (Facebook + Instagram)**

Melhor para: B2C, B2B com ticket < R$20k, produtos visuais, consciencia de problema
ROAS benchmark: 3-6x (ecommerce), 4-8x (infoprodutos), 2-4x (servicos B2B)

Estrutura de campanha recomendada:
```
Campanha 1: PROSPECCAO (Conversao)
  ├── Adset 1: Publico semelhante (LAL 1-3% dos melhores clientes)
  ├── Adset 2: Interesses + demograficos do ICP
  └── Adset 3: Broad (deixar o algoritmo aprender)

Campanha 2: RETARGETING (Conversao)
  ├── Adset 1: Visitantes do site (ultimos 30 dias)
  ├── Adset 2: Engajados com conteudo (ultimos 60 dias)
  └── Adset 3: Lista de leads que nao converteram
```

Criativos minimos para comecar:
- [ ] 3 videos de 15-30s (hook forte nos primeiros 3 segundos)
- [ ] 3 imagens estaticas (problema x solucao)
- [ ] 1 video depoimento de cliente (prova social)
- [ ] 1 carrossel com beneficios numerados

**GOOGLE ADS**

Melhor para: B2B, servicos profissionais, busca ativa de solucao, ticket alto
ROAS benchmark: 4-10x (servicos), 3-6x (ecommerce)

Estrutura de campanha recomendada:
```
Campanha 1: SEARCH — Palavras de intencao de compra
  ├── Adgroup: [produto/servico] + [comprar/contratar/preco]
  ├── Adgroup: [problema que resolve] + [solucao/como]
  └── Adgroup: [marca] (protecao de marca)

Campanha 2: SEARCH — Palavras de pesquisa de solucao
  ├── Adgroup: [alternativa ao concorrente principal]
  └── Adgroup: [categoria da solucao] + [B2B/empresa/profissional]

Campanha 3: DISPLAY/REMARKETING
  └── Adgroup: Visitantes das ultimas 4 semanas
```

**LINKEDIN ADS**

Melhor para: B2B com ticket > R$30k, enterprise, decisores especificos
ROAS benchmark: 1.5-3x (mais caro mas leads mais qualificados)

Segmentacao recomendada:
- Cargo: [lista de cargos do ICP]
- Tamanho de empresa: [faixa de funcionarios]
- Setor: [setores priorizados]
- Habilidades: [palavras-chave relevantes]

Formato recomendado: Sponsored Content (feed) + Message Ads (InMail)

### Step 4: Plano de Trafego Organico

**SEO (Search Engine Optimization)**

Timeline: Resultados em 90-180 dias (nao e quick win)

Prioridades:
1. Optimizar 5 paginas existentes de maior potencial (quick SEO wins)
2. Criar 4 artigos por mes atacando keywords de intencao de compra
3. Construir 2 backlinks/mes de dominios relevantes

**Metas de SEO:**
| Metrica | Atual | Meta 90d | Meta 180d |
|---------|-------|----------|-----------|
| Posicao media Google | | Top 20 | Top 10 |
| Trafego organico/mes | | +30% | +80% |
| Leads organicos/mes | | +20% | +60% |

**SOCIAL MEDIA ORGANICO**

Estrategia por plataforma:
| Plataforma | Frequencia | Tipo de Conteudo | KPI |
|------------|------------|-----------------|-----|
| LinkedIn | 3x/semana | Casos, insights B2B, bastidores | Alcance + SQLs gerados |
| Instagram | 5x/semana | Educacional, bastidores, resultados | Engajamento + DMs |
| YouTube | 1x/semana | Conteudo de profundidade, tutoriais | Views + inscritos |

### Step 5: Cronograma de Ativacao

**Semana 1-2: Setup e Lancamento**
- [ ] Configurar pixel/GTM em todas as paginas
- [ ] Criar audiencias no Meta e Google
- [ ] Subir criativos iniciais (minimo 3 por canal)
- [ ] Definir landing pages por canal
- [ ] Configurar dashboard de metricas

**Semana 3-4: Aprendizado**
- [ ] Budget em fase de aprendizado (nao pausar campanhas)
- [ ] Monitorar CPL diariamente vs target
- [ ] Desligar adsets com CPL > 2x do target apos 7 dias

**Semana 5-8: Otimizacao**
- [ ] Dobrar budget nos adsets vencedores
- [ ] Criar versoes 2.0 dos melhores criativos
- [ ] Testar nova audiencia ou formato

**Semana 9-12: Escala**
- [ ] Escalar budget dos canais com ROAS confirmado
- [ ] Expandir para novo canal experimental
- [ ] Revisar e ajustar estrategia para Ciclo 2

### Step 6: Dashboard de Trafego

**KPIs semanais a monitorar:**
| KPI | Canal | Meta Semanal | Status |
|-----|-------|-------------|--------|
| Impressoes | Meta/Google | [N] | |
| Cliques | Meta/Google | [N] | |
| CPL | Todos | R$[X] max | |
| Leads gerados | Todos | [N] | |
| ROAS | Pago | [X]x min | |
| CAC | Todos | R$[X] max | |

## Output

- **Plano de trafego 90 dias** com canais, budget e ROAS targets
- **Estrutura de campanhas** para cada canal ativado
- **Briefing de criativos** (formatos, copies, CTAs necessarios)
- **Dashboard template** para monitoramento semanal
- **Cronograma de ativacao** semana a semana

## Validacao

- [ ] O CAC maximo foi calculado com base no LTV real?
- [ ] O budget esta adequado para atingir as metas de leads do ciclo?
- [ ] A distribuicao de budget esta alinhada com o nivel de maturidade das campanhas?
- [ ] Os criativos necessarios foram briefados para producao?
- [ ] O dashboard de metricas esta configurado antes do lancamento?
