# Blueprint UX — Análises BDR (Método Baziotti)

**"O usuário é desprovido de inteligência."** Cada elemento é projetado para que o BDR não precise pensar — só agir.

---

## 1. Auditoria UX — 8 Dimensões

### Score por tab

| Dimensão | Travas | Projeção Comp. | Playbook BDR |
|----------|:------:|:--------------:|:------------:|
| Hierarquia visual | A | A | A |
| Carga cognitiva | B→A | B→A | A |
| Vieses cognitivos | A | A | A |
| CTAs | A | B→A | A |
| Navegação | A | A | A |
| Loading/Empty | A | A | A |
| Mobile | A | B→A | A |
| Gamificação | A | B→A | A |

---

## 2. Hierarquia Visual — F-Pattern com Priming Positivo

### Princípio Baziotti: "Destaque → Complementar → Detalhes"

O BDR scanneia em F: olho vai para o canto superior esquerdo, depois varre horizontal, desce, varre de novo.

**Aplicação nas 3 tabs:**

```
┌─────────────────────────────────────────────────┐
│ [Badge TRAVA PRINCIPAL]  Título da seção    [#]  │  ← F-line 1: POV (maior elemento)
│                                                   │
│ Card destaque (priming positivo)                  │  ← Ancora visual
│ "Restrição: T2 — R$ 25k/mês travado"            │
│                                                   │
│ ┌─ Accordion 1 ──────────────────────────────┐   │  ← F-line 2: detalhes progressivos
│ │ [CRÍTICA]  T1 Cegueira    R$ 15k-30k/mês  │   │
│ └────────────────────────────────────────────┘   │
│ ┌─ Accordion 2 ──────────────────────────────┐   │
│ │ [ALTA]     T2 Exposição   R$ 10k-20k/mês  │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│ [Footer: Produto DR recomendado + CTA]            │  ← Fechamento
└─────────────────────────────────────────────────┘
```

### Regra de tamanhos tipográficos

| Nível | Font | Tamanho | Peso | Cor |
|-------|------|---------|------|-----|
| POV (título principal) | Plus Jakarta Sans | `text-lg` (18px) | `font-bold` | `text-text-primary` |
| Complementar | Inter | `text-sm` (14px) | `font-semibold` | `text-text-primary` |
| Body | Inter | `text-sm` (14px) | `font-normal` | `text-text-secondary` |
| Caption/label | Inter | `text-[11px]` | `font-medium uppercase tracking-wider` | `text-text-muted` |
| Dados financeiros | JetBrains Mono | `text-base`/`text-xl` | `font-bold` | `text-error` (impacto) / `text-success` (ganho) |
| Chips/sinais | Inter | `text-[10px]` | `font-medium` | `text-text-secondary` em `bg-white/[0.05]` |

---

## 3. Alert Hierarchy — Sistema 3+5+5

### 3 níveis de severidade (travas)

| Severidade | Badge variant | Accent color (borda esquerda) | Glow? | Ícone |
|-----------|---------------|------------------------------|-------|-------|
| CRÍTICA | `error` + `pulse` | `var(--color-error)` | Sim, pulse-glow | `AlertTriangle` |
| ALTA | `warning` | `var(--color-warning)` | Não | `AlertTriangle` |
| MÉDIA | `default` | `var(--color-text-muted)` | Não | `Info` |

### Padrão visual do AccordionItem por severidade

```typescript
// CRÍTICA: borda vermelha, pulse, auto-expand
<AccordionItem
  accentColor="var(--color-error)"
  defaultOpen={true}
  className="shadow-[0_0_12px_rgba(239,68,68,0.08)]"
  title={<>
    <Badge variant="error" pulse size="sm">CRÍTICA</Badge>
    <span className="text-sm font-semibold text-text-primary ml-3">{nome}</span>
    <span className="ml-auto text-xs font-mono text-error">{impacto}</span>
  </>}
/>

// ALTA: borda laranja, fechada
<AccordionItem
  accentColor="var(--color-warning)"
  title={<>
    <Badge variant="warning" size="sm">ALTA</Badge>
    ...
  </>}
/>

// MÉDIA: borda sutil, fechada
<AccordionItem
  accentColor="var(--color-text-muted)"
  title={<>
    <Badge variant="default" size="sm">MÉDIA</Badge>
    ...
  </>}
/>
```

