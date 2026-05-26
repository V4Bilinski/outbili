# W3-08 — Deep Enrichment via Job Queue (arquitetura definitiva)

> **Autor:** @architect (Aria) · **Data:** 2026-05-26 · **Status:** Draft (aguarda decisões de custo do operador)
> **Origem:** validação E2E 2026-05-26 (Orion) confirmou causa-raiz do `net::ERR_FAILED` no re-enriquecimento profundo.

## 1. Problema

O re-enriquecimento profundo (`assertiva-enrich`) roda **síncrono dentro do request HTTP** e estoura o **wall-clock ~150s** do gateway Edge da Supabase. A cascata é serial: por sócio, 4 chamadas à Assertiva Localize + 4 × `delay(300ms)` (`index.ts:356-522`), ~5 a 17s/sócio. QSA grande estoura o teto. Sintoma: `OPTIONS` 204 logado, `POST` nunca completa (conexão dropada), `socioService.runDeepEnrichment` (`:230`) sem AbortSignal recebe `net::ERR_FAILED`.

## 2. Descoberta-chave (estado real do ambiente)

A infraestrutura de fila **existe e está semeada, mas o consumidor nunca foi construído**:

| Componente | Estado |
|---|---|
| `app.enrichment_jobs` | ✅ tabela completa (status/priority/attempts/started_at/finished_at/error/metadata) |
| enum `enrichment_job_status` | ✅ `queued, processing, done, failed, retrying` |
| enum `enrichment_priority` | ✅ `realtime, high, normal` |
| índice `enrichment_jobs_status_priority` | ✅ existe (nunca usado: worker nunca rodou) |
| cron `enrichment-jobs-sweeper` (1/min) | ✅ ativo: enfileira `normal` p/ leads sem run < 7d (limit 50) |
| **worker (consumidor)** | ❌ **NÃO existe** (nenhuma função `app/public` de enrich/job/worker) |
| RLS `enrichment_jobs` | ⚠️ só `SELECT` p/ authenticated (falta caminho de INSERT/UPDATE) |
| jobs atuais | ⚠️ **746 `queued`** congelados desde 20/05 (fila órfã) |
| extensões | ✅ `pg_cron` 1.6.4, `pg_net` 0.20.0, `supabase_vault` 0.3.1 |

**Conclusão:** não é "construir do zero", é **cabear o worker que faltou** + tirar o clique do SDR do caminho crítico + paralelizar a cascata para caber nos 150s.

## 3. Arquitetura proposta

```
SDR clica "Reenriquecer"
   │
   ▼
RPC app.request_enrichment(lead_id)   [SECURITY DEFINER, valida auth.uid()]
   │  UPSERT job priority='realtime' (ou eleva job queued existente)
   ▼
app.enrichment_jobs (queued, realtime)
   │
   ▼  cron enrichment-jobs-worker (*/1 min)
   │  SELECT ... WHERE status='queued' ORDER BY priority,requested_at
   │  FOR UPDATE SKIP LOCKED LIMIT :budget
   │  UPDATE → processing, started_at, attempts+1
   │  pg_net.http_post(assertiva-enrich, Authorization: Bearer <service_role do Vault>,
   │                   body={cnpj, leadId, jobId})
   ▼
Edge Function assertiva-enrich (dual-mode + cascata paralelizada)
   │  processa fora do clique do usuário (sem teto acoplado ao browser)
   │  ao terminar: UPDATE job → done|failed, finished_at, error
   │  registra app.enrichment_runs
   ▼
Front faz polling/Realtime em enrichment_jobs.status do lead
   │  status=done → TabSocios.carregar() recarrega getSociosByLead
   └  status=failed → toast de erro

cron enrichment-jobs-reaper (*/5 min): processing há > 4 min → retrying|failed (resiliência)
```

### Decisões de design

| # | Decisão | Justificativa |
|---|---|---|
| D1 | **Edge function fecha o próprio job** (recebe `jobId`, faz UPDATE done/failed ao final) | Fecha o ciclo sem reconciliar `net._http_response`; pg_net é fire-and-forget |
| D2 | **Paralelizar a cascata** (pool de concorrência ~3 sócios) + cortar sleeps redundantes | Garante que cada job caiba nos 150s; incorpora o quick-win |
| D3 | **Front via RPC `request_enrichment`** (não INSERT direto) | Mantém RLS fechada; SECURITY DEFINER valida auth e seta priority realtime |
| D4 | **Worker = pg_cron + pg_net** (não worker persistente) | Edge serverless não combina com subscribe persistente; pg_net é o padrão Supabase |
| D5 | **Reaper cron** para `processing` preso | Resiliência: edge morta no meio não deixa job zumbi |
| D6 | service_role key no **Vault** para o cron autenticar no `verify_jwt` da edge | Segredo não fica em texto no SQL do cron |

