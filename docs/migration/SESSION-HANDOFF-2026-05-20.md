# Session Handoff — 2026-05-20 → próxima sessão

> **Status global:** W3-07 (cutover 100% Supabase) **mergeado em main** mas **produção QUEBRADA** por bug de indentação no `deploy.yml`.
> **Prioridade #1 da próxima sessão:** consertar `deploy.yml` (1 ação) → produção volta.

---

## 🔴 BLOQUEIO ATIVO — Produção fora do ar

**Sintoma:** https://v4bilinski.github.io/outbili/ carrega mas estoura `Error: supabaseUrl is required` no console → app não funciona.

**Causa em 2 camadas:**

1. O último deploy que teve **sucesso** foi o commit `8d32c74` — mas ele foi buildado **sem** as envs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (não estavam no `deploy.yml` naquele momento). Então o bundle em produção tem Supabase URL vazia.
2. Os 2 commits seguintes que **adicionariam** essas envs (`c59f2e4` "Refactor", `66ed983` "Update") foram editados pela UI do GitHub e **herdaram 2 espaços extras de indentação** em todos os top-level keys (`on:`, `permissions:`, `concurrency:`, `jobs:`). YAML é space-sensitive → workflow inválido → **ambos os deploys falharam no parse, antes de buildar**.

**Estado do `deploy.yml` remoto (commit `66ed983`):** INDENT QUEBRADO. Veja: `on:` está com 2 espaços antes (deveria ser coluna 0).

**Verificação rápida do bug:**
```bash
gh api repos/V4Bilinski/outbili/contents/.github/workflows/deploy.yml --jq '.content' | base64 -d | sed -n '3p' | cat -A
# Se aparecer "  on:$" (com espaços) → ainda quebrado. Se "on:$" → corrigido.
```

---

## ✅ FIX PRONTO (escolha 1 dos 3 caminhos)

O arquivo **correto** já está salvo localmente em:
`V4_Company/V4_Creator/Sistemas/outbili/.github/workflows/deploy.yml` (indent validado, coluna 0).

### Caminho A — via MCP github (PREFERIDO, se token foi atualizado)
Pré-requisito: operador atualizou o PAT do MCP github com scope `workflow` + **restart do Claude Code** (ver seção "MCP github" abaixo). Então:
```
mcp__github__create_or_update_file(
  owner=V4Bilinski, repo=outbili, branch=main,
  path=.github/workflows/deploy.yml,
  sha=<pegar via get_file_contents>,
  content=<conteúdo do arquivo local>,
  message="fix(deploy): corrige indentação YAML"
)
```
Nas sessões 2026-05-20 isso retornava `403 Resource not accessible by personal access token` porque o token do MCP não tinha `workflow` scope.

### Caminho B — UI do GitHub (sempre funciona, manual)
1. `cat .github/workflows/deploy.yml | pbcopy` (carrega o arquivo correto no clipboard)
2. Abrir https://github.com/V4Bilinski/outbili/edit/main/.github/workflows/deploy.yml
3. `Cmd+A` → Delete → `Cmd+V` → "Preview" pra validar → Commit directly to main
4. ⚠️ NÃO copiar de code block do chat (herdou indent). Copiar SEMPRE do filesystem via pbcopy.

### Caminho C — git push local (se resolver workflow scope do git)
O git local usa keychain osxkeychain com token V4Bilinski **sem** workflow scope.
`gh auth refresh -s workflow` adicionou scope a um token, mas o git continuou usando o antigo do keychain. Caminho não confiável; preferir A ou B.

**Após qualquer caminho:** monitorar `gh run list --branch main --limit 1` até `conclusion: success`, depois validar produção (login real qa-w3-07@outbili.test / Teste200$).

---

## 🔑 MCP github — atualização de token (em andamento)

O MCP `github` (config em `~/.claude.json` → `mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`) usa um PAT **sem** scope `workflow`, por isso não consegue editar arquivos em `.github/workflows/`. Operador está atualizando para um PAT classic com `repo, workflow, read:org`.

**Receita segura (operador roda no terminal, token nunca passa pelo chat):**
```bash
read -s -p "Cole o novo PAT: " GH_NEW; echo
cp ~/.claude.json ~/.claude.json.bak.$(date +%Y%m%d-%H%M%S)
jq --arg t "$GH_NEW" '.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = $t' ~/.claude.json > ~/.claude.json.tmp \
  && mv ~/.claude.json.tmp ~/.claude.json && chmod 600 ~/.claude.json && unset GH_NEW
```
Validar: `TOK=$(jq -r '.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN' ~/.claude.json); curl -sI -H "Authorization: token $TOK" https://api.github.com | grep -i x-oauth-scopes; unset TOK`
→ deve listar `repo, workflow, read:org`. Depois **restart do Claude Code** + revogar token antigo.

