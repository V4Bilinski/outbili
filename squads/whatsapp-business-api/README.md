# WhatsApp Business API Squad v2.0

Sistema completo de inteligencia para integracao, gestao de templates, campanhas, compliance e otimizacao da WhatsApp Business Cloud API. Orquestra 8 agentes especialistas em 3 tiers atraves de workflows com quality gates e 15 veto conditions automaticos.

## Ativacao

```
@whatsapp-chief
```

## Time de Agentes

### Tier 0 — Orchestrator
| Agente | Persona | Papel |
|--------|---------|-------|
| @whatsapp-chief | Zap | Director & Orchestrator — roteia missoes, seleciona especialistas, enforce quality gates |

### Tier 1 — Core Specialists
| Agente | Persona | Papel |
|--------|---------|-------|
| @cloud-api-architect | Atlas | Arquiteto Tecnico — endpoints, schemas, error handling, rate limits, media |
| @template-strategist | Nova | Estrategista de Templates — criacao, otimizacao, categorias, aprovacao |
| @compliance-guardian | Shield | Guardiao de Compliance — LGPD, politicas Meta, opt-in/opt-out, conteudo proibido |

### Tier 2 — Extended Specialists
| Agente | Persona | Papel |
|--------|---------|-------|
| @campaign-optimizer | Pulse | Otimizador de Campanhas — planejamento, segmentacao, A/B testing, quality score |
| @integration-engineer | Link | Engenheiro de Integracao — webhooks, deduplication, throttle, credentials, SDK |
| @flow-builder | Flux | Construtor de Flows — JSON schema, endpoint crypto, handlers, patterns |
| @utility-validator | Forge | Validador de Utility — PACTO framework, variable camouflage, reclassification |

## Comandos Disponiveis

### Diagnostico
- `*diagnose` — Diagnostico completo de saude da conta (quality, tier, erros, compliance)
- `*troubleshoot` — Diagnosticar codigos de erro, problemas de entrega, falhas de webhook

### Templates
- `*create-template` — Criar template WhatsApp com pre-check de compliance
- `*audit-template` — Auditar templates existentes (qualidade, compliance, performance)
- `*validate-utility` — Validar/converter template para utility usando PACTO framework

### Campanhas
- `*plan-campaign` — Planejar campanha WhatsApp com segmentacao e A/B testing
- `*optimize-quality` — Otimizar quality score e progressao de tier

### Integracao
- `*setup-integration` — Guiar setup de webhook, credenciais, SDK
- `*migrate-bsp` — Planejar e executar migracao de BSP para API direta

### WhatsApp Flows
- `*design-flow` — Projetar WhatsApp Flow (formulario multi-step, agendamento, qualificacao)

### Compliance
- `*compliance-check` — Validacao completa de compliance (LGPD + politicas WhatsApp)

### Informacao
- `*battlecard` — Gerar battlecard competitivo (API Direta vs BSPs)
- `*team` — Mostrar time completo de especialistas

## Workflows

### 1. Template Lifecycle (`workflows/template-lifecycle.yaml`)
Ciclo completo de vida do template: selecao de categoria, design de conteudo, revisao de compliance, submissao via API, monitoramento de aprovacao e deploy em producao.

```
@template-strategist → @compliance-guardian → @cloud-api-architect → @whatsapp-chief → @integration-engineer
```

### 2. Campaign Execution (`workflows/campaign-execution.yaml`)
Fluxo completo de campanha: definicao de objetivo, segmentacao de audiencia, criacao de templates, validacao de compliance, agendamento, execucao, monitoramento e analise.

```
@campaign-optimizer → [template-lifecycle] → @compliance-guardian → @campaign-optimizer → @integration-engineer → @whatsapp-chief
```

### 3. Integration Setup (`workflows/integration-setup.yaml`)
Setup completo do zero a producao: configuracao de conta, credenciais, webhooks, templates, mensagens de teste, compliance e go-live.

```
@whatsapp-chief → @integration-engineer → @template-strategist → @cloud-api-architect → @compliance-guardian → @whatsapp-chief
```

## Profiles

| Profile | Agentes | Quando usar |
|---------|---------|-------------|
| `full` | Todos (8) | Operacoes gerais, diagnosticos completos |
| `template-ops` | chief + template + compliance + utility | Criacao e validacao de templates |
| `integration` | chief + architect + engineer | Setup de API, webhooks, SDK |
| `campaign` | chief + campaign + template + compliance | Planejamento e execucao de campanhas |
| `compliance-only` | chief + compliance | Auditorias de compliance e LGPD |

## Quality Standards

| Dimensao | Metrica | Threshold |
|----------|---------|-----------|
| Delivery Rate | >= 95% | Minimo aceitavel |
| Read Rate | >= 60% | Bom engajamento |
| Block Rate | < 2% | Seguro |
| Quality Score | GREEN | Obrigatorio para escalar |
| Template Approval | >= 90% | Taxa de aprovacao |
| PACTO Score (utility) | >= 70 | Minimo para submeter como utility |
| Webhook Response | < 200ms | Responder e processar async |

## Arquitetura

