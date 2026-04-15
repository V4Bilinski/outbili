# 01 - n8n MCP Tools Expert

> **PRIORIDADE MAXIMA** - Este e o guia de referencia principal para uso eficiente das ferramentas MCP do n8n.
> Consulte este documento ANTES de utilizar qualquer tool do n8n-mcp.

---

## Visao Geral

Este guia abrange o uso eficiente de todas as ferramentas MCP (Model Context Protocol) disponibilizadas pelo servidor n8n-mcp. O objetivo e garantir a selecao correta de tools, o uso adequado de parametros, e a aplicacao dos padroes mais eficientes para construcao, validacao e gerenciamento de workflows n8n.

As ferramentas MCP do n8n se dividem em categorias funcionais: descoberta de nodes, inspecao detalhada, validacao, gerenciamento de workflows, templates e ferramentas de auto-ajuda. Cada categoria possui tempos de resposta, formatos de entrada e padroes de uso especificos que devem ser respeitados para maximizar eficiencia e minimizar erros.

**Principios fundamentais:**
- Sempre comecar com `search_nodes` para descobrir nodes disponveis
- Usar `detail: "standard"` como padrao (cobre ~95% dos cenarios)
- Validar SEMPRE antes de ativar workflows
- Respeitar os formatos de `nodeType` conforme o contexto (search vs workflow)
- Incluir `intent` em toda operacao de update

---

## Categorias de Tools

### 1. Node Discovery (`search_nodes`, `get_node`)

#### search_nodes

Ferramenta de busca para encontrar nodes disponiveis no ecossistema n8n.

**Parametros:**
| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `query` | string | Sim | Termo de busca (ex: "slack", "http request", "email") |
| `mode` | string | Nao | Modo de busca: `OR` (padrao, mais resultados), `AND` (mais preciso), `FUZZY` (tolerante a erros de digitacao) |
| `limit` | number | Nao | Numero maximo de resultados (padrao: 20) |
| `source` | string | Nao | Filtro de origem: `all` (padrao), `core`, `community`, `verified` |
| `includeExamples` | boolean | Nao | Se `true`, inclui exemplos de uso nos resultados |

**Retorno:**
- `nodeType` - Formato curto para uso em tools de search/validate (ex: `nodes-base.slack`)
- `workflowNodeType` - Formato completo para uso em workflows (ex: `n8n-nodes-base.slack`)
- `displayName` - Nome amigavel do node
- `description` - Descricao do que o node faz
- `category` - Categoria funcional (ex: Communication, Data Transformation)
- `relevance` - Score de relevancia da busca

**Performance:** < 20ms por consulta. Extremamente rapido, pode ser usado livremente sem preocupacao com latencia.

**Exemplo de uso:**
```json
search_nodes({
  "query": "slack",
  "mode": "OR",
  "limit": 5,
  "source": "core"
})
```

**Dicas:**
- Use `mode: "FUZZY"` quando o usuario digitar nomes aproximados (ex: "slak" em vez de "slack")
- Use `mode: "AND"` quando precisar combinar termos especificos (ex: "google sheets")
- Comece sempre com `source: "core"` para priorizar nodes oficiais
- O campo `workflowNodeType` ja vem no formato correto para uso direto em workflows

---

### 2. get_node - Niveis de Detalhe (Detail Levels)

O `get_node` e a ferramenta para inspecionar a estrutura, propriedades e operacoes de um node especifico. O parametro `detail` controla a quantidade de informacao retornada.

#### detail: "minimal" (~200 tokens)
- Retorna apenas metadados basicos: nome, descricao, categoria, versao
- **Quando usar:** Apenas para confirmar que um node existe ou obter informacoes basicas
- **Quando NAO usar:** Quando precisar saber quais operacoes o node suporta

