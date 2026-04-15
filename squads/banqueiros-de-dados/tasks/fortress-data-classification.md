---
task: Data Classification
responsavel: "@compliance-auditor"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - schema: Schema alvo (default: public)
  - classification_framework: Framework de classificacao (4-tier default)
Saida: |
  - classification_matrix: Matriz de classificacao por tabela/coluna
  - protection_requirements: Requisitos de protecao por tier
  - rls_recommendations: Recomendacoes de RLS baseadas na classificacao
Checklist:
  - "[ ] Todas as tabelas/colunas inventariadas"
  - "[ ] Classificacao atribuida por coluna"
  - "[ ] Requisitos de protecao definidos por tier"
  - "[ ] RLS recommendations geradas"
  - "[ ] Dados sensiveis sem protecao identificados"
---

# Task: fortress-data-classification

**Agent:** @compliance-auditor (com @security-sentinel)
**Trigger:** `*data-classification`
**Objetivo:** Classificar todos os ativos de dados por nivel de sensibilidade

---

## Inputs

```yaml
elicit: true
fields:
  - schema: "Qual schema classificar? (default: public)"
  - classification_framework: "Framework? (4-tier: Public/Internal/Confidential/Restricted)"
```

---

## Execucao

### FASE 1 — Inventario Completo

```sql
-- Todas as colunas com tipos
SELECT
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  col_description(
    (t.table_schema || '.' || t.table_name)::regclass, c.ordinal_position
  ) as column_comment
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = '[SCHEMA]' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```

### FASE 2 — Classificacao por Coluna

**Framework 4-Tier:**

| Tier | Nivel | Descricao | Exemplos |
|------|-------|-----------|----------|
| 1 | **Public** | Dados publicaveis | Nome empresa, produto |
| 2 | **Internal** | Uso interno apenas | IDs, timestamps, status |
| 3 | **Confidential** | Acesso restrito | Email, telefone, nome |
| 4 | **Restricted** | Maximo sigilo | CPF, senha hash, dados financeiros |

**Matriz de Classificacao:**

| Tabela | Coluna | Tipo | Classificacao | Justificativa |
|--------|--------|------|---------------|---------------|
| users | id | uuid | Internal | Identificador interno |
| users | email | text | Confidential | PII - contato |
| users | cpf | text | Restricted | PII sensivel - documento |
| clients | company_name | text | Public | Info publica |

### FASE 3 — Requisitos de Protecao

| Tier | RLS | Criptografia | Audit Log | Retencao | Backup |
|------|-----|-------------|-----------|----------|--------|
| Public | Opcional | Nao | Nao | Indefinida | Standard |
| Internal | Recomendado | Nao | Nao | 5 anos | Standard |
| Confidential | **Obrigatorio** | Recomendado | Sim | 3 anos | Encrypted |
| Restricted | **Obrigatorio** | **Obrigatorio** | **Obrigatorio** | LGPD | Encrypted + Geo-redundant |

### FASE 4 — Gap Analysis

```sql
-- Colunas Restricted/Confidential SEM RLS
-- Cruzar classificacao com pg_policies
```

| Coluna | Classificacao | RLS? | Criptografia? | Audit? | Gaps |
|--------|--------------|------|--------------|--------|------|
| [col] | Restricted | Nao | Nao | Nao | RLS + Crypto + Audit |

### FASE 5 — Recomendacoes de RLS

Baseado na classificacao, gerar policies recomendadas:

| Tabela | Policy Recomendada | Tipo | Prioridade |
|--------|-------------------|------|------------|
| [tbl] | select_own_[tbl] | USING (auth.uid() = user_id) | P0 |

---

## Outputs

- Matriz de classificacao completa (tabela/coluna/tier)
- Requisitos de protecao por tier
- Gaps identificados (dados sensiveis sem protecao adequada)
- Recomendacoes de RLS priorizadas
