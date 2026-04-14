# OUTBILI — System Guide End-to-End

> Guia completo da jornada do usuario, processos, fluxos de dados e pontos de validacao do sistema OUTBILI.

**Versao:** 2.0 | **Data:** 2026-04-14 | **Autor:** Orion (AIOX Master)

---

## 1. Visao Geral do Sistema

**OUTBILI** e um sistema de prospecao outbound B2B construido para a V4 Bilinski & Co. Seu proposito e encontrar, qualificar e prospectar empresas via WhatsApp com inteligencia de marketing completa.

### 1.1 Proposta de Valor

```
Pesquise > Analise > Prospecte > Converta
```

O sistema transforma uma busca por segmento/localizacao em leads qualificados com score SPICED, argumentos de venda prontos, analise competitiva e disparo de campanhas WhatsApp — tudo em um unico fluxo.

### 1.2 Arquitetura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                    OUTBILI (React SPA)                          │
│  Vite + React 19 + TypeScript + Tailwind v4 + TanStack Query   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Search   │  │ Leads    │  │ Company   │  │ Campaigns    │  │
│  │ Page     │→ │ Page     │→ │ Page (7   │→ │ Page         │  │
│  │          │  │ Table+   │  │ tabs de   │  │ WhatsApp     │  │
│  │          │  │ Kanban   │  │ analise)  │  │ dispatch     │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │              │              │               │          │
├───────┼──────────────┼──────────────┼───────────────┼──────────┤
│       ▼              ▼              ▼               ▼          │
│  ┌─────────┐   ┌──────────┐  ┌──────────┐   ┌─────────────┐  │
│  │ CNPJa   │   │ Airtable │  │ Apify    │   │ BilinskiZap │  │
│  │ API     │   │ REST API │  │ Actors   │   │ WhatsApp    │  │
│  │(central)│   │ (10 tab) │  │ (social) │   │             │  │
│  └────┬────┘   └──────────┘  └──────────┘   └─────────────┘  │
│       │                                                        │
│       ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Assertiva Localize (Worker proxy | n8n fallback)     │      │
│  │ Telefones validados + WhatsApp + email               │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Stack Tecnologico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Roteamento | React Router DOM v7 (HashRouter) |
| Estilizacao | Tailwind CSS v4 |
| Estado/Dados | TanStack React Query v5 |
| Graficos | Recharts v3 |
| Database | Airtable (REST API — 10 tabelas) |
| Enriquecimento cadastral | CNPJa API (searchOffice + mapCnpjaToLead) |
| Enriquecimento telefone | Assertiva Localize (Worker proxy primario, n8n fallback) |
| Automacao | n8n (self-hosted em `n8n.bilinski.cloud`) |
| Scraping | Apify (8 actors) |
| WhatsApp | BilinskiZap API |
| Deploy | Static files (base path `/outbili/`) |

---

## 2. Mapa de Rotas e Páginas

| Rota | Página | Menu Sidebar | Propósito |
|------|--------|-------------|-----------|
| `/#/` | DashboardPage | Dashboard | KPIs com micro-narrativas, próximas ações orientadas |
| `/#/search` | SearchPage | Pesquisa | Descoberta de leads (PESCA CNPJá + manual + upload) |
| `/#/leads` | LeadsPage | Leads | Tabela com filtros e busca por texto |
| `/#/leads/:id` | CompanyPage | — | Perfil do lead com 9 tabs (4 primárias + 5 em "Análises") |
| `/#/pipeline` | PipelinePage | Pipeline | Kanban drag-and-drop com stage gates |
| `/#/inbox` | InboxPage | Mensagens | Inbox WhatsApp integrado |
| `/#/campaigns` | CampaignsPage | Campanhas | Gestão de campanhas WhatsApp |
| `/#/campaigns/new` | CampaignsPage | — | Criação de nova campanha |
| `/#/campaigns/:id` | CampaignsPage | — | Detalhe com KPIs contextuais |
| `/#/reports` | ReportsPage | Relatórios | Métricas com benchmarks e recomendações |
| `/#/settings` | SettingsPage | Configurações | Conexões API e templates |
| `/#/admin` | AdminPage | Administração | Atividades, usuários, enriquecimento (admin only) |
| `/#/login` | LoginPage | — | Autenticação |

> **Copy Standards:** Sidebar usa "Mensagens" (nunca "Inbox"), mobile usa "Msgs". Ver seção Copy Standards em `OUTBILI.md`. Usar `/copy-squad` para criar ou revisar copys do sistema.

---

## 3. Jornada do Usuario — End-to-End

### 3.0 Mapa Visual da Jornada Completa

```
 DESCOBERTA       QUALIFICACAO       ADS INTEL          PROSPECAO          CONVERSAO
 ─────────       ─────────────      ──────────         ──────────         ─────────

 ┌─────────┐    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  ┌──────────┐
 │ Search  │───>│ Leads Table  │──>│ Thamyres     │──>│ Company Page │─>│ Campaign │
 │ Page    │    │ (filtrar/    │   │ *ads-intel   │   │ (7 tabs de   │  │ WhatsApp │
 │         │    │  ordenar)    │   │ *map-company │   │  inteligencia│  │          │
 └─────────┘    └──────────────┘   └──────────────┘   └──────────────┘  └──────────┘
      │                │                  │                   │               │
      ▼                ▼                  ▼                   ▼               ▼
 ┌─────────┐    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ ┌──────────┐
 │ Import  │    │ Kanban View  │   │ Relatorio    │   │ Tab Reuniao  │ │ Reports  │
 │ Modal   │    │ (pipeline)   │   │ HTML gerado  │   │ Tab Projecao │ │ Page     │
 │ CSV/XLS │    │              │   │ (Baziotti UX)│   │ Tab Vulner.  │ │ Funil    │
 └─────────┘    └──────────────┘   └──────────────┘   │ Tab Compet.  │ └──────────┘
                                                       │ Tab Argum.   │
                                                       │ Tab Contatos │
                                                       └──────────────┘
```

