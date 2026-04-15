# Template Approval Rules — WhatsApp Business API Squad

## Scope
Rules enforced by @template-strategist, @utility-validator, and @compliance-guardian during template creation and review.

## Category Selection Rules

| Use Case | Correct Category | Wrong Category | Impact |
|----------|-----------------|----------------|--------|
| Order confirmation | UTILITY | Marketing | Reclassification + higher cost |
| Promotional offer | MARKETING | Utility | Rejection + account flag |
| OTP verification | AUTHENTICATION | Utility/Marketing | Policy violation |
| Appointment reminder | UTILITY | Marketing | Unnecessary cost |
| Product launch | MARKETING | Utility | Reclassification risk |
| Shipping update | UTILITY | Marketing | Unnecessary cost |
| Re-engagement | MARKETING | Utility | Account penalty |

## Component Limits (ALWAYS Validate)

| Component | Limit | Variables | Notes |
|-----------|-------|-----------|-------|
| Header text | 60 chars | 1 max | Optional |
| Header media | image/video/document/location | N/A | One type only |
| Body | 1024 chars | Multiple | Required |
| Footer | 60 chars | 0 | Optional, no variables |
| Quick Reply buttons | Max 10, 25 chars each | N/A | |
| URL buttons | Max 2, 25 chars label | Dynamic suffix | |
| Phone buttons | Max 1, 25 chars label | N/A | |
| Copy code buttons | Max 1, 25 chars label | N/A | |
| Flow buttons | Max 1, 25 chars label | N/A | |
| Template name | 512 chars | N/A | lowercase + underscores only |

## Variable Rules

- Variables use positional format: {{1}}, {{2}}, {{3}} — NEVER named
- Each variable MUST have a sample value for approval
- Sample values MUST be realistic (e.g., "Maria", "R$ 150,00", "15/03/2026")
- NEVER use "test", "xxx", "placeholder" as sample values
- Variables in header: max 1
- Variables in footer: NOT allowed
- Variables don't accept line breaks

## Approval Optimization

### DO (increases approval probability)
- Start utility templates with status words (Confirmada, Aprovada, Processada)
- Include clear business context in body
- Use service-oriented CTAs (Acompanhar, Confirmar, Receber)
- Provide realistic, complete sample values
- Keep copy concise and informative

### DON'T (increases rejection probability)
- Use promotional language in utility templates
- Use ALL CAPS anywhere in template
- Use excessive punctuation (!!!, ???)
- Use more than 2 emojis per template
- Mix transactional + promotional content in same template
- Use urgency words in utility (Última chance, Não perca, Aproveite)
- Submit without compliance review

## PACTO Framework (Utility Templates)

| Letter | Rule | Example |
|--------|------|---------|
| P — Palavra de Status | Start with status word | "Confirmada", "Aprovada", "Liberada" |
| A — Apresentação | Brief contextual intro | "Olá {{1}}, sua compra na {{2}} foi..." |
| C — Clareza | Neutral, informative tone | Facts only, no superlatives |
| T — Tomada de Ação | Service-oriented CTA | "Acompanhar entrega", "Confirmar agendamento" |
| O — Omissão | Zero promotional language | No discounts, offers, urgency |

## Reclassification Prevention

- Since April 2025: Meta auto-reclassifies utility→marketing without notice
- Since July 2025: Stricter utility definitions based on user engagement
- Accounts with reclassification history face harder approval for new utilities
- Block rate >4% on any template = account quality risk
- Reclassified templates bill at marketing rate (3x+ more expensive)

## Quality Gate

Every template MUST pass this checklist before submission:
1. [ ] Category correctly selected for use case
2. [ ] All component limits respected
3. [ ] Variables use positional format with realistic samples
4. [ ] No prohibited words or promotional language (if utility)
5. [ ] Compliance review by @compliance-guardian completed
6. [ ] PACTO score >= 70 (utility templates)
7. [ ] Opt-out mechanism included (marketing templates)
