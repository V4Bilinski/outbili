---
name: escrever-sales-page
description: |
  Escrever sales page completa com headline, lead, body, bullets, proof, CTA e PS.
  Copywriter selecionado automaticamente via diagnostico Tier 0.
agent: auto-select (tipicamente gary-halbert | gary-bencivenga | david-ogilvy)
tier: 1
requires: diagnostico-copy
version: "1.0.0"
---

# Task: Escrever Sales Page

## Objetivo

Produzir uma sales page completa e persuasiva, com todas as secoes necessarias para
converter o leitor no nivel de awareness mapeado. O copywriter e selecionado
automaticamente com base no diagnostico Tier 0. A pagina segue o formato padrao
de resposta direta com medicao Hopkins.

---

## Pre-requisitos

- [ ] `diagnostico-copy.md` executado e aprovado
- [ ] Awareness Level definido (1-5)
- [ ] Market Sophistication definido (1-5)
- [ ] Copywriter selecionado pelo Copy Chief
- [ ] Produto/servico, preco, garantia, bonus definidos
- [ ] Depoimentos / prova social disponivel

---

## Passos

### Passo 1 — Briefing do Copywriter Selecionado

**Agente:** copywriter selecionado no diagnostico

Revisar o diagnostico e internalizar:
- Nivel de awareness do publico
- Sofisticacao do mercado
- Angulo recomendado
- Top 3 gaps Hopkins a corrigir

---

### Passo 2 — Headline (acima do fold)

Escrever 5 opcoes de headline e selecionar a mais forte:

**Formatos por awareness level:**
- Awareness 1-2: headline de curiosidade / problema
- Awareness 3: headline de mecanismo unico
- Awareness 4: headline de prova / especificidade
- Awareness 5: headline de oferta direta

**Criterios de headline forte (Hopkins):**
- [ ] Especifica (numeros, resultados, tempo)
- [ ] Promete beneficio claro ou curiosidade irresistivel
- [ ] Nao e generica — poderia ser so desta oferta
- [ ] Passa no teste "e so clicar"

**Output:**
```
HEADLINE SELECIONADA: [headline]
SUBHEADLINE: [subheadline]
HEADLINE ALTERNATIVAS (4):
1.
2.
3.
4.
```

---

### Passo 3 — Lead (abertura — primeiros 300-500 palavras)

**Tipos de lead por situacao:**

| Tipo | Quando usar | Estrutura |
|------|-------------|-----------|
| Story Lead | Awareness 1-3, emocional | Historia identificacao → problema → virada |
| Problem-Agitation Lead | Awareness 2-3 | Dor → amplificar → solucao |
| Secret/Curiosity Lead | Awareness 2-4 | Segredo → promessa → credibilidade |
| Identificacao Lead | Awareness 4-5 | "Voce e como eu era..." |
| Fact Lead | Awareness 4-5, prova | Estatistica chocante → contexto → promessa |

Escrever o lead completo (nao um resumo):
- Gancho na primeira frase (primeiras 10 palavras)
- Identificacao com a dor/desejo do leitor
- Promessa implcita ou explicita da transformacao
- Transicao suave para o corpo

---

### Passo 4 — Corpo (Body)

Estrutura obrigatoria do corpo:

#### 4a. Apresentacao do Mecanismo Unico
- O que e diferente nesta solucao?
- Por que as outras solucoes falham?
- Como este mecanismo especifico resolve o problema?

#### 4b. Historia de Credibilidade
- Quem e o autor/criador?
- Qual e a jornada (fracasso → descoberta → resultado)?
- Por que ele/ela tem autoridade para falar sobre isso?

#### 4c. O Que Voce Vai Receber (bullets de beneficio)
Escrever 15-25 bullets usando formato Bencivenga:

```
Formato: [Beneficio especifico] — e por que isso importa para [dor/desejo especifico]
Formato curiosidade: "O segredo de [resultado] que [autoridade] nunca revela..."
Formato especificidade: "Como [acao especifica] resulta em [resultado mensuravel] em [tempo]"
```

