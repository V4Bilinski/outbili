# Thamyres Digital Spy

Skill de espionagem digital e prospeccao outbound. Integrada com Apify MCP para coleta automatizada de dados.

## Trigger

Esta skill deve ser usada quando o usuario quiser:
- Espionar uma empresa digitalmente
- Mapear presenca digital de um alvo
- Detectar se empresa roda anuncios (Meta, Google, TikTok)
- Analisar SEO/SEM via SEMrush
- Prospectar leads outbound
- Encontrar decision-makers
- Estimar faturamento/custos de uma empresa
- Auditar presenca digital
- Coletar dados de Google Business, Instagram, LinkedIn
- Validar contatos WhatsApp

## MCP Arsenal (Apify)

Ferramentas disponiveis via Apify MCP:

| Ferramenta | Tool ID | Uso |
|-----------|---------|-----|
| Web Scraper | `mcp__apify__apify-slash-web-scraper` | Crawl e extração de sites |
| Google Search | `mcp__apify__apify-slash-google-search-scraper` | Busca Google programática |
| RAG Browser | `mcp__apify__apify-slash-rag-web-browser` | Extração profunda de conteúdo |
| Instagram | `mcp__apify__apify-slash-instagram-profile-scraper` | Perfis e métricas Instagram |
| LinkedIn | `mcp__apify__harvestapi-slash-linkedin-profile-scraper` | Dados LinkedIn empresa/pessoas |
| Google Business | `mcp__apify__cheapget-slash-google-business-profile` | Reviews, rating, GMB data |
| Google Trends | `mcp__apify__early_kiosk-slash-google-trends-scraper` | Tendências de busca |
| WhatsApp Validator | `mcp__apify__devscrapper-slash-whatsapp-number-validator` | Validar números WhatsApp |
| SEMrush | `mcp__apify__call-actor` (actor: `radeance/semrush-scraper`) | SEO/SEM completo |
| Actor Search | `mcp__apify__search-actors` | Buscar scrapers adicionais |
| Run Actor | `mcp__apify__call-actor` | Executar qualquer Actor |
| Actor Output | `mcp__apify__get-actor-output` | Obter resultados |
| Dataset Items | `mcp__apify__get-dataset-items` | Paginar datasets grandes |

## Execution Protocol

Quando ativada, esta skill DEVE:

1. **Identificar o alvo** - URL, nome da empresa, ou segmento
2. **Selecionar ferramentas** - Escolher os MCP tools corretos para a missão
3. **Executar coleta** - Rodar os Actors/scrapers necessários
4. **Cruzar dados** - Cross-reference múltiplas fontes
5. **Classificar confiança** - Marcar cada dado como VERIFIED/HIGH/MEDIUM/LOW/ESTIMATED
6. **Gerar relatório** - Output estruturado com scores e recomendações

## Task: Map Company

**Input:** URL ou nome da empresa
**Output:** Relatório completo de inteligência

### Passos:

1. **Website Crawl**
   - Usar `mcp__apify__apify-slash-web-scraper` com a URL do site
   - Extrair: páginas, produtos/serviços, preços, equipe, blog, contato
   - Usar `mcp__apify__apify-slash-rag-web-browser` para conteúdo profundo

2. **Google Business Profile**
   - Usar `mcp__apify__cheapget-slash-google-business-profile`
   - Input: nome da empresa + cidade
   - Extrair: reviews, rating, categoria, horários, fotos

3. **Social Media Scan**
   - Instagram: `mcp__apify__apify-slash-instagram-profile-scraper`
   - LinkedIn: `mcp__apify__harvestapi-slash-linkedin-profile-scraper`
   - Buscar Facebook/TikTok/YouTube via `mcp__apify__apify-slash-google-search-scraper`

4. **SEO/SEM Intelligence**
   - Usar `mcp__apify__call-actor` com actor `radeance/semrush-scraper`
   - Input: `{"url": "{domain}", "reportType": "domain_overview"}`
   - Extrair: tráfego orgânico, tráfego pago, keywords, backlinks, authority score

5. **Tech Stack Detection**
   - Analisar source code do site via web-scraper
   - Detectar: CMS, analytics (GA4/GTM), pixels (Meta/Google/TikTok), chat widgets, CRM

6. **Compilar Relatório**
   - Cruzar todos os dados
   - Score de maturidade digital (0-100)
   - Identificar gaps e oportunidades
   - Sugerir ângulo de abordagem outbound

## Task: Ads Intelligence

**Input:** URL ou nome da empresa
**Output:** Relatório de inteligência de anúncios

### Passos:

1. **Meta Ads Library**
   - Buscar via `mcp__apify__apify-slash-google-search-scraper`: `site:facebook.com/ads/library "{empresa}"`
   - Buscar actors de Facebook Ads Library via `mcp__apify__search-actors`
   - Extrair: quantidade de anúncios ativos, tipos, datas, plataformas

2. **Google Ads Detection**
   - SEMrush paid keywords: `mcp__apify__call-actor` com `radeance/semrush-scraper` type: `paid_keywords`
   - Buscar branded terms no Google para verificar ads patrocinados
   - Extrair: keywords pagas, CPC estimado, copies de anúncios

3. **Pixel & Tracking Detection**
   - Crawl do site e análise de HTML/JS
   - Buscar: `fbq` (Meta Pixel), `gtag` (Google Ads), `ttq` (TikTok Pixel)
   - Detectar: remarketing, conversion tracking

