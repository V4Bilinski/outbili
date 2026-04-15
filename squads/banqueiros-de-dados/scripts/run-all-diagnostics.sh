#!/bin/bash
# =============================================================================
# run-all-diagnostics.sh
# Agent: fortress-master
# Executa todos os scripts SQL de diagnostico em sequencia
# Uso: ./run-all-diagnostics.sh [--db-url DATABASE_URL] [--output-dir ./reports]
# =============================================================================

set -euo pipefail

DATABASE_URL="${DATABASE_URL:-}"
OUTPUT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

while [[ $# -gt 0 ]]; do
  case $1 in
    --db-url) DATABASE_URL="$2"; shift 2 ;;
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    *) echo "Uso: $0 [--db-url URL] [--output-dir DIR]"; exit 1 ;;
  esac
done

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Erro: defina DATABASE_URL ou use --db-url${NC}"
  echo "  export DATABASE_URL='postgresql://user:pass@host:port/db'"
  echo "  ou: $0 --db-url 'postgresql://...'"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "============================================"
echo -e "${CYAN} 🏰 Data Fortress — Full Diagnostics${NC}"
echo " Timestamp: $TIMESTAMP"
echo " Output:    $OUTPUT_DIR/"
echo "============================================"
echo ""

SCRIPTS=(
  "db-health-check.sql:Saude do Banco"
  "schema-inventory.sql:Inventario de Schema"
  "rls-audit.sql:Auditoria RLS"
  "performance-diagnostic.sql:Diagnostico de Performance"
  "backup-verify.sql:Verificacao de Backup"
  "lgpd-scan.sql:Scan LGPD"
  "incident-triage.sql:Triage de Incidentes"
)

PASSED=0
FAILED=0
TOTAL=${#SCRIPTS[@]}

for entry in "${SCRIPTS[@]}"; do
  IFS=':' read -r script label <<< "$entry"
  OUTPUT_FILE="$OUTPUT_DIR/${script%.sql}_${TIMESTAMP}.txt"

  echo -ne "${CYAN}[$((PASSED + FAILED + 1))/$TOTAL]${NC} $label ($script)... "

  if psql "$DATABASE_URL" -f "$SCRIPTS_DIR/$script" > "$OUTPUT_FILE" 2>&1; then
    SIZE=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
    echo -e "${GREEN}OK${NC} ($SIZE bytes → $OUTPUT_FILE)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FALHOU${NC} (ver $OUTPUT_FILE)"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "============================================"
echo " RESUMO"
echo "============================================"
echo -e "  Executados: $TOTAL"
echo -e "  Sucesso:    ${GREEN}$PASSED${NC}"
echo -e "  Falha:      ${RED}$FAILED${NC}"
echo -e "  Reports em: $OUTPUT_DIR/"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}  ✅ Todos os diagnosticos completaram com sucesso${NC}"
else
  echo -e "${YELLOW}  ⚠️  $FAILED diagnostico(s) falharam — verifique os logs${NC}"
fi

# Gerar indice
INDEX_FILE="$OUTPUT_DIR/index_${TIMESTAMP}.md"
cat > "$INDEX_FILE" <<EOF
# Data Fortress Diagnostics — $TIMESTAMP

| Script | Status | Report |
|--------|--------|--------|
EOF

for entry in "${SCRIPTS[@]}"; do
  IFS=':' read -r script label <<< "$entry"
  OUTPUT_FILE="${script%.sql}_${TIMESTAMP}.txt"
  if [ -f "$OUTPUT_DIR/$OUTPUT_FILE" ]; then
    echo "| $label | ✅ | [$OUTPUT_FILE](./$OUTPUT_FILE) |" >> "$INDEX_FILE"
  else
    echo "| $label | ⛔ | Failed |" >> "$INDEX_FILE"
  fi
done

echo ""
echo "  Index: $INDEX_FILE"
echo "============================================"
