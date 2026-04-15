---
name: gerar-headlines
description: |
  Gerar 20-50 headlines com fascinations, curiosity gaps e benefit-driven copy.
  Scoring por impacto. Agente primario Gary Bencivenga (bullets/fascinations)
  ou Eugene Schwartz (awareness-calibrated headlines).
agent: gary-bencivenga | eugene-schwartz
tier: 1
requires: diagnostico-copy
version: "1.0.0"
---

# Task: Gerar Headlines

## Objetivo

Produzir um arsenal de 20-50 headlines qualificadas para uma oferta, pagina ou
campanha. Headlines sao o elemento de copy de maior impacto — uma headline forte
pode triplicar a conversao mantendo tudo igual. O processo inclui geracao em
multiplos formatos, scoring e selecao das top 5 para teste.

---

## Pre-requisitos

- [ ] `diagnostico-copy.md` executado (awareness level e sofisticacao definidos)
- [ ] Produto/oferta, beneficio principal e publico definidos
- [ ] Formato de destino: sales page / email subject / ad / landing page / VSL
- [ ] Restricao de tamanho se houver (ex.: Facebook Ads = max 40 chars)

---

## Passos

### Passo 1 — Briefing de Contexto

**Agente:** `@gary-bencivenga` ou `@eugene-schwartz`

Definir os parametros do arsenal de headlines:

```
Produto: [nome]
Beneficio principal: [resultado especifico]
Dor principal: [problema que resolve]
Awareness Level: [1-5]
Market Sophistication: [1-5]
Formato de destino: [sales page / email / ad / landing page]
Restricao de tamanho: [se houver]
Tom: [direto / elegante / curioso / urgente / emocional]
```

---

### Passo 2 — Geracao por Formato (20-50 headlines)

#### 2a. Headlines de Beneficio Direto (5-10)

Formula: [Resultado especifico] + [Prazo] + [Para quem]

```
"Como [fazer X] em [Y dias] sem [objecao principal]"
"[Numero] maneiras de [resultado desejado] que [autoridade] usa"
"O guia definitivo para [resultado] para [avatar especifico]"
```

Exemplos de estrutura:
```
"Como dobrar suas vendas em 90 dias sem aumentar o orcamento de anuncios"
"17 tecnicas de fechamento que os melhores vendedores do Brasil usam — e nao ensinam"
```

---

#### 2b. Headlines de Curiosidade (5-10)

Formula: Abrir um loop que so fecha quando o leitor continua.

**Formatos Bencivenga:**
```
"O segredo de [resultado] que [categoria de pessoa] nunca revela"
"Por que [crenca comum] esta completamente errada — e o que fazer em vez disso"
"O que [autoridade surpreendente] faz diferente dos outros [categoria]"
"[Numero] coisas que voce nunca soube sobre [topico familiar]"
"A razao pela qual [resultado negativo] acontece — e como evitar"
```

---

#### 2c. Headlines de Especificidade (5-10)

**Principio Hopkins:** Quanto mais especifica a headline, mais credivel e persuasiva.

```
"De R$ [X] para R$ [Y] em [Z meses]: o metodo que [nome do criador] usou"
"[Numero preciso]% dos [avatar] cometem este erro — e custou-lhes [perda especifica]"
"Como [pessoa especifica] conseguiu [resultado especifico] em [tempo exato] [de onde/condicao]"
```

**Regra:** Prefira numeros impares e nao-redondos (17, 23, 37) — soam mais pesquisados.

---

#### 2d. Headlines de Mecanismo Unico (3-5)

**Metodo Todd Brown + Bencivenga:**

```
"Descubra o [nome do mecanismo] que [resultado sem esforco esperado]"
"O [metodo/sistema/formula] de [X passos] que [resultado em prazo]"
"Por que o [mecanismo convencional] nao funciona — e o que substitui"
```

---

#### 2e. Headlines Calibradas por Awareness Level

**Awareness 1 (Unaware):**
```
"[Fato surpreendente sobre problema que eles nao sabem que tem]"
"A verdade sobre [categoria] que ninguem esta dizendo"
```

**Awareness 2 (Problem Aware):**
```
"[Voce sabe o problema] — aqui esta por que as solucoes comuns falham"
"Finalmente: uma solucao para [problema especifico] que realmente funciona"
```

**Awareness 3 (Solution Aware):**
```
"Nao e [solucao comum 1], nao e [solucao comum 2]. E [mecanismo unico]."
"Por que [solucao que o avatar ja conhece] so resolve metade do problema"
```

