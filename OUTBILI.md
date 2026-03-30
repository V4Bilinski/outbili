# OUTBILI — Arquivo Mae do Projeto

Este arquivo e a fonte de verdade do projeto OUTBILI. Toda execucao, decisao e implementacao deve seguir estas diretrizes.

---

## O que e o OUTBILI

Sistema de inteligencia comercial e prospeccao B2B da V4 Bilinski &Co. Permite pesquisar, enriquecer, qualificar e prospectar leads com IA.

**URL de producao:** https://v4bilinski.github.io/outbili/

---

## Deploy

| Item | Valor |
|------|-------|
| Hospedagem | GitHub Pages |
| Repositorio | github.com/V4Bilinski/outbili |
| Branch de deploy | `main` |
| Trigger | Todo push em `main` dispara build + deploy |
| Workflow | `.github/workflows/deploy.yml` |
| Build | `tsc -b && vite build` |
| Output | `dist/` |

**Regra absoluta:** toda alteracao de codigo DEVE ser commitada e enviada com `git push origin main` para que o deploy seja disparado. Nenhuma mudanca e considerada finalizada ate estar no `main` do GitHub.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilo | Tailwind CSS 4 |
| Roteamento | React Router (HashRouter) |
| Estado servidor | TanStack React Query |
| Banco de dados | Airtable (REST API) |
| Enriquecimento | Apify Actors + n8n Webhooks |
| WhatsApp | BilinskiZap API |
| Icones | Lucide React |
| Fontes | Plus Jakarta Sans, Inter, JetBrains Mono |

---

## Estrutura do projeto

```
src/
  pages/              # Paginas (rotas)
    DashboardPage     # KPIs e acoes rapidas
    LeadsPage         # Pipeline Kanban
    CompanyPage       # Perfil completo do lead
    SearchPage        # Pesquisa em massa + cadastro manual + upload
    CampaignsPage     # Cadencias WhatsApp
    ReportsPage       # Relatorios
    SettingsPage      # Configuracoes
  components/
    layout/           # MainLayout, Sidebar, BottomNav, MobileHeader
    ui/               # Button, Card, Badge, Skeleton, AccordionItem, etc.
    company/          # Tabs do perfil (Projecao, Argumentos, Vulnerabilidades, etc.)
    ImportModal.tsx    # Modal de importacao de leads por arquivo
  hooks/              # useLeads, useLeadEnrichment, useMassEnrichment, etc.
  services/           # leadService, contactService, enrichmentService, campaignService
  lib/                # airtable, apify, file-parser, n8n-webhook, bilinskizap, utils
  types/index.ts      # Interfaces: Lead, Contact, Campaign, Activity, etc.
```

---

## Variaveis de ambiente

Configuradas como secrets no GitHub Actions (Settings > Secrets > Actions):

| Secret | Uso |
|--------|-----|
| `VITE_AIRTABLE_PAT` | Token Airtable |
| `VITE_AIRTABLE_BASE_ID` | ID da base Airtable |
| `VITE_BILINSKIZAP_URL` | URL BilinskiZap |
| `VITE_BILINSKIZAP_API_KEY` | Chave BilinskiZap |
| `VITE_APIFY_TOKEN` | Token Apify |
| `VITE_VIBEPROSPECTING_URL` | URL VibeProspecting |
| `VITE_VIBEPROSPECTING_TOKEN` | Token VibeProspecting |
| `VITE_N8N_WEBHOOK_URL` | Webhook n8n |

Para desenvolvimento local, copiar `.env.example` para `.env` e preencher.

---

## Comandos

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de producao (tsc -b && vite build)
npm run lint      # Verificar codigo com ESLint
npm run preview   # Preview do build local
```

---

## Regras de desenvolvimento

### Codigo
- TypeScript estrito — o build roda `tsc -b` antes do Vite, qualquer erro de tipo bloqueia o deploy
- Seguir padroes existentes no codebase (nomes, estrutura, estilos)
- Componentes usam Tailwind CSS com classes utilitarias
- Tema escuro (dark-first), cores via variaveis CSS em `globals.css`
- Sem emojis no codigo a menos que o usuario peca

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Commitar apenas arquivos relevantes (nunca `.env`, `node_modules`, `.DS_Store`)
- Sempre fazer push para `main` apos commit para disparar deploy

### Banco de dados (Airtable)
- Todas as operacoes via `src/lib/airtable.ts`
- Services em `src/services/` encapsulam a logica de cada entidade
- Hooks em `src/hooks/` usam React Query para cache e mutations

### Enriquecimento de leads
- Pipeline em 2 fases: APIs publicas (gratuitas) + Inteligencia de mercado (Apify)
- Logica em `src/services/enrichmentService.ts` e `src/hooks/useLeadEnrichment.ts`
- Enriquecimento em massa via `src/hooks/useMassEnrichment.ts`
- Upload de arquivos (CSV, Excel, PDF, TXT, MD) via `src/lib/file-parser.ts`

---

## Configuracao do Claude Code

Para tarefas que envolvam agentes, workflows ou padroes do framework AIOX, consultar `.claude/CLAUDE.md`. Esse arquivo contem regras de agentes, handoff, e execucao de workflows — mas o `OUTBILI.md` e sempre o arquivo-mae e tem prioridade.

---

## Funcionalidades principais

1. **Pesquisa em massa** — busca leads por segmento, estado, cidade, faturamento via n8n
2. **Cadastro manual** — formulario com enriquecimento automatico por IA
3. **Upload de lista** — importa arquivos com ate 15 leads, enriquece automaticamente
4. **Pipeline Kanban** — gestao visual: Novo > Pesquisando > Contatado > Reuniao > Proposta > Fechado
5. **Perfil da empresa** — projecao financeira, argumentos, vulnerabilidades, analise competitiva, contatos
6. **Campanhas WhatsApp** — cadencias outbound com tracking via BilinskiZap
7. **Dashboard** — KPIs, leads quentes, acoes rapidas
8. **Relatorios** — metricas de performance e conversao