## 4. Mudanças por camada

**Banco (migrations):**
1. `app.request_enrichment(p_lead_id uuid) returns uuid` — SECURITY DEFINER; valida `auth.uid()`; UPSERT job realtime; retorna job_id.
2. `app.dispatch_enrichment_jobs(p_budget int)` — seleciona queued (FOR UPDATE SKIP LOCKED), marca processing, `pg_net.http_post` para a edge com jobId. Chamada pelo cron.
3. cron `enrichment-jobs-worker` (`*/1`) → `select app.dispatch_enrichment_jobs(:budget)`.
4. cron `enrichment-jobs-reaper` (`*/5`) → processing stuck → retrying (até attempts=3) senão failed.
5. Vault: guardar `service_role_key` + `project_url` (secrets do cron).
6. (Opcional) policy/grant de EXECUTE da RPC para `authenticated`.

**Edge function `assertiva-enrich`:**
7. Aceitar `jobId` no body; ao final, UPDATE job (done + enrichment_runs) ou no catch (failed + error). Mantém compat sem jobId.
8. Paralelizar `for (socio)` → pool de concorrência (`Promise.all` com limite 3) + remover sleeps desnecessários (manter throttle mínimo anti-rate-limit).

**Frontend:**
9. `socioService.runDeepEnrichment` → chamar RPC `request_enrichment` + retornar job_id (sem esperar a cascata).
10. Novo hook `useEnrichmentJob(leadId)` — polling (5s) ou Realtime subscribe em `enrichment_jobs`; expõe `status`.
11. `TabSocios.tsx` (botão `:404`) e `CompanyPage.tsx` (`:256`) — estado "Na fila / Enriquecendo" com spinner; ao `done`, `carregar()`; ao `failed`, toast.

## 5. Decisões de CUSTO — RESOLVIDAS (operador, 2026-05-26)

Política escolhida: **"Sob demanda + drenar devagar"**. Ativar o worker drena a fila e cada job é crédito Assertiva real; o operador aceitou custo controlado.

- **DC-1 — Fila órfã (746 jobs `normal`):** ✅ **NÃO cancelar.** Drenar em background, devagar.
- **DC-2 — Auto re-enrich periódico (sweeper > 7 dias):** ✅ **manter** o sweeper (base fica fresca ao longo do tempo).
- **DC-3 — Budget do worker:** ✅ **realtime tem prioridade absoluta** (processado integralmente por ciclo, é raro/sob demanda) **+ `normal` com budget pequeno** (default **3/ciclo de 1 min** ≈ drena 746 em ~4h) **+ kill-switch** (setting `app.settings` ou GUC) para pausar a drenagem de `normal` mantendo o realtime. Drenagem só de `queued`; nunca duplica job ativo.

> **Guard-rail:** `dispatch_enrichment_jobs(p_budget_normal int default 3, p_enabled_normal bool)` — realtime sempre; normal só se habilitado e dentro do budget. Permite pausar gasto a qualquer momento sem derrubar o caminho realtime.

## 6. Esforço & riscos

- **Estimativa:** 5-8 pts (STANDARD/COMPLEX). Migrations + edge refactor + front polling.
- **Risco 1:** rate-limit Assertiva na paralelização → pool limitado a 3 + throttle.
- **Risco 2:** `pg_net` async não retorna erro ao cron → reaper cobre stuck.
- **Risco 3:** custo Assertiva ao drenar fila → bloqueado por DC-1/DC-2/DC-3.
- **Rollback:** worker é cron isolado; `DROP`/`unschedule` reverte sem afetar o app. Edge mantém compat sem jobId.

## 7. Sequência SDC sugerida

1. **Operador decide DC-1/DC-2/DC-3** (custo).
2. `@sm` cria a story W3-08 com ACs (RPC, worker, reaper, edge dual-mode, front polling).
3. `@data-engineer` implementa migrations (RPC + dispatcher + crons + Vault).
4. `@dev` implementa edge dual-mode + paralelização + front polling.
5. `@qa` valida E2E: realtime path (clique → done < 60s p/ QSA pequeno), failed path, reaper.
6. `@devops` deploy edge + migrations + push.
