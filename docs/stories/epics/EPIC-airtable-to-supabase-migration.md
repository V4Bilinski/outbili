# EPIC — Airtable → Supabase Migration

> **Status:** Em execução · **Wave atual:** W2 (ETL)
> **Epic ID:** `EPIC-airtable-to-supabase-migration`
> **Sistema:** OUTBILI (V4 Bilinski & Co)
> **Reconstruído em:** 2026-05-19 — a partir do schema remoto (`supabase/migrations/20260506000000_remote_schema.sql`) e da varredura ao vivo do Airtable. Artefatos originais do epic foram perdidos em queda de terminal; este documento os recompõe.

---

## 1. Objetivo

Tornar o **Supabase (`outbili-spo`)** o **banco de dados oficial e único** do sistema OUTBILI, substituindo integralmente o Airtable. Ao final do epic:

- 100% dos dados do Airtable estarão no Supabase, normalizados e ajustados ao schema `app`.
- O app React lerá e escreverá no Supabase — tanto no **enriquecimento manual** (cadastro individual) quanto na **pesquisa em massa (PESCA)**.
- Toda documentação, arquitetura e orquestração do sistema refletirá o Supabase como fonte da verdade.
- O Airtable deixa de ser dependência operacional (mantido apenas o bridge de Inbox WhatsApp, fora de escopo).

## 2. Estado atual (validado ao vivo em 2026-05-19)

| Wave | Descrição | Status |
|------|-----------|--------|
| **W1 — Schema** | 22 tabelas (`app` 21 + `audit` 1), 12 foreign tables FDW, extensões, funções, triggers, RLS | ✅ **CONCLUÍDA** — 7 migrations aplicadas no remoto |
| **W2 — ETL** | Mover 3.313 registros do Airtable para o Supabase via bridge FDW | 🔄 **EM EXECUÇÃO** |
| **W3 — Cutover** | Repontar o app React (services/hooks) para o Supabase + alinhar docs | ⬜ Pendente |

Todas as 22 tabelas `app`/`audit` estão com **0 linhas** — W1 entregou estrutura, nenhum dado migrado ainda.

## 3. Arquitetura da migração

### 3.1 Bridge FDW (o mecanismo de ETL)

O W1 instalou o **Foreign Data Wrapper oficial do Supabase para Airtable** (`extensions.wrappers`). O schema `airtable_fdw` contém **12 foreign tables** que espelham o Airtable ao vivo via SQL. Consequência: **o ETL não é um script externo — é SQL transacional no Postgres**:

```sql
INSERT INTO app.<tabela> SELECT <transformação> FROM airtable_fdw.<tabela>;
```

- Server: `airtable_server` (FDW `airtable_wrapper`), base `appKh4qQ5JN94dQHv`.
- PAT do Airtable guardado em `vault.secrets` (`name = airtable_pat`) — recriado por `scripts/setup-vault.sh`.
- Cobertura validada: `airtable_fdw.leads` declara 117 colunas (116 campos + `airtable_id`) → **100% dos campos cobertos**.

### 3.2 Normalização (flat → relacional)

O Airtable `Leads` é uma tabela flat de 116 campos. O schema `app` a **decompõe**:

```
Airtable "Leads" (116 campos)
  └→ app.leads            (núcleo, ~80 campos)
  └→ app.lead_phones      (1:N — telefones por origem: RF, Assertiva, website, manual)
  └→ app.lead_emails      (1:N)
  └→ app.lead_social      (1:N — instagram, linkedin, tiktok, facebook)
  └→ app.lead_partners    (1:N — QSA/sócios; era a tabela "Partners")
  └→ app.lead_trademarks  (1:N — marcas INPI; era "Trademarks")
```

### 3.3 Segurança e automação já no schema

| Recurso | Função/objeto | Papel no ETL |
|---------|---------------|--------------|
| Criptografia CPF | `pgsodium` | CPFs de `lead_partners` e leads cifrados na carga |
| Telefone canônico | trigger `trg_lead_phones_denormalize` → `denormalize_preferred_phone` | `app.leads.preferred_phone_e164` atualizado automaticamente |
| Normalização telefone | `normalize_lead_phone`, `normalize_contact_whatsapp` | E.164 na inserção |
| Auth | `custom_access_token_hook`, `handle_new_user` | `Users` → `auth.users` + `app.profiles` |
| Fila de enriquecimento | `app.enrichment_jobs` + Realtime + `pg_cron` | Recebe PESCA e enriquecimento manual pós-cutover |
| Controle de ETL | `app.migration_state` | Rastreia cada tabela: total Airtable × inseridos Supabase × status |
| Auditoria | `audit.audit_log` | Destino do `ActivityLog` |

## 4. Inventário de dados (varredura Airtable — 2026-05-19)

Base `appKh4qQ5JN94dQHv` — 13 tabelas, **3.313 registros reais**:

| Tabela Airtable | Campos | Registros | Destino Supabase | Wave |
|-----------------|-------:|----------:|------------------|:----:|
| `Leads` | 116 | 601 | `app.leads` + `lead_phones`/`emails`/`social`/`partners`/`trademarks` | W2 |
| `Contacts` | 17 | 728 | `app.contacts` | W2 |
| `Partners` | 7 | 596 | `app.lead_partners` | W2 |
| `ActivityLog` | 9 | 1.369 | `audit.audit_log` | W2 |
| `Users` | 9 | 10 | `auth.users` + `app.profiles` | W2 |
| `EnrichmentLog` | 5 | 5 | `app.enrichment_runs` | W2 |
| `Activities` | 7 | 3 | `app.activities` | W2 |
| `PipelineEvents` | 9 | 1 | `app.pipeline_events` | W2 |
| `Campaigns` | 12 | 0 | `app.campaigns` | W2 (só estrutura) |
| `Messages` | 15 | 0 | — (bridge Inbox, fora de escopo) | — |
| `Segments` | 6 | 0 | `app.segments` | W2 (só estrutura) |
| `Trademarks` | 5 | 0 | `app.lead_trademarks` | W2 (só estrutura) |
| `_DEPRECATED_Table1` | 6 | 3 | ❌ descartar | — |

