# whatsapp-webhook — Cloudflare Worker

Webhook receiver oficial para o WhatsApp Business Cloud API v24.0, conectado ao app Meta "API OFICIAL CORE" (ID 1622839972295826) e à WABA 1073091055880047 (+55 11 91347-3874).

## Responsabilidades

| Etapa | Implementação |
|-------|--------------|
| Challenge GET handshake | `hub.mode` + `hub.verify_token` + echo `hub.challenge` |
| Autenticação dos POST | HMAC SHA256 do raw body com `WHATSAPP_APP_SECRET` |
| Comparação timing-safe | Byte-a-byte com XOR, resistente a timing attacks |
| Deduplicação | Cloudflare KV (binding `WA_DEDUP`) com TTL 24h |
| Processamento async | Encaminha para N8N via `ctx.waitUntil` |
| Resposta ao Meta | 200 `EVENT_RECEIVED` em <5s sempre |

## Eventos capturados

- `messages` (inbound): text, image, video, audio, document, location, contacts, sticker, reaction, interactive, order, button
- `statuses`: sent / delivered / read / failed
- `message_template_status_update`: aprovação/rejeição de templates
- `account_update`: mudanças de conta

## Deploy

### 1. Pré-requisitos

- Conta Cloudflare com `wrangler` CLI instalado
- Account ID do Cloudflare (o mesmo já usado em `../assertiva-proxy/wrangler.toml`)
- Secrets Meta disponíveis (App Secret, Verify Token definido por você)
- URL do workflow N8N que vai processar eventos (ver `/n8n/incoming-whatsapp-processor.json`)

### 2. Criar KV namespace para deduplicação

```bash
cd workers/whatsapp-webhook
wrangler kv:namespace create WA_DEDUP
```

Copiar o `id` retornado e colar em `wrangler.toml` no bloco `[[kv_namespaces]]`.

### 3. Configurar secrets

```bash
wrangler secret put WHATSAPP_APP_SECRET
# Cole o App Secret do Meta (Configurações > Básico)

wrangler secret put WHATSAPP_VERIFY_TOKEN
# Cole uma string aleatória que você escolheu (guardar também para colar no Meta Dashboard)

wrangler secret put N8N_WEBHOOK_URL
# Cole a URL do webhook N8N, ex: https://n8n.bilinski.cloud/webhook/whatsapp-incoming
```

### 4. Preencher `account_id` em `wrangler.toml`

Copiar do `workers/assertiva-proxy/wrangler.toml` ou executar `wrangler whoami`.

### 5. Deploy

```bash
wrangler deploy
```

A URL pública será algo como: `https://whatsapp-webhook.<account>.workers.dev`

### 6. Registrar webhook no Meta

1. Acesse https://developers.facebook.com/apps/1622839972295826/
2. Menu lateral → **WhatsApp > Configuração**
3. Em **Webhook**, clique em **Editar**:
   - **Callback URL**: URL do Worker deployado (item 5)
   - **Verify Token**: mesmo valor do `WHATSAPP_VERIFY_TOKEN` (passo 3)
4. Clique **Verificar e salvar** (Meta faz o GET handshake)
5. Em **Campos do webhook**, inscreva-se em:
   - `messages`
   - `messaging_postbacks`
   - `message_template_status_update`
   - `account_update`

### 7. Testar

```bash
# Testar verify handshake manualmente
curl "https://whatsapp-webhook.<account>.workers.dev/?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test123"
# Esperado: 200 com body "test123"

# Testar signature invalida
curl -X POST https://whatsapp-webhook.<account>.workers.dev/ \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{"entry":[]}'
# Esperado: 401 Unauthorized

# Enviar mensagem real pro numero do WhatsApp e verificar logs
wrangler tail
```

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| Meta rejeita webhook no registro | Verify token não bate ou URL 404 | Conferir `WHATSAPP_VERIFY_TOKEN` e URL |
| Todos os POSTs retornam 401 | App Secret errado ou Worker lê body parseado | Confirmar secret e uso de `request.text()` (raw) |
| Eventos duplicados no N8N | KV namespace não criado ou binding errado | Verificar `[[kv_namespaces]]` em wrangler.toml |
| N8N não recebe eventos | `N8N_WEBHOOK_URL` vazio ou inválido | `wrangler secret put N8N_WEBHOOK_URL` |
| Timeout 5s no Meta | N8N sendo aguardado sincronamente | Confirmar uso de `ctx.waitUntil` (já implementado) |

## Observabilidade

```bash
wrangler tail                    # Stream de logs em tempo real
wrangler kv:key list --binding WA_DEDUP   # Listar mensagens deduplicadas
```

## Arquitetura

```
Meta Cloud API
     │  POST webhook event
     ▼
┌─────────────────────────────────────────┐
│ Cloudflare Worker: whatsapp-webhook     │
│  1. GET? → verify handshake             │
│  2. POST → validate HMAC SHA256         │
│  3. Extract event IDs (messages/status) │
│  4. Dedup via KV (WA_DEDUP, TTL 24h)    │
│  5. ctx.waitUntil(forward to N8N)       │
│  6. Return 200 EVENT_RECEIVED (<5s)     │
└───────────────┬─────────────────────────┘
                │ async
                ▼
┌─────────────────────────────────────────┐
│ N8N Workflow                            │
│  - Parse event type                     │
│  - Match contact via Airtable           │
│  - Enrich with Assertiva (se novo)      │
│  - Persist message + conversation       │
│  - Notify frontend (BilinskiZap ou      │
│    realtime channel futuro)             │
└─────────────────────────────────────────┘
```