---

### 3.1 FASE 1: Descoberta de Leads

**Pagina:** `SearchPage` (`/#/search`)

**Objetivo:** Encontrar empresas que se encaixam no ICP (Ideal Customer Profile).

#### Fluxo do Usuario

```
1. Usuario acessa /#/search
2. Preenche formulario:
   - Segmentos (multi-select): ex. "Restaurantes", "Clinicas"
   - Localizacao: Estado + Cidade
   - Faixa de faturamento: min/max
   - Keywords adicionais (opcional)
3. Clica "Pesquisar"
4. Frontend chama CNPJa API diretamente (searchOffice)
5. Resultados mapeados via mapCnpjaToLead
6. Leads salvos no Airtable com enrichmentStatus: 'cnpja'
7. Assertiva enriquece telefones/WhatsApp (via Worker proxy, fallback n8n)
8. enrichmentStatus atualizado: 'cnpja' → 'assertiva' → 'complete'
9. Historico de busca salvo em localStorage (key: outbili_search_history)
```

#### Fluxo de Dados (Frontend direto)

```
SearchPage              CNPJa API                  Assertiva              Airtable
    │                       │                          │                      │
    │─── GET /office/search─>│                          │                      │
    │    {cnaeCodes, states, │                          │                      │
    │     capital, excludeMei}│                          │                      │
    │<── Empresas ───────────│                          │                      │
    │                        │                          │                      │
    │── mapCnpjaToLead()     │                          │                      │
    │── Salvar Leads ────────────────────────────────────────────────────────>│
    │── Salvar Contacts ─────────────────────────────────────────────────────>│
    │                        │                          │                      │
    │── Worker proxy / n8n ────────────────────────────>│                      │
    │   (telefones, WhatsApp)│                          │                      │
    │                        │  ┌── Localize CNPJ ──────│                      │
    │                        │  └── Localize CPF ───────│                      │
    │                        │                          │── PATCH Lead ──────>│
    │                        │                          │── PATCH Contact ───>│
    │                        │                          │                      │
    │ [enrichmentStatus: 'cnpja' → 'assertiva' → 'complete']                  │
```

#### Pontos de Validacao — Fase 1

| # | Checkpoint | Tipo | Criterio |
|---|-----------|------|----------|
| 1.1 | Formulario preenchido | Frontend | Pelo menos 1 segmento + 1 localizacao |
| 1.2 | CNPJa API chamada | Frontend | GET /office/search retorna resultados |
| 1.3 | Leads mapeados | Frontend | mapCnpjaToLead() converte schema CNPJa |
| 1.4 | Leads salvos no Airtable | Frontend → Airtable | Records criados com enrichmentStatus 'cnpja' |
| 1.5 | Assertiva enriquece | Worker/n8n | Telefones/WhatsApp validados |
| 1.6 | enrichmentStatus progride | Airtable | cnpja → assertiva → complete |
| 1.7 | Frontend exibe dados | Frontend | Dados enriquecidos visiveis |
| 1.8 | Historico salvo | Frontend | localStorage atualizado |

#### Fluxo Alternativo: Importacao Manual

```
1. Usuario clica "Importar" no LeadsPage
2. ImportModal abre (4 etapas):
   a. Upload: drag-and-drop ou click (CSV, Excel, HTML, PDF, TXT)
   b. Leitura: file-parser.ts processa o arquivo
   c. Preview: detecta campos automaticamente, usuario confirma mapeamento
   d. Importacao: cria leads em batch no Airtable (lotes de 10)
3. Leads aparecem na tabela
```

---

### 3.2 FASE 2: Qualificacao de Leads

**Pagina:** `LeadsPage` (`/#/leads`)

**Objetivo:** Filtrar, priorizar e mover leads pelo pipeline.

#### Fluxo do Usuario

```
1. Usuario acessa /#/leads
2. Visualiza leads em 2 modos:
   a. TABELA: lista com colunas (empresa, segmento, score, temperatura, status)
   b. KANBAN: colunas por status do pipeline
3. Aplica filtros:
   - Segmento (dropdown)
   - Temperatura: HOT / WARM / COLD
   - Status: Novo / Qualificado / Contactado / etc.
4. Ordena por score SPICED (decrescente) para priorizar
5. Clica em um lead → navega para CompanyPage (/#/leads/:id)
```

#### Modelo de Qualificacao SPICED

```
┌───────────────────────────────────────────────────────┐
│                   SPICED SCORING                       │
├──────────────┬──────┬─────────────────────────────────┤
│ Dimensao     │ Peso │ O que avalia                    │
├──────────────┼──────┼─────────────────────────────────┤
│ S (Situacao) │ 25%  │ Maturidade digital da empresa   │
│ P (Dor/Pain) │ 25%  │ Gaps de marketing identificados │
│ I (Impacto)  │ 20%  │ Potencial de uplift de receita  │
│ C (Critico)  │ 15%  │ Pressao competitiva             │
│ D (Decisao)  │ 15%  │ Acessibilidade do decisor       │
├──────────────┼──────┼─────────────────────────────────┤
│ TOTAL        │100%  │ Score final 0–5                 │
└──────────────┴──────┴─────────────────────────────────┘

Classificacao de Temperatura:
  Score >= 4.0 → HOT  (vermelho)
  Score >= 3.0 → WARM (laranja)
  Score <  3.0 → COLD (azul)
```

#### Tiers por Faturamento

