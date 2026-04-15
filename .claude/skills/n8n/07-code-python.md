# 07 - n8n Code Python

## Visao Geral

Guia para escrever Python em n8n Code nodes.

> **IMPORTANTE: Use JavaScript para 95% dos casos de uso.** Python so quando houver necessidade especifica da standard library ou conforto significativamente maior com a linguagem.

---

## Quando Usar Python vs JavaScript

### Usar Python quando:
- Precisa do modulo `statistics` para operacoes estatisticas (mean, median, stdev)
- Significativamente mais confortavel com sintaxe Python
- Logica se adapta bem a list comprehensions
- Precisa de funcoes especificas da standard library (hashlib, re avancado)

### Usar JavaScript quando:
- Precisa de HTTP requests (`$helpers.httpRequest` - Python NAO tem requests)
- Precisa de operacoes avancadas de data/hora (Luxon)
- Quer melhor integracao com n8n (helpers, built-ins)
- **Para 95% dos casos de uso** (fortemente recomendado)

### Considerar outros nodes quando:
- Mapeamento simples de campos → **Set node**
- Filtragem basica → **Filter node**
- Condicionais simples → **IF/Switch node**
- HTTP requests simples → **HTTP Request node**

---

## LIMITACAO CRITICA: Sem Bibliotecas Externas

### NAO disponiveis (causam ModuleNotFoundError):
- `requests` - sem HTTP requests em Python!
- `pandas` - sem data analysis
- `numpy` - sem computacao numerica
- `scipy` - sem computacao cientifica
- `BeautifulSoup` - sem web scraping
- `lxml` - sem XML parsing avancado
- Qualquer pacote pip externo

### Disponiveis (Standard Library apenas):
| Modulo | Uso |
|--------|-----|
| `json` | Parsing e serializacao JSON |
| `datetime` | Data e hora |
| `re` | Expressoes regulares |
| `base64` | Codificacao/decodificacao Base64 |
| `hashlib` | Hashing (SHA256, MD5, etc.) |
| `urllib.parse` | Parsing de URL |
| `math` | Funcoes matematicas |
| `random` | Numeros aleatorios |
| `statistics` | Funcoes estatisticas (mean, median, stdev) |

### Workarounds para libs externas:
- HTTP requests → Usar **HTTP Request node** ou **JavaScript** ($helpers.httpRequest)
- Data analysis → Usar modulo `statistics` do Python ou **JavaScript**
- Web scraping → Usar **HTTP Request** + **HTML Extract** nodes

---

## Template Quick Start

```python
from datetime import datetime

items = _input.all()
processed = []
for item in items:
    processed.append({
        "json": {
            **item["json"],
            "processed": True,
            "timestamp": datetime.now().isoformat()
        }
    })
return processed
```

---

## 5 Regras Essenciais

1. **Considerar JavaScript primeiro** antes de usar Python
2. **Acesso a dados:** `_input.all()`, `_input.first()`, ou `_input.item`
3. **Formato de retorno OBRIGATORIO:** `[{"json": {...}}]`
4. **Dados de webhook:** `_json["body"]` (NAO `_json` diretamente)
5. **SEM bibliotecas externas** - apenas standard library

---

## Selecao de Modo

### Run Once for All Items (Padrao/Recomendado)

- Codigo executa **uma vez** independente do numero de inputs
- Acesso via `_input.all()` ou `_items`
- Ideal para: agregacao, filtragem, batch processing
- **Mais rapido** para multiplos items

```python
all_items = _input.all()
total = sum(item["json"].get("amount", 0) for item in all_items)
return [{
    "json": {
        "total": total,
        "count": len(all_items),
        "average": total / len(all_items) if all_items else 0
    }
}]
```

### Run Once for Each Item

- Codigo executa **separadamente** para cada item
- Acesso via `_input.item` ou `_item` (Native mode)
- Ideal para: logica item-especifica, processamento independente
- **Mais lento** para datasets grandes

---

## Modos Python: Beta vs Native

### Python (Beta) - Recomendado
- Usa helpers `_input`, `_json`, `_node`
- Helpers disponiveis: `_now`, `_today`, `_jmespath()`
- Melhor integracao com n8n

### Python (Native)
- Usa apenas `_items`, `_item`
- Sem helpers como `_input` ou `_now`
- Abordagem Python pura

---

## Padroes de Acesso a Dados

### _input.all() - Mais comum

Para processar arrays e operacoes em batch:

```python
items = _input.all()
return [{"json": {"count": len(items)}}]
```

