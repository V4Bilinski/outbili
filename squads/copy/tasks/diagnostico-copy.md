---
name: diagnostico-copy
description: |
  Diagnostico obrigatorio Tier 0. Mapeia awareness level, market sophistication,
  executa baseline Hopkins Audit e recomenda o copywriter ideal para o projeto.
agent: copy-chief + eugene-schwartz + claude-hopkins
tier: 0
required: true
gate: "NUNCA pular este diagnostico antes de qualquer execucao"
version: "1.0.0"
---

# Task: Diagnostico de Copy (Tier 0)

## Objetivo

Executar o diagnostico completo antes de qualquer producao de copy. Este passo e
**obrigatorio e inegociavel** — nenhum copywriter Tier 1-3 e ativado sem passar por
aqui. O diagnostico garante que o copy correto seja produzido para o nivel de
consciencia real do publico, com o copywriter certo para o contexto.

---

## Pre-requisitos

- Brief do projeto (produto, oferta, publico-alvo)
- URL ou descricao da pagina/copy existente (se houver)
- Objetivo da peca: venda, captura, nurture, lancamento?
- Informacoes sobre o mercado: nicho, concorrentes, saturacao

---

## Passos

### Passo 1 — Triagem pelo Copy Chief

**Agente:** `@copy-chief`

1. Receber o brief completo do projeto
2. Identificar o tipo de peca solicitada:
   - [ ] Sales Page
   - [ ] Email Sequence
   - [ ] VSL (Video Sales Letter)
   - [ ] Headlines / Fascinations
   - [ ] Lancamento PLF
   - [ ] Outro: ___________
3. Definir urgencia e complexidade (LOW / MID / HIGH)
4. Acionar `@eugene-schwartz` para mapeamento de awareness

---

### Passo 2 — Mapeamento de Awareness (Eugene Schwartz)

**Agente:** `@eugene-schwartz`

Mapear o nivel de consciencia do publico na escala de 5 niveis:

| Nivel | Nome | Descricao | Implicacao para o copy |
|-------|------|-----------|------------------------|
| 1 | Unaware | Nao sabe que tem o problema | Educacao radical, nao venda |
| 2 | Problem Aware | Sabe do problema, nao da solucao | Conectar dor com solucao |
| 3 | Solution Aware | Conhece solucoes, nao o produto | Diferenciar categoria |
| 4 | Product Aware | Conhece o produto, nao comprou | Superar objecoes, prova |
| 5 | Most Aware | Pronto para comprar | CTA direto, oferta irresistivel |

**Output obrigatorio:**
```
Awareness Level: [1-5]
Justificativa: [2-3 frases explicando o diagnostico]
Headline recomendada para este nivel: [exemplo]
```

Mapear tambem a **sofisticacao do mercado** (1-5):

| Nivel | Descricao | Abordagem |
|-------|-----------|-----------|
| 1 | Virgem — primeiro produto da categoria | Claim direto funciona |
| 2 | Saturado Level 1 — alguns players | Amplificar o claim |
| 3 | Saturado Level 2 — muitos players | Unico mecanismo |
| 4 | Hipersaturado — commodity | Historia + identificacao |
| 5 | Cansado de promessas | Reverse psychology, proof-first |

**Output obrigatorio:**
```
Market Sophistication: [1-5]
Abordagem recomendada: [descricao]
```

---

### Passo 3 — Baseline Hopkins Audit

**Agente:** `@claude-hopkins`

Executar auditoria cientifica usando os 10 principios de Claude Hopkins:

| # | Principio Hopkins | Peso | Score (0-10) | Notas |
|---|-------------------|------|--------------|-------|
| 1 | Specificity (numeros, fatos) | 15% | ___ | |
| 2 | Reason-why copy | 12% | ___ | |
| 3 | Claims testados/provados | 12% | ___ | |
| 4 | Offer clarity | 10% | ___ | |
| 5 | Headline power | 10% | ___ | |
| 6 | Curiosity + service framing | 10% | ___ | |
| 7 | Long copy justificado | 8% | ___ | |
| 8 | Subheads e scanability | 8% | ___ | |
| 9 | Testimonials / social proof | 8% | ___ | |
| 10 | Guarantee boldness | 7% | ___ | |

**Formula de Score:**
```
Hopkins Score = (soma ponderada dos 10 criterios)
Minimo aceitavel: 85/100
```

Se copy existente: auditoria do copy atual como baseline.
Se copy novo: auditoria do brief/angulo proposto como projecao.

**Output obrigatorio:**
```
Hopkins Baseline Score: [0-100]
Top 3 gaps identificados:
  1. [gap]
  2. [gap]
  3. [gap]
Recomendacoes prioritarias:
  1. [acao]
  2. [acao]
```

---

### Passo 4 — Recomendacao de Copywriter

**Agente:** `@copy-chief`

Com base nos diagnosticos de awareness, sofisticacao e Hopkins, recomendar o
copywriter ideal:

#### Matriz de Selecao

| Situacao | Copywriter Recomendado | Razao |
|----------|----------------------|-------|
| Awareness 1-2 + Sofisticacao 1-2 | Eugene Schwartz | Educacao de mercado |
| Sales page emocional, historia | Gary Halbert | Storytelling visceral |
| Sales page prova-heavy, bullets | Gary Bencivenga | Fascinations + proof |
| Marca premium, elegancia | David Ogilvy | Brand authority |
| Email urgency, escassez | Dan Kennedy | NO B.S. direto |
| Mercado saturado, mecanismo | Todd Brown | E5 Method |
| Lancamento de produto | Jeff Walker | PLF completo |
| VSL / video | Jon Benson | Sellerator format |
| Curso, enrollment | Ry Schwartz | Transformacao narrativa |
| Awareness profunda do mercado | Robert Collier | Mental conversation |

**Output final do diagnostico:**
```yaml
diagnostico:
  produto: [nome]
  peca_solicitada: [tipo]
  awareness_level: [1-5]
  market_sophistication: [1-5]
  hopkins_baseline: [score]
  copywriter_primario: [nome]
  copywriter_secundario: [nome, se colaboracao necessaria]
  angulo_recomendado: [descricao do angulo principal]
  alertas:
    - [alerta 1 se houver]
    - [alerta 2 se houver]
  proximo_passo: [task a executar]
```

---

## Output

**Arquivo gerado:** `diagnostico-{produto}-{data}.yaml`

Conteudo obrigatorio:
- Awareness Level (1-5) com justificativa
- Market Sophistication (1-5) com abordagem
- Hopkins Baseline Score com top 3 gaps
- Copywriter(s) recomendado(s) com justificativa
- Angulo de copy recomendado
- Proxima task a executar

---

## Validacao

### Gate de Qualidade — Tier 0

- [ ] Awareness Level definido (1-5) com justificativa
- [ ] Market Sophistication definido (1-5) com abordagem
- [ ] Hopkins Baseline Score calculado (0-100)
- [ ] Top 3 gaps identificados e documentados
- [ ] Copywriter primario selecionado com justificativa
- [ ] Angulo de copy definido
- [ ] Nenhum copywriter Tier 1-3 foi ativado sem este diagnostico

### Criterio de Aprovacao

**PASS:** Todos os 7 checkboxes marcados → prosseguir para task de execucao  
**FAIL:** Qualquer checkbox vazio → completar antes de prosseguir

> Lembrete: Hopkins Score minimo no OUTPUT final deve ser 85/100.
> Se o baseline estiver abaixo, os gaps identificados aqui guiam a producao.