---

## 4. Vieses Cognitivos Aplicados

| Viés | Onde aplica | Como implementar |
|------|-----------|------------------|
| **Aversão à perda** | Card destaque de Travas | "R$ 25.000/mês sendo desperdiçado" (vermelho, font-mono, grande) |
| **Ancoragem** | Projeção Competitiva | Primeiro cenário mostrado = "Com Destrava" (ganho, verde). Ancora positivamente antes de mostrar a perda |
| **Escassez temporal** | Playbook BDR | "Cada mês sem ação = R$ X perdido" no rodapé |
| **Prova social** | STEP → Estratégia | "87% dos clientes atingem meta no trimestre 2" |
| **Default effect** | Sub-abas Playbook | WhatsApp é a aba ativa por default (canal mais usado para outbound BR) |
| **Reconhecimento de padrões** | Todas | Mesmo layout de card em todas as tabs. AccordionItem é o padrão universal de expansão |
| **Efeito Von Restorff** | Trava principal | Única com `pulse-glow` e `shadow`. Se destaca de todas as outras |
| **Lei de Hick** | Dropdown Análises | Máximo 3 tabs (era 4). Menos opções = decisão mais rápida |
| **Zeigarnik** | Gamificação progresso | Barra incompleta (3/5 ações feitas) cria tensão para completar |

---

## 5. Gamificação da Jornada BDR

### Barra de progresso no header de cada tab

```
┌─────────────────────────────────────────────────┐
│  Diagnóstico de Travas          Progresso: 2/5  │
│  ████████░░░░░░░░  40%                          │
│  "Faltam 3 ações para completar a análise"      │
└─────────────────────────────────────────────────┘
```

**Implementação:**

```typescript
// Contagem de ações completadas pelo BDR
interface BdrProgress {
  travasAnalisadas: boolean     // Expandiu pelo menos 1 trava
  projecaoVisualizada: boolean  // Visitou tab Projeção
  scriptCopiado: boolean        // Copiou pelo menos 1 script
  canalEscolhido: boolean      // Selecionou canal no Playbook
  produtoIdentificado: boolean  // Scrollou até produto DR
}
```

**Visual da barra:**
```typescript
<div className="flex items-center gap-3 mb-4">
  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
    <div
      className="h-full rounded-full bg-gradient-to-r from-red to-red-vivid transition-all duration-500"
      style={{ width: `${(completed / total) * 100}%` }}
    />
  </div>
  <span className="text-[11px] font-mono text-text-muted">{completed}/{total}</span>
</div>
```

**Regra:** progresso é local (useState), não persiste. É um nudge visual, não um tracking.

---

## 6. Loading States e Empty States

### Loading (Skeleton pattern — Baziotti: "mostrar esqueleto, nunca tela branca")

```typescript
// Skeleton para card de trava
<div className="space-y-3 animate-pulse">
  <div className="flex items-center gap-3">
    <div className="h-5 w-16 rounded-full bg-surface-lt" />  {/* Badge */}
    <div className="h-4 w-48 rounded bg-surface-lt" />        {/* Título */}
    <div className="ml-auto h-4 w-24 rounded bg-surface-lt" />{/* Valor */}
  </div>
  <div className="h-20 rounded-xl bg-surface-lt" />           {/* Card body */}
</div>
```

Repetir 3x com `opacity` decrescente: 100%, 60%, 30% (progressive fade).

### Empty States (quando lead não tem dados suficientes)

```typescript
// Empty state — orientar ação, nunca genérico
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Search className="h-8 w-8 text-text-muted mb-3 opacity-40" />
  <p className="text-sm font-medium text-text-secondary mb-1">
    Dados insuficientes para diagnóstico
  </p>
  <p className="text-xs text-text-muted mb-4">
    Enriqueça o lead com CNPJá + Assertiva para gerar análise completa
  </p>
  <Button size="sm" onClick={enrichLead}>
    Enriquecer agora
  </Button>
</div>
```

