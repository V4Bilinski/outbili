# Task: Cloud API Reference Operations

## Metadata
- task: cloud-api-reference
- tier: 1
- agents: [@cloud-api-architect]
- elicit: true
- inputs: [operation_type, endpoint_or_code, context]
- outputs: [reference_card]
- quality-gates:
  - All responses reference official Meta documentation
  - API version is always v24.0
  - Error codes include actionable resolution
  - Rate limit context is always included

## Prerequisites
- arsenal/tecnologia/cloud-api-reference.md available for endpoint details
- arsenal/tecnologia/rate-limits-and-tiers.md for tier information
- data/error-decision-tree.yaml for error diagnosis

## Elicitation

```
@cloud-api-architect

? Operation type:
  > 1. endpoint — Lookup API endpoint details
    2. error — Diagnose error code
    3. rate-limits — Show tier limits and progression
    4. media — Media upload/download guide
    5. register-phone — Phone registration flow
    6. schema — Request/response JSON schema
    7. tier-check — Tier progression readiness
    8. api-changelog — Breaking changes across versions

? Target (endpoint path, error code, or topic): _________________

? Context (optional — what you're trying to accomplish): _________________
```

## Steps

### Step 1: Identify Operation Type
- [ ] Parse user request to determine operation (endpoint, error, rate-limits, media, register-phone, schema, tier-check, changelog)
- [ ] If ambiguous, ask for clarification
- [ ] Load relevant reference files based on operation type

### Step 2: Lookup Reference Data
- [ ] For **endpoint**: Find endpoint in arsenal/tecnologia/cloud-api-reference.md
  - Method (GET/POST/DELETE)
  - Full path: `https://graph.facebook.com/v24.0/{path}`
  - Required headers: Authorization, Content-Type
  - Required body fields
  - Response schema with example
  - Related error codes
  - Rate limit implications

- [ ] For **error**: Find error in data/error-decision-tree.yaml
  - Error code and title
  - Category (rate_limit, recipient, template, payment, auth, system)
  - Whether retryable (yes/no)
  - Retry strategy if applicable
  - Actionable resolution steps
  - Which agent to escalate to if unresolved

- [ ] For **rate-limits**: Load config/rate-limit-tiers.yaml
  - Current tier limits (messaging/24h + throughput MPS)
  - Progression requirements to next tier
  - Quality score impact on limits
  - Recommendations for current tier

- [ ] For **media**: Reference media handling patterns
  - Supported formats and size limits per type
  - Upload endpoint: POST /{phone_number_id}/media
  - Download: GET /{media_id}
  - Media ID expiration (30 days)
  - Best practices for each media type

- [ ] For **register-phone**: Phone registration flow
  - Registration endpoint and verification
  - Two-step verification setup
  - Business profile configuration
  - Common registration errors

- [ ] For **schema**: Generate complete JSON schema
  - Request body with all fields (required + optional)
  - Response body with field descriptions
  - messaging_product: "whatsapp" (always required)
  - Example with realistic values

- [ ] For **tier-check**: Evaluate progression readiness
  - Current tier (infer from user context)
  - Requirements for next tier
  - Quality score status needed
  - Volume needed in evaluation window
  - Actionable strategy for progression

- [ ] For **api-changelog**: Breaking changes
  - Version-by-version changes
  - Deprecated endpoints/fields
  - Migration requirements
  - Recommended version (always v24.0)

### Step 3: Format Reference Card
- [ ] Structure output as a clean reference card
- [ ] Include all relevant details for the operation type
- [ ] Add cross-references to related operations
- [ ] Include warnings/notes where applicable

### Step 4: Quality Validation
- [ ] Verify API version is v24.0 in all references
- [ ] Confirm phone format is E.164 without + prefix
- [ ] Ensure error handling is included
- [ ] Rate limit context included where relevant

## Output Format

### Endpoint Card
```
## Endpoint: {operation_name}

**Method:** {GET|POST|DELETE}
**URL:** `https://graph.facebook.com/v24.0/{path}`
**Auth:** `Authorization: Bearer {access_token}`

### Request
{JSON body with field descriptions}

### Response
{JSON response with field descriptions}

### Error Codes
| Code | Description | Retryable |
|------|-------------|-----------|

### Rate Limits
{Applicable limits for this endpoint}

### Notes
{Additional context, gotchas, best practices}
```

### Error Card
```
## Error: {code} — {title}

**Category:** {category}
**Retryable:** {yes/no}
**Strategy:** {retry strategy or immediate action}

### Root Cause
{What causes this error}

### Resolution
{Step-by-step fix}

### Prevention
{How to avoid this error}

### Escalation
{Which agent handles this if unresolved}
```

## Checklist
- [ ] Response references official Meta documentation
- [ ] API version is v24.0
- [ ] Phone format shown as E.164 (no + prefix)
- [ ] Error handling included
- [ ] Rate limit context provided
- [ ] Realistic examples used (not "test" or "xxx")
