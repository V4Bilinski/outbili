# UX-ICON-01 — Trocar emojis usados como icone por lucide-react

**Status:** Ready
**Epic:** UI/UX polish (derivado de `docs/audit/UI-UX-IMPROVEMENT-VALIDATION-2026-06-02.md`)
**Tipo:** Enhancement (frontend, iconografia)
**Origem:** Backlog derivado da UX-MOTION-01. Item mais seguro/rapido do backlog UI/UX.

## Contexto

Varios pontos da UI usam emojis Unicode como icone (configs de dados e ternarios inline).
Emojis renderizam diferente por SO/navegador, nao herdam `currentColor` e quebram a consistencia
visual. Esta story troca os emojis que funcionam como **icone de UI** por `lucide-react` (ja na
stack, v1.6.0, 52 imports existentes), mantendo emojis onde sao **conteudo** ou onde o elemento
nao renderiza SVG.

## Restricoes tecnicas (NAO violar)

1. **`<option>` nao renderiza SVG/componente React** — so texto. Logo, emojis dentro de `<option>`
   ficam como estao. Isso atinge `TEMPERATURES` (`constants.ts`) usado em `LeadsPage`,
   `PipelinePage`, `CampaignsPage`. **MANTER emoji.**
2. **Reacoes de WhatsApp** (`MessageBubble.tsx:188` — 👍❤️😂😢🙏🔥) sao **conteudo enviavel**,
   nao icone de UI. **MANTER emoji.**
3. **Toasts** (`PipelinePage`, `PipelineJourneyStepper` — 🏆🚫📅📝✅ em `toast(...)`) sao
   notificacoes transitorias em template string. **Fora de escopo** (manter).
4. **lucide v1.6.0 nao tem brand icons** `Instagram`/`Linkedin` — usar fallback generico.
5. Antes de alterar `stageConfig`, rodar grep de `.emoji` para confirmar que nenhum uso e dentro
   de `<option>` (o uso conhecido e `StageGate.tsx:90`, um `<span>`, OK).

## Acceptance Criteria

1. **ImportModal** (`FIELDS`): os 14 emojis de campo viram `lucide` renderizados como componente
   (~14px, `currentColor`), nos 3 pontos de render (linhas ~128, ~328, ~333).
2. **PescaPanel**: os 5 emojis de **porte** e os ~20 emojis de **segmento** (ternario `:359`)
   viram `lucide`. O ternario gigante vira um mapa `slug -> LucideIcon` legivel.
3. **stageConfig.ts**: campo `emoji` migra para icone `lucide` (componente); `StageGate.tsx:90`
   renderiza o componente. Fallback preservado.
4. **TabContatos**: `typeIcon` (decisor/stakeholder/influenciador + default) vira `lucide`.
5. **Pseudo-icones de texto claros** viram `lucide`: `⚠`→`AlertTriangle`, `✅/❌`→`Check`/`X`,
   `✓`→`Check`, preservando as classes de cor existentes (`text-warning`/`text-success`/`text-error`).
   Atinge `TabContatos:154`, `CompanyPage:657,883`, `TabProjecaoCompetitiva:48-49`, `CopyButton:41`.
6. **DashboardPage**: remover o campo `emoji` redundante dos stat cards (ja existe `icon:` lucide
   `Flame/TrendingUp/Snowflake` ao lado); usar so o lucide.
7. **Exclusoes respeitadas**: `TEMPERATURES` emoji em `<option>`, reacoes do `MessageBubble`,
   toasts, `↑/↑↑` de `strategicAnalysisService`, `★` de rating e `·` de `SearchPage` permanecem.
8. **Qualidade**: `eslint` 0 erros e `npm run build` (tsc + vite) passando. Zero regressao de layout
   (tamanho/alinhamento do icone coerente com o texto adjacente; usar `inline-flex`/`items-center`
   onde o emoji estava inline ao label).

## Mapa emoji -> lucide (canonico, todos verificados na v1.6.0)

