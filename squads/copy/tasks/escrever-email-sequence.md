---
name: escrever-email-sequence
description: |
  Escrever sequencia completa de emails (5-12 emails): welcome, nurture, pitch,
  urgency e last chance. Dan Kennedy para urgency/escassez, Gary Halbert para storytelling.
agent: dan-kennedy | gary-halbert
tier: 2
requires: diagnostico-copy
version: "1.0.0"
---

# Task: Escrever Email Sequence

## Objetivo

Produzir uma sequencia completa de emails que move o lead de cold/warm para
comprador. A sequencia cobre o arco completo: relacionamento, educacao, pitch,
urgencia e fechamento. O copywriter e selecionado conforme o objetivo predominante:
Dan Kennedy para campanhas de urgency/scarcity, Gary Halbert para sequencias
de storytelling e nurture emocional.

---

## Pre-requisitos

- [ ] `diagnostico-copy.md` executado e aprovado
- [ ] Awareness Level do publico definido
- [ ] Objetivo da sequencia: nurture, lancamento, upsell, reativacao?
- [ ] Produto/oferta que sera pitchado
- [ ] Deadline real (se houver) para urgencia
- [ ] Lead magnet ou entrada da sequencia definida
- [ ] Plataforma de email: ActiveCampaign / ConvertKit / outro

---

## Passos

### Passo 1 — Definir Estrutura da Sequencia

**Agente:** copywriter selecionado + `@copy-chief`

Escolher o tamanho e ritmo da sequencia:

| Tipo | Emails | Cadencia | Quando usar |
|------|--------|----------|-------------|
| Mini-sequencia | 5 emails | Diario | Upsell, oferta quente |
| Sequencia padrao | 7 emails | Dias 1,2,3,5,7,9,10 | Lancamento simples |
| Sequencia completa | 10 emails | 2 semanas | Lancamento medio |
| Sequencia maxima | 12 emails | 3 semanas | Lancamento complexo / PLF |

**Output:**
```
Tipo selecionado: [tipo]
Total de emails: [N]
Cadencia: [dias]
Objetivo primario: [nurture / lancamento / upsell / reativacao]
```

---

### Passo 2 — Email 1: Welcome / Indoctrinacao

**Objetivo:** Confirmar opt-in, entregar lead magnet, estabelecer voz e expectativa.

**Estrutura:**
```
ASSUNTO: [confirma entrega + curiosidade]
PRE-HEADER: [complemento do assunto]

[Abertura pessoal — "Oi [nome], e serio..."]
[Entrega do prometido — link + instrucoes]
[Historia de origem — quem voce e, por que importa]
[O que vem ai — expectativa proximos emails]
[CTA suave — responda este email com X]
```

**Principios Kennedy:** Direto, sem rodeios, personalidade forte desde o email 1.  
**Principios Halbert:** Historia real, vulnerabilidade, conexao emocional imediata.

---

### Passo 3 — Emails 2-4: Nurture / Educacao

**Objetivo:** Construir autoridade, criar identificacao, educar para a oferta.

Cada email de nurture segue o padrao:

```
ASSUNTO: [curiosidade / promessa especifica]
PRE-HEADER: [complementa sem repetir]

[Gancho — historia ou fato surpreendente]
[Conteudo de valor — dica, insight, caso real]
[Ponte para o produto — "e exatamente isso que [produto] faz..."]
[CTA suave — "amanha te conto mais sobre X"]
```

**Progressao de awareness:**
- Email 2: aprofundar o problema (dor)
- Email 3: mostrar o caminho (solucao generica)
- Email 4: introduzir o mecanismo unico (teaser do produto)

---

### Passo 4 — Email 5: Pitch / Oferta Completa

**Objetivo:** Apresentar a oferta completa pela primeira vez.

**Estrutura Kennedy (urgency framework):**
```
ASSUNTO: [especifico, beneficio + prazo se houver]

[Abertura direta — "Estou abrindo [produto] para [X pessoas]"]
[Recapitulacao da dor — 2 paragrafos]
[Apresentacao da solucao — o que e, como funciona]
[Stack de valor — lista com precos]
[Preco final + justificativa]
[Garantia especifica]
[CTA primario — botao / link]
[PS — reafirmar urgencia ou garantia]
```

---

### Passo 5 — Emails 6-8: Nurture Pos-Pitch / Objecoes

