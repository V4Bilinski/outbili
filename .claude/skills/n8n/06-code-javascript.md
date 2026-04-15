# 06 - n8n Code JavaScript

## Visao Geral

Guia completo para escrever JavaScript em n8n Code nodes. JavaScript e a linguagem recomendada para **95%+ dos casos de uso** em Code nodes, oferecendo integracao completa com n8n, funcoes helper built-in, e a biblioteca Luxon para data/hora.

---

## Template Quick Start

```javascript
// Template basico - Run Once for All Items
const items = $input.all();
const results = [];

for (const item of items) {
  results.push({
    json: {
      ...item.json,
      processed: true,
      timestamp: DateTime.now().toISO()
    }
  });
}

return results;
```

---

## 5 Regras Essenciais

1. **Default:** modo "Run Once for All Items"
2. **Acesso a dados:** `$input.all()`, `$input.first()`, ou `$input.item`
3. **Formato de retorno OBRIGATORIO:** `[{json: {...}}]`
4. **Dados de webhook:** `$json.body` (NAO `$json` diretamente)
5. **Built-ins disponiveis:** `$helpers.httpRequest()`, `DateTime` (Luxon), `$jmespath()`

---

## Selecao de Modo

### Run Once for All Items (RECOMENDADO - 95% dos casos)

- Codigo executa **UMA vez** independente do numero de items
- Acessar dados via `$input.all()` ou items array
- Ideal para: agregacao, filtragem, batch processing, transformacoes, chamadas API multi-item
- **Performance melhor** para multiplos items

**Casos de uso:** calcular totais, ranking, deduplicacao, geracao de reports, combinar dados

### Run Once for Each Item (casos especiais)

- Codigo executa **separadamente** para cada item de input
- Acessar item atual via `$input.item` ou `$item`
- Ideal para: chamadas API por item, validacao individual, transformacoes item-especificas
- **Performance mais lenta** para datasets grandes

**Regra de decisao:**
- Analise multi-item → "All Items"
- Processamento independente → "Each Item"

---

## Padroes de Acesso a Dados

### Padrao 1: $input.all()

Obtem todos os items. Recomendado para arrays, batch operations, agregacoes.

```javascript
const items = $input.all();
const filtered = items.filter(item => item.json.status === 'active');
return filtered.map(item => ({json: {...item.json, verified: true}}));
```

### Padrao 2: $input.first()

Obtem objeto unico. Para API responses e processamento do primeiro item.

```javascript
const data = $input.first().json;
return [{json: {name: data.name, email: data.email}}];
```

### Padrao 3: $input.item

Item atual no loop. **EXCLUSIVO** do modo "Run Once for Each Item".

```javascript
const item = $input.item;
return [{json: {...item.json, processed: true}}];
```

### Padrao 4: $node

Referencia outputs de nodes especificos no workflow.

```javascript
const webhookData = $node["Webhook"].json;
const apiResponse = $node["HTTP Request"].json;
```

---

## CRITICO: Dados do Webhook

Payload do webhook fica em `.body`:

```javascript
// ERRADO:
const name = $json.name;

// CORRETO:
const name = $json.body.name;

// MAIS SEGURO (com fallback):
const body = $json.body || {};
const name = body.name || 'default';
```

Aplica-se a: POST data, query parameters, JSON payloads de webhook triggers.

---

## Formato de Retorno OBRIGATORIO

### Formatos CORRETOS:

```javascript
// Resultado unico
return [{json: {field1: "value1"}}];

// Multiplos resultados
return [
  {json: {id: 1, name: "A"}},
  {json: {id: 2, name: "B"}}
];

// Array transformado com map
return items.map(item => ({json: {...item.json, processed: true}}));

// Sem dados para retornar
return [];

// Condicional
return data ? [{json: data}] : [];
```

### Formatos ERRADOS (causam falha):

```javascript
// Objeto sem array wrapper
return {field: "value"};       // ERRADO

// Array items sem propriedade json
return [{name: "test"}];       // ERRADO

// String pura
return "result";               // ERRADO

// Estrutura incompleta
return [{json: null}];         // ERRADO
```

---

## Top 5 Erros e Solucoes

### Erro 1: Falta Return Statement

**PROBLEMA:** Codigo executa mas nao retorna dados ao workflow

