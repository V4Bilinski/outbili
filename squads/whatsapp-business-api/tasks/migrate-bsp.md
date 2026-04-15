# Task: BSP to Direct API Migration

## Metadata
- task: migrate-bsp
- tier: 2
- agents: [@whatsapp-chief, @integration-engineer]
- elicit: true
- inputs: current BSP name, message volume, features used, timeline constraints
- outputs: migration plan with timeline, cost analysis, feature mapping, and go-live checklist
- references: arsenal/concorrentes/battlecard-direct-vs-bsp.md
- quality-gates: [assessment complete, feature gaps mapped, cost savings calculated, migration timeline approved, go-live checklist ready]

## Prerequisites
- Current BSP contract details available (terms, expiration, exit clauses)
- Message volume data for the last 3-6 months
- List of features currently used through the BSP
- Meta Business Manager access (or ability to create one)
- Technical team available for implementation

## Elicitation

Collect the following before proceeding:
1. **Current BSP:** Which provider? (e.g., Twilio, MessageBird, Gupshup, Take Blip, Zenvia, Infobip)
2. **Message volume:** Average monthly messages (sent + received) and peak daily volume
3. **Features used:** Templates, media messages, interactive messages, flows, catalogs, payments, chatbots
4. **Current costs:** Monthly BSP fees (per-message markup, platform fee, support costs)
5. **Timeline:** Desired migration date, any hard deadlines (contract renewal, campaign launches)
6. **Technical capacity:** Team experience with REST APIs, webhook management, server infrastructure

## Steps

### Step 1: Assess Current BSP Integration
Map the complete current integration:
1. **Message types in use:**
   - Text messages (inbound + outbound)
   - Template messages (count by category)
   - Media messages (image, video, audio, document)
   - Interactive messages (buttons, lists)
   - Flows (if any)
   - Catalog/product messages
2. **Integration touchpoints:**
   - How messages are sent (BSP API, dashboard, chatbot platform)
   - How webhooks are received (BSP callback vs. direct)
   - How media is stored and served
   - How contacts/opt-ins are managed
   - How analytics are tracked