#### detail: "standard" (~1-2K tokens) - PADRAO RECOMENDADO
- Retorna operacoes disponiveis + propriedades comuns
- **Cobre ~95% dos cenarios de uso**
- Inclui: lista de operacoes, campos obrigatorios, tipos de dados, opcoes de configuracao comuns
- **Quando usar:** Na grande maioria dos casos. Este deve ser o padrao.
- **Quando NAO usar:** Apenas quando precisar de schema completo para configuracoes muito especificas

#### detail: "full" (~3-8K tokens)
- Retorna o schema completo do node com todas as propriedades, condicoes e dependencias
- **Usar com PARCIMONIA** - consome significativamente mais tokens
- **Quando usar:** Configuracoes complexas, debug de problemas especificos, propriedades condicionais raras
- **Quando NAO usar:** Na maioria dos cenarios. Evite como padrao.

**Regra de ouro:** Comece SEMPRE com `detail: "standard"`. Escale para `"full"` apenas se as informacoes retornadas forem insuficientes.

---

### 3. get_node - Modos de Operacao (Modes)

O parametro `mode` do `get_node` determina o tipo de informacao retornada:

#### mode: "info" (padrao)
- Retorna o schema do node no nivel de detalhe especificado
- Uso mais comum para entender a estrutura e propriedades do node
```json
get_node({"nodeType": "nodes-base.slack", "mode": "info"})
```

#### mode: "docs"
- Retorna documentacao legivel em formato Markdown
- Ideal para entender o comportamento do node em linguagem natural
- Inclui descricoes detalhadas, exemplos e notas de uso
```json
get_node({"nodeType": "nodes-base.slack", "mode": "docs"})
```

#### mode: "search_properties"
- Localiza propriedades especificas dentro do schema do node
- **Requer** o parametro `propertyQuery` para especificar o que buscar
- Util quando voce sabe o nome da propriedade mas nao sua localizacao no schema
```json
get_node({
  "nodeType": "nodes-base.slack",
  "mode": "search_properties",
  "propertyQuery": "channel"
})
```

#### mode: "versions"
- Lista todas as versoes do node com suas mudancas
- Inclui breaking changes e notas de migracao
```json
get_node({"nodeType": "nodes-base.slack", "mode": "versions"})
```

#### mode: "compare"
- Compara duas versoes especificas de um node
- Util para entender o que mudou entre versoes
```json
get_node({"nodeType": "nodes-base.slack", "mode": "compare", "version1": 1, "version2": 2})
```

#### mode: "breaking"
- Retorna apenas as breaking changes do node
- Focado em mudancas que podem quebrar workflows existentes
```json
get_node({"nodeType": "nodes-base.slack", "mode": "breaking"})
```

#### mode: "migrations"
- Retorna apenas as mudancas auto-migraveis
- Mostra quais alteracoes o n8n consegue aplicar automaticamente
```json
get_node({"nodeType": "nodes-base.slack", "mode": "migrations"})
```

---

## Formato nodeType - CRITICO

> **ATENCAO:** O formato errado do `nodeType` e a causa #1 de erros. Existem DOIS formatos distintos e cada um deve ser usado no contexto correto.

### Formato Curto (para tools de search e validate)

Usado em: `search_nodes`, `get_node`, `validate_node`

```
nodes-base.slack
nodes-base.httpRequest
nodes-base.webhook
nodes-base.if
nodes-base.switch
nodes-base.set
nodes-base.code
nodes-base.merge
nodes-langchain.agent
nodes-langchain.chainLlm
nodes-langchain.toolWorkflow
```

### Formato Completo (para tools de workflow)

Usado em: `n8n_create_workflow`, `n8n_update_partial_workflow`, dentro do JSON de workflows

```
n8n-nodes-base.slack
n8n-nodes-base.httpRequest
n8n-nodes-base.webhook
n8n-nodes-base.if
n8n-nodes-base.switch
n8n-nodes-base.set
n8n-nodes-base.code
n8n-nodes-base.merge
@n8n/n8n-nodes-langchain.agent
@n8n/n8n-nodes-langchain.chainLlm
@n8n/n8n-nodes-langchain.toolWorkflow
```