**Status ao encerrar sessão:** não confirmado se operador completou. Próxima sessão deve TESTAR o MCP github (tentar Caminho A) antes de assumir que precisa do Caminho B.

---

## ✅ O que JÁ está pronto e correto

| Item | Estado |
|---|---|
| Código W3-07 (cutover 100% Supabase) | ✅ em main (commit `38d864f`) |
| Fix de build (`tsc -b` types + bugs lógicos) | ✅ em main (commit `8d32c74`) |
| Secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | ✅ no GitHub (Settings → Secrets) |
| `deploy.yml` correto | ✅ no filesystem local (falta só chegar no remoto sem indent) |
| Migrations Supabase (audit.user_activity, 10 users, grants) | ✅ aplicadas no projeto `outbili-spo` |
| Banco: 746 leads, 11 users ativos, audit.user_activity | ✅ validado via MCP |

---

## 📋 Plano de ação ordenado (próxima sessão)

### Imediato (desbloquear produção)
1. **Testar MCP github** (Caminho A). Se 403 → usar Caminho B (UI + pbcopy).
2. **Monitorar deploy** até success.
3. **Validar produção:** login real em https://v4bilinski.github.io/outbili/ com `qa-w3-07@outbili.test` / `Teste200$` → confirmar dashboard com 746 leads + console limpo.
4. **`chmod 600 .env.local`** (atualmente 644 — qualquer user do sistema lê as keys locais).
5. **Comunicar aos 10 users** a senha temp `OutbiliReset2026!@#` (já têm `force_password_reset=true` em metadata).

### Curto prazo (Sprint 1 restante + W3-08 reestruturado)
6. **W3-08 (RESTRUTURAR — operador NÃO quer n8n):** o Assertiva proxy hoje vai por `n8n.bilinski.cloud/webhook/assertiva-proxy` (CORS quebrado) + worker Cloudflare `outbili.v4bilinski-ferramentas.workers.dev` (HTTP 400). Operador quer **eliminar o n8n** desse fluxo. Próxima sessão deve **revisar a arquitetura do Assertiva proxy** e propor alternativa sem n8n (candidatos: Edge Function Supabase, ou só o worker Cloudflare consertado). Ver task SP1-4 (mapeamento ficou pendente).
7. **W3-09:** debug worker Cloudflare 400 (pode ser absorvido pela decisão de W3-08).
8. **W2-P06:** `supabase migration repair --status applied` das 15 migrations remotas (antes de qualquer migration local nova).

### Médio prazo
9. **W2-P01** (LGPD, ALTA): cifrar CPF em `app.contacts` (102) + `app.leads` via pgsodium.
10. W2-P02 (29 órfãos), W2-P03 (9 campos vagos).

### Longo prazo (cleanup Airtable)
11. W3-10 (drop `airtable_record_id` + helpers), W3-11 (modal force_password_reset), Story 021 (drop foreign tables + `src/lib/airtable.ts` órfão + envs `VITE_AIRTABLE_*`).

---

## ⚠️ Estado do working tree local (ao encerrar)

- Branch: `main` (local pode estar atrás de `origin/main` — fazer `git pull` no início da próxima sessão, resolvendo qualquer divergência; o `deploy.yml` local é a versão CORRETA, não sobrescrever com a remota quebrada)
- Untracked: `docs/migration/W3-COMPLETION-REPORT.md` (criado nesta sessão, **não commitado** — commitar junto com este handoff), `outbili-workers/*` (4 workers Cloudflare, escopo de outra story)
- `gh` CLI: conta ativa pode estar como `V4Bilinski` (foi trocada de `luizxhgomes` pra push). Conferir com `gh auth status`.

---

## 📚 Documentos relacionados

- [`W3-COMPLETION-REPORT.md`](./W3-COMPLETION-REPORT.md) — auditoria completa do cutover W3-07
- [`PENDENCIAS-MIGRACAO.md`](./PENDENCIAS-MIGRACAO.md) — pendências W2 (status pós-W3-07)
- Story: [`docs/stories/W3-07.validacao-e2e-cutover.story.md`](../stories/W3-07.validacao-e2e-cutover.story.md)
- [`OUTBILI.md`](../../OUTBILI.md) — doc-mãe (tabela de migração atualizada)
