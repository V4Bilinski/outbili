# Story PESCA-01 — Seletor de quantidade de leads na PESCA (extração exata)

> **Tipo:** Feature de produto (standalone, fora do épico de migração Airtable→Supabase)
> **Criada em:** 2026-05-30 · **Criada por:** @sm (River) sob orquestração @aiox-master (Orion)
> **Origem:** pedido do operador (Luiz) — controle de quantidade na pesquisa em massa
> **Branch sugerido:** `feat/pesca-seletor-quantidade`

```yaml
metadata:
  story_id: PESCA-01
  story_points: 3
  executor: '@dev'
  design_authority: '@architect'
  quality_gate: '@qa'
  quality_gate_tools:
    - playwright   # E2E dos 5 presets no painel PESCA
    - coderabbit   # refactor do paginador + service
  complexity_dimensions:
    scope: 2          # 5 arquivos, mudanças focadas
    integration: 2    # CNPJa (paginação já existente)
    infrastructure: 1 # nenhuma mudança de infra
    knowledge: 1      # fluxo auditado na sessão 2026-05-30
    risk: 3           # produção + CUSTO de créditos CNPJa (over-fetch)
  complexity_class: STANDARD   # score 9
  decisions:
    semantica: 'Alvo EXATO de leads qualificados via over-fetch com teto rígido (operador, 2026-05-30). Não é teto bruto.'
    ui_placement: 'Novo Passo 4 dedicado no wizard, abaixo do Porte (operador, 2026-05-30).'
    presets: '[25, 50, 100, 125, 150]; default 50'
    overfetch: 'DEDUP_BUFFER 1.3 sobre o alvo de válidos-intrínsecos; MAX_OFFICES = min(N*4, 450); maxPages = ceil(MAX_OFFICES/10)'
    pool_esgotado: 'Sem erro. Painel reporta "X de N solicitados".'
```

---

`Status: InProgress`

---

## Story

**Como** SDR usuário do OUTBILI,
**quero** escolher quantos leads a PESCA vai extrair (25, 50, 100, 125 ou 150) antes de pesquisar,
**para que** a pesquisa em massa traga exatamente a quantidade que pedi de leads qualificados (com decisor e telefone, sem duplicar os que já tenho), respeitando os filtros de segmento, região e porte.

---

## Contexto

- Hoje a quantidade é **fixa em 150 e hardcoded** em `src/hooks/usePesca.ts:124` (`searchViaCnpja(filters, 150, …)`).
- A estimativa exibida é **texto fixo** `"~50-150 empresas"` em `src/components/search/PescaPanel.tsx:528`.
- Entre "empresas buscadas" e "leads entregues" há um funil de redução: descarte de empresas sem decisor+telefone (`pescaService.ts:67`) + dedup vs. base (`usePesca.ts:157`). Por isso, trocar o `150` por um número simples NÃO entrega esse número — entrega menos.
- Único disparador da PESCA é o `PescaPanel`; `CampaignsPage` apenas lê leads salvos. Blast radius: 5 arquivos.
- O paginador CNPJa (`cnpjaService.ts:65`) usa token `next`, 10/página, com retry/backoff em 429 — base pronta para over-fetch adaptativo.

---

## Acceptance Criteria

### AC-1 — Seletor no Passo 4
- [ ] Novo bloco "Quantos leads?" aparece no wizard, abaixo do Porte, com 5 chips: `25 · 50 · 100 · 125 · 150`.
- [ ] Um preset fica sempre selecionado (default `50`); seleção é mutuamente exclusiva.

### AC-2 — Estimativa e CTA dinâmicos
- [ ] A estimativa pré-busca reflete o número escolhido em tempo real (alvo + faixa de tempo estimada).
- [ ] O texto do CTA inclui o número escolhido (ex.: "Pesquisar 100 leads em SP").

### AC-3 — Extração exata
- [ ] **Given** o usuário escolheu N e há pool suficiente, **when** a PESCA conclui, **then** são entregues **exatamente N** leads qualificados (decisor + telefone), sem duplicar leads já existentes na base, truncados em N.

### AC-4 — Pool esgotado (graceful)
- [ ] **Given** o segmento/UF não tem N empresas qualificadas, **when** a busca esgota o pool, **then** o painel entrega o que houver e mostra "X de N solicitados" — sem erro.

### AC-5 — Teto de custo
- [ ] Nenhuma pesquisa consulta a CNPJa além de `MAX_OFFICES = min(N*4, 450)` empresas brutas (tolerância de 1 página).