### ImportModal FIELDS
| campo | emoji | lucide |
|---|---|---|
| companyName | 🏢 | `Building2` |
| cnpj | 📋 | `ClipboardList` |
| phone | 📞 | `Phone` |
| email | 📧 | `Mail` |
| website | 🌐 | `Globe` |
| city | 📍 | `MapPin` |
| state | 🗺 | `Map` |
| segment | 🏷 | `Tag` |
| contactName | 👤 | `User` |
| contactRole | 💼 | `Briefcase` |
| instagram | 📸 | `Camera` (fallback brand) |
| linkedin | 💡 | `AtSign` (fallback brand; corrige o bulb errado) |
| address | 🏠 | `Home` |
| notes | 📝 | `StickyNote` |

### PescaPanel portes
| porte | emoji | lucide |
|---|---|---|
| micro | 🏪 | `Store` |
| pequena | 🏢 | `Building2` |
| media | 🏗 | `Building` |
| grande | 🏛 | `Landmark` |
| qualquer | 🔍 | `Search` |

### PescaPanel segmentos (`:359`)
estetica 💆 `Sparkles` · odontologia 🦷 `Stethoscope` · varejo 🛒 `ShoppingCart` ·
farmacia 💊 `Pill` · movelaria 🛋 `Sofa` · servicos ⚙ `Settings` · alimentacao 🍽 `Utensils` ·
saude 🏥 `Hospital` · educacao 📚 `BookOpen` · tecnologia 💻 `Laptop` · automotivo 🚗 `Car` ·
petshop 🐾 `PawPrint` · fitness 💪 `Dumbbell` · beleza 💅 `Sparkles` · imobiliario 🏠 `Home` ·
construcao 🔨 `Hammer` · moda 👗 `Shirt` · decoracao 🎨 `Palette` · agronegocio 🌾 `Wheat` ·
logistica 📦 `Package` · default 🏢 `Building2`

### stageConfig.ts
📞 `Phone` · 💬 `MessageCircle` · 🤝 `Handshake` · 📋 `ClipboardList` · 🏆 `Trophy` · 🚫 `Ban`

### TabContatos typeIcon
decisor 👤 `User` · stakeholder 🤝 `Handshake` · influenciador 📣 `Megaphone` · default 👤 `User`

## Tasks

- [x] `ImportModal.tsx`: trocar `icon: string` por `icon: LucideIcon` em `DETECTABLE_FIELDS`;
      renderizar `<field.icon ... />` nos 3 pontos (grid `:128`, pills `:327`/`:332`).
- [x] `PescaPanel.tsx`: portes para `LucideIcon`; ternario gigante de segmento (`:359`) virou mapa
      `SEGMENT_ICONS: Record<string, LucideIcon>` + render `<SegIcon className="size-5" />`.
- [x] `stageConfig.ts` + `StageGate.tsx`: migrado `emoji` -> `icon: LucideIcon` (grep `.emoji` ok;
      unico render era `StageGate.tsx:90`, um `<span>`). Fallback `ClipboardList` preservado.
- [x] `TabContatos.tsx`: `typeIcon` para lucide (User/Handshake/Megaphone) + `⚠`->`AlertTriangle`.
- [x] `CompanyPage.tsx`: `⚠`->`AlertTriangle` (:657), `✅/❌`->`Check`/`X` (:883), cores preservadas.
- [x] `TabProjecaoCompetitiva.tsx`: `✓` renderizado -> `Check` (:48-49); comparacao de dado
      `item.gap === '✓'` mantida (valor vem do `strategicAnalysisService`, fora de escopo).
- [x] `CopyButton.tsx`: `✓` glyph -> `Check` inline ao texto "Copiado".
- [x] `DashboardPage.tsx`: removido campo `emoji` redundante dos 3 stat cards (so `icon` lucide).
- [x] Validar `eslint` + `npm run build`.

## File List

Modificados (9):

- `src/components/ImportModal.tsx`
- `src/components/search/PescaPanel.tsx`
- `src/components/pipeline/stageConfig.ts`
- `src/components/pipeline/StageGate.tsx`
- `src/components/company/TabContatos.tsx`
- `src/pages/CompanyPage.tsx`
- `src/components/company/TabProjecaoCompetitiva.tsx`
- `src/components/ui/CopyButton.tsx`
- `src/pages/DashboardPage.tsx`

