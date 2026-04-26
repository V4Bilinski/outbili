#!/usr/bin/env bash
#
# deploy-secrets.sh — sobe os secrets do .env.local para o Cloudflare Worker
#
# Uso: cd workers/whatsapp-webhook && bash deploy-secrets.sh
#
# Pre-requisitos:
#   - wrangler CLI instalado e autenticado
#   - account_id preenchido em wrangler.toml
#   - KV namespace WA_DEDUP criado (wrangler kv:namespace create WA_DEDUP)

set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/../.." && pwd)/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: .env.local nao encontrado em $ENV_FILE" >&2
  exit 1
fi

# Carrega .env.local
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

REQUIRED_VARS=(
  META_APP_SECRET
  WHATSAPP_ACCESS_TOKEN
  WHATSAPP_WEBHOOK_VERIFY_TOKEN
)

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERRO: variavel $var ausente em .env.local" >&2
    exit 1
  fi
done

echo "==> Subindo 3 secrets para o Worker whatsapp-webhook..."

echo "$META_APP_SECRET"                | wrangler secret put WHATSAPP_APP_SECRET
echo "$WHATSAPP_ACCESS_TOKEN"          | wrangler secret put WHATSAPP_ACCESS_TOKEN
echo "$WHATSAPP_WEBHOOK_VERIFY_TOKEN"  | wrangler secret put WHATSAPP_VERIFY_TOKEN

echo ""
echo "==> N8N_WEBHOOK_URL (opcional por enquanto)"
read -r -p "Cole a URL do webhook N8N (ou Enter para pular): " n8n_url
if [[ -n "$n8n_url" ]]; then
  echo "$n8n_url" | wrangler secret put N8N_WEBHOOK_URL
else
  echo "(pulado — configurar depois com: wrangler secret put N8N_WEBHOOK_URL)"
fi

echo ""
echo "==> Secrets configurados. Proximo passo: wrangler deploy"
