# Task: Error Diagnosis & Resolution

## Metadata
- task: troubleshoot-error
- tier: 0
- agents: [@cloud-api-architect]
- elicit: false
- inputs: error code or symptom description, request context (endpoint, payload, timestamp)
- outputs: error diagnosis with root cause, resolution steps, and prevention measures
- references: arsenal/tecnologia/error-codes-complete.md
- quality-gates: [error identified, root cause determined, resolution provided, prevention documented]

## Prerequisites
- Error code or clear symptom description available
- API request context (which endpoint, what payload, when it happened)
- Access to error codes reference (`arsenal/tecnologia/error-codes-complete.md` — 60+ error codes mapped)

## Steps

### Step 1: Identify Error Code
Determine the exact error from the available information:
1. **If error code is provided:** Extract the numeric code (e.g., 131026, 130429)
2. **If symptom is described:** Map the symptom to likely error codes:
   - "Message not delivered" → 131026, 131047, 131031
   - "Rate limited / throttled" → 130429
   - "Template rejected" → 132000-132015
   - "Media upload failed" → 131052, 131053
   - "Webhook not receiving" → configuration issue (not an API error)
   - "Authentication failed" → 190, 10
   - "Permission denied" → 200, 294
3. **Parse the full error response:**
   - `error.code` — numeric error code
   - `error.type` — error category
   - `error.message` — human-readable description
   - `error.error_subcode` — more specific error identifier
   - `error.error_data.details` — additional context
   - `error.fbtrace_id` — trace ID for Meta support escalation

### Step 2: Map to Error Category
Classify the error into its category for systematic resolution:

1. **Authorization Errors (0-99, 190):**
   - Invalid or expired access token
   - Insufficient permissions
   - App not authorized for WhatsApp
   - Resolution focus: token refresh, permission grants

2. **Rate Limiting Errors (130429, 80007):**
   - Too many API requests per second
   - Messaging throughput limit exceeded
   - Resolution focus: implement backoff, request throughput increase

3. **Template Errors (132000-132015):**
   - 132000: Template parameter count mismatch
   - 132001: Template does not exist
   - 132005: Template hydration failed (variable issue)
   - 132007: Template format mismatch
   - 132012: Template paused (quality issue)
   - 132015: Template rejected
   - Resolution focus: fix parameters, resubmit template

4. **Recipient Errors (131026, 131047, 131031):**
   - 131026: Recipient not a WhatsApp user
   - 131047: Re-engagement message required (24h window expired)
   - 131031: Recipient blocked the business
   - Resolution focus: clean number lists, use templates for re-engagement

5. **Media Errors (131052, 131053):**
   - 131052: Media upload failed
   - 131053: Media download failed
   - Resolution focus: check file size/format, retry upload

6. **System Errors (131000, 131005):**
   - 131000: Generic system error (Meta platform issue)
   - 131005: Request timeout
   - Resolution focus: retry with exponential backoff

7. **Payment Errors (131042):**
   - Account payment issue or billing problem
   - Resolution focus: check payment method in Business Manager

### Step 3: Check Retryability
Determine if the error is retriable:

| Retryable | Error Codes | Strategy |
|-----------|-------------|----------|
| YES — immediate retry | 131000, 131005 | Retry up to 3x with 1-5s delay |
| YES — with backoff | 130429, 80007 | Exponential backoff: 1s, 2s, 4s, 8s, 16s |
| YES — after fix | 132000, 132005, 132007 | Fix payload, then retry |
| NO — permanent | 131026 | Remove number from list |
| NO — needs action | 131047 | Send template message first |
| NO — account issue | 131042, 190 | Fix account/token, then retry |
| NO — policy | 131031, 132012 | Review and address policy violation |

Provide the specific retry strategy:
1. **Max retry attempts:** 3 for immediate retries, 5 for backoff retries
2. **Backoff formula:** `delay = min(base * 2^attempt, max_delay)`
3. **Base delay:** 1 second
4. **Max delay:** 60 seconds
5. **Dead letter queue:** After max retries, move to DLQ for manual review

### Step 4: Provide Resolution Steps
Give specific, actionable resolution for the identified error:
1. **Immediate action:** What to do right now to fix the current failure
2. **Root cause fix:** What underlying issue needs to be addressed
3. **Verification:** How to confirm the fix worked
4. **Rollback plan:** If the fix causes new issues, how to revert

For each resolution step, provide:
- Clear instruction (what to do)
- API call or code snippet if applicable
- Expected outcome after the step
- Common pitfalls to avoid

### Step 5: Check for Systemic Issues
Determine if this is an isolated incident or a systemic problem:
1. **Frequency check:** Is this error occurring repeatedly?
   - Single occurrence: likely transient, monitor
   - Recurring pattern: systemic issue, needs root cause fix
2. **Scope check:** Does it affect one recipient or many?
   - Single recipient: recipient-specific issue (number invalid, blocked, etc.)
   - Multiple recipients: template, configuration, or account issue
3. **Timing check:** When did the errors start?
   - After a code deployment: code regression
   - After a template change: template configuration issue
   - Random occurrence: platform issue or transient error
4. **Correlation check:** Are other errors occurring simultaneously?
   - Multiple error types: possible account-level issue
   - Single error type: specific subsystem problem

### Step 6: Recommend Prevention Measures
Provide recommendations to prevent recurrence:
1. **Code-level prevention:**
   - Implement proper error handling with categorized catch blocks
   - Add retry logic with appropriate strategies per error type
   - Implement circuit breaker for API calls
   - Add request validation before sending to API
2. **Operational prevention:**
   - Set up monitoring alerts for error rate spikes
   - Implement daily health checks (`diagnose-account` task)
   - Regular number list hygiene (remove invalid numbers)
   - Template versioning and testing before deployment
3. **Process prevention:**
   - Pre-flight template validation before submission
   - Staging environment for template testing
   - Gradual rollout for new templates and campaigns
   - Documented runbook for common error scenarios

## Output Format

```markdown
# ERROR DIAGNOSIS REPORT

## Error: [code] — [title]
## Severity: [CRITICAL / HIGH / MEDIUM / LOW]
## Date: [YYYY-MM-DD]

### Error Details
- Code: [number]
- Category: [Authorization/Rate Limit/Template/Recipient/Media/System]
- Message: [error message]
- Trace ID: [fbtrace_id]
- Request context: [endpoint, relevant payload details]

### Root Cause
[Clear explanation of why this error occurred]

### Retryable: [YES/NO]
- Strategy: [immediate/backoff/after-fix/not-retriable]
- Max retries: [number]
- Backoff: [formula if applicable]

### Resolution Steps
1. **[Immediate]** [action]
   - How: [specific instruction]
   - Verify: [how to confirm it worked]
2. **[Root cause]** [action]
   - How: [specific instruction]
   - Verify: [how to confirm it worked]

### Systemic Assessment
- Frequency: [isolated / recurring]
- Scope: [single recipient / multiple / all]
- Pattern: [description if systemic]

### Prevention Measures
1. [Code] [measure]
2. [Operational] [measure]
3. [Process] [measure]

### Escalation
- If unresolved: [escalation path]
- Meta support trace ID: [fbtrace_id]
```

## Checklist
- [ ] Error code identified and categorized
- [ ] Root cause determined
- [ ] Retryability assessed with specific strategy
- [ ] Resolution steps provided with verification
- [ ] Systemic vs. isolated assessment completed
- [ ] Prevention measures recommended
