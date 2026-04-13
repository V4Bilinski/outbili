# Planejamento Tatico — PESCA v3: Pipeline CNPJa + Assertiva Automatizada

Preparado por: Luiz Henrique | Para: Thiago Bilinski
Data: 13/04/2026 | Projeto: OUTBILI — Sistema de Prospeccao Outbound
Versao: 3.0 — Pipeline CNPJa Direta + Assertiva Automatica

---

## Indice

1. [Contexto e Decisao](#1-contexto-e-decisao)
2. [Arquitetura da Pipeline Completa](#2-arquitetura-da-pipeline-completa)
3. [CNPJa — Integracao Tecnica](#3-cnpja--integracao-tecnica)
4. [Assertiva Localize — Integracao Tecnica](#4-assertiva-localize--integracao-tecnica)
5. [Schema Airtable — Campos Assertiva](#5-schema-airtable--campos-assertiva)
6. [Arquitetura de Arquivos](#6-arquitetura-de-arquivos)
7. [Variaveis de Ambiente](#7-variaveis-de-ambiente)
8. [enrichmentStatus Lifecycle](#8-enrichmentstatus-lifecycle)

---

## 1. Contexto e Decisao

### Problema: evolucao das versoes

| Versao | Abordagem | Problema |
|--------|-----------|----------|
| PESCA v1 | Apify + Casa dos Dados + OpenCNPJ/ReceitaWS | Casa dos Dados bloqueada por Cloudflare; OpenCNPJ e ReceitaWS com dados limitados (sem telefones validados, sem WhatsApp, sem decisores) |
| PESCA v2 | Workflows n8n orquestrando buscas | Nunca totalmente implementada; complexidade desnecessaria para o fluxo; latencia alta por depender de webhook externo |
| **PESCA v3** | **Frontend chama CNPJa direto + Assertiva automatica apos salvar** | **Versao atual — descrita neste documento** |

### Decisao estrategica

Duas ferramentas pagas compondo a pipeline completa:

| Ferramenta | Funcao | Diferencial |
|------------|--------|-------------|
| **CNPJa** | Descoberta em massa (bulk discovery) | 50+ filtros combinaveis, paginacao por token, cache inteligente, dados cadastrais completos |
| **Assertiva Localize** | Enriquecimento profundo (deep enrichment) | Telefones validados, confirmacao de WhatsApp, decisores com CPF, score de credito, redes sociais |

### Escopo da pipeline automatizada

Pipeline completa dentro do OUTBILI:

```
Usuario seleciona filtros → CNPJa busca empresas → Assertiva enriquece → Airtable salva
```

Nenhuma intervencao manual entre as fases. O usuario ve o progresso em tempo real no frontend.

---

## 2. Arquitetura da Pipeline Completa

### As 5 fases da pipeline

```
FASE 1: "Pesquisando empresas via CNPJa..." (10-30s)
  pescaService.ts --> searchViaCnpja()
    --> cnpjaService.ts --> searchOfficesPaginated()
    --> GET https://api.cnpja.com/office?{params}
    --> Paginacao por token (campo "next" na resposta)
    --> Estrategia: strategy=CACHE_IF_FRESH&maxAge=30 (economiza creditos)

FASE 2: "Classificando telefones..." (1-5s, opcional)
  pescaService.ts --> enrichMissingPhones()
    --> Max 5 leads via ReceitaWS como fallback
    --> Apenas para leads sem telefone da CNPJa

FASE 3: "Removendo duplicatas..." (<1s)
  pescaService.ts --> deduplicateLeads()
    --> Compara CNPJ + WhatsApp contra base existente no Airtable
    --> Remove leads ja cadastrados

FASE 4: "Salvando no sistema..." (5-15s)
  pescaService.ts --> savePescaToAirtable()
    --> Batch de 10 leads + contatos por requisicao
    --> Cria Lead + Contact vinculado

FASE 5: "Enriquecendo com Assertiva (telefones + WhatsApp)..." (20-60s)
  pescaService.ts --> enrichBatchWithAssertiva()
    --> Batch de 5 leads por vez
    --> Para cada lead:
       - assertivaService.lookupCnpj(cnpj) --> telefones validados, emails, socios
       - assertivaService.getDecisionMakers(cnpj, protocolo) --> decisores com WhatsApp
       - PATCH Lead no Airtable com campos assertiva_*
       - CREATE Contact com telefone/WhatsApp validado
       - enrichmentStatus: 'cnpja' --> 'assertiva'
    --> Non-blocking: se Assertiva falhar, leads mantem dados CNPJa
    --> Rate limit: 1s entre batches
```

### Diagrama de fluxo completo

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|    FRONTEND      |     |   cnpjaService   |     |    AIRTABLE      |
|   PescaPanel     |     |                  |     |                  |
|                  |     |                  |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |  1. searchViaCnpja()   |                        |
         |----------------------->|                        |
         |                        |                        |
         |                        |  GET /office?{params}  |
         |                        |----------------------->|
         |                        |  (CNPJa API)           |
         |                        |<-----------------------|
         |                        |                        |
         |  leads[] (CNPJa data)  |                        |
         |<-----------------------|                        |
         |                        |                        |
         |  2. deduplicateLeads() |                        |
         |----------------------------------------------->|
         |  (compara CNPJ contra base existente)          |
         |<-----------------------------------------------|
         |                        |                        |
         |  3. savePescaToAirtable()                       |
         |----------------------------------------------->|
         |  (batch CREATE leads + contacts)                |
         |<-----------------------------------------------|
         |                        |                        |
         |                        |     +------------------+
         |                        |     |                  |
         |                        |     | assertivaService |
         |                        |     |                  |
         |                        |     +--------+---------+
         |                        |              |
         |  4. enrichBatchWithAssertiva()        |
         |-------------------------------------->|
         |                                       |
         |          lookupCnpj(cnpj)             |
         |          getDecisionMakers(cnpj)      |
         |                                       |
         |          (Assertiva API)              |
         |                                       |
         |  5. PATCH Lead (assertiva_* fields)   |
         |----------------------------------------------->|
         |  6. CREATE Contact (validated phone)            |
         |----------------------------------------------->|
         |                        |              |         |
         |  Resultado final no frontend          |         |
         |<-----------------------------------------------------------+
         |                        |              |         |
+--------+---------+     +-------+------+  +----+----+  +-+--------+
|    FRONTEND      |     | cnpjaService |  |assertiva|  | AIRTABLE |
+------------------+     +--------------+  +---------+  +----------+
```

### Por que frontend direto (v3) vs n8n (v2)?

| Criterio | v2 (n8n webhook) | v3 (frontend direto) |
|----------|------------------|----------------------|
| **Latencia** | 3-8s overhead por webhook + processamento n8n | 0ms overhead — chamada direta da API |
| **Complexidade** | 3 sistemas (frontend + n8n + API) | 2 sistemas (frontend + API) |
| **Debugging** | Logs espalhados entre n8n e browser | Tudo no DevTools do browser |
| **Custo** | n8n Cloud cobra por execucao | Zero custo adicional de infraestrutura |
| **Controle de erros** | Erro no n8n nao propaga detalhes ao frontend | try/catch direto com mensagens especificas |
| **UX de progresso** | Sem feedback granular (webhook e sincrono) | 5 fases com progress bar em tempo real |
| **Manutencao** | Precisa manter workflow n8n + codigo frontend | Codigo unico no repositorio |

**Conclusao:** v3 elimina a camada intermediaria. O n8n continua disponivel como fallback para cenarios especificos (ex: busca filtrada complexa), mas nao e mais o fluxo principal.

---

## 3. CNPJa — Integracao Tecnica

### Autenticacao

```
Header: Authorization: {VITE_CNPJA_API_KEY}
```

Nao usa Bearer. O token vai direto no header `Authorization`.

### Endpoint principal

```
GET https://api.cnpja.com/office?{params}
```

**ATENCAO:** O endpoint correto e `/office` (NOT `/office/search`). A CNPJa unificou a busca no endpoint `/office` com query params.

### Cache inteligente

```
strategy=CACHE_IF_FRESH&maxAge=30
```

Isso instrui a CNPJa a retornar dados do cache se tiverem menos de 30 dias. Economiza creditos significativamente em buscas repetidas.

### Paginacao por token

A resposta inclui um campo `next` com o token para a proxima pagina. Exemplo:

```
GET /office?mainActivity.id.in=9602501&address.state.in=SP&next={token}
```

A funcao `searchOfficesPaginated()` em `cnpjaService.ts` itera automaticamente ate esgotar as paginas ou atingir o limite configurado.

### Mapeamento de filtros

| Filtro OUTBILI | Param CNPJa | Exemplo |
|----------------|-------------|---------|
| Segmento (CNAE) | `mainActivity.id.in` | `mainActivity.id.in=9602501,9602502` |
| Estado | `address.state.in` | `address.state.in=SP,RJ` |
| Cidade (IBGE) | `address.municipality.in` | `address.municipality.in=3550308` |
| Porte (size) | `company.size.id.in` | `company.size.id.in=1,3` (1=ME, 3=EPP, 5=DEMAIS) |
| Capital minimo | `company.equity.gte` | `company.equity.gte=10000` |
| Capital maximo | `company.equity.lte` | `company.equity.lte=2000000` |
| Excluir MEI | `company.simei.optant.eq` | `company.simei.optant.eq=false` |
| Somente ativas | `status.id.in` | `status.id.in=2` |
| Exigir telefone | `phones.ex` | `phones.ex=true` |

### Formato CNAE

O OUTBILI armazena CNAEs no formato `'9602-5/01'`. A CNPJa espera o formato numerico `9602501`.

A funcao `getCnaeCodesForCnpja()` em `cnae-mapping.ts` faz a conversao:

```
'9602-5/01' --> 9602501
'4781-4/00' --> 4781400
```

Remove hifens e barras, concatena em numero inteiro.

### Exemplo de resposta CNPJa

```json
{
  "next": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "count": 247,
  "offices": [
    {
      "taxId": "12345678000190",
      "alias": "",
      "company": {
        "name": "EMPRESA EXEMPLO LTDA",
        "size": {
          "id": 3,
          "acronym": "EPP",
          "text": "Empresa de Pequeno Porte"
        },
        "equity": 150000.00,
        "simpilesOptant": true,
        "simpilesDate": "2020-01-15",
        "simei": {
          "optant": false
        },
        "members": [
          {
            "person": {
              "name": "JOAO DA SILVA",
              "taxId": "12345678901",
              "type": "NATURAL"
            },
            "role": {
              "id": 49,
              "text": "Socio-Administrador"
            },
            "since": "2020-01-15"
          }
        ]
      },
      "status": {
        "id": 2,
        "text": "Ativa"
      },
      "address": {
        "municipality": {
          "id": 3550308,
          "name": "Sao Paulo"
        },
        "state": {
          "id": 35,
          "abbreviation": "SP",
          "name": "Sao Paulo"
        },
        "street": "Rua Exemplo",
        "number": "123",
        "district": "Centro",
        "zip": "01001000",
        "details": "Sala 45"
      },
      "phones": [
        {
          "area": "11",
          "number": "999887766",
          "type": "MOBILE"
        },
        {
          "area": "11",
          "number": "33445566",
          "type": "LANDLINE"
        }
      ],
      "emails": [
        {
          "address": "contato@empresa.com.br",
          "domain": "empresa.com.br"
        }
      ],
      "mainActivity": {
        "id": 9602501,
        "text": "Cabeleireiros, manicure e pedicure"
      },
      "sideActivities": [
        {
          "id": 9602502,
          "text": "Atividades de estetica e outros servicos de cuidados com a beleza"
        }
      ],
      "founded": "2020-01-15",
      "head": true,
      "statusDate": "2020-01-15"
    }
  ]
}
```

**Campos criticos:**
- `phones[].type`: `MOBILE` ou `LANDLINE` — usado para classificar celular vs fixo
- `company.members[]`: QSA (Quadro de Socios e Administradores) — usado para extrair decisores
- `company.size.id`: 1=ME, 3=EPP, 5=DEMAIS — mapeado para o filtro de porte
- `next`: token para proxima pagina (null quando acabou)

### Consumo de creditos

| Operacao | Creditos | Observacao |
|----------|----------|------------|
| Busca `/office` (por 10 resultados) | 1 credito | Paginacao: cada pagina = 1 credito |
| Cache hit (dados frescos) | 0 creditos | `strategy=CACHE_IF_FRESH` |
| Consulta empresa `/company/{taxId}` | 0 creditos | Dados basicos inclusos |
| Consulta CEP | 0 creditos | — |

### Projecao mensal de consumo

| Cenario | Buscas/dia | Resultados/busca | Creditos/dia | Creditos/mes |
|---------|------------|------------------|--------------|--------------|
| Conservador | 5 | 20 (2 paginas) | 10 | 300 |
| Moderado | 15 | 50 (5 paginas) | 75 | 2.250 |
| Agressivo | 30 | 100 (10 paginas) | 300 | 9.000 |
| Maximo | 50 | 200 (20 paginas) | 1.000 | 30.000 |

**Otimizacao:** O cache `CACHE_IF_FRESH&maxAge=30` reduz o consumo real em ~40-60% em buscas repetidas (mesmo segmento/regiao).

---

## 4. Assertiva Localize — Integracao Tecnica

### Base URL

```
https://api.assertivasolucoes.com.br
```

### Autenticacao OAuth2 Client Credentials

```
POST /oauth2/v3/token
Header: Authorization: Basic {base64(CLIENT_ID:CLIENT_SECRET)}
Body: grant_type=client_credentials
Content-Type: application/x-www-form-urlencoded
```

Resposta:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Cache de token:** `assertivaService.ts` cacheia o token por 60 segundos (margem de seguranca). Apos expirar, solicita novo token automaticamente antes da proxima chamada.

### Endpoints

| Endpoint | Funcao no codigo | Proposito |
|----------|-----------------|-----------|
| `GET /localize/v3/cnpj?cnpj={cnpj}&idFinalidade=5` | `lookupCnpj()` | Telefones da empresa, emails, socios |
| `GET /localize/v3/possiveis-decisores?cnpj={cnpj}&idFinalidade=5&protocolo={proto}` | `getDecisionMakers()` | Decisores com WhatsApp confirmado |
| `GET /localize/v3/cpf?cpf={cpf}&idFinalidade=5` | `lookupCpf()` | Dados de pessoa fisica |
| `GET /localize/v3/telefone?telefone={phone}&idFinalidade=5` | `lookupPhone()` | Busca reversa por telefone |

**Parametro `idFinalidade=5`:** Finalidade "Cobranca/Recuperacao de Credito" — obrigatoria pela LGPD para justificar a consulta.

**Parametro `protocolo`:** Retornado na resposta de `lookupCnpj()`. Necessario para a chamada subsequente de `getDecisionMakers()`.

### Tiers de dados

| Tier | Nome | Retorna | Custo relativo |
|------|------|---------|----------------|
| Tier 1 | Identificacao | Nome, CNPJ/CPF, endereco, situacao cadastral | Baixo |
| Tier 2 | Conexoes | Telefones (fixo + celular), emails, socios, participacoes societarias | Medio |
| Tier 3 | Estrategico | Score de credito, estimativa de renda, dados comportamentais, redes sociais | Alto |

**PESCA v3 usa Tier 2 como padrao.** Tier 3 e acionado sob demanda para leads qualificados (enriquecimento individual via `enrichmentService.ts`).

### Rate limiting e batching

| Parametro | Valor |
|-----------|-------|
| Tamanho do batch | 5 leads por vez |
| Intervalo entre batches | 1 segundo |
| Tempo estimado para 100 leads | 20-60 segundos |
| Timeout por requisicao | 10 segundos |
| Retentativas em caso de erro | 2 (com backoff exponencial) |

**Comportamento non-blocking:** Se a Assertiva falhar para um lead especifico, o lead mantem os dados da CNPJa. O erro e logado mas nao interrompe o batch. O `enrichmentStatus` permanece `'cnpja'` em vez de avancar para `'assertiva'`.

---

## 5. Schema Airtable — Campos Assertiva

### Tabela Leads — 10 novos campos

| Campo | Tipo | Fonte | Descricao |
|-------|------|-------|-----------|
| `assertivaPhoneValidated` | Single line text | Assertiva | Telefone validado (formato: +5511999887766) |
| `assertivaWhatsappFlag` | Checkbox | Assertiva | WhatsApp confirmado no numero |
| `assertivaEmailValidated` | Email | Assertiva | Email validado |
| `assertivaCpfDecisor` | Single line text | CNPJa QSA | CPF do decisor principal |
| `assertivaIncomeEstimate` | Number | Assertiva CPF (Estrategico) | Estimativa de renda do decisor |
| `assertivaCreditScore` | Number | Assertiva CNPJ (Estrategico) | Score de credito da empresa |
| `assertivaSocialMedia` | Long text | Assertiva | JSON com perfis sociais encontrados |
| `assertivaBehavioralData` | Long text | Assertiva CPF (Estrategico) | JSON com dados comportamentais |
| `assertivaEnrichDate` | Date | Sistema | Timestamp do enriquecimento Assertiva |
| `assertivaTier` | Single select | Sistema | Tier utilizado (Identificacao / Conexoes / Estrategico) |

### Tabela Contacts — 3 novos campos

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `assertivaPhoneValidated` | Checkbox | Telefone confirmado pela Assertiva |
| `assertivaWhatsappValidated` | Checkbox | WhatsApp confirmado pela Assertiva |
| `assertivaEmailValidated` | Checkbox | Email confirmado pela Assertiva |

### enrichmentStatus — valores possiveis

| Valor | Significado | Quando ocorre |
|-------|-------------|---------------|
| `'none'` | Nenhum enriquecimento | Lead criado manualmente |
| `'cnpja'` | Dados cadastrais CNPJa | Apos PESCA buscar via CNPJa |
| `'cnpja_n8n'` | Dados via fluxo n8n (legado) | Leads criados via n8n webhook |
| `'assertiva'` | Enriquecido com Assertiva | Apos batch Assertiva na PESCA |
| `'complete'` | Enriquecimento completo (15 steps) | Apos enrichmentService.ts individual |

---

## 6. Arquitetura de Arquivos

### Fluxo PESCA (pipeline principal)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/components/search/PescaPanel.tsx` | UI wizard (3 steps + resultados) |
| `src/hooks/usePesca.ts` | Hook: orquestra as 5 fases da pipeline |
| `src/services/pescaService.ts` | Orquestrador: searchViaCnpja + enrichBatchWithAssertiva + dedup + save |
| `src/services/cnpjaService.ts` | Engine CNPJa: searchOfficesPaginated + mapCnpjaToLead |
| `src/services/assertivaService.ts` | Engine Assertiva: lookupCnpj + getDecisionMakers + OAuth2 token |
| `src/lib/cnae-mapping.ts` | Mapeamento segmento CNAE --> codigo numerico |

### Enriquecimento individual (15 steps)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/enrichmentService.ts` | Orquestrador de 15 passos (CNPJa + Assertiva + redes sociais) |
| `src/hooks/useLeadEnrichment.ts` | Hook: enriquecimento de lead individual |
| `src/hooks/useMassEnrichment.ts` | Hook: enriquecimento em massa (batch) |

### Fluxo n8n alternativo (fallback)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/n8n-webhook.ts` | Cliente de webhook n8n |
| `src/hooks/useN8nSearch.ts` | Hook: busca via n8n webhook |

---

## 7. Variaveis de Ambiente

| Variavel | Proposito | Armazenamento |
|----------|-----------|---------------|
| `VITE_CNPJA_API_KEY` | Autenticacao CNPJa | `.env.local` + GitHub Secret |
| `VITE_ASSERTIVA_CLIENT_ID` | OAuth2 Assertiva (Client ID) | `.env.local` + GitHub Secret |
| `VITE_ASSERTIVA_CLIENT_SECRET` | OAuth2 Assertiva (Client Secret) | `.env.local` + GitHub Secret |
| `VITE_APIFY_TOKEN` | Apify Actors (scraping) | `.env.local` + GitHub Secret |
| `VITE_AIRTABLE_PAT` | Airtable Personal Access Token | `.env.local` + GitHub Secret |
| `VITE_AIRTABLE_BASE_ID` | ID da base Airtable | `.env.local` + GitHub Secret |
| `VITE_N8N_WEBHOOK_URL` | URL do webhook n8n (fallback) | `.env.local` |

**IMPORTANTE:** Variaveis `VITE_*` sao expostas no frontend (Vite as injeta no bundle). Para producao, considerar proxy backend para esconder `VITE_CNPJA_API_KEY` e `VITE_ASSERTIVA_CLIENT_SECRET`.

---

## 8. enrichmentStatus Lifecycle

### Diagrama do ciclo de vida

```
+--------+     PESCA busca      +--------+     Assertiva batch     +------------+
|        |   via CNPJa          |        |   enriquece             |            |
|  none  |--------------------->| cnpja  |------------------------>| assertiva  |
|        |                      |        |                         |            |
+--------+                      +--------+                         +------------+
                                    |                                    |
                                    |                                    |
                                    |   enrichmentService.ts             |   enrichmentService.ts
                                    |   (15 steps individual)            |   (15 steps individual)
                                    |                                    |
                                    v                                    v
                               +----------+                        +----------+
                               |          |                        |          |
                               | complete |<-----------------------| complete |
                               |          |                        |          |
                               +----------+                        +----------+


Fluxo alternativo (legado n8n):

+--------+     n8n webhook      +-----------+     enrichmentService     +----------+
|        |                      |           |     (15 steps)            |          |
|  none  |--------------------->| cnpja_n8n |-------------------------->| complete |
|        |                      |           |                           |          |
+--------+                      +-----------+                           +----------+
```

### Logica de smart skip

O `enrichmentService.ts` verifica o `enrichmentStatus` antes de executar cada passo:

| Status atual | Comportamento do enrichmentService |
|-------------|-----------------------------------|
| `'none'` | Executa todos os 15 passos do zero |
| `'cnpja'` | Pula passos 1-3 (dados cadastrais ja existem da CNPJa) |
| `'cnpja_n8n'` | Pula passos 1-3 (dados cadastrais ja existem do n8n) |
| `'assertiva'` | Pula passos 1-7 (dados cadastrais + Assertiva Tier 2 ja existem) |
| `'complete'` | Nao executa — lead ja esta totalmente enriquecido |

Essa logica evita reprocessamento e economiza creditos nas APIs pagas. Um lead que passou pela PESCA v3 completa (CNPJa + Assertiva) so precisa dos passos 8-15 do enrichmentService para atingir `'complete'`.

---

*Documento gerado em 13/04/2026 — OUTBILI v3.0*
*Proxima revisao: quando houver mudanca na pipeline ou nos contratos das APIs*
