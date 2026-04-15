#!/bin/bash
# =============================================================================
# migration-safety-check.sh
# Agent: devops-pipeline-master + db-architect
# Verifica seguranca de uma migration antes de aplicar
# Uso: ./migration-safety-check.sh <migration-file.sql>
# =============================================================================

set -euo pipefail

MIGRATION_FILE="${1:-}"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ -z "$MIGRATION_FILE" ]; then
  echo -e "${RED}Uso: $0 <migration-file.sql>${NC}"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}Arquivo nao encontrado: $MIGRATION_FILE${NC}"
  exit 1
fi

echo "============================================"
echo " Migration Safety Check"
echo " Arquivo: $MIGRATION_FILE"
echo "============================================"
echo ""

ISSUES=0
WARNINGS=0

# 1. OPERACOES DESTRUTIVAS
echo "--- 1. Operacoes Destrutivas ---"
if grep -iE 'DROP\s+TABLE' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${RED}  ⛔ DROP TABLE detectado${NC}"
  grep -inE 'DROP\s+TABLE' "$MIGRATION_FILE"
  ISSUES=$((ISSUES + 1))
fi
if grep -iE 'DROP\s+COLUMN' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${RED}  ⛔ DROP COLUMN detectado${NC}"
  grep -inE 'DROP\s+COLUMN' "$MIGRATION_FILE"
  ISSUES=$((ISSUES + 1))
fi
if grep -iE 'TRUNCATE' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${RED}  ⛔ TRUNCATE detectado${NC}"
  grep -inE 'TRUNCATE' "$MIGRATION_FILE"
  ISSUES=$((ISSUES + 1))
fi
if grep -iE 'DELETE\s+FROM.*WHERE' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${YELLOW}  ⚠️  DELETE com WHERE detectado${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
if grep -iE 'DELETE\s+FROM' "$MIGRATION_FILE" | grep -ivE 'WHERE' > /dev/null 2>&1; then
  echo -e "${RED}  ⛔ DELETE sem WHERE detectado${NC}"
  ISSUES=$((ISSUES + 1))
fi
[ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ] && echo -e "${GREEN}  ✅ Nenhuma operacao destrutiva${NC}"

# 2. LOCKS POTENCIAIS
echo ""
echo "--- 2. Locks Potenciais ---"
if grep -iE 'ALTER\s+TABLE.*ADD\s+COLUMN.*NOT\s+NULL' "$MIGRATION_FILE" | grep -ivE 'DEFAULT' > /dev/null 2>&1; then
  echo -e "${RED}  ⛔ ADD COLUMN NOT NULL sem DEFAULT — lock exclusivo em tabela grande!${NC}"
  ISSUES=$((ISSUES + 1))
fi
if grep -iE 'CREATE\s+INDEX\b' "$MIGRATION_FILE" | grep -ivE 'CONCURRENTLY' > /dev/null 2>&1; then
  echo -e "${YELLOW}  ⚠️  CREATE INDEX sem CONCURRENTLY — vai bloquear writes${NC}"
  grep -inE 'CREATE\s+INDEX\b' "$MIGRATION_FILE" | grep -ivE 'CONCURRENTLY'
  WARNINGS=$((WARNINGS + 1))
fi
if grep -iE 'ALTER\s+TABLE.*ALTER\s+COLUMN.*TYPE' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${YELLOW}  ⚠️  ALTER COLUMN TYPE — rewrite de tabela, lock longo${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
[ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ] && echo -e "${GREEN}  ✅ Sem locks problematicos${NC}"

# 3. RLS
echo ""
echo "--- 3. Row Level Security ---"
if grep -iE 'CREATE\s+TABLE' "$MIGRATION_FILE" > /dev/null 2>&1; then
  TABLE_COUNT=$(grep -ciE 'CREATE\s+TABLE' "$MIGRATION_FILE")
  RLS_COUNT=$(grep -ciE 'ALTER\s+TABLE.*ENABLE\s+ROW\s+LEVEL\s+SECURITY' "$MIGRATION_FILE" || echo 0)
  if [ "$RLS_COUNT" -lt "$TABLE_COUNT" ]; then
    echo -e "${YELLOW}  ⚠️  $TABLE_COUNT tabelas criadas mas apenas $RLS_COUNT com RLS habilitado${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}  ✅ Todas as novas tabelas tem RLS${NC}"
  fi
else
  echo -e "${GREEN}  ✅ Nenhuma tabela nova (RLS n/a)${NC}"
fi

# 4. ROLLBACK
echo ""
echo "--- 4. Rollback ---"
if grep -iE '(ROLLBACK|-- DOWN|-- REVERT|-- UNDO)' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Secao de rollback encontrada${NC}"
else
  echo -e "${YELLOW}  ⚠️  Sem secao de rollback documentada${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. TRANSACTION WRAPPING
echo ""
echo "--- 5. Transaction ---"
if grep -iE '^\s*BEGIN' "$MIGRATION_FILE" > /dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Migration wrapped em transaction${NC}"
else
  echo -e "${YELLOW}  ⚠️  Migration sem BEGIN/COMMIT — operacoes nao sao atomicas${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# RESUMO
echo ""
echo "============================================"
echo " RESUMO"
echo "============================================"
echo -e "  Erros criticos: ${RED}$ISSUES${NC}"
echo -e "  Avisos:         ${YELLOW}$WARNINGS${NC}"
echo ""
if [ $ISSUES -gt 0 ]; then
  echo -e "${RED}  ⛔ BLOQUEADO — corrija os erros criticos antes de aplicar${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}  ⚠️  PROSSEGUIR COM CAUTELA — revise os avisos${NC}"
  exit 0
else
  echo -e "${GREEN}  ✅ APROVADO — migration segura para aplicar${NC}"
  exit 0
fi
