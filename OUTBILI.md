# OUTBILI — Arquivo Mãe do Projeto

Este arquivo é a fonte de verdade do projeto OUTBILI. Toda execução, decisão e implementação deve seguir estas diretrizes.

---

## O que é o OUTBILI

Sistema de inteligência comercial e prospecção B2B da V4 Bilinski &Co. Permite pesquisar, enriquecer, qualificar e prospectar leads com IA.

**URL de produção:** https://v4bilinski.github.io/outbili/

---

## Deploy

| Item | Valor |
|------|-------|
| Hospedagem | GitHub Pages |
| Repositório | github.com/V4Bilinski/outbili |
| Branch de deploy | `main` |
| Trigger | Todo push em `main` dispara build + deploy |
| Workflow | `.github/workflows/deploy.yml` |
| Build | `tsc -b && vite build` |
| Output | `dist/` |

**Regra absoluta:** toda alteração de código DEVE ser commitada e enviada com `git push origin main` para que o deploy seja disparado. Nenhuma mudança é considerada finalizada até estar no `main` do GitHub.

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
| Enriquecimento (cadastral) | CNPJa API (searchOffice + mapCnpjaToLead) |
| Enriquecimento (telefone/WhatsApp) | Assertiva Localize (via Worker proxy + n8n fallback) |
| Enriquecimento (social/digital) | Apify Actors |
| WhatsApp | BilinskiZap API |
| Ícones | Lucide React |
| Fontes | Plus Jakarta Sans, Inter, JetBrains Mono |

---

## Estrutura do projeto

```
src/
  pages/              # Páginas (rotas)
    DashboardPage     # KPIs e ações rápidas
    LeadsPage         # Pipeline Kanban
    CompanyPage       # Perfil completo do lead
    SearchPage        # Pesquisa em massa + cadastro manual + upload
    CampaignsPage     # Cadências WhatsApp
    ReportsPage       # Relatórios
    AdminPage         # Administração (3 tabs: Atividades, Usuarios, Enriquecimento)
    SettingsPage      # Configurações
    LoginPage         # Autenticação (Users table + useAuth hook)
  components/
    layout/           # MainLayout, Sidebar, BottomNav, MobileHeader
    ui/               # Button, Card, Badge, Skeleton, AccordionItem, etc.
    company/          # Tabs do perfil (Projecao, Argumentos, Vulnerabilidades, etc.)
    ImportModal.tsx    # Modal de importação de leads por arquivo
  hooks/              # useLeads, useLeadEnrichment, useMassEnrichment, useReEnrichment, useAuth, etc.
  services/           # leadService, contactService, enrichmentService, campaignService
  lib/                # airtable, apify, file-parser, n8n-webhook, bilinskizap, utils
  types/index.ts      # Interfaces: Lead, Contact, Campaign, Activity, etc.
```

---

## Variáveis de ambiente

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
| `VITE_CNPJA_API_KEY` | Chave API CNPJa |
| `VITE_ASSERTIVA_CLIENT_ID` | Client ID Assertiva OAuth2 |
| `VITE_ASSERTIVA_CLIENT_SECRET` | Client Secret Assertiva OAuth2 |
| `VITE_ASSERTIVA_WORKER_URL` | URL Worker proxy Assertiva |
| `VITE_N8N_ASSERTIVA_PROXY` | Webhook n8n fallback Assertiva |

Para desenvolvimento local, copiar `.env.example` para `.env` e preencher.

---

