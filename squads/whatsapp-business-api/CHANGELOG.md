# Changelog — WhatsApp Business API Squad

All notable changes to this squad are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [2.4.0] - 2026-04-09

### Added — Permissions, Access Tokens & Setup Guide
- `data/permissions-and-setup.yaml` — Complete reference for WhatsApp API permissions, access tokens, and production setup

### Key Intelligence Extracted
- **4 permissions mapped**: whatsapp_business_messaging (messaging), whatsapp_business_management (templates/webhooks), business_management (avoid unless justified), whatsapp_business_manage_events (rare)
- **3 token types**: temporary (24h, testing only), system user (long-lived, production), user access (60 days, solution providers)
- **7-step setup flow**: create app → credentials → test message → webhooks → system user → register phone → go-live
- **App Review rules**: only request 2 permissions, include real screenshots, ensure webhook is live, complete business verification
- **Common rejection reasons**: over-requesting permissions, vague use cases, unverified business, non-functional webhook
- **Direct Developer vs Solution Provider**: different access levels, app review requirements, and token grant flows
- **Webhook events**: 12 inbound message types, 4 status values, pricing model (CBP/PMP), group + call events
- **Token debugging**: /debug_token endpoint to verify scopes before deployment
- **Go-live checklist**: 15 items covering security, compliance, infrastructure, and business verification

### Sources
- developers.facebook.com/docs/permissions
- developers.facebook.com/documentation/business-messaging/whatsapp/get-started
- developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens
- developers.facebook.com/documentation/business-messaging/whatsapp/permissions

### Changed
- `squad.yaml` → v2.4.0, registered permissions-and-setup.yaml

## [2.3.0] - 2026-04-09

### Added — Jasper's Market Official Meta Patterns
- `data/jaspers-market-patterns.yaml` — 10 production patterns from Meta's official sample app

### Key Patterns Extracted
- **Typing Indicator** — `typing_indicator: { type: "text" }` sent with read receipt BEFORE every response (undocumented field)
- **Limited-Time Offer** — New template component type with countdown timer + `coupon_code` parameter type
- **Carousel Send Payload** — `card_index` indexing for dynamic content per card
- **Redis Follow-Up** — Cache sent message ID with 15s TTL, send follow-up on delivery webhook
- **2-Step Media Upload** — Upload session → binary upload → `header_handle` (different from `/media` API `id`)
- **HMAC SHA-256 Signature** — Official Meta implementation using `body-parser verify` callback
- **Status Filtering** — Only act on `delivered` and `read`, ignore `sent`
- **SDK Usage** — `facebook-nodejs-business-sdk` v23.0.1 with `api.call()` pattern
- **Interactive Button Routing** — Button IDs as state machine routing keys
- **Template Creation via API** — Complete shell script for 3 template types (utility, carousel, LTO)

### Changed
- `squad.yaml` → v2.3.0, registered jaspers-market-patterns.yaml

## [2.2.0] - 2026-04-09

### Added — OpenAPI v23.0 Intelligence Extraction
- `data/openapi-endpoints-v23.yaml` — Complete 71-endpoint reference from Meta's official OpenAPI spec
- `data/openapi-schemas-v23.yaml` — 100+ schema/component definitions with all enums
- `data/new-features-v23.yaml` — 18 new/enhanced features discovered in the spec

### New Features Discovered
- **Calls API** — Voice calling via WebRTC SDP (connect, accept, reject, terminate)
- **Groups API** — Business-initiated groups (create, manage, invite links, participants)
- **Multi-Partner Solutions** — Collaborative messaging between owner/partner apps
- **Conversational Automation** — Welcome messages, ice breakers (3), bot commands (30)
- **Marketing Messages endpoint** — Dedicated /marketing_messages with product_policy
- **Encrypted Messaging** — JWE encrypted /messages_encrypted for MM Lite
- **Pre-Verified Numbers** — Pre-verify and share numbers between businesses
- **Message History API** — Per-message delivery tracking with forensics
- **WABA Activities** — Complete audit trail (20 activity types)
- **Schedule Management** — WABA-level scheduling (business hours, campaigns)
- **Block Users API** — Programmatic user blocking/unblocking
- **QR Code Management** — Create/manage click-to-chat QR codes
- **Flow Clone & Migration** — Clone flows, migrate between WABAs, inline flow_json
- **Template Enhancements** — MPM button, one-tap OTP, inline flow_json, DISABLED status
- **Per-WABA Webhook Override** — Different webhook URLs per WABA
- **CTWA Attribution** — Click-to-WhatsApp ad tracking with ctwa_clid

