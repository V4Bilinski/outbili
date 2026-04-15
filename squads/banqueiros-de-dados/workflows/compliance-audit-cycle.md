# Workflow: Compliance Audit Cycle

## Visao Geral
Ciclo de auditoria de compliance: Scope → Assess → Remediate → Certify

## Fases

### Phase 1: Scope (compliance-auditor)
- Definir escopo da auditoria (LGPD, SOC2, geral)
- Listar tabelas com dados pessoais
- Identificar processos de tratamento
- **Output:** Audit scope document

### Phase 2: Data Classification (compliance-auditor + db-architect)
- Classificar cada tabela/coluna por sensibilidade
- Mapear base legal LGPD por dado
- Verificar consentimento e finalidade
- **Output:** Data classification matrix

### Phase 3: Technical Assessment (security-sentinel)
- Auditoria de RLS policies
- Verificacao de encryption (rest + transit)
- Review de access control (quem acessa o que)
- Auditoria de audit trails (cobertura e integridade)
- **Output:** Technical assessment report

### Phase 4: Cost & Resource Review (compliance-auditor)
- Analise de custos (`get_cost`)
- Verificar retencao de dados vs custo de storage
- Identificar oportunidades de otimizacao
- **Output:** Cost analysis report

### Phase 5: Gap Analysis (fortress-master)
- Comparar estado atual vs requisitos de compliance
- Listar gaps por severidade
- Priorizar remediacoes
- **Output:** Gap analysis with prioritized action items

### Phase 6: Remediation (agentes responsaveis)
- db-architect: fix schema issues, add audit columns
- security-sentinel: fix RLS, add encryption
- devops-pipeline-master: fix CI/CD security
- **Output:** Remediation complete

### Phase 7: Certification (fortress-master + compliance-auditor)
- Re-assessment pos-remediation
- Documentar compliance posture
- Sign-off formal
- **Output:** Compliance certification

## Frequencia
- **LGPD full audit:** Anual
- **Data classification review:** Semestral
- **Technical security assessment:** Trimestral
- **Cost review:** Mensal
