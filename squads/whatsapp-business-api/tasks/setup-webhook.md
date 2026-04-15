# Task: Webhook Configuration Guide

## Metadata
- task: setup-webhook
- tier: 1
- agents: [@integration-engineer]
- elicit: false
- inputs: webhook URL, app secret, verify token, backend framework (Express/Fastify/NestJS)
- outputs: webhook implementation checklist with code patterns for verification, validation, deduplication, and message handling
- quality-gates: [verification passing, signature validation active, deduplication implemented, all event types handled]

## Prerequisites
- Meta App created in Meta for Developers portal
- WhatsApp Business Account linked to the Meta App
- Backend server accessible via HTTPS (valid SSL certificate required)
- Redis instance available for message deduplication
- App Secret available from Meta App Dashboard

## Steps

### Step 1: Configure Webhook URL
Register the webhook endpoint with Meta:
1. Navigate to Meta for Developers > Your App > WhatsApp > Configuration
2. Set the **Callback URL** to your HTTPS endpoint (e.g., `https://api.example.com/webhook/whatsapp`)
3. Set the **Verify Token** — a secret string you define (store in environment variables)
4. Subscribe to webhook fields:
   - `messages` — inbound messages from users
   - `messaging_postbacks` — button/quick reply responses
   - `message_template_status_update` — template approval/rejection notifications
   - `account_update` — account-level changes
5. Verify the endpoint responds correctly (Meta sends a GET verification request)

### Step 2: Implement Webhook Verification (Challenge/Response)
Handle the GET request from Meta to verify ownership:
1. Extract query parameters:
   - `hub.mode` — must equal `"subscribe"`
   - `hub.verify_token` — must match your configured verify token
   - `hub.challenge` — the challenge string to echo back
2. Validate `hub.mode === "subscribe"` AND `hub.verify_token === YOUR_VERIFY_TOKEN`
3. If valid: respond with HTTP 200 and `hub.challenge` as the response body (plain text)
4. If invalid: respond with HTTP 403 Forbidden
5. **Security:** Never log or expose the verify token in error messages

```
Pattern:
GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
→ 200 OK: CHALLENGE
```

### Step 3: Implement Signature Validation (HMAC SHA256)
Validate that incoming POST requests are genuinely from Meta:
1. Extract the `X-Hub-Signature-256` header from the request
2. The header format is: `sha256=<hex_signature>`
3. Compute HMAC-SHA256 of the raw request body using your **App Secret** as the key
4. Compare your computed signature with the received signature using **timing-safe comparison**
5. If signatures match: process the request
6. If signatures do not match: respond with HTTP 401 and log the attempt
7. **Critical:** Use the raw request body (Buffer), not parsed JSON, for signature computation
8. **Critical:** Always use `crypto.timingSafeEqual()` to prevent timing attacks

```
Pattern:
signature = HMAC-SHA256(app_secret, raw_body)
valid = timingSafeEqual(computed_hex, received_hex)
```

### Step 4: Implement Message Deduplication
Prevent duplicate processing using Redis SET NX + TTL:
1. Extract the unique message ID from each webhook event (`entry[].changes[].value.messages[].id`)
2. Attempt `SET message_id EX 86400 NX` in Redis (24-hour TTL)
   - If SET succeeds (returns OK): this is a **new message**, process it
   - If SET fails (returns null): this is a **duplicate**, skip processing
3. Choose TTL based on expected retry window:
   - 24 hours (86400s) is recommended for most use cases
   - Minimum 1 hour for high-volume systems with memory constraints
4. Use a key prefix for namespacing: `wa:msg:{message_id}`
5. Handle Redis connection failures gracefully:
   - If Redis is down, log a warning and process the message (prefer processing over dropping)
   - Implement circuit breaker pattern for Redis failures

### Step 5: Handle Inbound Messages
Process different message types from users:
1. Parse the webhook payload structure:
   - `entry[].changes[].value.metadata` — business phone number info
   - `entry[].changes[].value.contacts[]` — sender info (name, wa_id)
   - `entry[].changes[].value.messages[]` — the actual messages
