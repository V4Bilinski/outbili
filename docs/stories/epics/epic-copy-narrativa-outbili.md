# Epic: Copy, Narrativa & Pagina Institucional OUTBILI

## Metadata

| Campo | Valor |
|-------|-------|
| **Epic ID** | EPIC-COPY-001 |
| **Titulo** | Copy, Narrativa & Identidade Institucional OUTBILI |
| **Owner** | @pm (Morgan) |
| **Status** | Ready |
| **Prioridade** | P0 — Fundacional |
| **Data** | 2026-04-14 |

## Contexto

A V4 Bilinski & Co construiu o OUTBILI para diversificar canais de aquisicao e nao depender exclusivamente do LeadBroker da V4 Company (matriz). O sistema esta funcional, mas falta a camada de **identidade, narrativa e copy** que transforma ferramenta em missao.

**Squads envolvidos:** Copy Squad (Ogilvy + Halbert) + Goldratt (TOC) + Fabrica de Receita (STEP + 8 Travas)

## Objetivo

Implementar toda a infraestrutura de copy e narrativa do OUTBILI: manifesto interno, pagina institucional, narrativa Fabrica de Receita na Dashboard, renomeacao terminologica (wtp → ltp), e copys de sistema alinhadas a metodologia V4.

## Entregaveis

| # | Entregavel | Arquivo de Copy | Implementacao |
|---|-----------|----------------|---------------|
| 1 | Manifesto Interno v1 | `docs/copy/manifesto-v1.md` | Documento base (PRONTO) |
| 2 | Narrativa FDR Dashboard | `docs/copy/dashboard-narrativa-fdr.md` | `src/pages/DashboardPage.tsx` |
| 3 | Pagina Institucional | `docs/copy/pagina-institucional-spec.md` | `src/pages/InstitucionalPage.tsx` (nova) |
| 4 | Renomeacao wtp → ltp | — | `src/lib/constants.ts` + componentes |
| 5 | Trava visivel no pipeline | — | `src/pages/PipelinePage.tsx` + `LeadsPage.tsx` |
| 6 | Frase-missao no LoginPage | — | `src/pages/LoginPage.tsx` |
| 7 | Glossario vivo | — | `src/pages/GlossarioPage.tsx` (nova) |

## Dependencias

- Diagnostico Tier 0 completo (FEITO — v5)
- Manifesto v1 redigido (FEITO)
- Specs de copy da Dashboard e Institucional (FEITO)
- Historia de origem: **EM CONSTRUCAO** (usuario vai complementar)

---

## Stories

### Wave 1 — Fundacao (sem dependencias entre si)

---

#### Story 1.1: Renomear wtp → ltp no codigo

**Status:** Ready
**Agente:** @dev
**Complexidade:** S (Small)
**Risco:** Baixo

**Descricao:**
Renomear todas as referencias de "wtp" para "ltp" no codebase, alinhando terminologia ao framework TOC/Fabrica de Receita. LTP = Lifetime Throughput do Projeto.

**Acceptance Criteria:**
- [ ] Campo `wtp` em `src/lib/constants.ts` (TIERS) renomeado para `ltp`
- [ ] Label "WTP" em `src/pages/CompanyPage.tsx` atualizado para "LTP"
- [ ] Comentario "WTP" em `src/pages/ReportsPage.tsx` atualizado
- [ ] Tooltip explicativo adicionado: "LTP — Lifetime Throughput do Projeto"
- [ ] Build passa sem erros (`npm run build`)
- [ ] Nenhuma referencia a "wtp" restante no codebase

**Arquivos afetados:**
- `src/lib/constants.ts`
- `src/pages/CompanyPage.tsx`
- `src/pages/ReportsPage.tsx`
- `src/types/index.ts` (se houver referencia)

---

#### Story 1.2: Frase-missao no LoginPage

**Status:** Ready
**Agente:** @dev
**Complexidade:** XS (Extra Small)
**Risco:** Baixo

**Descricao:**
Adicionar a frase-missao do manifesto na tela de login, abaixo do logo. Substituir ou complementar a tagline atual.

