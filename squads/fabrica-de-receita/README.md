# Fabrica de Receita — Squad de Growth, Performance e Revenue

**Squad:** `fabrica-de-receita` | **Slash:** `/fdr` | **Versao:** 2.0.0
**Metodologia:** V4 Company | **Agents:** 16 | **Autor:** Luiz Henrique

> 📖 **Documento-mae (fonte unica de referencia):** [`FABRICA-DE-RECEITA.md`](./FABRICA-DE-RECEITA.md)
> Qualquer modificacao no squad comeca por atualizar esse documento — agents, tasks, workflows, taxonomia e gates derivam dele.

---

## O que e a Fabrica de Receita

Squad de IA especializado em diagnosticar e destravar gargalos de receita em empresas,
aplicando a metodologia V4 Company. Opera sobre **4 Pilares V4** × **8 Travas oficiais**
× **framework STEP** × **ciclos de 90 dias**, usando **TOC (Theory of Constraints)**
para identificar o gargalo principal e concentrar esforco.

**Principio central:** Destravar o gargalo certo no momento certo e a diferenca entre
crescer 20% e 10x.

---

## Governanca (v2.0.0)

Tres principios obrigatorios para qualquer mudanca no squad:

| # | Principio | O que significa |
|---|-----------|-----------------|
| G1 | **Documento-mae** | [`FABRICA-DE-RECEITA.md`](./FABRICA-DE-RECEITA.md) e referencia unica. Toda mudanca comeca la |
| G2 | **Binding obrigatorio** | Todo agent vinculado a pelo menos 1 task e 1 workflow (sem orfaos) |
| G3 | **Quality gate gerencial** | Fabio (fabrica-de-receita-master) valida saidas via task `v4-integration.md` |

---

## Hierarquia em 5 Camadas (16 agents)

```
CAMADA 1 — STRATEGIC (3)
  [1] Fabio      (fabrica-de-receita-master)   MASTER V4 + QUALITY GATE
  [2] Vitor      (growth-strategist)            OKRs, GTM, north-star
  [3] Gabi       (growth-planner)               Ciclos 90d, ICE, sprints

CAMADA 2 — TRIAGE & DIAGNOSTICO (3)
  [4] Nexus      (orchestrator)                 Triage + integrador aquisicao
  [5] Logica     (diagnosticador)               TOC, CRT, 5FS
  [6] Diagnosta  (especialista-spiced)          SPICED qualification

CAMADA 3 — ESTRATEGIA DE RECEITA (1)
  [7] Arquiteto  (estrategista-receita)         ICP, pricing, forecast

CAMADA 4 — EXECUCAO POR PILAR (6)
  Aquisicao (Cegueira → Qualificacao):
    [8]  Hunter  (traffic-hunter)               Paid + organic, ROAS
    [9]  Nova    (content-engine)               Content + nurture
    [10] Zara    (conversion-optimizer)         CRO + A/B
    [11] Aria    (ai-marketing-engineer)        MarTech + automacoes
  Comercial (Compromisso → Decisao):
    [12] Fechador (maquina-comercial)           Playbooks comerciais
  Retencao (Retencao):
    [13] Atlas   (retention-master)             Health + LTV + churn + NPS

CAMADA 5 — SUPORTE TRANSVERSAL (2)
  [14] Data      (roi-analyst)                  ROI, attribution, BI
  [15] Rian      (revenue-team-architect)       Org design, RevOps

LINHA DE NEGOCIO DR (1)
  [16] Apex      (dr-chief)                     DR-X/O/T/E + pitch + POPs
```

> Ver documento-mae para fluxo de handoff completo e matriz agent → task/workflow.

---

## As 8 Travas de Receita (Taxonomia Oficial V4)

