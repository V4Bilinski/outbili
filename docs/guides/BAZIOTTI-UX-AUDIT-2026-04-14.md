# Auditoria UX/UI Completa — Metodologia Baziotti
## OUTBILI — V4 Bilinski & Co

**Data:** 2026-04-14
**Auditor:** Baziotti Framework (Ricardo Baziotti + Psicologia Cognitiva)
**Escopo:** Sistema completo — 11 páginas, 10 componentes UI, 4 layouts, Design System

---

## Score Geral: 7.1/10

| Dimensão | Score | Classificação |
|----------|-------|---------------|
| 1. Hierarquia Visual | 8/10 | Sólida |
| 2. Carga Cognitiva | 7/10 | Boa, com pontos de melhoria |
| 3. Vieses Cognitivos | 8/10 | Bem aplicados |
| 4. Psicologia das Cores | 5/10 | **VIOLAÇÕES GRAVES** — azul proibido presente |
| 5. CTAs | 7/10 | Funcionais, melhoráveis |
| 6. Navegação | 8/10 | Consistente desktop/mobile |
| 7. Forms | 7/10 | Bom, falta validação inline |
| 8. Jornada do Usuário | 7/10 | Clara, com buracos |

---

## 1. HIERARQUIA VISUAL — 8/10

### O que funciona
- **F-Pattern bem aplicado:** Dashboard Hero Card com número grande (text-5xl) → contexto (text-sm) → mini-spark (text-[10px]). Exatamente o padrão: Destaque → Complementar → Detalhes
- **Font separation:** Plus Jakarta Sans para headings cria distinção clara contra Inter para body
- **Gradient-text no h1:** Cria ancoragem visual no título principal
- **Temperature tank bar:** Visualização horizontal intuitiva com proporção das cores

### Problemas encontrados

**P2 — Tamanhos de fonte arbitrários sem escala tipográfica definida**
Encontrados: `text-[9px]`, `text-[10px]`, `text-[11px]` em dezenas de componentes. Não há uma type scale formal — cada componente escolhe o tamanho ad-hoc.

**Recomendação:** Definir tokens de type scale no globals.css:
```css
--text-2xs: 9px;   /* captions, badges internos */
--text-xs: 10px;   /* labels, metadata */
--text-sm: 11px;   /* supporting text */
```

**P2 — CardTitle inconsistente**
`CardTitle` usa `text-sm` + uppercase + tracking. Em alguns lugares, títulos de seção são `text-xs` ou `text-[10px]` sem o componente CardTitle. Inconsistência visual.

---

## 2. CARGA COGNITIVA — 7/10

### O que funciona
- **Progressive disclosure:** CompanyPage usa tabs primários (3) e secundários (4), reduzindo informação visível
- **Staggered animations:** `animationDelay: Math.min(index, 20) * 30ms` — smooth, cap em 600ms máximo
- **Empty states informativos:** EmptyState com ícone + título + descrição + CTA acionável
- **Lei de Hick respeitada:** Sidebar com 7 itens + 2 admin (dentro do limite 7±2)

### Problemas encontrados

**P1 — CompanyPage: excesso de tabs sem indicador de profundidade**
7 tabs total (3 primários + 4 secundários) para informação densa. O toggle `showMoreTabs` esconde as 4 tabs extras, mas não há breadcrumb visual de "onde estou dentro do lead".

**P1 — Dashboard com 5+ seções sem âncoras de scroll**
KPICards → NextActions → CampaignStats → PipelineFunnel → QuickActions. Em mobile, o usuário scrolla sem saber o que vem abaixo. Falta skeleton de sections visíveis ou sticky header indicando progresso.

**P2 — SearchPage: TagInput para segmentos é complexo demais**
Tag input com suggestions dropdown + keyboard handlers + autocomplete. Para o público alvo (SDR/vendedor), um grid de chips clicáveis seria 3x mais rápido que digitar e selecionar.

---

## 3. VIESES COGNITIVOS — 8/10

### Bem aplicados
- **Ancoragem (score SPICED):** Número em destaque no primeiro elemento visual, ancora a percepção de qualidade do lead
- **Escassez:** Temperatura "Quente" com cores urgentes (vermelho) + CTA imediato "Prontos para contato direto"
- **Prova social implícita:** Contadores animados (CountUpValue) criam sensação de volume e atividade
- **Reconhecimento de padrões:** Mesmas cores de temperatura SEMPRE (hot=vermelho, warm=laranja, cold=cinza). Consistência total
- **Default Effect:** Formulários com selects pre-populados com as opções mais comuns (estados: SP, RJ, MG)

