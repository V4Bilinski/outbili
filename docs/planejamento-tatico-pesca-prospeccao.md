# Planejamento Tatico — PESCA v2: Pipeline CNPJa + Assertiva

**Preparado por:** Luiz Henrique | **Para:** Thiago Bilinski
**Data:** 07/04/2026 | **Projeto:** OUTBILI — Sistema de Prospeccao Outbound
**Versao:** 2.0 — Pipeline Automatizada CNPJa + Assertiva

---

## 1. Contexto e Decisao

### Problema original

A feature PESCA do OUTBILI dependia da Casa dos Dados API para descoberta em massa de empresas por filtros (CNAE, estado, porte). Essa API foi bloqueada pelo Cloudflare, forçando o uso de um workaround fragil via Apify Web Scraper (browser headless). O enriquecimento de dados usava APIs publicas gratuitas (OpenCNPJ, BrasilAPI, ReceitaWS) que retornam dados limitados:

| Limitacao das APIs gratuitas | Impacto |
|------------------------------|---------|
| Telefones apenas da Receita Federal | Muitos desatualizados, sem flag WhatsApp |
| Sem validacao de email | Emails genericos (info@, contato@) |
| Sem dados comportamentais | Impossivel qualificar decisor |
| Sem score de credito | Sem priorizacao por saude financeira |
| Rate limits severos | ReceitaWS: 3 req/min |

### Decisao tomada

Contratar duas ferramentas pagas com APIs robustas:

| Ferramenta | Funcao | Plano |
|-----------|--------|-------|
| **CNPJa** (cnpja.com) | Descoberta em massa — busca por CNAE, estado, capital, porte com 50+ filtros | Pago (10.000 creditos/mes) |
| **Assertiva Localize** (assertiva.com.br) | Enriquecimento profundo — telefones validados, WhatsApp, email, renda, score | Pago (conforme tier contratado) |

### Escopo

Pipeline 100% automatizada dentro do OUTBILI:
1. Usuario configura filtros no frontend
2. Sistema busca empresas via CNPJa
3. Sistema enriquece dados via Assertiva
4. Dados salvos no Airtable
5. Frontend exibe resultados enriquecidos em tempo real

**Econodata** permanece como ferramenta complementar do time comercial (uso manual no navegador), mas NAO faz parte da pipeline automatizada.

---

## 2. Arquitetura da Pipeline Completa

### Fluxo principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OUTBILI Frontend (React 19 + Vite)                                      │
│                                                                         │
│  Pesquisa → aba PESCA → [Segmento] [Estado] [Capital] [Excluir MEI]    │
│                           ↓ clique "PESCAR 100+ Leads"                  │
│                           ↓                                              │
│  Fase 1: "Buscando empresas..." (3-5 segundos)                          │
│  Fase 2: "Salvando leads..." (10-15 segundos)                           │
│  Fase 3: "Enriquecendo dados..." (assincrono, 20-60 segundos)          │
│                           ↓                                              │
│  Painel: 100 leads | badge ASSERTIVA nos enriquecidos | filtros         │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ POST /outbili-pesca
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ n8n — WORKFLOW 1: PESCA-CNPJA (sincrono, ~16 nos)                       │
│                                                                         │
│  1. Webhook recebe filtros                                              │
│  2. Valida e mapeia CNAE codes                                          │
│  3. Monta query params CNPJa                                            │
│  4. GET https://api.cnpja.com/office/search                             │
│  5. Processa resultados (CNPJ, QSA, telefones, capital)                │
│  6. Paginacao se necessario                                             │
│  7. Extrai decisor + classifica telefones                               │
│  8. Deduplica contra Airtable existente                                 │
│  9. Salva Leads no Airtable [enrichmentStatus: 'basic']                │
│ 10. Salva Contacts no Airtable                                         │
│ 11. Dispara Workflow 2 (fire-and-forget)                                │
│ 12. Responde ao frontend com resultados                                 │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ Trigger assincrono
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ n8n — WORKFLOW 2: ASSERTIVA-ENRICH (assincrono, ~12 nos)                │
│                                                                         │
│  1. Recebe lista de lead IDs recem-criados                              │
│  2. Obtem OAuth2 token da Assertiva                                     │
│  3. Para cada batch de 10 leads:                                        │
│     a. Busca dados do lead no Airtable (CNPJ + partners)               │
│     b. POST Assertiva /localize CNPJ (dados empresa)                   │
│     c. POST Assertiva /localize CPF do decisor (telefone, WhatsApp)    │
│     d. Merge dados CNPJa + Assertiva                                   │
│     e. PATCH Lead no Airtable [enrichmentStatus: 'enriched']           │
│     f. PATCH Contact no Airtable (telefone/WhatsApp validados)         │
│  4. Wait 1s entre batches (rate limiting)                               │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ Airtable atualizado
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Airtable                                                                │
│                                                                         │
│  Tabela Leads: CNPJ + dados CNPJa + dados Assertiva                   │
│    enrichmentStatus: 'basic' → 'enriched'                              │
│  Tabela Contacts: decisor com telefone/WhatsApp validado                │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │ React Query polling (5s interval)
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ OUTBILI Frontend — Atualizacao em tempo real                            │
│                                                                         │
│  Leads com enrichmentStatus 'cnpja': badge 'Processando...' (dados CNPJá visíveis)              │
│  Leads com enrichmentStatus 'complete': badge 'Dados completos' + todos dados  │
│  Polling para automaticamente quando todos estão 'complete'            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Por que dois workflows separados?

