# Playwright Artifacts — Screenshot Storage Rule

## Purpose

Toda saída visual do Playwright MCP (`mcp__playwright__browser_take_screenshot`) DEVE ser salva dentro de `playwright/{categoria}/` na raiz do projeto. Nunca salvar screenshots soltos na raiz do repositório.

## Scope

Aplica-se a toda chamada das ferramentas:
- `mcp__playwright__browser_take_screenshot`
- Qualquer operação Playwright que gere arquivos `.png` ou `.jpeg` no disco local

## Mandatory Rule

Ao chamar `mcp__playwright__browser_take_screenshot`, o parâmetro `filename` **DEVE** seguir o formato:

```
playwright/{categoria}/{nome-descritivo}.{png|jpeg}
```

**Nunca** passar apenas `{nome}.png` sem o prefixo `playwright/{categoria}/`.

## Categorias Padrão

| Categoria | Uso |
|-----------|-----|
| `audit/` | Auditorias UX/UI completas, revisões de hierarquia visual |
| `deploy/` | Validação pós-deploy em produção |
| `e2e-pesca/` | Fluxos E2E de pesquisa de leads (PESCA) |
| `ux/` | Revisões de telas específicas, hero sections, componentes |
| `admin/` | Telas do painel admin (enrichment, spiced, recalc) |
| `spiced-recalc/` | Operações de recálculo SPICED (progresso, resultados) |
| `kpi/` | Validação de KPI bars, dashboards de indicadores |
| `debug/` | Screenshots de debug, investigação de bugs |
| `screenshots/` | Screenshots genéricos sem categoria clara |
| `campaigns/` | Painel de Campanhas/Disparos PESCA |
| `pipeline/` | Funil Kanban, stage gate, qualificação |
| `final/` | Validações finais antes de entregar story |
| `fix/` | Screenshots comprovando correção de bug |
| `test/` | Testes manuais (formulários, filled, result) |
| `screenshots/orphans/` | Screenshots resgatados de `.playwright-mcp/` (sem categoria original) |

Se nenhuma categoria se aplica, criar subpasta nova em `playwright/{nova-categoria}/` com nome descritivo (kebab-case).

## Convenção de Nomenclatura

- **kebab-case** para arquivos: `01-login-page.png`, `audit-dashboard-hero.png`
- **Prefixo numérico** (`01-`, `02-`) para fluxos sequenciais (e.g. e2e-pesca)
- **Prefixo semântico** (`audit-`, `deploy-`, `fix-`) quando não há sequência
- **Sufixos descritivos** para estados: `-mobile`, `-fullpage`, `-error`, `-bottom`

## Exemplos

### Correto

```
mcp__playwright__browser_take_screenshot({
  type: "png",
  filename: "playwright/audit/dashboard-hero-mobile.png",
  fullPage: true
})
```

```
mcp__playwright__browser_take_screenshot({
  type: "png",
  filename: "playwright/e2e-pesca/22-resultado-final.png"
})
```

### Errado

```
❌ filename: "dashboard.png"                      # sem categoria
❌ filename: "audit-dashboard.png"                # na raiz
❌ filename: "playwright/random-name.png"         # sem subpasta
❌ filename: "./screenshots/test.png"             # pasta errada
```

## Criação de Categoria Nova

Se a tarefa não encaixa em nenhuma categoria existente:

1. Criar subpasta nova: `playwright/{nova-categoria}/`
2. Documentar na tabela acima via edit deste arquivo
3. Nome em kebab-case, descritivo, curto

## Gitignore

A pasta `playwright/` está em `.gitignore` — screenshots não são commitados. São artefatos locais de debug/validação. NUNCA forçar commit via `git add -f` sem aprovação explícita.

## Housekeeping

- Screenshots antigos (>30 dias) podem ser deletados sem aprovação
- Se a raiz do repo tiver screenshots soltos, mover para `playwright/{categoria}/` antes de qualquer commit
- Ao detectar `.png`/`.jpeg` fora de `playwright/` na raiz, executar limpeza imediata

## Enforcement

- **Violação:** Salvar screenshot fora de `playwright/{categoria}/`
- **Correção:** Mover arquivo para categoria correta + reportar ao usuário
- **Prevenção:** Sempre construir o `filename` começando com `playwright/{categoria}/` antes da chamada

### Hook Automático (PreToolUse)

A regra é **bloqueante por hook** — registrado em `.claude/settings.json`:

```json
"hooks": {
  "PreToolUse": [
    { "matcher": "mcp__playwright__browser_take_screenshot",
      "hooks": [{ "type": "command", "command": "node .claude/hooks/playwright-filename-guard.js" }] }
  ]
}
```

O hook `.claude/hooks/playwright-filename-guard.js` valida o parâmetro `filename` antes da chamada e BLOQUEIA (exit 2) qualquer um destes cenários:

| Cenário | Mensagem | Sugestão |
|---------|----------|----------|
| `filename` ausente | "salvaria em `.playwright-mcp/` (órfão)" | `playwright/screenshots/captura.png` |
| Sem prefixo `playwright/` | "não começa com `playwright/{categoria}/`" | `playwright/screenshots/{base}` |
| Sem subpasta de categoria | "faltou subpasta de categoria" | `playwright/screenshots/{base}` |
| Path absoluto ou `..` | "path traversal não é permitido" | rebase em `playwright/screenshots/` |
| Extensão fora de `.png/.jpg/.jpeg` | "extensão inválida" | troca para `.png` |

Quando o hook bloqueia, o stderr é injetado no contexto do modelo — Claude vê o motivo + sugestão e refaz a chamada com o `filename` correto.

**Fail-open:** se stdin/JSON malformado, o hook sai com exit 0 (não bloqueia trabalho não relacionado).
