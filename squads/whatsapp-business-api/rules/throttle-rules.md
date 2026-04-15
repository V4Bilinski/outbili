# Throttle & Rate Limit Rules — WhatsApp Business API Squad

## Scope
Rules enforced by @integration-engineer and @cloud-api-architect for all API calls and message sending.

## API Rate Limits

### Per-Endpoint Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| Send message | 80 MPS (Tier 1-3), 1000 MPS (Unlimited) | Per second |
| Upload media | 100 requests | Per hour |
| Template management | 600 requests | Per hour |
| Business profile | 100 requests | Per hour |
| Phone number management | 100 requests | Per hour |

### Per-Number Limits
- Messaging limits are per phone number, NOT per WABA
- Each phone number has its own tier and quality score
- Multiple numbers under same WABA have independent limits

## Adaptive Throttle (AIMD Algorithm)

### Configuration
```
additive_increase: +5% rate per successful batch
multiplicative_decrease: -40% rate on rate limit error
floor: 10 messages/second (never go below)
ceiling: current tier messaging limit
recovery: gradual increase, never immediate jump back to pre-decrease rate
```

### Trigger Conditions
| Event | Action |
|-------|--------|
| Successful batch (no errors) | Increase rate by 5% |
| HTTP 429 (Too Many Requests) | Decrease rate by 40% |
| Error 130429 (Rate limit hit) | Decrease rate by 40% |
| Error 131056 (Pair rate limit) | Decrease rate by 40% |
| Error 131047 (Re-engagement limit) | STOP sending to that contact |
| 3 consecutive decreases | PAUSE for 60 seconds, then resume at floor |

### Recovery Protocol
1. After decrease: wait for current batch to complete
2. Resume at decreased rate
3. Increase gradually (+5% per successful batch)
4. NEVER jump back to pre-decrease rate immediately
5. If quality score drops to YELLOW: cap at 50% of tier limit
6. If quality score drops to RED: STOP all marketing, utility only at floor rate

## Retry Logic

### Retryable Errors
| Error Code | Description | Retry Strategy |
|------------|-------------|----------------|
| 130429 | Rate limit hit | Exponential backoff: 2s, 4s, 8s, 16s, 32s |
| 131056 | Pair rate limit | Backoff + skip pair for 1 hour |
| 500 | Internal server error | Immediate retry, max 3 |
| 503 | Service unavailable | Backoff: 5s, 10s, 30s |

### Non-Retryable Errors (Do NOT Retry)
| Error Code | Description | Action |
|------------|-------------|--------|
| 131051 | No WhatsApp account | Mark contact as invalid |
| 131026 | Contact blocked business | Remove from send list |
| 131053 | Invalid phone number | Validate E.164 format |
| 132000 | Template parameter mismatch | Fix template payload |
| 132015 | Template paused | Use different template |
| 131042 | Payment pending | Alert business owner |

### Retry Configuration
- Max retries: 5
- Base delay: 2 seconds
- Strategy: exponential backoff (2^n * base_delay)
- Max delay: 32 seconds
- Jitter: add random 0-1000ms to prevent thundering herd
- Circuit breaker: if 50% of batch fails, pause entire batch

## Webhook Response Rules

- Respond HTTP 200 within 200ms — NO exceptions
- Process webhook payload asynchronously (queue-based)
- If processing takes > 100ms, queue first, respond 200, process later
- Meta retries on: timeout, 5xx responses, connection refused
- Meta does NOT retry on: 200 response (even if processing fails)
- Deduplication: Redis SET NX with message_id, TTL 86400s (24h)

## Quality-Based Throttle Adjustments

| Quality Score | Max Send Rate | Marketing Allowed | Action |
|--------------|--------------|-------------------|--------|
| GREEN | 100% of tier limit | Yes | Normal operation |
| YELLOW | 50% of tier limit | Pause recommended | Analyze and optimize |
| RED | Floor rate only | BLOCKED | Switch to utility only, file appeal |