### _input.first() - Muito comum

Para objeto unico e respostas de API:

```python
data = _input.first()["json"]
return [{"json": {"name": data.get("name")}}]
```

### _input.item - Apenas modo Each Item

Exclusivo do modo "Run Once for Each Item":

```python
item = _input.item
return [{"json": {**item["json"], "processed": True}}]
```

### _node - Referenciar nodes especificos

```python
webhook_data = _node["Webhook"].json
api_data = _node["HTTP Request"].json
```

---

## CRITICO: Dados do Webhook

Payload do webhook fica em `["body"]`:

```python
# ERRADO:
name = _json["name"]

# CORRETO:
name = _json["body"]["name"]

# MAIS SEGURO (com .get()):
webhook_data = _json.get("body", {})
name = webhook_data.get("name")
email = webhook_data.get("email", "nao informado")
```

---

## Formato de Retorno OBRIGATORIO

### Formatos CORRETOS:

```python
# Resultado unico
return [{"json": {"key": "value"}}]

# Multiplos resultados
return [{"json": {"id": 1}}, {"json": {"id": 2}}]

# List comprehension
return [{"json": {**item["json"], "processed": True}} for item in items]

# Vazio
return []

# Condicional
return [{"json": data}] if condition else []
```

### Formatos ERRADOS (causam falha):

```python
# Dict sem list wrapper
return {"key": "value"}         # ERRADO

# List sem json wrapper
return [{"name": "test"}]       # ERRADO - falta chave "json"

# String pura
return "result"                 # ERRADO
```

---

## Top 5 Erros e Solucoes

### Erro 1: Importar Bibliotecas Externas

```python
# ERRADO - ModuleNotFoundError:
import requests
import pandas as pd

# CORRETO - Apenas standard library:
import json
import re
from datetime import datetime
from statistics import mean, median
```

### Erro 2: Codigo Vazio ou Sem Return

**PROBLEMA:** Todo Code node deve ter return com lista de dicts.

```python
# ERRADO - sem return:
items = _input.all()
processed = [{"json": i["json"]} for i in items]

# CORRETO:
items = _input.all()
processed = [{"json": i["json"]} for i in items]
return processed
```

### Erro 3: Formato de Retorno Incorreto

```python
# ERRADO - dict sem list:
return {"result": "ok"}

# CORRETO:
return [{"json": {"result": "ok"}}]
```

### Erro 4: KeyError no Acesso a Dicionario

```python
# ERRADO - KeyError se chave nao existe:
name = item["json"]["name"]

# CORRETO - .get() com valor padrao:
name = item["json"].get("name", "default")
```

### Erro 5: Webhook Body Nesting

```python
# ERRADO:
email = _json["email"]

# CORRETO:
email = _json.get("body", {}).get("email")
```

---

## Padroes Comuns

### 1. Transformacao de Dados

```python
items = _input.all()
return [
    {
        "json": {
            "id": item["json"].get("id"),
            "name": item["json"].get("name", "Unknown").upper(),
            "processed": True
        }
    }
    for item in items
]
```

### 2. Filtragem e Agregacao

```python
items = _input.all()
total = sum(item["json"].get("amount", 0) for item in items)
valid = [item for item in items if item["json"].get("amount", 0) > 0]
return [{"json": {"total": total, "count": len(valid)}}]
```

### 3. Processamento de String com Regex

```python
import re

items = _input.all()
pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
emails = set()
for item in items:
    text = item["json"].get("text", "")
    emails.update(re.findall(pattern, text))
return [{"json": {"emails": list(emails), "count": len(emails)}}]
```

### 4. Validacao de Dados

```python
items = _input.all()
validated = []
for item in items:
    data = item["json"]
    errors = []
    if not data.get("email"):
        errors.append("Email obrigatorio")
    if not data.get("name"):
        errors.append("Nome obrigatorio")
    validated.append({
        "json": {
            **data,
            "valid": len(errors) == 0,
            "errors": errors if errors else None
        }
    })
return validated
```

### 5. Analise Estatistica

```python
from statistics import mean, median, stdev

items = _input.all()
values = [item["json"].get("value", 0) for item in items if "value" in item["json"]]
if values:
    return [{"json": {
        "mean": mean(values),
        "median": median(values),
        "stdev": stdev(values) if len(values) > 1 else 0,
        "min": min(values),
        "max": max(values),
        "count": len(values)
    }}]
return [{"json": {"error": "Nenhum valor encontrado"}}]
```

### 6. Hashing e Codificacao

