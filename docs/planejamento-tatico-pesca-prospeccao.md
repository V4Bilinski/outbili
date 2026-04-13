# Planejamento Tatico — PESCA v3: Pipeline CNPJa Direta

**Preparado por:** Luiz Henrique | **Para:** Thiago Bilinski
**Data:** 13/04/2026 | **Projeto:** OUTBILI — Sistema de Prospeccao Outbound
**Versao:** 3.0 — Pipeline CNPJa Direta (sem intermediarios)

---

## 1. Contexto e Decisao

### Historico

| Versao | Metodo | Problema |
|--------|--------|----------|
| v1.0 | Apify + Casa dos Dados + OpenCNPJ/ReceitaWS | Casa dos Dados bloqueada pelo Cloudflare, Apify lento (3-120s/pagina), caro |
| v2.0 (planejada) | n8n Workflow 1 (CNPJa) + Workflow 2 (Assertiva) | Complexidade desnecessaria — 2 workflows n8n, latencia de webhook |
| **v3.0 (atual)** | **CNPJa API direto do frontend** | Simples, rapido (~10-30s), dados completos em 1 chamada |

### Decisao atual

Pipeline 100% no frontend React, chamando a API CNPJa diretamente (sem n8n para a PESCA). A Assertiva permanece como enriquecimento profundo **individual** (acionada por lead, nao em massa).

### Ferramentas contratadas

| Ferramenta | Funcao na pipeline | Quando e chamada |
|-----------|-------------------|------------------|
| **CNPJa** (cnpja.com) | Descoberta em massa + dados completos (telefone, email, socios, CNAE, endereco) | PESCA — busca em massa pelo frontend |
| **Assertiva Localize** (assertiva.com.br) | Enriquecimento profundo — telefones validados, WhatsApp confirmado, decisores, score | Enriquecimento individual — acionada por lead quando usuario clica "Enriquecer" |

---

## 2. Arquitetura da Pipeline (v3.0)

### Fluxo PESCA (busca em massa)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OUTBILI Frontend (React 19 + Vite)                                      │
│                                                                         │
│  Pesquisa → aba PESCA → [Segmento] [Estado] [Cidade] [Porte]           │
│                           ↓ clique "Pesquisar"                          │
│                                                                         │
│  Fase 1: "Pesquisando empresas via CNPJa..." (10-30 segundos)          │
│    src/services/pescaService.ts → searchViaCnpja()                      │
│    src/services/cnpjaService.ts → searchOfficesPaginated()              │
│    GET https://api.cnpja.com/office?{params} (paginado por token)       │
│    → retorna: CNPJ, razao social, telefone (MOBILE/LANDLINE),          │
│      email, socios (com CPF), CNAE, capital social, endereco            │
│                                                                         │
│  Fase 2: "Classificando telefones..." (1-5 segundos, opcional)         │
│    src/services/pescaService.ts → enrichMissingPhones()                 │
│    → ReceitaWS para max 5 leads sem celular (fallback)                  │
│                                                                         │
│  Fase 3: "Removendo duplicatas..." (<1 segundo)                        │
│    src/services/pescaService.ts → deduplicateLeads()                    │
│    → compara CNPJ + WhatsApp contra Airtable existente                  │
│                                                                         │
│  Fase 4: "Salvando no sistema..." (5-15 segundos)                      │
│    src/services/pescaService.ts → savePescaToAirtable()                 │
│    → batch de 10 leads/contacts por vez no Airtable                     │
│                                                                         │
│  Resultado: painel com leads, KPIs, filtros de qualidade                │
│    enrichmentStatus = 'cnpja'                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Enriquecimento Individual (por lead)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OUTBILI Frontend — Pagina do Lead                                       │
│                                                                         │
│  Usuario clica "Enriquecer" em um lead especifico                       │
│    src/services/enrichmentService.ts → enrichLead()                     │
│                                                                         │
│  Step 1: CNPJa (fonte central unica)                                   │
│    → GET /office/{cnpj} — dados cadastrais + socios                     │
│    → enrichmentStatus: 'cnpja'                                          │
│                                                                         │
│  Step 1b: Assertiva Localize (telefones validados + decisores)          │
│    → GET /localize/v3/cnpj?cnpj={cnpj} — telefones empresa             │
│    → GET /localize/v3/possiveis-decisores — decisores com WhatsApp      │
│    → enrichmentStatus: 'assertiva'                                      │
│                                                                         │
│  Step 2: Regime Tributario (CNPJa Open)                                │
│  Step 3: Google Maps (rating, reviews)                                  │
│  Step 4: Instagram (seguidores, bio)                                    │
│  Step 5: LinkedIn (funcionarios)                                        │
│  Step 6: INPI (marcas registradas)                                      │
│  Step 7: Website/Dominio                                                │
│  Step 8: IA — Analise Estrategica                                       │
│    → enrichmentStatus: 'complete'                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Por que NAO usar n8n para PESCA?