**Awareness 4 (Product Aware):**
```
"[Produto]: [numero de pessoas] ja usaram. Aqui esta o que aconteceu."
"O que [produto] faz diferente de tudo que voce ja tentou"
```

**Awareness 5 (Most Aware):**
```
"[Produto] — [preco / oferta especial] por [prazo]"
"Ultima chance: [produto] fecha [data] — garanta o seu"
```

---

#### 2f. Fascinations / Curiosity Bullets como Headlines (5-10)

**Formato Bencivenga puro:**
```
"[Palavra poderosa]: [promessa especifica] que [resultado surpresa]"
"O [adjetivo]: [promessa] — pagina [numero] do relatorio"
"Como [acao simples] pode [resultado desproporcionalmente grande]"
"O que acontece quando [situacao comum] + [variavel inesperada]"
"A diferenca entre [resultado comum] e [resultado extraordinario]: [detalhe especifico]"
```

---

### Passo 3 — Scoring das Headlines

**Escala de scoring (0-5 por criterio):**

| Criterio | Peso | Descricao |
|----------|------|-----------|
| Clareza | 20% | O beneficio e imediatamente claro? |
| Especificidade | 20% | Contem numeros, prazo ou detalhe concreto? |
| Curiosidade | 20% | Cria desejo de continuar lendo? |
| Relevancia | 20% | Fala diretamente com o avatar? |
| Urgencia / Impacto | 20% | Cria senso de importancia imediata? |

**Formula:** Score = (soma ponderada) x 20 = [0-100]

**Classificacao:**
```
90-100: Elite — testar imediatamente
75-89:  Forte — candidata para teste
60-74:  Media — pode melhorar com ajuste
<60:    Descartar ou reescrever
```

---

### Passo 4 — Selecao Top 5

Com base no scoring, selecionar as 5 melhores para teste A/B:

```yaml
top_5_headlines:
  headline_1:
    texto: "[headline]"
    score: [0-100]
    formato: [beneficio / curiosidade / especificidade / mecanismo / awareness]
    awareness_level: [1-5]
    notas: "[por que esta na top 5]"

  headline_2: ...
```

**Recomendacao de teste:**
- Testar 2 formatos opostos (ex.: beneficio direto vs. curiosidade)
- Testar 1 headline longa vs. 1 headline curta
- Testar 1 headline emocional vs. 1 headline racional

---

### Passo 5 — Variantes de Subheadlines

Para cada headline top 5, gerar 1-2 subheadlines de suporte:

```
HEADLINE: [headline selecionada]
SUBHEADLINE A: [complementa com especificidade ou prova]
SUBHEADLINE B: [complementa com qualificacao do avatar]
```

---

### Passo 6 — Revisao Hopkins

**Agente:** `@claude-hopkins`

Validar as top 5 contra criterios Hopkins:
- [ ] Cada headline e especifica (nao generica)?
- [ ] Cada headline cumpre o principio reason-why implicitamente?
- [ ] Nenhuma headline e claim sem suporte?
- [ ] O arsenal cobre awareness levels 3-5 (os de maior conversao)?

---

## Output

**Arquivo gerado:** `headlines-{produto}-{data}.md`

```markdown
# Arsenal de Headlines: [Produto]
## Meta
- Copywriter: [Bencivenga / Schwartz]
- Total gerado: [N]
- Awareness Level alvo: [1-5]
- Data: [data]

## TOP 5 — Aprovadas para Teste
1. [headline] | Score: [X] | Formato: [tipo]
2. ...

## Arsenal Completo
### Beneficio Direto (10)
### Curiosidade (10)
### Especificidade (10)
### Mecanismo Unico (5)
### Awareness-Calibradas (10)
### Fascinations como Headline (5)

## Subheadlines para Top 5
```

---

## Validacao

- [ ] Diagnostico Tier 0 concluido
- [ ] Minimo 20 headlines geradas (ideal: 50)
- [ ] Todas as 6 categorias de formato cobertas
- [ ] Minimo 5 headlines por awareness level alvo
- [ ] Score calculado para todas as headlines
- [ ] Top 5 selecionadas e documentadas com justificativa
- [ ] Subheadlines geradas para cada headline top 5
- [ ] Nenhuma headline e generica ou poderia ser de qualquer produto
- [ ] Hopkins validou as top 5