| Fator | Workflow unico (sincrono) | Dois workflows (assincrono) |
|-------|--------------------------|----------------------------|
| **Tempo de resposta** | 60-120s (usuario espera) | 3-5s (resposta imediata) |
| **Timeout risk** | Alto (n8n webhook 600s max) | Zero (WF2 roda independente) |
| **UX** | Tela travada ate completar | Resultados parciais imediatos |
| **Resiliencia** | Falha Assertiva = falha total | Falha Assertiva = dados basicos mantidos |
| **Escolha** | — | **Este** |

---

## 3. CNPJa — Integracao Tecnica

### Autenticacao

```
Authorization: 92a03e40-6718-4400-af64-4637043fe1ff-f894c2a6-f148-4b45-8714-936f25b58017
```

API key de 73 caracteres, obtida no painel cnpja.com. Configurada como variavel de ambiente no n8n.

### Endpoint principal: Pesquisa Avancada

```
GET https://api.cnpja.com/office/search
```

### Mapeamento de filtros OUTBILI → CNPJa

| Filtro OUTBILI | Param CNPJa | Exemplo |
|----------------|-------------|---------|
| Segmento (slug) | `mainActivity.id.in[]` | `mainActivity.id.in[]=9602501` |
| Estado | `address.state.in[]` | `address.state.in[]=SP` |
| Capital min | `company.equity.gte` | `company.equity.gte=10000` |
| Capital max | `company.equity.lte` | `company.equity.lte=2000000` |
| Excluir MEI | `company.simpilesNacional.mei.eq` | `company.simplesNacional.mei.eq=false` |
| Limite por pagina | `limit` | `limit=100` |

**Nota:** Os codigos CNAE no OUTBILI usam formato com hifen (`9602-5/01`), mas o CNPJa espera formato numerico puro (`9602501`). A conversao e feita removendo hifens e barras do mapeamento em `src/lib/cnae-mapping.ts`.

### Formato CNAE: OUTBILI → CNPJa

```
'9602-5/01' → 9602501  (remover '-' e '/')
'8630-5/04' → 8630504
```

### Dados retornados por empresa

```json
{
  "taxId": "12345678000190",
  "founded": "2015-03-10",
  "company": {
    "name": "CLINICA ESTETICA BELA VIDA LTDA",
    "equity": 150000,
    "size": { "id": 3, "text": "Empresa de Pequeno Porte" },
    "nature": { "id": 2062, "text": "Sociedade Empresaria Limitada" },
    "simples": { "optant": false, "mei": false },
    "members": [
      {
        "person": { "name": "MARIA SILVA SANTOS", "taxId": "12345678901" },
        "role": { "id": 49, "text": "Socio-Administrador" },
        "since": "2015-03-10"
      }
    ]
  },
  "alias": "Bela Vida Estetica",
  "status": { "id": 2, "text": "Ativa" },
  "address": {
    "street": "Av Paulista",
    "number": "1000",
    "district": "Bela Vista",
    "city": "Sao Paulo",
    "state": "SP",
    "zip": "01310100"
  },
  "phones": [
    { "area": "11", "number": "999887766" },
    { "area": "11", "number": "31234567" }
  ],
  "emails": [
    { "address": "contato@belavida.com.br", "domain": "belavida.com.br" }
  ],
  "mainActivity": { "id": 9602501, "text": "Cabeleireiros, manicure e pedicure" },
  "sideActivities": [
    { "id": 9602502, "text": "Atividades de estetica" }
  ]
}
```

### Estrategia de cache

| Estrategia | Quando usar | Creditos |
|-----------|-------------|----------|
| `CACHE` | Sempre usar cache, sem verificar idade | 0 |
| `CACHE_IF_FRESH` | Usar cache se < 30 dias, senao consultar online | 0 ou 1 |
| `CACHE_IF_ERROR` | Tentar online, fallback para cache se erro | 1 ou 0 |

**Recomendacao:** Usar `CACHE_IF_FRESH` com `maxAge=30` para balancear custo e atualidade. Dados da RF atualizam mensalmente.

### Consumo de creditos

| Operacao | Creditos | Nota |
|----------|----------|------|
| Pesquisa de 100 empresas | 10 | 1 credito = 10 resultados |
| Pesquisa de 500 empresas | 50 | 5 paginas de 100 |
| Consulta individual (online) | 1 | Quando precisa dados frescos |
| Consulta individual (cache) | 0 | Dados ja em cache |
| Company Read | 0 | Dados da empresa (socios, filiais) |

### Projecao mensal de uso

| Cenario | Leads/dia | Creditos/mes | % do plano (10k) |
|---------|-----------|-------------|-------------------|
| Conservador | 100 | 220 | 2,2% |
| Normal | 300 | 660 | 6,6% |
| Escala | 1.000 | 2.200 | 22% |
| Agressivo | 3.000 | 6.600 | 66% |

---

