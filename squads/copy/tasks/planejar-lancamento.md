---
name: planejar-lancamento
description: |
  Planejar lancamento completo usando Product Launch Formula (PLF) de Jeff Walker.
  Sequencia: PLC1 (oportunidade), PLC2 (transformacao), PLC3 (ownership), Open Cart,
  Close Cart. Inclui emails, posts e sequencia completa de copy.
agent: jeff-walker
tier: 2
requires: diagnostico-copy
version: "1.0.0"
---

# Task: Planejar Lancamento (Product Launch Formula)

## Objetivo

Planejar e produzir o copy completo de um lancamento de produto usando o framework
Product Launch Formula de Jeff Walker. O PLF e o metodo de maior conversao para
produtos digitais de medio e alto ticket, criando antecipacao e autoridade antes
de abrir o carrinho. O resultado e o calendario completo com todos os assets de copy.

---

## Pre-requisitos

- [ ] `diagnostico-copy.md` executado e aprovado
- [ ] Produto digital validado (ja testado ou seed launch planejado)
- [ ] Preco e condicoes de lancamento definidos
- [ ] Data de abertura do carrinho (Open Cart) definida
- [ ] Janela de carrinho aberto (recomendado: 5-7 dias)
- [ ] Lista de leads ou audiencia de lancamento disponivel
- [ ] Plataforma de email configurada (ActiveCampaign / ConvertKit)
- [ ] Plataforma de video definida (YouTube / Vimeo / Wistia)

---

## Passos

### Passo 1 — Estrategia do Lancamento

**Agente:** `@jeff-walker`

Definir o tipo e escala do lancamento:

| Tipo | Audiencia Necessaria | Melhor Para |
|------|---------------------|-------------|
| Seed Launch | < 100 pessoas | Validar ideia, gerar primeiros clientes |
| Internal Launch | Lista propria | Produto validado, lancamento interno |
| JV Launch | Lista de parceiros | Escalar com afiliados |
| Evergreen PLF | Funil automatizado | Lancamento continuo |

**Output:**
```
Tipo de lancamento: [tipo]
Audiencia estimada: [N pessoas]
Meta de conversao: [%]
Meta de faturamento: [R$ X]
Open Cart: [data]
Close Cart: [data]
Duracao total do lancamento (pre-launch + cart): [N dias]
```

---

### Passo 2 — Pre-Launch Sequence (Antes do PLC1)

**Objetivo:** Preparar a audiencia emocionalmente antes de revelar o produto.

**Emails de aquecimento (7-14 dias antes do PLC1):**

```
Email Aquecimento 1 (D-14): "Algo esta chegando..."
  - Teaser sem revelar produto
  - Criar curiosidade sobre a transformacao
  - Pedir para colocar na lista de espera (segment)

Email Aquecimento 2 (D-7): "Voce pediu — eu ouvi"
  - Contar a historia de por que este produto existe
  - Citar feedback da audiencia
  - Contar que vai abrir "em breve"

Email Aquecimento 3 (D-3): "Nos proximos dias..."
  - Revelar que havera 3 videos de pre-launch
  - Criar antecipacao para o PLC1
  - Datas dos PLCs
```

---

### Passo 3 — PLC1: Video de Oportunidade

**Objetivo:** Abrir o lancamento mostrando a oportunidade / problema / transformacao possivel.
NÃO apresentar o produto ainda.

**Estrutura do video (15-20 minutos):**

```
[0:00 — 1:00] Hook + promessa do video
  "Neste video eu vou te mostrar [resultado transformador]
   e por que [momento atual] e o melhor momento para [acao]"

[1:00 — 4:00] A grande oportunidade
  - Que mudanca esta acontecendo no mercado?
  - Por que agora e o momento ideal?
  - Quem esta aproveitando isso?

[4:00 — 8:00] O obstaculo / problema
  - O que impede a maioria das pessoas?
  - Por que as solucoes comuns nao funcionam?
  - A causa raiz que ninguem esta vendo

[8:00 — 13:00] A transformacao possivel
  - Historia de alguem que superou o obstaculo
  - O que mudou na vida dela?
  - Como seria a SUA vida com esta transformacao?

[13:00 — 17:00] O que vem a seguir
  - Teaser do PLC2 (sem revelar produto)
  - Tarefa de engajamento: "comente abaixo X"
  - CTA: inscrever para notificacao do proximo video

[17:00 — 20:00] Q&A seed (se ao vivo) ou comentarios abertos
```