| Fator | Via n8n (v2.0) | Direto no frontend (v3.0) |
|-------|---------------|--------------------------|
| **Latencia** | Webhook + processamento n8n | Fetch direto (~1-3s/pagina) |
| **Complexidade** | 16 nos, 2 workflows | 1 funcao (`searchViaCnpja`) |
| **Debugging** | Console n8n separado | DevTools do browser |
| **Custo** | n8n cloud (instancia) | Zero (API CNPJa direto) |
| **CORS** | N/A (server-side) | CNPJa suporta CORS com API key |
| **Escolha** | — | **Este** |

---

## 3. CNPJa — Integracao Tecnica

### Autenticacao

```
Header: Authorization: {VITE_CNPJA_API_KEY}
```

API key configurada em `.env.local` e como secret no GitHub Actions (`VITE_CNPJA_API_KEY`).

### Endpoint principal: Pesquisa Avancada

```
GET https://api.cnpja.com/office?{params}
```

**NOTA:** O endpoint correto e `/office` (sem `/search`). Paginacao via campo `next` (token) na resposta.

### Mapeamento de filtros OUTBILI → CNPJa

| Filtro OUTBILI | Param CNPJa | Exemplo |
|----------------|-------------|---------|
| Segmento (CNAE) | `mainActivity.id.in` | `mainActivity.id.in=9602501,9602502` |
| Estado | `address.state.in` | `address.state.in=SP,RJ` |
| Cidade (IBGE) | `address.municipality.in` | `address.municipality.in=3550308` |
| Porte (size ID) | `company.size.id.in` | `company.size.id.in=1,3` (1=ME, 3=EPP, 5=DEMAIS) |
| Capital min | `company.equity.gte` | `company.equity.gte=10000` |
| Capital max | `company.equity.lte` | `company.equity.lte=2000000` |
| Excluir MEI | `company.simei.optant.eq` | `company.simei.optant.eq=false` |
| Somente ativas | `status.id.in` | `status.id.in=2` |
| Exigir telefone | `phones.ex` | `phones.ex=true` |
| Limite por pagina | `limit` | `limit=10` |

### Formato CNAE: OUTBILI → CNPJa

```
'9602-5/01' → 9602501  (remover '-' e '/')
'8630-5/04' → 8630504
```

Funcao: `getCnaeCodesForCnpja()` em `src/lib/cnae-mapping.ts`

### Dados retornados por empresa

O `GET /office` retorna dados completos por empresa, incluindo:

- `taxId` — CNPJ
- `company.name` — Razao social
- `alias` — Nome fantasia
- `company.equity` — Capital social
- `company.size` — Porte (id + acronym + text)
- `company.members[]` — Socios (nome, CPF, cargo, data entrada)
- `company.simples/simei` — Optante Simples/MEI
- `phones[]` — Telefones com tipo (`MOBILE` ou `LANDLINE`)
- `emails[]` — Emails com tipo (corporate, personal)
- `address` — Endereco completo com codigo IBGE
- `mainActivity` / `sideActivities` — CNAEs
- `status` — Situacao cadastral
- `founded` — Data de abertura

