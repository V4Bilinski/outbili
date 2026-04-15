---
name: scene-analysis
description: Analise de cenas usando Story Structure de Robert McKee — beats, value charges, the Gap, controlling idea
agent: robert-mckee
tier: 1
execution_type: agent
input:
  - momentos.md (output do Tier 0)
  - narrative_structure.yaml (parcial, de ken-burns/walter-murch/matthew-dicks)
output:
  - scene_analysis.yaml (analise de cenas com value charges e gaps)
dependencies:
  - mine-transcript
  - build-narrative (parcial — pode rodar em paralelo com outros Tier 1)
quality_gate: QG-003
---

# Scene Analysis — Robert McKee Story Structure

## Objetivo

Aplicar o framework de Story Structure de Robert McKee aos momentos minerados, analisando a estrutura dramatica em niveis de beat → scene → sequence → act, identificando value charges (positivo/negativo) e the Gap (expectativa vs resultado) para maximizar impacto narrativo.

## Pre-requisitos

- `momentos.md` do Tier 0 (mining completo, QG-002 passed)
- Conhecimento do formato de saida desejado (shorts, longform, longform-simple)
- Agent `robert-mckee` carregado com Story Structure framework

## Framework McKee — Conceitos Chave

### Hierarquia Narrativa
```
Beat (menor unidade de mudanca)
  → Scene (sequencia de beats com turning point)
    → Sequence (sequencia de scenes)
      → Act (macro-mudanca de valor)
```

### Value Charges
Cada scene tem uma carga de valor que muda:
- **Positivo (+)** → Negativo (-): Reversal descendente
- **Negativo (-)** → Positivo (+): Reversal ascendente
- **Positivo (+)** → Mais Positivo (++): Progressao
- **Negativo (-)** → Mais Negativo (--): Progressao descendente

### The Gap
A distancia entre expectativa e resultado. Quanto maior o gap, maior o impacto emocional.

## Passos

### 1. Mapear beats nos momentos minerados

Para cada momento em `momentos.md`:

```yaml
beat_analysis:
  momento_id: M-001
  timestamp: "00:12:34"
  beat_type: "revelation"  # revelation, decision, action, reaction
  value_before: "negative"  # estado emocional antes
  value_after: "positive"   # estado emocional depois
  value_charge: "+/-"       # direcao da mudanca
  gap_score: 8              # 1-10: quao surpreendente e a mudanca
  gap_description: "Audiencia espera X, mas acontece Y"
```

### 2. Agrupar beats em scenes

```yaml
scenes:
  - scene_id: S-001
    title: "A revelacao do problema"
    beats: [M-001, M-003, M-007]
    timestamp_range: "00:12:34 — 00:15:22"
    opening_value: "negative"
    closing_value: "positive"
    turning_point: M-007
    turning_point_type: "revelation"  # revelation, decision, action
    gap_magnitude: "high"
    scene_duration_seconds: 168
    narrative_function: "inciting_incident"  # setup, inciting_incident, progressive_complication, crisis, climax, resolution
```

### 3. Identificar the Controlling Idea

```yaml
controlling_idea:
  statement: "{Value} is achieved/lost when {cause}"
  example: "Sucesso e alcancado quando se abandona o convencional"
  value: "sucesso/fracasso"
  cause: "abandonar convencoes"
  evidence_moments: [M-001, M-015, M-042]
```

### 4. Mapear arco dramatico completo

```yaml
dramatic_arc:
  setup:
    scenes: [S-001, S-002]
    value_state: "neutral → negative"
    purpose: "Estabelecer status quo e problema"

  inciting_incident:
    scene: S-003
    moment: M-012
    gap: "Alto — expectativa quebrada"
    purpose: "Evento que inicia a mudanca"

  progressive_complications:
    scenes: [S-004, S-005, S-006]
    value_trajectory: "alternating +/-"
    purpose: "Tensao crescente com reversals"

  crisis:
    scene: S-007
    moment: M-028
    dilemma: "Escolha entre X e Y — ambos com custo"
    purpose: "Momento de decisao irreversivel"

  climax:
    scene: S-008
    moment: M-035
    gap: "Maximo — maior reversal do conteudo"
    purpose: "Pico emocional e resolucao da tensao"

  resolution:
    scene: S-009
    moments: [M-040, M-042]
    new_equilibrium: "positive"
    purpose: "Novo status quo pos-transformacao"
```

### 5. Gerar recomendacoes para montagem

```yaml
assembly_recommendations:
  - recommendation: "Abrir com S-003 (inciting incident) — nao com setup"
    reason: "Gap alto gera hook imediato (McKee: start late, leave early)"
    applicable_to: [shorts, longform]

  - recommendation: "Scene S-005 pode ser removida sem perda narrativa"
    reason: "Value charge repete S-004 sem novo gap"
    applicable_to: [shorts]

  - recommendation: "Inserir S-007 (crisis) antes do climax sem transicao"
    reason: "Corte seco aumenta tensao (Murch: emotion > story)"
    applicable_to: [longform, longform-simple]
```

### 6. Scoring de scenes para priorizacao

| Scene | Duration | Value Change | Gap Score | Narrative Function | Priority |
|-------|----------|-------------|-----------|-------------------|----------|
| S-003 | 45s | neutral → negative | 9 | inciting_incident | 🔴 Must-have |
| S-008 | 60s | negative → positive | 10 | climax | 🔴 Must-have |
| S-007 | 30s | positive → negative | 8 | crisis | 🔴 Must-have |
| S-005 | 50s | negative → positive | 4 | complication | 🟡 Optional |

## Output

- `scene_analysis.yaml` com:
  - Beat analysis por momento
  - Scene groupings com value charges
  - Controlling idea
  - Dramatic arc mapping
  - Assembly recommendations
  - Scene priority scoring

## Validacao

- [ ] Cada scene tem value charge definido (opening + closing)
- [ ] Turning point identificado em cada scene
- [ ] Gap score atribuido (1-10) em cada beat/scene
- [ ] Controlling idea formulada com value + cause
- [ ] Dramatic arc tem pelo menos: inciting incident, crisis, climax
- [ ] Assembly recommendations incluem razao (reason) para cada sugestao
- [ ] Timestamps exatos preservados (heranca do Tier 0)
- [ ] Scene priorities classificadas (must-have, important, optional)

## Handoff

→ Output alimenta `build-narrative.md` (complementa Ken Burns, Murch, Dicks)
→ Scene priorities informam `format-cut.md` (Tier 2 — quais scenes manter por formato)
