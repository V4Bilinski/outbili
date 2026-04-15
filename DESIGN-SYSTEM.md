# OUTBILI Design System

> Extraido da pagina institucional e aplicado em todas as paginas internas.
> Fonte de verdade: `src/globals.css` + `src/pages/InstitucionalPage.tsx`

---

## 1. Cores

### Primarias (V4 Bilinski)

| Token | Hex | Uso |
|-------|-----|-----|
| `red` | `#E63329` | Cor principal, CTAs, acentos |
| `red-vivid` | `#FF3B30` | Gradientes, barras de progresso |
| `red-dark` | `#B91C1C` | Hover de botoes primarios |
| `red-glow` | `rgba(230,51,41,0.35)` | Box-shadow glow |
| `red-subtle` | `rgba(230,51,41,0.08)` | Backgrounds sutis |

### Superficies (Dark Theme)

| Token | Hex | Uso |
|-------|-----|-----|
| `bg` | `#09090B` | Fundo principal |
| `surface` | `#0F0F12` | Cards, paineis |
| `surface-md` | `#16161A` | Elementos elevados |
| `surface-lt` | `#1E1E24` | Scrollbar, inputs |
| `surface-hover` | `#24242C` | Hover de superficies |
| `border` | `rgba(255,255,255,0.06)` | Bordas padrao |
| `border-strong` | `rgba(255,255,255,0.1)` | Bordas hover/ativas |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `text-primary` | `#F4F4F5` | Titulos, nomes |
| `text-secondary` | `#A1A1AA` | Corpo, descricoes |
| `text-muted` | `#71717A` | Labels, metadata |

### Funcionais (ZERO AZUL)

| Token | Hex | Uso |
|-------|-----|-----|
| `success` | `#22C55E` | Conectado, fechado |
| `warning` | `#F59E0B` | Alerta, morno |
| `error` | `#EF4444` | Erro, perda |
| `info` | `#FF6B1A` | Informativo (laranja, nao azul) |

### Temperatura

| Token | Hex | Label |
|-------|-----|-------|
| `hot` | `#FF3B30` | Quente (score >= 3.7) |
| `warm` | `#FF9F0A` | Morno (score >= 2.5) |
| `cold` | `#71717A` | Frio (score < 2.5) |

### Pipeline Stages

| Token | Hex | Etapa |
|-------|-----|-------|
| `stage-prospect` | `#FF6B1A` | Novo |
| `stage-qualified` | `#A855F7` | Qualificado |
| `stage-contacted` | `#F59E0B` | Contactado |
| `stage-replied` | `#22C55E` | Respondeu |
| `stage-meeting` | `#EC4899` | Reuniao |
| `stage-proposal` | `#F97316` | Proposta |
| `stage-closed` | `#10B981` | Fechado |

### Fontes de Dados

| Token | Hex | Fonte |
|-------|-----|-------|
| `source-cnpja` | `#FF9F0A` | CNPJa |
| `source-assertiva` | `#A855F7` | Assertiva |
| `source-apify` | `#FF6B1A` | Apify |

---

## 2. Tipografia

### Familias

| Uso | Fonte | Fallback |
|-----|-------|----------|
| Titulos | `Plus Jakarta Sans` | system-ui, sans-serif |
| Corpo | `Inter` | system-ui, sans-serif |
| Numeros/Codigo | `JetBrains Mono` | monospace |

### Escala

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `text-micro` | 9px | Badges xs, metadata compacta |
| `text-caption` | 10px | Badges sm, labels secundarios |
| `text-label` | 11px | Labels de secao, tags |
| `text-xs` | 12px | Subtitulos, helpers |
| `text-sm` | 14px | Corpo padrao, nomes em tabelas |
| `text-base` | 16px | Texto principal |
| `text-lg` | 18px | Descricoes longas |
| `text-xl` | 20px | Titulos de pagina |
| `text-2xl` | 24px | Headlines, scores |
| `text-3xl` | 30px | Titulos de secao institucional |

### Pesos

| Peso | Uso |
|------|-----|
| `font-medium` (500) | Labels, corpo enfatizado |
| `font-semibold` (600) | Subtitulos, nomes de cards |
| `font-bold` (700) | Titulos, headlines |
| `font-extrabold` (800) | Scores SPICED, numeros hero |

### Estilos especiais

```css
/* Titulos de pagina */
.gradient-text {
  background: linear-gradient(135deg, #F4F4F5 0%, #A1A1AA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Labels de secao */
text-label font-semibold tracking-[0.1em] uppercase text-red

/* Numeros/metricas */
font-mono font-bold
```

