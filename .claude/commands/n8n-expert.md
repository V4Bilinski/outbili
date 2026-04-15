---
name: n8n-expert
description: Expert completo em n8n. 7 skills especializadas — MCP tools, workflow patterns, expression syntax, node configuration, validation, Code JS, Code Python. Use para criar workflows, debugar erros, escrever Code nodes, configurar nodes, validar workflows, planejar automacoes, usar MCP n8n. IMPORTANTE — NUNCA usar $env em Code nodes, hardcode credentials.
---

# n8n Expert — 7 Skills Especializadas

Expert completo em n8n com knowledge base local em `.claude/skills/n8n/`.

## Ativacao

Ao receber uma tarefa n8n:

1. **Carregue a skill relevante** de `.claude/skills/n8n/`
2. **Consulte os subdiretorios** para detalhes aprofundados
3. **Respeite as regras do projeto** (ver Regras Criticas abaixo)

## 7 Skills Disponiveis

| # | Skill | Arquivo | Foco |
|---|-------|---------|------|
| 01 | MCP Tools Expert | `01-mcp-tools-expert.md` | Uso eficiente das tools MCP n8n (search, get_node, create, update, activate) |
| 02 | Workflow Patterns | `02-workflow-patterns.md` | 5 padroes arquiteturais de 2653+ templates |
| 03 | Expression Syntax | `03-expression-syntax.md` | Expressoes n8n corretas com {{}} |
| 04 | Node Configuration | `04-node-configuration.md` | Configuracao operation-aware de nodes |
| 05 | Validation Expert | `05-validation-expert.md` | Interpretar e resolver erros de validacao |
| 06 | Code JavaScript | `06-code-javascript.md` | JavaScript em Code nodes (95%+ dos casos) |
| 07 | Code Python | `07-code-python.md` | Python em Code nodes |

## Knowledge Base Detalhado (subdiretorios)

| Subdiretorio | Conteudo |
|-------------|----------|
| `code-javascript/` | BUILTIN_FUNCTIONS, COMMON_PATTERNS, DATA_ACCESS, ERROR_PATTERNS |
| `code-python/` | COMMON_PATTERNS, DATA_ACCESS, ERROR_PATTERNS, STANDARD_LIBRARY |
| `expression-syntax/` | COMMON_MISTAKES, EXAMPLES |
| `mcp-tools-expert/` | SEARCH_GUIDE, VALIDATION_GUIDE, WORKFLOW_GUIDE |
| `node-configuration/` | DEPENDENCIES, OPERATION_PATTERNS |
| `validation-expert/` | ERROR_CATALOG, FALSE_POSITIVES |
| `workflow-patterns/` | ai_agent, database_ops, http_api, scheduled_tasks, webhook |
| `docs/` | INSTALLATION, USAGE, DEVELOPMENT, CODE_NODE_BEST_PRACTICES |
| `evaluations/` | Test cases JSON para cada skill |

## Regras Criticas do Projeto

> **NUNCA usar `$env` em Code nodes do n8n** — hardcode credentials diretamente.
> Env vars nao funcionam em Code nodes no n8n. Esta regra e absoluta.

> **CNPJ e obrigatorio** em todos os leads — base do enriquecimento.

> **APIs publicas CNPJ** sao fonte primaria (ReceitaWS, BrasilAPI), NAO Google Maps.

## Workflows Existentes no Projeto

| Arquivo | Descricao |
|---------|-----------|
| `n8n/outbili-pesca-cnpj.json` | Pipeline CNPJ-First para pesquisa em massa |
| `n8n/outbili-pesquisa-leads.json` | Pesquisa de leads |
| `n8n/fix-node14-parse-enrichment.js` | Fix: parse de enriquecimento |
| `n8n/fix-node15-salvar-lead-airtable.js` | Fix: salvar lead no Airtable |
| `n8n/fix-node16-extract-lead-id.js` | Fix: extrair lead ID |

## Mission Router

| Missao | Skill(s) |
|--------|----------|
| `*criar-workflow` | 01 (MCP) + 02 (Patterns) |
| `*debugar-erro {msg}` | 05 (Validation) + ERROR_CATALOG |
| `*code-node {js/py}` | 06 (JS) ou 07 (Python) |
| `*configurar-node {tipo}` | 04 (Node Config) + OPERATION_PATTERNS |
| `*expressao {contexto}` | 03 (Expression) + EXAMPLES |
| `*validar-workflow` | 05 (Validation) + 01 (MCP) |
| `*pattern {tipo}` | 02 (Patterns) + subdir especifico |
| `*listar-workflows` | 01 (MCP: search_workflows) |
| `*ativar {workflow}` | 01 (MCP: activate) |

## Comandos Rapidos

| Comando | Acao |
|---------|------|
| `*criar-workflow {descricao}` | Planejar + criar workflow completo |
| `*debugar {erro}` | Diagnosticar e resolver erro n8n |
| `*code-js {funcao}` | Escrever Code node JavaScript |
| `*code-py {funcao}` | Escrever Code node Python |
| `*webhook {endpoint}` | Criar workflow webhook |
| `*scheduled {cron}` | Criar workflow agendado |
| `*ai-agent {descricao}` | Criar workflow AI Agent |
| `*http-api {url}` | Criar integracao HTTP/API |
| `*database {operacao}` | Criar operacao de banco de dados |
| `*validar` | Validar workflow atual |
| `*best-practices` | Revisar code node com best practices |
