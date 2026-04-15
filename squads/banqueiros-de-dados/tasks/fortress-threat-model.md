---
task: Threat Model
responsavel: "@security-sentinel"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - target_component: Componente alvo da modelagem
  - data_sensitivity: Nivel de sensibilidade (public/internal/confidential/restricted)
  - include_third_party: Incluir integrações terceiras (bool)
Saida: |
  - threat_model_doc: Documento STRIDE completo
  - dread_matrix: Matriz de scoring DREAD
  - mitigation_roadmap: Plano de mitigacao priorizado
Checklist:
  - "[ ] Escopo e componentes definidos"
  - "[ ] Data flows mapeados"
  - "[ ] STRIDE aplicado por componente"
  - "[ ] DREAD scoring calculado"
  - "[ ] Mitigacoes propostas"
  - "[ ] Prioridade definida por risco"
---

# Task: fortress-threat-model

**Agent:** @security-sentinel
**Trigger:** `*threat-model`
**Objetivo:** Executar modelagem de ameacas STRIDE/DREAD para componentes do sistema

---

## Inputs

```yaml
elicit: true
fields:
  - target_component: "Qual componente modelar? (ex: auth flow, API, database)"
  - data_sensitivity: "Nivel de sensibilidade dos dados? (public/internal/confidential/restricted)"
  - include_third_party: "Incluir integracoes terceiras? (sim/nao)"
```

---

## Execucao

### FASE 1 — Definicao de Escopo

| Componente | Tipo | Data Flows | Sensibilidade |
|-----------|------|------------|---------------|
| [comp] | Frontend/Backend/DB/API | [entrada → saida] | [nivel] |

**Trust Boundaries:**
- Browser → API (untrusted → authenticated)
- API → Database (authenticated → privileged)
- API → Third Party (internal → external)

### FASE 2 — Analise STRIDE

| Categoria | Descricao | Aplicavel? | Ameaca Especifica |
|-----------|-----------|------------|-------------------|
| **S**poofing | Falsificacao de identidade | [S/N] | [detalhe] |
| **T**ampering | Adulteracao de dados | [S/N] | [detalhe] |
| **R**epudiation | Negacao de acao | [S/N] | [detalhe] |
| **I**nformation Disclosure | Vazamento de dados | [S/N] | [detalhe] |
| **D**enial of Service | Negacao de servico | [S/N] | [detalhe] |
| **E**levation of Privilege | Escalacao de privilegio | [S/N] | [detalhe] |

### FASE 3 — DREAD Scoring

Para cada ameaca identificada:

| Ameaca | Damage (1-10) | Reproducibility | Exploitability | Affected Users | Discoverability | **Total** |
|--------|--------------|-----------------|----------------|----------------|-----------------|-----------|
| [threat1] | [X] | [X] | [X] | [X] | [X] | **[avg]** |

**Classificacao:** Critical (>8) / High (6-8) / Medium (4-6) / Low (<4)

### FASE 4 — Plano de Mitigacao

| # | Ameaca | DREAD | Mitigacao | Responsavel | Esforco | Status |
|---|--------|-------|-----------|-------------|---------|--------|
| 1 | [critical] | 9.2 | [acao] | @security-sentinel | [S/M/L] | Pendente |
| 2 | [high] | 7.5 | [acao] | @db-architect | [S/M/L] | Pendente |

---

## Outputs

- Documento de threat model STRIDE completo
- Matriz DREAD com scoring por ameaca
- Roadmap de mitigacao priorizado (Critical → Low)