**Acceptance Criteria:**
- [ ] Frase "Do CNPJ ao contrato. Sem lista fria. Sem achismo. Sem trava." visivel no LoginPage
- [ ] Subtitulo "Sistema de inteligencia comercial — V4 Bilinski & Co" mantido
- [ ] Responsivo: frase visivel em mobile e desktop
- [ ] Build passa sem erros

**Arquivos afetados:**
- `src/pages/LoginPage.tsx`

---

#### Story 1.3: Surfacear trava no Pipeline e Leads

**Status:** Ready
**Agente:** @dev
**Complexidade:** S (Small)
**Risco:** Baixo

**Descricao:**
Mostrar a trava detectada (`hypotheticalTrap`) nos cards de lead no PipelinePage e na tabela do LeadsPage. O operador precisa ver "T5 — Qualificacao" direto no card, sem precisar abrir o perfil.

**Acceptance Criteria:**
- [ ] Card do lead no PipelinePage mostra badge com a trava (ex: "T5 — Qualificacao")
- [ ] Tabela do LeadsPage mostra coluna ou badge com trava
- [ ] Cor da badge segue gravidade: T1-T3 (amarelo), T4-T6 (laranja), T7-T8 (vermelho)
- [ ] Leads sem trava detectada nao mostram badge (graceful)
- [ ] Build passa sem erros

**Arquivos afetados:**
- `src/pages/PipelinePage.tsx`
- `src/pages/LeadsPage.tsx`

---

### Wave 2 — Dashboard FDR (depende de Wave 1.1 para LTP)

---

#### Story 2.1: Dashboard — Narrativa Fabrica de Receita

**Status:** Ready
**Agente:** @dev + @ux-design-expert
**Complexidade:** L (Large)
**Risco:** Medio
**Spec de copy:** `docs/copy/dashboard-narrativa-fdr.md`

**Descricao:**
Reestruturar a DashboardPage para refletir a narrativa da Fabrica de Receita. Nao e um painel de metricas genericas — e o painel de controle da linha de montagem de receita.

**Acceptance Criteria:**
- [ ] Bloco 1: "Sua Fabrica de Receita — Hoje" com cards Throughput, Pipeline Ativo, Leads Quentes, Taxa de Conversao
- [ ] Bloco 2: "Diagnostico de Travas" — distribuicao de leads por trava detectada com destaque visual no gargalo
- [ ] Bloco 3: "Fluxo da Linha" — visualizacao horizontal das 5 estacoes com contagem de leads
- [ ] Bloco 4: "Proxima Acao" — acao sugerida baseada no gargalo dominante
- [ ] Bloco 5: "LTP Pipeline" — LTP total, quentes, medio por lead (usa campo ltp dos TIERS)
- [ ] Bloco 6: "Diversificacao de Canais" — % leads OUTBILI vs LeadBroker vs outros
- [ ] Todos os blocos responsivos (mobile + desktop)
- [ ] Build passa sem erros
- [ ] Copy alinhada ao manifesto (verificar contra docs/copy/manifesto-v1.md)

**Arquivos afetados:**
- `src/pages/DashboardPage.tsx` (reestruturacao major)
- `src/lib/constants.ts` (TIERS com ltp)
- Possiveis novos componentes em `src/components/dashboard/`

---

### Wave 3 — Pagina Institucional (depende de Wave 1.2 para consistencia de copy)

---

#### Story 3.1: Pagina Institucional com CTA de acesso

**Status:** Ready
**Agente:** @dev + @ux-design-expert
**Complexidade:** L (Large)
**Risco:** Medio
**Spec de copy:** `docs/copy/pagina-institucional-spec.md`

**Descricao:**
Criar pagina institucional publica (sem auth) na rota `/#/institucional`. Primeiro contato de novos membros com o OUTBILI. CTA: Acessar como usuario ou Criar acesso.

