# 05 - n8n Validation Expert

## Visao Geral
Guia para interpretar e resolver erros de validacao n8n. Validacao e um processo iterativo que tipicamente requer 2-3 ciclos de feedback e correcao (23s analise + 58s correcao em media).

## Niveis de Severidade

### Errors (Bloqueantes)
- Impedem execucao do workflow
- Devem ser corrigidos antes do deploy
- Exemplos: campos obrigatorios faltando, tipos invalidos

### Warnings (Nao-bloqueantes)
- Workflow pode executar, mas pode ter problemas
- Recomendado corrigir
- Exemplos: configuracoes subotimas, potenciais issues

### Suggestions (Opcionais)
- Melhorias recomendadas
- Nao impedem execucao
- Exemplos: otimizacoes, boas praticas

## Validation Loop (Padrao Comprovado)

1. Configurar node/workflow
2. validate_node({nodeType, config, profile: "runtime"})
3. Ler resultado: errors, warnings, suggestions
4. Corrigir errors (prioridade maxima)
5. Re-validar
6. Repetir ate result.valid = true

Tempo tipico por ciclo: 23 segundos de analise + 58 segundos de correcao

## Profiles de Validacao

### minimal
- Verificacao mais rapida
- Apenas campos obrigatorios
- Usar para: planejamento rapido, prototipagem

### runtime (RECOMENDADO)
- Verificacao balanceada
- Valores + tipos + campos obrigatorios
- Usar para: pre-deploy, desenvolvimento normal
- Captura erros reais sem muitos falsos positivos

### ai-friendly
- Balanceado para configuracoes geradas por AI
- Menos falsos positivos que runtime
- Usar para: quando AI gera configuracoes

### strict
- Validacao maxima
- Todos os checks possiveis
- Usar para: producao, workflows criticos
- Pode gerar mais falsos positivos

## Tipos de Erro Comuns

### 1. missing_required
- Campo obrigatorio nao fornecido
- Exemplo: "Missing required field: channel" (Slack)
- Solucao: Adicionar o campo com valor apropriado

### 2. invalid_value
- Valor fornecido nao e aceito
- Exemplo: "Invalid value for operation: 'sendMessage', expected one of: send, update, delete"
- Solucao: Usar um dos valores validos listados

### 3. type_mismatch
- Tipo do valor nao corresponde ao esperado
- Exemplo: "Expected string for 'text', got number"
- Solucao: Converter para o tipo correto

### 4. invalid_expression
- Expressao n8n com sintaxe incorreta
- Exemplo: "Invalid expression: $json.name (missing {{ }})"
- Solucao: Corrigir sintaxe da expressao

### 5. invalid_reference
- Referencia a node que nao existe
- Exemplo: "Referenced node 'Webhook' not found"
- Solucao: Verificar nome exato do node referenciado

## Sistema de Auto-Sanitizacao

A auto-sanitizacao executa automaticamente em QUALQUER update de workflow via n8n_update_partial_workflow.

### O que corrige automaticamente:
- Operadores binarios (equals, contains, greaterThan): REMOVE singleValue se presente
- Operadores unarios (isEmpty, isNotEmpty): ADICIONA singleValue: true se ausente
- IF/Switch nodes: adiciona metadata faltante

### O que NAO corrige:
- Conexoes quebradas entre nodes
- Branch count mismatches
- Estados corrompidos paradoxais

### Regra importante:
- Operadores BINARIOS (equals, contains, etc.): NAO devem ter singleValue: true
- Operadores UNARIOS (isEmpty, isNotEmpty): DEVEM ter singleValue: true

## Falsos Positivos

### Falsos positivos comuns:
- Expressoes marcadas como "valor invalido" mas que sao validas em runtime
- Campos opcionais reportados como faltando em profile strict
- Configuracoes AI marcadas como invalidas (usar profile ai-friendly)

### Como reduzir:
- Usar profile runtime em vez de strict para desenvolvimento
- Usar profile ai-friendly para configs geradas por AI
- Verificar se o "erro" e realmente um problema real antes de corrigir
- Consultar documentacao do node se a validacao parece incorreta

## Estrutura do Resultado de Validacao

```json
{
  "valid": true/false,
  "errors": [
    {
      "type": "missing_required",
      "field": "channel",
      "message": "Missing required field: channel",
      "severity": "error"
    }
  ],
  "warnings": [...],
  "suggestions": [...],
  "autoFixes": [...]
}
```

## Validacao de Workflow Completo

validate_workflow valida o workflow inteiro:
- Nodes individuais: configuracao de cada node
- Conexoes: todas as conexoes validas entre nodes
- Expressoes: sintaxe de expressoes em todos os campos
- Estrutura: fluxo logico do workflow
- AI Agents: conexoes e configuracoes de nodes AI

## Estrategias de Recovery

### 1. Comecar do Zero
- Quando erros sao muitos e confusos
- Criar novo workflow baseado no padrao correto
- Usar template como ponto de partida

### 2. Binary Search
- Desabilitar metade dos nodes
- Validar para identificar qual grupo tem o erro
- Estreitar ate encontrar o node problematico

### 3. Clean Stale Connections
- Usar operacao cleanStaleConnections
- Remove conexoes orfas que causam erros de validacao

### 4. Auto-Fix
- n8n_autofix_workflow({id})
- Corrige automaticamente erros comuns
- Preview antes de aplicar

## Boas Praticas

### FAZER:
- Validar apos cada mudanca significativa
- Usar profile runtime como padrao
- Corrigir errors antes de warnings
- Iterar o loop de validacao (2-3 ciclos normais)
- Confiar na auto-sanitizacao para issues de operadores
- Usar ai-friendly para configs AI

### NAO FAZER:
- Pular validacao antes de ativar
- Usar profile strict em desenvolvimento (muitos falsos positivos)
- Ignorar warnings sistematicamente
- Tentar corrigir tudo de uma vez (iterar)
- Confundir warnings com errors (warnings nao bloqueiam)