## 4. Assertiva Localize — Integracao Tecnica

### Autenticacao (OAuth2)

```
POST https://integracao.assertivasolucoes.com.br/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={ASSERTIVA_CLIENT_ID}
&client_secret={ASSERTIVA_CLIENT_SECRET}
```

Resposta:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Token valido por 1 hora. O workflow n8n deve obter o token no inicio e reutilizar para todo o batch.

### Endpoint base

```
https://integracao.assertivasolucoes.com.br/v3/
```

Documentacao Swagger: `https://integracao.assertivasolucoes.com.br/v3/doc/`

### Consulta CNPJ (dados da empresa)

```
GET /v3/localize/cnpj/{cnpj}
Authorization: Bearer {access_token}
```

Retorna:
- Dados cadastrais completos
- Classificacoes secundarias de atividade
- Informacoes de socios
- Perfis de midias sociais

### Consulta CPF (dados do decisor)

```
GET /v3/localize/cpf/{cpf}
Authorization: Bearer {access_token}
```

Retorna (conforme tier contratado):

| Tier | Dados | Uso na PESCA |
|------|-------|-------------|
| **Identificacao** | Nome, CPF, mae, nascimento, status RF, empresas, historico profissional, midias sociais | Basico — confirma identidade |
| **Conexoes** | Telefones referencia, mapeamento familiar/empresarial, Google Business Profile, probabilidade de negociacao | Intermediario — telefones validados + WhatsApp |
| **Estrategico** | Score comportamental, renda estimada, protestos, cheques devolvidos, indicadores customizados | Avancado — qualificacao financeira completa |

### Base de dados Assertiva

| Tipo | Volume |
|------|--------|
| CPFs | 200 milhoes |
| CNPJs | 40+ milhoes |
| Telefones | 220 milhoes |
| Emails | 38 milhoes |
| WhatsApp | 80 milhoes |
| Enderecos | 218 milhoes |

### Chaves de busca suportadas

| Chave | Endpoint | Uso na PESCA |
|-------|----------|-------------|
| CNPJ | `/localize/cnpj/{cnpj}` | Dados empresa — sempre |
| CPF | `/localize/cpf/{cpf}` | Dados decisor — quando CPF disponivel no QSA |
| Telefone | `/localize/telefone/{phone}` | Reverso — quando tem telefone sem nome |
| Email | `/localize/email/{email}` | Reverso — quando tem email sem telefone |
| Nome + Endereco | `/localize/nome` | Fallback — quando nao tem CPF |

### Rate limiting e batching

| Parametro | Valor |
|-----------|-------|
| Batch size recomendado | 10 leads por ciclo |
| Delay entre batches | 1 segundo |
| Tempo por batch | ~2-3 segundos |
| 100 leads | ~20-30 segundos total |
| Timeout maximo | Sem (workflow assincrono) |

---

## 5. Schema Airtable — Novos Campos

### Tabela Leads — 10 campos novos

| Campo | Tipo Airtable | Origem | Descricao |
|-------|--------------|--------|-----------|
| `assertiva_phone_validated` | Phone | Assertiva CPF/CNPJ | Telefone principal validado pela Assertiva |
| `assertiva_whatsapp_flag` | Checkbox | Assertiva CPF | Se o telefone tem WhatsApp confirmado |
| `assertiva_email_validated` | Email | Assertiva CPF/CNPJ | Email verificado pela Assertiva |
| `assertiva_cpf_decisor` | Single line text | CNPJa QSA | CPF do socio-administrador/decisor |
| `assertiva_income_estimate` | Number | Assertiva CPF (Estrategico) | Renda estimada do decisor |
| `assertiva_credit_score` | Number | Assertiva CNPJ (Estrategico) | Score de credito da empresa |
| `assertiva_social_media` | Long text | Assertiva CPF/CNPJ | JSON: perfis de redes sociais |
| `assertiva_behavioral_data` | Long text | Assertiva CPF (Estrategico) | JSON: dados comportamentais |
| `assertiva_enrich_date` | Date | Sistema | Data/hora do enriquecimento Assertiva |
| `assertiva_tier` | Single select | Sistema | Tier usado: Identificacao / Conexoes / Estrategico |

### Tabela Contacts — 3 campos novos

| Campo | Tipo Airtable | Descricao |
|-------|--------------|-----------|
| `assertiva_phone_validated` | Checkbox | Telefone confirmado pela Assertiva |
| `assertiva_whatsapp_validated` | Checkbox | WhatsApp confirmado pela Assertiva |
| `assertiva_email_validated` | Checkbox | Email confirmado pela Assertiva |

### Campo existente atualizado

| Campo | Antes | Depois |
|-------|-------|--------|
| `enrichmentStatus` | `'none' \| 'basic' \| 'pending' \| 'complete'` | `'none' \| 'basic' \| 'enriched' \| 'pending' \| 'complete'` |

O valor `'enriched'` indica que o lead passou pelo enriquecimento Assertiva. O valor `'complete'` continua indicando enriquecimento total (Assertiva + Google Maps + Instagram, quando aplicavel).

---

## 6. Workflows n8n — Especificacao Detalhada

### Workflow 1: PESCA-CNPJA (sincrono — responde ao frontend)

