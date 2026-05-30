# Social Media Enrichment — Regra de Extração de Redes Sociais

## Purpose

Garantir que TODO lead enriquecido tenha Instagram, LinkedIn, TikTok, Facebook e Website extraídos de forma confiável via pipeline `Assertiva → Firecrawl → Persist`, com auditoria de origem e timestamp.

## 🔗 Regra do link da bio (NON_NEGOTIABLE)

> Estabelecida pelo operador em 2026-05-23.

**Ao extrair QUALQUER link da bio de uma rede social (Instagram `externalUrl`, linktr.ee, link genérico, etc.), esse link DEVE ser vinculado como um link ACESSÍVEL na presença digital do lead**, exibido **ao lado** das mídias sociais extraídas (pill "Website" no `DigitalPresencePanel`).

- O link da bio NÃO é insumo de fallback de WhatsApp. É um **link de presença digital** (website).
- Implementação canônica: a Edge Function `social-enrich` grava o `contato_externo` (link da bio) em `app.leads.website` quando o campo está vazio (não sobrescreve website já existente). O `DigitalPresencePanel` lê `lead.website` e renderiza a pill "Website".
- Vale para qualquer plataforma cuja bio exponha um link externo (linktree, beacons, site próprio, agregadores).
- Validado em 2026-05-23: `@sorridents_augusta` → `linktr.ee/sorridentsaugusta` exibido como Website ao lado do Instagram (lead 4F CLINICA).

## Scope

Aplica-se a:
- `enrichLead()` (enriquecimento completo — leads novos)
- `reEnrichLead()` (re-enriquecimento — leads existentes)
- Edge Function `social-enrich` (backfill em massa via fila `app.enrichment_jobs`)
- Handler `handleReExtractSocial` no `CompanyPage` (re-extração manual por clique)

## Prioridade de Campos

1. **Instagram** (prioridade máxima — presença comercial mais frequente em clínicas)
2. **LinkedIn** (prioridade máxima — presença B2B / decisor)
3. **TikTok** (secundário — cresce, especialmente para estética/odonto)
4. **Facebook** (secundário — legado)
5. **Website** (âncora — usado como fonte para Firecrawl)

## Pipeline de Extração

```
┌─────────────────────────────────────────────────────────────────┐
│ ENRICHMENT (leads com CNPJ)                                     │
│                                                                 │
│  FASE 1: CNPJá                                                  │
│    └─ dados cadastrais (sem redes sociais)                      │
│                                                                 │
│  FASE 2: Assertiva Localize                                     │
│    ├─ _redesSociais: [{ tipo, url }] → IG, LI, TT, FB, YT       │
│    ├─ _site → website                                           │
│    └─ classifica + normaliza via socialMediaExtractor           │
│                                                                 │
│  FASE 2.5 (NOVA): Firecrawl fallback                            │
│    Condição: (!IG || !LI) && website existe                     │
│    Ação:                                                        │
│      1. POST api.firecrawl.dev/v1/scrape                        │
│      2. Extrair <a href> do HTML + campo links                  │
│      3. classifySocialUrl em cada link                          │
│      4. Primeiro match de cada plataforma                       │
│    Custo: ~$0.001/scrape (Firecrawl free tier: 500/mês)         │
│                                                                 │
│  FASE 3: Persist Airtable                                       │
│    ├─ instagram, linkedin, tiktok, facebook                     │
│    ├─ socialMediaSource: 'assertiva'|'firecrawl'|'mixed'        │
│    └─ socialMediaExtractedAt: ISO datetime                      │
│                                                                 │
│  FASE 4: Recalc SPICED                                          │
│    └─ P (Dor) e D (Decisão) usam instagram/linkedin/website     │
└─────────────────────────────────────────────────────────────────┘
```

## Condições de Fallback Firecrawl

Firecrawl **SÓ é chamado** quando TODAS condições verdadeiras:
1. `!assertivaPreencheuPrioridade` — Assertiva não retornou Instagram NEM LinkedIn
2. `websiteDisponivel` — lead tem `website` (cadastrado, Assertiva ou inferido via email corp)
3. `isFirecrawlAvailable()` — `VITE_FIRECRAWL_API_KEY` configurada