---

## 3. Background

### Camada global (MainLayout)

Todas as paginas internas herdam estes efeitos via `MainLayout.tsx`:

```
1. Radial glow principal (fixo)
   radial-gradient(ellipse 80% 60% at 50% 0%, rgba(230,51,41,0.08), transparent)

2. Grid pattern 60px (fixo)
   linear-gradient(rgba(244,244,245,1) 1px, transparent 1px)
   linear-gradient(90deg, rgba(244,244,245,1) 1px, transparent 1px)
   backgroundSize: 60px 60px
   opacity: 0.03

3. Ambient glow top center
   900x700px, bg-red/[0.04], blur-[140px]

4. Ambient glow right
   500x500px, bg-red/[0.03], blur-[120px]
```

### Camada body (CSS)

```css
body {
  background-image:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(230,51,41,0.06), transparent),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(230,51,41,0.03), transparent);
  background-attachment: fixed;
}
```

### Institucional (adicional)

A pagina institucional adiciona ON TOP do global:
- Decorative dots (top-right e bottom-left): `radial-gradient(rgba(230,51,41,0.15) 1px, transparent 1px)` com `backgroundSize: 20px 20px` e mask elipse
- CTA section glow: `w-[700px] h-[400px] bg-red/[0.05] blur-[120px]`
- Inner card glows: `w-64 h-64 bg-red/[0.04] blur-[80px]`

---

## 4. Componentes

### Card

```
Arquivo: src/components/ui/Card.tsx

Glass (default):
  bg-gradient-to-br from-surface/80 to-surface-md/60
  backdrop-blur-xl border border-border rounded-2xl p-5

Solid:
  bg-surface border border-border rounded-2xl p-5

Hover (prop hover=true):
  hover:-translate-y-1 hover:border-border-strong
  hover:shadow-xl transition-all duration-300

Accent (prop accent):
  border-l-[3px] border-l-{color}
  Opcoes: red, hot, warm, cold, success
```

### Badge

```
Arquivo: src/components/ui/Badge.tsx

Sizes:
  xs → px-1.5 py-px text-micro (9px)
  sm → px-2 py-px text-caption (10px)
  md → px-2.5 py-0.5 text-label (11px)

Variants:
  default  → bg-white/5 text-text-secondary border-white/8
  hot      → bg-hot/12 text-hot border-hot/20 shadow-glow
  warm     → bg-warm/12 text-warm border-warm/20
  cold     → bg-cold/12 text-cold border-cold/20
  success  → bg-success/12 text-success border-success/20
  warning  → bg-warning/12 text-warning border-warning/20
  error    → bg-error/12 text-error border-error/20
  info     → bg-info/12 text-info border-info/20
  outline  → border-white/10 text-text-secondary

Todas: rounded-full font-semibold uppercase tracking-wider
Opcional: pulse (animate-[pulse-glow_2s])
```

### Button

```
Arquivo: src/components/ui/Button.tsx

Variants:
  primary   → bg-red text-white hover:bg-red-dark shadow-red/20
  secondary → bg-white/5 border hover:border-strong
  ghost     → text hover:bg-white/[0.04]
  danger    → bg-error/10 text-error border-error/20
  whatsapp  → bg-whatsapp/15 text-whatsapp

Sizes:
  sm → h-8 px-3 text-xs rounded-lg
  md → h-10 px-4 text-sm rounded-xl
  lg → h-12 px-6 text-sm font-semibold rounded-xl

Todos: transition-all duration-200 cursor-pointer
Active: active:scale-[0.98]
Loading: spinner + disabled
```

### SectionLabel

```
Arquivo: src/components/ui/SectionLabel.tsx

Barra vermelha + label uppercase:
  <div className="flex items-center gap-3 mb-4">
    <div className="w-6 h-0.5 bg-red" />
    <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">
      {label}
    </span>
  </div>
```

### SectionDivider

```
Arquivo: src/components/ui/SectionLabel.tsx

Gradiente horizontal entre secoes:
  <div className="h-px bg-gradient-to-r from-transparent via-red/20 to-transparent my-8" />
```

---

## 5. Animacoes

### Keyframes