**Trigger:** `POST /outbili-pesca`
**Tempo de execucao:** 10-30 segundos (dependendo do volume)
**Substitui:** Workflow atual que usa Apify + Casa dos Dados + OpenCNPJ

| No | Nome | Tipo | Descricao |
|----|------|------|-----------|
| 1 | Webhook PESCA | Webhook | Recebe `{ cnaeCodes, states, capitalMin, capitalMax, excludeMei, targetCount }` |
| 2 | Validar Filtros | Code | Valida campos obrigatorios, normaliza CNAE codes (remove hifens/barras) |
| 3 | Montar Query CNPJa | Code | Constroi URL com query params: `mainActivity.id.in[]`, `address.state.in[]`, etc. |
| 4 | HTTP GET CNPJa | HTTP Request | `GET https://api.cnpja.com/office/search?{params}` com header `Authorization: {API_KEY}` |
| 5 | Processar Resultados | Code | Mapeia schema CNPJa → CnpjRecord (taxId → cnpj, company.members → qsa, phones → telefones) |
| 6 | Mais Resultados? | IF | Se `count < targetCount` E existe `nextPage`, continuar paginacao |
| 7 | Rate Limit | Wait | 0.5 segundos entre paginas (respeitar rate limit do plano) |
| 8 | Extrair Decisor | Code | Percorre `company.members[]`, busca role "Administrador/Diretor/Presidente", extrai nome + CPF. Classifica telefones: celular (9 digito) = WhatsApp potencial |
| 9 | Deduplicar Airtable | Code | Busca CNPJs existentes na tabela Leads, remove duplicatas do batch |
| 10 | SplitInBatches | SplitInBatches | Divide em grupos de 10 (limite batch Airtable) |
| 11 | Salvar Lead | HTTP Request | `POST https://api.airtable.com/v0/{baseId}/Leads` com `enrichmentStatus: 'basic'` |
| 12 | Salvar Contact | HTTP Request | `POST https://api.airtable.com/v0/{baseId}/Contacts` vinculado ao Lead |
| 13 | Wait Batch | Wait | 0.2 segundos (rate limit Airtable: 5 req/s) |
| 14 | Aggregator | Merge | Consolida todos os resultados salvos |
| 15 | Disparar Assertiva | HTTP Request | `POST /outbili-assertiva-enrich` com `{ leadIds: [...] }` — fire-and-forget |
| 16 | Responder | Respond to Webhook | `{ success: true, leadsCreated: N, searchId: "..." }` |

### Workflow 2: ASSERTIVA-ENRICH (assincrono — roda em background)

**Trigger:** `POST /outbili-assertiva-enrich` ou Execute Workflow
**Tempo de execucao:** 20-60 segundos para 100 leads
**Novo workflow** — nao existe no sistema atual

| No | Nome | Tipo | Descricao |
|----|------|------|-----------|
| 1 | Trigger | Webhook | Recebe `{ leadIds: ["recXXX", "recYYY", ...] }` |
| 2 | OAuth Token | HTTP Request | `POST /oauth2/token` com client_id + client_secret → armazena access_token |
| 3 | SplitInBatches | SplitInBatches | Divide leadIds em grupos de 10 |
| 4 | Buscar Leads | HTTP Request | `GET Airtable/Leads?filterByFormula=OR(RECORD_ID()='recXXX',...)` → obtem CNPJ + partners JSON |
| 5 | Assertiva CNPJ | HTTP Request | `GET /v3/localize/cnpj/{cnpj}` com Bearer token → dados empresa |
| 6 | Assertiva CPF | HTTP Request | `GET /v3/localize/cpf/{cpf_decisor}` com Bearer token → telefones, WhatsApp, email |
| 7 | Merge Dados | Code | Combina dados CNPJa (ja salvos) + Assertiva (novos). Prioriza Assertiva para telefone/email |
| 8 | Mapear Campos | Code | Mapeia resposta Assertiva → campos Airtable (assertiva_phone_validated, assertiva_whatsapp_flag, etc.) |
| 9 | PATCH Lead | HTTP Request | `PATCH Airtable/Leads/{recordId}` — atualiza com dados Assertiva + `enrichmentStatus: 'enriched'` |
| 10 | PATCH Contact | HTTP Request | `PATCH Airtable/Contacts` — atualiza telefone/WhatsApp/email validados |
| 11 | Wait | Wait | 1 segundo entre batches (rate limit Assertiva) |
| 12 | Loop/Done | IF | Se mais batches, volta ao no 4. Senao, finaliza |

### Variaveis de ambiente necessarias no n8n

| Variavel | Uso | Onde configurar |
|----------|-----|-----------------|
| `CNPJA_API_KEY` | Header Authorization no Workflow 1 | n8n Credentials ou env var |
| `ASSERTIVA_CLIENT_ID` | OAuth2 token request no Workflow 2 | n8n Credentials ou env var |
| `ASSERTIVA_CLIENT_SECRET` | OAuth2 token request no Workflow 2 | n8n Credentials ou env var |
| `AIRTABLE_PAT` | Todas as operacoes Airtable | Ja configurado |
| `AIRTABLE_BASE_ID` | Todas as operacoes Airtable | Ja configurado |

---