### Problemas encontrados

**P2 — Aversão à perda NÃO explorada**
Nenhuma feature mostra "o que você está perdendo por não agir". Os leads frios não mostram "X dias sem contato — risco de perder". Oportunidade de marketing psicológico desperdiçada.

**P2 — TabReuniao é gold-tier mas está escondida**
45 minutos de guia de reunião consultativa com gatilhos psicológicos (Reciprocidade, Aversão à Perda, Ancoragem, Autoridade, Urgência) — mas fica numa aba que o SDR pode nunca clicar. "Falei, mostrei" — se é valioso, precisa ser VISÍVEL.

---

## 4. PSICOLOGIA DAS CORES — 5/10 ⚠️ CRÍTICO

### VIOLAÇÕES BRANDBOOK BRABISSIMO — AZUL PROIBIDO

**P0 — 14 instâncias de AZUL encontradas no código:**

| Arquivo | Linha | Cor proibida | Contexto |
|---------|-------|-------------|----------|
| `SearchPage.tsx` | 1299 | `blue-500/10`, `text-blue-400` | Tags de estados selecionados |
| `SearchPage.tsx` | 1301 | `hover:text-blue-300` | Hover do botão remover estado |
| `SearchPage.tsx` | 1353 | `text-blue-400`, `bg-blue-500/10` | Histórico de pesquisa — estados |
| `CompanyPage.tsx` | 472 | `bg-blue-500/10`, `text-blue-400` | Badge "Matriz" |
| `CompanyPage.tsx` | 505 | `bg-blue-500/10`, `text-blue-400` | Badge tipo "PF" (Pessoa Física) |
| `PipelinePage.tsx` | 19 | `#6366F1`, `border-l-indigo-500` | **STAGE "Prospecção" inteiro em INDIGO** |
| `AdminPage.tsx` | 24 | `text-cyan-400` | Atividade "Pesquisou" |
| `PescaPanel.tsx` | 561 | `text-cyan-400/60` | Label "CNPJa API" |

**Também encontrados cyan e purple (espectro azul):**
| `CompanyPage.tsx` | 543 | `text-cyan-400` | Source "cnpja" |
| `PescaPanel.tsx` | 563 | `text-purple-400/60` | Label "Assertiva" |
| `PipelinePage.tsx` | 20 | `#A855F7`, `border-l-purple-500` | Stage "Qualificação" |
| `SearchPage.tsx` | 1311 | `purple-500/10`, `text-purple-400` | Tags de keywords |
| `AdminPage.tsx` | 19 | `text-purple-400` | Atividade "Enriqueceu" |

### Substituições recomendadas

