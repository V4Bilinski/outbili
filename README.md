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

## Regras de Negócio Obrigatórias

### Dados obrigatórios por lead (INEGOCIÁVEL)

Todo lead salvo no sistema **DEVE** conter obrigatoriamente:

| Campo | Obrigatório | Fonte | Descrição |
|-------|:-----------:|-------|-----------|
| Nome da empresa | **SIM** | CNPJa | Razão social completa |
| CNPJ | **SIM** | CNPJa | Base de todo enriquecimento |
| Nome do decisor | **SIM** | CNPJa (QSA) | Sócio-administrador ou diretor |
| Telefone (celular ou fixo) | **SIM** | CNPJa | Pelo menos 1 telefone de contato |
| Contact vinculado | **SIM** | Sistema | Registro na tabela Contacts com leadId |

**Leads sem decisor ou sem telefone são DESCARTADOS automaticamente.**
O sistema recusa salvar leads incompletos em qualquer fluxo (PESCA, cadastro manual, importação).

### Hierarquia de telefone

1. **WhatsApp (celular MOBILE)** — prioridade máxima, campo `whatsapp` do Contact
2. **Telefone fixo** — fallback, campo `phone` do Contact
3. **Telefone RF da empresa** — último recurso, campo `rfPhone` do Lead

O campo `whatsapp` do Contact só é preenchido com celulares confirmados (tipo MOBILE do CNPJa).
Telefones fixos são salvos no campo `phone` e exibidos com label "(fixo)" na interface.

---

## Funcionalidades

### Pesquisa de leads (PESCA)
- **Em massa:** busca por segmento, estado, cidade e porte via CNPJa API
- **Cadastro manual:** lead específico com enriquecimento automático
- **Upload de arquivo:** importa CSV, Excel, PDF, TXT, MD com até 15 leads por vez
- **Validação obrigatória:** leads sem decisor ou telefone são descartados antes de salvar

### Enriquecimento por IA
Pipeline de enriquecimento em 3 fases:
1. **CNPJa API:** dados cadastrais, sócios (QSA), telefones, emails, CNAE
2. **Assertiva (via n8n proxy):** telefones validados, WhatsApp flag, CPF do decisor
3. **Apify Actors:** presença digital (Instagram, LinkedIn, Google), análise competitiva

### Pipeline Kanban
Gestão visual de leads com drag-and-drop e stage gates:
`Prospecção → Qualificação → Contactado → Respondeu → Reunião → Proposta → Fechado`

### Perfil da empresa
Página completa com 4 tabs primárias + dropdown "Mais":
- **Primárias:** Resumo, SPICED, Reunião, Campanhas
- **Mais:** Vulnerabilidades, Projeção, Competitiva, Objeções & Respostas, Anúncios

### Campanhas WhatsApp
Cadências outbound automatizadas via BilinskiZap com tracking de entrega, leitura e resposta.

## Repositorio

- **Branch principal:** `main`
- **Deploy automatico:** todo push em `main` dispara build + deploy
- **Repositorio:** [github.com/V4Bilinski/outbili](https://github.com/V4Bilinski/outbili)
