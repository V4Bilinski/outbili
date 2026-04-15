# Message Routing Rules — WhatsApp Business API Squad

## Scope
Rules for the @whatsapp-chief orchestrator when routing requests to specialist agents.

## Primary Routing Matrix

| User Request Pattern | Route To | Fallback |
|---------------------|----------|----------|
| API endpoint, schema, request/response | @cloud-api-architect | @whatsapp-chief |
| Error code, delivery failure, HTTP error | @cloud-api-architect | @integration-engineer |
| Rate limit, tier, throughput | @cloud-api-architect | @integration-engineer |
| Media upload/download, formats | @cloud-api-architect | @integration-engineer |
| Create template, template copy | @template-strategist | @utility-validator |
| Template rejection, approval strategy | @template-strategist | @compliance-guardian |
| Template category selection | @template-strategist | @utility-validator |
| Utility template, PACTO, reclassification | @utility-validator | @template-strategist |
| Variable camouflage, utility conversion | @utility-validator | @template-strategist |
| LGPD, privacy, data protection | @compliance-guardian | @whatsapp-chief |
| Opt-in, opt-out, consent | @compliance-guardian | @whatsapp-chief |
| Prohibited content, policy violation | @compliance-guardian | @whatsapp-chief |
| Campaign planning, segmentation | @campaign-optimizer | @template-strategist |
| A/B testing, campaign analytics | @campaign-optimizer | @whatsapp-chief |
| Quality score, account health | @campaign-optimizer | @cloud-api-architect |
| Webhook setup, signature verification | @integration-engineer | @cloud-api-architect |
| Deduplication, throttle, retry | @integration-engineer | @cloud-api-architect |
| Credentials, SDK, deployment | @integration-engineer | @whatsapp-chief |
| WhatsApp Flows, JSON schema | @flow-builder | @cloud-api-architect |
| Flow encryption, endpoint crypto | @flow-builder | @integration-engineer |
| Flow patterns (booking, survey) | @flow-builder | @whatsapp-chief |
| BSP migration, platform comparison | @whatsapp-chief | @integration-engineer |
| General diagnosis, account overview | @whatsapp-chief | N/A |

## Multi-Agent Routing

Some requests require coordination between multiple agents:

| Scenario | Primary | Secondary | Sequence |
|----------|---------|-----------|----------|
| Create marketing template | @template-strategist | @compliance-guardian | Create → Compliance review → Submit |
| Create utility template | @utility-validator | @compliance-guardian | PACTO check → Compliance → Submit |
| Launch campaign | @campaign-optimizer | @template-strategist, @compliance-guardian | Plan → Templates → Compliance → Execute |
| Full integration setup | @integration-engineer | @cloud-api-architect, @compliance-guardian | Setup → API config → Compliance → Go-live |
| Design flow with templates | @flow-builder | @template-strategist | Flow design → Template for trigger → Deploy |

## Escalation Rules

| Condition | Action |
|-----------|--------|
| Agent cannot resolve within its domain | Escalate to @whatsapp-chief |
| Compliance concern during any operation | Mandatory route to @compliance-guardian |
| Quality score drops to RED during operation | HALT operation, route to @campaign-optimizer |
| API error not in known error codes | Escalate to @cloud-api-architect |
| Cross-agent conflict on recommendation | @whatsapp-chief arbitrates |

## Veto Rules (Override Any Routing)

These conditions BLOCK any operation regardless of routing:
1. No verified opt-in → BLOCK sending
2. Quality score RED → BLOCK marketing templates
3. Prohibited content detected → BLOCK template submission
4. Template not compliance-reviewed → BLOCK API submission
5. Webhook without signature verification → BLOCK deployment
6. Credentials in env vars (not Supabase) → BLOCK integration
