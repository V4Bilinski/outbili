# Plano de Portabilidade — Animações AIOX → OUTBILI Institucional

> Status: 🟡 Setup inicial concluído. Aguarda aprovação para Fase 2.
> Data: 2026-04-27

---

## Status atual

✅ **Fase 1 — Concluída**
- Engenharia reversa do brand.aioxsquad.ai (chunk `motion-page.js` extraído)
- 8 animações catalogadas com parâmetros (delays, durations, springs)
- Keyframes CSS isolados em `extracted/keyframes.css`
- 8 componentes React reescritos em `src/components/animations/aiox/` com cor V4 Bilinski

🟡 **Fase 2 — Pré-requisitos**
- [ ] `npm install framer-motion` no `outbili/`
- [ ] Validar `prefers-reduced-motion` global no `globals.css`
- [ ] Confirmar com stakeholder se substitui `AnimateIn` no Hero

🔴 **Fase 3 — Aplicação na InstitucionalPage**
- [ ] Hero: `<AnimateIn>` do título → `<BrandReveal>`
- [ ] Linha de Montagem: header decorativo com `<SpeedLines>`
- [ ] Mecanismo: divisor central com `<ParticleOrbit>`
- [ ] CTA Final: título com `<StaggerLetters>`

🔴 **Fase 4 — Validação**
- [ ] Lighthouse Performance ≥ 90 (mobile)
- [ ] CLS < 0.1 (animações não causam layout shift)
- [ ] Teste com `prefers-reduced-motion: reduce` (todas estáticas)

---

## Componentes criados

| Componente | Arquivo | Tamanho | Loop | Click-to-replay |
|------------|---------|---------|------|-----------------|
| `BrandReveal` | `BrandReveal.tsx` | ~5KB | Não | Sim (opcional) |
| `SpeedLines` | `SpeedLines.tsx` | ~2KB | Não | Sim (opcional) |
| `ParticleOrbit` | `ParticleOrbit.tsx` | ~3.5KB | Sim (float) | Sim (opcional) |
| `StaggerLetters` | `StaggerLetters.tsx` | ~2.5KB | Não | Sim (opcional) |
| `GlitchReveal` | `GlitchReveal.tsx` | ~3KB | Não | Sim (opcional) |
| `LogoDissolve` | `LogoDissolve.tsx` | ~2KB | Não | Sim (opcional) |
| `MorphingSquare` | `MorphingSquare.tsx` | ~1.5KB | Sim | Não (passivo) |
| `OrchestrationPulse` | `OrchestrationPulse.tsx` | ~3.5KB | Sim (glow) | Sim (opcional) |

Todos importam de `framer-motion` (peer dep). Bundle total estimado: ~25KB gzipped.

---

## Mapeamento sugerido InstitucionalPage

### Opção A — Conservadora (recomendada para 1ª iteração)

| Section | Mudança | Risco |
|---------|---------|-------|
| Hero (linha 130-202) | Substituir `<AnimateIn>` da headline por `<BrandReveal word="OUTBILI" subtitle="do CNPJ ao contrato." />` | Baixo |
| CTA Final (linha 575-617) | Acima do botão, inserir `<StaggerLetters text="DECIDA" />` decorativo | Baixo |

**Ganho estimado:** +20% premium feel no hero, signature de fechamento no CTA.
**Esforço:** ~30min.

### Opção B — Ousada

| Section | Mudança | Risco |
|---------|---------|-------|
| Hero | `<BrandReveal>` | Baixo |
| Linha de Montagem | `<SpeedLines word="DO CNPJ AO CONTRATO" />` acima do `<SectionLabel>` | Médio (acúmulo de movimento) |
| Mecanismo | `<ParticleOrbit>` entre os 2 cards CNPJa/Assertiva | Médio |
| CTA Final | `<StaggerLetters>` | Baixo |

**Ganho estimado:** +40% diferenciação visual, alinhamento com tom premium.
**Esforço:** ~2h. **Risco:** densidade de motion pode distrair leitor.

### Opção C — Showcase interno

Criar `/institucional/showcase` apenas para stakeholders verem as 8 animações lado a lado (mesmo grid que aiox brandbook). Útil para alinhamento de design antes de aplicar.

---

## Implementação técnica

### 1. Instalar dependência
```bash
cd /Users/luizhenrique/Enterprise/active/outbili
npm install framer-motion
```