```python
import hashlib
import base64

items = _input.all()
results = []
for item in items:
    text = item["json"].get("text", "")
    results.append({
        "json": {
            "original": text,
            "sha256": hashlib.sha256(text.encode()).hexdigest(),
            "md5": hashlib.md5(text.encode()).hexdigest(),
            "base64": base64.b64encode(text.encode()).decode()
        }
    })
return results
```

### 7. Manipulacao de Data/Hora

```python
from datetime import datetime, timedelta

items = _input.all()
now = datetime.now()
return [{
    "json": {
        "now": now.isoformat(),
        "formatted": now.strftime("%d/%m/%Y %H:%M"),
        "yesterday": (now - timedelta(days=1)).isoformat(),
        "next_week": (now + timedelta(weeks=1)).isoformat()
    }
}]
```

### 8. URL Parsing

```python
from urllib.parse import urlparse, urlencode, parse_qs

items = _input.all()
results = []
for item in items:
    url = item["json"].get("url", "")
    parsed = urlparse(url)
    results.append({
        "json": {
            "scheme": parsed.scheme,
            "domain": parsed.netloc,
            "path": parsed.path,
            "params": dict(parse_qs(parsed.query))
        }
    })
return results
```

---

## Referencia Standard Library

### json
```python
import json
data = json.loads('{"key": "value"}')   # string -> dict
text = json.dumps(data, indent=2)        # dict -> string
```

### datetime
```python
from datetime import datetime, timedelta
now = datetime.now()
formatted = now.strftime("%Y-%m-%d %H:%M:%S")
future = now + timedelta(days=7)
```

### re (Expressoes Regulares)
```python
import re
matches = re.findall(r'\d+', "abc123def456")  # ['123', '456']
cleaned = re.sub(r'[^\w\s]', '', text)         # remover pontuacao
is_match = bool(re.match(r'^\d{5}$', "12345")) # validar CEP
```

### base64
```python
import base64
encoded = base64.b64encode("texto".encode()).decode()
decoded = base64.b64decode(encoded).decode()
```

### hashlib
```python
import hashlib
hash_sha256 = hashlib.sha256("texto".encode()).hexdigest()
hash_md5 = hashlib.md5("texto".encode()).hexdigest()
```

### urllib.parse
```python
from urllib.parse import urlencode, urlparse, parse_qs
query_string = urlencode({"q": "search", "page": 1})
parsed = urlparse("https://example.com/path?q=test")
```

### statistics
```python
from statistics import mean, median, stdev, mode
avg = mean([1, 2, 3, 4, 5])       # 3.0
mid = median([1, 2, 3, 4, 5])     # 3
dev = stdev([1, 2, 3, 4, 5])      # 1.58...
```

### math
```python
import math
math.ceil(4.1)     # 5
math.floor(4.9)    # 4
math.sqrt(16)      # 4.0
math.log(100, 10)  # 2.0
```

### random
```python
import random
random.choice(["a", "b", "c"])     # item aleatorio
random.randint(1, 100)             # inteiro aleatorio
random.shuffle(my_list)            # embaralhar lista
random.sample(my_list, 3)         # 3 items aleatorios
```

---

## Checklist Pre-Deploy

- [ ] Considerou JavaScript primeiro (95% dos casos)
- [ ] Codigo nao esta vazio
- [ ] Return statement presente
- [ ] Formato correto: lista de dicts com chave `"json"`
- [ ] Metodos de acesso corretos (`_input.all()` / `.first()` / `.item`)
- [ ] SEM imports de bibliotecas externas
- [ ] Acesso seguro a dicionarios com `.get()`
- [ ] Dados webhook via `["body"]`
- [ ] Modo correto selecionado (All Items como padrao)
- [ ] Output consistente em todos os paths (incluindo paths de erro)

---

## Boas Praticas

### FAZER:
- Sempre usar `.get()` para acesso a dicionarios
- Tratar valores `None`/`Null` explicitamente
- Usar list comprehensions para filtragem e transformacao
- Retornar estrutura consistente em todos os code paths
- `print()` para debugging (aparece no browser console F12)
- Importar apenas modulos da standard library

### NAO FAZER:
- Importar bibliotecas externas (requests, pandas, numpy)
- Retornar dict sem list wrapper
- Acessar chaves diretamente sem `.get()` (risco de KeyError)
- Acessar webhook data sem `["body"]`
- Usar Python para tarefas simples (usar Set/IF/Filter nodes)
- Esquecer de considerar JavaScript como alternativa principal
