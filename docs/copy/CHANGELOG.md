# OUTBILI Copy Guide. Changelog

Registro de mudancas no guia de tom de voz e vocabulario do sistema. Toda mudanca deve ter motivo documentado e responsavel.

Formato: [versao] data, autor: descricao curta. Bloco de notas com motivo, mudanca e impacto.

---

## [3.1] 2026-04-27, Orion (aiox-master)

### Adicionado

- **Hook PreToolUse `copy-style-guard.js`** que bloqueia travessoes (`—` `–`) e giria caricatura em strings visiveis durante Edit/Write/MultiEdit em `src/**/*.{ts,tsx}` e `docs/copy/**/*.md`.
- **Rule contextual `.claude/rules/copy-tom-voz.md`** carregada automaticamente quando o agente edita arquivos de UI ou copy. Apresenta resumo das regras e link pro guide.
- **Referencia no `.claude/CLAUDE.md`** sob "Rules System".
- **Memory `feedback`** registrada para preservar tom entre sessoes futuras.

### Motivo

Usuario solicitou que o tom de voz nao seja apenas documento, mas regra de sistema com enforcement automatico e mecanismo de atualizacao continua.

### Impacto

Daqui pra frente, qualquer Edit/Write em UI ou copy passa pelo hook. Travessao em string visivel bloqueia hard. Giria caricatura bloqueia hard. Agente recebe stderr com sugestao e refaz a edicao.

---

## [3.0] 2026-04-27, Copy Chief (Halbert + Kennedy + Bencivenga + Todd Brown + Collier)

### Adicionado

- **`COPY-GUIDE-DEFINITIVO.md`** como documento norte unificando tom, vocabulario, padroes de UI e anti-padroes.
- **InstitucionalPage v1** marcada como modelo definitivo de tom (preservada apos reverter v2 caricatura).
- **Padroes explicitos** de header, CTA, empty state, toast, label, placeholder, helper text.
- **Lista de jargons proibidos** (pescar, subir, matar, zumbi, bora, vai pra rua, caneta perto, fecha a porra).
- **Lista de vocabulario aprovado** (pipeline, oportunidade, deal, prospect, ICP, score, qualificacao, conversao, win rate, ticket, follow-up, cadencia, discovery, decisor, fechamento, proposta, objecao).
- **Padrao de pontuacao** explicito: ZERO travessoes `—` `–`. Substitutos: `.` `:` `,` `·` ` a `.

### Motivo

Versao v2 (caricatura Halbert/Kennedy brutalista) foi rejeitada por usuario. Tom alvo eh comercial profissional B2B, nao gíria de SDR junior em call center. InstitucionalPage v1 (Ogilvy/profissional) foi confirmada como modelo definitivo.

### Impacto

Realinhamento de copy em 15 arquivos de UI e services. Eliminacao de 70+ travessoes em strings visiveis. Substituicao de termos caricatura por vocabulario comercial B2B.

### Aplicado em

- `src/pages/InstitucionalPage.tsx` (revertida ao v1)
- `src/pages/DashboardPage.tsx` (refatorada)
- `src/pages/LoginPage.tsx`
- `src/pages/SearchPage.tsx`
- `src/pages/LeadsPage.tsx`
- `src/pages/PipelinePage.tsx`
- `src/pages/CompanyPage.tsx`
- `src/pages/CampaignsPage.tsx`
- `src/pages/ReportsPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/GlossarioPage.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/MobileHeader.tsx`
- `src/components/pipeline/StageGate.tsx`
- `src/components/pipeline/PipelineJourneyStepper.tsx`
- `src/components/ui/DigitalPresencePanel.tsx`
- `src/components/company/TabReuniao.tsx`
- `src/components/company/TabPlaybookBDR.tsx`
- `src/services/enrichmentService.ts`
- `src/services/pescaService.ts`
- `src/services/strategicAnalysisService.ts`
- `src/lib/template-catalog.ts`

---

## [2.0] 2026-04-27, Copy Chief (TENTATIVA REJEITADA)

### Status

REJEITADA pelo usuario. Tom Halbert+Kennedy brutalista nao adequado a sistema interno B2B.

### Erros documentados

- Uso de gíria de SDR junior ("pescar lead", "subir lead", "matar objecao", "zumbi no pipe", "bora pra mesa", "Linha ta rodando", "caneta perto").
- Uso de travessoes em todo lugar.
- Confusao entre "tom direto" e "tom agressivo".
- Inicio de copy sem aprovacao do tom alvo com o usuario.

### Aprendizado

Sistema interno comercial precisa de tom **profissional comercial-tecnico**, nao **brutalista direct-response**. Nao replicar copy de sales page de Halbert dentro de produto SaaS.

Versoes preservadas em git stash: `copy-v2-vendas-caricatura-reverter`.

---

## [1.x] Pre-realinhamento

Specs originais por arquivo:

- `manifesto-v1.md` (institucional, Ogilvy)
- `dashboard-narrativa-fdr.md` (operacional)
- `pagina-institucional-spec.md` (landing)

Tom Ogilvy refinado, profissional. Mantido como referencia historica.

---

## Como atualizar este changelog

Toda mudanca no guide deve adicionar entrada nova no topo com:

1. Versao incrementada (3.0 -> 3.1, ou 3.x -> 4.0 se quebra padrao)
2. Data ISO (yyyy-mm-dd)
3. Autor (nome + persona AIOX se aplicavel)
4. Bloco com `Adicionado / Removido / Mudado / Motivo / Impacto`

Ciclo de feedback:

1. Usuario reporta termo, padrao ou problema de tom
2. AIOX Master ou Copy Chief avalia e propoe ajuste
3. Atualiza `COPY-GUIDE-DEFINITIVO.md`
4. Adiciona entrada aqui
5. Se mudar regra HARD/SOFT, atualizar `.claude/rules/copy-tom-voz.md`
6. Se entrar/sair termo da lista negra, atualizar `.claude/hooks/copy-style-guard.js`
7. Salvar memory `feedback` para preservar entre sessoes
