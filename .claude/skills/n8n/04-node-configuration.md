# 04 - n8n Node Configuration

## Visao Geral
Guia de configuracao operation-aware para nodes n8n. Diferentes operacoes requerem diferentes campos. get_node com detail: "standard" e o padrao recomendado (cobre 95% dos casos com 1-2K tokens).

## Conceitos Core

### Configuracao Operation-Aware
Cada node tem resources e operations. Campos disponiveis mudam conforme a operacao selecionada.
Exemplo Slack:
- resource: "message", operation: "send" -> requer channel, text
- resource: "message", operation: "update" -> requer channel, messageId, text

### Property Dependencies
Campos aparecem/desaparecem baseados em outros valores.
Exemplo HTTP Request:
- method: "GET" -> sem body options
- method: "POST" -> mostra sendBody, contentType, body
- sendBody: true -> mostra contentType
- contentType: "json" -> mostra jsonBody field

### Progressive Discovery
Tres niveis de detalhe para obter informacao:
1. standard (padrao, 1-2K tokens) - operacoes e propriedades comuns
2. full (3-8K tokens) - schema completo, usar com moderacao
3. search_properties - buscar campos especificos com propertyQuery

## Workflow de Configuracao (8 passos)

1. Identificar o tipo de node necessario
2. search_nodes para encontrar o node
3. get_node com detail standard para ver operacoes
4. Identificar resource e operation desejados
5. Configurar campos obrigatorios
6. validate_node com profile runtime
7. Corrigir erros e re-validar
8. Deploy no workflow

## Niveis de Detalhe

### Standard Detail (padrao, 1-2K tokens)
get_node({nodeType: "nodes-base.slack"})
- Lista de operations disponiveis
- Propriedades mais comuns
- Suficiente para 95% dos cenarios

### Full Detail (3-8K tokens)
get_node({nodeType: "nodes-base.slack", detail: "full"})
- Schema completo com todos os nested options
- Usar apenas para debug complexo ou quando precisa ver TODAS as opcoes

### Search Properties Mode
get_node({nodeType: "nodes-base.httpRequest", mode: "search_properties", propertyQuery: "auth"})
- Localizar campos especificos sem baixar tudo
- Eficiente para buscar configuracao de autenticacao, body, headers, etc.

## Property Dependencies (displayOptions)

### Padrao 1: Boolean Toggle
```
campo_principal: true -> mostra campo_dependente
campo_principal: false -> esconde campo_dependente
```
Exemplo: sendBody: true -> mostra contentType e body

### Padrao 2: Operation Switch
```
operation: "send" -> mostra campos de envio
operation: "update" -> mostra campos de update
operation: "delete" -> mostra campos de delete
```

### Padrao 3: Type Selection
```
contentType: "json" -> mostra jsonBody
contentType: "form" -> mostra formParameters
contentType: "raw" -> mostra rawBody
```

## Padroes Comuns de Nodes

### 1. Resource/Operation Nodes (Slack, Google Sheets, Airtable)
- Sempre tem resource + operation
- Campos mudam por operacao
- Exemplo Slack:
  - resource: "message"
  - operation: "send"
  - channel: "#general" (obrigatorio)
  - text: "Hello" (obrigatorio)

### 2. HTTP-Based Nodes (HTTP Request)
- method: GET/POST/PUT/PATCH/DELETE
- url: endpoint
- authentication: None/predefinedCredentialType/genericCredentialType
- sendBody (POST/PUT/PATCH): true/false
- contentType: json/form/raw
- sendHeaders: true/false
- sendQuery: true/false

### 3. Database Nodes (Postgres, MySQL, MongoDB)
- operation: select/insert/update/upsert/delete
- table: nome da tabela
- columns/fields: campos a serem usados
- where: condicoes de filtro

### 4. Conditional Logic Nodes (IF, Switch, Merge)
- IF: conditions com rules (value1, operation, value2)
  - Binary operators (equals, contains): NAO usar singleValue
  - Unary operators (isEmpty, isNotEmpty): DEVE ter singleValue: true
- Switch: rules com routing
  - Usar case=N para smart connections
- Merge: mode (append, combine, chooseBranch)

## Exemplos de Configuracao

### Slack - Enviar Mensagem
```json
{
  "resource": "message",
  "operation": "send",
  "channel": { "value": "#general", "mode": "name" },
  "text": "Hello from n8n!",
  "otherOptions": {}
}
```

### HTTP Request - GET
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "authentication": "none",
  "sendHeaders": false,
  "sendQuery": false
}
```

### HTTP Request - POST com JSON Body
```json
{
  "method": "POST",
  "url": "https://api.example.com/data",
  "authentication": "none",
  "sendBody": true,
  "contentType": "json",
  "jsonBody": "{\"key\": \"value\"}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {"name": "Content-Type", "value": "application/json"}
    ]
  }
}
```

### IF Node - Condicao
```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "id": "uuid-aqui",
        "leftValue": "={{$json.body.status}}",
        "rightValue": "active",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }
    ],
    "combinator": "and"
  },
  "options": {}
}
```

## 8 Tipos de Conexao AI

Para AI Agent workflows (@n8n/n8n-nodes-langchain.*):
1. ai_agent - Conexao principal do agente
2. ai_tool - Ferramentas que o AI pode usar
3. ai_memory - Memoria de conversacao
4. ai_document - Documentos para RAG
5. ai_embedding - Modelos de embedding
6. ai_languageModel - LLM (OpenAI, Anthropic, etc.)
7. ai_outputParser - Parser de output
8. ai_retriever - Retriever para busca

## Anti-Patterns

### Anti-Pattern 1: Adivinhar campos
ERRADO: Configurar node sem consultar get_node
CORRETO: Sempre verificar operacoes e campos disponiveis primeiro

### Anti-Pattern 2: Usar detail full sempre
ERRADO: get_node({nodeType: "nodes-base.X", detail: "full"}) por padrao
CORRETO: Comecar com standard, usar full so quando necessario

### Anti-Pattern 3: Ignorar dependencies
ERRADO: Configurar sendBody sem contentType
CORRETO: Sempre configurar campos dependentes quando o campo pai esta ativo

## Boas Praticas

### FAZER:
- Comecar com get_node detail standard
- Verificar operacoes disponiveis antes de configurar
- Respeitar property dependencies
- Validar com profile runtime apos configurar
- Usar search_properties para campos especificos

### NAO FAZER:
- Usar detail full sem necessidade
- Adivinhar campos sem consultar documentacao
- Ignorar dependencies de campos
- Pular validacao apos configuracao
- Hardcodar credenciais em parametros (usar credentials system)