## Comandos

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção (tsc -b && vite build)
npm run lint      # Verificar código com ESLint
npm run preview   # Preview do build local
```

---

## Regras de desenvolvimento

### Código
- TypeScript estrito — o build roda `tsc -b` antes do Vite, qualquer erro de tipo bloqueia o deploy
- Seguir padrões existentes no codebase (nomes, estrutura, estilos)
- Componentes usam Tailwind CSS com classes utilitárias
- Tema escuro (dark-first), cores via variáveis CSS em `globals.css`
- Sem emojis no codigo a menos que o usuário peça

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Commitar apenas arquivos relevantes (nunca `.env`, `node_modules`, `.DS_Store`)
- Sempre fazer push para `main` após commit para disparar deploy

### Banco de dados (Airtable)
- Todas as operações via `src/lib/airtable.ts`
- Services em `src/services/` encapsulam a lógica de cada entidade
- Hooks em `src/hooks/` usam React Query para cache e mutations

### Enriquecimento de leads
- Pipeline em 3 fases: CNPJa (cadastral central) → Assertiva (telefones/WhatsApp) → Apify (social/digital)
- Fluxo de status: `none` → `cnpja` → `assertiva` → `complete`
- Lógica em `src/services/enrichmentService.ts` e `src/hooks/useLeadEnrichment.ts`
- Re-enriquecimento via `reEnrichLead()` (CNPJa + Assertiva only, sem Apify) e `src/hooks/useReEnrichment.ts`
- Enriquecimento em massa via `src/hooks/useMassEnrichment.ts`
- Diagnóstico via `leadNeedsReEnrich()` helper
- Upload de arquivos (CSV, Excel, PDF, TXT, MD) via `src/lib/file-parser.ts`

---

## Configuração do Claude Code

Para tarefas que envolvam agentes, workflows ou padrões do framework AIOX, consultar `.claude/CLAUDE.md`. Esse arquivo contém regras de agentes, handoff, e execução de workflows — mas o `OUTBILI.md` é sempre o arquivo-mãe e tem prioridade.

---

## Funcionalidades principais

1. **Pesquisa em massa** — busca leads por segmento, estado, cidade, faturamento via CNPJa + Assertiva
2. **Cadastro manual** — formulário com enriquecimento automático CNPJa + Assertiva por CNPJ
3. **Upload de lista** — importa arquivos (Excel, CSV, HTML, PDF) com até 15 leads, enriquece automaticamente
4. **Pipeline Kanban** — funil visual com drag-and-drop e stage gates (checklists por etapa): Prospecção > Qualificação > Contactado > Respondeu > Reunião > Proposta > Fechado
5. **Perfil da empresa** — score SPICED com contexto qualitativo, WTP explícito, tooltips educativos, 9 tabs (4 primárias + 5 em "Análises")
6. **Campanhas WhatsApp** — cadências outbound com tracking via BilinskiZap, KPIs contextuais
7. **Mensagens** — inbox WhatsApp integrado (sidebar: "Mensagens", mobile: "Msgs")
8. **Dashboard** — KPIs com micro-narrativas, temperatura com hints de ação, ações rápidas orientadas
9. **Relatorios** — métricas com benchmarks, projeções com fórmulas explícitas, recomendações condicionais
10. **Re-enriquecimento** — batch re-enrichment com diagnóstico (AdminPage > tab Enriquecimento)
11. **Autenticação** — login com Users table, useAuth hook, proteção de rotas
12. **Administração** — AdminPage com 3 tabs: Atividades, Usuarios, Enriquecimento

---

## Navegação

| Menu Desktop (Sidebar) | Menu Mobile (BottomNav) | Rota |
|------------------------|------------------------|------|
| Dashboard | Home | `/#/` |
| Pesquisa | Busca | `/#/search` |
| Leads | Leads | `/#/leads` |
| Pipeline | Pipeline | `/#/pipeline` |
| Mensagens | Msgs | `/#/inbox` |
| Campanhas | — | `/#/campaigns` |
| Relatórios | — | `/#/reports` |
| Configurações | — | `/#/settings` |

---

## Padrões de comunicação visual (Copy Standards)

Padrões definidos pela auditoria Copy Squad (2026-04-14). Para novas telas ou componentes:

### Terminologia unificada
- **Lead** = masculino ("Lead não encontrado")
- **Campanha** = feminino ("Concluída")
- **Website** (nunca "site" em labels)
- **Mensagens** (nunca "Inbox")
- **Segmento pendente** (nunca "Sem segmento")

### Storytelling de dados
- Números com contexto: Score 4.2 → "Lead qualificado"
- Taxas com benchmark: 15% → "abaixo do benchmark (30%)"
- Valores monetários com fórmula: "Baseado em 10-15% do faturamento anual"
- Enrichment legivel: "Enriquecido", "Processando...", "Dados completos"

### Tooltips educativos
- Termos técnicos (SPICED, Tier, WTP, Trava) com `title` explicativo
- Stats com fonte: "(est. via CNPJa)", "(benchmark V4)"

### Mensagens de erro
- Nunca genérico — sempre orientar ação ("Não foi possível X. Verifique Y.")

### Skill de referência
- Usar `/copy-squad` para criar ou revisar copys do sistema
- Score Hopkins: 84/100 (meta: 85+)

---

## Documentos de referência

| Documento | Propósito |
|-----------|-----------|
| `OUTBILI.md` | Documento-mãe — diretrizes gerais |
| `docs/guides/OUTBILI-SYSTEM-GUIDE.md` | Guia do sistema — funcionalidades, arquitetura, fluxos |
| `docs/guides/GAP-ANALYSIS-OUTBILI.md` | Análise de gaps (o que falta implementar) |
| `docs/planejamento-tatico-pesca-prospeccao.md` | Planejamento tático do módulo PESCA |
| `docs/airtable-formulas-views.md` | Fórmulas e views do Airtable |