| # | Nome | O que e | Pilar V4 |
|---|------|---------|----------|
| T1 | **Cegueira** | Nao sabe quem e o mercado-alvo nem onde encontra-lo | Trafego |
| T2 | **Exposicao** | Mercado nao ve a solucao ou ve pouco | Trafego |
| T3 | **Atencao** | Leads recebem tanto conteudo que nao focam | Engajamento |
| T4 | **Interesse** | Leads nao veem valor unico ou sao indiferentes | Engajamento |
| T5 | **Qualificacao** | Leads nao passam pelo funil de qualificacao | Engajamento |
| T6 | **Compromisso** | Prospect nao se posiciona como buyer na negociacao | Conversao |
| T7 | **Decisao** | Buyer nao assina o contrato | Conversao |
| T8 | **Retencao** | Cliente cancela, nao expande, churn alto | Retencao |

**Regra TOC:** atacar todas as travas ao mesmo tempo e desperdicar recursos.
Identificar a trava principal (gargalo) e concentrar 80% do esforco nela.

---

## Os 4 Pilares V4

```
TRAFEGO          ENGAJAMENTO       CONVERSAO         RETENCAO
─────────        ───────────       ─────────         ────────
Atrair o         Converter         Transformar       Maximizar
publico certo    atencao em        intencao em       LTV e
com custo        intencao          receita           expandir
otimizado
KPIs:            KPIs:             KPIs:             KPIs:
CAC, ROAS,       CTR, Open Rate,   CVR, Ticket,      Churn Rate,
CPL, CPC         Time-on-page      ARR, MRR          NPS, LTV
T1-T2            T3-T4-T5          T6-T7             T8
```

---

## Framework STEP

Toda metodologia DR segue o framework STEP:

| Letra | Significado | Descricao |
|-------|-------------|-----------|
| **S** | Situacao | Onde o cliente esta hoje (metricas atuais, contexto, mercado) |
| **T** | Trava | O que esta impedindo o crescimento (gargalo principal via TOC) |
| **E** | Estrategia | O caminho para destravar (pilares V4, alavancas, sequencia) |
| **P** | Plano | As acoes concretas organizadas em ciclo de 90 dias |

---

## Produtos Destrava Receita

| Produto | Investimento | Duracao | Escopo | Owner |
|---------|--------------|---------|--------|-------|
| **DR-X** (Diagnostico) | R$ 20-40k | 45 dias | Identificar trava + plano + sprint inicial | Apex + Logica + Diagnosta |
| **DR-O** (Operacional) | R$ 50k/ano | 12 meses | Acompanhamento mensal, 1-2 pilares | Apex + Camada 4 relevante |
| **DR-T** (Times) | R$ 150k/ano | 12 meses | Treinamento + implantacao | Apex + Rian + Camada 4 |
| **DR-E** (Enterprise) | R$ 350k/ano | 12 meses | Dedicacao exclusiva, arquitetura 360° | Apex + todos os agents |

> Apex (dr-chief) orquestra toda a linha DR. Pitch e proposta via task `dr-pitch.md`.
> POPs e artefatos padronizados via task `dr-pop-create.md`.

---

## Ciclos de 90 Dias

```
MES 1: DIAGNOSTICO + QUICK WINS
  - Semana 1-2: Diagnostico profundo (STEP), identificar trava principal
  - Semana 3-4: Quick wins — acoes de alto impacto e baixo esforco
  - Meta: Gerar credibilidade e primeiros resultados

MES 2: IMPLANTACAO DAS 3 ALAVANCAS
  - Semana 5-6: Implantar Alavanca 1 (maior impacto no gargalo)
  - Semana 7-8: Implantar Alavancas 2 e 3 (complementares)
  - Meta: Destravar o gargalo principal

MES 3: MEDICAO + AJUSTE + PROXIMO CICLO
  - Semana 9-10: Medicao de resultados vs metas
  - Semana 11: Ajustes e otimizacoes
  - Semana 12: Planejamento do proximo ciclo
  - Meta: Consolidar ganhos e identificar proximo gargalo
```

---

