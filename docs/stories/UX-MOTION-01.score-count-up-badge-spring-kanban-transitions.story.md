# UX-MOTION-01 — Micro-motion: score count-up, badge spring, transicoes do kanban

**Status:** Done
**Epic:** UI/UX polish (derivado de `docs/audit/UI-UX-IMPROVEMENT-VALIDATION-2026-06-02.md`)
**Tipo:** Enhancement (frontend, motion)
**Origem:** Auditoria ui-ux-pro-max + skill `motion-framer` (teste real das skills de design).

## Contexto

A auditoria UI/UX (skill ui-ux-pro-max) mapeou ganhos de percepcao de baixo risco usando
`framer-motion` (ja presente na stack). Esta story implementa o subconjunto P1 isolado, sem
mexer em arquitetura nem em dados. Itens maiores (P0 virtualizacao, refactor global de Stagger,
empty states com Lottie) ficam como stories proprias.

## Acceptance Criteria

1. **Score SPICED com count-up:** o chip de score anima de `0.0` ate o valor real ao montar (500ms ease-out), no `LeadCard` (modo cards) e no `PipelineCard` (kanban).
2. **Reduced-motion:** sob `prefers-reduced-motion`, o score aparece no valor final direto, sem animacao e sem `setState` no effect (lint `react-hooks/set-state-in-effect` limpo).
3. **Badge com entrada spring opt-in:** `Badge` aceita prop `enter` (default `false`); quando ativa, entra com spring (escala 0.9 -> 1). Badges existentes seguem `<span>` estatico (zero regressao).
4. **Kanban com transicao de entrada/saida:** cards de cada coluna usam `AnimatePresence` (opacity/scale, 180ms) ao entrar/sair, sem `layout` (preserva o drag HTML5 nativo).
5. **Qualidade:** `eslint` 0 erros e `npm run build` (tsc + vite) passando.

## Tasks

- [x] Criar `src/components/ui/AnimatedScore.tsx` (count-up compartilhado, reduced-motion safe).
- [x] `LeadCard`: usar `AnimatedScore` no chip de score.
- [x] `PipelineCard` (`PipelinePage`): usar `AnimatedScore` no chip de score.
- [x] `Badge`: adicionar prop `enter` opt-in com entrada spring (`framer-motion`).
- [x] `PipelinePage`: envolver cards do kanban em `AnimatePresence` + `motion.div` (entrada/saida).
- [x] Validar lint + build.

## File List

- `src/components/ui/AnimatedScore.tsx` (novo)
- `src/components/ui/Badge.tsx` (prop `enter` + spring)
- `src/components/leads/LeadCard.tsx` (usa AnimatedScore)
- `src/pages/PipelinePage.tsx` (AnimatedScore no card + AnimatePresence no kanban)

## Dev Notes

- `prefers-reduced-motion` ja tem kill-switch global em `globals.css:277`; o `AnimatedScore` e o `Badge` tambem checam via `useReducedMotion()` para a logica condicional (nao so a duracao).
- Decisao tecnica: nao usar `layout` no kanban. O `PipelineCard` faz drag HTML5 nativo manipulando `style.opacity`; `layout` brigaria com isso. `AnimatePresence` no wrapper externo da entrada/saida suave sem tocar no card draggable.
- Skills validadas: `ui-ux-pro-max` (auditoria/roteamento), `motion-framer` (implementacao). `reui`/shadcn e mobile descartadas por nao se aplicarem ao stack (web, sem shadcn).

## QA Results

- eslint: PASS (0 erros; corrigido `set-state-in-effect` na 1a iteracao).
- build: PASS (tsc -b && vite build, 4006 modulos).
- reduced-motion: PASS (valor final direto).

## Backlog derivado (stories proprias)

- **UX-PERF-01** (P0): virtualizar lista de leads / colunas do kanban (`@tanstack/react-virtual`). Maior impacto; exige E2E.
- **UX-MOTION-02**: consolidar `AnimateIn`/`Stagger` (CSS) em `framer-motion` nas 10 paginas que usam.
- **UX-EMPTY-01**: empty states com ilustracao (Lottie / Higgsfield). Depende de asset on-brand.
- **UX-ICON-01**: trocar emojis usados como icone (`stageConfig`, `PescaPanel`) por `lucide-react`.