### Conversao Entre Formatos

O `search_nodes` retorna AMBOS os formatos em cada resultado:
- `nodeType` -> Formato curto (para search/validate)
- `workflowNodeType` -> Formato completo (para workflows)

**Regra de conversao manual:**
- Nodes base: `nodes-base.X` -> `n8n-nodes-base.X`
- Nodes langchain: `nodes-langchain.X` -> `@n8n/n8n-nodes-langchain.X`

**NUNCA use:**
- Apenas o nome do node: ~~`"slack"`~~
- Formato completo em tools de search: ~~`get_node({nodeType: "n8n-nodes-base.slack"})`~~
- Formato curto em workflows: ~~`{type: "nodes-base.slack"}`~~

---

## Validation Tools

### validate_node

Valida a configuracao de um node individual antes de inseri-lo em um workflow.

**Parametros:**
| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `nodeType` | string | Sim | Tipo do node (formato curto) |
| `config` | object | Sim | Configuracao do node a ser validada |
| `mode` | string | Nao | `minimal` (< 50ms, campos obrigatorios) ou `full` (< 100ms, validacao abrangente) |
| `profile` | string | **Sim*** | Perfil de validacao (ver abaixo) |

*Tecnicamente opcional, mas **SEMPRE especifique explicitamente**.

**Perfis de Validacao:**

| Perfil | Descricao | Quando Usar |
|--------|-----------|-------------|
| `minimal` | Verifica apenas campos obrigatorios | Validacao rapida durante desenvolvimento |
| `runtime` | **RECOMENDADO** - Simula validacao de execucao | Padrao para a maioria dos cenarios |
| `ai-friendly` | Otimizado para mensagens de erro claras | Quando precisar de feedback legivel |
| `strict` | Validacao mais rigorosa possivel | Antes de deploy em producao |

**Exemplo:**
```json
validate_node({
  "nodeType": "nodes-base.slack",
  "config": {
    "resource": "message",
    "operation": "send",
    "channelId": "#general",
    "text": "Hello!"
  },
  "mode": "full",
  "profile": "runtime"
})
```

**IMPORTANTE:** Sempre especifique o `profile`. Sem ele, a validacao pode usar um perfil padrao que nao atende suas necessidades.

---

### validate_workflow

Valida um workflow completo, incluindo nodes, conexoes, expressoes e estrutura.

**Tempo de resposta:** 100-500ms (depende do tamanho do workflow)

**O que valida:**
- Configuracao individual de cada node
- Integridade das conexoes entre nodes
- Expressoes e referencias entre nodes
- Estrutura geral do workflow (trigger presente, fluxo coerente)
- Credenciais referenciadas

**Quando usar:** Apos CADA modificacao significativa no workflow. Nao espere finalizar todo o workflow para validar.

**Exemplo:**
```json
validate_workflow({
  "workflowId": "abc123"
})
```

---

## Workflow Management Tools

### n8n_create_workflow (100-500ms)

Cria um novo workflow no n8n.

**Parametros obrigatorios:**
- `name` - Nome descritivo do workflow
- `nodes` - Array de objetos de nodes
- `connections` - Objeto definindo as conexoes entre nodes

**Comportamento importante:**
- O workflow e criado **INATIVO** por padrao (seguranca)
- **Auto-sanitizacao** e executada automaticamente em todos os nodes
- Para ativar, use `n8n_update_partial_workflow` com operacao `activateWorkflow`

**Exemplo:**
```json
n8n_create_workflow({
  "name": "Notificacao Slack via Webhook",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "notify",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Send Slack",
      "type": "n8n-nodes-base.slack",
      "position": [500, 300],
      "parameters": {
        "resource": "message",
        "operation": "send",
        "channel": "#notifications",
        "text": "={{ $json.message }}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{"node": "Send Slack", "type": "main", "index": 0}]]
    }
  }
})
```