## Pipeline de Engajamento DR (com Quality Gates)

```
LEAD ENTRA
    ↓
[1. TRIAGE]           Nexus classifica trava + roteia
    ↓
[2. QUALIFICACAO]     Diagnosta aplica SPICED
    Gate: QUALIFICADO / DESQUALIFICADO
    ↓
[3. DIAGNOSTICO]      Logica executa TOC (5 Focusing Steps)
    Output: trava principal + recomendacao produto DR
    ↓
[4. PROPOSTA DR]      Apex executa *dr-pitch (task)
    Gate: Fabio valida proposta (v4-integration) antes de enviar
    ↓
[5. FECHAMENTO]       Apex + Fechador (ou handoff time-de-negocios)
    ↓
[6. PLANEJAMENTO]     Gabi monta ciclo 90d + 3 alavancas
    Gate: Fabio valida plano (v4-integration) antes do kick-off
    ↓
[7. EXECUCAO]         Camada 4 executa (Hunter/Nova/Zara/Aria/Fechador/Atlas)
    Review mensal + quality gate Fabio em cada marco
    ↓
[8. MEDICAO]          Data mede ROI real vs baseline
    Gate: Fabio valida report final antes do C-level
    ↓
[RENOVACAO / UPSELL / OFFBOARDING]
```

**Quality gate padrao:** Fabio aplica os 5 criterios V4 (STEP / Trava / Pilar / Metrica / Ciclo90d)
em todo output critico antes de entregar ao cliente. Ver task `v4-integration.md`.

---

## Como Usar o Squad

### Diagnostico inicial
```
@fdr orchestrator — Preciso de diagnostico para [empresa]
@fdr diagnosticador — Aplicar 5 Focusing Steps para mapear trava principal
@fdr especialista-spiced — Qualificar esse prospect com SPICED
```

### Pitch e proposta DR
```
@fdr dr-chief *dr-pitch [prospect]
@fdr dr-chief *dr-propose [cliente]
```

### Ciclo 90 dias
```
@fdr growth-planner — Montar ciclo focado em [trava T3 Atencao]
@fdr fabrica-de-receita-master — Orquestrar ciclo + validar entregas
```

### Execucao por pilar
```
@fdr traffic-hunter     — Trafego pago/organico, CAC, ROAS
@fdr content-engine     — Conteudo, copy, email sequences
@fdr conversion-optimizer — CRO, landing pages, A/B testing
@fdr retention-master   — Churn, LTV, NPS, expansao
```

### Quality gate gerencial
```
@fdr fabrica-de-receita-master *v4-integration [output]
```

### Workflows
```
/fdr wf-diagnostico-pipeline — Pipeline de diagnostico completo (4 fases)
/fdr wf-destrava-receita     — Pipeline DR do inicio ao fim (5 fases)
/fdr wf-growth-sprint         — Sprint de growth 4 semanas (5 fases)
```

---

## Integracao com Outros Squads

| Squad | Quando Integrar |
|-------|----------------|
| `time-de-negocios` | Fechamento de proposta DR complexa (deal > R$100k) |
| `copy` | Producao de copy para funis, landing pages, email sequences |
| `whatsapp-business-api` | Automacao de nurture e follow-up via WhatsApp |
| `squad-crm` | Pipeline CRM dos clientes DR, health score |

---

## Agentes Disponiveis (16)

