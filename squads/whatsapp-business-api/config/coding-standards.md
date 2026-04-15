# Coding Standards — WhatsApp Business API Squad

## Scope
Standards for all code written by squad agents when implementing WhatsApp integrations.

## API Integration Patterns

### Base Configuration
```typescript
const WHATSAPP_API = {
  baseUrl: 'https://graph.facebook.com/v24.0',
  timeout: 30000,
  retryMax: 5,
  retryBaseDelay: 2000,
};
```

### Never Hardcode
- API version (use config constant)
- Access tokens (use Supabase settings)
- Phone numbers (use E.164 formatter)
- Webhook verify tokens (use secure random + Supabase)

### Always Include
- `messaging_product: "whatsapp"` in every message payload
- `Authorization: Bearer {token}` header
- Error handling with mapped error codes
- Timeout configuration
- Rate limit awareness

## Phone Number Handling

```typescript
// CORRECT: E.164 without +
const phone = '5511999998888';

// WRONG: with + prefix
const phone = '+5511999998888'; // ❌

// WRONG: with formatting
const phone = '(11) 99999-8888'; // ❌

// Formatter function
function toE164(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}
```

## Credential Management

```typescript
// CORRECT: From Supabase settings
const credentials = await supabase
  .from('settings')
  .select('value')
  .eq('key', 'whatsapp_access_token')
  .single();

// WRONG: From environment variables
const token = process.env.WHATSAPP_TOKEN; // ❌
```

## Error Handling Pattern

```typescript
try {
  const response = await fetch(`${WHATSAPP_API.baseUrl}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(WHATSAPP_API.timeout),
  });

  if (!response.ok) {
    const error = await response.json();
    const mapped = mapWhatsAppError(error);
    if (mapped.retryable) {
      return await retryWithBackoff(() => sendMessage(payload), mapped.strategy);
    }
    throw new WhatsAppError(mapped.code, mapped.message, mapped.resolution);
  }

  return await response.json();
} catch (error) {
  if (error instanceof WhatsAppError) throw error;
  throw new WhatsAppError('NETWORK', error.message, 'Check connectivity');
}
```

## Webhook Handler Pattern

```typescript
// 1. Respond 200 IMMEDIATELY
export async function POST(request: Request) {
  const body = await request.text();

  // 2. Verify signature
  const signature = request.headers.get('x-hub-signature-256');
  if (!verifySignature(body, signature, appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 3. Parse payload
  const payload = JSON.parse(body);

  // 4. Deduplicate
  const messageId = extractMessageId(payload);
  if (messageId) {
    const isNew = await redis.set(`wamid:${messageId}`, '1', 'NX', 'EX', 86400);
    if (!isNew) {
      return new Response('OK', { status: 200 }); // Duplicate, skip
    }
  }

  // 5. Queue for async processing (respond 200 first)
  await queueWebhook(payload);

  return new Response('OK', { status: 200 });
}
```

## Template Payload Pattern

```typescript
function buildTemplatePayload(
  to: string,
  templateName: string,
  language: string,
  components: TemplateComponent[]
) {
  return {
    messaging_product: 'whatsapp',
    to: toE164(to),
    type: 'template',
    template: {
      name: templateName, // lowercase_with_underscores
      language: { code: language }, // e.g., 'pt_BR'
      components: components,
    },
  };
}
```

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Template names | lowercase_underscores | `order_confirmation_v2` |
| File names | kebab-case | `whatsapp-send.ts` |
| Functions | camelCase | `sendTemplateMessage()` |
| Constants | UPPER_SNAKE | `WHATSAPP_API_VERSION` |
| Types/Interfaces | PascalCase | `TemplateComponent` |
| Environment keys | UPPER_SNAKE | Never use for WhatsApp credentials |

## Testing Requirements

- Unit test every message builder function
- Integration test webhook signature verification
- Test error handling for all retryable error codes
- Test deduplication with duplicate message IDs
- Test adaptive throttle increase/decrease behavior
- Validate template payloads against component limits
