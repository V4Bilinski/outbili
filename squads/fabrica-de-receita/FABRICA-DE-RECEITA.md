# FÁBRICA DE RECEITA — Documento-Mãe

> **Este é o documento principal de referência do squad.**
> Qualquer modificação futura (novo agent, nova task, reescopo, merge) começa **aqui**. README, squad.yaml, agents individuais e workflows derivam deste documento.

**Squad:** `fabrica-de-receita` · **Slash:** `/fdr` · **Versão:** 2.0.0
**Metodologia:** V4 Company · **Agents:** 16 · **Autor:** Luiz Henrique · **Última revisão:** 2026-04-22

---

## 1 · Princípio Central

> **Destravar o gargalo certo no momento certo é a diferença entre crescer 20% e 10x.**

A Fábrica de Receita opera sobre **4 Pilares V4** × **8 Travas de Receita** × **framework STEP** × **ciclos de 90 dias**, aplicando **TOC (Theory of Constraints)** à monetização. Não atacamos tudo ao mesmo tempo — identificamos a trava principal (gargalo) e concentramos 80% do esforço nela.

---

## 2 · Hierarquia em 5 Camadas (16 agents)

```
┌───────────────────────────────────────────────────────────────────────┐
│  CAMADA 1 — STRATEGIC (3 agents)                                      │
│  ────────────────────────────────                                     │
│  [1] Fabio      · fabrica-de-receita-master · MASTER V4 + QUALITY GATE│
│  [2] Vitor      · growth-strategist         · OKRs, GTM, North-Star   │
│  [3] Gabi       · growth-planner            · Ciclos 90d, ICE, sprints│
│                                                                       │
│  CAMADA 2 — TRIAGE & DIAGNÓSTICO (3 agents)                           │
│  ────────────────────────────────────────                             │
│  [4] Nexus      · orchestrator              · Triage + aquisição      │
│  [5] Lógica     · diagnosticador            · TOC, CRT, 5FS           │
│  [6] Diagnosta  · especialista-spiced       · SPICED qualification    │
│                                                                       │
│  CAMADA 3 — ESTRATÉGIA DE RECEITA (1 agent)                           │
│  ────────────────────────────────────────                             │
│  [7] Arquiteto  · estrategista-receita      · ICP, pricing, forecast  │
│                                                                       │
│  CAMADA 4 — EXECUÇÃO POR PILAR (6 agents)                             │
│  ────────────────────────────────────────                             │
│  AQUISIÇÃO (Cegueira → Qualificação):                                 │
│  [8]  Hunter    · traffic-hunter            · Paid + organic, ROAS    │
│  [9]  Nova      · content-engine            · Content + nurture       │
│  [10] Zara      · conversion-optimizer      · CRO + A/B               │
│  [11] Aria      · ai-marketing-engineer     · MarTech + automações    │
│                                                                       │
│  COMERCIAL (Compromisso → Decisão):                                   │
│  [12] Fechador  · maquina-comercial         · Playbooks, objeções     │
│                                                                       │
│  RETENÇÃO (Retenção):                                                 │
│  [13] T8 Master · retention-master          · Health + LTV + churn    │
│                                                                       │
│  CAMADA 5 — SUPORTE TRANSVERSAL (2 agents)                            │
│  ────────────────────────────────────────                             │
│  [14] Data      · roi-analyst               · ROI, attribution, BI    │
│  [15] Rian      · revenue-team-architect    · Org design, RevOps      │
│                                                                       │
│  LINHA DE NEGÓCIO DR (1 agent)                                        │
│  ──────────────────────────                                           │
│  [16] Apex      · dr-chief                  · DR-X/O/T/E orchestrator │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Handoff Padrão

```
Cliente/Input
    ↓
NEXUS (L2 — triage)  ← roteia baseado em sinais
    ↓
LÓGICA (L2 — TOC)    → identifica trava principal
    ↓
DIAGNOSTA (L2 — SPICED)  → quantifica dor, qualifica
    ↓
ARQUITETO (L3)       → define ICP, pricing, forecast
    ↓
[Camada 4 — especialistas por pilar + trava]
    ↓
DATA (L5)            → mede ROI, attribution
    ↓
FABIO (L1 — GATE)    → valida output integrado V4 ←── APPROVE / REVISE / ESCALATE
    ↓
