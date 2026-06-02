# UX-PERF-01 — Virtualizacao da lista de leads (tabela + cards)

**Status:** Done (deploy) · validacao com volume real pendente em producao
**Epic:** UI/UX polish (`docs/audit/UI-UX-IMPROVEMENT-VALIDATION-2026-06-02.md`)
**Tipo:** Performance (frontend)
**Prioridade:** P0 (maior ofensor de render: ~746 leads sem janela)

## Contexto

A auditoria apontou que `LeadsPage` renderiza todos os leads via `.map()` direto (tabela e grid),
sem virtualizacao. Com ~746 leads e o count-up de score (UX-MOTION-01), o custo de montar/animar
todos os nos de uma vez e alto. Esta story introduz virtualizacao por janela.

## Decisoes tecnicas

- **`@tanstack/react-virtual` ^3.14.2** + `useWindowVirtualizer` (o scroll e da janela: `MainLayout` usa `min-h-screen` sem container de overflow proprio).
- **Threshold defensivo (`VIRTUALIZE_THRESHOLD = 60`):** abaixo disso (listas filtradas), render normal mantido com as animacoes de entrada (comportamento ja testado). Acima, virtualiza. Reduz blast radius.
- **Tabela:** spacer rows (top/bottom) + `measureElement` por linha; animacoes de entrada por-index desligadas no modo virtualizado (re-disparariam ao scroll).
- **Grid de cards:** leads agrupados por linha conforme `useColumns()` (1/2/3 por breakpoint), linhas posicionadas com `translateY` + `measureElement`.
- **`scrollMargin` via callback ref** (`useCallback` medindo `offsetTop`): satisfaz as regras `react-hooks/refs` e `react-hooks/set-state-in-effect` do projeto (nada de `ref.current` no render nem `setState` em effect).

## Acceptance Criteria

1. Lista de leads (modo lista e modo cards) virtualizada acima de 60 itens. [x]
2. Abaixo de 60: comportamento atual intacto (animacoes de entrada preservadas). [x]
3. Markup/score/badges identicos entre versao normal e virtualizada (linha extraida em `LeadTableRow`). [x]
4. Responsivo: grid respeita 1/2/3 colunas; tabela mantem colunas `md:` ocultas. [x]
5. Lint 0 erros nos arquivos da story + build OK. [x]
6. Validacao com 746 leads reais em producao. [ ] (pendente: requer login Supabase; nao testavel localmente)

## File List

- `package.json` / `package-lock.json` (+@tanstack/react-virtual)
- `src/hooks/useColumns.ts` (novo)
- `src/pages/LeadsPage.tsx` (LeadTableRow extraida + LeadTable condicional + VirtualLeadTable + VirtualCardGrid)

## QA Results

- eslint (arquivos da story): PASS (0 erros).
- build (tsc -b && vite build): PASS.
- Limitacao: comportamento da virtualizacao com volume real (746) nao testado localmente (sem login). Mitigado pelo threshold (listas pequenas usam o caminho testado) e validacao pos-deploy.

## Riscos e rollback

- Risco residual: medicao de altura / scroll jump em listas grandes (so observavel com volume real).
- Rollback rapido: reverter o commit; o threshold isola o impacto a listas > 60.