## 7. Frontend — Mudancas Necessarias

### 7.1 Tipos TypeScript (`src/types/index.ts`)

Novos campos opcionais em `PescaLead` e `Lead`:

```typescript
// Campos Assertiva (adicionados ao tipo existente)
assertiva_phone_validated?: string
assertiva_whatsapp_flag?: boolean
assertiva_email_validated?: string
assertiva_cpf_decisor?: string
assertiva_income_estimate?: number
assertiva_credit_score?: number
assertiva_social_media?: string // JSON
assertiva_behavioral_data?: string // JSON
assertiva_enrich_date?: string
assertiva_tier?: 'Identificacao' | 'Conexoes' | 'Estrategico'
```

Novo valor em `PescaPhase`:

```typescript
type PescaPhase = 'idle' | 'searching' | 'enriching' | 'assertiva_enriching' | 'saving' | 'done' | 'error'
```

### 7.2 Servico PESCA (`src/services/pescaService.ts`)

| Acao | Detalhe |
|------|---------|
| **Remover** | `enrichCnpjRecords()` — enriquecimento OpenCNPJ/ReceitaWS (agora feito no n8n via CNPJa direto) |
| **Remover** | `enrichFromOpenCnpj()` e `enrichFromReceitaWs()` — funcoes auxiliares de enriquecimento gratuito |
| **Adaptar** | `CnpjRecord` interface — mapear para schema CNPJa (taxId, company.members, phones[]) |
| **Adaptar** | `searchCnpjsViaN8n()` — manter, payload ja e compativel |
| **Simplificar** | `savePescaToAirtable()` — remover logica de enriquecimento inline, salvar dados basicos |

### 7.3 Hook PESCA (`src/hooks/usePesca.ts`)

| Mudanca | Detalhe |
|---------|---------|
| Nova fase | `'assertiva_enriching'` — exibida apos `'done'` enquanto Assertiva processa |
| Polling | `useQuery` com `refetchInterval: 5000` para leads com `enrichmentStatus !== 'enriched'` |
| Auto-stop | Polling para quando todos os leads estao `enrichmentStatus === 'enriched'` ou apos timeout de 3 minutos |

### 7.4 UI da tabela PESCA

| Elemento | Detalhe |
|----------|---------|
| Coluna "Enriquecimento" | Badge: `BASICO` (amarelo) quando `enrichmentStatus === 'basic'`, `ASSERTIVA` (verde) quando `enrichmentStatus === 'enriched'` |
| Loading state | Spinner ao lado de leads em enriquecimento |
| WhatsApp | Priorizar `assertiva_phone_validated` sobre telefone da RF |
| Email | Priorizar `assertiva_email_validated` sobre email da RF |
| Tooltip decisor | Mostrar score de credito e renda estimada (se disponivel) |

---

## 8. Atribuicoes por Agente AIOX

### Epic: PESCA-V2 — Pipeline CNPJa + Assertiva

| Agente | Persona | Responsabilidade Principal | Stories |
|--------|---------|---------------------------|---------|
| `@pm` | Morgan | Criar Epic, definir prioridades, gerenciar roadmap | Orquestracao |
| `@architect` | Aria | Design de contratos API (I/O shapes de cada no n8n), revisao de arquitetura | Revisao |
| `@data-engineer` | Dara | Schema Airtable (13 campos novos), migracao de dados existentes | PESCA-001 |
| `@dev` | Dex | Workflows n8n, services TypeScript, hooks React, tipos | PESCA-002 a 007 |
| `@ux-design-expert` | Uma | Badge Assertiva, loading states, layout da tabela enriquecida | PESCA-007 |
| `@qa` | Quinn | Testes e2e, mocks de APIs pagas, validacao de pipeline completa | PESCA-008 |
| `@devops` | Gage | Env vars no n8n e GitHub, deploy, push | PESCA-004 |
| `@sm` | River | Sprint planning, Definition of Done por story, tracking | Planning |

### Fluxo de agentes

```
@pm cria Epic
  → @sm cria Stories (PESCA-001 a 008)
    → @po valida cada Story
      → @data-engineer executa PESCA-001 (schema)
      → @devops executa PESCA-004 (env vars) [paralelo]
        → @dev executa PESCA-002 a 007 (implementacao)
          → @qa executa PESCA-008 (testes)
            → @devops faz push + deploy
```

---

## 9. Stories — Backlog Ordenado por Dependencia

### PESCA-001: Schema Airtable + Campos Assertiva
- **Agente:** `@data-engineer`
- **Descricao:** Adicionar 10 campos na tabela Leads e 3 campos na tabela Contacts do Airtable para armazenar dados do enriquecimento Assertiva
- **AC:**
  - [ ] 10 campos criados na tabela Leads (assertiva_phone_validated, assertiva_whatsapp_flag, etc.)
  - [ ] 3 campos criados na tabela Contacts (assertiva_phone_validated, assertiva_whatsapp_validated, assertiva_email_validated)
  - [ ] Campo enrichmentStatus atualizado com opcao 'enriched'
  - [ ] Campos existentes nao foram alterados
- **Bloqueia:** PESCA-002, 003, 005, 006, 007
- **Dependencia:** Nenhuma

