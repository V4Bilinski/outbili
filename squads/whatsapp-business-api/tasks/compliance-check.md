# Task: Full Compliance Validation

## Metadata
- task: compliance-check
- tier: 1
- agents: [@compliance-guardian]
- elicit: false
- inputs: WABA account details, template inventory, opt-in mechanisms, privacy documentation
- outputs: compliance report with PASS/FAIL per category and remediation steps
- references: arsenal/mercado/regulacao-compliance-brasil.md
- quality-gates: [all 8 categories audited, PASS/FAIL assigned, remediation provided for failures]

## Prerequisites
- WABA account active and accessible
- Access to all message templates
- Documentation of opt-in collection mechanisms
- Privacy policy and terms of service URLs
- Knowledge of data storage and handling practices

## Steps

### Step 1: Check Opt-In Mechanisms
Validate that contact consent is properly collected and recorded:
1. **Opt-in collection methods audit:**
   - Website forms: Is WhatsApp consent a separate, explicit checkbox (not pre-checked)?
   - Landing pages: Is the opt-in purpose clearly stated?
   - In-store: Is there a documented process with signature/digital consent?
   - Social media: Are click-to-WhatsApp ads compliant?
   - QR codes: Does the QR landing explain what the user is opting into?
2. **Opt-in language validation:**
   - Must clearly state: "I agree to receive messages via WhatsApp from [Business Name]"
   - Must specify message categories: marketing, transactional, or both
   - Must not bundle WhatsApp consent with other unrelated consents
   - Must be in Portuguese (for Brazil market) or the user's language
3. **Opt-in record keeping:**
   - Timestamp of consent stored
   - Method of consent recorded (web form, in-store, etc.)
   - IP address or device identifier captured (for web)
   - Consent text version tracked (for audit trail)
4. **Double opt-in (recommended):**
   - Confirmation message sent after initial opt-in
   - User must confirm to activate messaging
   - Provides stronger legal protection under LGPD

**Verdict:** PASS if all collection methods have explicit, documented consent with proper records. FAIL if any method lacks explicit consent or records are incomplete.

### Step 2: Validate Template Content
Check all templates against Meta's 44+ prohibited content categories:
1. **Absolutely prohibited content:**
   - Weapons, ammunition, explosives
   - Illegal drugs or drug paraphernalia
   - Tobacco, vaping products
   - Alcohol (except in permitted jurisdictions with age gating)
   - Gambling and betting
   - Adult content or sexual services
   - Counterfeit goods
   - Multi-level marketing or pyramid schemes
2. **Restricted content (requires special handling):**
   - Healthcare and pharmaceuticals (no medical claims without disclaimers)
   - Financial services (must include required disclosures)
   - Political content (subject to additional policies)
   - Real estate (fair housing compliance)
   - Dating services (age restrictions apply)
3. **Content quality standards:**
   - No misleading or deceptive claims
   - No false urgency or artificial scarcity
   - No hate speech, harassment, or discrimination
   - No content that exploits vulnerable groups
   - No impersonation of other businesses or individuals
4. **Template-specific checks:**
   - Variables are not used to inject prohibited content
   - Media attachments comply with content policies
   - Button URLs point to legitimate, compliant destinations
   - Footer text is accurate and not misleading

**Verdict:** PASS if all templates comply. FAIL with list of non-compliant templates and specific violations.

### Step 3: Verify Privacy Policy
Ensure the business privacy policy covers WhatsApp messaging:
1. **Privacy policy accessibility:**
   - Published at a public URL
   - Linked in the WhatsApp Business Profile
   - Available in Portuguese (for Brazil market)
   - Easy to find and read (no dark patterns)
2. **Required disclosures for WhatsApp:**
   - Data collected through WhatsApp (phone number, name, message content)
   - Purpose of data collection (marketing, support, transactions)
   - Data retention periods
   - Third-party sharing (including Meta/WhatsApp as processor)
   - User rights (access, correction, deletion, portability)
   - Contact information for data protection inquiries
3. **Privacy policy completeness:**
   - Last updated date is recent (within 12 months)
   - Covers all communication channels (not just website)
   - Specifically mentions WhatsApp or messaging platforms

**Verdict:** PASS if privacy policy is accessible, covers WhatsApp data handling, and meets all disclosure requirements. FAIL with specific gaps listed.

### Step 4: Check LGPD Compliance
Validate compliance with Brazil's General Data Protection Law (Lei Geral de Protecao de Dados):
1. **Legal basis for processing (Art. 7):**
   - Identify the legal basis: consent, legitimate interest, or contract performance
   - If consent: verify it meets LGPD consent requirements (free, informed, unambiguous)
   - If legitimate interest: document the legitimate interest assessment (LIA)
2. **Data subject rights (Art. 18):**
   - Right to access: Can users request their data? Process documented?
   - Right to correction: Can users update their information?
   - Right to deletion: Can users request data erasure? Process documented?
   - Right to portability: Can data be exported in standard format?
   - Right to revoke consent: Is opt-out easy and effective?
3. **Data protection officer (DPO):**
   - DPO designated (required for certain businesses under LGPD)
   - DPO contact information published
4. **Data processing records:**
   - Processing activities documented
   - Data flow maps available
   - Processor agreements in place (with Meta, hosting providers, etc.)