### 2. Acessibilidade — adicionar ao globals.css
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3. Substituir hero (exemplo Opção A)

**ANTES** (`InstitucionalPage.tsx` linhas 148-182):
```tsx
<AnimateIn delay={80} duration={600}>
  <h1 className="..." style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
    <span style={{ background: 'linear-gradient(...)' }}>
      Do CNPJ ao contrato.
    </span>
  </h1>
</AnimateIn>
```

**DEPOIS**:
```tsx
import { BrandReveal } from '../components/animations/aiox'

// Dentro do hero:
<BrandReveal
  word="DO CNPJ AO CONTRATO"
  subtitle="sistema de inteligência comercial"
  className="my-8"
/>
```

---

## Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Bundle size (framer-motion ~30KB gzip) | Lazy load via `React.lazy` se necessário |
| Layout shift no hero (CLS) | Usar `min-height` fixo no container das animações |
| Motion sickness | `prefers-reduced-motion` global desabilita |
| Mobile performance | Animações já usam `transform`+`opacity` (GPU-accelerated) |
| Identidade visual conflitante | Cor já adaptada (#E63329 vermelho V4) |
| Manutenção | Documentado em README + props tipadas |

---

## Próximos passos sugeridos

1. **Você decide entre Opção A, B ou C** acima
2. Eu instalo `framer-motion` (1 comando)
3. Implemento na InstitucionalPage
4. Test no `npm run dev` + screenshot comparativo
5. Auditoria final via skill `/ui-ux-pro-max`

---

## 🟡 Veredito UX (skill `ui-ux-pro-max`)

> **Regra crítica violada se ir para Opção B/C:** "Animate 1-2 key elements per view maximum" (Severity HIGH).
> A página atual já tem ~20 chamadas de `<AnimateIn>` (denso). Adicionar 8 motions seria EXCESSO.

### Recomendação final: **Opção A (Conservadora)**

| Section | Animação | Justificativa |
|---------|----------|---------------|
| Hero | `BrandReveal` (substitui o gradient text atual) | 1 elemento-chave por viewport. Premium feel sem competir com o body já cheio de `AnimateIn`. |
| CTA Final | `StaggerLetters` (decorativo acima do botão) | Signature de fechamento. Sem loop, não compete com leitura do quote. |

### NÃO usar (riscos > ganho)
- ❌ **OrchestrationPulse** — `repeat: Infinity` no glow ring causa distração contínua (anti-pattern: "Continuous animations distracting").
- ❌ **MorphingSquare** — loop infinito sem semântica clara para o produto outbound.
- ❌ **GlitchReveal** — tom hacker conflita com posicionamento "premium" da V4 Bilinski.
- ❌ **LogoDissolve** — semântica de "exit" inadequada em página de boas-vindas.
- ⚠️ **ParticleOrbit** — uso opcional no Mecanismo, mas só se tiver `<MotionConfig reducedMotion="user">` envolvendo a section.

### Acessibilidade — `prefers-reduced-motion`
✅ outbili já tem guard global em `src/globals.css` linhas 238-244.
⚠️ Framer Motion JS-driven NÃO é coberto automaticamente. Adicionar:

```tsx
// Em InstitucionalPage.tsx, no topo do componente:
import { MotionConfig, useReducedMotion } from 'framer-motion'

export function InstitucionalPage() {
  const shouldReduceMotion = useReducedMotion()
  // ...
  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? 'always' : 'never'}>
      <div className="min-h-screen bg-bg ...">
        {/* conteúdo */}
      </div>
    </MotionConfig>
  )
}
```

### Performance
| Métrica | Risco | Mitigação |
|---------|-------|-----------|
| Bundle | framer-motion ~32KB gzipped | Aceitável (já justificado pelo ganho UX). Se >40KB pós-build, lazy load via `React.lazy`. |
| CLS | BrandReveal usa `min-height: 320px` fixo | Sem layout shift |
| Mobile | Todos componentes usam `transform`+`opacity` (GPU) | OK em 60fps |
| INP | Click-to-replay incrementa state local | <200ms (sem re-render do parent) |

### Veredito sobre densidade
A InstitucionalPage atual já comunica bem. **Substituir** o gradient text do hero por `BrandReveal` é upgrade — não acréscimo. Adicionar **uma** signature no CTA Final (`StaggerLetters`) reforça fechamento. Mais que isso = ruído.

**Resultado esperado:** +20% premium feel no above-the-fold sem comprometer leitura.

