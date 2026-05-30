# Validação de Fluxos de Trabalho × Jornadas do Usuário — OUTBILI

> **Tipo:** Auditoria estática de correlação (fluxo implementado ↔ jornada esperada)
> **Método:** Leitura de código-fonte (rotas, navegação, páginas, services, hooks). App não executado.
> **Âncora de verdade:** branch `main` / `dist` em produção (https://v4bilinski.github.io/outbili/)
> **Escopo:** todas as jornadas — BDR/vendedor, gestor, admin + fluxo transversal de entrada
> **Data:** 2026-05-30 · **Conduzido por:** Orion (@aiox-master)

---

## 1. Sumário executivo

O OUTBILI tem **14 rotas** e **12 funcionalidades** maduras. A espinha dorsal (auth, route guards, drill-down por query params, ciclo de entrada) está **coerente e correlacionada**. O sistema usa dados reais (Supabase via `useLeads`), sem mocks nas telas auditadas.

Porém a auditoria encontrou **uma quebra de correlação crítica**: duas funcionalidades inteiras e 100% implementadas (**Campanhas** e **Mensagens**) estão **desconectadas da navegação** (marcadas "em breve"), embora as rotas estejam ativas, o código completo e o próprio sistema as referencie internamente. A jornada do BDR "morre" no Pipeline, sem caminho de UI para iniciar cadência ou ler respostas.

| Jornada | Correlação fluxo↔jornada | Veredito |
|---------|--------------------------|----------|
| BDR / vendedor | Pesquisa→Leads→Ficha→Pipeline OK. Pipeline→Campanha→Mensagens **rompido** | 🟠 Parcial |
| Gestor | Dashboard→drill-down→Relatórios OK (dados reais). Sem papel próprio. Relatórios fora do mobile | 🟠 Parcial |
| Admin | Guard + 4 tabs + edição de usuários + re-enriquecimento: coerente | 🟢 OK |
| Transversal (entrada) | institucional→login→app fecha o ciclo. Onboarding presente | 🟢 OK |

---

## 2. Espinha dorsal (compartilhada por todas as jornadas)

| Elemento | Evidência | Estado |
|----------|-----------|--------|
| Roteamento | `src/App.tsx:63-82` (HashRouter, 14 rotas) | ✅ |
| Guard de auth | `App.tsx:32-37` — não-logado → `/institucional` | ✅ |
| Guard de admin | `App.tsx:39-43` — `/admin` exige `isAdmin` | ✅ |
| 404 | `App.tsx:45-55` — EmptyState com "Voltar ao Dashboard" | ✅ |
| Drill-down por query param | `DashboardPage` emite `/leads?temperatura=`/`?trava=`; `LeadsPage:211-252` **lê e aplica** | ✅ correlacionado |
| Onboarding | `MainLayout.tsx:64` — senha obrigatória (`PasswordResetModal`) → `WelcomeTour` | ✅ (não documentado) |

**Papéis (roles):** o modelo tem `admin`/`sdr`/`viewer`, mas o app só ramifica em `isAdmin = role === 'admin'` (`auth-context.tsx:146`). Não há papel "gestor": **BDR e gestor enxergam navegação idêntica.** Há inconsistência de default: `auth-context.tsx:29` assume `viewer`, `AdminPage.tsx:81,87` edita com default `sdr`.

---

## 3. Matriz por jornada

### 3.1 Jornada do BDR / vendedor

Jornada esperada: **pesquisar → enriquecer → qualificar (SPICED) → mover no pipeline → campanha WhatsApp → mensagens**.

| Passo | Tela | Continuidade para o próximo passo | Estado |
|-------|------|-----------------------------------|--------|
| Pesquisar/cadastrar | `SearchPage` (PESCA + manual + upload) | "Ver lead completo" / "Ver leads enriquecidos" → **`#/leads` (lista, não a ficha)** `SearchPage:1057,1238` | 🟡 fricção |
| Listar | `LeadsPage` | linha clicável → `/leads/:id` `LeadsPage:146` | ✅ |
| Ficha + qualificar | `CompanyPage` (SPICED, Travas, Playbook) | volta a `/leads`; WhatsApp 1:1 via `wa.me` `CompanyPage:322,487`. **Sem CTA "iniciar cadência"** | 🟡 |
| Pipeline | `PipelinePage` (Kanban + stage gate) | card → `/leads/:id`; "Adicionar lead" → `/search` `PipelinePage:53,168` | ✅ |
| Campanha | `CampaignsPage` (wizard 4 steps, BilinskiZap) | **inacessível pela navegação** (ver §4.1) | 🔴 rompido |
| Mensagens | `InboxPage` (inbox completo) | **inacessível pela navegação** (ver §4.1) | 🔴 rompido |

A jornada flui bem até o Pipeline. Da qualificação em diante (acionar cadência, acompanhar resposta) **não há caminho de UI**, apesar do código existir e funcionar.

### 3.2 Jornada do gestor

| Passo | Tela | Estado |
|-------|------|--------|
| KPIs | `DashboardPage` — LTP do pipeline, temperatura, travas; dados reais (`useLeads`) `DashboardPage:447,594` | ✅ |
| Drill-down | cards → `/leads?temperatura=`/`?trava=T` (filtro aplicado) | ✅ correlacionado |
| Relatórios | `ReportsPage` — métricas reais (`useLeads:50`) | ✅ |
| **Relatórios no mobile** | `BottomNav.tsx:16` faz `slice(0,5)` → Relatórios (6º) **não aparece no celular** | 🟠 gap |
| Papel | sem papel "gestor"; mesma navegação do BDR | 🟠 decisão de produto |

### 3.3 Jornada do admin

| Passo | Tela | Estado |
|-------|------|--------|
| Entrada | Sidebar mostra "Administração" só se `isAdmin` `Sidebar.tsx:106`; `/admin` guardado | ✅ |
| Tabs | `AdminPage.tsx:48` — **4 tabs**: Atividades, Usuários, Enriquecimento, **Conexões** | ✅ (doc diz 3) |
| Usuários | listar/editar/ativar/desativar `AdminPage:69-103,517` | ✅ |
| Re-enriquecimento | batch + diagnóstico + recálculo SPICED `AdminPage:261-450` | ✅ |
| Configurações | `SettingsPage` — nome + senha persistem (`authService`); links Glossário/Institucional `SettingsPage:39,59,223-224` | ✅ |

### 3.4 Fluxo transversal de entrada

`institucional → /login → /` **fecha o ciclo**: `InstitucionalPage`/`InstitucionalNav` têm CTAs "entrar" → `/login` (`InstitucionalNav.tsx:144,192`); `LoginPage:71` → `/`; se já logado, `InstitucionalPage:133` redireciona para `/`. **Glossário e Institucional não são órfãos** — alcançáveis via `Settings > Sobre` (`SettingsPage:223-224`), embora ausentes da Sidebar/BottomNav.

---

## 4. Gaps priorizados

### 🔴 P0 — Quebra de jornada

**G1. Campanhas e Mensagens implementadas mas bloqueadas na navegação.**
- Marcadas `comingSoon: true` em `Sidebar.tsx:14-15` e `BottomNav.tsx:11`.
- Rotas ativas (`App.tsx:72-75`), código completo: wizard de 4 etapas com A/B, cadência, precheck, métricas (`CampaignsPage.tsx`); inbox completo com chat, handoff, quick-replies (`InboxPage.tsx` + `components/inbox/*`); hooks reais `useBilinskiZap`, `useInbox`.
- **Contradição interna:** `AdminPage.tsx:36` rotula `/campaigns` como página rastreada; `ChatInput.tsx:104` abre `/#/campaigns`; `OUTBILI.md` lista ambas como funcionalidades principais (#6, #7) e rotas ativas na tabela de Navegação.
- **Efeito:** a jornada do BDR não tem como sair do Pipeline para acionar ou acompanhar prospecção. Funcionalidade existe em limbo (rastreada e linkada internamente, porém inacessível).
- **Decisão de produto necessária:** liberar (remover `comingSoon`) **ou** assumir como roadmap e remover as referências internas que prometem a rota.

### 🟠 P1 — Degrada jornada

**G2. Relatórios inacessível no mobile.** `BottomNav.tsx:16` corta o 6º item (`slice(0,5)`) e ainda gasta o 5º slot com "Msgs" (desabilitado). No celular o gestor não chega em Relatórios. Campanhas/Configurações/Admin também ausentes do mobile.

**G3. Ausência de papel "gestor".** O sistema só distingue `admin` vs não-admin (`auth-context.tsx:146`). Se jornadas distintas BDR/gestor são intenção, falta o conceito de papel e a navegação condicional correspondente.

### 🟡 P2 — Fricção / inconsistência

**G4. "Ver lead completo" leva à lista, não à ficha.** `SearchPage:1057` e `:1238` fazem `window.location.hash = '#/leads'`, ignorando `lastCreatedLead.id` disponível. O label promete o lead específico; a ação entrega a coleção. Correção trivial: `/leads/${lastCreatedLead.id}`.

**G5. Sem ponte Lead → Campanha na ficha.** `CompanyPage` oferece só WhatsApp 1:1 (`wa.me`). Mesmo com Campanhas liberada, não há CTA "adicionar à cadência" a partir do lead qualificado — o passo de transição depende de o BDR ir à tela de Campanhas e re-selecionar o lead.

**G6. Inconsistência técnica de navegação.** `SearchPage` usa `window.location.hash`; o restante usa `navigate()`. Funciona no HashRouter, mas quebra o padrão (e perde o comportamento de history do router).

### 🔵 P3 — Drift de documentação (atualizar `OUTBILI.md`)

| # | Achado | Evidência |
|---|--------|-----------|
| G7 | Admin tem **4 tabs** (inclui "Conexões"), doc diz 3 | `AdminPage.tsx:48` |
| G8 | Onboarding (senha obrigatória + WelcomeTour) não documentado | `MainLayout.tsx:64` |
| G9 | Porta de entrada é `/institucional` (não `/login`); doc não menciona | `App.tsx:35` |
| G10 | Default role divergente: `viewer` vs `sdr` | `auth-context.tsx:29` × `AdminPage.tsx:81` |
| G11 | Glossário/Institucional ausentes da tabela de Navegação (alcançáveis só via Settings) | `SettingsPage:223-224` |

---

## 5. Recomendações (ordem de execução sugerida)

1. **Decidir o destino de Campanhas/Mensagens (G1).** É o item que mais afeta a jornada. Caminhos: (a) liberar removendo `comingSoon` + smoke test E2E; (b) manter como roadmap e remover o link em `ChatInput.tsx:104` e a entrada de rastreio que prometem a rota.
2. **Mobile: incluir Relatórios e remover slot morto (G2).** Repensar `BottomNav` (ex.: menu "mais" para itens excedentes em vez de `slice(0,5)`).
3. **Quick win de continuidade (G4):** apontar "Ver lead completo" para `/leads/${id}`.
4. **Definir papel "gestor" (G3)** se a segregação de jornada for desejada — ou registrar formalmente que a visão é unificada.
5. **Adicionar CTA "iniciar cadência" na ficha (G5)** quando G1 for resolvido.
6. **Sincronizar `OUTBILI.md` (G7–G11)** com o estado real.

---

## 6. Notas de método

- Auditoria **estática**: nenhuma execução de app nem Playwright (conforme escopo definido pelo operador).
- Evidência sempre referenciada como `arquivo:linha`.
- Telas lidas integralmente ou por trecho: `App`, `Sidebar`, `BottomNav`, `MainLayout`, `auth-context`, `SearchPage`, `PipelinePage`, `CampaignsPage`, `InboxPage`, `AdminPage`, `SettingsPage`, mais varredura por `grep` de todas as transições `navigate()`/`to=` e referências a rotas.
- Não foi auditada a **exatidão** dos cálculos (SPICED, LTP, benchmarks) — fora do escopo (correlação fluxo↔jornada, não validação numérica).