5. **International data transfer:**
   - Data stored outside Brazil? (Meta's servers)
   - Adequate protection mechanisms (standard contractual clauses, etc.)
   - Transfer documented in privacy policy

**Verdict:** PASS if legal basis is established, data subject rights are implemented, and processing is documented. FAIL with specific LGPD gaps.

### Step 5: Verify Consent Storage
Audit how consent records are maintained:
1. **Consent database integrity:**
   - Each contact has a consent record with timestamp
   - Consent version (which text they agreed to) is tracked
   - Method of collection is recorded
   - Consent status is current (active, revoked, expired)
2. **Consent lifecycle management:**
   - New consent: properly recorded with all metadata
   - Updated consent: old version preserved, new version recorded
   - Revoked consent: immediately effective, messaging stopped
   - Expired consent: re-consent mechanism in place (if applicable)
3. **Consent audit trail:**
   - Changes to consent are logged with timestamps
   - Logs are tamper-resistant
   - Retention period for consent records: minimum 5 years (LGPD recommendation)
4. **Consent retrieval:**
   - Can produce consent proof for any contact within 72 hours
   - Format suitable for regulatory presentation
   - Covers all required metadata

**Verdict:** PASS if consent records are complete, current, and retrievable. FAIL if records are incomplete or retrieval is not possible within 72 hours.

### Step 6: Review Opt-Out Mechanisms
Validate that users can easily stop receiving messages:
1. **Opt-out availability:**
   - Every MARKETING template includes opt-out option (button or footer text)
   - Opt-out works via keyword reply ("SAIR", "PARAR", "STOP")
   - Opt-out works via quick reply button (if provided)
   - Business Manager unsubscribe link (if applicable)
2. **Opt-out effectiveness:**
   - Opt-out takes effect immediately (no "up to 48 hours" delays)
   - All message categories are stopped (unless granular opt-out is offered)
   - Confirmation message sent acknowledging the opt-out
   - No messages sent after opt-out (verify with recent opt-outs)
3. **Opt-out record keeping:**
   - Opt-out timestamp recorded
   - Opt-out method recorded
   - Contact status updated in all systems (CRM, campaign tools, etc.)
   - No re-messaging without explicit re-opt-in
4. **Re-opt-in process:**
   - User must proactively re-subscribe (no auto re-enrollment)
   - Re-opt-in requires the same level of explicit consent as initial opt-in
   - Previous opt-out history preserved for audit

**Verdict:** PASS if opt-out is available, immediate, and properly recorded. FAIL if opt-out is missing, delayed, or not honored.

### Step 7: Check Data Handling Practices
Audit how message data and personal information are handled:
1. **Data minimization:**
   - Only necessary data is collected (no excessive data gathering)
   - Message content is not stored longer than necessary
   - Media files have defined retention and deletion policies
2. **Data security:**
   - Data encrypted at rest (database encryption)
   - Data encrypted in transit (HTTPS/TLS for all API calls)
   - Access controls in place (who can view message data)
   - Audit logs for data access
3. **Data retention:**
   - Defined retention periods for message content (recommend 90 days max)
   - Defined retention periods for contact data
   - Automated deletion/anonymization when retention expires
   - Retention policy documented and communicated
4. **Third-party data sharing:**
   - All processors documented (hosting, analytics, CRM)
   - Data processing agreements (DPA) in place with each processor
   - No unauthorized sharing of contact data or message content
   - Meta's data use is understood and documented

**Verdict:** PASS if data handling follows minimization, security, and retention best practices. FAIL with specific gaps.

### Step 8: Generate Compliance Report
Compile all findings into a comprehensive compliance report:
1. Calculate overall compliance score:
   - Count PASS and FAIL across all 7 categories
   - Overall: COMPLIANT (all pass), PARTIALLY COMPLIANT (1-2 failures), NON-COMPLIANT (3+ failures)
2. For each FAIL category:
   - Specific issues identified
   - Severity: CRITICAL (legal risk), HIGH (policy violation risk), MEDIUM (best practice gap)
   - Remediation steps with estimated effort
   - Deadline recommendation based on severity
3. Risk assessment:
   - Account suspension risk (Meta policy violations)
   - Legal risk (LGPD non-compliance)
   - Reputation risk (poor consent practices)
4. Recommended next review date

## Output Format

```markdown
# COMPLIANCE REPORT

## Account: [WABA Name]
## Date: [YYYY-MM-DD]
## Overall Status: [COMPLIANT / PARTIALLY COMPLIANT / NON-COMPLIANT]

### Summary
| Category | Status | Severity (if FAIL) |
|----------|--------|-------------------|
| Opt-in Mechanisms | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| Template Content | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| Privacy Policy | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| LGPD Compliance | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| Consent Storage | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| Opt-out Mechanisms | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |
| Data Handling | [PASS/FAIL] | [—/CRITICAL/HIGH/MEDIUM] |

### Detailed Findings

#### 1. Opt-in Mechanisms — [PASS/FAIL]
- Findings: ...
- Issues: ...
- Remediation: ...

#### 2. Template Content — [PASS/FAIL]
[... repeat for each category]

### Risk Assessment
- Account suspension risk: [LOW/MEDIUM/HIGH]
- Legal risk (LGPD): [LOW/MEDIUM/HIGH]
- Reputation risk: [LOW/MEDIUM/HIGH]

### Remediation Plan
| Issue | Severity | Action | Effort | Deadline |
|-------|----------|--------|--------|----------|
| [issue] | [severity] | [action] | [hours/days] | [date] |

### Next Review: [recommended date]
```

## Checklist
- [ ] Opt-in mechanisms audited across all collection methods
- [ ] All templates validated against 44+ prohibited categories
- [ ] Privacy policy verified for WhatsApp-specific disclosures
- [ ] LGPD compliance checked (legal basis, rights, DPO, transfers)
- [ ] Consent storage and retrieval validated
- [ ] Opt-out mechanisms verified (availability, effectiveness, records)
- [ ] Data handling practices audited (security, retention, sharing)
- [ ] Compliance report generated with PASS/FAIL and remediation plan
