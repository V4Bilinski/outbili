# OUTBILI

Sistema de inteligencia comercial e prospecao B2B com enriquecimento de leads por IA.

**Live:** [https://v4bilinski.github.io/outbili/](https://v4bilinski.github.io/outbili/)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Estilo | Tailwind CSS 4 |
| Roteamento | React Router (HashRouter) |
| Estado | TanStack React Query |
| Banco de dados | Airtable (via REST API) |
| Deploy | GitHub Pages (GitHub Actions) |
| Enriquecimento | Apify Actors + n8n Webhooks |
| Automacao WhatsApp | BilinskiZap API |

## Estrutura do projeto

```
src/
  pages/           # Paginas da aplicacao
    DashboardPage   # Visao geral, KPIs, acoes rapidas
    LeadsPage       # Pipeline Kanban de leads
    CompanyPage     # Perfil completo da empresa
    SearchPage      # Pesquisa em massa + cadastro manual + upload
    CampaignsPage   # Cadencias outbound WhatsApp
    ReportsPage     # Relatorios e metricas
    SettingsPage    # Configuracoes do sistema
  components/
    layout/         # MainLayout, Sidebar, BottomNav, MobileHeader
    ui/             # Button, Card, Badge, Skeleton, etc.
    company/        # Tabs da pagina de empresa (Projecao, Argumentos, etc.)
    ImportModal     # Modal de importacao de leads por arquivo
  hooks/            # useLeads, useLeadEnrichment, useMassEnrichment, etc.
  services/         # leadService, contactService, enrichmentService, etc.
  lib/              # airtable, apify, file-parser, n8n-webhook, utils
  types/            # Interfaces TypeScript (Lead, Contact, Campaign, etc.)
```

## Deploy

O deploy e automatico via **GitHub Actions** para **GitHub Pages**.

**Fluxo:**
1. Push para `main`
2. GitHub Actions executa `tsc -b && vite build`
3. Artefato `dist/` e publicado no GitHub Pages
4. URL: `https://v4bilinski.github.io/outbili/`

**Workflow:** `.github/workflows/deploy.yml`

**Segredos necessarios** (configurados em Settings > Secrets > Actions):

| Secret | Descricao |
|--------|-----------|
| `VITE_AIRTABLE_PAT` | Token de acesso pessoal do Airtable |
| `VITE_AIRTABLE_BASE_ID` | ID da base do Airtable |
| `VITE_BILINSKIZAP_URL` | URL da API BilinskiZap |
| `VITE_BILINSKIZAP_API_KEY` | Chave da API BilinskiZap |
| `VITE_APIFY_TOKEN` | Token do Apify para enriquecimento |
| `VITE_VIBEPROSPECTING_URL` | URL do VibeProspecting MCP |
| `VITE_VIBEPROSPECTING_TOKEN` | Token do VibeProspecting |
| `VITE_N8N_WEBHOOK_URL` | URL do webhook n8n |

## Desenvolvimento local

```bash
# Instalar dependencias
npm install

# Copiar variaveis de ambiente
cp .env.example .env
# Preencher as variaveis no .env

# Rodar em modo dev
npm run dev

# Build de producao
npm run build

# Verificar tipos
npx tsc -b
```

## Funcionalidades

### Pesquisa de leads
- **Em massa:** busca por segmento, estado, cidade, faturamento via n8n
- **Lead especifico:** cadastro manual com enriquecimento automatico por IA
- **Upload de arquivo:** importa CSV, Excel, PDF, TXT, MD com ate 15 leads por vez

### Enriquecimento por IA
Pipeline de enriquecimento em 2 fases:
1. **APIs publicas:** Receita Federal (CNPJ), Google Maps, dominio
2. **Inteligencia de mercado:** Apify (Instagram, LinkedIn, Google), analise competitiva

### Pipeline Kanban
Gestao visual de leads com drag-and-drop:
`Novo → Pesquisando → Contatado → Reuniao → Proposta → Fechado`

### Perfil da empresa
Pagina completa com tabs: Projecao financeira, Argumentos de venda, Vulnerabilidades, Analise competitiva, Contatos, Reuniao, Ads Intel.

### Campanhas WhatsApp
Cadencias outbound automatizadas via BilinskiZap com tracking de entrega, leitura e resposta.

## Repositorio

- **Branch principal:** `main`
- **Deploy automatico:** todo push em `main` dispara build + deploy
- **Repositorio:** [github.com/V4Bilinski/outbili](https://github.com/V4Bilinski/outbili)