**Regra Baziotti:** empty state SEMPRE tem CTA de ação. "Nunca deixe o usuário olhando para o vazio."

---

## 7. Layout Condicional Mobile vs Desktop

### Desktop (md+)

```
┌────────────────────────────────────────────────────────┐
│  [Resumo] [SPICED] [Reunião]  [▼ Diagnóstico de Travas] │
├────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Card destaque ──────────────────────────────────┐   │
│  │  Restrição principal: T2 Exposição               │   │
│  │  R$ 25.000/mês travado                           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Grid 2 cols ────────────────────────────────────┐   │
│  │ ┌─ Accordion ─┐  ┌─ Accordion ─┐               │   │
│  │ │ T1 Cegueira │  │ T3 Atenção  │               │   │
│  │ └─────────────┘  └─────────────┘               │   │
│  │ ┌─ Accordion ─┐  ┌─ Accordion ─┐               │   │
│  │ │ T4 Interesse│  │ T6 Posic.   │               │   │
│  │ └─────────────┘  └─────────────┘               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Footer ─────────────────────────────────────────┐   │
│  │  DR-X recomendado  |  R$ 4k  |  [Copiar pitch]  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Mobile (< md)

```
┌──────────────────────────┐
│ [▼ Diagnóstico de Travas]│
├──────────────────────────┤
│ ┌─ Card destaque ──────┐ │
│ │ T2 Exposição         │ │
│ │ R$ 25k/mês           │ │
│ └──────────────────────┘ │
│                            │
│ ┌─ Accordion stack ────┐ │  ← 1 coluna, full-width
│ │ T1 Cegueira          │ │
│ ├──────────────────────┤ │
│ │ T3 Atenção           │ │
│ ├──────────────────────┤ │
│ │ T4 Interesse         │ │
│ └──────────────────────┘ │
│                            │
│ [DR-X | R$ 4k | Copiar]   │  ← Sticky bottom no mobile
└──────────────────────────┘
```

**Classes Tailwind responsivas:**

```typescript
// Grid: 1 col mobile, 2 cols desktop
"grid grid-cols-1 md:grid-cols-2 gap-3"

// Card destaque: full-width sempre
"col-span-full"

// Footer produto: sticky bottom no mobile
"md:relative fixed bottom-0 left-0 right-0 md:bottom-auto z-30 p-4 bg-surface border-t border-border md:border md:rounded-xl"

// Touch targets: mínimo 44px
"min-h-[44px]"

// Scroll horizontal no Playbook sub-abas (mobile)
"flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
```

---

## 8. Especificação por Tab

### Tab 1: Diagnóstico de Travas

**Layout hierarchy:**

```
1. Header row
   ├── Ícone AlertTriangle (h-4 w-4 text-error)
   ├── Título "Diagnóstico de Travas" (text-sm font-semibold font-heading)
   ├── Badge count travas (text-text-muted)
   └── Barra progresso gamificação (h-1.5 rounded-full)

2. Card destaque TOC (col-span-full)
   ├── Label "RESTRIÇÃO PRINCIPAL" (text-[10px] uppercase tracking-wider text-error)
   ├── Nome trava (text-lg font-bold text-text-primary)
   ├── Impacto (text-xl font-bold font-mono text-error)
   ├── Ação imediata (text-sm text-text-secondary, bg-error/5 p-3 rounded-lg)
   └── Fundo: bg-error/[0.06] border border-error/20 rounded-xl p-5

3. Grid de travas (grid-cols-1 md:grid-cols-2 gap-3)
   └── AccordionItem por trava:
       ├── Title row: [Badge severidade] + nome + impacto R$
       └── Content expandido:
           ├── Chips sinais detectados (flex flex-wrap gap-1.5)
           │   └── Cada chip: text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-secondary
           ├── Bloco STEP (4 rows, border-l-2 com cores progressivas)
           │   ├── S (border-red/30): Situação atual
           │   ├── T (border-error/30): Trava identificada
           │   ├── E (border-warning/30): Estratégia V4
           │   └── P (border-success/30): Produto DR
           ├── Impacto financeiro (p-2.5 rounded-lg bg-white/[0.03] border border-border)
           │   └── R$ X–Y/mês (font-mono font-semibold text-error)
           └── Ação BDR (p-3 rounded-lg bg-red/[0.05] border border-red/15)
               └── Texto + CopyButton