---

### n8n_update_partial_workflow (50-200ms) - TOOL MAIS UTILIZADA

> **Estatisticas de uso:** 38.287 utilizacoes com 99% de taxa de sucesso. Esta e de longe a ferramenta mais importante do ecossistema.

Realiza modificacoes parciais em um workflow existente, sem precisar reenviar o workflow completo.

**17 tipos de operacao disponiveis:**

#### Operacoes de Node (6):
| Operacao | Descricao |
|----------|-----------|
| `addNode` | Adiciona um novo node ao workflow |
| `deleteNode` | Remove um node existente |
| `updateNode` | Atualiza propriedades de um node |
| `moveNode` | Altera a posicao visual de um node |
| `enableNode` | Habilita um node desabilitado |
| `disableNode` | Desabilita um node (mantendo no workflow) |

#### Operacoes de Conexao (5):
| Operacao | Descricao |
|----------|-----------|
| `addConnection` | Cria uma conexao entre dois nodes |
| `removeConnection` | Remove uma conexao existente |
| `cleanStaleConnections` | Remove conexoes orfas/invalidas |
| `addAiConnection` | Cria conexao de tipo AI (8 tipos) |
| `removeAiConnection` | Remove conexao AI |

#### Operacoes de Metadados (4):
| Operacao | Descricao |
|----------|-----------|
| `renameWorkflow` | Altera o nome do workflow |
| `updateSettings` | Atualiza configuracoes do workflow |
| `addTags` | Adiciona tags ao workflow |
| `removeTags` | Remove tags do workflow |

#### Operacoes de Ativacao (2):
| Operacao | Descricao |
|----------|-----------|
| `activateWorkflow` | Ativa o workflow para execucao |
| `deactivateWorkflow` | Desativa o workflow |

**Parametro `intent` - OBRIGATORIO na pratica:**
Sempre inclua o parametro `intent` descrevendo o proposito da modificacao. Isso melhora o rastreamento e debugging.

**Smart Parameters - USE SEMPRE que aplicavel:**
- `branch`: Para nodes IF, use `"true"` ou `"false"` em vez de `sourceIndex`
- `case`: Para nodes Switch, use o numero do caso (0, 1, 2...) em vez de `sourceIndex`

**Conexoes AI (8 tipos com `sourceOutput`):**
- `ai_languageModel` - Modelo de linguagem
- `ai_tool` - Ferramenta para o agente
- `ai_memory` - Memoria do agente
- `ai_outputParser` - Parser de saida
- `ai_retriever` - Retriever para RAG
- `ai_textSplitter` - Divisor de texto
- `ai_embedding` - Modelo de embedding
- `ai_document` - Loader de documento

**Exemplo completo:**
```json
n8n_update_partial_workflow({
  "id": "workflow-123",
  "intent": "Adicionar tratamento de erro com notificacao Slack",
  "operations": [
    {
      "type": "addNode",
      "node": {
        "name": "Error Handler",
        "type": "n8n-nodes-base.slack",
        "position": [700, 500],
        "parameters": {
          "resource": "message",
          "operation": "send",
          "channel": "#errors",
          "text": "Erro no workflow: {{ $json.error.message }}"
        }
      }
    },
    {
      "type": "addConnection",
      "source": "IF",
      "target": "Error Handler",
      "branch": "false"
    }
  ]
})
```

---

### n8n_deploy_template (200-500ms)

Faz deploy de um template do repositorio n8n.io diretamente para sua instancia.

**Parametros:**
| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `templateId` | number | Sim | ID do template no n8n.io |
| `name` | string | Nao | Nome customizado (usa nome do template se omitido) |
| `autoFix` | boolean | Nao | Aplicar correcoes automaticas |
| `autoUpgradeVersions` | boolean | Nao | Atualizar versoes dos nodes automaticamente |