### PESCA-002: Tipos TypeScript — Campos Assertiva
- **Agente:** `@dev`
- **Descricao:** Atualizar interfaces `PescaLead`, `Lead` e `PescaPhase` em `src/types/index.ts` com novos campos Assertiva
- **AC:**
  - [ ] Campos Assertiva opcionais adicionados a PescaLead
  - [ ] Campos Assertiva opcionais adicionados a Lead
  - [ ] PescaPhase inclui 'assertiva_enriching'
  - [ ] Build TypeScript compila sem erros
- **Depende de:** PESCA-001
- **Bloqueia:** PESCA-006, 007

### PESCA-003: Workflow n8n PESCA-CNPJA
- **Agente:** `@dev`
- **Descricao:** Refatorar o workflow n8n PESCA para usar CNPJa API em vez de Apify/Casa dos Dados. Substituir nos 3 (query), 4 (Apify), 5 (processar) e 8 (OpenCNPJ) por chamadas diretas ao CNPJa
- **AC:**
  - [ ] No 3 monta query params CNPJa (GET, nao POST)
  - [ ] No 4 faz HTTP GET para api.cnpja.com/office/search
  - [ ] No 5 mapeia resposta CNPJa → CnpjRecord (taxId → cnpj, company.members → decisor)
  - [ ] No 8 (OpenCNPJ) removido — dados ja vem do CNPJa
  - [ ] Deduplicacao contra Airtable mantida
  - [ ] Teste com busca real: 10 empresas estetica SP
  - [ ] Disparo do Workflow 2 (Assertiva) no final
- **Depende de:** PESCA-001
- **Bloqueia:** PESCA-005, 006

### PESCA-004: Variaveis de Ambiente
- **Agente:** `@devops`
- **Descricao:** Configurar CNPJA_API_KEY, ASSERTIVA_CLIENT_ID e ASSERTIVA_CLIENT_SECRET no n8n e nos secrets do GitHub
- **AC:**
  - [ ] CNPJA_API_KEY configurada no n8n
  - [ ] ASSERTIVA_CLIENT_ID configurada no n8n
  - [ ] ASSERTIVA_CLIENT_SECRET configurada no n8n
  - [ ] Secrets configurados no GitHub Actions (se aplicavel)
  - [ ] Documentacao de onde cada variavel e usada
- **Depende de:** Nenhuma (paralelo com PESCA-001)
- **Bloqueia:** PESCA-005

### PESCA-005: Workflow n8n ASSERTIVA-ENRICH
- **Agente:** `@dev`
- **Descricao:** Criar novo workflow n8n para enriquecimento assincrono via Assertiva Localize. Workflow acionado pelo PESCA-CNPJA apos salvar leads basicos
- **AC:**
  - [ ] OAuth2 token obtido corretamente
  - [ ] Consulta CNPJ da empresa via Assertiva
  - [ ] Consulta CPF do decisor via Assertiva (quando CPF disponivel)
  - [ ] Dados mapeados para campos Airtable (10 campos Leads + 3 Contacts)
  - [ ] enrichmentStatus atualizado para 'enriched' apos sucesso
  - [ ] Batches de 10 com 1s delay
  - [ ] Tratamento de erro: lead mantem status 'basic' se Assertiva falhar
  - [ ] Teste com 10 leads reais
- **Depende de:** PESCA-001, PESCA-003, PESCA-004
- **Bloqueia:** PESCA-007

### PESCA-006: Frontend — pescaService.ts Refatorado
- **Agente:** `@dev`
- **Descricao:** Remover enriquecimento OpenCNPJ/ReceitaWS do frontend, adaptar mapeamento de resposta para schema CNPJa, simplificar save
- **AC:**
  - [ ] enrichCnpjRecords() removido
  - [ ] enrichFromOpenCnpj() removido
  - [ ] enrichFromReceitaWs() removido
  - [ ] CnpjRecord interface atualizado para schema CNPJa
  - [ ] savePescaToAirtable() simplificado (sem enriquecimento inline)
  - [ ] Build compila sem erros
- **Depende de:** PESCA-002, PESCA-003
- **Bloqueia:** PESCA-007

### PESCA-007: Frontend — UI Enriquecida + Polling
- **Agente:** `@dev` + `@ux-design-expert`
- **Descricao:** Adicionar fase 'assertiva_enriching' ao hook usePesca, implementar polling React Query, adicionar badge Assertiva e priorizar campos validados na tabela
- **AC:**
  - [ ] usePesca.ts inclui fase 'assertiva_enriching' com texto de progresso
  - [ ] Polling a cada 5s para leads com enrichmentStatus !== 'enriched'
  - [ ] Polling para apos todos enriquecidos ou timeout 3 minutos
  - [ ] Badge BASICO (amarelo) e ASSERTIVA (verde) na tabela
  - [ ] WhatsApp prioriza assertiva_phone_validated
  - [ ] Email prioriza assertiva_email_validated
  - [ ] Tooltip com score credito e renda estimada (se disponivel)
- **Depende de:** PESCA-002, PESCA-005, PESCA-006
- **Bloqueia:** PESCA-008