4. Footer produto DR (mt-4 p-5 rounded-xl bg-red/[0.05] border border-red/20)
   ├── Nome: "DR-X — Raio-X Diagnóstico" (font-semibold text-red)
   ├── Faixa: "R$ 4.000" (font-mono)
   ├── Justificativa (text-xs text-text-secondary)
   └── CopyButton "Copiar pitch"
```

**Bloco STEP — especificação visual:**

```typescript
<div className="space-y-0 mt-3">
  {['S', 'T', 'E', 'P'].map((letter, i) => {
    const colors = ['border-red/40', 'border-error/40', 'border-warning/40', 'border-success/40']
    const bgs = ['bg-red/[0.03]', 'bg-error/[0.03]', 'bg-warning/[0.03]', 'bg-success/[0.03]']
    const labels = ['Situação', 'Trava', 'Estratégia', 'Produto']
    return (
      <div key={letter} className={`border-l-2 ${colors[i]} ${bgs[i]} px-3 py-2.5`}>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
          {letter} — {labels[i]}
        </span>
        <p className="text-sm text-text-secondary mt-0.5">{step[letter.toLowerCase()]}</p>
      </div>
    )
  })}
</div>
```

---

### Tab 2: Projeção Competitiva

**Layout hierarchy:**

```
1. Header row
   ├── Ícone TrendingUp (h-4 w-4 text-success)
   ├── Título "Projeção Competitiva" (text-sm font-semibold)
   └── Segmento badge (text-[10px] bg-white/[0.05] rounded-full)

2. Benchmark do nicho (tabela comparativa)
   ├── Cabeçalho: "Dimensão | Lead | Benchmark | Gap"
   ├── 6-8 rows com dimensões competitivas
   │   ├── Cada nível: Badge com cor (Forte=success, Média=warning, Fraca=error)
   │   └── Gap: seta ↑ verde ou ↓ vermelha
   └── Fundo: bg-white/[0.02] rounded-xl overflow-hidden

3. Cards cenários (grid-cols-1 md:grid-cols-3 gap-3)
   ├── "Com Destrava" (border-success/30, bg-success/[0.04])
   │   ├── Label "CENÁRIO OTIMISTA" (text-[10px] text-success)
   │   ├── +R$ XX.000/mês (text-xl font-mono font-bold text-success)
   │   ├── Travas resolvidas (chips success)
   │   └── R$ XXX.000/ano (text-sm font-mono)
   ├── "Sem ação" (border-border, bg-white/[0.02])
   │   ├── Label "CENÁRIO ATUAL" (text-[10px] text-text-muted)
   │   ├── R$ 0 (text-xl font-mono text-text-muted)
   │   └── "Estagnação + inflação corroendo margem"
   └── "Concorrente cresce" (border-error/30, bg-error/[0.04])
       ├── Label "CENÁRIO DE RISCO" (text-[10px] text-error)
       ├── -R$ XX.000/mês (text-xl font-mono font-bold text-error)
       └── "Market share cedido para concorrentes digitais"

4. Gaps para resolver (space-y-2 mt-4)
   └── Cada gap: flex row
       ├── "Presença digital" (text-sm)
       ├── Badge "Fraca" (error) → seta → Badge "Forte" (success)
       └── "com DR-O" (text-xs text-text-muted)

5. Oportunidades do segmento (p-4 rounded-xl bg-surface-md border border-border)
   └── Lista com ícone ChevronRight + texto (text-sm text-text-secondary)
```

**Cenários — viés de ancoragem:**
- SEMPRE mostrar "Com Destrava" PRIMEIRO (esquerda no desktop, topo no mobile)
- Priming positivo: o primeiro número que o BDR vê é o GANHO, não a perda
- O cenário de risco é o último — aversão à perda reforça a urgência

---

### Tab 3: Playbook BDR

**Layout hierarchy:**

```
1. Header row
   ├── Ícone MessageCircle (h-4 w-4 text-whatsapp)
   ├── Título "Playbook BDR" (text-sm font-semibold)
   └── Trava-gancho badge (text-[10px])

