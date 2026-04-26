#!/usr/bin/env bash
#
# submit-templates.sh — submete os 50 templates do catalog.json para o Meta Cloud API
#
# Estrategia: POST direto p/ Meta (graph.facebook.com/v24.0/{WABA_ID}/message_templates)
#   - Nao depende do BilinskiZap
#   - Usa o WHATSAPP_ACCESS_TOKEN (System User Nexus)
#   - Rate limit: 7s entre cada submissao (Meta aceita ~10/min em contas novas)
#   - Loga resultados em submit-results.log
#
# Uso:
#   cd whatsapp-templates
#   bash submit-templates.sh                       # submete todos
#   bash submit-templates.sh --pillar 1            # so pilar 1
#   bash submit-templates.sh --name outbili_cold_curto  # template especifico
#   bash submit-templates.sh --dry-run             # mostra payload sem enviar

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"
CATALOG="$(dirname "$0")/catalog.json"
LOG_FILE="$(dirname "$0")/submit-results.log"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: .env.local nao encontrado em $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$CATALOG" ]]; then
  echo "ERRO: catalog.json nao encontrado em $CATALOG" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

REQUIRED=(WHATSAPP_WABA_ID WHATSAPP_ACCESS_TOKEN)
for var in "${REQUIRED[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERRO: variavel $var ausente em .env.local" >&2
    exit 1
  fi
done

if ! command -v jq &>/dev/null; then
  echo "ERRO: jq nao instalado. Instale com: brew install jq" >&2
  exit 1
fi

# Parse args
PILLAR_FILTER=""
NAME_FILTER=""
DRY_RUN=false
DELAY=7

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pillar) PILLAR_FILTER="$2"; shift 2 ;;
    --name) NAME_FILTER="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --delay) DELAY="$2"; shift 2 ;;
    -h|--help)
      sed -n '4,15p' "$0"
      exit 0
      ;;
    *)
      echo "Argumento desconhecido: $1" >&2
      exit 1
      ;;
  esac
done

API_URL="https://graph.facebook.com/v24.0/$WHATSAPP_WABA_ID/message_templates"

# Build jq filter
JQ_FILTER='.templates'
if [[ -n "$PILLAR_FILTER" ]]; then
  JQ_FILTER="$JQ_FILTER | map(select(.pillar == $PILLAR_FILTER))"
fi
if [[ -n "$NAME_FILTER" ]]; then
  JQ_FILTER="$JQ_FILTER | map(select(.name == \"$NAME_FILTER\"))"
fi

TOTAL=$(jq "$JQ_FILTER | length" "$CATALOG")

if [[ "$TOTAL" -eq 0 ]]; then
  echo "Nenhum template casa com os filtros" >&2
  exit 1
fi

echo ""
echo "==========================================================="
echo " WhatsApp Template Submission"
echo "==========================================================="
echo " WABA:      $WHATSAPP_WABA_ID"
echo " API:       v24.0"
echo " Templates: $TOTAL"
echo " Delay:     ${DELAY}s entre submissoes"
echo " Dry run:   $DRY_RUN"
echo " Log:       $LOG_FILE"
echo "==========================================================="
echo ""

if [[ "$DRY_RUN" == "false" ]]; then
  read -r -p "Confirmar submissao? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Cancelado."
    exit 0
  fi
fi

mkdir -p "$(dirname "$LOG_FILE")"
echo "=== $(date -u '+%Y-%m-%dT%H:%M:%SZ') === Submission start ===" >> "$LOG_FILE"

SUCCESS=0
FAILED=0
SKIPPED=0

# Iterate templates
INDEX=0
jq -c "$JQ_FILTER | .[]" "$CATALOG" | while read -r tpl; do
  INDEX=$((INDEX + 1))
  NAME=$(echo "$tpl" | jq -r '.name')
  CAT=$(echo "$tpl" | jq -r '.category')
  LANG=$(echo "$tpl" | jq -r '.language')

  # Build Meta payload (apenas name, category, language, components)
  PAYLOAD=$(echo "$tpl" | jq '{name, category, language, components}')

  printf "[%2d/%d] %-50s [%s] " "$INDEX" "$TOTAL" "$NAME" "$CAT"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY-RUN"
    echo "$PAYLOAD" | jq .
    continue
  fi

  RESPONSE=$(curl -sS -X POST "$API_URL" \
    -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" 2>&1 || echo '{"error":{"message":"curl_failed"}}')

  HTTP_OK=$(echo "$RESPONSE" | jq -r 'has("id")')

  if [[ "$HTTP_OK" == "true" ]]; then
    TPL_ID=$(echo "$RESPONSE" | jq -r '.id')
    STATUS=$(echo "$RESPONSE" | jq -r '.status // "PENDING"')
    echo "OK ($STATUS, id=$TPL_ID)"
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') OK $NAME $TPL_ID $STATUS" >> "$LOG_FILE"
    SUCCESS=$((SUCCESS + 1))
  else
    ERR=$(echo "$RESPONSE" | jq -r '.error.error_user_msg // .error.message // .error // "unknown"')
    ERR_CODE=$(echo "$RESPONSE" | jq -r '.error.code // "?"')

    # Templates ja existentes (codigo 100/2388023) ja submetidos antes - skip silencioso
    if echo "$ERR" | grep -qiE "already exists|duplicate"; then
      echo "SKIP (ja existe)"
      echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') SKIP $NAME already-exists" >> "$LOG_FILE"
      SKIPPED=$((SKIPPED + 1))
    else
      echo "FAIL ($ERR_CODE: $ERR)"
      echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') FAIL $NAME [$ERR_CODE] $ERR" >> "$LOG_FILE"
      FAILED=$((FAILED + 1))
    fi
  fi

  # Rate limit (Meta aceita ~10/min em contas novas)
  sleep "$DELAY"
done

echo ""
echo "==========================================================="
echo " Resumo: log em $LOG_FILE"
echo "==========================================================="
echo ""
echo "Para acompanhar aprovacao:"
echo "  curl 'https://graph.facebook.com/v24.0/$WHATSAPP_WABA_ID/message_templates?fields=name,status&limit=100' \\"
echo "    -H 'Authorization: Bearer \$WHATSAPP_ACCESS_TOKEN' | jq '.data[] | select(.name | startswith(\"outbili_\"))'"
echo ""