**Retorno:**
- ID do workflow criado
- Lista de credenciais necessarias (que precisam ser configuradas manualmente)
- Correcoes aplicadas automaticamente (se `autoFix: true`)

**Exemplo:**
```json
n8n_deploy_template({
  "templateId": 1234,
  "name": "Meu Workflow Customizado",
  "autoFix": true,
  "autoUpgradeVersions": true
})
```

---

### n8n_test_workflow

Executa um teste do workflow, detectando automaticamente o tipo de trigger.

**Parametros:**
| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `workflowId` | string | Sim | ID do workflow a testar |
| `data` | object | Nao | Dados de teste para enviar ao trigger |
| `headers` | object | Nao | Headers HTTP customizados |
| `method` | string | Nao | Metodo HTTP (GET, POST, etc.) |
| `timeout` | number | Nao | Timeout em milissegundos |

**Deteccao automatica de trigger:**
- Webhook -> Envia requisicao HTTP
- Form Trigger -> Simula submissao de formulario
- Chat Trigger -> Simula mensagem de chat

---

### n8n_workflow_versions

Gerenciamento de versoes do workflow.

**Modos:**
| Modo | Descricao |
|------|-----------|
| `list` | Lista todas as versoes salvas |
| `get` | Obtem uma versao especifica |
| `rollback` | Reverte para uma versao anterior |
| `delete` | Remove uma versao especifica |
| `prune` | Remove versoes antigas mantendo as N mais recentes |

---

## Template Tools

### search_templates

Busca templates no repositorio n8n.io com multiplos modos de pesquisa.

**Modos de busca (`searchMode`):**

#### keyword (padrao)
Busca por palavras-chave.
```json
search_templates({"searchMode": "keyword", "query": "slack notification", "limit": 10})
```

#### by_nodes
Busca templates que usam nodes especificos.
```json
search_templates({"searchMode": "by_nodes", "nodeTypes": ["nodes-base.slack", "nodes-base.webhook"]})
```

#### by_task
Busca por tipo de tarefa.
```json
search_templates({"searchMode": "by_task", "task": "webhook_processing"})
```
Tarefas disponiveis: `webhook_processing`, `data_transformation`, `scheduled_sync`, `error_handling`, `api_integration`, entre outras.

#### by_metadata
Busca por criterios de metadados.
```json
search_templates({
  "searchMode": "by_metadata",
  "complexity": "beginner",
  "maxSetupMinutes": 10,
  "targetAudience": "developer"
})
```

---

### get_template

Obtem detalhes completos de um template especifico.

**Parametros:**
| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `templateId` | number | Sim | ID do template |
| `mode` | string | Nao | Nivel de detalhe |

**Modos:**
| Modo | Descricao |
|------|-----------|
| `nodes_only` | Apenas lista de nodes usados |
| `structure` | Estrutura do workflow (nodes + conexoes) |
| `full` | JSON completo do workflow, pronto para deploy |

---

## Padroes de Uso

### Padrao 1: Node Discovery (mais comum, ~18s entre steps)

Este e o fluxo mais frequente. Use-o sempre que precisar descobrir e entender um node.

```
Passo 1: Descoberta
search_nodes({query: "slack"})
-> Retorna: nodeType: "nodes-base.slack", workflowNodeType: "n8n-nodes-base.slack"

Passo 2: Inspecao (standard e suficiente)
get_node({nodeType: "nodes-base.slack"})
-> Retorna: operacoes, propriedades comuns, campos obrigatorios

Passo 3: Documentacao (se necessario)
get_node({nodeType: "nodes-base.slack", mode: "docs"})
-> Retorna: documentacao legivel em Markdown
```

**Tempo medio entre passos:** ~18 segundos (tempo para analise e decisao).

---

### Padrao 2: Validation Loop (~23s analise + ~58s correcao)

