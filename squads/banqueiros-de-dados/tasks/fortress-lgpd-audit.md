---
task: LGPD Audit
responsavel: "@compliance-auditor"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - include_third_party: Incluir processadores terceiros (bool)
  - dpo_contact: Contato do DPO
  - last_audit_date: Data da ultima auditoria
Saida: |
  - lgpd_report: Relatorio de compliance LGPD
  - ropa_document: Records of Processing Activities
  - gap_timeline: Gaps com cronograma de remediacao
Checklist:
  - "[ ] Inventario de dados pessoais completo"
  - "[ ] Base legal mapeada por tratamento"
  - "[ ] Direitos do titular implementados"
  - "[ ] Consentimento gerenciado"
  - "[ ] ROPA atualizado"
  - "[ ] DPO designado e acessivel"
  - "[ ] Gaps documentados com timeline"
---

# Task: fortress-lgpd-audit

**Agent:** @compliance-auditor
**Trigger:** `*lgpd-audit`
**Objetivo:** Auditar compliance LGPD em armazenamento e processamento de dados

---

## Inputs

```yaml
elicit: true
fields:
  - include_third_party: "Incluir processadores terceiros? (sim/nao)"
  - dpo_contact: "Contato do DPO (Data Protection Officer)?"
  - last_audit_date: "Data da ultima auditoria LGPD?"
```

---

## Execucao

### FASE 1 — Mapeamento de Dados Pessoais

```sql
-- Identificar colunas com dados pessoais (heuristica)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%email%' OR column_name ILIKE '%phone%'
    OR column_name ILIKE '%cpf%' OR column_name ILIKE '%name%'
    OR column_name ILIKE '%address%' OR column_name ILIKE '%birth%'
    OR column_name ILIKE '%document%' OR column_name ILIKE '%rg%'
  )
ORDER BY table_name;
```

| Tabela | Coluna | Tipo Dado Pessoal | Categoria LGPD | Criptografado? |
|--------|--------|-------------------|----------------|---------------|
| [tbl] | email | Contato | Dado pessoal | Sim/Nao |
| [tbl] | cpf | Identificacao | Dado sensivel | Sim/Nao |

### FASE 2 — Base Legal por Tratamento

| Tratamento | Base Legal (Art. 7) | Finalidade | Proporcional? |
|-----------|-------------------|-----------|---------------|
| Cadastro de usuario | Consentimento (I) | Criacao de conta | Sim |
| Contato comercial | Legitimo interesse (IX) | Comunicacao | Verificar |
| Dados financeiros | Execucao contrato (V) | Faturamento | Sim |

### FASE 3 — Direitos do Titular (Art. 18)

| Direito | Implementado? | Como | Status |
|---------|-------------|------|--------|
| Acesso (I) | Sim/Nao | [endpoint/processo] | PASS/FAIL |
| Correcao (III) | Sim/Nao | [endpoint/processo] | PASS/FAIL |
| Eliminacao (VI) | Sim/Nao | [endpoint/processo] | PASS/FAIL |
| Portabilidade (V) | Sim/Nao | [endpoint/processo] | PASS/FAIL |
| Revogacao consentimento (IX) | Sim/Nao | [endpoint/processo] | PASS/FAIL |

### FASE 4 — ROPA (Records of Processing Activities)

| Atividade | Controlador | Finalidade | Base Legal | Dados | Retencao | Compartilhamento |
|-----------|-------------|-----------|-----------|-------|----------|-------------------|
| [ativ] | Brabissimo | [fin] | [base] | [tipos] | [periodo] | [terceiros] |

### FASE 5 — Gap Analysis

| # | Gap | Artigo LGPD | Severidade | Remediacao | Prazo |
|---|-----|------------|-----------|------------|-------|
| 1 | [desc] | Art. [X] | CRITICAL | [fix] | [data] |

---

## Outputs

- Relatorio LGPD completo com score de compliance
- ROPA (Records of Processing Activities) atualizado
- Gaps com cronograma de remediacao