### Paginacao

A API retorna um campo `next` (token) na resposta. Para buscar proxima pagina:

```
GET /office?token={next_token}
```

O sistema itera ate atingir `targetCount` (default: 150) ou `maxPages` (default: 15).

### Consumo de creditos

| Operacao | Creditos | Nota |
|----------|----------|------|
| Pesquisa avancada | 1 por 10 resultados | Principal custo da PESCA |
| Consulta individual (online) | 1 | Usado no enriquecimento individual |
| Consulta individual (cache) | 0 | Dados ja em cache |
| Company Read (socios) | 0 | Gratuito |
| CEP | 0 | Gratuito |

### Projecao mensal de uso

| Cenario | Leads/dia | Creditos/mes | Plano recomendado |
|---------|-----------|-------------|-------------------|
| Conservador | 100 | 300 | BASIC 1K (R$ 24,99) |
| Normal | 300 | 900 | BASIC 1K (R$ 24,99) |
| Escala | 1.000 | 3.000 | BASIC 5K (R$ 59,99) |
| Agressivo | 3.000 | 9.000 | PRO 10K (R$ 99,99) |

### Rate Limiting

- Retry com backoff exponencial: 2s → 4s → 8s (max 3 tentativas)
- Limite por plano: 30-60 req/min (conforme plano contratado)
- HTTP 429 tratado automaticamente com retry

---

## 4. Assertiva Localize — Integracao Tecnica

### Status atual

A Assertiva NAO e chamada no fluxo PESCA (busca em massa). Ela e chamada apenas no **enriquecimento individual** de leads, via `enrichmentService.ts`.

### Quando a Assertiva e acionada

1. Usuario abre pagina de um lead individual
2. Clica "Enriquecer"
3. `enrichLead()` executa Step 1b: Assertiva
4. Consulta CNPJ → telefones, emails, socios
5. Consulta possiveis decisores → telefones com WhatsApp confirmado
6. Atualiza Lead e Contact no Airtable

### Autenticacao (OAuth2)

```
POST https://api.assertivasolucoes.com.br/oauth2/v3/token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded
Body: grant_type=client_credentials
```

Credenciais: `VITE_ASSERTIVA_CLIENT_ID` + `VITE_ASSERTIVA_CLIENT_SECRET`
Token valido por 1 hora. Cache automatico em `assertivaService.ts`.

### Endpoints utilizados

| Endpoint | Funcao | Chamado de |
|----------|--------|-----------|
| `GET /localize/v3/cnpj?cnpj={cnpj}` | Dados empresa: telefones, emails, socios | `assertivaService.lookupCnpj()` |
| `GET /localize/v3/possiveis-decisores?cnpj={cnpj}` | Decisores com telefone/WhatsApp confirmado | `assertivaService.getDecisionMakers()` |
| `GET /localize/v3/cpf?cpf={cpf}` | Dados pessoa (disponivel mas pouco usado) | `assertivaService.lookupCpf()` |
| `GET /localize/v3/telefone?telefone={phone}` | Busca reversa por telefone | `assertivaService.lookupPhone()` |

### O que a Assertiva adiciona alem do CNPJa

| Dado | CNPJa retorna | Assertiva adiciona |
|------|--------------|-------------------|
| Telefones | Receita Federal (podem estar desatualizados) | Telefones validados recentes |
| WhatsApp | Nao (apenas tipo MOBILE/LANDLINE) | Flag WhatsApp confirmado |
| Decisores | Socios do QSA (cargo formal) | Possiveis decisores com telefones pessoais |
| Score | Nao | Score comportamental, renda, protestos |

---

## 5. Arquitetura de Arquivos

### Arquivos do fluxo PESCA (busca em massa)