| Tier | Faixa de Faturamento |
|------|---------------------|
| Micro+ | R$70k – R$100k |
| Small | R$100k – R$200k |
| Medium- | R$200k – R$830k |
| Medium= | R$830k – R$2M |

#### Pipeline de Status (Funil)

```
Novo → Qualificado → Contactado → Respondeu → Reuniao → Proposta → Fechado
  │                                                                    │
  └──────────────────── Perdido ◄──────────────────────────────────────┘
                    (pode sair de qualquer etapa)
```

#### Pontos de Validacao — Fase 2

| # | Checkpoint | Tipo | Criterio |
|---|-----------|------|----------|
| 2.1 | Leads carregados | Frontend → Airtable | listAllRecords retorna dados |
| 2.2 | Filtros funcionais | Frontend | Filtragem client-side correta |
| 2.3 | SPICED visivel | Frontend | Score e temperatura exibidos por lead |
| 2.4 | Kanban drag funcional | Frontend | Mudanca de coluna atualiza status |
| 2.5 | Navegacao para detalhe | Frontend | Click leva a /#/leads/:id correto |

---

### 3.3 FASE 3: Analise Profunda do Lead

**Pagina:** `CompanyPage` (`/#/leads/:id`)

**Objetivo:** Preparar o vendedor com inteligencia completa antes do contato.

#### Estrutura de 8 Abas

```
┌─────────────────────────────────────────────────────────────┐
│  CompanyPage — Header                                        │
│  [Nome] [Segmento] [Score: 4.2] [HOT] [Status: Qualificado]│
│  [Website] [Instagram] [LinkedIn] [WhatsApp]                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┬──────────┬───────────┬────────────┐            │
│  │ Resumo  │ Reuniao  │ Projecao  │ Vulnerab.  │            │
│  ├─────────┼──────────┼───────────┼────────────┤            │
│  │ Compet. │ Argum.   │ Contatos  │ Ads Intel  │            │
│  └─────────┴──────────┴───────────┴────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Detalhamento de Cada Aba

**Tab 1 — Resumo (default)**
- Dados gerais: CNPJ, faturamento, funcionarios, anos de mercado
- Resumo do negocio (businessSummary)
- Contexto de mercado (marketContext)
- Portfolio de produtos (productPortfolio)
- Stack tecnologico (techStack)
- SPICED score detalhado com notas por dimensao
- Trava hipotetica principal (hypotheticalTrap)
- Status de enriquecimento

**Tab 2 — Reuniao (TabReuniao)**
- Roteiro de reuniao estruturado em 5 blocos:
  1. **Rapport** — quebra-gelo personalizada
  2. **Discovery** — perguntas de descoberta baseadas no SPICED
  3. **Validacao** — confirmar dores e impacto
  4. **Proposta** — enquadrar solucao V4
  5. **Fechamento** — proximos passos
- Cada bloco tem sinais positivos (verde) e alertas (vermelho)
- Perguntas de descoberta geradas por IA (discoveryQuestions)

**Tab 3 — Projecao (TabProjecao)**
- 3 cenarios de receita calculados a partir do `monthlyRevenue`:
  - **Agressivo:** uplift de 40-60%
  - **Moderado:** uplift de 20-35%
  - **Conservador:** uplift de 10-15%
- Timeline de 3, 6 e 12 meses
- ROI projetado vs investimento V4

**Tab 4 — Vulnerabilidades (TabVulnerabilidades)**
- 8 cards pre-construidos de vulnerabilidades de marketing:
  1. SEO fraco / sem posicionamento organico
  2. Redes sociais inativas ou inconsistentes
  3. Sem funil de conversao digital
  4. Dependencia de um unico canal
  5. Ticket medio abaixo do potencial
  6. Sem estrategia de retencao
  7. Marca sem posicionamento claro
  8. Sem automacao de marketing
- Cada card mostra impacto financeiro estimado
- Dados vem do campo `vulnerabilities` (JSON) ou fallback para defaults

**Tab 5 — Competitiva (TabCompetitiva)**
- Matriz de competidores
- Radar chart comparativo
- Dados do campo `competitiveAnalysis` (JSON)

**Tab 6 — Argumentos (TabArgumentos)**
- Argumentos de venda contextualizados
- Objecoes previstas com contra-argumentos
- Impacto de ROI por argumento
- Dados do campo `salesArguments` (JSON)

**Tab 7 — Ads Intel (TabAdsIntel)** *(NOVO)*
- Botão "Gerar Relatório de Ads" que aciona coleta via Apify
- Fases: Meta Ads Library → SEMrush → Análise → Relatório
- Score cards: anúncios ativos, plataformas, authority score, DA
- Cards estilo Meta Ads Library com:
  - Imagens reais dos criativos (do Meta CDN)
  - Avatar real da página
  - Copy real do anúncio
  - Link "Ver detalhes do anúncio" → Meta Ads Library
  - Plataformas, data, contagem de variações
- Dados via `useAdsIntel` hook → `startFacebookAdsScrape` + `startSemrushScrape`
- Componente: `src/components/company/TabAdsIntel.tsx`
- Hook: `src/hooks/useAdsIntel.ts`

**Tab 8 — Contatos (TabContatos)**
- Lista de contatos vinculados ao lead
- Formulario inline para adicionar contato:
  - Nome, Cargo, Tipo (decisor/stakeholder/influenciador)
  - WhatsApp, Email
- CRUD via Airtable (tabela Contacts)

#### 8 Travas Hipoteticas (Framework de Diagnostico)

```
T1 Aquisicao        → "Como novos clientes chegam?"
T2 Conversao        → "Quantos visitantes viram clientes?"
T3 Ticket medio     → "Quanto cada cliente gasta?"
T4 Recorrencia      → "Clientes voltam a comprar?"
T5 Margem           → "A operacao e lucrativa?"
T6 Posicionamento   → "A marca se diferencia?"
T7 Escalabilidade   → "O negocio escala sem o dono?"
T8 Dependencia      → "Depende de um unico canal?"
```

#### Pontos de Validacao — Fase 3

| # | Checkpoint | Tipo | Criterio |
|---|-----------|------|----------|
| 3.1 | Lead carregado | Frontend → Airtable | getRecord retorna dados completos |
| 3.2 | Todas as 7 abas renderizam | Frontend | Nenhuma aba com erro/vazia sem motivo |
| 3.3 | SPICED detalhado visivel | Frontend | 5 dimensoes com score individual |
| 3.4 | Reuniao com 5 blocos | Frontend | Rapport, Discovery, Validacao, Proposta, Fechamento |
| 3.5 | Projecao com 3 cenarios | Frontend | Agressivo, Moderado, Conservador calculados |
| 3.6 | Contatos CRUD funcional | Frontend → Airtable | Criar, listar contatos |
| 3.7 | Vulnerabilidades renderizam | Frontend | 8 cards ou fallback para defaults |

---

### 3.4 FASE 4: Prospecao via WhatsApp

**Pagina:** `CampaignsPage` (`/#/campaigns`)

