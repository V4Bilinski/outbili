# Story ADMIN-ENRICH-01 — Re-enriquecimento de leads: correções pós-cutover + re-arquitetura

> **Tipo:** Manutenção corretiva + evolução arquitetural (AdminPage / enriquecimento)
> **Criada em:** 2026-05-30 · **Origem:** validação solicitada pelo operador (UI ainda referenciava Airtable)
> **Auditoria:** workflow `audit-reenrich-outbili` (6 agentes, 3 auditores + 3 céticos adversariais) — 3/3 claims confirmadas
> **Branch:** trabalho direto em `main` (autorizado pelo operador)

```yaml
metadata:
  story_id: ADMIN-ENRICH-01
  executor: '@dev sob orquestração @aiox-master (Orion)'
  quality_gate: '@qa'
  decisao_operador: 'Implementar TUDO (F1→F4), incluindo re-arquitetura do worker (F3B) e aposentadoria dos scripts Airtable (F4).'
  escopo:
    F1: 'Corrigir teto de 1000 (paginação em leadService) — CRÍTICO latente'
    F2: 'Sincronizar UI/comentários: remover referências falsas a Airtable + tom de voz'
    F3B: 'Re-arquitetura: worker server-side passa a cobrir o cadastral; AdminPage enfileira'
    F4: 'Migrar/aposentar scripts .mjs que ainda batem em api.airtable.com'
```

---

## Diagnóstico validado (auditoria adversarial)

1. **Teto de 1000 (🔴 latente):** `getLeads()`/`getLeadsByStatus`/`getLeadsByTemperature` não paginavam → PostgREST trunca em 1000 linhas sem erro. Afeta diagnóstico, re-enrich em lote (até o "Forçar total"), SPICED e o pipeline (`useLeads`). Hoje 746 leads (não dispara); arma ao cruzar 1000.
2. **Worker ≠ re-enrich client-side:** worker W3-08 (`assertiva-enrich`) cobre sócios/telefones/redes/website, **não** cobre `employees`/`foundingDate`/`yearsInMarket`. O re-enrich da AdminPage cobre o cadastral. Lacuna, não sobreposição.
3. **Re-enrich em lote roda no browser** (concorrência 2, delay 1s) → frágil/lento.
4. **Airtable:** zero escrita real em API Airtable dentro de `src/`. Menções = textos/comentários desatualizados + compat (`airtable_record_id`). Resíduo real: `scripts/backfill-social.mjs` e `scripts/recalc-spiced.mjs` ainda batem em `api.airtable.com`.

---

## Frentes e status

### F1 — Paginação contra o teto de 1000 `[✅ implementado]`
- [x] `src/lib/paginate.ts` — `paginateRange()` pura (loop `.range()` até página incompleta).
- [x] `leadService.ts` — `getLeads`/`getLeadsByStatus`/`getLeadsByTemperature` paginados, com tie-breaker `id` (ordem estável entre páginas).
- [x] `scripts/test-pagination.mjs` — teste executável (`node`), 14 asserts incl. cenário 1500 itens × page 1000. **PASS**.

### F2 — Verdade na UI/comentários `[✅ implementado]`
- [x] UI: `AdminPage.tsx` (card SPICED, sem "Airtable" e sem em-dash) + `SearchPage.tsx` (toast).
- [x] Comentários: `enrichmentService.ts` (3), `useSpicedRecalc.ts`, `useMassEnrichment.ts`, `SearchPage.tsx`, `types/index.ts`.

### F4 — Scripts Airtable legados `[⏳ pendente]`
- [ ] Migrar `scripts/backfill-social.mjs` e `scripts/recalc-spiced.mjs` para Supabase, ou mover para `scripts/legacy/` com aviso.

### F3B — Re-arquitetura do worker (cadastral) `[⏳ pendente — ponto de não-retorno: DB + Edge]`
- [ ] Estender `assertiva-enrich` (ou novo modo) para gravar `employees`/`foundingDate`/`yearsInMarket` (CNPJa).
- [ ] AdminPage enfileira via `enqueueEnrichmentBatch` + UI de progresso por fila.
- [ ] Migration + deploy de Edge Function (confirmar com operador antes de aplicar em produção).

---

## Quality gates
Build (`tsc -b`+vite) exit 0 · teste de paginação exit 0 · lint sem novos erros (paridade 197=197) · pre-flight git por push · deploy via Actions + validação de bundle em produção.

## Change Log
- 2026-05-30 — Auditoria adversarial (workflow, 6 agentes). F1+F2 implementados e validados (Bloco 1). F3B/F4 em sequência.