```javascript
// ERRADO - sem return:
const items = $input.all();
items.map(item => ({json: item.json}));

// CORRETO:
const items = $input.all();
return items.map(item => ({json: item.json}));
```

### Erro 2: Confusao de Sintaxe de Expressao

**PROBLEMA:** Usar sintaxe n8n `{{ }}` dentro de Code node

```javascript
// ERRADO:
const name = {{$json.name}};

// CORRETO:
const name = $json.name;
// ou com template literals:
const msg = `Hello ${$json.name}`;
```

### Erro 3: Return Wrapper Incorreto

**PROBLEMA:** Retornar objeto em vez do formato array requerido

```javascript
// ERRADO:
return {result: "ok"};

// CORRETO:
return [{json: {result: "ok"}}];
```

### Erro 4: Falta Null Checks

**PROBLEMA:** Codigo crasha quando campos esperados nao existem

```javascript
// ERRADO:
const city = item.json.user.address.city;

// CORRETO (optional chaining):
const city = item.json?.user?.address?.city || 'Unknown';
```

### Erro 5: Webhook Body Nesting

**PROBLEMA:** Acessar dados do webhook no nivel errado

```javascript
// ERRADO:
const email = $json.email;

// CORRETO:
const email = $json.body.email;
```

---

## Funcoes Built-in

### $helpers.httpRequest()

Chamadas HTTP de dentro do Code node:

```javascript
const response = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {'Authorization': 'Bearer token'}
});
return [{json: response}];
```

**Opcoes disponiveis:**
- `method`: GET, POST, PUT, PATCH, DELETE
- `url`: endpoint completo
- `headers`: headers HTTP
- `body`: corpo da requisicao (para POST/PUT/PATCH)
- `json`: true/false (parse automatico de JSON)
- `returnFullResponse`: true para obter headers + status

### DateTime (Luxon)

Manipulacao de data/hora:

```javascript
const now = DateTime.now();
const formatted = now.toFormat('yyyy-MM-dd HH:mm:ss');
const tomorrow = now.plus({days: 1});
const lastWeek = now.minus({weeks: 1});
const iso = now.toISO();
const custom = now.set({hour: 9, minute: 0}).toFormat('HH:mm');

return [{json: {
  now: formatted,
  tomorrow: tomorrow.toISO(),
  lastWeek: lastWeek.toISO(),
  custom: custom
}}];
```

**Metodos uteis:**
- `DateTime.now()` - momento atual
- `.toFormat('yyyy-MM-dd')` - formatacao customizada
- `.toISO()` - formato ISO 8601
- `.plus({days: N})` / `.minus({hours: N})` - adicionar/subtrair
- `.set({hour: 9})` - definir valores especificos
- `.toLocal()` - converter para timezone local
- `.diff(otherDate, 'days')` - diferenca entre datas

### $jmespath()

Queries em estruturas JSON complexas:

```javascript
const result = $jmespath($json.data, "users[?age > `18`].name");
return [{json: {adults: result}}];
```

---

## 10 Padroes de Producao

### 1. Agregacao Multi-Source

```javascript
const items = $input.all();
const grouped = {};
for (const item of items) {
  const source = item.json.source || 'unknown';
  if (!grouped[source]) grouped[source] = [];
  grouped[source].push(item.json);
}
return [{json: {grouped, totalSources: Object.keys(grouped).length}}];
```

### 2. Filtragem com Regex

```javascript
const items = $input.all();
const pattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const emails = [];
for (const item of items) {
  const matches = (item.json.text || '').match(pattern) || [];
  emails.push(...matches);
}
return [{json: {emails: [...new Set(emails)], count: new Set(emails).size}}];
```

### 3. Transformacao & Enriquecimento

```javascript
const items = $input.all();
return items.map(item => ({
  json: {
    id: item.json.id,
    fullName: `${item.json.firstName} ${item.json.lastName}`.trim(),
    email: (item.json.email || '').toLowerCase(),
    createdAt: DateTime.now().toISO(),
    isValid: !!(item.json.firstName && item.json.email)
  }
}));
```

### 4. Top N com Ranking

```javascript
const items = $input.all();
const sorted = items
  .filter(i => i.json.score != null)
  .sort((a, b) => b.json.score - a.json.score)
  .slice(0, 10);
return sorted.map((item, i) => ({json: {...item.json, rank: i + 1}}));
```