| Cor proibida | Substituir por | Token recomendado |
|-------------|---------------|-------------------|
| `blue-400/500` (tags estado) | `text-info` (#FF6B1A laranja) | `--color-info` |
| `indigo-500` (#6366F1, pipeline) | `#8B5CF6` (violeta) ou `#E63329` (red) | Novo token `--color-stage-new` |
| `cyan-400` (sources) | `text-warning` ou novo token amber | `--color-source-api` |
| `purple-400/500` (keywords, enrich) | Manter purple se for violeta, eliminar se tiver subtom azul | Validar hue < 280° |

### O que funciona bem
- Surface elevation system cria profundidade premium (5 níveis de bg → surface-hover)
- Red glow (`rgba(230, 51, 41, 0.06/0.03)`) no body background — sutil, premium
- Functional colors (success/warning/error) sem azul — correto
- Temperature colors 100% consistentes — hot/warm/cold sem ambiguidade
- WhatsApp green (#25D366) como cor dedicada — correto

---

## 5. CTAs (Call-to-Action) — 7/10

### O que funciona
- **Verbos no imperativo:** "Iniciar pesquisa", "Ver pipeline", "Nova pesquisa" — direto, acionável
- **Contraste visual forte:** Botão primary (bg-red text-white) destaca contra dark surfaces
- **Touch targets adequados:** Button sm=h-8 (32px⚠️), md=h-10 (40px⚠️), lg=h-12 (48px✅)
- **Active scale (0.97):** Feedback tátil no mobile — boa prática

### Problemas encontrados

**P1 — Button sm (h-8 = 32px) viola touch target mínimo de 44px**
Múltiplos botões sm na interface (`WhatsApp`, `Ver ficha`, `Preparar` no NextActions, filtros de leads). O Apple HIG e WCAG 2.5.5 exigem mínimo 44px. O `h-8` é 32px — 12px abaixo do mínimo.

**Fix:** Mudar sizeStyles.sm de `h-8` para `h-9` (36px) no mínimo, ou melhor `min-h-[44px]`.

**P2 — Dashboard empty state: CTAs corretos mas falta CTA na Hero com leads**
Quando tem leads, o Dashboard mostra apenas "Nova pesquisa" (secondary sm). O CTA primário para o usuário com leads deveria ser "Leads quentes — agir agora" (ancoragem no que tem maior urgência). O CTA mais importante está enterrado nos NextActions.

**P2 — Regra Baziotti do primeiro CTA violada em SearchPage**
O botão "Buscar" (submit) deveria revelar a próxima seção (resultados). Mas ele dispara a busca que leva a uma tela de loading completa. Não é scroll-to-section, é full page state change. Aceitável para SPA, mas poderia ter preview de resultados inline.

---

## 6. NAVEGAÇÃO — 8/10

### O que funciona
- **Sidebar desktop:** 7 itens respeitando Lei de Hick. Collapse/expand suave (300ms ease-in-out)
- **BottomNav mobile:** 5 itens com sliding indicator — feedback visual claro do estado ativo
- **Admin-only items:** Itens bloqueados mostram `cursor-not-allowed` + `text-white/20` — visualmente distintos
- **Breadcrumb no CompanyPage:** `Leads > NomeEmpresa` — profundidade clara
- **MobileHeader:** Simples, funcional, logo centralizado

### Problemas encontrados

**P1 — BottomNav mostra Pipeline e Msgs para todos, mas são admin-only**
O BottomNav.tsx inclui Pipeline e Msgs sem verificação `isAdmin`. O Sidebar.tsx bloqueia corretamente com `adminOnly: true`, mas o BottomNav não implementa essa lógica. Usuários não-admin veem botões que levam a página que eles podem acessar mas que pode estar vazia ou causar confusão.

**P2 — Navegação Reports inacessível no mobile**
Não há link para Reports no BottomNav (5 itens: Home, Busca, Leads, Pipeline, Msgs). Relatórios só é acessível pelo Sidebar desktop ou drawer mobile. O SDR no celular precisa abrir o drawer só para acessar relatórios.

**P2 — Mobile drawer fecha ao navegar (correto), mas não há gesto de swipe**
O drawer fecha via `onClick backdrop` ou `X button`. Falta suporte a swipe-to-close, esperado em mobile apps modernos.

---

## 7. FORMS — 7/10

### O que funciona
- **Labels acima dos campos:** LoginPage com labels `text-[11px] uppercase tracking-[0.1em]` — padrão Baziotti
- **Validação com toast:** `toast.error()` para campos vazios e senha curta
- **Placeholder descritivo:** "Mínimo 6 caracteres", "seu@email.com" — orienta o usuário
- **Input font-size 16px:** Previne zoom automático no iOS — boa prática técnica
- **Password visibility toggle:** Eye/EyeOff padrão

### Problemas encontrados

**P1 — Validação NÃO é inline**
LoginPage valida APÓS submit com toast. O Baziotti exige validação inline em tempo real. O campo de senha deve mostrar estado de erro/sucesso enquanto digita (6 chars → verde). O email deve validar formato enquanto digita.

**P2 — AddContactForm (CompanyPage) não tem indicação visual de obrigatórios**
O form de adicionar contato requer nome e WhatsApp, mas não há `*` ou `(obrigatório)` visual. O usuário só descobre ao submeter.

**P2 — Select dropdowns nativos no mobile**
Os `<select>` filtros de LeadsPage e SearchPage usam select nativo, que no iOS abre um picker modal grande. Funcional, mas visualmente desconectado do design system.

---

## 8. JORNADA DO USUÁRIO — 7/10

### Jornada principal mapeada

```
Login → Dashboard (vazio) → Pesquisa → Leads → CompanyPage → Pipeline → Reunião
```

### O que funciona
- **Onboarding (empty state):** Dashboard vazio mostra hero + "Como funciona" em 4 steps + Quick start — guia o novo usuário
- **Progressão clara:** Pesquisa → Enriquecimento → Leads → Qualificação → Pipeline — lógica de CRM respeitada
- **Curiosity messages durante busca:** "Cruzando dados da Receita Federal..." — reduz percepção de espera
- **SearchHistory:** Pesquisas recentes salvas em localStorage — continuidade de sessão

### Problemas encontrados

**P1 — Não há onboarding step-by-step para primeiro uso**
O empty state do Dashboard mostra informação, mas não guia o usuário passo a passo. Após a primeira pesquisa, o dashboard muda completamente sem transição explicativa. Falta um "tour" ou "wizard" de primeiros passos.

**P1 — Lead status é read-only no CompanyPage**
O GAP-ANALYSIS já identificou: o badge de status no CompanyPage é display-only. O SDR não pode mudar o status ali — precisa ir ao Pipeline (outra página) para arrastar. Fricção desnecessária na jornada principal.

**P1 — Caminho para contato WhatsApp tem 3+ cliques**
Dashboard → Clica no lead → CompanyPage → Encontra contato → Clica WhatsApp. São 3-4 interações para a ação mais frequente do SDR. Deveria ter botão WhatsApp direto no card de NextActions (parcialmente implementado, mas nem todos os leads mostram).

**P2 — Pipeline drag-and-drop não tem feedback de sucesso**
Ao mover um card no Kanban, não há confetti, toast de sucesso, ou animação de confirmação. O card simplesmente aparece na nova coluna. Falta micro-interação de "vitória" (Zeigarnik effect — conclusão de tarefa).

---

## RESUMO DE FIXES PRIORIZADOS

### P0 — Crítico (Fazer AGORA)
1. **Eliminar todas as 14 instâncias de azul** — Viola brandbook Brabissimo. Substituir blue→info/warning, indigo→violet, cyan→warning

### P1 — Alta Prioridade (Sprint atual)
2. **Button sm touch target** — h-8 (32px) → min-h-[44px]
3. **BottomNav admin-only check** — Aplicar mesma lógica do Sidebar
4. **Validação inline nos forms** — Login + AddContact
5. **Status editável no CompanyPage** — Dropdown ou select para mudar status sem sair da página
6. **Reports no BottomNav mobile** — Substituir um item ou adicionar "Mais" overflow

### P2 — Média Prioridade (Próximo sprint)
7. **Type scale formal** — Definir tokens para text-2xs/xs/sm ao invés de valores arbitrários
8. **Aversão à perda** — Mostrar "X dias sem contato" nos leads frios
9. **Pipeline micro-interação** — Toast/animação ao mover card de stage
10. **Dashboard scroll anchors** — Section headers sticky no mobile
11. **Tab Reunião mais visível** — Badge/indicator mostrando que há conteúdo estratégico preparado
12. **SearchPage chips** — Substituir TagInput de segmentos por grid de chips clicáveis

---

## DESIGN SYSTEM — TOKENS AUSENTES

Tokens que DEVERIAM existir no globals.css mas NÃO existem:

```css
/* Type scale (formalizar os arbitrários) */
--text-2xs: 9px;
--text-xs: 10px;
--text-sm: 11px;

/* Source/provider colors (substituir blue/cyan) */
--color-source-cnpja: #FF9F0A;    /* warm */
--color-source-assertiva: #8B5CF6; /* violet, NOT blue */
--color-source-apify: #FF6B1A;    /* info orange */

/* Pipeline stage colors (sem azul) */
--color-stage-prospect: #8B5CF6;   /* violet */
--color-stage-qualified: #A855F7;  /* purple */
--color-stage-contacted: #F59E0B;  /* amber */
--color-stage-replied: #22C55E;    /* green */
--color-stage-meeting: #EC4899;    /* pink */
--color-stage-proposal: #FF6B1A;   /* orange */
--color-stage-closed: #10B981;     /* emerald */

/* Interaction tokens */
--touch-target-min: 44px;
--transition-fast: 200ms;
--transition-normal: 300ms;
--stagger-delay: 30ms;
--stagger-max: 20;
```

---

*Auditoria conduzida com framework Baziotti — "O usuário é desprovido de inteligência. Se você não pegar na mão dele, qualquer dúvida que gerar é um problema grave."*

*Próximo passo: Implementar fixes P0 (azul) imediatamente, seguido de P1 no sprint atual.*
