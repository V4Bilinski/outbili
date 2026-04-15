# Tech Stack — Fábrica de Receita

Stack de ferramentas de marketing e growth utilizadas pelo squad em diagnósticos, implementações e acompanhamentos de clientes.

---

## Tráfego Pago

### Google Ads
- **Uso:** Search, Display, YouTube, Performance Max
- **Métricas primárias:** ROAS, CPL, CPA, CTR, Impression Share
- **Integração:** GA4 (conversões), Merchant Center (e-commerce)
- **Licença:** Conta do cliente (squad atua com acesso de gestor)

### Meta Ads (Facebook / Instagram)
- **Uso:** Awareness, Tráfego, Leads, Conversões, Catálogo
- **Métricas primárias:** CPM, CPL, ROAS, Frequency, Relevance Score
- **Integração:** Pixel Meta, CAPI (Conversions API)
- **Licença:** Business Manager do cliente

### TikTok Ads
- **Uso:** Awareness, Tráfego, Lead Generation
- **Métricas primárias:** CPM, CPV, CTR, CPL
- **Integração:** TikTok Pixel, Events API
- **Licença:** TikTok Ads Manager do cliente

### LinkedIn Ads
- **Uso:** B2B — Lead Gen Forms, Sponsored Content, InMail
- **Métricas primárias:** CPL, CTR, Lead Quality Score
- **Integração:** LinkedIn Insight Tag, CRM
- **Licença:** Campaign Manager do cliente

---

## Tráfego Orgânico e SEO

### SEMrush
- **Uso:** Keyword research, audit de SEO, análise competitiva, backlinks
- **Recursos principais:** Site Audit, Position Tracking, Keyword Gap, Traffic Analytics
- **Licença:** Conta da Fábrica (acesso por projeto)

### Google Search Console
- **Uso:** Monitoramento de desempenho orgânico, indexação, Core Web Vitals
- **Métricas:** Impressões, cliques, CTR orgânico, posição média
- **Acesso:** Verificação de propriedade pelo cliente

---

## CRM e Automação de Marketing

### RD Station Marketing + CRM
- **Uso:** Automação de e-mail marketing, nutrição de leads, landing pages, CRM básico
- **Recursos:** Fluxos de automação, lead scoring, segmentação, relatórios
- **Integração nativa:** Google Ads, Facebook Ads, Webhooks
- **Aplicação:** Clientes SMB brasileiros com stack integrada

### ActiveCampaign
- **Uso:** E-mail marketing avançado, automações complexas, CRM pipeline
- **Recursos:** Conditional content, split automation, site tracking
- **Integração:** Zapier, Webhooks, API REST
- **Aplicação:** Clientes com necessidade de automação mais sofisticada

### HubSpot CRM
- **Uso:** CRM completo, pipeline de vendas, sequências de prospecção, relatórios
- **Recursos:** Deal stages, sequences, meetings, reporting
- **Integração nativa:** Gmail, Outlook, Slack, Zoom
- **Aplicação:** Clientes B2B com time de vendas

### Pipedrive
- **Uso:** CRM focado em pipeline de vendas e gestão de deals
- **Recursos:** Pipeline visual, automações, relatórios de velocidade
- **Integração:** Zapier, webhooks, e-mail
- **Aplicação:** Times de vendas menores com foco em conversão

---

## Analytics e Dados

### Google Analytics 4 (GA4)
- **Uso:** Analytics de site/app, funil de conversão, attribution, audiences
- **Recursos:** Event tracking, Explorations, Audience building, BigQuery export
- **Configuração padrão:** GTM para implementação de eventos

### Google Tag Manager (GTM)
- **Uso:** Gestão centralizada de tags, pixels e eventos sem código
- **Tags frequentes:** GA4, Meta Pixel, LinkedIn Insight Tag, hotjar
- **Acesso:** Container no cliente, squad com acesso de publicação

### Hotjar
- **Uso:** Heatmaps, gravações de sessão, funis de conversão, surveys in-page
- **Métricas:** Scroll maps, click maps, rage clicks, session recordings
- **Aplicação:** CRO, diagnóstico de UX e pontos de abandono

---

## WhatsApp e Comunicação

### WhatsApp Business API (Meta Cloud API)
- **Uso:** Comunicação em escala, campanhas, nutrição, CS proativo
- **Recursos:** Templates aprovados, webhooks, chatbot integration
- **Integração:** n8n, ActiveCampaign, RD Station
- **Agente especialista:** `@whatsapp-chief` (squad dedicado)

---

## A/B Testing e CRO

### Google Optimize (sunset) / VWO
- **Uso:** A/B tests, multivariate tests, redirect tests
- **Integração:** GA4 para análise de resultados
- **Alternativa nativa:** Feature flags em plataformas como Vercel Edge Config

---

## Inteligência Competitiva

### SEMrush Traffic Analytics
- **Uso:** Análise de tráfego de concorrentes, canais, audiência
- **Recursos:** Market Explorer, Traffic Journey

### Meta Ad Library
- **Uso:** Análise de criativos e campanhas ativas de concorrentes no Meta
- **Acesso:** Público, via ads.meta.com/ad_library

---

## Ferramentas de Produtividade do Squad

### n8n (automação de workflows)
- **Uso:** Integração entre ferramentas, automação de processos, webhooks
- **Instância:** Squad da Fábrica (acesso por projeto quando necessário)

### Airtable
- **Uso:** Gestão de projetos, bases de dados de clientes, trackers
- **Templates:** Pipeline de clientes, tracker de OKRs, base de experimentos

### Notion / Google Workspace
- **Uso:** Documentação, reports, apresentações, colaboração