Cliente (entrega)
```

---

## 3 · Matriz Agent → Task/Workflow (Binding Obrigatório)

**Regra G2:** Nenhum agent existe sem binding explícito a pelo menos uma task e um workflow.

| # | Agent | Task principal (owned) | Tasks co-owned | Workflow primary |
|---|---|---|---|---|
| 1 | Fabio (master) | `v4-integration` **(criar)** | `ciclo-90-dias` | **GATE em todos** |
| 2 | Vitor (strategist) | `growth-audit` | — | wf-growth-sprint |
| 3 | Gabi (planner) | `ciclo-90-dias` | `growth-audit` | wf-growth-sprint |
| 4 | Nexus (orchestrator) | `diagnostico-travas` | — | wf-diagnostico-pipeline |
| 5 | Lógica (diagnosticador) | `diagnostico-travas` (co) | — | wf-diagnostico-pipeline |
| 6 | Diagnosta (spiced) | `qualificar-spiced` | — | wf-diagnostico-pipeline |
| 7 | Arquiteto (estrategista) | `montar-funil` | `construir-oferta-dr` | wf-destrava-receita |
| 8 | Hunter (traffic) | `plano-trafego` | — | wf-growth-sprint |
| 9 | Nova (content) | `montar-funil` (co) | `plano-trafego` | wf-growth-sprint |
| 10 | Zara (conversion) | `montar-funil` (co) | — | wf-growth-sprint |
| 11 | Aria (ai-marketing) | `plano-trafego` (co) | — | wf-growth-sprint |
| 12 | Fechador (comercial) | `qualificar-spiced` (co) | `construir-oferta-dr` | wf-destrava-receita |
| 13 | retention-master | `estrategia-retencao` | — | wf-destrava-receita |
| 14 | Data (roi-analyst) | `roi-analysis` | — | **todos — mede resultado** |
| 15 | Rian (team-architect) | `montar-time-receita` | — | wf-destrava-receita |
| 16 | Apex (dr-chief) | `construir-oferta-dr` | `dr-pitch`, `dr-pop-create` **(criar)** | wf-destrava-receita |

### Tasks existentes em `/tasks/`
- `diagnostico-travas.md`
- `growth-audit.md`
- `ciclo-90-dias.md`
- `construir-oferta-dr.md`
- `qualificar-spiced.md`
- `montar-funil.md`
- `plano-trafego.md`
- `estrategia-retencao.md`
- `roi-analysis.md`
- `montar-time-receita.md`

### Tasks a criar (Fase 2 e 3)
- `dr-pitch.md` — absorve Dara (prospecção, pitch DR, diagnóstico inicial)
- `dr-pop-create.md` — absorve Executor (POPs, templates, quality review)
- `v4-integration.md` — owned por Fabio, executa o gate de validação gerencial

---

## 4 · Taxonomia Oficial das 8 Travas (V4 Company)

> **Fonte:** `/Users/luizhenrique/Enterprise/workspaces/v4-creator/docs/produtos/destrava-receita`
> **Correção aplicada:** v1.0.0 do squad usava nomes não-oficiais. v2.0.0 alinha ao doc original.

| # | Trava | O que é | Pilar V4 | Framework |
|---|---|---|---|---|
| T1 | **Cegueira** | Não sabe quem é o mercado-alvo nem onde encontrá-lo | Tráfego | STEP — Situation + Target |
| T2 | **Exposição** | Mercado não vê a solução ou vê pouco | Tráfego | STEP — Exposure |
| T3 | **Atenção** | Leads recebem tanto conteúdo que não focam | Engajamento | Copy + narrativa SPICED |
| T4 | **Interesse** | Leads não veem valor único ou são indiferentes | Engajamento | Storytelling + diferenciação |
| T5 | **Qualificação** | Leads não passam pelo funil de qualificação | Engajamento | SPICED qualification + SDR rotation |
| T6 | **Compromisso** | Prospect não se posiciona como buyer na negociação | Conversão | Demos estruturadas + objection handling |
| T7 | **Decisão** | Buyer não assina o contrato | Conversão | Closing arguments + timeline pressure |
| T8 | **Retenção** | Cliente cancela, não expande, churn alto | Retenção | Success playbooks + arquitetura de receita |

### 4 Pilares V4

```
TRÁFEGO          ENGAJAMENTO       CONVERSÃO         RETENÇÃO
─────────        ───────────       ─────────         ────────
Atrair o         Converter         Transformar       Maximizar
público certo    atenção em        intenção em       LTV e
com custo        intenção          receita           expandir
otimizado
KPIs:            KPIs:             KPIs:             KPIs:
CAC, ROAS,       CTR, Open Rate,   CVR, Ticket,      Churn Rate,
CPL, CPC         Time-on-page      ARR, MRR          NPS, LTV
T1-T2            T3-T4-T5          T6-T7             T8
```

### Framework STEP

| Letra | Significado |
|---|---|
| **S** | Situação — onde o cliente está hoje (métricas atuais, contexto) |
| **T** | Trava — o que está impedindo crescimento (gargalo via TOC) |
| **E** | Estratégia — caminho para destravar (pilares V4, alavancas) |
| **P** | Plano — ações concretas (ciclo 90 dias) |

### Ciclo 90 Dias

- **Mês 1:** Diagnóstico profundo + quick wins (credibilidade e caixa rápido)
- **Mês 2:** Implantação das 3 alavancas prioritárias
- **Mês 3:** Mensuração, ajuste e planejamento do próximo ciclo

---

## 5 · Gates de Governança (G3 — Fabio como Quality Gate)

**Fabio (`fabrica-de-receita-master`) é o quality gate gerencial.** Toda saída de agent da Camada 3 e Camada 4 passa por Fabio antes de entregar ao cliente.

### Critérios de aprovação de Fabio

Fabio avalia cada output contra 5 critérios antes de aprovar:

1. **Alinhamento STEP** — o output referencia Situação, Trava, Estratégia e Plano claramente
2. **Trava identificada** — o output conecta-se a uma das 8 travas com evidência
3. **Pilar V4 explícito** — o output cita qual pilar (Tráfego/Engajamento/Conversão/Retenção) afeta
4. **Métrica mensurável** — há um KPI atrelado (ROAS, MRR, Churn, etc.)
5. **Cabe no ciclo 90d** — a ação é executável dentro de um ciclo, ou quebrada em múltiplos ciclos

### Veredictos possíveis

| Veredicto | Ação |
|---|---|
| **APPROVE** | Libera entrega ao cliente + atualiza Data (ROI tracking) |
| **REVISE** | Retorna ao agent da Camada 4 com lista de gaps específicos |
| **ESCALATE** | Eleva a Luiz Henrique (autor) quando crítico/ambíguo |

### Onde o gate aparece

- **Workflows** `/workflows/wf-*.yaml` declaram Fabio como `quality_gate` na última etapa
- **Command de Fabio:** `*v4-integration` (task nova — cria validação formal)
- **Log de decisões:** registrado em `/data/fabio-gate-decisions.yaml` (append-only)

---

## 6 · Produtos Destrava Receita (Linha DR — Apex)

| Produto | Investimento | Duração | Escopo | Owner |
|---|---|---|---|---|
| **DR-X** (Diagnóstico) | R$ 20-40k | 45 dias | Identificar trava + plano + sprint inicial | Apex + Lógica + Diagnosta |
| **DR-O** (Operacional) | R$ 50k/ano | 12 meses | Acompanhamento mensal, 1-2 pilares | Apex + Camada 4 relevante |
| **DR-T** (Times) | R$ 150k/ano | 12 meses | Treinamento + implantação | Apex + Rian + Camada 4 |
| **DR-E** (Enterprise) | R$ 350k/ano | 12 meses | Dedicação exclusiva, arquitetura 360° | Apex + todos os agents |

**Commands de Apex** (consolidados de Dara e Executor na v2.0.0):
- `*select-product {cliente}` — qual DR-X/O/T/E para este cliente
- `*dr-pitch {prospect}` — executa task `dr-pitch.md` (absorve Dara)
- `*dr-diagnose {cliente}` — diagnóstico inicial pré-proposta
- `*dr-propose {cliente}` — elabora proposta formal DR
- `*dr-pop-create {processo}` — executa task `dr-pop-create.md` (absorve Executor)
- `*dr-quality-review {entregavel}` — auditoria de entregável DR
- `*engage-client {produto}` — inicia engajamento

---

## 7 · Changelog

### v2.0.0 — 2026-04-22
**Responsável:** Luiz Henrique + Craft (squad-creator)
**Motivo:** Squad v1.0 tinha 20 agents com sobreposição crítica, orquestradores competindo, manifest quebrado, taxonomia de travas divergente do doc oficial V4.

**Fase 1 — Correções emergenciais + documento-mãe (CONCLUÍDA):**
- ✅ Criado este documento-mãe como referência única
- ✅ Corrigido `squad.yaml`: removidas referências fantasma `revenue-ops-analyst.md` e `data-intelligence-analyst.md`; adicionados `dr-chief.md` e `ops-dr.md` que estavam órfãos
- ✅ Substituída taxonomia das 8 travas por versão oficial V4 (Cegueira/Exposição/Atenção/Interesse/Qualificação/Compromisso/Decisão/Retenção)
- ✅ Bloco `governanca` adicionado ao `squad.yaml` (3 princípios G1/G2/G3)

**Fase 2 — Merges e promoção a tasks (CONCLUÍDA):**
- ✅ Merge Ancora (`guardiao-retencao`) + Atlas (`retention-architect`) → novo `retention-master.md` (persona única, framework CARE, tático + estratégico unificado)
- ✅ Absorvido Fluxo (`fabricante-aquisicao`) em Nexus (`orchestrator`) — Nexus agora é Triage + Integrador de Aquisição com commands T1-T5
- ✅ Dara (`destrava-receita-consultant`) convertido em task `tasks/dr-pitch.md` (owned por Apex)
- ✅ Executor (`ops-dr`) convertido em task `tasks/dr-pop-create.md` (owned por Apex)
- ✅ Apex (`dr-chief`) atualizado com commands `*dr-pitch`, `*dr-pop-create`, `*dr-quality-review`
- ✅ 5 agents deletados fisicamente de `/agents/`
- ✅ `squad.yaml` bumped para v2.0.0, 16 agents, 12 tasks
- ✅ Referências órfãs corrigidas em `tasks/*.md` (4 task frontmatters) e `data/*.yaml` (travas-reference + pilares-v4-reference)

**Fase 3 — Workflows, gates e validação final (CONCLUÍDA):**
- ✅ Criada `tasks/v4-integration.md` (gate de Fabio com 5 critérios V4)
- ✅ Restruturados 3 workflows `/workflows/wf-*.yaml`:
  - ✅ Adicionados `workflow.id` e `workflow.sequence:` (schema compliance)
  - ✅ Substituídas todas as 5 referências a agents deletados (destrava-receita-consultant → dr-chief, guardiao-retencao → retention-master, retention-architect → retention-master, data-intelligence-analyst → roi-analyst, fabricante-aquisicao removido)
  - ✅ Fabio declarado como `quality_gate` em todos os 3 workflows
  - ✅ Binding G2: 16/16 agents com pelo menos 1 task ou workflow
- ✅ `README.md` reescrito apontando para este documento-mãe + hierarquia L1-L5 + 16 agents + G1/G2/G3
- ✅ `v4-integration.md` adicionada em `components.tasks` (total: 13 tasks)
- ✅ `*validate-squad` final: **VALID: true · ERRORS: 0**

**Resultado da refatoração v2.0.0 (completa):**
- ✅ 20 → **16 agents** (redução de 20%)
- ✅ 10 → **13 tasks** (dr-pitch, dr-pop-create, v4-integration)
- ✅ 3 workflows restruturados com Fabio como quality_gate
- ✅ Taxonomia das 8 travas alinhada ao doc oficial V4
- ✅ Governança G1 (documento-mãe) + G2 (binding) + G3 (quality gate) implementada
- ✅ 0 referências órfãs em tasks, data, workflows
- ✅ Schema compliance: 0 erros no validator

**Agents removidos nesta versão (5):** fabricante-aquisicao, guardiao-retencao, retention-architect, destrava-receita-consultant, ops-dr
**Agents criados nesta versão (1):** retention-master
**Tasks criadas nesta versão (2):** dr-pitch, dr-pop-create
**Resultado:** 20 agents (v1.0) → **16 agents (v2.0)** · 10 tasks → 12 tasks

### v1.0.0 — pré-2026-04-22
Versão inicial com 20 agents, criada antes da adoção dos princípios de governança (documento-mãe, binding obrigatório, gate centralizado).

---

## 8 · Como contribuir (regra de ouro)

1. **Toda mudança começa aqui.** Edite este documento-mãe **antes** de tocar em `squad.yaml`, `/agents/`, `/tasks/` ou `/workflows/`
2. **Todo agent novo precisa de binding.** Ao propor um agent, a PR deve incluir: qual task(s) ele owns + qual workflow(s) o usa + como Fabio valida seu output
3. **Toda task nova deve ter owner.** Nenhuma task órfã — defina qual agent (ou combinação) a executa
4. **Changelog é append-only.** Nunca reescreva histórico da Seção 7 — apenas adicione novas entradas acima
5. **Validate depois de cada mudança:** `node .aiox-core/core/squad/squad-validator.js squads/fabrica-de-receita`
