# Task: Account Health Diagnosis

## Metadata
- task: diagnose-account
- tier: 0
- agents: [@whatsapp-chief]
- elicit: false
- inputs: WABA ID, phone number ID, access token (or existing API connection)
- outputs: account health report with quality score, tier level, issues, recommendations
- quality-gates: [all checks completed, report generated]

## Prerequisites
- WhatsApp Business Account (WABA) must be active
- Cloud API access credentials available
- Phone number registered and verified

## Steps

### Step 1: Check Quality Score
Retrieve the current quality rating for the business phone number:
1. Query the phone number quality endpoint (`GET /{phone-number-id}?fields=quality_rating`)
2. Record the current quality rating: **GREEN**, **YELLOW**, or **RED**
3. If YELLOW or RED, flag as **critical issue** requiring immediate attention
4. Note the quality score trend (improving, stable, declining) if historical data is available

### Step 2: Check Messaging Tier Level
Determine the current messaging tier and limits:
1. Query the phone number fields (`fields=messaging_limit_tier`)
2. Record the current tier: **TIER_1K**, **TIER_10K**, **TIER_100K**, or **TIER_UNLIMITED**
3. Calculate current daily usage vs. tier limit percentage
4. Assess if tier is sufficient for planned messaging volume
5. Note time since last tier upgrade (tiers upgrade every 24h of quality messaging)

### Step 3: Review Error Rates
Analyze recent API error patterns:
1. Pull error data from the last 7 days
2. Categorize errors by type:
   - **Rate limiting** (error 130429) — throttling issues
   - **Template errors** (132000-132015) — content/format problems
   - **Recipient errors** (131026, 131047) — invalid numbers or opt-out
   - **Media errors** (131052, 131053) — upload/download failures
   - **System errors** (131000) — platform issues
3. Calculate error rate percentage (errors / total requests)
4. Flag any error rate above 5% as **warning**, above 15% as **critical**

### Step 4: Check Template Status
Audit all message templates:
1. List all templates via `GET /{waba-id}/message_templates`
2. Count templates by status: **APPROVED**, **PENDING**, **REJECTED**
3. Count templates by category: **MARKETING**, **UTILITY**, **AUTHENTICATION**
4. Identify any recently rejected templates and note rejection reasons
5. Check template quality scores if available
6. Flag templates with low engagement or high block rates

### Step 5: Check Compliance Status
Verify account compliance posture:
1. Check if business verification is complete
2. Verify display name compliance (matches business entity)
3. Confirm official business account (blue badge) status if applicable
4. Check for any active policy violations or warnings
5. Verify opt-in mechanisms are documented and functional
6. Confirm privacy policy URL is set and accessible

### Step 6: Generate Health Report
Compile findings into a structured report with an overall health score:
1. Calculate overall health score (0-100) based on weighted factors:
   - Quality rating: 30% weight
   - Error rate: 25% weight
   - Template health: 20% weight
   - Compliance: 15% weight
   - Tier adequacy: 10% weight
2. List all issues found, categorized by severity (CRITICAL / WARNING / INFO)
3. Provide specific, actionable recommendations for each issue
4. Prioritize recommendations by impact and urgency

## Output Format

```markdown
# ACCOUNT HEALTH REPORT

## Account: [WABA Name]
## Phone: [Phone Number]
## Date: [YYYY-MM-DD]
## Overall Health Score: [0-100] / [HEALTHY | AT RISK | CRITICAL]

### Quality Rating: [GREEN/YELLOW/RED]
- Current status: ...
- Trend: [improving/stable/declining]
- Impact: ...

### Messaging Tier: [TIER_1K/10K/100K/UNLIMITED]
- Daily limit: [number]
- Current usage: [percentage]%
- Tier adequacy: [SUFFICIENT / UPGRADE NEEDED]

### Error Analysis (Last 7 Days)
- Total requests: [number]
- Error rate: [percentage]%
- Top errors:
  1. [error code] - [count] occurrences - [description]
  2. ...

### Template Health
- Total templates: [number]
- Approved: [number] | Pending: [number] | Rejected: [number]
- Issues: ...

### Compliance Status
- Business verification: [COMPLETE / INCOMPLETE]
- Policy violations: [NONE / list]
- Opt-in status: [VERIFIED / UNVERIFIED]

### Recommendations (Priority Order)
1. [CRITICAL] ...
2. [WARNING] ...
3. [INFO] ...

### Next Review: [recommended date]
```

## Checklist
- [ ] Quality score retrieved and assessed
- [ ] Messaging tier verified against volume needs
- [ ] Error rates analyzed for last 7 days
- [ ] All templates audited by status and category
- [ ] Compliance posture verified
- [ ] Health report generated with score and recommendations