**Objetivo:** Disparar campanhas de WhatsApp segmentadas para os leads qualificados.

#### Fluxo do Usuario

```
1. Usuario acessa /#/campaigns
2. Visualiza campanhas existentes (lista com status)
3. Clica "Nova Campanha" (/#/campaigns/new)
4. Wizard de criacao:
   a. Selecionar tipo de campanha:
      - cadencia_outbound (primeira abordagem)
      - follow_up (acompanhamento)
      - reengajamento (leads frios)
   b. Selecionar template WhatsApp (sync com BilinskiZap)
   c. Selecionar leads/contatos alvo
   d. Definir agendamento
   e. Pre-check de contatos (validacao via BilinskiZap)
5. Confirma e dispara campanha
6. Acompanha metricas em tempo real:
   - Mensagens enviadas / entregues / lidas / respondidas
```

#### Fluxo de Dados — Campanha

```
CampaignsPage           BilinskiZap API              WhatsApp
     │                       │                          │
     │── GET /templates ────>│                          │
     │<── Lista templates ───│                          │
     │                       │                          │
     │── POST /precheck ────>│                          │
     │   {contacts}          │                          │
     │<── Validacao ─────────│                          │
     │                       │                          │
     │── POST /campaigns ───>│                          │
     │   {template, leads,   │                          │
     │    schedule}           │── Dispatch mensagens ──>│
     │<── Campaign created ──│                          │
     │                       │                          │
     │── GET /campaigns/:id  │                          │
     │   /messages ─────────>│                          │
     │<── Delivery status ───│   (enviado/entregue/     │
     │                       │    lido/respondido)       │
     │                       │                          │
     │── POST /pause ───────>│  (controle de campanha)  │
     │── POST /resume ──────>│                          │
     │── POST /cancel ──────>│                          │
```

#### Tipos de Campanha

| Tipo | Objetivo | Gatilho |
|------|----------|---------|
| `cadencia_outbound` | Primeira abordagem fria | Lead status = Qualificado |
| `follow_up` | Seguimento apos contato | Lead status = Contactado / Respondeu |
| `reengajamento` | Reativar leads frios | Lead temperature = COLD + inativo > 30d |

#### Pontos de Validacao — Fase 4

| # | Checkpoint | Tipo | Criterio |
|---|-----------|------|----------|
| 4.1 | Templates sincronizados | Frontend → BilinskiZap | GET /templates retorna lista |
| 4.2 | Pre-check de contatos | Frontend → BilinskiZap | Todos contatos validados |
| 4.3 | Campanha criada | Frontend → BilinskiZap | POST retorna campaign ID |
| 4.4 | Dispatch executado | BilinskiZap → WhatsApp | Mensagens entram na fila |
| 4.5 | Metricas atualizando | Frontend → BilinskiZap | GET /messages retorna status |
| 4.6 | Campanha registrada no Airtable | Frontend → Airtable | Record criado na tabela Campaigns |

---

### 3.5 FASE 5: Acompanhamento e Conversao

**Paginas:** `DashboardPage` (`/#/`) + `ReportsPage` (`/#/reports`)

