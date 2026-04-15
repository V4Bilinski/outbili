# Workflow: Security Hardening Cycle

## Visao Geral
Ciclo de fortalecimento de seguranca: Assess → Remediate → Validate → Certify

## Fases

### Phase 1: Assess (security-sentinel)
- Executar threat model (STRIDE) no sistema
- Scan de vulnerabilidades com Security Auditor
- Auditoria de RLS policies
- Review de key management (anon vs service_role)
- **Output:** Threat model + vulnerability report

### Phase 2: Classify (compliance-auditor)
- Classificar dados por sensibilidade (publico → restrito)
- Mapear base legal LGPD por tabela
- Verificar audit trail coverage
- **Output:** Data classification matrix + LGPD gaps

### Phase 3: Remediate (security-sentinel + db-architect)
- Fix vulnerabilidades CRITICAL/HIGH
- Implementar RLS policies faltantes
- Configurar encryption adicional se necessario
- Atualizar access control matrix
- **Output:** Remediation applied

### Phase 4: Validate (security-sentinel)
- Re-scan com Pentest Automator
- Verificar que vulnerabilidades foram corrigidas
- Testar RLS com SET ROLE
- **Output:** Validation report (PASS/FAIL)

### Phase 5: Certify (fortress-master + compliance-auditor)
- Documentar postura de seguranca final
- Atualizar ROPA se necessario
- Sign-off do compliance auditor
- **Output:** Security certification document

## Frequencia Recomendada
- **Full cycle:** Trimestral
- **RLS review:** A cada schema change
- **Vulnerability scan:** Mensal
- **Threat model update:** A cada nova feature com dados sensiveis
