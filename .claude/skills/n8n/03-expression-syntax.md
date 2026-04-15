# 03 - n8n Expression Syntax

## Visao Geral
Guia completo para escrever expressoes n8n corretas. Todas as expressoes usam chaves duplas: {{expressao}}.

## Formato de Expressao
Todo conteudo dinamico em n8n usa chaves duplas: {{expressao}}
- CORRETO: {{$json.email}}
- ERRADO: $json.email (sem chaves)
- ERRADO: {$json.email} (chave simples)

## Variaveis Core

### $json - Acessar dados do node atual
- Dot notation: {{$json.email}}
- Bracket notation (para espacos): {{$json["primeiro nome"]}}
- Nested: {{$json.user.address.city}}
- Array: {{$json.items[0].name}}

### $node - Acessar dados de qualquer node anterior
- {{$node["Nome do Node"].json.campo}}
- Nome e case-sensitive e deve ser exato
- Usar aspas ao redor do nome do node

### $now - Data/hora atual
- {{$now}} - timestamp atual
- {{$now.toFormat("yyyy-MM-dd")}} - formatado
- {{$now.plus({days: 1})}} - manipulacao

### $env - Variaveis de ambiente
- {{$env.API_KEY}}
- Para valores sensiveis como API keys
- Configuradas no n8n, nao no workflow

## CRITICO: Estrutura de Dados do Webhook

Dados do webhook NAO estao na raiz! Ficam em .body:

Estrutura completa:
```
$json = {
  headers: { ... },
  params: { ... },
  query: { ... },
  body: {
    name: "valor",
    email: "valor",
    ... (dados do usuario)
  }
}
```

- ERRADO: {{$json.name}}
- CORRETO: {{$json.body.name}}
- ERRADO: {{$json.email}}
- CORRETO: {{$json.body.email}}

## Padroes Comuns

### Acessar campo nested
{{$json.user.address.city}}

### Acessar item de array
{{$json.items[0].name}}

### Bracket notation para espacos
{{$json["primeiro nome"]}}

### Referenciar outro node
{{$node["HTTP Request"].json.data.id}}

### Combinar variaveis em string
Ola {{$json.body.name}}, seu pedido #{{$json.body.orderId}} foi confirmado.

### Combinar em URL
https://api.example.com/users/{{$json.body.userId}}/orders

## Quando NAO Usar Expressoes

### Code Nodes: usar JavaScript puro, SEM {{ }}
```javascript
// ERRADO no Code node:
const name = {{$json.name}};

// CORRETO no Code node:
const name = $json.name;
// ou
const name = $input.first().json.name;
```

### Webhook paths: nao suportam expressoes
### Credential fields: usar sistema de credenciais do n8n

## Regras de Validacao

1. Expressoes requerem {{ }}
2. Nomes de campos/nodes com espacos precisam de bracket notation
3. Referencias a nodes sao case-sensitive
4. NAO aninhar {{ }} dentro de {{ }}

## Tabela de Erros Comuns

| Errado | Correto | Problema |
|--------|---------|----------|
| $json.email | {{$json.email}} | Falta {{ }} |
| {{ $json.email }} | {{$json.email}} | Espacos extras (pode funcionar mas evitar) |
| {{$json.Name}} | {{$json.name}} | Case errado |
| {{$json.email}} (webhook) | {{$json.body.email}} | Falta .body |
| {{$json.name}} (no Code node) | $json.name | Nao usar {{ }} em Code |
| {{{{$json.name}}}} | {{$json.name}} | {{ }} duplo |

## Exemplos Praticos

### Webhook para Slack
Recebendo formulario: {{$json.body.name}} enviou mensagem: {{$json.body.message}}

### HTTP Request para Email
Dados da API: O usuario {{$node["HTTP Request"].json.data.name}} ({{$node["HTTP Request"].json.data.email}})

### Formatar Timestamp
Data formatada: {{$now.toFormat("dd/MM/yyyy HH:mm")}}
Ontem: {{$now.minus({days: 1}).toFormat("yyyy-MM-dd")}}

## Tipos de Dados

### Arrays
- Acessar item: {{$json.items[0]}}
- Tamanho: {{$json.items.length}}

### Objetos
- Dot notation: {{$json.user.name}}
- Bracket notation: {{$json["user"]["name"]}}

### Strings
- Concatenacao: Nome: {{$json.first}} {{$json.last}}
- Metodos: {{$json.name.toLowerCase()}}
- Includes: {{$json.status.includes("active")}}

### Numeros
- Direto: {{$json.amount}}
- Operacoes: {{$json.price * $json.quantity}}

## Padroes Avancados

### Conteudo condicional (ternario)
{{$json.status === "active" ? "Ativo" : "Inativo"}}

### Valor padrao com ||
{{$json.name || "Nome nao informado"}}

### Manipulacao de data (Luxon)
{{$now.plus({days: 7}).toFormat("yyyy-MM-dd")}}
{{$now.minus({hours: 2}).toISO()}}
{{$now.set({hour: 9, minute: 0}).toFormat("HH:mm")}}

### Metodos de string
{{$json.text.substring(0, 100)}}
{{$json.email.replace("@", " [at] ")}}
{{$json.tags.split(",")}}

## Expression Helpers

### String: toLowerCase(), toUpperCase(), trim(), replace(), substring(), split(), includes()
### Array: length, map(), filter(), find(), join(), slice()
### DateTime (Luxon): toFormat(), toISO(), toLocal(), plus(), minus(), set()
### Number: toFixed(), toString(), operadores matematicos (+, -, *, /)

## Debugging de Expressoes
- Usar o editor de expressoes (icone "fx" nos campos)
- Testar expressoes com dados reais
- Erros comuns: "Cannot read property of undefined" = campo nao existe
- Usar optional chaining: {{$json.user?.name}}

## Boas Praticas

### FAZER:
- Sempre usar {{ }} para conteudo dinamico
- Usar bracket notation para nomes com espacos
- Acessar dados de webhook via .body
- Referenciar nodes pelo nome exato (case-sensitive)
- Testar expressoes no editor antes de salvar

### NAO FAZER:
- Usar expressoes em Code nodes (usar JS puro)
- Esquecer aspas nos nomes de nodes
- Aninhar {{ }} dentro de {{ }}
- Assumir estrutura do webhook (sempre .body)
- Usar credenciais em expressoes (usar sistema de credentials)