Ciclo iterativo de validacao e correcao.

```
Passo 1: Validar
validate_node({
  nodeType: "nodes-base.slack",
  config: { ... },
  profile: "runtime"
})

Passo 2: Analisar erros (~23s)
-> Ler mensagens de erro retornadas
-> Identificar campos faltantes ou invalidos

Passo 3: Corrigir (~58s)
-> Ajustar configuracao baseado nos erros
-> Corrigir tipos de dados, campos obrigatorios, formatos

Passo 4: Re-validar
-> Repetir Passo 1 ate que a validacao retorne sucesso
```

**Dica:** Use `profile: "ai-friendly"` se as mensagens de erro nao estiverem claras o suficiente.

---

### Padrao 3: Workflow Editing (~56s medio entre edits)

Construcao iterativa de workflows.

```
Passo 1: Adicionar node
n8n_update_partial_workflow({
  id: "wf-123",
  intent: "Adicionar node de processamento de dados",
  operations: [{type: "addNode", node: {...}}]
})

~56 segundos de intervalo...

Passo 2: Conectar nodes
n8n_update_partial_workflow({
  id: "wf-123",
  intent: "Conectar trigger ao processador",
  operations: [{type: "addConnection", source: "Trigger", target: "Processor"}]
})

Passo 3: Validar workflow completo
validate_workflow({workflowId: "wf-123"})

Passo 4: Ativar (se validacao passou)
n8n_update_partial_workflow({
  id: "wf-123",
  intent: "Ativar workflow apos validacao bem-sucedida",
  operations: [{type: "activateWorkflow"}]
})
```

**Importante:** A media de 56 segundos entre edits reflete o tempo necessario para analise, decisao e formulacao da proxima operacao. Nao tente apressar este processo.

---

## Erros Comuns

### Erro 1: Formato nodeType errado

O erro mais frequente. Formatos incorretos causam falha silenciosa ou erros confusos.

```
ERRADO (nome simples):
get_node({nodeType: "slack"})
-> Erro: node nao encontrado

ERRADO (formato completo em tool de search):
get_node({nodeType: "n8n-nodes-base.slack"})
-> Erro: formato invalido para esta tool

CORRETO:
get_node({nodeType: "nodes-base.slack"})
-> Sucesso: retorna schema do node
```

---

### Erro 2: Uso desnecessario de detail="full"

Desperdicar tokens com detalhes desnecessarios.

```
ERRADO (3-8K tokens sem necessidade):
get_node({nodeType: "nodes-base.slack", detail: "full"})
-> Retorna schema completo com todas as propriedades condicionais

CORRETO (1-2K tokens, cobre 95% dos casos):
get_node({nodeType: "nodes-base.slack"})
-> Retorna operacoes e propriedades comuns (detail: "standard" e o padrao)
```

**Escale para `"full"` apenas quando:** precisar de propriedades condicionais raras, debug de configuracoes complexas, ou schema completo para validacao rigorosa.

---

### Erro 3: Omitir profile de validacao

Validacao sem perfil explicito pode usar padrao inadequado.

```
ERRADO (sem profile):
validate_node({nodeType: "nodes-base.slack", config: {...}})
-> Usa perfil padrao que pode nao ser adequado

CORRETO (profile explicito):
validate_node({
  nodeType: "nodes-base.slack",
  config: {...},
  profile: "runtime"
})
-> Validacao consistente e previsivel
```

---

### Erro 4: Ignorar auto-sanitizacao

A auto-sanitizacao e aplicada AUTOMATICAMENTE em TODOS os nodes durante QUALQUER operacao de update/create de workflow.

**O que a auto-sanitizacao faz:**
- Corrige operadores binarios: remove `singleValue` onde nao se aplica
- Corrige operadores unarios: adiciona `singleValue: true` onde necessario
- Normaliza formatos de dados