2. Contexto rápido (p-4 rounded-xl bg-surface-md border border-border mb-4)
   ├── "Empresa: {companyName} | Segmento: {segment} | Trava: {T2}"
   └── 2 linhas max (text-sm text-text-secondary)

3. Sub-abas de canal (flex gap-1 border-b border-border)
   ├── [WhatsApp] (default ativo — viés default effect)
   │   ├── Ícone WhatsApp (h-3.5 w-3.5)
   │   └── Active: text-whatsapp border-b-2 border-whatsapp
   ├── [LinkedIn]
   │   ├── Ícone Linkedin (h-3.5 w-3.5)
   │   └── Active: text-info border-b-2 border-info
   └── [Ligação]
       ├── Ícone Phone (h-3.5 w-3.5)
       └── Active: text-red border-b-2 border-red

4. Conteúdo do canal ativo (space-y-4 mt-4)

   === WhatsApp ===
   ├── Card "Abertura" (bg-whatsapp/[0.04] border border-whatsapp/15 rounded-xl p-4)
   │   ├── Label "PRIMEIRA MENSAGEM" (text-[10px] text-whatsapp uppercase)
   │   ├── Texto personalizado (text-sm text-text-secondary, max 300 chars)
   │   ├── CopyButton (ml-auto)
   │   └── Contador chars (text-[10px] text-text-muted, warn se > 300)
   ├── Card "Follow-up 48h" (mesma estrutura, bg-warning/[0.04])
   ├── Cards "Objeções" (AccordionItem, 3 objeções)
   │   ├── Title: objeção em itálico (text-error)
   │   └── Content: resposta + CopyButton
   └── Card "CTA Reunião" (bg-red/[0.06] border border-red/20, destaque)
       ├── Texto final de fechamento
       └── CopyButton "Copiar CTA"

   === LinkedIn ===
   ├── Card "Nota de conexão" (max 300 chars, contador visível)
   ├── Card "InMail" (se não aceitar)
   └── Card "Comentário em post" (sugestão de engajamento)

   === Ligação ===
   ├── Card "Abertura (30s)" com timer visual
   ├── Cards "3 perguntas" (numbered list)
   ├── Card "Frase-gatilho" (destaque vermelho)
   ├── AccordionItems "5 objeções" com respostas
   └── Card "Fechamento" (CTA reunião)

5. Footer produto DR (igual ao da Tab Travas — consistência)
```

**Sub-abas de canal — especificação CSS:**

```typescript
const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, activeColor: 'text-whatsapp', borderColor: 'border-whatsapp' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, activeColor: 'text-info', borderColor: 'border-info' },
  { id: 'ligacao', label: 'Ligação', icon: Phone, activeColor: 'text-red', borderColor: 'border-red' },
]

// Botão de canal
<button className={cn(
  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all',
  'border-b-2 cursor-pointer min-h-[44px]',
  active ? `${ch.activeColor} ${ch.borderColor}` : 'text-text-muted border-transparent hover:text-text-secondary',
)}>
  <ch.icon className="h-3.5 w-3.5" />
  {ch.label}
</button>
```

**Card de script — especificação CSS:**

```typescript
// Card de mensagem (WhatsApp exemplo)
<div className="p-4 rounded-xl bg-whatsapp/[0.04] border border-whatsapp/15">
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] uppercase tracking-wider text-whatsapp font-medium">
      PRIMEIRA MENSAGEM
    </span>
    <CopyButton text={message} />
  </div>
  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
    {message}
  </p>
  <div className="flex justify-end mt-2">
    <span className={cn(
      'text-[10px] font-mono',
      message.length > 300 ? 'text-error' : 'text-text-muted',
    )}>
      {message.length}/300
    </span>
  </div>
