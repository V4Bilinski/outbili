---
task: Encryption Setup
responsavel: "@security-sentinel"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - target_data: Colunas/tabelas para criptografar
  - encryption_type: Tipo (at_rest/in_transit/both)
  - compliance_requirement: Requisito de compliance (LGPD/SOC2/none)
Saida: |
  - encryption_plan: Plano de implementacao
  - sql_scripts: Scripts pgcrypto
  - key_rotation_schedule: Cronograma de rotacao de chaves
Checklist:
  - "[ ] Dados sensiveis classificados"
  - "[ ] Algoritmo selecionado por tipo"
  - "[ ] pgcrypto habilitado"
  - "[ ] Column-level encryption implementado"
  - "[ ] Key management configurado"
  - "[ ] Rotacao de chaves agendada"
  - "[ ] TLS verificado"
---

# Task: fortress-encryption-setup

**Agent:** @security-sentinel
**Trigger:** `*encryption-setup`
**Objetivo:** Configurar criptografia para dados em repouso e em transito

---

## Inputs

```yaml
elicit: true
fields:
  - target_data: "Quais colunas/tabelas criptografar?"
  - encryption_type: "Tipo de criptografia? (at_rest/in_transit/both)"
  - compliance_requirement: "Requisito de compliance? (LGPD/SOC2/none)"
```

---

## Execucao

### FASE 1 — Classificacao de Dados

| Coluna | Tabela | Tipo de Dado | Sensibilidade | Criptografia Necessaria |
|--------|--------|-------------|---------------|------------------------|
| cpf | people | PII | Restricted | AES-256 |
| email | users | PII | Confidential | AES-256 |
| password | auth | Credential | Restricted | argon2/bcrypt |
| phone | contacts | PII | Confidential | AES-256 |

### FASE 2 — Selecao de Algoritmo

| Caso de Uso | Algoritmo | Justificativa |
|-------------|-----------|---------------|
| Dados PII (reversivel) | AES-256-GCM | Padrao industria, performante |
| Senhas | argon2id | Resistente a GPU attacks |
| Tokens/API keys | SHA-256 HMAC | Comparacao sem reversao |
| Comunicacao | TLS 1.3 | Minimo aceitavel |

### FASE 3 — Implementacao

```sql
-- Habilitar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criptografia de coluna (AES-256)
-- Encrypt
UPDATE [TABLE] SET [COLUMN] = pgp_sym_encrypt(
  [COLUMN]::text,
  current_setting('app.encryption_key')
) WHERE [COLUMN] IS NOT NULL;

-- Decrypt (em query)
SELECT pgp_sym_decrypt(
  [COLUMN]::bytea,
  current_setting('app.encryption_key')
) as [COLUMN]_decrypted
FROM [TABLE];

-- Hash de senha (argon2 via Supabase Auth)
-- Supabase Auth ja usa bcrypt por padrao
-- Para campos custom: usar crypt()
UPDATE [TABLE] SET password_hash = crypt(
  [PASSWORD], gen_salt('bf', 12)
);
```

### FASE 4 — Key Management

| Aspecto | Configuracao |
|---------|-------------|
| Storage | Vault / Environment variables (NUNCA no codigo) |
| Rotacao | A cada 90 dias |
| Backup | Chave mestra em local seguro separado |
| Acesso | Apenas service_role e funcoes SECURITY DEFINER |

### FASE 5 — Verificacao TLS

| Conexao | TLS Version | Status |
|---------|-------------|--------|
| Client → Supabase API | TLS 1.3 | PASS/FAIL |
| API → Database | TLS 1.2+ | PASS/FAIL |
| Edge Functions → External | TLS 1.2+ | PASS/FAIL |

---

## Outputs

- Plano de criptografia com algoritmos por tipo de dado
- Scripts SQL com pgcrypto
- Key rotation schedule (90 dias)
- Verificacao TLS completa