**Email acompanhando o PLC1:**
```
ASSUNTO: "[VIDEO 1] A oportunidade que [avatares] estao aproveitando"
PRE-HEADER: "E voce pode ser o proximo"

[Tease do conteudo do video]
[Link para o video]
[Tarefa de engajamento]
[PS: "Amanha o Video 2 explica como funciona na pratica"]
```

---

### Passo 4 — PLC2: Video de Transformacao

**Objetivo:** Mostrar o mecanismo de transformacao — como a mudanca acontece.
Ainda SEM revelar o produto explicitamente.

**Estrutura do video (15-20 minutos):**

```
[0:00 — 1:00] Recap do PLC1 + promessa do video de hoje

[1:00 — 5:00] O mecanismo de transformacao
  - Revelar o processo / sistema / metodo (sem nomear o produto)
  - "Aqui esta como [resultado] realmente acontece"
  - Passo 1, Passo 2, Passo 3 em alto nivel

[5:00 — 10:00] Casos de transformacao
  - 2-3 historias detalhadas de pessoas reais
  - Antes / depois especifico
  - O que elas fizeram diferente

[10:00 — 15:00] Por que isto funciona
  - A logica por tras do mecanismo
  - O que a ciencia / dados dizem
  - Por que outros metodos falham no ponto X

[15:00 — 18:00] Proximo passo
  - Teaser do PLC3 (vai revelar como acessar isso)
  - Tarefa: implementar um elemento do mecanismo
  - CTA: responder "qual resultado voce quer?"

[18:00 — 20:00] Engajamento + comentarios
```

**Email acompanhando o PLC2:**
```
ASSUNTO: "[VIDEO 2] Como [resultado especifico] realmente acontece"
[Link + contexto + tarefa]
[PS: "No Video 3 eu mostro exatamente o que eu fiz — e o que esta disponivel para voce"]
```

---

### Passo 5 — PLC3: Video de Ownership

**Objetivo:** Revelar o produto, criar desejo de posse, pre-anunciar a abertura do carrinho.

**Estrutura do video (20-30 minutos):**

```
[0:00 — 2:00] Recap + "hoje e diferente"

[2:00 — 8:00] Revelar o produto
  - Nome, formato, o que esta incluido
  - Por que foi criado (historia de origem)
  - O que o torna unico no mercado

[8:00 — 15:00] Tour completo do produto
  - Cada modulo / secao / bonus
  - O que voce vai saber/fazer ao final de cada parte
  - Resultados que outros obtiveram

[15:00 — 20:00] A oferta completa
  - Preco (pre-reveal antes da abertura)
  - Bonus exclusivos do lancamento
  - Garantia
  - Quem e ideal para este produto

[20:00 — 25:00] Abertura do carrinho — anuncio
  - "Voce vai poder se inscrever em [data/hora]"
  - Como se inscrever — instrucoes especificas
  - O que muda apos o lancamento (preco, bonus)

[25:00 — 30:00] Q&A ao vivo (se aplicavel) + engajamento
```

**Email acompanhando o PLC3:**
```
ASSUNTO: "[VIDEO 3] Revelando [produto] — e como conseguir"
[Abertura com urgencia suave]
[Link para o video]
[Anuncio da data de abertura]
[PS: "Coloca na agenda: [data] as [hora]"]
```

---

### Passo 6 — Sequencia Open Cart (5-7 dias)

**Agente:** `@jeff-walker` + `@dan-kennedy` (urgency)

Calendario de emails com o carrinho aberto:

```
Dia 1 (Abertura): "ABERTO: [produto] esta disponivel agora"
  - Email de abertura completo (oferta + stack + garantia)
  - Link de compra
  - Urgencia: bonus exclusivos so nas primeiras 48h

Dia 2: "Por que [resultado especifico] importa mais do que voce pensa"
  - Case study detalhado de um cliente
  - Reafirmar a oferta no final

Dia 3: "[Seu maior medo] sobre [produto] — respondido"
  - Atacar a maior objecao
  - FAQ estruturado
  - Depoimentos de clientes atuais

Dia 4: "[Bonus especial] so ate amanha"
  - Bonus adicional com prazo real
  - Urgencia etica e especifica

Dia 5: "A historia que me fez criar [produto]"
  - Historia emocional de origem
  - Por que isto existe
  - Reafirmar transformacao possivel

Dia 6 (D-1 fechamento): "Ultima chance amanha"
  - Email de urgencia — o que fecha e quando
  - Resumo da oferta completa
  - "Esta e sua ultima chance de [resultado]"

Dia 7 (Fechamento): 3 emails
  - Manha: "Fecha hoje — [oferta resumida]"
  - Tarde: "Poucas horas"
  - Noite: "Fechando em [X horas]"
```

---

### Passo 7 — Sequencia Close Cart (ultimo dia)

**Agente:** `@dan-kennedy`

3 emails no dia de fechamento (regra Kennedy: urgencia real, nao manipulacao):

```
Email Close 1 — 9h:
ASSUNTO: "Fecha hoje — [produto] disponivel ate meia-noite"
[Uma frase: o que fecha e quando]
[Oferta em 3 bullets]
[Link de compra]

Email Close 2 — 14h:
ASSUNTO: "10 horas. Depois, acabou."
[Urgencia pura — nao repetir toda a oferta]
[O maior beneficio / transformacao em uma frase]
[Link]

Email Close 3 — 21h:
ASSUNTO: "3 horas. Ultima chance real."
[Uma frase]
[Link]
[Sem PS — urgencia maxima]
```

---

### Passo 8 — Copy de Suporte

Assets adicionais do lancamento:

```
[ ] Pagina de opt-in para pre-launch (headline + beneficios + form)
[ ] Pagina de obrigado apos opt-in (proximos passos + expectativa)
[ ] Pagina de vendas completa (para referencia durante carrinho aberto)
[ ] Posts de redes sociais para cada PLC (3-5 posts por video)
[ ] Copy de anuncios pagos (se houver trafego pago)
[ ] Mensagens de WhatsApp/SMS para lista quente (se permitido)
```

---

### Passo 9 — Revisao Hopkins

**Agente:** `@claude-hopkins`

Auditoria do lancamento completo:
- [ ] Cada PLC tem promessa especifica no inicio?
- [ ] A progressao PLC1 → PLC2 → PLC3 cria antecipacao crescente?
- [ ] Prova social distribuida em todos os PLCs?
- [ ] Oferta clara e especifica no Open Cart?
- [ ] Urgencia do Close Cart e real e justificada?
- [ ] Hopkins Score dos emails de Open/Close Cart: minimo 85/100?

---

## Output

**Arquivo gerado:** `lancamento-{produto}-{data}.md`

```markdown
# Plano de Lancamento: [Produto]
## Meta
- Copywriter: Jeff Walker (PLF)
- Open Cart: [data]
- Close Cart: [data]
- Meta de faturamento: R$ [X]
- Hopkins Score (emails cart): [score]

## Calendario Completo
### Pre-Launch (D-14 a D-1)
### PLC1 — [data]: Oportunidade
### PLC2 — [data]: Transformacao
### PLC3 — [data]: Ownership
### Open Cart — [data]
### Close Cart — [data]

## Scripts dos PLCs
### PLC1 — Script Completo
### PLC2 — Script Completo
### PLC3 — Script Completo

## Sequencia de Emails
### Pre-Launch (3 emails)
### Open Cart (7 dias)
### Close Cart (3 emails)
```

---

## Validacao

- [ ] Diagnostico Tier 0 concluido e anexado
- [ ] Tipo de lancamento definido com justificativa
- [ ] Calendario completo com datas especificas
- [ ] 3 emails de aquecimento pre-PLC escritos
- [ ] Script completo do PLC1 (oportunidade — sem revelar produto)
- [ ] Script completo do PLC2 (transformacao — sem revelar produto)
- [ ] Script completo do PLC3 (ownership — revelando produto + oferta)
- [ ] Minimo 7 emails de Open Cart escritos
- [ ] 3 emails de Close Cart escritos para o dia final
- [ ] Copy de pagina de vendas como referencia
- [ ] Hopkins Score dos emails de cart: minimo **85/100**
- [ ] Urgencia do Close Cart baseada em deadline real