| Arquivo | Funcao |
|---------|--------|
| `src/components/search/PescaPanel.tsx` | UI: wizard 3 steps (segmento, estado/cidade, porte), resultados |
| `src/hooks/usePesca.ts` | Hook: gerencia fases (searching → enriching → deduplicating → saving) |
| `src/services/pescaService.ts` | Orquestrador: `searchViaCnpja()`, `enrichMissingPhones()`, dedup, save Airtable |
| `src/services/cnpjaService.ts` | Motor: `searchOfficesPaginated()`, `mapCnpjaToLead()`, `extractPartners()` |
| `src/lib/cnae-mapping.ts` | Mapeamento: segmento → CNAE codes → formato numerico CNPJa |

### Arquivos do enriquecimento individual

| Arquivo | Funcao |
|---------|--------|
| `src/services/enrichmentService.ts` | Orquestrador: 8 steps (CNPJa → Assertiva → Google → Instagram → etc.) |
| `src/services/assertivaService.ts` | Motor Assertiva: OAuth2, lookupCnpj, getDecisionMakers, extractBestPhone |
| `src/services/cnpjaService.ts` | Motor CNPJa: `searchOffice()` (consulta individual) |
| `src/hooks/useLeadEnrichment.ts` | Hook: enriquecimento de lead individual |
| `src/hooks/useMassEnrichment.ts` | Hook: enriquecimento em massa (batch de leads existentes) |

### Arquivos do fluxo n8n (alternativo — tab "Buscar")

| Arquivo | Funcao |
|---------|--------|
| `src/lib/n8n-webhook.ts` | Client: POST para n8n webhook |
| `src/hooks/useN8nSearch.ts` | Hook: busca via n8n (fluxo alternativo, nao PESCA) |

---

## 6. Status de enrichmentStatus

| Valor | Significado | Quando |
|-------|-------------|--------|
| `'none'` | Nenhum enriquecimento | Lead manual |
| `'cnpja'` | Dados CNPJa basicos | Apos PESCA ou enriquecimento Step 1 |
| `'cnpja_n8n'` | Dados via n8n webhook | Fluxo n8n alternativo |
| `'assertiva'` | Dados Assertiva adicionados | Apos enriquecimento Step 1b |
| `'complete'` | Enriquecimento total | Apos todos os 8 steps |

---

## 7. Variaveis de Ambiente

| Variavel | Uso | Onde |
|----------|-----|------|
| `VITE_CNPJA_API_KEY` | Autenticacao CNPJa API | `.env.local` + GitHub Secret |
| `VITE_ASSERTIVA_CLIENT_ID` | OAuth2 Assertiva | `.env.local` + GitHub Secret |
| `VITE_ASSERTIVA_CLIENT_SECRET` | OAuth2 Assertiva | `.env.local` + GitHub Secret |
| `VITE_APIFY_TOKEN` | Apify Actors (Google Maps, Instagram, etc.) | `.env.local` + GitHub Secret |
| `VITE_AIRTABLE_PAT` | Personal Access Token Airtable | `.env.local` + GitHub Secret |
| `VITE_AIRTABLE_BASE_ID` | Base ID Airtable | `.env.local` + GitHub Secret |
| `VITE_N8N_WEBHOOK_URL` | URL webhook n8n (fluxo alternativo) | `.env.local` |

---

## 8. Proximo passo: Assertiva no PESCA (futuro)

Se for necessario adicionar Assertiva ao fluxo PESCA em massa, a abordagem recomendada e:

1. **Nao bloquear** — manter o fluxo PESCA rapido (CNPJa direto, ~10-30s)
2. **Fase assincrona** — apos salvar leads no Airtable, disparar enriquecimento Assertiva em background
3. **Batch processing** — usar `useMassEnrichment` para enriquecer os leads recem-criados
4. **Polling** — frontend monitora `enrichmentStatus` e atualiza badges quando muda de `'cnpja'` para `'assertiva'`

Isso mantem a experiencia rapida do PESCA e adiciona dados Assertiva sem bloquear o usuario.

---

*Planejamento v3.0 — Atualizado em 13/04/2026*
*Pipeline CNPJa direta, sem intermediarios n8n*