### AC-6 — Tom de voz
- [ ] Toda copy nova passa no hook `copy-tom-voz`: zero travessão, números como dígitos, sem gíria, ranges com " a ".

---

## Tasks

- [x] **T1** `src/types/index.ts` — adicionar `targetCount: number` em `PescaFilters`.
- [x] **T2** `src/services/cnpjaService.ts` — `searchOfficesPaginated` aceita `targetValidCount`, `isValid`, `maxOffices`; early-stop por válidos; escala `maxPages`.
- [x] **T3** `src/services/pescaService.ts` — `searchViaCnpja` faz over-fetch mirando válidos-intrínsecos com `DEDUP_BUFFER`, teto `MAX_OFFICES`.
- [x] **T4** `src/hooks/usePesca.ts` — passar `filters.targetCount`; `progress.total = targetCount`; `deduplicateLeads(...).slice(0, targetCount)`.
- [x] **T5** `src/components/search/PescaPanel.tsx` — estado `targetCount` (default 50), Passo 4, estimativa+CTA dinâmicos, déficit "X de N" no hero.
- [x] **T6** `npm run build` (tsc -b + vite) limpo (exit 0, zero erros TS); lint sem novos erros (baseline legado mantido).
- [ ] **T7** QA: E2E playwright dos 5 presets + click-test contra CNPJa. **Pendente do operador** (consome créditos CNPJa reais + auth de produção). QA estático PASS.

---

## Dev Notes

**Estratégia de over-fetch (núcleo):**
- `searchViaCnpja(filters, targetCount, …)`: `targetValid = ceil(targetCount * 1.3)` (buffer p/ dedup); `maxOffices = min(targetCount*4, 450)`; `maxPages = ceil(maxOffices/10)`.
- `searchOfficesPaginated` para no primeiro de: `validCount >= targetValid` | `offices >= maxOffices` | `!next` (pool fim) | `maxPages`.
- `usePesca` deduplica vs. base e `slice(0, targetCount)` — garante N exato (ou menos, se pool esgotou).

**Validade intrínseca** (`isValid`): office tem decisor (via `findDecisor`/`extractPartners`) **e** ao menos um telefone. Mesmo critério do descarte em `pescaService.ts:67`.

---

## File List
_(preenchida pelo @dev durante a implementação)_

- `src/types/index.ts`
- `src/services/cnpjaService.ts`
- `src/services/pescaService.ts`
- `src/hooks/usePesca.ts`
- `src/components/search/PescaPanel.tsx`

---

## QA Results

**Gate: PASS (estático)** — @qa (Quinn), 2026-05-30. Verdict CONCERNS→PASS após validação. Click-test ao vivo pendente do operador (custo CNPJa).

| Check | Resultado |
|---|---|
| Build (`tsc -b` + vite) | ✅ exit 0, zero erros TS |
| Lint (novos erros) | ✅ 0 novos (`git diff` sem `any`/unused; 187 erros baseline legados intactos) |
| Tom de voz (travessão/gíria/dígitos) | ✅ zero travessão em UI; 2 ocorrências eram comentários (fora de escopo) e foram limpas |
| Blast radius | ✅ 5 arquivos; único disparador é PescaPanel |
| AC-1/AC-2 (UI) | ✅ compila; Passo 4, estimativa e CTA dinâmicos via estado `targetCount` |
| AC-3/AC-4/AC-5 (extração) | ✅ por trace lógico (abaixo); validação E2E real pendente do operador |

**Trace de mesa — over-fetch (N=100):**
`targetValidCount=130` · `maxOffices=400` (=N×4) · `maxPages=40`. Paginador para no 1º de: `validCount≥130` | `offices≥400` (checado ANTES do fetch → custo nunca excede 400, AC-5) | `!next` (pool fim → AC-4) | `maxPages`. `searchViaCnpja` retorna ~130 válidos (buffer); `usePesca` deduplica e `.slice(0,100)` → **100 exatos** (AC-3). Se dedup consumir o buffer → entrega <100 → hero "X de 100" (AC-4).
**N=150:** `maxOffices=min(600,450)=450` (cap de custo domina) → entrega 150 se yield≥~33%, senão "X de 150". **N=25:** `maxOffices=100`. Todos os caps são múltiplos de 10 → zero overshoot.

## Change Log
- 2026-05-30 — Story criada (@sm/Orion). Decisões de semântica (exato/over-fetch) e UI (Passo 4) aprovadas pelo operador.
- 2026-05-30 — Implementação completa (@dev): 5 arquivos. Build limpo. QA estático PASS (@qa). Aguardando OK do operador para push (@devops) + click-test.