Se qualquer condição falhar → step marcado como `skipped` com detail explicativo.

## Source Resolution

| Cenário | `socialMediaSource` |
|---------|---------------------|
| Assertiva trouxe IG ou LI, Firecrawl não rodou | `assertiva` |
| Só Firecrawl achou algo | `firecrawl` |
| Assertiva + Firecrawl contribuíram | `mixed` |
| Editado manualmente na UI | `manual` |

## Regras de Re-Extração

Um lead deve ser re-extraído quando:
- `socialMediaExtractedAt` > 90 dias (staleness)
- Usuário clica "Re-extrair" no painel
- Backfill script roda sem `--force` e lead tem `!instagram && !linkedin`
- Backfill script roda com `--force` (independente de estado)

## Normalização de URL

Todas URLs passam por `normalizeSocialUrl()`:
- Força `https://`
- Remove tracking params: `utm_*`, `fbclid`, `igshid`, `_r`, `ref_src`, `ref_url`, `si`, `feature`
- Remove trailing `/`
- Lowercase hostname
- Preserva path (handle)

## Display no Painel

`<DigitalPresencePanel lead={lead} />`:
- 5 pills ordenadas: IG → LI → TT → Website → FB
- Handle legível via `extractHandle()`:
  - IG/TT: `@username`
  - LinkedIn: slug de `/company/xxx` ou `/in/yyy`
  - Facebook: primeiro segmento
  - Website: hostname sem www
- Botão "Re-extrair" (só versão header — `compact=false`)
- Meta: source label + data relativa (`há 5d`)

## Backfill em Massa

O backfill agora roda **server-side** pela Edge Function `social-enrich`, enfileirada via
`app.enrichment_jobs` (worker W3-08, `pg_cron`). Não há mais script client-side batendo no
Airtable (o antigo `scripts/backfill-social.mjs` foi descontinuado no cutover Supabase W3/W4
e reduzido a um stub que aborta com `exit(1)`).

Como acionar:
- **Por lead:** `requestEnrichment(leadId)` (UI: re-enriquecer na ficha) → a cadeia do worker
  inclui a etapa de redes sociais.
- **Em lote:** `enqueueEnrichmentBatch(leadIds, 'high')` (usado pela PESCA) enfileira o
  deep-enrichment, que encadeia o `social-enrich`.
- **Automático:** o cron `enrichment-jobs-sweeper` reprocessa leads com run antigo (> 7 dias).

## Env Vars

```bash
VITE_AIRTABLE_PAT=pat...           # obrigatório
VITE_AIRTABLE_BASE_ID=app...        # obrigatório
VITE_ASSERTIVA_WORKER_URL=https://... # Assertiva fonte primária
VITE_FIRECRAWL_API_KEY=fc-...       # Firecrawl fallback (opcional)
```

Se `VITE_FIRECRAWL_API_KEY` não definida, pipeline degrada para só-Assertiva (graceful).

## Airtable Schema (campos obrigatórios)

Criar na tabela **Leads**:
- `tiktok` (Single line text)
- `socialMediaExtractedAt` (Date com hora)
- `socialMediaSource` (Single select: `assertiva`, `firecrawl`, `mixed`, `manual`)

Campos existentes reutilizados: `instagram`, `linkedin`, `facebook`, `website`, `assertivaSocialMedia`.

## Graceful Degradation

- Assertiva falha → pipeline continua, `_redesSociais` vazio, Firecrawl tenta
- Firecrawl falha → pipeline continua, só dados Assertiva
- Ambos falham → `socialMediaExtractedAt` não é setado, lead sem redes (esperado)
- Campos Airtable ausentes → `mapFieldsToAirtable` silencia via `INVALID_LEAD_FIELDS` (nunca bloqueia)

## Enforcement

- **PR sem TikTok no parser Assertiva:** block (branch `tipo.includes('tiktok')` obrigatório)
- **Lead novo sem `socialMediaExtractedAt`:** aceitável (pode ser importação manual sem CNPJ)
- **Card sem painel DigitalPresencePanel:** bloqueia review de UI — substitui links inline antigos