### 5. Agregacao e Reporting

```javascript
const items = $input.all();
const values = items.map(i => i.json.amount || 0);
const total = values.reduce((sum, v) => sum + v, 0);
return [{json: {
  total,
  count: values.length,
  average: values.length ? total / values.length : 0,
  max: Math.max(...values),
  min: Math.min(...values)
}}];
```

### 6. Deduplicacao por Campo

```javascript
const items = $input.all();
const seen = new Set();
const unique = [];
for (const item of items) {
  const key = item.json.email;
  if (key && !seen.has(key)) {
    seen.add(key);
    unique.push({json: item.json});
  }
}
return unique;
```

### 7. Lookup / Join entre Datasets

```javascript
const items = $input.all();
const users = $node["Get Users"].json;
const usersMap = new Map(users.map(u => [u.id, u]));

return items.map(item => {
  const user = usersMap.get(item.json.userId) || {};
  return {json: {...item.json, userName: user.name, userEmail: user.email}};
});
```

### 8. Batch Processing com Chunks

```javascript
const items = $input.all();
const chunkSize = 100;
const chunks = [];
for (let i = 0; i < items.length; i += chunkSize) {
  chunks.push(items.slice(i, i + chunkSize).map(item => item.json));
}
return chunks.map((chunk, i) => ({
  json: {batchIndex: i, items: chunk, count: chunk.length}
}));
```

### 9. Validacao de Dados com Erros

```javascript
const items = $input.all();
const results = [];
for (const item of items) {
  const errors = [];
  if (!item.json.email) errors.push('Email obrigatorio');
  if (!item.json.name) errors.push('Nome obrigatorio');
  if (item.json.age && item.json.age < 0) errors.push('Idade invalida');

  results.push({
    json: {
      ...item.json,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}
return results;
```

### 10. HTTP Request com Retry

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await $helpers.httpRequest({method: 'GET', url, json: true});
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

const data = await fetchWithRetry('https://api.example.com/data');
return [{json: data}];
```

---

## Quando Usar Code Node vs Outros Nodes

### Usar Code Node:
- Transformacoes complexas multi-step
- Calculos customizados (estatisticas, scores)
- Operacoes recursivas / loops complexos
- Parsing complexo de respostas API
- Logica multi-condicional (mais de 2-3 condicoes)
- Agregacao cross-item (totais, medias, agrupamentos)
- HTTP requests com logica customizada (retry, paginacao)

### Usar Outros Nodes:
- Mapeamento simples de campos → **Set node**
- Filtragem basica → **Filter node**
- Condicionais simples → **IF/Switch nodes**
- Chamadas HTTP simples → **HTTP Request node**
- Merge de dados → **Merge node**

---

## Checklist Pre-Deploy

- [ ] Codigo nao esta vazio
- [ ] Return statement presente
- [ ] Formato correto: array de objetos com propriedade json
- [ ] Metodos de acesso a dados corretos ($input.all / .first / .item)
- [ ] SEM expressoes n8n no codigo (usar JavaScript puro)
- [ ] Error handling para inputs null/undefined (optional chaining ?.)
- [ ] Dados webhook via .body
- [ ] Modo correto selecionado (All Items como padrao)
- [ ] Performance otimizada (filtrar antes de transformar)
- [ ] Estrutura de output consistente em todos os code paths

---

## Boas Praticas

### FAZER:
- Validar inputs antes de processar (`?.`, `|| default`)
- Usar try-catch para operacoes async (`$helpers.httpRequest`)
- Preferir array methods (`map`, `filter`, `reduce`) sobre loops manuais
- Filtrar datasets antes de transformacoes custosas
- Usar nomes descritivos para variaveis
- `console.log()` para debugging (aparece no browser F12)
- Retornar estrutura consistente em todos os paths

### NAO FAZER:
- Usar `{{ }}` no Code node (usar JavaScript puro)
- Retornar objetos sem array wrapper
- Ignorar null checks (usar optional chaining)
- Acessar webhook data sem `.body`
- Criar Code nodes para tarefas simples (usar Set/IF/Filter)
- Usar loops `for...in` em arrays (usar `for...of` ou `.map()`)
- Esquecer `await` em chamadas async
