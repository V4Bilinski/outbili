# V4 Integration — Quality Gate Gerencial (Fabio)

---
name: v4-integration
description: Gate de validação gerencial — Fabio valida toda saída do squad contra os 5 critérios V4 antes de entregar ao cliente
agent: fabrica-de-receita-master
created_at: 2026-04-22
governanca: G3 (Quality Gate) — ver FABRICA-DE-RECEITA.md secao 5
---

## Objetivo

Garantir que **toda saida de agent das Camadas 3 e 4 passa por Fabio antes de ser entregue ao cliente**.
Fabio aplica 5 criterios de aprovacao V4 e emite veredicto (APPROVE / REVISE / ESCALATE).
Sem este gate, saidas dos especialistas chegam ao cliente sem validacao gerencial —
risco de entrega fragmentada, fora da metodologia, ou desalinhada com o ciclo 90d.

## Pre-requisitos

- Output de agent da Camada 3 (Arquiteto) ou Camada 4 (Hunter/Nova/Zara/Aria/Fechador/retention-master)
- Contexto do engajamento (DR-X / DR-O / DR-T / DR-E, trava alvo, ciclo atual)
- Acesso ao historico de validacoes anteriores (`data/fabio-gate-decisions.yaml`)

## Passos

### Step 1: Coletar o Output a Validar

Identificar:
- **Agent originador** (quem produziu)
- **Tipo de artefato** (proposta, playbook, plano de trafego, estrategia retencao, etc.)
- **Cliente alvo** e contexto do engajamento
- **Trava sendo atacada** (usar taxonomia oficial V4)
- **Pilar V4 afetado** (Trafego / Engajamento / Conversao / Retencao)

### Step 2: Aplicar os 5 Criterios V4

Para cada criterio, registrar PASS / FAIL / PARTIAL + justificativa:

#### Criterio 1 — Alinhamento STEP
Output referencia explicitamente Situacao (S), Trava (T), Estrategia (E), Plano (P)?
- [ ] S: Diagnostico do estado atual do cliente com dados reais
- [ ] T: Trava principal nomeada usando taxonomia oficial V4
- [ ] E: Caminho estrategico para destravar
- [ ] P: Plano de acao concreto (responsaveis, prazos, entregaveis)

#### Criterio 2 — Trava Identificada com Evidencia
A trava atacada esta ancorada em dados quantitativos do cliente?
- [ ] Trava nomeada (Cegueira/Exposicao/Atencao/Interesse/Qualificacao/Compromisso/Decisao/Retencao)
- [ ] Sintomas documentados com numeros (CAC, ROAS, CVR, churn, NPS, etc.)
- [ ] Evidencia do cliente (nao generica, especifica ao caso)

#### Criterio 3 — Pilar V4 Explicito
O pilar afetado esta nomeado e justificado?
- [ ] Pilar nomeado (Trafego / Engajamento / Conversao / Retencao)
- [ ] Alavancas coerentes com o pilar
- [ ] Nao mistura pilares sem justificativa explicita

#### Criterio 4 — Metrica Mensuravel
Ha KPI atrelado com baseline e meta?
- [ ] Metrica principal nomeada (ex: ROAS, MRR expansion, churn rate)
- [ ] Baseline atual registrado
- [ ] Meta SMART definida (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Metrica casa com o pilar V4 declarado

#### Criterio 5 — Cabe no Ciclo 90d
A acao e executavel dentro de um ciclo, ou foi decomposta corretamente?
- [ ] Acao completavel em < 90 dias OU
- [ ] Decomposta em multiplos ciclos com handoff claro entre eles
- [ ] Cronograma mes 1 / mes 2 / mes 3 visivel
- [ ] Quick wins identificados para mes 1

### Step 3: Emitir Veredicto

Com base nos 5 criterios, Fabio emite:

| Veredicto | Condicao | Acao |
|---|---|---|
| **APPROVE** | 5/5 PASS ou 4/5 PASS + 1 PARTIAL com justificativa | Libera para cliente + atualiza Data (ROI tracking) |
| **REVISE** | 3-4 criterios PASS, gaps especificos | Retorna ao agent originador com lista de gaps nomeados |
| **ESCALATE** | < 3 criterios PASS ou criterio crítico ausente | Eleva a Luiz Henrique (autor), engajamento pausa |

### Step 4: Documentar a Decisao

Append ao arquivo `data/fabio-gate-decisions.yaml`:

```yaml
- timestamp: 2026-XX-XX HH:MM
  agent_originador: <agent_id>
  artefato: <tipo>
  cliente: <id ou referencia>
  trava: <T1-T8>
  pilar: <trafego|engajamento|conversao|retencao>
  criterios:
    step: PASS | PARTIAL | FAIL
    trava_evidencia: PASS | PARTIAL | FAIL
    pilar: PASS | PARTIAL | FAIL
    metrica: PASS | PARTIAL | FAIL
    ciclo_90d: PASS | PARTIAL | FAIL
  veredicto: APPROVE | REVISE | ESCALATE
  notas: "..."
```

### Step 5: Comunicar Resultado

- **APPROVE:** entregar ao cliente + informar agent originador (reforco positivo)
- **REVISE:** retornar ao agent originador com comentarios especificos por criterio que falhou
- **ESCALATE:** notificar Luiz Henrique, pausar engajamento, agendar revisao ad hoc

## Entregaveis

- Veredicto formal (APPROVE / REVISE / ESCALATE) registrado em `data/fabio-gate-decisions.yaml`
- Feedback estruturado ao agent originador (se REVISE)
- Output aprovado + stamped "V4-validated" (se APPROVE) para entrega ao cliente

## Quando Acionar

- Ao final de cada fase dos workflows `wf-diagnostico-pipeline`, `wf-destrava-receita`, `wf-growth-sprint`
- Antes de qualquer entrega formal ao cliente (proposta, playbook, plano, relatorio)
- Manualmente via `@fabrica-de-receita-master *v4-integration {output}`
- Automaticamente no `quality_gate` das sequencias de workflow

## Frequencia e SLA

- **SLA de validacao:** 24h para outputs DR-X / DR-O; 48h para DR-T / DR-E
- **Frequencia tipica:** 3-5 gates por engajamento ativo (por ciclo 90d)
- **Override:** apenas Luiz Henrique pode sobrepor um REVISE com justificativa escrita

## Handoffs

- **Entrada:** qualquer output de agent da Camada 3 ou 4, ou output de workflow
- **Saida:**
  - APPROVE → cliente (via Apex para engajamentos DR, ou direto)
  - REVISE → agent originador
  - ESCALATE → Luiz Henrique

## Referencias

- Criterios detalhados: `FABRICA-DE-RECEITA.md` secao 5
- Taxonomia oficial das 8 travas: `FABRICA-DE-RECEITA.md` secao 4
- Arquivo de decisoes: `data/fabio-gate-decisions.yaml` (criado ao primeiro uso)
- Produtos DR: `agents/dr-chief.md`