2. Handle message types:
   - **text** — `message.text.body` (plain text content)
   - **image** — `message.image.id` (download via Media API)
   - **video** — `message.video.id` (download via Media API)
   - **audio** — `message.audio.id` (download via Media API)
   - **document** — `message.document.id` + `filename`
   - **location** — `message.location.latitude/longitude`
   - **contacts** — `message.contacts[]` (shared contact cards)
   - **sticker** — `message.sticker.id`
   - **reaction** — `message.reaction.emoji` + `message_id` (reacted-to message)
   - **interactive** — `message.interactive.type` (button_reply / list_reply)
   - **order** — `message.order` (product catalog orders)
   - **button** — `message.button.text` (template quick reply response)
3. Always respond with HTTP 200 immediately (within 5 seconds)
4. Process message handling asynchronously (queue recommended)
5. Mark messages as read via `POST /{phone-number-id}/messages` with `"status": "read"`

### Step 6: Handle Status Updates
Process message delivery status webhooks:
1. Parse status events from `entry[].changes[].value.statuses[]`
2. Handle status types:
   - **sent** — message accepted by WhatsApp servers
   - **delivered** — message delivered to recipient's device
   - **read** — message read by recipient (blue ticks)
   - **failed** — message delivery failed (check `errors[]` for details)
3. Extract relevant fields:
   - `id` — the message ID this status refers to
   - `recipient_id` — the recipient's phone number
   - `timestamp` — when the status occurred
   - `errors[].code` + `errors[].title` — error details for failed status
4. Update message records in your database with the latest status
5. For **failed** status: implement retry logic based on error code retryability
6. Track delivery metrics for quality monitoring

### Step 7: Test End-to-End
Validate the complete webhook implementation:
1. **Verification test:** Re-register the webhook URL, confirm challenge passes
2. **Signature test:** Send a request with invalid signature, confirm 401 response
3. **Dedup test:** Replay the same webhook event, confirm second is skipped
4. **Message test:** Send a text message to the WhatsApp number, confirm receipt and processing
5. **Media test:** Send an image/document, confirm media ID is captured
6. **Status test:** Send a message via API, confirm sent/delivered/read statuses arrive
7. **Error test:** Send to an invalid number, confirm failed status is handled
8. **Load test:** Simulate burst traffic, confirm no messages are dropped
9. **Redis failure test:** Simulate Redis down, confirm messages still process

## Output Format

```markdown
# WEBHOOK IMPLEMENTATION CHECKLIST

## Endpoint: [URL]
## Framework: [Express/Fastify/NestJS]
## Date: [YYYY-MM-DD]

### Configuration
- [ ] Webhook URL registered in Meta Dashboard
- [ ] Verify token stored in environment variables
- [ ] App secret stored in environment variables
- [ ] Subscribed fields: messages, statuses, template_status

### Verification (GET)
- [ ] hub.mode validation implemented
- [ ] hub.verify_token comparison implemented
- [ ] hub.challenge echo response implemented
- [ ] 403 response for invalid tokens

### Signature Validation (POST)
- [ ] X-Hub-Signature-256 header extraction
- [ ] HMAC-SHA256 computation with raw body
- [ ] Timing-safe comparison implemented
- [ ] 401 response for invalid signatures

### Deduplication (Redis)
- [ ] Redis SET NX + TTL pattern implemented
- [ ] Key prefix namespacing: wa:msg:{id}
- [ ] 24-hour TTL configured
- [ ] Graceful Redis failure handling

### Message Handling
- [ ] Text messages parsed
- [ ] Media messages (image/video/audio/document) handled
- [ ] Interactive replies (buttons/lists) handled
- [ ] Location and contact messages handled
- [ ] Reactions handled
- [ ] Async processing (queue) implemented
- [ ] HTTP 200 returned within 5 seconds

### Status Updates
- [ ] sent/delivered/read statuses tracked
- [ ] Failed status error handling
- [ ] Database status updates
- [ ] Retry logic for retriable errors

### Testing
- [ ] All 9 test scenarios passed
```

## Checklist
- [ ] Webhook URL configured and verified with Meta
- [ ] Challenge/response verification handler implemented
- [ ] HMAC SHA256 signature validation active
- [ ] Redis deduplication preventing duplicate processing
- [ ] All inbound message types handled
- [ ] Status update processing implemented
- [ ] End-to-end testing completed (all 9 scenarios)