```
squads/whatsapp-business-api/
  squad.yaml                   # Manifesto v2.0 (tiers, profiles, commands, quality_standards)
  tool-overrides.yaml          # Tool profiles per agent + task bindings
  README.md                    # Este arquivo
  agents/                      # 8 agentes .md (formato L0-L1-L2)
    whatsapp-chief.md            Zap — Orchestrator (T0)
    cloud-api-architect.md       Atlas — API Tecnica (T1)
    template-strategist.md       Nova — Templates (T1)
    compliance-guardian.md       Shield — Compliance (T1)
    campaign-optimizer.md        Pulse — Campanhas (T2)
    integration-engineer.md      Link — Integracao (T2)
    flow-builder.md              Flux — Flows (T2)
    utility-validator.md         Forge — Utility (T2)
  tasks/                       # 11 tasks executaveis
    diagnose-account.md          Diagnostico de conta
    create-template.md           Criacao de template
    audit-template.md            Auditoria de template
    design-flow.md               Design de Flow
    setup-webhook.md             Setup de webhook
    plan-campaign.md             Planejamento de campanha
    optimize-quality.md          Otimizacao de quality
    troubleshoot-error.md        Troubleshooting de erros
    migrate-bsp.md               Migracao de BSP
    compliance-check.md          Check de compliance
    validate-utility.md          Validacao de utility
  workflows/                   # 3 workflows orquestrados
    template-lifecycle.yaml      Template: criacao → deploy
    campaign-execution.yaml      Campanha: planejamento → analise
    integration-setup.yaml       Integracao: zero → producao
  rules/                       # 4 regras contextuais (NOVO v2.0)
    compliance-rules.md          LGPD + WhatsApp policies + consent
    template-approval-rules.md   Categorias, limites, PACTO, quality gate
    throttle-rules.md            Rate limits, AIMD, retry, circuit breaker
    message-routing-rules.md     Routing matrix + escalation + veto rules
  config/                      # 3 configs estruturadas (NOVO v2.0)
    quality-thresholds.yaml      Thresholds de qualidade por dimensao
    rate-limit-tiers.yaml        Tier system com progressao
    pricing-reference.yaml       Pricing por categoria (Brasil)
  checklists/                  # 3 checklists de qualidade
    template-approval-checklist.md   Pre-submissao de template
    compliance-checklist.md          Validacao de compliance
    go-live-checklist.md             Prontidao para producao
  templates/                   # 3 templates de documentos
    template-spec-tmpl.md        Especificacao de template
    campaign-plan-tmpl.md        Plano de campanha
    integration-audit-tmpl.md    Auditoria de integracao
  data/                        # 10 arquivos de conhecimento (EXPANDIDO v2.0)
    whatsapp-api-kb.md           Referencia rapida API
    arsenal-reference.md         Mapa de ponteiros para arsenal/
    utility-templates-kb.md      Frameworks de utility
    meta-utility-portfolio.md    165 templates oficiais Meta
    veto-conditions.yaml         15 condicoes de veto (NOVO)
    error-decision-tree.yaml     Arvore de decisao para erros (NOVO)
    agent-routing-matrix.yaml    Matriz de routing entre agentes (NOVO)
    quality-score-formulas.yaml  Formulas de scoring (NOVO)
    template-category-decision.yaml  Decision tree de categoria (NOVO)
    tier-progression-rules.yaml  Regras de progressao de tier (NOVO)
```

## Veto Conditions (15 gates automaticos)

| ID | Condicao | Severidade | Bloqueia |
|----|----------|-----------|----------|
| VETO-001 | No Opt-In | CRITICAL | Envio de mensagens |
| VETO-002 | Opted Out | CRITICAL | Envio de mensagens |
| VETO-003 | Prohibited Content | CRITICAL | Submissao de template |
| VETO-004 | No LGPD Basis | CRITICAL | Campanhas e integracoes |
| VETO-005 | Quality RED | CRITICAL | Marketing templates |
| VETO-006 | Quality YELLOW + Scale | HIGH | Escalar volume |
| VETO-007 | Tier Limit Exceeded | CRITICAL | Envio de mensagens |
| VETO-008 | No Compliance Review | HIGH | Submissao de template |
| VETO-009 | PACTO Score < 50 | HIGH | Submeter como utility |
| VETO-010 | Component Limit Exceeded | CRITICAL | Submissao de template |
| VETO-011 | No Signature Verification | CRITICAL | Deploy de webhook |
| VETO-012 | Credentials in Env Vars | HIGH | Go-live |
| VETO-013 | No Deduplication | HIGH | Go-live |
| VETO-014 | Wrong API Version | MEDIUM | Warning em operacoes |
| VETO-015 | Invalid Phone Format | HIGH | Envio de mensagens |

## Quick Start

```
1. @whatsapp-chief          # Ativar o squad
2. *diagnose                 # Diagnosticar estado atual da conta
3. *setup-integration        # Setup completo (se nova integracao)
   ou
3. *create-template          # Criar primeiro template
4. *compliance-check         # Validar compliance
5. *plan-campaign            # Planejar primeira campanha
```

## Changelog

### v2.0.0 (2026-04-09)
- Agents convertidos de .yaml para .md com formato L0-L1-L2
- squad.yaml reestruturado com tiers, profiles, commands, quality_standards, activation
- Novo: rules/ (4 regras contextuais)
- Novo: config/ (3 configuracoes estruturadas)
- Novo: data/ expandido com 6 YAMLs estruturados (veto, errors, routing, scores, categories, tiers)
- Novo: tool-overrides.yaml com profiles por agente e task bindings
- Novo: 15 veto conditions formais documentadas
- Novo: command_loader com dependencias explicitas em cada agente

### v1.0.0 (2026-04-08)
- Release inicial com 7 agentes YAML, 11 tasks, 3 workflows