## Dev Notes

- Padrao de render: emoji que estava em `<span className="text-lg">{x}</span>` vira
  `<Icon className="size-5" />` (ou `size={20}`); emoji inline ao label vira icone com
  `inline-flex items-center gap-1` no container.
- `LucideIcon` type: `import type { LucideIcon } from 'lucide-react'`.
- NAO mexer nas exclusoes (AC 7) — sao decisoes deliberadas, nao esquecimento.
- Skill de referencia: ui-ux-pro-max (iconografia consistente).

## QA Results

**Data:** 2026-06-03 · **Agente:** @dev (Dex) · **Modo:** YOLO

### Build (gate principal) — PASS

- `npm run build` (`tsc -b && vite build`). **Exit code real: 0** (verificado via redirect para
  arquivo + `echo $?`, sem `cmd | grep` que mascararia o exit).
- `tsc -b`: 0 erros de tipo (confirma que toda tipagem `LucideIcon`, render `<field.icon />` e
  imports estao corretos; nenhum import morto).
- `vite build`: **4012 modulos transformados**, built in ~1.23s. Unico aviso e o pre-existente de
  chunk > 500 kB (nao relacionado a iconografia).

### Lint — PASS para o escopo da story (0 erros novos)

- `npx eslint` nos 9 arquivos editados retorna **12 erros**, porem **TODOS pre-existentes**.
- Baseline em `main` limpo (via `git stash`) retorna os **mesmos 12 erros**, mesmas regras
  (`@typescript-eslint/no-explicit-any` em casts `(c: any)`/handlers antigos, `no-unused-vars`
  em `_showMoreTabs`, `react-hooks/purity` em `Date.now` no DashboardPage, `no-unused-expressions`).
  Os numeros de linha apenas deslocaram pelas insercoes (ex.: PescaPanel 613->641).
- **Delta da story = 0 erros de lint novos.** Corrigir os 12 pre-existentes esta fora do escopo
  (constraint: nao modificar alem do escopo da story). Registrado como debito tecnico herdado.

### Conversoes (auditoria emoji -> lucide)

Convertidos (icone de UI): 14 (ImportModal) + 5 portes + 20 segmentos (PescaPanel) + 6 (stageConfig)
+ 3 typeIcon + 1 `⚠` (TabContatos) + 1 `⚠` + 2 `✅/❌` (CompanyPage) + 1 `✓` (TabProjecao) +
1 `✓` (CopyButton) + 3 emojis redundantes removidos (DashboardPage). Total ~57 pontos tratados.

Mantidos (exclusoes AC 7, deliberadas):

- `TEMPERATURES` em `<option>` (LeadsPage/PipelinePage/CampaignsPage): `<option>` nao renderiza SVG.
- Reacoes WhatsApp (`MessageBubble.tsx:188`): conteudo enviavel, nao icone de UI.
- Toasts (`PipelinePage`, `PipelineJourneyStepper`): notificacao transitoria, fora de escopo.
- `↑/↑↑` do `strategicAnalysisService`: valores de dado; ja renderizados como `ArrowUp`, nunca glyph.
- `★` de rating (`DigitalPresencePanel`) e `✓/·` (`SearchPage:834`): fora de escopo.

### Decisoes de mapeamento

- Array de campos no ImportModal chama-se `DETECTABLE_FIELDS` (a story citou `FIELDS`); mesma estrutura.
- `instagram`->`Camera`, `linkedin`->`AtSign` (lucide v1.6.0 nao tem brand icons), conforme mapa.
- `TabProjecaoCompetitiva`: so o glyph `✓` renderizado virou `Check`; a comparacao `item.gap === '✓'`
  permanece (e valor de dado vindo do service, intocavel).
- Fallback do StageGate (`📋`) preservado como `ClipboardList` via `GateIcon = gate?.icon || ClipboardList`.

### Verdict: PASS (build verde; lint sem regressao)