3. **BSP-specific features:**
   - Chatbot builder (if using BSP's no-code tools)
   - Campaign management dashboard
   - Contact management / CRM integration
   - Analytics and reporting
   - Multi-agent inbox
   - Routing and queuing
4. **Dependencies:**
   - Other systems integrated via the BSP (CRM, helpdesk, e-commerce)
   - Custom logic built on BSP-specific APIs
   - Data stored in BSP infrastructure (message history, contacts)

### Step 2: Map Feature Gaps
Identify what changes when moving to Direct API:
1. **Direct API provides natively:**
   - All message types (text, media, interactive, template, flows)
   - Webhook management
   - Template management API
   - Media upload/download API
   - Business profile management
   - Phone number management
2. **Must be built or sourced separately:**
   - Multi-agent inbox (build or use third-party)
   - Chatbot logic (implement with your framework)
   - Contact management (CRM or custom database)
   - Campaign scheduling and batch sending
   - Analytics dashboard
   - Message queuing and retry logic
3. **Feature comparison matrix:**
   | Feature | BSP Provides | Direct API | Gap? | Solution |
   |---------|-------------|------------|------|----------|
   | Send messages | Yes | Yes | No | — |
   | Templates | Yes | Yes | No | — |
   | Webhooks | Abstracted | Raw | Build | Custom handler |
   | Chatbot | Yes (usually) | No | Build | Custom or BotFramework |
   | Inbox | Yes (usually) | No | Build | Custom or Chatwoot |
   | Analytics | Yes (usually) | Partial | Build | Custom dashboard |
   | Campaigns | Yes (usually) | No | Build | Custom scheduler |

### Step 3: Plan Credential Migration
Set up Direct API access:
1. **Meta Business Manager setup:**
   - Create or verify Meta Business Manager account
   - Complete business verification (documents required)
   - Create a Meta App (type: Business)
   - Add WhatsApp product to the app
2. **Phone number migration:**
   - Request number migration from BSP (BSP must initiate)
   - BSP disables the number on their platform
   - Register the number on your WABA via Direct API
   - Verify the number (SMS or voice call verification)
   - Timeline: typically 24-72 hours, plan for downtime
3. **Access token setup:**
   - Generate a System User access token (recommended for production)
   - Set appropriate permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Store tokens securely (environment variables, secrets manager)
   - Plan token rotation schedule (tokens can be long-lived but should rotate)

### Step 4: Design Webhook Migration
Plan the transition from BSP callbacks to Direct API webhooks:
1. **Map BSP callback format to WhatsApp webhook format:**
   - Message events: different JSON structure, field names
   - Status events: delivery receipts format differences
   - Error events: error code mapping
2. **Implement Direct API webhook handler:**
   - Follow `setup-webhook` task for complete implementation
   - Verification endpoint (GET challenge/response)
   - Signature validation (HMAC SHA256)
   - Message deduplication (Redis)
   - Event routing (messages, statuses, errors)
3. **Plan parallel operation period:**
   - Run both BSP and Direct API webhooks simultaneously during testing
   - Use test phone numbers on Direct API while production stays on BSP
   - Gradually shift traffic after validation

### Step 5: Plan Template Migration
Migrate message templates to Direct API:
1. **Export current templates** from BSP dashboard or API
2. **Review and optimize** each template before re-submission:
   - Update copy if needed (opportunity for improvement)
   - Verify category assignment is correct
   - Ensure compliance with latest Meta policies
3. **Submit templates** via Direct API (`POST /{waba-id}/message_templates`)
4. **Timeline considerations:**
   - Template approval takes 1-24 hours (usually < 1 hour)
   - Submit all templates at least 1 week before go-live
   - Have fallback plans for rejected templates
5. **Template name strategy:**
   - Use consistent naming convention (e.g., `v2_welcome_marketing`)
   - Version templates to distinguish from BSP versions

### Step 6: Estimate Cost Savings
Calculate the financial impact of migration:
1. **Current BSP costs (monthly):**
   - Platform/subscription fee: R$ [amount]
   - Per-message markup: R$ [amount] x [volume] = R$ [total]
   - Support/premium tier fees: R$ [amount]
   - Additional features: R$ [amount]
   - **Total BSP cost:** R$ [amount]/month
2. **Direct API costs (monthly):**
   - Meta conversation fees: [volume] x [per-category rate] = R$ [total]
   - Infrastructure costs (servers, Redis, storage): R$ [amount]
   - Development team time (one-time): R$ [amount] amortized
   - Monitoring tools: R$ [amount]
   - **Total Direct API cost:** R$ [amount]/month
3. **Cost comparison:**
   - Monthly savings: R$ [BSP total - Direct total]
   - Annual savings: R$ [monthly x 12]
   - ROI timeline: [months to recoup migration investment]
   - Break-even point: [date]
4. **Hidden cost considerations:**
   - Development effort for features BSP provided
   - Ongoing maintenance of custom infrastructure
   - Training for team on Direct API management

### Step 7: Create Migration Timeline
Build a detailed week-by-week migration plan:
1. **Week 1-2: Preparation**
   - Meta Business Manager setup and verification
   - App creation and configuration
   - Development environment setup
   - Begin webhook handler development
2. **Week 3-4: Development**
   - Webhook handler implementation and testing
   - Message sending integration
   - Template submission and approval
   - Media handling implementation
3. **Week 5: Testing**
   - End-to-end testing with test numbers
   - Load testing webhook handling
   - Template rendering verification
   - Error handling validation
4. **Week 6: Migration**
   - Coordinate phone number migration with BSP
   - Execute number transfer (24-72h downtime window)
   - Activate Direct API webhooks
   - Verify message flow end-to-end
5. **Week 7-8: Stabilization**
   - Monitor quality score and delivery metrics
   - Address any issues found in production
   - Optimize performance
   - Document final architecture

### Step 8: Go-Live Checklist
Final validation before cutting over:

**Pre-migration (1 week before):**
- [ ] All templates submitted and approved on Direct API
- [ ] Webhook handler deployed and tested
- [ ] Message sending tested with test numbers
- [ ] Monitoring and alerting configured
- [ ] Rollback plan documented
- [ ] BSP notified of migration date
- [ ] Team trained on Direct API management

**Migration day:**
- [ ] BSP number deregistration initiated
- [ ] Number registered on Direct API WABA
- [ ] Number verified (SMS/voice)
- [ ] Webhook URL configured and verified
- [ ] Test message sent and received
- [ ] Status webhooks confirmed working
- [ ] Quality score checked (should be GREEN)

**Post-migration (1 week after):**
- [ ] All message types verified in production
- [ ] Delivery rates match or exceed BSP baseline
- [ ] No message loss detected
- [ ] Quality score stable at GREEN
- [ ] Error rates within acceptable range
- [ ] BSP contract termination initiated
- [ ] Cost savings tracking started

## Output Format

```markdown
# BSP TO DIRECT API MIGRATION PLAN

## Current BSP: [name]
## Migration Date: [target date]
## Estimated Downtime: [hours]

### Current State Assessment
- Monthly volume: [number] messages
- Features used: [list]
- Monthly BSP cost: R$ [amount]

### Feature Gap Analysis
| Feature | Current (BSP) | Direct API | Solution |
|---------|--------------|------------|----------|
| [feature] | [status] | [status] | [solution] |

### Cost Analysis
| Item | BSP (monthly) | Direct API (monthly) | Savings |
|------|--------------|---------------------|---------|
| Messages | R$ [x] | R$ [x] | R$ [x] |
| Platform | R$ [x] | R$ [x] | R$ [x] |
| **Total** | **R$ [x]** | **R$ [x]** | **R$ [x]** |
| **Annual savings:** | | | **R$ [x]** |

### Migration Timeline
[Week-by-week plan]

### Go-Live Checklist
[Pre/during/post migration checkboxes]

### Risk Mitigation
1. [risk] — [mitigation]
2. ...

### Rollback Plan
[Steps to revert to BSP if critical issues arise]
```

## Checklist
- [ ] Current BSP integration fully assessed
- [ ] Feature gaps identified with solutions planned
- [ ] Credential migration path defined
- [ ] Webhook migration designed
- [ ] Template migration planned
- [ ] Cost savings calculated with ROI timeline
- [ ] Week-by-week migration timeline created
- [ ] Go-live checklist completed (pre/during/post)
