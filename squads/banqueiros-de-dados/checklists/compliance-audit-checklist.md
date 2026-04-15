# Compliance Audit Checklist

## Executar: Trimestral (LGPD) | Agente: compliance-auditor

### LGPD — Bases Legais
- [ ] Cada tabela com dados pessoais tem base legal documentada
- [ ] Consentimento com opt-in explicito onde aplicavel
- [ ] Finalidade de cada tratamento documentada
- [ ] Principio da minimizacao respeitado (coleta apenas necessario)
- [ ] Compartilhamento com terceiros documentado e consentido

### LGPD — Direitos do Titular
- [ ] Endpoint/processo para acesso aos dados pessoais
- [ ] Processo de retificacao de dados implementado
- [ ] Processo de eliminacao com audit trail
- [ ] Exportacao em formato interoperavel (portabilidade)
- [ ] Processo de anonimizacao documentado

### Data Classification
- [ ] Todas tabelas classificadas (publico/interno/confidencial/restrito)
- [ ] Colunas com dados sensiveis identificadas
- [ ] Tratamento adequado por nivel de classificacao
- [ ] Data masking em ambientes nao-production

### Audit Trail
- [ ] Audit logs cobrindo todas operacoes CRUD em dados sensiveis
- [ ] Logs imutaveis (INSERT only, sem UPDATE/DELETE)
- [ ] Retencao minima de 5 anos
- [ ] Campos obrigatorios: timestamp, actor, action, resource, old/new values
- [ ] Acesso restrito a compliance e DPO

### Documentacao
- [ ] ROPA (Registro de Atividades de Tratamento) atualizado
- [ ] Politica de Privacidade publicada e acessivel
- [ ] Politica de Seguranca da Informacao documentada
- [ ] Plano de Resposta a Incidentes documentado
- [ ] DPO designado e acessivel

### Cost & Resource
- [ ] Custos Supabase dentro do budget aprovado
- [ ] Storage nao excede limites do plano
- [ ] Dados obsoletos arquivados ou eliminados
- [ ] Retencao alinhada com politica (nao armazenar alem do necessario)
