# OUTBILI — Validação de Melhoria UI/UX (teste real das skills /ui-ux-pro-max)

> Data: 2026-06-02 · Auditor: ui-ux-pro-max (design intelligence) + skills companion
> Escopo: sistema inteiro (componentes base, badges, cards, features, animação, performance)
> Método: skill `ui-ux-pro-max` CLI rodada de verdade + leitura do código real + roteamento para skills companion.
> Regras V4 respeitadas: ZERO AZUL, SEM TRAVESSÃO, tokens semânticos.

---

## 1. Sumário executivo

Veredito geral: **base sólida, madura e coerente.** O OUTBILI já acerta o que a maioria erra:
design tokens semânticos, dark theme OLED (WCAG AAA confirmado pela skill), `prefers-reduced-motion`
global, tipografia correta (Plus Jakarta Sans, exatamente a recomendação da skill para SaaS/dashboard),
e `framer-motion` já na stack.

O ganho agora não é refazer: é **elevar a camada de movimento e percepção** em pontos cirúrgicos,
e **resolver um risco real de performance** (listas não virtualizadas). As skills novas entram aqui.

Prioridades:
- **P0 (performance):** virtualizar listas de leads (746+ itens renderizados sem janela).
- **P1 (consistência de motion):** unificar entrada/stagger sob `framer-motion` (skill `motion-framer`); hoje há um caminho paralelo em CSS.
- **P1 (polish percebido):** badges, score chip e empty states com micro-motion e ilustração (skills `motion-framer`, `lottie-animations`, Higgsfield).
- **P2 (higiene):** trocar emojis usados como ícone por `lucide-react`.

---

## 2. O que foi testado (honestidade sobre aplicabilidade)

O OUTBILI é **React + Vite + Tailwind v4, sem shadcn**. Nem toda skill nova se aplica. Mapa honesto:

| Skill nova | Aplica ao OUTBILI? | Por quê |
|------------|:------------------:|---------|
| **ui-ux-pro-max** | ✅ Sim (núcleo) | Design intelligence agnóstica de stack. Rodou e validou o DS. |
| **motion-framer** | ✅ Sim, direto | `framer-motion` já é dependência e já é usado no institucional. |
| **lottie-animations** | ✅ Sim | Empty states, loaders, ícones de status animados. |
| **wiggle** | ◻ Pontual | Só se precisar animar o logo Bilinski para um asset (não para UI). |
| **higgsfield-generate** | ✅ Sim | Ilustração de empty state, OG image da landing institucional. |
| **reui / shadcn-ui** | ❌ Não | OUTBILI não usa shadcn/registry. Componentes são próprios. Forçar seria regressão. |
| **react-native / expo-* / swiftui / compose** | ❌ Não | OUTBILI é web SPA, não mobile nativo. |

Isso já é um resultado do teste: a ui-ux-pro-max **rotear corretamente e descartar o que não serve**
é parte do valor. Não empurra shadcn num projeto que não é shadcn.

---

## 3. Pontos fortes confirmados (manter)

- **Tokens semânticos** (`src/globals.css` + `DESIGN-SYSTEM.md`): paleta funcional ZERO AZUL, temperatura (hot/warm/cold), pipeline stages, fontes de dados. Excelente.
- **`prefers-reduced-motion` global** (`globals.css:277`): cobre `*` com kill-switch de animação. Raríssimo de ver bem feito. Manter.
- **Tipografia**: Plus Jakarta Sans (títulos) + Inter (corpo) + JetBrains Mono (números). A skill recomendou Plus Jakarta Sans para este exato perfil. Match.
- **`LeadCard`** (`src/components/leads/LeadCard.tsx`): botão semântico, `focus-visible:ring`, `tabular-nums`, `truncate`, score como sinal tintado. Referência de qualidade.
- **`Skeleton` + `skeleton-shimmer`**: loading states corretos (a skill marca "blank screen" como severidade HIGH; aqui já está resolvido).

---

## 4. Pontos de melhoria mapeados

### P0 — Performance: listas sem virtualização
- **Onde:** `src/pages/LeadsPage.tsx`, `src/pages/PipelinePage.tsx:262` (`colLeads.map`), modo cards de leads.
- **Sintoma:** ~746 leads renderizados via `.map()` direto, sem janela. Cada `LeadCard` monta nós DOM + cálculo de score. Em telas com muitos leads por coluna/lista, custo de render e scroll degrada.
- **Evidência:** `grep` por `react-window|react-virtual|virtualiz` retorna **zero**.
- **Recomendação:** adotar **`@tanstack/react-virtual`** (coerente: o projeto já usa `@tanstack/react-query`). Janela vertical na lista de leads e por coluna do kanban.
- **Severidade skill (ux):** HIGH (performance / content-jumping).