## 5. Story Map

### Wave 1 — Schema (✅ concluída — evidência no schema remoto)

| Story | Descrição | Evidência |
|-------|-----------|-----------|
| 001 | FDW wrapper + `airtable_server` + `setup-vault.sh` | comment em `airtable_wrapper` |
| 003 | 12 foreign tables `airtable_fdw.*` | comments nas foreign tables |
| 004 | Schema `app` — tabelas nativas | comment referenciado |
| 006 | Auth — `custom_access_token_hook` + `handle_new_user` | comment em funções |
| 016 | Política de password reset (profiles inativos até reset) | comment em `app.profiles` |
| 021 | Drop das foreign tables migradas (pós-cutover) | comment no schema `airtable_fdw` |

> Stories 002, 005, 007–015, 017–020 não têm evidência no schema. Se existirem artefatos, importar; senão, W1 é tratada como concluída pelo estado de fato do banco.

### Wave 2 — ETL (🔄 a criar via @sm)

Uma story por tabela/grupo. Cada story: migration SQL idempotente + atualização de `app.migration_state` + verificação de contagem.

| Story (proposta) | Escopo | Registros |
|------------------|--------|----------:|
| W2-01 | ETL `Leads` → `app.leads` + 5 tabelas-filhas (decomposição) | 601 |
| W2-02 | ETL `Contacts` → `app.contacts` | 728 |
| W2-03 | ETL `Partners` → `app.lead_partners` | 596 |
| W2-04 | ETL `Users` → `auth.users` + `app.profiles` (force password reset) | 10 |
| W2-05 | ETL `ActivityLog` → `audit.audit_log` | 1.369 |
| W2-06 | ETL `Activities`, `EnrichmentLog`, `PipelineEvents` | 9 |
| W2-07 | Reconciliação de FKs e relações (lead↔contact↔partner) | — |
| W2-08 | Validação de integridade: contagens, nulos, encoding, CPF cifrado | — |

### Wave 3 — Cutover (⬜ a criar via @sm)

| Story (proposta) | Escopo |
|------------------|--------|
| W3-01 | Instalar `@supabase/supabase-js` + criar `src/lib/supabase.ts` (cliente + tipos) |
| W3-02 | Repontar `leadService` / `useLeads` para Supabase |
| W3-03 | Repontar `contactService`, `enrichmentService`, `campaignService` |
| W3-04 | Repontar pipeline PESCA (`pescaService`, `usePesca`) — pesquisa em massa grava no Supabase |
| W3-05 | Repontar enriquecimento manual (`useLeadEnrichment`, `useMassEnrichment`, `useReEnrichment`) |
| W3-06 | Auth via Supabase Auth (`authService`, `useAuth`, `LoginPage`) |
| W3-07 | Validação prática E2E — PESCA + cadastro manual + enriquecimento gravando no Supabase |
| W3-08 | Atualizar `OUTBILI.md`, arquitetura e docs — Supabase como banco oficial |
| 021 | Drop das foreign tables `airtable_fdw` migradas |

## 6. Requisitos não-funcionais

- **NFR-1** — O Supabase deve receber dados de **ambos** os fluxos: enriquecimento manual (cadastro individual) e PESCA (pesquisa em massa).
- **NFR-2** — Tudo que é exibido no app OUTBILI deve ser lido do Supabase pós-cutover.
- **NFR-3** — ETL idempotente: reexecutável sem duplicar (upsert por `airtable_id`).
- **NFR-4** — Zero perda: contagem Supabase = contagem Airtable por tabela (registrado em `migration_state`).
- **NFR-5** — Validação prática obrigatória antes de declarar o epic concluído (Story W3-07).

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Drift de histórico de migrations (7 remoto × 1 local) | Reconciliar via `migration repair` na janela do MCP de escrita |
| Hashes SHA-256 de senha não migráveis | Force password reset via `generateLink(recovery)` — Story W2-04 |
| Decomposição flat→relacional de `Leads` perder campo | Cobertura FDW validada (117 col.); Story W2-08 audita |
| App quebrar no cutover | W3 incremental por service + Story W3-07 valida E2E antes do `OUTBILI.md` |

## 8. Critérios de conclusão do epic

- [ ] 3.313 registros migrados; `app.migration_state` 100% `completed`.
- [ ] App React lê/escreve Supabase em PESCA e enriquecimento manual.
- [ ] Validação prática E2E aprovada (@qa).
- [ ] `OUTBILI.md` e docs declaram Supabase como banco oficial.
- [ ] Foreign tables migradas dropadas (Story 021).

---

## Dependências de execução

| Dependência | Responsável | Status |
|-------------|-------------|--------|
| MCP de escrita (`supabase-rw`) autenticado | @devops + operador (OAuth) | 🔄 em setup |
| Reconciliação de histórico de migrations | @devops (janela de escrita) | ⬜ pendente |
| `scripts/setup-vault.sh` (recriar server FDW se PAT rotacionar) | @data-engineer | ⬜ a reconstruir |
| `docs/migration/01-runbook.md` | @data-engineer | ⬜ a reconstruir |