#### 4d. Prova Social e Testimonials
- Minimo 3 depoimentos com nome completo + resultado especifico
- Estudos de caso se disponivel
- Numeros: quantas pessoas, quanto tempo, qual resultado medio

#### 4e. Stack de Valor (o que esta incluido)
Para cada item do produto/bonus:
```
[Nome do item]
Valor de mercado: R$ ___
O que voce ganha: [beneficio especifico]
Por que e essencial: [razao]
```

---

### Passo 5 — Oferta e Preco

Estrutura da oferta:

```
VOCE RECEBIA TUDO ISSO SEPARADO: R$ [soma dos valores]
HOJE VOCE LEVA TUDO POR: R$ [preco]
ECONOMIA: R$ [diferenca] ([%] de desconto)
```

Incluir:
- Justificativa do preco (por que vale mais)
- Urgencia / escassez se aplicavel (deadline real, vagas limitadas)
- Formas de pagamento

---

### Passo 6 — Garantia

Garantia deve ser **bold e especifica**:

```
GARANTIA [X] DIAS — SEM PERGUNTAS

Se em [X] dias voce nao [resultado especifico], 
eu devolvo 100% do seu dinheiro. 
[Opcional: E voce ainda fica com [bonus especifico]]
```

Principio Hopkins: quanto mais especifica a garantia, mais credibilidade ela gera.

---

### Passo 7 — CTA Principal

```
[BOTAO PRIMARIO]: [verbo de acao] + [beneficio imediato]
Exemplo: "QUERO ACESSO AGORA — Comecar em 5 Minutos"

Abaixo do botao:
- Reaficar a garantia (1 linha)
- Icones de pagamento seguro
- "Voce esta protegido por [X] dias de garantia"
```

---

### Passo 8 — PS (Post-Scriptum)

Escrever 2-3 PS obrigatorios:

```
P.S. — [Resumo da oferta + urgencia]
P.P.S. — [Reaficar a garantia ou beneficio principal]
P.P.P.S. — [Historia final ou prova adicional — opcional]
```

O PS e lido por pessoas que pulam o corpo — deve ser autocontido.

---

### Passo 9 — Revisao Hopkins

**Agente:** `@claude-hopkins`

Executar auditoria completa no copy finalizado:

| Criterio Hopkins | Score (0-10) |
|-----------------|--------------|
| Specificity | ___ |
| Reason-why copy | ___ |
| Claims testados | ___ |
| Offer clarity | ___ |
| Headline power | ___ |
| Curiosity + service | ___ |
| Long copy justificado | ___ |
| Subheads + scanability | ___ |
| Testimonials / proof | ___ |
| Guarantee boldness | ___ |
| **TOTAL PONDERADO** | **___/100** |

**Gate:** Score minimo 85/100 para aprovar.  
Se abaixo: listar ajustes especificos e revisar.

---

## Output

**Arquivo gerado:** `sales-page-{produto}-{data}.md`

Estrutura do arquivo:
```
# Sales Page: [Produto]
## Meta
- Copywriter: [nome]
- Awareness Level: [1-5]
- Data: [data]
- Hopkins Score: [score]

## HEADLINE

## SUBHEADLINE

## LEAD

## CORPO
### Mecanismo Unico
### Historia de Credibilidade
### Bullets de Beneficio (15-25)
### Prova Social
### Stack de Valor

## OFERTA E PRECO

## GARANTIA

## CTA PRINCIPAL

## PS / PPS / PPPS
```

---

## Validacao

- [ ] Diagnostico Tier 0 concluido e anexado
- [ ] Headline + 4 alternativas escritas
- [ ] Lead completo (300-500 palavras minimas)
- [ ] Minimo 15 bullets de beneficio escritos
- [ ] Minimo 3 testimonials incluidos
- [ ] Stack de valor com preco de cada item
- [ ] Garantia especifica e bold
- [ ] CTA com verbo de acao + beneficio imediato
- [ ] Minimo 2 PS escritos
- [ ] Hopkins Score final: minimo **85/100**
- [ ] Sugarman Triggers: minimo **24/30 (80%)**