### P1 — Motion fragmentado: dois caminhos de animação
- **Onde:** `src/components/ui/AnimateIn.tsx` (Stagger usa IntersectionObserver + CSS) vs `framer-motion` já usado em `institucional/` e `animations/aiox/`.
- **Problemas:** (a) `Stagger` usa `index` como `key` (anti-pattern React, quebra reconciliação em listas dinâmicas); (b) lógica duplicada do que o `framer-motion` faz melhor (variants, `AnimatePresence` para saída).
- **Recomendação (skill `motion-framer`):** consolidar entrada/stagger em `framer-motion` com `variants` + `staggerChildren`, e `AnimatePresence` para remoção de itens (hoje some sem transição).

### P1 — Badges e score chip sem micro-motion
- **Onde:** `src/components/ui/Badge.tsx`, `LeadCard` score chip.
- **Hoje:** Badge `pulse` usa `pulse-glow 2s infinite` (custo contínuo; o reduced-motion global salva, mas o loop infinito é desperdício em telas com muitos badges). Score chip aparece estático.
- **Recomendação:**
  - Badge "hot": entrada com `spring` (escala 0.9 → 1) em vez de loop infinito; reservar pulse para 1 elemento de destaque, não para todo badge quente.
  - Score chip: **count-up** animado (0.0 → score) com `framer-motion` quando o card entra no viewport. Reforça o número como sinal.

### P1 — Empty states sem ilustração
- **Onde:** `src/components/ui/EmptyState.tsx` (só ícone lucide estático).
- **Recomendação:** ilustração leve. Duas vias:
  - **`lottie-animations`**: loader/empty animado vetorial (leve, loop sutil, respeita reduced-motion).
  - **Higgsfield (`higgsfield-generate`)**: ilustração estática on-brand (WebP) para o vazio do pipeline/inbox.

### P1 — Kanban (drag) sem animação de layout
- **Onde:** `src/pages/PipelinePage.tsx` + `@dnd-kit`.
- **Hoje:** reordenar/mover card entre estágios não tem transição de layout; o card "salta".
- **Recomendação (skill `motion-framer`):** `motion.div layout` + `AnimatePresence` nos cards das colunas para reorder suave (combina com `@dnd-kit`).

### P2 — Emojis usados como ícone (anti-pattern)
- **Onde:** `PipelineJourneyStepper.tsx:118` (✅), `stageConfig.ts:88` (🚫), `PescaPanel.tsx:359` (🛒🛋), `TEMPERATURES[].emoji` nos `<option>` de `LeadsPage`/`PipelinePage`.
- **Skill (checklist):** "No emojis as icons (use SVG: Heroicons/Lucide)".
- **Recomendação:** trocar por `lucide-react` (`CheckCircle2`, `Ban`, `ShoppingCart`, `Sofa`). **Exceção legítima:** `MessageBubble.tsx` (😂😢🙏🔥) são reações reais de WhatsApp, não ícones de UI: **manter**.

### P3 — Card hover e profundidade
- **Onde:** `Card.tsx` (hover lift presente) vs `LeadCard` (só muda border/bg).
- **Observação:** consistência boa, mas `LeadCard` poderia ganhar um lift sutil (`-translate-y-0.5`) já coberto por reduced-motion. Baixa prioridade.

---

## 5. Implementações propostas (snippets aplicados ao código real)

> Todas honram `prefers-reduced-motion` (o guard global já zera durações). Onde houver lógica
> condicional, usar `useReducedMotion()` do framer-motion.

### 5.1 Score chip com count-up (skill motion-framer) — `LeadCard.tsx`
```tsx
import { motion, useReducedMotion, animate } from 'framer-motion'
import { useEffect, useState } from 'react'

function ScoreChip({ score, className }: { score: number; className: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? score : 0)
  useEffect(() => {
    if (reduce) return
    const controls = animate(0, score, {
      duration: 0.5, ease: 'easeOut',
      onUpdate: (v) => setShown(v),
    })
    return () => controls.stop()
  }, [score, reduce])
  return (
    <span className={`text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded ${className}`}>
      {shown.toFixed(1)}
    </span>
  )
}
```

