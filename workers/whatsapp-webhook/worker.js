/**
 * Cloudflare Worker — WhatsApp Webhook Receiver para OUTBILI
 *
 * Endpoint oficial Meta Cloud API v24.0 que:
 *   1. Responde ao challenge GET (handshake inicial do Meta)
 *   2. Valida X-Hub-Signature-256 (HMAC SHA256 sobre raw body)
 *   3. Deduplica por message.id via KV (TTL 24h)
 *   4. Encaminha evento para N8N (processamento assincrono)
 *   5. Retorna 200 ao Meta em menos de 5s
 *
 * App Meta: API OFICIAL CORE (ID 1622839972295826)
 * WABA: 1253502413584752
 * Phone Number ID: 1073091055880047 (+55 11 91347-3874)
 *
 * ESTRATEGIA FAN-OUT:
 *   Durante a migracao, este worker recebe do Meta e:
 *   - Encaminha o evento cru para o webhook atual do BilinskiZap (mantem Inbox funcionando)
 *   - Encaminha tambem para o N8N (processamento novo)
 *   - Ambos os forwards sao async via ctx.waitUntil (nao bloqueiam o 200 ao Meta)
 *
 * Deploy: wrangler deploy
 * Secrets: wrangler secret put WHATSAPP_APP_SECRET
 *          wrangler secret put WHATSAPP_VERIFY_TOKEN
 *          wrangler secret put N8N_WEBHOOK_URL
 */

const DEDUP_TTL_SECONDS = 86_400 // 24h

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256Hex(secret, rawBody) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  return bytesToHex(new Uint8Array(sig))
}

function timingSafeEqual(aHex, bHex) {
  if (aHex.length !== bHex.length) return false
  const a = hexToBytes(aHex)
  const b = hexToBytes(bHex)
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

async function verifySignature(env, signatureHeader, rawBody) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false
  const received = signatureHeader.slice(7)
  const expected = await hmacSha256Hex(env.WHATSAPP_APP_SECRET, rawBody)
  return timingSafeEqual(received, expected)
}

function extractEventIds(payload) {
  const ids = []
  const entries = payload?.entry ?? []
  for (const entry of entries) {
    const changes = entry?.changes ?? []
    for (const change of changes) {
      const value = change?.value ?? {}
      for (const msg of value.messages ?? []) {
        if (msg?.id) ids.push(`msg:${msg.id}`)
      }
      for (const status of value.statuses ?? []) {
        if (status?.id && status?.status) {
          ids.push(`status:${status.id}:${status.status}`)
        }
      }
    }
  }
  return ids
}

async function filterNewEvents(env, eventIds) {
  if (eventIds.length === 0) return []
  const results = await Promise.all(
    eventIds.map(async (id) => {
      const existing = await env.WA_DEDUP.get(id)
      if (existing) return null
      await env.WA_DEDUP.put(id, '1', { expirationTtl: DEDUP_TTL_SECONDS })
      return id
    }),
  )
  return results.filter(Boolean)
}

async function forwardToN8N(env, payload, newEventIds, ctx) {
  if (!env.N8N_WEBHOOK_URL) return

  const forwardPromise = fetch(env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'meta-cloud-api',
      waba_id: env.WABA_ID,
      phone_number_id: env.PHONE_NUMBER_ID,
      app_id: env.META_APP_ID,
      new_event_ids: newEventIds,
      payload,
      received_at: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.error('N8N forward failed', err?.message || err)
  })

  ctx.waitUntil(forwardPromise)
}

async function forwardToBilinskiZap(env, rawBody, signatureHeader, ctx) {
  if (!env.BILINSKIZAP_WEBHOOK_URL) return

  const forwardPromise = fetch(env.BILINSKIZAP_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': signatureHeader,
      'X-Forwarded-By': 'outbili-whatsapp-webhook',
    },
    body: rawBody,
  }).catch((err) => {
    console.error('BilinskiZap forward failed', err?.message || err)
  })

  ctx.waitUntil(forwardPromise)
}

function handleVerification(env, url) {
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new Response('Forbidden', { status: 403 })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === 'GET') {
      return handleVerification(env, url)
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const rawBody = await request.text()
    const signatureHeader = request.headers.get('x-hub-signature-256')

    const valid = await verifySignature(env, signatureHeader, rawBody)
    if (!valid) {
      console.warn('Invalid signature from', request.headers.get('cf-connecting-ip'))
      return new Response('Unauthorized', { status: 401 })
    }

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return new Response('Bad Request', { status: 400 })
    }

    await forwardToBilinskiZap(env, rawBody, signatureHeader, ctx)

    const eventIds = extractEventIds(payload)
    const newEventIds = await filterNewEvents(env, eventIds)

    if (newEventIds.length > 0) {
      await forwardToN8N(env, payload, newEventIds, ctx)
    }

    return new Response('EVENT_RECEIVED', { status: 200 })
  },
}
