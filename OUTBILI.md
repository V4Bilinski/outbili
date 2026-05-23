# OUTBILI — Arquivo Mãe do Projeto

Este arquivo é a fonte de verdade do projeto OUTBILI. Toda execução, decisão e implementação deve seguir estas diretrizes.

---

## O que é o OUTBILI

Sistema de inteligência comercial e prospecção B2B da V4 Bilinski & Co. Permite pesquisar, enriquecer, qualificar e prospectar leads com IA.

**Localização:** V4 Bilinski & Co — São Paulo, Berrini (Zona Sul de SP).
Esta é a localização oficial e definitiva da unidade. Nunca usar "Curitiba" em qualquer documento, copy, texto de interface ou comunicação do projeto.

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

> ✅ **Estado em 2026-05-23:** produção restaurada (commit `cb19d90`, fix de indentação do `deploy.yml` via MCP github). App no ar em https://v4bilinski.github.io/outbili/ (HTTP 200, Supabase URL embutida no bundle). Backend do W3-08 (deep enrichment Assertiva) deployado, ver [Estado da migração](#estado-da-migração-airtable--supabase).
>
> **2 lições registradas (deploy):**
> 1. O `deploy.yml` build step precisa das envs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (secrets já no GitHub). Sem elas, o bundle de produção tem Supabase URL vazia.
> 2. Editar arquivos `.github/workflows/*` exige token com scope `workflow` (CLI, MCP e API REST respeitam isso). Editar pela UI do GitHub é o único caminho que dispensa o scope. Ao colar YAML, copiar do filesystem via `pbcopy` (NUNCA de code block de chat — herda indentação extra).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Bundler | Vite 8 |
| Estilo | Tailwind CSS 4 |
| Roteamento | React Router (HashRouter) |
| Estado servidor | TanStack React Query |
| Banco de dados | **Supabase** (Postgres + Auth + Realtime) — cutover Airtable→Supabase em curso, ver [Migration Status](#estado-da-migração-airtable--supabase) |
| Enriquecimento (cadastral) | CNPJa API (searchOffice + mapCnpjaToLead) |
| Enriquecimento (telefone/WhatsApp) | Assertiva Localize. Deep enrichment via Edge Function `assertiva-enrich` (W3-08). Legado raso ainda via Worker proxy + n8n (em transição) |
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
    AdminPage         # Administração (3 tabs: Atividades, Usuários, Enriquecimento)
    SettingsPage      # Configurações
    LoginPage         # Autenticação (Users table + useAuth hook)
  components/
    layout/           # MainLayout, Sidebar, BottomNav, MobileHeader
    ui/               # Button, Card, Badge, Skeleton, AccordionItem, etc.
    company/          # Tabs do perfil (Projecao, Argumentos, Vulnerabilidades, etc.)
    ImportModal.tsx    # Modal de importação de leads por arquivo
  hooks/              # useLeads, useLeadEnrichment, useMassEnrichment, useReEnrichment, useAuth, etc.
  services/           # leadService, contactService, enrichmentService, campaignService
  lib/                # supabase (W3 ✓), airtable (legacy — só authService, removido pós W3-06), file-parser, n8n-webhook, bilinskizap, utils
  types/index.ts      # Interfaces: Lead, Contact, Campaign, Activity, etc.
```

---

## Estado da migração Airtable → Supabase

**Atualizado em 2026-05-23.** Epic: `docs/stories/epics/EPIC-airtable-to-supabase-migration.md`.

| Wave | Escopo | Status |
|---|---|---|
| **W1** | Schema `app` / `audit` + foreign tables FDW | ✅ concluída |
| **W2** | ETL Airtable → Supabase (3.313 → 3.313, zero perda) | ✅ concluída 2026-05-19 |
| **W3-01..05** | Cliente Supabase + tipos + 8 services repontados (lead, contact, partner, trademark, activity, enrichmentLog, campaignMeta, pesca) | ✅ concluída 2026-05-19/20 |
| **W3-06** | `authService` → Supabase Auth | ✅ concluída 2026-05-20 |
| **W3-07** | Cutover 100% Supabase + validação E2E + produção restaurada | ✅ concluída 2026-05-23 (commit `cb19d90`) |
| **W3-08** | Deep enrichment Assertiva via Edge Function (sem n8n) + grafo de sócios cifrado | 🟡 backend ✅ 2026-05-23 · frontend pendente |
| Story 021 | Declarar Supabase oficial + drop foreign tables + remover `src/lib/airtable.ts` órfão | ⬜ pendente |

**Projeto Supabase:** `outbili-spo` — ref `yxppliytwvlajeqqrrny`, São Paulo (sa-east-1).

### W3-08 · Deep enrichment Assertiva (grafo de sócios)

Reescopado a partir da decisão de **eliminar o n8n** do fluxo Assertiva (operador, 2026-05-20). O enriquecimento profundo agora roda numa **Edge Function Supabase** (`supabase/functions/assertiva-enrich`), não mais via Worker Cloudflare + n8n.

**Fluxo (síncrono, POST `{ cnpj, leadId, idFinalidade? }`):** OAuth2 server-side → `/localize/v3/cnpj` → `/possiveis-decisores` → por sócio: `/cpf` + `/conexoes` (familiares + societárias) + `/pessoas-de-referencia` + `/mais-telefones` → persiste o grafo.

**Tabelas (schema `app`):** `socios` (1:N do lead) → `socio_vinculos` (familiares + societárias cruzadas) + `socio_telefones` (E.164, WhatsApp). Migrations `20260523145820` / `150650` / `151108`.

**LGPD (art. 10, interesse legítimo · prospecção B2B outbound):** CPF **nunca em texto plano**. Cifragem `pgp_sym_encrypt` com chave `outbili_cpf_master_key` no Vault, via funções `SECURITY DEFINER` `app.encrypt_cpf` / `app.decrypt_cpf`. Hash SHA-256 com salt (`ASSERTIVA_CPF_HASH_SALT`) para dedupe sem decifrar. Inserção via `app.insert_socio` / `app.insert_vinculo_familiar` (cifram internamente, evitam round-trip bytea no PostgREST).

**Índice de probabilidade de negociação** (0.0–1.0): score por sócio calculado na Edge Function (WhatsApp confirmado, telefone hot, vínculos, cargo decisor).

**Secrets da Edge Function** (Project Settings → Edge Functions): `ASSERTIVA_CLIENT_ID`, `ASSERTIVA_CLIENT_SECRET`, `ASSERTIVA_CPF_HASH_SALT`, `ASSERTIVA_ID_FINALIDADE`. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente.

**Pendente:** integração frontend (service + hook + UI do grafo na CompanyPage); hoje `src/services/assertivaService.ts` ainda usa o caminho legado Worker + n8n.

**Documentação da migração:**
- [`docs/migration/PENDENCIAS-MIGRACAO.md`](./docs/migration/PENDENCIAS-MIGRACAO.md) — todos os gaps/bugs registrados para resolver pós-migração (PII CPF, 29 órfãos, 9 campos vagos, role="user", force password reset, mapeamento ActivityLog)
- [`docs/migration/REMOTE-MIGRATIONS-LOG.md`](./docs/migration/REMOTE-MIGRATIONS-LOG.md) — 14 migrations W2/W3 aplicadas via MCP, a reconciliar localmente com `supabase migration repair`

**Bug do W1 corrigido nesta migração:** `handle_new_user()` / `sync_profile_email()` usavam `::citext` sem schema qualificado com `search_path` vazio → quebravam qualquer signup. Resolvido em `fix_handle_new_user_citext_schema`.

**ID dual durante a transição:** services expõem `Lead.id` = `airtable_record_id` (`rec...`) para compat com URLs/componentes legados. Leads/contacts novos criados via app pós-W3 geram `rec...` sintético via `generateRecordId()`. Lookups aceitam `rec...` OU UUID Supabase.

---

## Variáveis de ambiente

Configuradas como secrets no GitHub Actions (Settings > Secrets > Actions):

| Secret | Uso |
|--------|-----|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (W3) |
| `VITE_SUPABASE_ANON_KEY` | Anon key Supabase (W3) |
| `VITE_AIRTABLE_PAT` | Token Airtable (legacy — removido pós W3-06) |
| `VITE_AIRTABLE_BASE_ID` | ID da base Airtable (legacy — removido pós W3-06) |
| `VITE_BILINSKIZAP_URL` | URL BilinskiZap |
| `VITE_BILINSKIZAP_API_KEY` | Chave BilinskiZap |
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
- Sem emojis no código a menos que o usuário peça

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Commitar apenas arquivos relevantes (nunca `.env`, `node_modules`, `.DS_Store`)
- Sempre fazer push para `main` após commit para disparar deploy

### Banco de dados (Supabase + Airtable legacy)
- **Operações principais via `src/lib/supabase.ts`** (cliente schema `app`) e `src/lib/supabase.ts` `supabaseAudit` (schema `audit`)
- Services em `src/services/` encapsulam a lógica de cada entidade — 8 services já apontam para Supabase (lead, contact, partner, trademark, activity, enrichmentLog, campaignMeta, pesca). `authService` ainda usa Airtable até a W3-06
- Hooks em `src/hooks/` usam React Query para cache e mutations — consomem services convertidos transitivamente
- **22 tabelas Supabase** (`app` + `audit`): `leads`, `lead_phones`, `lead_emails`, `lead_social`, `lead_partners`, `lead_trademarks`, `contacts`, `activities`, `enrichment_runs`, `enrichment_jobs`, `pipeline_events`, `campaigns`, `campaign_targets`, `profiles`, `teams`, `sales_reps`, `segments`, `migration_state`, `airtable_bridge_log`, `audit.audit_log`, etc.
- **Tipos:** interfaces de domínio em `src/types/index.ts` (Lead, Contact, Partner, Activity, etc.) mantidas. Database type em `src/types/supabase.types.ts` com 24 enums tipados
- **ID legado:** `Lead.id` / `Contact.id` exposto ao app continua sendo `airtable_record_id` (`rec...`) durante a transição — ver seção "Estado da migração"
- **Soft delete:** `leads` e `contacts` usam `deleted_at` (queries default filtram `.is('deleted_at', null)`)
- **CRÍTICO — rfPhone:** deve conter o MELHOR telefone disponível (prioridade: WhatsApp celular > fixo). Assertiva sempre atualiza rfPhone quando encontra WhatsApp validado
- **CRÍTICO — Airtable legacy:** `src/lib/airtable.ts` permanece SOMENTE para `authService` até W3-06. Não usar para nada novo — sempre via `supabase` client.

### Idioma e ortografia
- **Obrigatório:** todo texto produzido (documentação, comentários, copys, mensagens de erro) deve ser em **português do Brasil (pt-BR)** com acentuação correta
- Termos técnicos e identificadores de código (nomes de variáveis, campos, funções) permanecem em inglês
- Labels do sistema: português com acentos (ex: "Configurações", "Relatórios", "Usuários")
- Documentos do projeto: português com acentuação completa, nunca sem acentos

### Enriquecimento de leads
- Pipeline em 2 fases: CNPJa (cadastral central) → Assertiva (telefones/WhatsApp)
- Fluxo de status: `none` → `cnpja` → `assertiva` → `complete`
- **Prioridade de dados:** decisor (nome) + WhatsApp/telefone são campos obrigatórios
- **Prioridade de telefone:** Assertiva WhatsApp validado > CNPJa celular (MOBILE) > CNPJa fixo (LANDLINE)
- **Assertiva employees:** `_quantidadeFuncionarios` SEMPRE sobrescreve estimate CNPJa (dado real RAIS/CAGED)
- Lógica em `src/services/enrichmentService.ts` e `src/hooks/useLeadEnrichment.ts`
- Re-enriquecimento via `reEnrichLead()` (CNPJa + Assertiva) e `src/hooks/useReEnrichment.ts`
- Enriquecimento em massa via `src/hooks/useMassEnrichment.ts`
- Diagnóstico via `leadNeedsReEnrich()` helper
- Upload de arquivos (CSV, Excel, PDF, TXT, MD) via `src/lib/file-parser.ts`
- **PESCA pipeline:** frontend chama CNPJa diretamente (searchOfficesPaginated), salva no Airtable, depois enriquece via Assertiva em batch
- **Assertiva proxy:** Worker Cloudflare (primário) → n8n webhook (fallback). Ambos tratam CORS server-side

### Análises BDR — Fábrica de Receita V4

As 3 tabs de análise na CompanyPage são conectadas à metodologia Fábrica de Receita (8 travas + STEP):

| Tab | Componente | Serviço | Descrição |
|-----|-----------|---------|-----------|
| Diagnóstico de Travas | `TabTravas.tsx` | `detectTravas()` | Detecta T1-T8 nos dados do lead, prioriza por TOC, gera STEP |
| Projeção Competitiva | `TabProjecaoCompetitiva.tsx` | `generateProjecaoCompetitiva()` | Benchmark dimensional + 3 cenários + gaps |
| Playbook BDR | `TabPlaybookBDR.tsx` | `generatePlaybookBDR()` | Scripts WhatsApp/LinkedIn/Ligação personalizados |

**Regras:**
- O nome do decisor nos scripts é extraído dos Contacts (prioridade: contactType 'decisor') ou do JSON `partners` (fallback)
- O JSON `partners` aceita formato `{nome, qualificacao}` ou `{nome_socio, qualificacao_socio}`
- Scripts são personalizados com dados reais: companyName, segment, trava detectada, faturamento, decisor
- Produto DR recomendado é baseado no tier: Micro+ → DR-X, Small → DR-O, Medium- → DR-T, Medium= → DR-E
- Lógica em `src/services/strategicAnalysisService.ts` (funções `detectTravas`, `generateProjecaoCompetitiva`, `generatePlaybookBDR`)
- Blueprint UX em `docs/guides/BLUEPRINT-ANALISES-BDR.md`

**REGRA ABSOLUTA — Trava dominante:**
- Todo lead DEVE ter `hypotheticalTrap` preenchido com a trava principal no formato `"T1 — Cegueira"`
- O campo é gravado automaticamente em 3 pontos:
  1. `enrichLead()` — enriquecimento individual (CompanyPage)
  2. `enrichBatchWithAssertiva()` — enriquecimento batch pós-PESCA
  3. `reEnrichLead()` — re-enriquecimento batch (AdminPage)
- A lógica `detectTravas()` analisa os dados reais do lead (website, instagram, employees, revenue, etc.) e identifica as travas T1-T8
- O card "Trava dominante" na CompanyPage mostra a trava em tempo real via `detectTravas()` (não depende do campo salvo)

### Cascata Assertiva WhatsApp (3 níveis obrigatórios)

Todo enriquecimento de WhatsApp DEVE seguir a cascata completa de 3 níveis. Se o nível 1 não encontra telefone, o sistema DEVE tentar os níveis 2 e 3 antes de desistir.

| Nível | Ação Assertiva | O que busca | Quando usar |
|-------|---------------|-------------|-------------|
| 1 | `lookup-cnpj` | Telefones da empresa (celulares + fixos) | Sempre — primeiro passo |
| 2 | `get-decision-makers` (protocolo) | Telefones pessoais dos decisores | Se nível 1 não encontrou celular |
| 3 | `lookup-cpf` (CPF do sócio) | Celular pessoal do administrador | Se nível 2 não encontrou celular |

**Regras de gravação no Airtable:**

Todos os campos Assertiva foram criados no Airtable (2026-04-14) e aceitam PATCH por nome. Campos padrão (rfPhone, enrichmentStatus, employees) também aceitam nome.

**IMPORTANTE:** Os campos `assertivaEnrichDate`, `assertivaBehavioralData` e `assertivaTier` NÃO existem no Airtable e são filtrados automaticamente pelo `mapFieldsToAirtable()` em `airtable.ts`.

**Mapeamento completo de Field IDs — Tabela Leads (campos Assertiva):**

| Campo | Field ID | Tipo | Aceita nome? |
|-------|----------|------|-------------|
| assertivaPhoneValidated | `fldRnhMHJCLI5YEqj` | singleLineText | SIM |
| assertivaWhatsappFlag | `fld1z1mZawfZFld18` | checkbox | SIM |
| assertivaEmailValidated | `flda9umFfaO9YmXsE` | email | SIM |
| assertivaCpfDecisor | `fldAcsxPyyMfRXmJ2` | singleLineText | SIM |
| assertivaIncomeEstimate | `fldLcwOxT7AThjdXw` | number | SIM |
| assertivaCreditScore | `fldK87LYk8GJzNnFV` | number | SIM |
| assertivaSocialMedia | `fldx1SkBKXXcbsxaY` | multilineText | SIM |
| assertivaEnrichDate | — | **NÃO EXISTE** | — |
| assertivaBehavioralData | — | **NÃO EXISTE** | — |
| assertivaTier | — | **NÃO EXISTE** | — |

**Mapeamento completo de Field IDs — Tabela Contacts:**

| Campo | Field ID | Tipo |
|-------|----------|------|
| name | `fldnP5Nv7I4bxKohq` | singleLineText |
| whatsapp | `fldaRqlIC0D6sxRgm` | phoneNumber |
| contactType | `fldtKbUnJH47E0IKB` | singleSelect |
| source | `fldlzSs66OcbhCLIu` | singleSelect |
| whatsappConfirmed | `fldMY9uwCUYFrZGfR` | checkbox |
| Lead (linked) | `fldTOTIfGn70ozcqm` | multipleRecordLinks |
| **phone** | **NÃO EXISTE** | — |

**Worker Cloudflare — User-Agent obrigatório:**
- O Cloudflare Bot Fight Mode bloqueia requisições com User-Agent de bibliotecas (Python-urllib, etc.)
- SEMPRE enviar User-Agent de navegador: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36`

---

## Configuração do Claude Code

Para tarefas que envolvam agentes, workflows ou padrões do framework AIOX, consultar `.claude/CLAUDE.md`. Esse arquivo contém regras de agentes, handoff, e execução de workflows — mas o `OUTBILI.md` é sempre o arquivo-mãe e tem prioridade.

---

## Funcionalidades principais

1. **Pesquisa em massa** — busca leads por segmento, estado, cidade, faturamento via CNPJa + Assertiva
2. **Cadastro manual** — formulário com enriquecimento automático CNPJa + Assertiva por CNPJ
3. **Upload de lista** — importa arquivos (Excel, CSV, HTML, PDF) com até 15 leads, enriquece automaticamente
4. **Pipeline Kanban** — funil visual com drag-and-drop e stage gates (checklists por etapa): Prospecção > Qualificação > Contactado > Respondeu > Reunião > Proposta > Fechado
5. **Perfil da empresa** — score SPICED, 6 tabs (3 primárias: Resumo, SPICED, Reunião + 3 análises BDR: Diagnóstico de Travas, Projeção Competitiva, Playbook BDR). Análises conectadas à metodologia Fábrica de Receita V4 (8 travas + framework STEP)
6. **Campanhas WhatsApp** — cadências outbound com tracking via BilinskiZap, KPIs contextuais
7. **Mensagens** — inbox WhatsApp integrado (sidebar: "Mensagens", mobile: "Msgs")
8. **Dashboard** — KPIs com micro-narrativas, temperatura com hints de ação, ações rápidas orientadas
9. **Relatórios** — métricas com benchmarks, projeções com fórmulas explícitas, recomendações condicionais
10. **Re-enriquecimento** — batch re-enrichment com diagnóstico (AdminPage > tab Enriquecimento)
11. **Autenticação** — login com Users table, useAuth hook, proteção de rotas
12. **Administração** — AdminPage com 3 tabs: Atividades, Usuários, Enriquecimento

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

### Classificação SPICED → Temperatura
- **Score 3.7 – 5.0** → Quente ("Lead qualificado")
- **Score 2.5 – 3.6** → Morno ("Potencial médio")
- **Score 1.0 – 2.4** → Frio ("Necessita qualificação")
- Fórmula: `Score = (S × 25%) + (P × 25%) + (I × 20%) + (C × 15%) + (D × 15%)`
- Fontes: CNPJá (cadastral) + Assertiva (CNPJ + CPF decisor)

### Storytelling de dados
- Números com contexto: Score 3.8 → "Lead qualificado"
- Taxas com benchmark: 15% → "abaixo do benchmark (30%)"
- Valores monetários com fórmula: "Baseado em 10-15% do faturamento anual"
- Enrichment legível: "Enriquecido", "Processando...", "Dados completos"

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
| `docs/airtable-formulas-views.md` | Fórmulas e views do Airtable |
