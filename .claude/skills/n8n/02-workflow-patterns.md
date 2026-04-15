# 02 - n8n Workflow Patterns

## Visao Geral
5 padroes arquiteturais comprovados extraidos de 2.653+ templates n8n reais. Use para planejar e construir novos workflows.

## Os 5 Padroes Core

### 1. Webhook Processing (Mais Comum - 35% dos workflows)
- Estrutura: Receber HTTP request -> Processar -> Output
- Trigger: Webhook node (POST/GET, instant response)
- Quando usar: Receber dados de sistemas externos, Slack commands, form submissions, GitHub webhooks, payment webhooks, resposta instantanea a eventos
- Exemplo basico: Webhook -> Set (mapear campos) -> Slack (postar mensagem)
- IMPORTANTE: Dados do webhook ficam em $json.body, NAO em $json diretamente

### 2. HTTP API Integration (Segundo mais comum)
- Estrutura: Buscar de APIs REST -> Transformar -> Armazenar/Usar
- Trigger: Manual ou Schedule
- Quando usar: Buscar dados de APIs externas, sincronizar com servicos terceiros, construir data pipelines
- Exemplo: Manual Trigger -> HTTP Request (GET /api/users) -> Split In Batches (100 por vez) -> Set (transformar) -> Postgres (upsert)

### 3. Database Operations
- Estrutura: Ler/Escrever/Sincronizar dados de banco
- Trigger: Schedule (a cada N minutos)
- Quando usar: Sync entre databases, queries agendadas, ETL workflows
- Exemplo: Schedule (cada 15min) -> Postgres (query novos registros) -> IF (existem registros?) -> MySQL (inserir) -> Postgres (atualizar timestamp)

### 4. AI Agent Workflow (Crescimento rapido)
- Estrutura: AI agents com tools e memoria
- Trigger: Webhook (receber mensagem de chat)
- Quando usar: Chatbots conversacionais, AI com acesso a tools, raciocinio multi-step
- Exemplo: Webhook -> AI Agent (com OpenAI Chat Model + HTTP Request Tool + Database Tool + Window Buffer Memory) -> Webhook Response
- Nodes AI: @n8n/n8n-nodes-langchain.agent, .openAi, .memoryBufferWindow, etc.
- 8 tipos de conexao AI: ai_agent, ai_tool, ai_memory, ai_document, ai_embedding, ai_languageModel, ai_outputParser, ai_retriever

### 5. Scheduled Tasks (28% dos workflows)
- Estrutura: Automacao recorrente
- Trigger: Schedule (Cron-based)
- Quando usar: Reports recorrentes, fetch periodico de dados, tarefas de manutencao
- Exemplo: Schedule (diario 9h) -> HTTP Request (buscar analytics) -> Code (agregar dados) -> Email (enviar report) -> Error Trigger -> Slack (notificar falha)

## Guia de Selecao de Padrao

| Necessidade | Padrao Recomendado |
|-------------|-------------------|
| Receber dados de sistema externo | Webhook Processing |
| Resposta instantanea a evento | Webhook Processing |
| Buscar dados de API | HTTP API Integration |
| Sincronizar servicos | HTTP API Integration |
| ETL / Data pipeline | Database Operations |
| Sync entre bancos | Database Operations |
| Chatbot / AI assistente | AI Agent Workflow |
| AI com acesso a ferramentas | AI Agent Workflow |
| Reports periodicos | Scheduled Tasks |
| Manutencao automatica | Scheduled Tasks |

## Componentes Comuns de Workflow

### Triggers
- Webhook: endpoint HTTP, instant
- Schedule: Cron, periodico
- Manual: click para executar, testes
- Polling: verificar mudancas, intervalos

### Data Sources
- HTTP Request: APIs REST
- Database nodes: Postgres, MySQL, MongoDB
- Service nodes: Slack, Google Sheets, Airtable
- Code: JavaScript/Python customizado

### Transformacao
- Set: mapear/transformar campos
- Code: logica complexa
- IF/Switch: roteamento condicional
- Merge: combinar fluxos de dados

### Outputs
- HTTP Request: chamar APIs
- Database: escrever dados
- Comunicacao: Email, Slack, Discord
- Storage: arquivos, cloud storage

### Error Handling
- Error Trigger: capturar erros do workflow
- IF: verificar condicoes de erro
- Stop and Error: falha explicita
- Continue On Fail: configuracao por node

## Padroes de Fluxo de Dados

### Fluxo Linear
Trigger -> Transform -> Action -> End
Uso: workflows simples com caminho unico

### Fluxo com Branching
Trigger -> IF -> [Caminho True] / [Caminho False]
Uso: acoes diferentes baseadas em condicoes

