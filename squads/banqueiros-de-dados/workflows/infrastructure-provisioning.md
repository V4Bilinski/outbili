# Workflow: Infrastructure Provisioning

## Visao Geral
Provisioning de infraestrutura: Plan → Provision → Validate → Deploy

## Fases

### Phase 1: Plan (cloud-infra-engineer)
- Definir requisitos de infra (compute, storage, network)
- Selecionar region e tier
- Estimar custos (`get_cost`)
- Documentar decisoes arquiteturais
- **Output:** Infrastructure plan + cost estimate

### Phase 2: Provision (cloud-infra-engineer + devops-pipeline-master)
- Criar projeto Supabase (`create_project`) ou VPS
- Configurar Terraform modules (se aplicavel)
- Setup Docker containers
- Configurar DNS e dominio
- **Output:** Infrastructure provisioned

### Phase 3: Secure (security-sentinel)
- Configurar TLS/SSL
- Setup firewall rules
- Configurar CORS e security headers
- Verificar key management
- **Output:** Security hardened

### Phase 4: Pipeline (devops-pipeline-master)
- Configurar CI/CD pipeline
- Setup deploy workflow
- Configurar rollback procedures
- Testar deploy completo
- **Output:** CI/CD configured

### Phase 5: Monitor (observability-engineer)
- Setup monitoring basico (uptime, latency, errors)
- Configurar alertas iniciais
- Criar dashboard de infra health
- **Output:** Monitoring active

### Phase 6: Validate (fortress-master)
- Health check end-to-end
- Verificar security posture
- Confirmar custo dentro do budget
- **Output:** Infrastructure READY

## Checklist de Validacao
- [ ] Projeto criado e acessivel
- [ ] TLS configurado e verificado
- [ ] CI/CD pipeline testado com deploy bem-sucedido
- [ ] Monitoring ativo com alertas configurados
- [ ] Custos dentro do orcamento aprovado
- [ ] Documentacao de runbook criada
