# AIOX Squad — Motion Showcase (Reverse Engineering)

> Fonte: https://brand.aioxsquad.ai/brandbook/motion
> Coletado em: 2026-04-27
> Stack identificado: **Next.js 15 (App Router) + Framer Motion + Tailwind v4**

---

## Sumário

A página `brandbook/motion` é um showcase com **8 animações Framer Motion GPU-accelerated** explorando o logotipo AIOX. Cada cell é clicável (incrementa `key` do React para replay).

Esse diretório contém:

| Pasta | Conteúdo |
|-------|----------|
| `raw/` | HTMLs e CSS bundle originais baixados do site |
| `extracted/` | Código fonte deminificado + keyframes isolados + componentes reescritos |
| `assets/` | Logos SVG e fontes (não baixados — links abaixo) |

---

## Inventário das 8 Animações

| # | Nome | Duração | Uso recomendado | Mecanismo |
|---|------|---------|-----------------|-----------|
| 1 | **Orchestration Pulse** | 3.5s | Hero / Splash | Seed dot + stagger letters + speed lines + glow ring pulsante (loop) |
| 2 | **Speed Lines** | 2s | Emphasis / pin | Logo cream desliza enquanto 7 linhas neon se desenham com stagger |
| 3 | **Particle Orbit** | loop | Agents / loop | X SVG central com spring + 4 partículas orbitais em float |
| 4 | **Logo Dissolve** | 3s | Exit / fade | Letras AIOX flickeram individualmente até dissolverem |
| 5 | **Morphing Square** | 3.5s loop | Shape shift | Quadrado morpha: square → rounded → circle e volta (rotate 180º) |
| 6 | **Glitch Reveal** | 2s | Tech / hacker | Scanlines + RGB channel split (cyan/red) + skew + hue-rotate |
| 7 | **Stagger Letters** | 1.5s | Navbar / footer | Letras SVG com `rotateX 3D` + spring + underline neon |
| 8 | **Brand Reveal** | 3s | Landing hero | Black blinds abrem do centro + AIOX scale + glow + linhas decorativas |

---

## Tecnologias e Tokens Identificados

### Bibliotecas
- **Framer Motion** (`s.P.div`, `motion.div`) — webpack module ID 18421
- **React 19** (`useState` para click-to-replay)
- **Next.js 15** App Router com chunks lazy-loaded

### Tokens CSS (originais AIOX)
```css
--bb-dark    /* Background card */
--bb-surface /* Background area animação (com grid 2vw) */
--bb-cream   /* Texto principal AIOX */
--bb-lime    /* Cor neon (#D1FF00 detectado em 404) */
--bb-dim     /* Texto secundário */
--bb-border  /* Bordas */
--font-bb-display  /* Headings — Tasa Orbiter Display */
--font-bb-mono     /* Mono */
--font-bb-sans     /* Sans */
```

### Mapeamento para Outbili (V4 Bilinski)
| Token AIOX | Equivalente Outbili | Hex |
|------------|---------------------|-----|
| `--bb-lime` | `--color-red` | `#E63329` |
| `--bb-cream` | `--color-text-primary` | `#F4F4F5` |
| `--bb-dark` | `--color-bg` | `#09090B` |
| `--bb-surface` | `--color-surface` | `#0F0F12` |
| `--bb-dim` | `--color-text-muted` | `#71717A` |
| `--bb-border` | `--color-border` | `rgba(255,255,255,0.06)` |
| `--font-bb-display` | `font-heading` | Plus Jakarta Sans |
| `--font-bb-mono` | `font-mono` | JetBrains Mono |

---

## Keyframes CSS Custom Identificados (CSS bundle 3)

```
bb-blinds-open      # Brand Reveal — width das blinds vai a 0
bb-content-in       # opacity + translateY genérico
bb-letter-in        # Stagger Letters — letra sobe
bb-x-tick           # X rotaciona em ticks de 90°
bb-pulse            # opacity 1 → .5 → 1
bb-pulse-glow       # opacity .3 → .8 → .3
bb-scanline-sweep   # translateY -100% → 100vh (Glitch)
bb-shimmer          # translateX -100% → 100% (loading)
bb-ticker-scroll    # translateX 0 → -50% (marquee infinito)
bb-drawLine         # scaleX 0 → 1 (Speed Lines horizontal)
bb-drawLineV        # scaleY 0 → 1 (Speed Lines vertical)
bb-progress-fill    # width 0 → 100% com easings
bb-duration-fill    # width 0 → 100% linear
bb-easing-run       # left 0 → calc(100% - 12px)
bb-barGrow          # width 0 → auto
bb-spin             # rotate 0 → 1turn
```

---

## Estratégia de Portabilidade para Outbili

### Decisão técnica
Versões DUAS pelo trade-off:
1. **Framer Motion** (`extracted/animations-fm/`) — 1:1 com a fonte. Requer `npm i framer-motion`. Mais fiel à animação original com física spring.
2. **CSS-only** (`extracted/animations-css/`) — keyframes adaptados para usar `globals.css`. Zero dependência. Visual ~80% próximo (sem física spring).

### Onde aplicar na InstitucionalPage
| Animação | Section | Justificativa |
|----------|---------|---------------|
| Brand Reveal | Hero (em vez de `AnimateIn` simples) | Premium intro |
| Speed Lines | A Linha de Montagem (sobre o título) | Reforça mecânica industrial |
| Particle Orbit | O Mecanismo (entre os 2 cards) | Visualiza orquestração |
| Stagger Letters | CTA Final (acima do botão) | Elegância de fechamento |
| Glitch Reveal | As 8 Travas (header) | Tom hacker/tech para destravamento |

### Animações descartadas (não cabem no contexto)
- Orchestration Pulse (muito longo, redundante com Brand Reveal)
- Logo Dissolve (semântica de "exit", não de boas-vindas)
- Morphing Square (genérico demais)

---

## Como aplicar

```bash
# 1. Instalar dependência
cd /Users/luizhenrique/Enterprise/active/outbili
npm install framer-motion

# 2. Componentes já criados em src/components/animations/aiox/
#    Cada um exporta um React component drop-in

# 3. Importar onde precisa
#    import { BrandReveal } from '@/components/animations/aiox/BrandReveal'
```

Veja `PLAN.md` para o roteiro de implementação.

---

## Licenciamento e Atribuição

O código fonte foi **revertido** a partir do bundle minificado público. As animações **conceitualmente** são propriedade do AIOX Squad. Para uso interno do outbili (V4 Bilinski) recomenda-se:

1. Substituir 100% da identidade visual (cor, fonte, palavras "AIOX") pela do outbili.
2. Adaptar parâmetros (delays, durations) para o ritmo da Institucional.
3. Não copiar o brandbook completo — apenas a mecânica das animações.

A literatura técnica de Framer Motion é toolset público; a configuração específica é referência criativa, não código reutilizado verbatim.