### PESCA-008: Testes End-to-End
- **Agente:** `@qa`
- **Descricao:** Validar pipeline completa CNPJa → Assertiva → Airtable → Frontend com mocks e dados reais
- **AC:**
  - [ ] Mock CNPJa API configurado para testes sem gastar creditos
  - [ ] Mock Assertiva API configurado para testes sem gastar consultas
  - [ ] Teste: busca 10 leads estetica SP → verifica dados no Airtable
  - [ ] Teste: enriquecimento Assertiva → verifica campos preenchidos
  - [ ] Teste: deduplicacao → repetir busca → zero duplicatas
  - [ ] Teste: polling frontend → verifica transicao basic → enriched
  - [ ] Teste: falha Assertiva → verifica lead mantem status 'basic'
  - [ ] Teste: timeout → verifica polling para apos 3 minutos
- **Depende de:** PESCA-003, 004, 005, 006, 007

### Grafico de dependencia

```
PESCA-001 (Schema) ──────┬──→ PESCA-002 (Types) ──────┐
                          │                              │
                          ├──→ PESCA-003 (WF CNPJa) ──┬─┤
                          │                            │ │
PESCA-004 (Env Vars) ────┼──→ PESCA-005 (WF Assert) ──┤ │
          [paralelo]      │                            │ │
                          └──→ PESCA-006 (Service) ────┘ │
                                                         │
                              PESCA-007 (UI + Polling) ──┘
                                        │
                              PESCA-008 (Testes E2E)
```

---

## 10. Projecoes de Custo

### CNPJa (R$ 99,99/mes — 10.000 creditos)

| Metrica | Valor |
|---------|-------|
| Investimento mensal | R$ 99,99 |
| Creditos disponiveis | 10.000/mes |
| Leads descobertos (maximo teorico) | 100.000/mes |
| Custo por 100 leads | R$ 0,10 |
| Custo por lead individual | R$ 0,001 |
| Creditos acumulaveis | Sim (ate 1x recarga = 20.000) |

### Assertiva Localize (conforme tier contratado)

| Tier | Dados incluidos | Uso recomendado |
|------|----------------|-----------------|
| **Identificacao** | Cadastro, empresas, historico profissional | Confirmacao de identidade do decisor |
| **Conexoes** | Telefones validados, WhatsApp, familia, Google Business | Contato direto + WhatsApp validado |
| **Estrategico** | Score credito, renda estimada, protestos, cheques | Qualificacao financeira para priorizacao |

**Recomendacao:** Usar tier **Conexoes** como padrao (telefone + WhatsApp sao os dados mais valiosos para a PESCA). Tier Estrategico sob demanda para leads de alto valor.

### Custo combinado estimado

| Cenario | CNPJa | Assertiva | Total/mes |
|---------|-------|-----------|-----------|
| Conservador (100 leads/dia) | R$ 99,99 | Conforme contrato | R$ 99,99 + Assertiva |
| Normal (300 leads/dia) | R$ 99,99 | Conforme contrato | R$ 99,99 + Assertiva |
| Escala (1.000 leads/dia) | R$ 99,99 | Conforme contrato | R$ 99,99 + Assertiva |

### ROI projetado

| Metrica | Valor |
|---------|-------|
| Leads qualificados/mes (300/dia) | ~6.600 |
| Com WhatsApp validado (estimativa 60%) | ~3.960 |
| Com decisor identificado (estimativa 80%) | ~5.280 |
| Taxa conversao WhatsApp (5%) | ~198 contatos efetivos |
| Custo por contato efetivo | < R$ 1,00 |

---

## 11. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|:---:|:---:|-----------|
| Falha OAuth Assertiva (token expirado) | Media | Medio | Retry automatico no n8n: re-obter token se 401, max 3 tentativas |
| Lead stuck em 'basic' (Assertiva falhou silencioso) | Media | Baixo | Campo `assertiva_enrich_date` null = nao processado. Cron de reprocessamento diario |
| Creditos CNPJa esgotados | Muito Baixa | Alto | Alerta no n8n quando consumo > 80%. Cache strategy reduz uso em ~50% |
| API CNPJa indisponivel | Baixa | Alto | Fallback: enfileirar requests, retry apos 5 minutos. Monitorar status page |
| API Assertiva indisponivel | Baixa | Medio | Leads mantem status 'basic' (dados CNPJa permanecem validos). Re-tentar no proximo batch |
| Rate limit excedido (CNPJa ou Assertiva) | Baixa | Baixo | Wait nodes no n8n ja implementados. Se 429, backoff exponencial |
| Dados desatualizados no CNPJa | Media | Baixo | Usar `CACHE_IF_FRESH` com maxAge=30. Dados RF atualizam mensalmente |
| CPF do decisor nao disponivel no QSA | Media | Medio | Fallback: consultar Assertiva por CNPJ (retorna socios). Se nao encontrar, marcar lead como `assertiva_tier: 'parcial'` |
| Custo Assertiva acima do esperado | Baixa | Medio | Monitorar consumo semanal. Limitar tier Estrategico a leads com capital > R$ 500k |

---

## 12. Cronograma de Implementacao

### Sprint 1 — Fundacao (3 dias uteis)

| Story | Agente | Tarefa | Dia |
|-------|--------|--------|-----|
| PESCA-001 | `@data-engineer` | Criar campos Airtable | Dia 1-2 |
| PESCA-004 | `@devops` | Configurar env vars | Dia 1 (paralelo) |