4. **Estimativa de Investimento**
   - Tráfego pago SEMrush * CPC médio = estimativa Google Ads
   - Quantidade de anúncios Meta * CPM benchmark = estimativa Meta Ads
   - Total estimado mensal

5. **Relatório de Ads**
   - Plataformas usadas (ativo/inativo)
   - Volume de anúncios
   - Gasto estimado mensal
   - Score de sofisticação (1-10)
   - Cobertura de funil (TOFU/MOFU/BOFU)
   - Gaps e oportunidades

## Task: SEMrush Deep Analysis

**Input:** Domínio
**Output:** Relatório SEO/SEM completo

### Execução via `mcp__apify__call-actor`:

```json
{
  "actorId": "radeance/semrush-scraper",
  "input": {
    "url": "{domain}",
    "reportType": "domain_overview"
  }
}
```

### Report Types disponíveis:
- `domain_overview` - Visão geral do domínio
- `organic_keywords` - Keywords orgânicas
- `paid_keywords` - Keywords pagas
- `backlinks` - Perfil de backlinks
- `competitors` - Competidores orgânicos

### Métricas extraídas:
- Authority Score
- Tráfego orgânico mensal
- Tráfego pago mensal
- Total de keywords orgânicas
- Total de keywords pagas
- Total de backlinks
- Referring domains
- Top keywords (posição, volume, CPC)
- Principais competidores orgânicos

## Task: Prospect Outbound

**Input:** ICP (segmento, região, tamanho, sinais)
**Output:** Lista qualificada de leads com scores

### Lead Scoring Model:

| Critério | Peso | Sinais |
|----------|------|--------|
| Maturidade Digital | 25% | Qualidade do site, presença social, frequência de conteúdo |
| Atividade de Ads | 20% | Roda anúncios, pixel instalado, multi-canal |
| Fit de Mercado | 25% | Match com ICP, segmento certo, tamanho certo |
| Sinais de Crescimento | 15% | Contratando, novos produtos, expandindo |
| Acessibilidade | 15% | Contato encontrado, decision-makers identificados |

### Score Tiers:
- **A (80-100):** Lead quente - abordar imediatamente
- **B (60-79):** Lead morno - nutrir com valor
- **C (40-59):** Lead frio - adicionar à cadência
- **D (0-39):** Não qualificado - skip

## Task: Find Decision Makers

**Input:** Nome da empresa
**Output:** Lista de decision-makers com dados de contato

### Execução:
1. Buscar empresa no LinkedIn via `mcp__apify__harvestapi-slash-linkedin-profile-scraper`
2. Buscar no Google: `"{empresa}" site:linkedin.com/in CEO OR CMO OR "Head of Marketing"`
3. Extrair: nome, cargo, LinkedIn URL, sinais de contato
4. Priorizar: CEO > CMO > Head of Marketing > Head of Growth > Marketing Manager

## Task: Revenue Estimation

**Input:** Dados coletados de map-company
**Output:** Estimativa de faturamento e custos

### Sinais utilizados:
- **Tráfego:** SEMrush traffic * taxa de conversão do setor * ticket médio
- **Ads Spend:** Tráfego pago * CPC médio = investimento Google; nº anúncios * CPM = investimento Meta
- **Team Size:** Funcionários LinkedIn * salário médio por cargo/região
- **Market Share:** Visibility share no SEMrush vs competidores
- **Growth Signals:** Tendência de tráfego, contratações, novos produtos

### Output:
- Faturamento estimado (range): R$ X - R$ Y / mês
- Marketing spend estimado: R$ X / mês
- Custo estimado com equipe: R$ X / mês
- Confiança da estimativa: LOW / MEDIUM / HIGH

## Report Template

```markdown
# Intelligence Report: {empresa}
**Data:** {data} | **Analista:** Thamyres | **Confiança:** {level}

## Executive Summary
{resumo em 3-4 linhas}

## Company Overview
- **Website:** {url}
- **Segmento:** {segmento}
- **Localização:** {cidade/estado}
- **Equipe estimada:** {X} funcionários
- **Fundação:** {ano}

## Digital Maturity Score: {score}/100
| Dimensão | Score | Detalhe |
|----------|-------|---------|
| Website | {X}/10 | {detalhe} |
| SEO | {X}/10 | {detalhe} |
| Social Media | {X}/10 | {detalhe} |
| Paid Media | {X}/10 | {detalhe} |
| Conteúdo | {X}/10 | {detalhe} |
| Reputação | {X}/10 | {detalhe} |

## SEO & Tráfego
- Authority Score: {X}
- Tráfego orgânico: {X}/mês
- Top keywords: {lista}

## Paid Media Intelligence
- Plataformas ativas: {lista}
- Anúncios ativos: {X}
- Gasto estimado: R$ {X}/mês
- Sofisticação: {X}/10

## Social Media
| Plataforma | Seguidores | Frequência | Engajamento |
|-----------|-----------|-----------|------------|
| Instagram | {X} | {X}/sem | {X}% |
| LinkedIn | {X} | {X}/sem | {X}% |
| Facebook | {X} | {X}/sem | {X}% |

## Tech Stack
- CMS: {X}
- Analytics: {X}
- Pixels: {X}
- Chat: {X}

## Revenue Estimation
- Faturamento: R$ {X} - R$ {Y} / mês
- Marketing spend: R$ {X} / mês

## Outbound Approach
- **Ângulo recomendado:** {abordagem}
- **Pain points detectados:** {lista}
- **Decision Maker:** {nome} - {cargo}
- **Canal preferido:** {canal}

## Fontes & Confiança
{lista de fontes com nível de confiança}
```