#### Dashboard — KPIs em Tempo Real

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Leads  │ Qualificados │ Em Prospecao │ Convertidos  │
│     247      │     89       │     34       │     12       │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Pipeline Funnel (Recharts)                                  │
│  Novo(247) → Qualif(89) → Contact(34) → Resp(18) →         │
│  Reuniao(12) → Proposta(8) → Fechado(5)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Proximas Acoes                                              │
│  - 5 leads HOT sem contato                                   │
│  - 3 follow-ups pendentes                                    │
│  - 2 reunioes esta semana                                    │
└─────────────────────────────────────────────────────────────┘
```

#### Reports — Analytics Detalhado

- Funil de conversao por etapa (com taxa de conversao entre etapas)
- Metricas WhatsApp: taxa de entrega, leitura, resposta
- Breakdown por segmento
- Performance por periodo

#### Pontos de Validacao — Fase 5

| # | Checkpoint | Tipo | Criterio |
|---|-----------|------|----------|
| 5.1 | KPIs calculados corretamente | Frontend | Contagens batem com Airtable |
| 5.2 | Funil renderiza | Frontend | Recharts exibe todas as etapas |
| 5.3 | Proximas acoes relevantes | Frontend | Leads HOT priorizados |
| 5.4 | Metricas WhatsApp atualizadas | Frontend → BilinskiZap | Dados refletem status real |

---

### 3.6 FASE 6: Ads Intelligence (Thamyres)

**Agente:** `@thamyres` / Skill: `/thamyres-spy`
**Comando principal:** `*ads-intel {url}`
**Output:** Relatório HTML em `public/reports/ads-intel-{empresa}.html`

**Objetivo:** Gerar relatório completo de inteligência de anúncios de qualquer empresa antes da abordagem outbound — entender quanto investem, quais criativos rodam, em quais plataformas e qual a sofisticação de marketing.

#### Fluxo Validado (Processo Padrão)

```
1. Ativar Thamyres:  @thamyres  ou  /thamyres-spy
2. Executar comando:  *ads-intel https://www.empresa.com.br/
3. Thamyres executa 4 frentes em paralelo:

   ┌──────────────────────────────────────────────────────────────────────┐
   │                    COLETA PARALELA (Apify MCP)                       │
   │                                                                      │
   │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  │
   │  │ Meta Ads     │  │ Google SERP │  │ SEMrush  │  │ Web Scraper  │  │
   │  │ Library      │  │ (branded +  │  │ (author. │  │ (pixels,     │  │
   │  │ (anuncios    │  │  paid ads)  │  │  score,  │  │  tracking,   │  │
   │  │  ativos)     │  │             │  │  DA, spam│  │  tech stack) │  │
   │  └──────┬───────┘  └──────┬──────┘  └────┬─────┘  └──────┬───────┘  │
   │         │                 │               │               │          │
   │         ▼                 ▼               ▼               ▼          │
   │  ┌────────────────────────────────────────────────────────────────┐  │
   │  │              CRUZAMENTO DE DADOS + ANÁLISE                     │  │
   │  │  - Criativos reais com imagens/vídeos do Meta CDN              │  │
   │  │  - Copy real dos anúncios                                      │  │
   │  │  - Plataformas de distribuição                                 │  │
   │  │  - Score de sofisticação (0-10)                                │  │
   │  │  - Estimativa de investimento mensal                           │  │
   │  │  - Cobertura de funil (TOFU/MOFU/BOFU)                        │  │
   │  │  - Gaps e oportunidades                                        │  │
   │  └────────────────────────────────────────────────────────────────┘  │
   │                              │                                       │
   │                              ▼                                       │
   │  ┌────────────────────────────────────────────────────────────────┐  │
   │  │          GERAÇÃO DO RELATÓRIO HTML (/baziotti UX)              │  │
   │  │  - Paleta Outbili (dark premium, vermelho #E63329)             │  │
   │  │  - Cards estilo Meta Ads Library com dados reais               │  │
   │  │  - Imagens dos criativos direto do Meta CDN                    │  │
   │  │  - Links clicáveis para cada anúncio real                      │  │
   │  │  - Animações de scroll + glassmorphism                         │  │
   │  │  - Responsivo (mobile-first)                                   │  │
   │  └────────────────────────────────────────────────────────────────┘  │
   └──────────────────────────────────────────────────────────────────────┘

4. Relatório salvo em: public/reports/ads-intel-{empresa}.html
5. Aberto automaticamente no navegador
```

#### Ferramentas MCP Utilizadas (Apify)

| Ferramenta | Tool ID | Dados Coletados |
|-----------|---------|----------------|
| Facebook Ads Scraper | `apify/facebook-ads-scraper` | Anúncios ativos, criativos, copies, imagens, CTAs, plataformas |
| Google Search Scraper | `apify/google-search-scraper` | Presença em SERPs, paid ads, sitelinks |
| SEMrush Scraper | `radeance/semrush-scraper` | Authority Score, DA, Spam Score |
| Web Scraper | `apify/web-scraper` | Pixels, tracking, tech stack do site |
| RAG Web Browser | `apify/rag-web-browser` | Conteúdo profundo do site |

#### Estrutura do Relatório HTML (10 Seções)

| Seção | Conteúdo | Fonte de Dados |
|-------|----------|---------------|
| Score Hero | 4 KPIs principais (sofisticação, ads ativos, authority, investimento) | Todos |
| 1. Meta Ads | Cards estilo Ads Library com imagens reais, copy, CTAs | `facebook-ads-scraper` |
| 2. Google Ads | Detecção de paid results em buscas branded | `google-search-scraper` |
| 3. SEO & Autoridade | Authority Score, DA, Spam Score, presença orgânica | `semrush-scraper` |
| 4. Pixels & Tracking | GTM, GA4, Meta Pixel, LinkedIn, TikTok | `web-scraper` |
| 5. Presença Social | LinkedIn, Instagram, YouTube, TikTok, Facebook | `google-search-scraper` |
| 6. Estimativa de Investimento | Gasto mensal estimado por canal | Cruzamento de sinais |
| 7. Score de Sofisticação | 7 dimensões avaliadas (0-10 cada) | Análise consolidada |
| 8. Cobertura de Funil | Mapeamento TOFU/MOFU/BOFU | Criativos + presença |
| 9. Gaps & Oportunidades | Vulnerabilidades detectadas para abordagem | Análise consolidada |
| 10. Fontes & Confiança | Cada dado com nível VERIFIED/HIGH/MEDIUM/ESTIMATED | Meta-dados |

#### Design System Aplicado (Baziotti UX + Outbili)

| Aspecto | Aplicação |
|---------|-----------|
| Paleta | Dark premium: `#09090B` (bg), `#0F0F12` (surface), `#E63329` (brand red) |
| Tipografia | Plus Jakarta Sans (headings), Inter (body), JetBrains Mono (dados) |
| Hierarquia visual | F-Pattern, seções numeradas, score cards hero (ancoragem) |
| Carga cognitiva | Chunks de informação (Lei de Miller), progressive disclosure |
| Animações | Intersection Observer, barras animadas, pulse glow, gradient shift |
| Acessibilidade | `prefers-reduced-motion`, contraste adequado, touch targets 44px+ |
| Cards de anúncio | Estilo Meta Ads Library com imagem real, avatar, copy, link direto |

#### Pontos de Validação — Fase 6

| # | Checkpoint | Tipo | Critério |
|---|-----------|------|----------|
| 6.1 | Thamyres ativada | Agent | `@thamyres` responde com greeting |
| 6.2 | Meta Ads Library scrapeada | Apify MCP | `facebook-ads-scraper` retorna ads com imagens |
| 6.3 | SEMrush dados coletados | Apify MCP | `semrush-scraper` retorna authority score |
| 6.4 | Google SERPs analisadas | Apify MCP | Resultados orgânicos + paid detectados |
| 6.5 | Relatório HTML gerado | File system | Arquivo criado em `public/reports/` |
| 6.6 | Cards com imagens reais | HTML | Imagens do Meta CDN carregam corretamente |
| 6.7 | Links de anúncios funcionam | HTML | Cada card abre o anúncio real na Meta Ads Library |
| 6.8 | Design Outbili aplicado | Visual | Paleta dark, fontes, glassmorphism corretos |
| 6.9 | Responsivo | Visual | Layout funciona em mobile e desktop |
| 6.10 | Relatório abre no navegador | OS | `open` abre o arquivo com sucesso |

#### Caso Validado: Contabilizei (2026-03-27)

Primeiro relatório gerado com sucesso:
- **Alvo:** contabilizei.com.br
- **Resultado:** 20+ anúncios ativos detectados, 6 cards com imagens reais, Authority Score 66
- **Arquivo:** `public/reports/ads-intel-contabilizei.html`
- **Tempo de execução:** ~5 minutos (coleta paralela)
- **Iterações de design:** 3 (tabela técnica → cards humanizados → cards com dados reais do Meta CDN)

---

## 4. Enriquecimento de Dados

### 4.1 Pipeline principal (3 fases)

| Fase | Fonte | Dados | Status resultante |
|------|-------|-------|-------------------|
| 1. Cadastral | CNPJa API (searchOffice + mapCnpjaToLead) | CNPJ, razao social, nome fantasia, socios, capital, endereco, CNAE, telefones RF | `cnpja` |
| 2. Telefone/WhatsApp | Assertiva Localize (Worker proxy primario, n8n fallback) | Telefones validados, WhatsApp confirmado, email verificado | `assertiva` |
| 3. Social/Digital | Apify Actors (sob demanda) | Instagram, SEO, ads, trafego | `complete` |

**Assertiva `_quantidadeFuncionarios` SEMPRE sobrescreve estimativa CNPJa** (fix 2026-04-14).

### 4.2 Re-enriquecimento (batch)

Substituiu o antigo `scripts/enrich-leads.py`. Agora roda direto no frontend:

- **Funcao:** `reEnrichLead()` em `enrichmentService.ts` — CNPJa + Assertiva only (sem Apify), force-writes campos
- **Diagnostico:** `leadNeedsReEnrich()` — identifica leads com dados faltantes
- **Hook:** `src/hooks/useReEnrichment.ts` — batch com concurrency=2, progress tracking
- **UI:** AdminPage > tab Enriquecimento — cards diagnosticos + botoes de batch re-enrichment

### 4.3 Enriquecimento via Apify (sob demanda)

Actors disponiveis para enriquecimento adicional:

| Actor | Dados Coletados |
|-------|----------------|
| `compass~crawler-google-places` | Google Maps |
| `apify~instagram-scraper` | Perfil Instagram, seguidores, posts |
| `apify~website-content-crawler` | Conteudo do site, tech stack |
| `apify~facebook-ads-scraper` | Anuncios ativos no Facebook |
| `misceres~seo-audit-tool` | Audit SEO completo |
| `radeance~ahrefs-scraper` | Domain Authority, backlinks |
| `ecomdate~similarweb-scraper` | Trafego estimado |
| `radeance~semrush-scraper` | Keywords, posicionamento |

### 4.4 Status de Enriquecimento

```
none → cnpja → assertiva → complete
  │      │         │            │
  │      │         │            └── Todos os dados (incluindo Apify/social)
  │      │         └──────────────── Telefones/WhatsApp validados (Assertiva)
  │      └────────────────────────── Dados cadastrais CNPJa (razao social, socios, capital)
  └───────────────────────────────── Sem dados (recem-importado)
```

---

## 5. Integracao de Sistemas — Mapa Completo

### 5.1 Airtable (Database)

**10 Tabelas:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     LEADS       │     │    CONTACTS     │     │   CAMPAIGNS     │
│─────────────────│     │─────────────────│     │─────────────────│
│ companyName     │◄────│ leadId (FK)     │     │ name            │
│ cnpj            │     │ name            │     │ type            │
│ segment         │     │ role            │     │ status          │
│ tier            │     │ contactType     │     │ leadIds (array) │
│ status          │     │ whatsapp        │     │ messagesSent    │
│ score           │     │ email           │     │ delivered       │
│ temperatura     │     │ whatsappConfirmed│     │ read            │
│ spicedS/P/I/C/D│     │ phoneIsHot      │     │ responses       │
│ vulnerabilities │     │ source          │     └─────────────────┘
│ salesArguments  │     │ (NO phone field)│
│ meetingPrep     │     └─────────────────┘     ┌─────────────────┐
│ enrichmentStatus│                              │   MESSAGES      │
│ rfPhone         │     ┌─────────────────┐     │─────────────────│
│ ...             │     │   ACTIVITIES    │     │ (WhatsApp msgs) │
└─────────────────┘     │─────────────────│     └─────────────────┘
                        │ leadId (FK)     │
┌─────────────────┐     │ contactId (FK)  │     ┌─────────────────┐
│    PARTNERS     │     │ type            │     │   SEGMENTS      │
│─────────────────│     │ description     │     │─────────────────│
│ (Socios QSA)    │     │ createdBy       │     │ (Segmentos)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   TRADEMARKS    │     │     USERS       │     │  ACTIVITYLOG    │
│─────────────────│     │─────────────────│     │─────────────────│
│ (Marcas INPI)   │     │ (Auth + roles)  │     │ (Audit trail)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐
│ ENRICHMENTLOG   │
│─────────────────│
│ (Log de enrich) │
└─────────────────┘
```

**NOTA:** O campo `enrichmentStatus` na tabela Leads e do tipo `singleLineText` (NAO singleSelect).
O campo `temperatura` e o nome no Airtable para temperature (code usa `temperature`, mapeado via FIELD_TO_AIRTABLE).

**Rate Limiting:** Token-bucket (5 req/s) com auto-retry em HTTP 429.

### 5.2 n8n (Automacao)

- **Host:** `n8n.bilinski.cloud`
- **Webhook:** `POST /webhook/outbili-search`
- **Assertiva fallback:** `VITE_N8N_ASSERTIVA_PROXY` (usado quando Worker proxy falha)
- **NOTA:** PESCA agora roda direto do frontend via CNPJa API. n8n usado como fallback Assertiva.

### 5.3 BilinskiZap (WhatsApp)

- **Host:** `bilinskizap.vercel.app`
- **Auth:** Bearer token via header
- **Endpoints principais:**

| Metodo | Endpoint | Funcao |
|--------|----------|--------|
| GET | `/api/campaigns` | Listar campanhas |
| POST | `/api/campaigns` | Criar campanha |
| GET | `/api/campaigns/:id` | Detalhe da campanha |
| GET | `/api/campaigns/:id/messages` | Status de mensagens |
| POST | `/api/campaign/dispatch` | Disparar campanha |
| POST | `/api/campaign/:id/pause` | Pausar |
| POST | `/api/campaign/:id/resume` | Retomar |
| POST | `/api/campaign/:id/cancel` | Cancelar |
| POST | `/api/campaign/precheck` | Validar contatos |
| GET/POST | `/api/contacts` | CRUD contatos |
| POST | `/api/contacts/import` | Import bulk |
| GET | `/api/contacts/stats` | Metricas opt-in/out |
| GET/POST | `/api/templates` | Templates WhatsApp |
| GET | `/api/health` | Health check |

### 5.4 Apify (Scraping)

- **Auth:** Token via header ou query param
- **8 Actors** configurados (ver secao 4.3)
- **Chamada direta do frontend** (useApifySearch) OU **via n8n** (fluxo principal)

---

## 6. Configuracao e Saude do Sistema

### 6.1 Variaveis de Ambiente

```env
# Airtable
VITE_AIRTABLE_PAT=                    # Personal Access Token
VITE_AIRTABLE_BASE_ID=                # ID da base (ex: appXXXXXX)

# BilinskiZap
VITE_BILINSKIZAP_URL=                 # Default: https://bilinskizap.vercel.app
VITE_BILINSKIZAP_API_KEY=             # Bearer token

# Apify
VITE_APIFY_TOKEN=                     # API token

# n8n
VITE_N8N_WEBHOOK_URL=                 # Default: https://n8n.bilinski.cloud/webhook/outbili-search
VITE_N8N_ASSERTIVA_PROXY=             # Webhook n8n fallback Assertiva

# CNPJa
VITE_CNPJA_API_KEY=                   # API key CNPJa (73 chars)

# Assertiva
VITE_ASSERTIVA_CLIENT_ID=             # OAuth2 client ID
VITE_ASSERTIVA_CLIENT_SECRET=         # OAuth2 client secret
VITE_ASSERTIVA_WORKER_URL=            # Worker proxy URL (primario)

# VibeProspecting
VITE_VIBEPROSPECTING_URL=             # URL VibeProspecting
VITE_VIBEPROSPECTING_TOKEN=           # Token VibeProspecting
```

### 6.2 Settings Page — Health Checks

A pagina `/#/settings` verifica em tempo real:

| Servico | Teste | Indicador |
|---------|-------|-----------|
| Airtable | GET /tables | Verde/Vermelho |
| BilinskiZap | GET /api/health | Verde/Vermelho |
| Apify | GET /v2/acts | Verde/Vermelho |
| n8n | Webhook configured | Verde/Vermelho |

---

## 7. Checklist de Validacao End-to-End

### 7.1 Pre-requisitos

- [ ] Variaveis de ambiente configuradas (.env.local)
- [ ] Airtable base criada com 10 tabelas (Leads, Contacts, Campaigns, Activities, Messages, Segments, Users, ActivityLog, Partners, Trademarks, EnrichmentLog)
- [ ] CNPJa API key configurada e com creditos
- [ ] Assertiva OAuth2 credentials configuradas (client_id + client_secret)
- [ ] n8n workflow importado e ativo
- [ ] BilinskiZap conectado com numero WhatsApp
- [ ] Apify token com creditos disponiveis

### 7.2 Teste de Jornada Completa

| Etapa | Acao | Resultado Esperado | Status |
|-------|------|--------------------|--------|
| 1 | Acessar /#/settings | Todos os 4 servicos verdes | [ ] |
| 2 | Pesquisar "Restaurantes + Sao Paulo" | Webhook disparado, polling inicia | [ ] |
| 3 | Aguardar resultados (max 5min) | Leads aparecem com score SPICED | [ ] |
| 4 | Acessar /#/leads | Tabela com leads filtrados | [ ] |
| 5 | Alternar para Kanban | Colunas por status renderizam | [ ] |
| 6 | Clicar em lead HOT | CompanyPage abre com 7 abas | [ ] |
| 7 | Verificar Tab Resumo | Dados completos do lead | [ ] |
| 8 | Verificar Tab Reuniao | 5 blocos do roteiro | [ ] |
| 9 | Verificar Tab Projecao | 3 cenarios de receita | [ ] |
| 10 | Verificar Tab Vulnerabilidades | 8 cards renderizados | [ ] |
| 11 | Adicionar contato | Contato salvo no Airtable | [ ] |
| 12 | Criar campanha WhatsApp | Template selecionado, leads adicionados | [ ] |
| 13 | Pre-check contatos | Validacao retorna OK | [ ] |
| 14 | Disparar campanha | Mensagens enviadas via BilinskiZap | [ ] |
| 15 | Verificar /#/reports | Funil e metricas atualizados | [ ] |
| 16 | Verificar /#/ (dashboard) | KPIs refletem estado atual | [ ] |
| 17 | Ativar @thamyres | Agent responde com greeting | [ ] |
| 18 | Executar *ads-intel {url} | Coleta paralela inicia (4 frentes) | [ ] |
| 19 | Relatório HTML gerado | Arquivo em public/reports/ com dados reais | [ ] |
| 20 | Cards com imagens reais | Criativos do Meta CDN carregam | [ ] |
| 21 | Links para Meta Ads Library | Cada card abre o anúncio real | [ ] |

### 7.3 Teste de Import

| Etapa | Acao | Resultado Esperado | Status |
|-------|------|--------------------|--------|
| I.1 | Upload CSV com leads | Arquivo parseado corretamente | [ ] |
| I.2 | Preview de campos | Mapeamento automatico detectado | [ ] |
| I.3 | Confirmar importacao | Leads criados no Airtable (batch 10) | [ ] |
| I.4 | Verificar na tabela | Leads importados aparecem | [ ] |

### 7.4 Teste de Enriquecimento

| Etapa | Acao | Resultado Esperado | Status |
|-------|------|--------------------|--------|
| E.1 | Lead criado com enrichmentStatus=cnpja | Dados CNPJa presentes | [ ] |
| E.2 | Assertiva processa o lead | enrichmentStatus=assertiva, telefones validados | [ ] |
| E.3 | Verificar lead no app | enrichmentStatus=complete, dados completos | [ ] |

### 7.5 Teste de Re-enriquecimento

| Etapa | Acao | Resultado Esperado | Status |
|-------|------|--------------------|--------|
| R.1 | Acessar /#/admin > tab Enriquecimento | Cards diagnosticos visiveis | [ ] |
| R.2 | Clicar botao re-enrichment batch | Progress tracking inicia | [ ] |
| R.3 | Verificar leads atualizados | employees, yearsInMarket, foundingDate preenchidos | [ ] |
| R.4 | Assertiva sobrescreve employees CNPJa | _quantidadeFuncionarios SEMPRE prevalece | [ ] |

---

## 8. Riscos e Pontos de Atencao

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Rate limit Airtable (5 req/s) | Lentidao em listas grandes | Token-bucket implementado em `airtable.ts` |
| Apify credits esgotados | Pesquisa para de funcionar | Monitorar saldo no Apify dashboard |
| n8n workflow offline | Pesquisa nao processa | Health check em /#/settings |
| BilinskiZap desconectado | Campanhas nao disparam | Health check + precheck antes do envio |
| VITE_* expostas no frontend | Tokens visiveis no bundle | Sistema single-user interno; migrar para BFF se escalar |
| Sem autenticacao | Qualquer um com URL acessa | Proteger via VPN ou auth proxy se expor externamente |
| Airtable como DB primario | Limites de 50k records/base (free) | Monitorar volume; migrar para Supabase se necessario |

---

## 9. Comandos de Desenvolvimento

```bash
# Iniciar dev server
npm run dev

# Build para producao
npm run build

# Preview do build
npm run preview

# Lint
npm run lint

# Type check
npm run typecheck

# Enriquecer leads (Python)
cd scripts && python enrich-leads.py
```

---

## 10. Glossario

| Termo | Definicao |
|-------|-----------|
| **SPICED** | Framework de qualificacao: Situacao, Pain, Impacto, Critico, Decisao |
| **Trava Hipotetica** | Gargalo principal do negocio (1 de 8 categorias) |
| **Tier** | Classificacao por faturamento (Micro+, Small, Medium-, Medium=) |
| **Temperatura** | HOT/WARM/COLD baseado no score SPICED |
| **BilinskiZap** | API proprietaria para campanhas WhatsApp |
| **Cadencia Outbound** | Sequencia de mensagens para primeira abordagem |
| **ICP** | Ideal Customer Profile — perfil de cliente ideal |
| **Enrichment** | Processo de adicionar dados ao lead (SPICED, questions, etc.) |
| **Thamyres** | Agent de inteligência digital — espionagem de ads, presença digital, SEMrush |
| **Ads Intel** | Relatório de inteligência de anúncios gerado pela Thamyres |
| **DCO** | Dynamic Creative Optimization — anúncios automáticos com catálogo dinâmico |
| **Baziotti** | Skill de UX (psicologia no design) usada para gerar relatórios visuais |
| **Meta Ads Library** | Biblioteca pública de anúncios do Facebook/Instagram/Threads |
| **Authority Score** | Métrica SEMrush (0-100) que avalia a autoridade de um domínio |

---

*Documento gerado por Orion (AIOX Master) — 2026-04-14*
*Sistema: OUTBILI v2.0 — V4 Bilinski & Co*