**Objetivo:** Trabalhar objecoes especificas, trazer mais prova.

Cada email ataca uma objecao:

```
Email 6: "Isso funciona pra mim?" — historia de alguem semelhante ao avatar
Email 7: "Nao tenho tempo / dinheiro" — reframing de custo vs. custo de nao agir
Email 8: "Ja tentei antes e nao funcionou" — mecanismo unico, diferencial real
```

**Formato:**
```
ASSUNTO: [pergunta que o leitor ja fez para si mesmo]

[Reconhecer a objecao abertamente]
[Historia / prova que responde a objecao]
[Reafirmar a oferta + link]
[PS urgente]
```

---

### Passo 6 — Email 9: Urgency (Dan Kennedy Framework)

**Agente:** `@dan-kennedy`

**Objetivo:** Ativar senso de urgencia real e especifico.

**Regras Kennedy de urgencia:**
- Urgencia DEVE ser real — nunca fake
- Especificar o que muda apos o deadline
- Nao pedir desculpa pela urgencia

```
ASSUNTO: [deadline especifico — "Fecha amanha a meia-noite"]

[Abertura com o prazo exato]
[O que acontece depois do prazo — preco sobe, bonus some, vagas fecham]
[Recapitulacao da oferta em 3 bullet points]
[CTA urgente]
[PS: "Serio. [Data] meia-noite. Depois disso, nao tem como."]
```

---

### Passo 7 — Email 10-11: Last Chance Sequence

**Objetivo:** Capturar indecisos nas ultimas horas.

```
Email 10 (12h antes): "Ultima chance — [beneficio que vai perder]"
Email 11 (2h antes): "2 horas. Depois disso, tchau."
```

**Estrutura last chance:**
```
ASSUNTO: [urgencia maxima sem clickbait]

[Uma frase: o que fecha e quando]
[Relembrar o maior beneficio / transformacao]
[Relembrar a garantia — zero risco]
[CTA unico, direto]
[Sem PS longo — urgencia pura]
```

---

### Passo 8 — Email 12: Fechamento / Pos-Venda (opcional)

**Para quem nao comprou:**
```
ASSUNTO: "Fechou. [Produto] esta fora — o que vem a seguir"
[Confirmar que fechou]
[Deixar porta aberta — lista de espera / proxima turma]
[Oferecer algo de valor gratuito como goodwill]
```

**Para quem comprou:**
```
ASSUNTO: "Bem-vindo(a) — o que acontece agora"
[Confirmar acesso]
[Quick win — primeiro passo especifico]
[Expectativa de onboarding]
```

---

### Passo 9 — Revisao de Qualidade

**Checklist por email:**
- [ ] Assunto com menos de 50 caracteres
- [ ] Pre-header nao repete o assunto
- [ ] Primeira frase hooks em menos de 10 palavras
- [ ] Nenhum jargao desnecessario
- [ ] CTA unico por email (maximo 2 mencoes do link)
- [ ] PS em todos os emails de pitch/urgency

**Hopkins Check por sequencia:**
- [ ] Especificidade (datas, numeros, resultados reais)
- [ ] Reason-why em cada claim
- [ ] Prova social distribuida na sequencia
- [ ] Oferta clara no pitch email
- [ ] Garantia reaparecendo nos ultimos emails

---

## Output

**Arquivo gerado:** `email-sequence-{produto}-{data}.md`

Estrutura do arquivo:
```
# Email Sequence: [Produto]
## Meta
- Copywriter: [nome]
- Total de emails: [N]
- Cadencia: [dias]
- Awareness Level: [1-5]
- Data: [data]

## Email 1 — Welcome
### Assunto:
### Pre-header:
### Corpo:

## Email 2 — [tema]
...
```

---

## Validacao

- [ ] Diagnostico Tier 0 concluido e anexado
- [ ] Minimo 5 emails escritos (welcome, nurture x2, pitch, urgency)
- [ ] Maximo 12 emails na sequencia
- [ ] Cadencia definida com dias especificos
- [ ] Assunto de cada email com menos de 50 caracteres
- [ ] Urgencia baseada em prazo real (nao fake)
- [ ] CTA unico por email
- [ ] PS em todos os emails de pitch e urgency
- [ ] Sequencia pos-compra separada da sequencia de prospects
- [ ] Hopkins Score da sequencia: minimo **85/100**