**O que a auto-sanitizacao NAO corrige:**
- Conexoes quebradas entre nodes
- Incompatibilidades de branch (IF/Switch conectados incorretamente)
- Credenciais invalidas ou ausentes

**Implicacao:** Nao se preocupe em corrigir manualmente operadores binarios/unarios. A sanitizacao cuida disso. Mas SEMPRE valide conexoes e branches manualmente.

---

### Erro 5: Ignorar Smart Parameters

Smart parameters simplificam a especificacao de conexoes para nodes com multiplas saidas.

```
ERRADO (usando sourceIndex numerico):
{
  type: "addConnection",
  source: "IF",
  target: "Error Handler",
  sourceIndex: 0
}
-> Fragil, numeros podem mudar entre versoes

CORRETO (usando smart parameter branch):
{
  type: "addConnection",
  source: "IF",
  target: "Error Handler",
  branch: "true"
}
-> Semanticamente claro e estavel

CORRETO (para Switch com smart parameter case):
{
  type: "addConnection",
  source: "Switch",
  target: "Case Handler",
  case: 0
}
-> Referencia direta ao caso especifico
```

---

### Erro 6: Omitir intent parameter

Updates sem `intent` perdem rastreabilidade e contexto.

```
ERRADO (sem intent):
n8n_update_partial_workflow({
  id: "wf-123",
  operations: [{type: "addNode", node: {...}}]
})
-> Funciona, mas sem contexto do proposito

CORRETO (com intent):
n8n_update_partial_workflow({
  id: "wf-123",
  intent: "Adicionar tratamento de erro para falhas de API",
  operations: [{type: "addNode", node: {...}}]
})
-> Proposito documentado, facilita debug e historico
```

---

## Tool Availability Matrix

### Sempre Disponiveis (sem necessidade de API)

Estas tools funcionam localmente, sem conexao com uma instancia n8n:

| Tool | Descricao |
|------|-----------|
| `search_nodes` | Busca de nodes disponiveis |
| `get_node` | Inspecao detalhada de nodes |
| `validate_node` | Validacao de configuracao de nodes |
| `validate_workflow` | Validacao local de estrutura de workflow |
| `search_templates` | Busca de templates |
| `get_template` | Detalhes de templates |
| `tools_documentation` | Documentacao das proprias tools |
| `ai_agents_guide` | Guia para construcao de agentes AI |

### Requerem Configuracao de API (N8N_API_URL + N8N_API_KEY)

Estas tools interagem diretamente com uma instancia n8n em execucao:

| Tool | Descricao |
|------|-----------|
| `n8n_create_workflow` | Criar workflows |
| `n8n_update_partial_workflow` | Editar workflows parcialmente |
| `n8n_validate_workflow` (por ID) | Validar workflow na instancia |
| `n8n_list_workflows` | Listar workflows existentes |
| `n8n_get_workflow` | Obter workflow completo |
| `n8n_test_workflow` | Testar workflow |
| `n8n_executions` | Historico de execucoes |
| `n8n_deploy_template` | Deploy de template |
| `n8n_workflow_versions` | Gerenciamento de versoes |
| `n8n_autofix_workflow` | Correcao automatica de problemas |

**Para verificar disponibilidade:** Use `n8n_health_check()` para confirmar a conectividade com a API.

---

## Performance

Tempos de resposta esperados por tool para planejamento adequado:

| Tool | Tempo de Resposta | Tamanho do Payload | Notas |
|------|-------------------|-------------------|-------|
| `search_nodes` | < 20ms | Pequeno | Extremamente rapido, use livremente |
| `get_node` (standard) | < 10ms | ~1-2KB | Padrao recomendado |
| `get_node` (full) | < 100ms | 3-8KB | Usar com parcimonia |
| `validate_node` (minimal) | < 50ms | Pequeno | Campos obrigatorios apenas |
| `validate_node` (full) | < 100ms | Medio | Validacao abrangente |
| `validate_workflow` | 100-500ms | Medio | Depende do tamanho do workflow |
| `n8n_create_workflow` | 100-500ms | Medio | Inclui auto-sanitizacao |
| `n8n_update_partial_workflow` | 50-200ms | Pequeno | Tool mais rapida para edits |
| `n8n_deploy_template` | 200-500ms | Medio | Inclui download do template |