### 5.2 Stagger correto com framer-motion (substitui AnimateIn/Stagger CSS)
```tsx
import { motion } from 'framer-motion'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }, // 250ms: faixa da skill (150-300)
}

<motion.div variants={list} initial="hidden" animate="show">
  {leads.map((lead) => (
    <motion.div key={lead.id} variants={item} layout>  {/* key estável, NAO index */}
      <LeadCard lead={lead} />
    </motion.div>
  ))}
</motion.div>
```
> Combinar com virtualização (P0): aplicar `variants` apenas aos itens visíveis na janela.

### 5.3 Badge "hot" com entrada spring (em vez de loop infinito) — `Badge.tsx`
```tsx
// variante hot: entrada com escala, sem pulse-glow infinito
<motion.span
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
  className={cn(base, variantStyles[variant], className)}
>
  {children}
</motion.span>
```

### 5.4 Kanban com layout animation — `PipelinePage.tsx`
```tsx
import { AnimatePresence, motion } from 'framer-motion'

<AnimatePresence mode="popLayout">
  {colLeads.map((lead) => (
    <motion.div key={lead.id} layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}>
      <LeadCard lead={lead} onClick={() => openLead(lead)} />
    </motion.div>
  ))}
</AnimatePresence>
```

### 5.5 Virtualização (P0) — esqueleto com @tanstack/react-virtual
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
// parentRef = container com overflow-y-auto e altura fixa
const rowVirtualizer = useVirtualizer({
  count: leads.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 96,   // altura aprox. do LeadCard
  overscan: 8,
})
// renderizar só rowVirtualizer.getVirtualItems(), com translateY
```

### 5.6 Empty state com Lottie (skill lottie-animations) — `EmptyState.tsx`
```tsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
// substitui o bloco do ícone quando houver animação on-brand
<DotLottieReact src="/lottie/empty-pipeline.lottie" autoplay loop
  style={{ width: 160, height: 160 }} />
// fallback: manter o ícone lucide atual se reduced-motion ou asset ausente
```

---

## 6. Plano priorizado

| # | Item | Skill | Severidade | Esforço | Story sugerida |
|---|------|-------|:----------:|:-------:|----------------|
| 1 | Virtualizar lista/kanban de leads | (perf, @tanstack/react-virtual) | P0 | M | UX-PERF-01 |
| 2 | Consolidar entrada/stagger em framer-motion | motion-framer | P1 | M | UX-MOTION-01 |
| 3 | Score chip count-up + badge hot spring | motion-framer | P1 | S | UX-MOTION-02 |
| 4 | Empty states com ilustração | lottie-animations / higgsfield | P1 | S | UX-EMPTY-01 |
| 5 | Layout animation no kanban | motion-framer | P1 | S | UX-MOTION-03 |
| 6 | Trocar emojis-ícone por lucide | (higiene) | P2 | S | UX-ICON-01 |

Sequência recomendada: **1 → 2 → 3/5 → 4 → 6**. O item 1 desbloqueia os demais (animar listas
sem virtualizar agrava o custo). Tudo passa pelo Pre-Delivery Checklist da ui-ux-pro-max antes de fechar.

---

## 7. Validação das skills (resultado do teste)

| Skill | Status do teste | Evidência |
|-------|-----------------|-----------|
| **ui-ux-pro-max** (CLI) | ✅ Funcional | `search.py --design-system` retornou pattern/style/colors/typography/effects/anti-patterns; `--domain ux animation` retornou guidelines com severidade. Recomendou Plus Jakarta Sans (match com o sistema). |
| **motion-framer** | ✅ Aplicável e roteada | 4 implementações propostas sobre `framer-motion` já instalado. |
| **lottie-animations** | ✅ Aplicável | Empty states/loaders (snippet 5.6). |
| **higgsfield-generate** | ✅ Aplicável | Ilustração de empty state / OG image institucional. |
| **reui / shadcn-ui** | ✅ Descartada corretamente | OUTBILI não é shadcn; a skill não foi forçada. |
| **mobile (rn/expo/swiftui/compose)** | ✅ Descartada corretamente | OUTBILI é web. |

**Conclusão:** o `/ui-ux-pro-max` enriquecido roteou com precisão (puxou o que serve, descartou o que
não serve) e os insumos novos (motion-framer, lottie) mapearam ganhos concretos sem reescrever a base.
Nenhuma mudança foi aplicada ao código de produção neste documento: é um plano validado, pronto para virar stories no SDC.