### Processamento Paralelo
Trigger -> [Branch 1] -> Merge <- [Branch 2]
Uso: operacoes independentes simultaneas

### Loop Pattern
Trigger -> Split in Batches -> Process -> Loop (ate concluir)
Uso: processar grandes datasets em chunks

### Error Handler Pattern
Main Flow -> [Success Path] / [Error Trigger -> Error Handler]
Uso: tratamento de erros separado

## Checklist de Criacao de Workflow

### Fase de Planejamento
- Identificar o padrao (webhook, API, database, AI, scheduled)
- Listar nodes necessarios (usar search_nodes)
- Entender fluxo de dados (input -> transform -> output)
- Planejar estrategia de tratamento de erros

### Fase de Implementacao
- Criar workflow com trigger apropriado
- Adicionar nodes de fonte de dados
- Configurar autenticacao/credenciais
- Adicionar nodes de transformacao (Set, Code, IF)
- Adicionar nodes de output/acao
- Configurar tratamento de erros

### Fase de Validacao
- Validar cada node (validate_node com profile runtime)
- Validar workflow completo (validate_workflow)
- Testar com dados de amostra
- Tratar edge cases (dados vazios, erros)

### Fase de Deploy
- Revisar settings (execution order, timeout, error handling)
- Ativar workflow (apos confirmacao do usuario)
- Monitorar primeiras execucoes
- Documentar proposito e fluxo de dados

## Gotchas Comuns

### 1. Webhook Data Structure
PROBLEMA: Nao consegue acessar dados do webhook
SOLUCAO: Dados ficam em $json.body
- ERRADO: {{$json.email}}
- CORRETO: {{$json.body.email}}

### 2. Multiple Input Items
PROBLEMA: Node processa todos os items quando so quer um
SOLUCAO: Usar "Execute Once" ou processar primeiro item: {{$json[0].field}}

### 3. Authentication Issues
PROBLEMA: API calls falhando com 401/403
SOLUCAO: Configurar credenciais corretamente, usar secao Credentials (nao parametros), testar antes de ativar

### 4. Node Execution Order
PROBLEMA: Nodes executando em ordem inesperada
SOLUCAO: Verificar workflow settings -> Execution Order (v1: connection-based, recomendado)

### 5. Expression Errors
PROBLEMA: Expressoes aparecem como texto literal
SOLUCAO: Usar {{}} ao redor das expressoes

## Estatisticas de Padroes

### Triggers mais comuns: Webhook (35%), Schedule (28%), Manual (22%), Service triggers (15%)
### Transformacoes mais comuns: Set (68%), Code (42%), IF (38%), Switch (18%)
### Outputs mais comuns: HTTP Request (45%), Slack (32%), Database (28%), Email (24%)
### Complexidade media: Simple 3-5 nodes (42%), Medium 6-10 nodes (38%), Complex 11+ nodes (20%)

## Exemplos Quick Start

### Webhook -> Slack
1. Webhook (path: "form-submit", POST)
2. Set (mapear form fields)
3. Slack (postar em #notifications)

### Scheduled Report
1. Schedule (diario 9h)
2. HTTP Request (buscar analytics)
3. Code (agregar dados)
4. Email (enviar report formatado)
5. Error Trigger -> Slack (notificar falha)

### Database Sync
1. Schedule (cada 15 minutos)
2. Postgres (query novos registros)
3. IF (existem registros?)
4. MySQL (inserir registros)
5. Postgres (atualizar timestamp de sync)

### AI Assistant
1. Webhook (receber mensagem de chat)
2. AI Agent com OpenAI Chat Model, HTTP Request Tool, Database Tool, Window Buffer Memory
3. Webhook Response (enviar resposta do AI)

### API Integration
1. Manual Trigger
2. HTTP Request (GET /api/users)
3. Split In Batches (100 por vez)
4. Set (transformar user data)
5. Postgres (upsert users)
6. Loop (volta para step 3 ate concluir)

## Boas Praticas

### FAZER:
- Comecar com o padrao mais simples que resolve o problema
- Planejar estrutura do workflow antes de construir
- Usar tratamento de erros em todos os workflows
- Testar com dados de amostra antes de ativar
- Seguir o checklist de criacao
- Usar nomes descritivos para nodes
- Documentar workflows complexos (campo notes)
- Monitorar execucoes apos deploy

### NAO FAZER:
- Construir workflows de uma vez (iterar com ~56s entre edits)
- Pular validacao antes de ativacao
- Ignorar cenarios de erro
- Usar padroes complexos quando simples resolvem
- Hardcodar credenciais em parametros
- Esquecer de tratar dados vazios
- Misturar padroes sem limites claros
- Deploy sem testar