</div>
```

---

## 9. Micro-interações

| Elemento | Interação | Duração | Easing |
|----------|----------|---------|--------|
| AccordionItem expand | `max-h` transition | 300ms | ease-out |
| Badge pulse (CRÍTICA) | `pulse-glow` keyframe | 2s infinite | ease-in-out |
| CopyButton feedback | Escala 1.03 + cor verde | 250ms + 2s reset | cubic-bezier |
| Tab switch | `fade-in` opacity | 150ms | ease-out |
| Barra progresso | `width` transition | 500ms | ease-out |
| Card hover | `bg-white/[0.03]` | 150ms | ease |
| Cenário card hover | Sutil `scale-[1.01]` + `shadow` | 200ms | ease-out |
| Sub-aba canal switch | `border-bottom` + `color` | 200ms | ease |
| Chip sinal hover | `bg-white/[0.08]` | 150ms | ease |

---

## 10. Tokens CSS Consolidados

### Cores por contexto

```css
/* Travas — severidade */
--trava-critica-bg: rgba(239, 68, 68, 0.06);    /* bg-error/[0.06] */
--trava-critica-border: rgba(239, 68, 68, 0.20); /* border-error/20 */
--trava-alta-bg: rgba(245, 158, 11, 0.06);       /* bg-warning/[0.06] */
--trava-alta-border: rgba(245, 158, 11, 0.20);   /* border-warning/20 */

/* Cenários — impacto */
--cenario-ganho-bg: rgba(34, 197, 94, 0.04);     /* bg-success/[0.04] */
--cenario-ganho-border: rgba(34, 197, 94, 0.30); /* border-success/30 */
--cenario-risco-bg: rgba(239, 68, 68, 0.04);     /* bg-error/[0.04] */
--cenario-risco-border: rgba(239, 68, 68, 0.30); /* border-error/30 */

/* Canais — playbook */
--canal-whatsapp-bg: rgba(37, 211, 102, 0.04);   /* bg-whatsapp/[0.04] */
--canal-whatsapp-border: rgba(37, 211, 102, 0.15);
--canal-linkedin-bg: rgba(255, 107, 26, 0.04);   /* bg-info/[0.04] */
--canal-linkedin-border: rgba(255, 107, 26, 0.15);
--canal-ligacao-bg: rgba(230, 51, 41, 0.04);     /* bg-red/[0.04] */
--canal-ligacao-border: rgba(230, 51, 41, 0.15);

/* STEP — progressão */
--step-s-border: rgba(230, 51, 41, 0.40);   /* Situação: vermelho */
--step-t-border: rgba(239, 68, 68, 0.40);   /* Trava: erro */
--step-e-border: rgba(245, 158, 11, 0.40);  /* Estratégia: warning */
--step-p-border: rgba(34, 197, 94, 0.40);   /* Produto: sucesso */
```

### Espaçamento

```
Padding card: p-4 (16px) mobile, p-5 (20px) desktop
Gap entre cards: gap-3 (12px)
Gap entre seções: space-y-5 (20px)
Padding interno accordion: px-4 pb-4
Margem entre título e conteúdo: mb-2 (8px)
```

---

## 11. Checklist de Implementação (Baziotti QA)

### Por tab — validar antes de commitar

- [ ] F-pattern: POV é o maior elemento? Olho vai para onde deve?
- [ ] Hierarquia: Destaque → Complementar → Detalhes respeitados?
- [ ] Contraste: texto legível no dark theme? (mínimo 4.5:1)
- [ ] Touch targets: todos os botões >= 44px no mobile?
- [ ] Progressive disclosure: informação densa está em AccordionItem?
- [ ] Empty state: tem CTA de ação (nunca tela vazia)?
- [ ] Loading state: skeleton com 3 placeholders em fade progressivo?
- [ ] CopyButton: todo texto copiável tem CopyButton?
- [ ] Mobile: layout stack (1 col) no mobile, grid no desktop?
- [ ] Ancoragem: primeiro número visível é positivo (ganho, não perda)?
- [ ] Aversão à perda: impacto financeiro em vermelho, font-mono?
- [ ] Gamificação: barra de progresso visível?
- [ ] ZERO azul: nenhuma cor azulada em nenhum elemento?
- [ ] Responsivo: testado em 375px (iPhone SE)?

---

*Blueprint criado com método Baziotti (1000+ LPs validadas) aplicado a interface de sistema B2B.*
*"Se o BDR precisa pensar para usar, você já perdeu. Pegue na mão dele."*