**Otimizacao:** Para workflows grandes, prefira multiplas chamadas `n8n_update_partial_workflow` em vez de recriacao completa com `n8n_create_workflow`.

---

## Self-Help Tools

### tools_documentation()

Documentacao integrada das proprias ferramentas MCP.

**Uso sem parametros:**
```json
tools_documentation()
```
Retorna overview de todas as tools disponiveis com descricao resumida.

**Uso com parametros especificos:**
```json
tools_documentation({topic: "javascript_code_node_guide", depth: "detailed"})
```

**Topics especiais disponiveis:**
- `"javascript_code_node_guide"` - Guia completo para o node Code (JavaScript)
- `"python_code_node_guide"` - Guia completo para o node Code (Python)
- Outros topics variam conforme a versao do servidor MCP

---

### ai_agents_guide()

Guia especializado para construcao de agentes AI no n8n.

**Conteudo:**
- Arquitetura de agentes (Agent node, chains, tools)
- Tipos de conexoes AI e como configura-las
- Ferramentas disponiveis para agentes
- Validacao especifica para workflows AI
- Best practices para prompts e configuracao de memoria

**Quando usar:** Sempre que for construir ou modificar workflows que envolvam o Agent node, LLM chains, ou qualquer componente do n8n-nodes-langchain.

---

### n8n_health_check()

Verifica o estado da conexao e configuracao.

**Uso rapido (sem parametros):**
```json
n8n_health_check()
```
Retorna status basico: conexao OK/FALHA, versao do n8n.

**Uso diagnostico completo:**
```json
n8n_health_check({mode: "diagnostic"})
```
Retorna:
- Status de todas as variaveis de ambiente (N8N_API_URL, N8N_API_KEY)
- Status individual de cada tool
- Conectividade com a API do n8n
- Versao do n8n e do servidor MCP
- Problemas detectados e sugestoes de correcao

**Quando usar:** No inicio de cada sessao de trabalho para confirmar que tudo esta configurado corretamente.

---

## Resumo Executivo

As 8 regras de ouro para uso eficiente das ferramentas MCP do n8n:

1. **`detail: "standard"` e suficiente** - O nivel padrao de detalhe do `get_node` atende ~95% dos cenarios. Escale para `"full"` apenas quando estritamente necessario.

2. **Formatos nodeType diferem por contexto** - Use `nodes-base.*` em tools de search/validate e `n8n-nodes-base.*` (ou `@n8n/n8n-nodes-langchain.*`) em workflows. Nunca misture.

3. **Sempre especifique profile de validacao** - Use `profile: "runtime"` como padrao no `validate_node`. Nunca deixe o profile implicito.

4. **Use smart parameters** - `branch="true"/"false"` para IF e `case=N` para Switch sao mais semanticos e estaveis que `sourceIndex` numerico.

5. **Inclua `intent` em todo update** - O parametro `intent` no `n8n_update_partial_workflow` documenta o proposito e facilita rastreamento.

6. **Auto-sanitizacao processa TODOS os nodes** - Qualquer operacao de create/update executa sanitizacao automatica. Nao corrija operadores binarios/unarios manualmente, mas SEMPRE valide conexoes.

7. **Workflows ativam via API** - Use a operacao `activateWorkflow` no `n8n_update_partial_workflow`. Workflows sao criados inativos por seguranca.

8. **Construcao e iterativa** - A media de ~56 segundos entre edits e normal. Use multiplas chamadas `n8n_update_partial_workflow` em sequencia, validando ao longo do processo.