### Changed
- `data/error-decision-tree.yaml` — Added 12 new error codes (138006, 1, 2, 4, 10, 100, 104, 190, 200, 803 + subcodes)
- `config/rate-limit-tiers.yaml` — Added TIER_50 (sandbox), phone_number_enums, waba_enums
- `squad.yaml` → v2.2.0, registered 3 new data files

## [2.1.0] - 2026-04-09

### Added
- `scripts/pre-send-validator.js` — Runtime payload validator with PACTO scoring
- `config/coding-standards.md` — Implementation patterns and naming conventions
- `checklists/smoke-tests.md` — Agent activation and command validation checklist
- `data/whatsapp-compliance-kb.yaml` — Structured compliance knowledge base
- `CHANGELOG.md` — Version tracking

### Changed
- squad.yaml updated with new components in registry

## [2.0.0] - 2026-04-09

### Added
- `rules/` directory with 4 contextual rules:
  - `compliance-rules.md` — LGPD + WhatsApp policies + consent management
  - `template-approval-rules.md` — Categories, limits, PACTO, quality gate
  - `throttle-rules.md` — Rate limits, AIMD algorithm, retry, circuit breaker
  - `message-routing-rules.md` — Routing matrix + escalation + veto rules
- `config/` directory with 3 structured configs:
  - `quality-thresholds.yaml` — Quality thresholds per dimension
  - `rate-limit-tiers.yaml` — Tier system with progression rules
  - `pricing-reference.yaml` — Pricing per category (Brazil)
- `data/` expanded with 6 structured YAMLs:
  - `veto-conditions.yaml` — 15 formal veto gates
  - `error-decision-tree.yaml` — Error code diagnosis tree
  - `agent-routing-matrix.yaml` — Agent routing and collaboration map
  - `quality-score-formulas.yaml` — Composite scoring formulas
  - `template-category-decision.yaml` — Category decision tree
  - `tier-progression-rules.yaml` — Tier upgrade/downgrade rules
- `tool-overrides.yaml` — Agent profiles + 11 task bindings
- `tasks/cloud-api-reference.md` — Cloud API reference operations task
- Tier system (T0 orchestrator, T1 core, T2 extended)
- 5 profiles (full, template-ops, integration, campaign, compliance-only)
- 12 squad-level commands grouped by category
- Quality standards (delivery, templates, integration, compliance)
- Activation configuration (greeting, quick commands)

### Changed
- `squad.yaml` fully restructured: icon, slashPrefix, patternPrefix, tiers, profiles, commands, quality_standards, activation, inline agent listing
- All 8 agents converted from `.yaml` to `.md` with L0-L1-L2 format:
  - Level 0: IDE-FILE-RESOLUTION, REQUEST-RESOLUTION, activation-instructions, command_loader, dependencies
  - Level 1: agent identity, scope (does/does_not), metadata, persona
  - Level 2: core_principles, operational_frameworks, never list
- `README.md` fully rewritten for v2.0

### Removed
- Old `.yaml` agent files (replaced by `.md` L0-L1-L2 format)

## [1.0.0] - 2026-04-08

### Added
- Initial release with 7 agents (YAML format)
- 11 tasks (diagnose, create-template, audit, design-flow, etc.)
- 3 workflows (template-lifecycle, campaign-execution, integration-setup)
- 3 checklists (template-approval, compliance, go-live)
- 3 templates (template-spec, campaign-plan, integration-audit)
- 4 data files (whatsapp-api-kb, arsenal-reference, utility-templates-kb, meta-utility-portfolio)
- README with quick start and architecture
