# Compliance Rules — WhatsApp Business API Squad

## Scope
These rules apply to ALL agents in the squad when handling messages, templates, campaigns, or integrations.

## LGPD Compliance (Non-Negotiable)

| Rule | LGPD Article | Enforcement |
|------|-------------|-------------|
| Legal basis required for ALL data processing | Art. 7 | BLOCK if no basis documented |
| Consent must be free, informed, unambiguous | Art. 8 | BLOCK if consent unclear |
| Purpose limitation — data used ONLY for stated purpose | Art. 9 | WARN on scope creep |
| Data deletion upon request or purpose completion | Art. 15-16 | BLOCK if no deletion flow |
| Data subject rights must be accessible | Art. 18 | WARN if not documented |
| Security measures mandatory for personal data | Art. 46 | BLOCK if no encryption |

## Opt-In/Opt-Out Rules

### Opt-In Requirements
- Opt-in MUST specify: business name, message types, expected frequency
- Double opt-in RECOMMENDED for marketing messages
- Opt-in records MUST be stored with: timestamp, source, IP (if web), message type consented
- Opt-in MUST be collected BEFORE first template message
- Pre-checked boxes do NOT count as valid opt-in

### Opt-Out Requirements
- Opt-out via "SAIR", "STOP", "PARAR" MUST be supported
- Opt-out MUST be processed within 24 hours
- Marketing templates MUST include opt-out mechanism
- Re-engagement after opt-out requires FRESH opt-in
- Opt-out from one message type does NOT cancel other types (granular consent)

### Consent Freshness
- Opt-in expires after 6 months of inactivity
- Re-engagement requires fresh opt-in after expiry
- Consent records MUST be auditable

## Prohibited Content (Instant Block)

### Categories
- Illegal goods/services
- Drugs, tobacco, vaping products
- Weapons, ammunition, explosives
- Adult content, pornography
- Gambling, betting, lottery
- Political/electoral messaging — ABSOLUTELY PROHIBITED
- Phishing, scam, fraud schemes
- Counterfeit goods
- Multi-level marketing (MLM) schemes
- Discriminatory content (race, gender, religion, orientation)
- Government use without Solution Provider partnership

### Template Content Rules
- No ALL CAPS in template body
- No excessive exclamation marks (max 1 per template)
- No misleading content or impersonation
- No urgency/scarcity language in utility templates
- No promotional language in authentication templates
- Sample values MUST be realistic, never "test" or "xxx"

## 24-Hour Service Window

- Within window (user-initiated): send ANY message type
- Outside window: ONLY template messages allowed
- Window resets on each new user message
- Service conversations within window: FREE (1000/month quota)

## Privacy Policy

- MUST be publicly accessible
- MUST be linked in business profile
- MUST cover: data collected via WhatsApp, processing purposes, retention periods, rights
- MUST comply with LGPD requirements
- MUST be updated when messaging purposes change
