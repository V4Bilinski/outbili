# OUTBILI

Sistema de inteligência comercial e prospecção B2B com enriquecimento automático de leads.

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
| Enriquecimento Fase 1 | CNPJa API (dados cadastrais + sócios) |
| Enriquecimento Fase 2 | Assertiva via Cloudflare Worker (WhatsApp + CPF decisor) |
| Enriquecimento Fase 3 | Apify Actors (presença digital) |
| Proxy CORS | Cloudflare Worker (`outbili.v4bilinski-ferramentas.workers.dev`) |
| Automação WhatsApp | BilinskiZap API |

---

## Regras de Negócio Obrigatórias (INEGOCIÁVEL)

### Dados obrigatórios por lead

Todo lead salvo no sistema **DEVE** conter obrigatoriamente:

| Campo | Obrigatório | Fonte | Gate |
|-------|:-----------:|-------|------|
| Nome da empresa | **SIM** | CNPJa | Fase 1 |
| CNPJ | **SIM** | CNPJa | Fase 1 |
| Nome do decisor (sócio/administrador) | **SIM** | CNPJa (QSA) | Gate `searchViaCnpja()` |
| Telefone (celular ou fixo) | **SIM** | CNPJa | Gate `searchViaCnpja()` |
| Contact vinculado no Airtable | **SIM** | Sistema | Gate `savePescaToAirtable()` |

**Leads sem decisor ou sem telefone são DESCARTADOS automaticamente.**
Dois gates de proteção no código impedem leads incompletos:
1. `searchViaCnpja()` — `if (!decisorName || !phone) continue`
2. `savePescaToAirtable()` — filtra `validLeads` antes de salvar

### Hierarquia de telefone

| Prioridade | Tipo | Campo | Origem |
|:----------:|------|-------|--------|
| 1 | WhatsApp (celular MOBILE com flag) | `Contact.whatsapp` | Assertiva |
| 2 | Celular MOBILE (sem flag WhatsApp) | `Contact.whatsapp` | CNPJa |
| 3 | Telefone fixo | `Contact.phone` | CNPJa |
| 4 | Telefone RF da empresa | `Lead.rfPhone` | CNPJa |

### Prioridade de dados: Assertiva > CNPJa

Contacts da Assertiva (source=assertiva) são exibidos com **prioridade** sobre CNPJa.
O `contactService.getContacts()` ordena: WhatsApp confirmado primeiro, Assertiva primeiro.

---

## Fluxo de Enriquecimento Automático (5 Fases)

```
Usuário seleciona filtros → PESQUISAR
    │
    ▼
[FASE 1] CNPJa API — dados cadastrais + sócios + telefones
    │  Gate: decisor + telefone OBRIGATÓRIOS (descarta sem)
    ▼
[FASE 2] Fallback Enrichment — CNPJa individual + Assertiva para leads sem celular
    │  Cascata: CNPJa office → Assertiva CNPJ → Assertiva CPF do decisor
    │  Non-blocking: falha não impede save
    ▼
[FASE 3] Deduplicação — CNPJ + nome + WhatsApp
    │  Compara contra leads existentes no Airtable
    ▼
[FASE 4] Salvar no Airtable — Lead + Contact vinculado
    │  Gate: revalida decisor + telefone antes de salvar
    │  Contact criado com Lead linked record
    ▼
[FASE 5] Enriquecimento Assertiva Automático
    │  Worker Cloudflare (primário) → n8n (fallback)
    │  Para cada lead: busca WhatsApp validado do decisor
    │  Atualiza Contact com whatsapp + whatsappConfirmed
    │  React Query invalida cache → UI atualiza automaticamente
    ▼
RESULTADO: Lead completo com decisor + WhatsApp no painel
```

### Proxy Assertiva (resolução CORS)

A API Assertiva bloqueia CORS do browser. O proxy é automático:

| Componente | URL | Função |
|-----------|-----|--------|
| **Worker Cloudflare** (primário) | `outbili.v4bilinski-ferramentas.workers.dev` | OAuth2 server-side, sem CORS |
| **n8n webhook** (fallback) | `n8n.bilinski.cloud/webhook/assertiva-proxy` | Backup se Worker indisponível |

O `assertivaService.ts` tenta Worker primeiro; se falhar, tenta n8n automaticamente.
O código do Worker está em `workers/assertiva-proxy/index.js`.