**Acceptance Criteria:**
- [ ] Rota `/#/institucional` acessivel sem login
- [ ] Se usuario ja logado, redireciona para `/#/` (Dashboard)
- [ ] Secao Hero com frase-missao + screenshot do sistema
- [ ] Secao "O Problema" — dependencia de canal unico
- [ ] Secao "A Linha de Montagem" — 5 estacoes visuais
- [ ] Secao "As 8 Travas" — grid visual trava → funcionalidade
- [ ] Secao "O Mecanismo" — CNPJa + Assertiva cascata
- [ ] Secao "O Compromisso" — 5 regras do manifesto
- [ ] CTA duplo: [Acessar] → /#/login | [Criar acesso] → fluxo de registro
- [ ] Responsivo (mobile + desktop)
- [ ] Dark theme consistente com o sistema
- [ ] Build passa sem erros

**Arquivos afetados:**
- `src/pages/InstitucionalPage.tsx` (NOVO)
- `src/App.tsx` (nova rota)
- `src/components/layout/MainLayout.tsx` (se necessario excluir sidebar)

---

### Wave 4 — Refinamento (depende de Waves 1-3)

---

#### Story 4.1: Glossario Vivo

**Status:** Draft
**Agente:** @dev
**Complexidade:** M (Medium)
**Risco:** Baixo

**Descricao:**
Pagina `/glossario` com termos V4 (SPICED, LTP, Temperatura, Tier, Trava, etc.) com definicao e exemplo. Acessivel via sidebar.

**Acceptance Criteria:**
- [ ] Rota `/#/glossario` funcional
- [ ] Todos os termos do manifesto secao V (Vocabulario) presentes
- [ ] Cada termo com: nome, definicao, exemplo de uso, referencia ao sistema
- [ ] Busca/filtro por texto
- [ ] Link na sidebar (desktop) e acessivel via menu (mobile)
- [ ] Build passa sem erros

---

#### Story 4.2: Manifesto no sistema — versao curta

**Status:** Draft
**Agente:** @dev
**Complexidade:** S (Small)
**Risco:** Baixo

**Descricao:**
Incorporar versao resumida do manifesto em local acessivel dentro do sistema (ex: secao "Sobre" no SettingsPage ou link no rodape).

**Acceptance Criteria:**
- [ ] Manifesto resumido acessivel dentro do sistema logado
- [ ] Inclui: missao, 5 compromissos, link para glossario
- [ ] Build passa sem erros

---

#### Story 4.3: Corrigir localizacao em docs

**Status:** Done
**Agente:** @dev
**Complexidade:** XS
**Risco:** Zero

**Descricao:**
Corrigir todas as referencias a "Curitiba" nos docs do projeto para "Sao Paulo, Berrini". Remover localizacao de assinaturas que devem conter apenas "V4 Bilinski & Co".

**Acceptance Criteria:**
- [x] Nenhuma referencia a "Curitiba" em docs/
- [x] Assinatura do manifesto: "V4 Bilinski & Co" (sem localizacao)
- [x] OUTBILI.md atualizado com localizacao oficial como regra explicita

---

## Ordem de Execucao

```
Wave 1 (paralelo):
  1.1 wtp→ltp  ─┐
  1.2 LoginPage ─┼─ podem rodar ao mesmo tempo
  1.3 Travas    ─┘

Wave 2 (apos Wave 1):
  2.1 Dashboard FDR (depende de 1.1 para LTP)

Wave 3 (apos Wave 1):
  3.1 Pagina Institucional (depende de 1.2 para consistencia)

Wave 4 (apos Waves 2+3):
  4.1 Glossario
  4.2 Manifesto no sistema
  4.3 Correcao docs
```

## Metricas de Sucesso

| Metrica | Meta |
|---------|------|
| Hopkins Score (copy) | >= 85/100 |
| Sugarman Triggers | >= 80% cobertura |
| Build | Zero erros apos cada story |
| Consistencia terminologica | Zero "wtp" no codebase, zero "Curitiba" em docs |
| Cobertura narrativa FDR | 8/8 travas mapeadas na UI |

---

> — Morgan, planejando o futuro.