### Sprint 2 — Core Pipeline (3 dias uteis)

| Story | Agente | Tarefa | Dia |
|-------|--------|--------|-----|
| PESCA-002 | `@dev` | Tipos TypeScript | Dia 4 |
| PESCA-003 | `@dev` | Workflow n8n CNPJa | Dia 4-6 |

### Sprint 3 — Enriquecimento (3 dias uteis)

| Story | Agente | Tarefa | Dia |
|-------|--------|--------|-----|
| PESCA-005 | `@dev` | Workflow n8n Assertiva | Dia 7-9 |
| PESCA-006 | `@dev` | Refatorar pescaService.ts | Dia 7-8 (paralelo) |

### Sprint 4 — Frontend (2 dias uteis)

| Story | Agente | Tarefa | Dia |
|-------|--------|--------|-----|
| PESCA-007 | `@dev` + `@ux` | UI enriquecida + polling | Dia 10-11 |

### Sprint 5 — Validacao (2 dias uteis)

| Story | Agente | Tarefa | Dia |
|-------|--------|--------|-----|
| PESCA-008 | `@qa` | Testes end-to-end | Dia 12-13 |

### Timeline total

```
Semana 1:  [PESCA-001] [PESCA-004] [PESCA-002] [PESCA-003]
Semana 2:  [PESCA-005] [PESCA-006] [PESCA-007]
Semana 3:  [PESCA-008] → Deploy producao
```

**Total: ~13 dias uteis (3 semanas)**

---

## 13. Exemplo Concreto: Jornada Completa PESCA v2

### Cenario: SDR busca 100 clinicas de estetica em Sao Paulo

**14:00 — SDR abre OUTBILI → Pesquisa → aba PESCA**

Configura filtros:
- Segmento: **Estetica**
- Estado: **SP**
- Capital Social: **R$ 10k – R$ 2M**
- Excluir MEI: **marcado**

**14:01 — Clica "PESCAR 100+ Leads"**

Frontend envia POST para n8n:
```json
{
  "action": "pesca",
  "cnaeCodes": ["9602501", "9602502", "8690901"],
  "states": ["SP"],
  "capitalMin": 10000,
  "capitalMax": 2000000,
  "excludeMei": true,
  "targetCount": 100
}
```

**14:01 — Workflow 1 (CNPJa) executa em 5 segundos**

- CNPJa retorna 100 empresas com CNPJ, razao social, socios, telefones, capital
- n8n extrai decisor (socio-administrador) de cada empresa
- n8n classifica telefones (celular = WhatsApp potencial)
- n8n salva 100 leads no Airtable com `enrichmentStatus: 'basic'`
- n8n dispara Workflow 2 com os 100 lead IDs

**14:01 — Frontend exibe resultados imediatos**

```
┌──────────────────────────────────────────────────────────────┐
│ PESCA — 100 leads encontrados                                │
│                                                              │
│ KPIs: 100 CNPJ | 87 com telefone | 71 com decisor           │
│                                                              │
│ Enriquecimento Assertiva em andamento... (0/100)             │
│ ████░░░░░░░░░░░░░░░░ 0%                                     │
│                                                              │
│ Nome           | Decisor      | Telefone    | Status         │
│ Bela Vida      | Maria Silva  | 11999887766 | BASICO ●       │
│ Studio Renova  | Ana Costa    | 11988776655 | BASICO ●       │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

**14:01 a 14:02 — Workflow 2 (Assertiva) roda em background**

- Obtem OAuth token
- Processa 10 batches de 10 leads
- Para cada lead: consulta CNPJ (empresa) + CPF decisor (telefone validado, WhatsApp, email, score)
- Atualiza Airtable com dados enriquecidos

**14:02 — Frontend atualiza via polling (a cada 5s)**

```
┌──────────────────────────────────────────────────────────────┐
│ PESCA — 100 leads encontrados                                │
│                                                              │
│ KPIs: 100 CNPJ | 92 WhatsApp VALIDADO | 85 com decisor      │
│                                                              │
│ Enriquecimento Assertiva completo!                           │
│ ████████████████████ 100%                                    │
│                                                              │
│ Nome           | Decisor      | WhatsApp         | Status    │
│ Bela Vida      | Maria Silva  | 11999887766 ✓    | ASSERTIVA │
│ Studio Renova  | Ana Costa    | 11988776655 ✓    | ASSERTIVA │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

**14:03 — SDR comeca a contatar via WhatsApp com dados validados**

### Consumo de recursos

| Recurso | Quantidade | Custo |
|---------|-----------|-------|
| CNPJa creditos | 10 (100 leads / 10 por credito) | ~R$ 0,10 |
| Assertiva consultas | 200 (100 CNPJ + 100 CPF) | Conforme contrato |
| Tempo total | ~90 segundos (busca + enriquecimento) | — |
| Intervencao manual | Zero | — |

---

*Documento v2.0 — Pipeline automatizada CNPJa + Assertiva*
*Substitui versao anterior (Econodata + CNPJa para aprovacao)*
*Proximo passo: @pm criar Epic e @sm criar Stories no AIOX*