---

## Funcionalidades

### Pesquisa de leads (PESCA)
- **Em massa:** busca por segmento, estado, cidade e porte via CNPJa API
- **Cadastro manual:** lead específico com enriquecimento automático
- **Upload de arquivo:** importa CSV, Excel, PDF, TXT, MD com até 15 leads
- **Validação obrigatória:** leads sem decisor ou telefone são descartados
- **Estimativa pré-busca:** "~50-150 empresas · ~2-4 min" antes de pesquisar
- **Erro contextual:** mensagem específica por tipo (sem resultados, rede, rate limit)

### Dashboard
- KPIs: Total leads, Quentes, Mornos, Frios com % do total
- Barra de distribuição visual de temperatura
- Próximas ações com score SPICED e botão "Ver ficha"
- Quick actions com descrições claras

### Pipeline Kanban
- 7 colunas: Prospecção → Qualificação → Contactado → Respondeu → Reunião → Proposta → Fechado
- Drag-and-drop com stage gate slide-over lateral
- Checks obrigatórios (*) vs opcionais, count badges por coluna

### Perfil da empresa
- 4 tabs primárias + dropdown "Mais" (Hick's Law)
- Primárias: Resumo, SPICED, Reunião, Campanhas
- Mais: Vulnerabilidades, Projeção, Competitiva, Objeções & Respostas, Anúncios
- Breadcrumb: Leads > Nome da Empresa
- Card do decisor: verde (WhatsApp) / neutro (fixo) / alerta (sem contato)
- Delete protegido em menu three-dot

### Relatórios
- Seletor de período: 7d / 30d / 90d / Tudo
- Funil de conversão, performance WhatsApp, ROI estimado
- Exportar CSV com 1 clique

### Campanhas WhatsApp
- Wizard com step indicator visual (4 steps)
- Preview de template, precheck de contatos
- Tracking: entrega, leitura, resposta

### Configurações
- Botão "Testar" em cada conexão API (Airtable, BilinskiZap, Apify)
- Detalhes expandíveis "Como resolver" para erros

---

## Deploy

Deploy automático via **GitHub Actions** para **GitHub Pages**.

**Fluxo:**
1. Push para `main`
2. GitHub Actions executa `tsc -b && vite build`
3. Artefato `dist/` publicado no GitHub Pages
4. URL: `https://v4bilinski.github.io/outbili/`

**Workflow:** `.github/workflows/deploy.yml`

**Secrets necessários** (Settings > Secrets > Actions):

| Secret | Descrição |
|--------|-----------|
| `VITE_AIRTABLE_PAT` | Token de acesso pessoal do Airtable |
| `VITE_AIRTABLE_BASE_ID` | ID da base do Airtable |
| `VITE_BILINSKIZAP_URL` | URL da API BilinskiZap |
| `VITE_BILINSKIZAP_API_KEY` | Chave da API BilinskiZap |
| `VITE_APIFY_TOKEN` | Token do Apify para enriquecimento |
| `VITE_N8N_WEBHOOK_URL` | URL do webhook n8n |
| `VITE_CNPJA_API_KEY` | Chave da API CNPJa |
| `VITE_ASSERTIVA_CLIENT_ID` | Client ID OAuth2 Assertiva |
| `VITE_ASSERTIVA_CLIENT_SECRET` | Client Secret OAuth2 Assertiva |
| `VITE_ASSERTIVA_WORKER_URL` | URL do Cloudflare Worker proxy |
| `VITE_N8N_ASSERTIVA_PROXY` | URL do webhook n8n (fallback) |

---

## Desenvolvimento local

```bash
npm install
cp .env.example .env    # Preencher variáveis
npm run dev             # Dev server (localhost:5173)
npm run build           # Build produção
npx tsc -b              # Type check
```

---

## Repositório

- **Branch principal:** `main`
- **Deploy automático:** todo push em `main` dispara build + deploy
- **Repositório:** [github.com/V4Bilinski/outbili](https://github.com/V4Bilinski/outbili)
- **Produção:** [v4bilinski.github.io/outbili](https://v4bilinski.github.io/outbili/)
- **Worker Cloudflare:** [outbili.v4bilinski-ferramentas.workers.dev](https://outbili.v4bilinski-ferramentas.workers.dev)
