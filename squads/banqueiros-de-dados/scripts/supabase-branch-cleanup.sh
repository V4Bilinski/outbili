#!/bin/bash
# =============================================================================
# supabase-branch-cleanup.sh
# Agent: devops-pipeline-master
# Lista e limpa branches Supabase orfaos (sem PR ativo correspondente)
# Uso: ./supabase-branch-cleanup.sh [--dry-run] [--project-ref PROJECT_REF]
# =============================================================================

set -euo pipefail

DRY_RUN=false
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --project-ref) PROJECT_REF="$2"; shift 2 ;;
    *) echo "Uso: $0 [--dry-run] [--project-ref REF]"; exit 1 ;;
  esac
done

if [ -z "$PROJECT_REF" ]; then
  echo "Erro: defina SUPABASE_PROJECT_REF ou use --project-ref"
  exit 1
fi

echo "============================================"
echo " Supabase Branch Cleanup"
echo " Project: $PROJECT_REF"
echo " Mode: $([ "$DRY_RUN" = true ] && echo 'DRY RUN' || echo 'LIVE')"
echo "============================================"
echo ""

# Listar branches Supabase
echo "Buscando branches Supabase..."
BRANCHES=$(supabase branches list --project-ref "$PROJECT_REF" 2>/dev/null || echo "ERRO")

if [ "$BRANCHES" = "ERRO" ]; then
  echo "Erro ao listar branches. Verifique o project-ref e auth."
  exit 1
fi

echo "$BRANCHES"
echo ""

# Listar PRs abertas no GitHub
echo "Buscando PRs abertas..."
OPEN_PRS=$(gh pr list --state open --json headRefName --jq '.[].headRefName' 2>/dev/null || echo "")

echo "PRs abertas: ${OPEN_PRS:-nenhuma}"
echo ""

# Identificar branches orfaos
echo "--- Branches para cleanup ---"
CLEANED=0

while IFS= read -r line; do
  BRANCH_NAME=$(echo "$line" | awk '{print $1}' | tr -d '[:space:]')
  [ -z "$BRANCH_NAME" ] && continue
  [[ "$BRANCH_NAME" == "ID" ]] && continue
  [[ "$BRANCH_NAME" == "---" ]] && continue

  if echo "$OPEN_PRS" | grep -q "$BRANCH_NAME" 2>/dev/null; then
    echo "  ✅ $BRANCH_NAME — PR ativa, mantendo"
  else
    echo "  🗑️  $BRANCH_NAME — sem PR ativa"
    if [ "$DRY_RUN" = false ]; then
      echo "     Deletando..."
      supabase branches delete "$BRANCH_NAME" --project-ref "$PROJECT_REF" 2>/dev/null && \
        echo "     Deletado!" || echo "     Erro ao deletar"
    fi
    CLEANED=$((CLEANED + 1))
  fi
done <<< "$BRANCHES"

echo ""
echo "============================================"
echo " Branches para cleanup: $CLEANED"
[ "$DRY_RUN" = true ] && echo " (dry-run — nada foi deletado)"
echo "============================================"