| Nome | Duracao | Efeito |
|------|---------|--------|
| `fade-in` | 0.4s ease-out | opacity 0→1, translateY 6px→0 |
| `slide-up` | 0.4s cubic-bezier | opacity 0→1, translateY 16px→0 |
| `scale-in` | 0.4s ease-out | opacity 0→1, scale 0.8→1 |
| `bar-grow` | 0.8s cubic-bezier | width 0%→100% |
| `pulse-glow` | 2s infinite | box-shadow 8px→24px glow vermelho |
| `shimmer` | 1.5s infinite | background-position sweep (skeleton) |
| `shake` | 0.5s ease | translateX +-4px (erro) |
| `slide-in-right` | variavel | translateX 100%→0 |

### AnimateIn (Intersection Observer)

```
Arquivo: src/components/ui/AnimateIn.tsx

Direcoes: up (default), down, left, right, scale
Threshold: 0.1
Transition: all ease-out {duration}ms
Props: delay, duration (default 400ms)

Uso nas paginas:
  <AnimateIn>           → header (delay 0)
  <AnimateIn delay={80}>  → filtros
  <AnimateIn delay={120}> → conteudo
  <AnimateIn delay={160}> → secao secundaria
```

### Padrao de stagger em listas

```tsx
items.map((item, index) => (
  <AnimateIn key={item.id} delay={100 + Math.min(index, 10) * 40}>
    <Card>...</Card>
  </AnimateIn>
))
```

---

## 6. Layout

### MainLayout

```
Sidebar: fixed left, 260px (expandido) / 72px (colapsado)
Content: p-5 md:p-8, max-w-[1400px] mx-auto
Mobile: header fixo 56px top, bottom nav fixo
```

### Padrao de pagina

```
<div className="space-y-5">                    ← gap entre secoes
  <AnimateIn>
    <header>                                    ← titulo + acoes
      <h1 className="text-xl font-bold font-heading gradient-text">
      <p className="text-xs text-text-muted mt-0.5">
    </header>
  </AnimateIn>

  <SectionDivider />                            ← gradiente entre secoes

  <AnimateIn delay={80}>
    <section>conteudo principal</section>
  </AnimateIn>

  <SectionDivider />

  <AnimateIn delay={120}>
    <section>conteudo secundario</section>
  </AnimateIn>
</div>
```

### Grids responsivos

```
KPIs:     grid grid-cols-2 md:grid-cols-4 gap-3
Cards:    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
Duplo:    grid md:grid-cols-2 gap-5
Tabela:   w-full com colunas hidden md:table-cell
```

### Containers

| Classe | Largura | Uso |
|--------|---------|-----|
| `max-w-[1400px]` | 87.5rem | Layout principal |
| `max-w-5xl` | 64rem | Secoes institucional |
| `max-w-3xl` | 48rem | Blocos de conteudo |
| `max-w-lg` | 32rem | Inputs de busca |

---

## 7. Formularios

### Inputs

```
h-9 md:h-11 w-full rounded-xl
bg-white/[0.03] border border-border
text-sm text-text-primary
placeholder:text-text-muted
focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20
transition-colors
```

### Labels

```
text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block
```

### Select

```
Mesmo estilo do input + appearance-none cursor-pointer
```

---

## 8. Regras inviolaveis

1. **ZERO AZUL** — nenhuma cor azul em nenhum lugar do sistema
2. **Dark theme only** — nao ha light mode (exceto WhatsApp inbox)
3. **Vermelho e a cor de acao** — CTAs, acentos, indicadores ativos
4. **Sem emojis como icones** — usar Lucide icons (SVG)
5. **cursor-pointer** em todos os elementos clicaveis
6. **prefers-reduced-motion** respeitado globalmente
7. **Font-size minimo 16px** em inputs (prevencao de zoom mobile)
8. **Transicoes 150-300ms** em todos os estados interativos
9. **Contraste minimo 4.5:1** para texto sobre superficies

---

## 9. Arquivos de referencia

| Arquivo | Conteudo |
|---------|----------|
| `src/globals.css` | Tokens, keyframes, utilitarios |
| `src/components/ui/Card.tsx` | Componente Card |
| `src/components/ui/Badge.tsx` | Componente Badge |
| `src/components/ui/Button.tsx` | Componente Button |
| `src/components/ui/SectionLabel.tsx` | SectionLabel + SectionDivider |
| `src/components/ui/AnimateIn.tsx` | Animacao por Intersection Observer |
| `src/components/layout/MainLayout.tsx` | Background global + layout |
| `src/pages/InstitucionalPage.tsx` | Referencia visual completa |
| `src/lib/cn.ts` | clsx + tailwind-merge |