| # | Agente | Persona | Especialidade | Camada |
|---|--------|---------|---------------|--------|
| 1 | `@fabrica-de-receita-master` | Fabio | Master V4 + quality gate | L1 |
| 2 | `@growth-strategist` | Vitor | OKRs, GTM, growth strategy | L1 |
| 3 | `@growth-planner` | Gabi | Ciclos 90d, ICE scoring, sprints | L1 |
| 4 | `@orchestrator` | Nexus | Triage + integrador aquisicao | L2 |
| 5 | `@diagnosticador` | Logica | TOC, 5 Focusing Steps, CRT | L2 |
| 6 | `@especialista-spiced` | Diagnosta | SPICED qualification | L2 |
| 7 | `@estrategista-receita` | Arquiteto | ICP, pricing, forecast | L3 |
| 8 | `@traffic-hunter` | Hunter | Trafego pago/organico | L4 |
| 9 | `@content-engine` | Nova | Conteudo, copy, email, social | L4 |
| 10 | `@conversion-optimizer` | Zara | CRO, A/B testing, landing pages | L4 |
| 11 | `@ai-marketing-engineer` | Aria | MarTech, automacoes, n8n, AI | L4 |
| 12 | `@maquina-comercial` | Fechador | Playbooks comerciais, objecoes | L4 |
| 13 | `@retention-master` | Atlas | Health + LTV + churn + NPS (merge Ancora+Atlas) | L4 |
| 14 | `@roi-analyst` | Data | ROI, attribution, BI, dashboards | L5 |
| 15 | `@revenue-team-architect` | Rian | Org design, hiring, RevOps | L5 |
| 16 | `@dr-chief` | Apex | DR-X/O/T/E + pitch + POPs | DR |

> **Agents removidos na v2.0.0:** `fabricante-aquisicao` (Fluxo, absorvido em Nexus),
> `guardiao-retencao` + `retention-architect` (merged em retention-master),
> `destrava-receita-consultant` (virou task `dr-pitch.md` de Apex),
> `ops-dr` (virou task `dr-pop-create.md` de Apex).

---

## Tasks (12)

| Task | Owner principal | Descricao |
|------|----------------|-----------|
| `diagnostico-travas.md` | diagnosticador | Diagnostico completo das 8 travas via TOC |
| `growth-audit.md` | orchestrator | Auditoria rapida por pilar V4 |
| `ciclo-90-dias.md` | growth-planner | Planejamento detalhado de ciclo 90d |
| `construir-oferta-dr.md` | dr-chief | Proposta DR personalizada |
| `qualificar-spiced.md` | especialista-spiced | Qualificacao SPICED de prospect |
| `montar-funil.md` | conversion-optimizer | Design de funil de conversao |
| `plano-trafego.md` | traffic-hunter | Plano de aquisicao paid + organic |
| `estrategia-retencao.md` | retention-master | Estrategia T8 integrada |
| `roi-analysis.md` | roi-analyst | Analise de ROI, attribution |
| `montar-time-receita.md` | revenue-team-architect | Arquitetura de time comercial |
| `dr-pitch.md` | dr-chief | Pitch DR + diagnostico express + proposta (ex-Dara) |
| `dr-pop-create.md` | dr-chief | POPs + artefatos padronizados (ex-Executor) |
| `v4-integration.md` | fabrica-de-receita-master | Quality gate V4 (5 criterios) |

---

## Workflows (3)

| Workflow | Descricao | Quality Gate |
|----------|-----------|--------------|
| `wf-diagnostico-pipeline` | Pipeline de diagnostico em 4 fases | Fabio valida diagnostico final |
| `wf-destrava-receita` | Pipeline DR completo em 5 fases | Fabio em 4 pontos criticos |
| `wf-growth-sprint` | Sprint de growth em 5 fases (4 sem) | Fabio valida hipotese + resultado |

---

## Changelog

Ver secao 7 de [`FABRICA-DE-RECEITA.md`](./FABRICA-DE-RECEITA.md) para changelog completo.

- **v2.0.0** (2026-04-22): 20 → 16 agents. Merge Ancora+Atlas. Fluxo absorvido em Nexus.
  Dara/Executor viram tasks de Apex. Taxonomia das 8 travas alinhada ao doc oficial V4.
  Governanca G1+G2+G3 implementada. Fabio como quality gate em todos os workflows.
- **v1.0.0**: Versao inicial com 20 agents, criada antes da adocao dos principios
  de governanca.
