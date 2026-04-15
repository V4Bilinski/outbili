# Utility Templates Knowledge Base

> Fonte primaria: "Guia de Mensagens de Utilidade 1.5" (Marcelo Tavora) + Meta Official Documentation 2025-2026
>
> Portfolio oficial Meta: `data/meta-utility-portfolio.md` — 165 templates oficiais organizados por categoria

---

## 1. O que sao Mensagens de Utilidade

Mensagens enviadas para leads/clientes com objetivo de entregar informacoes valiosas ou suporte em tempo real. Agregam valor imediato: atualizacoes, lembretes, confirmacoes, instrucoes.

**Objetivo estrategico:** Abrir janela de 24h de conversa direta com o lead a custo 7.8x menor que marketing. Dentro da janela, pode-se engajar com abordagens de venda e conversao.

### Custo Brasil (2025)
| Tipo | Custo/msg (USD) | Multiplicador |
|------|----------------|---------------|
| Utility | $0.008 | 1x (base) |
| Marketing | $0.0625 | ~7.8x |
| Utility dentro da janela 24h | GRATIS | 0x (desde Jul/2025) |

---

## 2. Framework PACTO

Framework para criar mensagens que passam como utilidade na aprovacao da Meta.

### P — Palavra de Status
Termos que indicam atualizacao ou novidade. Comece a mensagem com a atualizacao.

**Palavras aprovadas:**
Aprovada, Confirmada, Processada, Enviada, Recebida, Disponivel, Atualizada, Validada, Registrada, Concluida, Liberada, Agendada, Aguardando confirmacao, Em andamento, Pendente, Pronta para uso, Em processamento, Em analise, Em preparacao, Na fila, Revisada, Autorizada

**Palavra coringa:** "Confirmada" — a que mais aprova templates. Em caso de duvida, use-a no inicio, meio ou fim.

### A — Apresentacao Contextual
Saudacao personalizada + identificacao de quem fala. Tom de notificacao pessoal.
- "Oi, {Primeiro Nome}! Aqui e [Nome do Expert]."
- Evite expressoes empolgadas demais. Tom neutro e informativo.

### C — Clareza e Tom Informativo
Tom claro, objetivo, sem exageros. Convite para participar de algo ja acontecendo.
- USE: "acompanhar", "participar", "estar presente"
- NAO USE: "a melhor X do mundo", superlativos, promessas

### T — Tomada de Acao com Servico
CTA que parece servico, nao venda.
- USE: "acompanhar", "receber", "confirmar"
- NAO USE: "garantir", "adquirir", "comprar"

### O — Omissao de Apelos Promocionais
Zero frases que incentivam acao imediata promocional. Deve soar como lembrete/atualizacao.
- NUNCA: "Nao perca essa chance!"
- SIM: "A transmissao ao vivo comeca em breve"

---

## 3. Palavras Proibidas (Reclassificacao Instantanea)

| Palavra/Frase | Risco |
|---------------|-------|
| Desconto | CRITICO |
| Oferta | CRITICO |
| Promocao | CRITICO |
| Aproveite agora | CRITICO |
| Compre ja | CRITICO |
| Nao perca | CRITICO |
| Ultima chance | CRITICO |
| Imperdivel | CRITICO |
| Exclusivo | ALTO |
| Preco especial | CRITICO |
| Ganhe | ALTO |
| Economize | ALTO |
| So hoje | CRITICO |
| Oferta limitada | CRITICO |
| Bonus | ALTO |
| Brinde | ALTO |
| Frete gratis | CRITICO |
| Venda | ALTO |
| Liquidacao | CRITICO |
| Preco baixo | ALTO |
| Reserve ja | ALTO |
| Corra | ALTO |
| Descubra nossa linha completa | ALTO |
| Clique aqui para comprar | CRITICO |
| Condicao exclusiva | ALTO |
| Condicao especial | ALTO |
| Reservada | MEDIO (pode causar rejeicao — use "Confirmada" em vez) |

---

## 4. Frameworks de Mensagens por Caso de Uso

### 4.1 Boas-Vindas (Modelo Campeao)

**Testado em 5+ nichos, diversos tamanhos de lancamento.**

```
Ei, {Primeiro Nome}! [Nome do Expert] aqui.

Sua inscricao para o [Nome do Projeto/Curso] esta confirmada!

Posso te mandar mais algumas informacoes sobre a sua inscricao por aqui? Clique em uma das opcoes abaixo 👇

[Receber Informacoes] [Bloquear Contato]
```

**Variacoes:**
- **Inscricao quase completa:** "esta quase confirmada. Preciso confirmar algumas informacoes..."
- **Lembrete de acesso:** "foi registrada! Agora so falta um passo..."
- **Detalhes iniciais:** "foi oficialmente confirmada! Em breve, voce tera acesso completo."

### 4.2 Captacao (Bases Nao Inscritas)

**Regras criticas:**
- Lead scoring obrigatorio para bases frias
- Taxa de "Bloquear Contato" > 4% = sinal de perigo
- So continue com bases frias se qualidade da conta = Alta
- Meta de taxa de interacao: >30%

```
Oi, {Primeiro Nome}! Aqui e [Nome do Expert].

Sua vaga para o [Nome do Evento], que acontecera na proxima semana, esta confirmada! Posso te enviar mais informacoes para voce se preparar?

👇 Para saber mais, escolha uma opcao abaixo

[Sim, quero saber] [Bloquear Contato]
```

**Variacoes:**
- **Vaga liberada:** "Sua vaga foi liberada! Esse evento sera na proxima semana..."
- **Participacao confirmada:** "Sua participacao esta oficialmente confirmada..."

### 4.3 Antecipacao de CPL (Live/Evento)

**Estrategia:** Enviar notificacao de antecipacao horas antes do CPL (ex: CPL as 19h, enviar as 9h). Taxas de clique de 40% no CPL1.

**Funil:** Antecipacao → Interacao → Link da live → Aguarde ate hora X → "Estou ao vivo" → Repescagem

```
Oi, {Primeiro Nome}! [Nome do Expert] aqui.

A primeira aula do [Nome do Projeto/Curso] esta confirmada para hoje as [Hora]! Nessa aula, vamos abordar [Resumo Breve].

Posso te enviar o link da aula assim que comecarmos? 👇 Clique em "Sim" abaixo

[Sim] [Sair] [Bloquear Contato]
```

### 4.4 Order Bump (Pos-Compra)

```
Oi, {Primeiro Nome}! [Nome do Expert] aqui!

Parabens pela sua inscricao no [Nome do Evento]! Sua inscricao foi confirmada, e agora voce esta a um passo de [Resumo do Beneficio].

Alem disso, tenho um convite especial para voce que pode aprimorar ainda mais sua experiencia. Posso te enviar mais informacoes?

[Sim, quero saber mais] [Bloquear Contato]
```

### 4.5 Upsell (Suporte + Venda)

```
Oi, {Primeiro Nome}! [Nome do Expert] aqui, tudo bem?

Sua compra do [Nome do Produto] foi confirmada recentemente, e estou passando so para verificar se o acesso esta funcionando certinho.

Me da um ok clicando no botao abaixo, so para eu saber que esta tudo certo! 👇

[Esta tudo certo] [Preciso de ajuda] [Bloquear Contato]
```

### 4.6 Downsell (Pos-Carrinho)

```
Oi, {Primeiro Nome}! Aqui e [Nome do Expert]. Tudo bem?

O [Nome do Produto/Oferta] esta confirmado para voce! Clique no botao abaixo e descubra como ele pode te ajudar 👇

[Saber mais] [Bloquear Contato]
```

### 4.7 Recuperacao Pre-Checkout

```
Oi, {Primeiro Nome}! [Nome do Expert] aqui, tudo bem?

As inscricoes para o [Nome do Evento] se encerraram ontem, mas sua vaga ainda esta confirmada!

Para saber mais informacoes, clique no botao "Saber mais" abaixo 👇

[Saber mais] [Bloquear Contato]
```

---

## 5. Estrategia "Variavel Camuflagem"

### Conceito
Tudo que faria a mensagem ser classificada como marketing vira variavel. No momento do disparo, injeta-se a copy persuasiva nas variaveis.

### Passo a Passo
1. **Crie um Campo de Usuario Personalizado** na ferramenta de automacao (ex: ManyChat)
2. **Escreva a mensagem com pontos sensiveis em variaveis:** nome do evento, promessa forte, descricao de beneficio, detalhes de oferta, storytelling
3. **Na aprovacao, preencha variaveis com texto 100% utilidade:**
   - "Sua aula programada para hoje, 26/05/2025, as 19h foi cancelada."
   - "Sua assinatura foi cancelada com sucesso."
   - "Sua encomenda esta a caminho."
   - "Sua solicitacao de suporte foi recebida e esta em analise."
   - "O acesso a sua plataforma foi liberado."
   - "Sua senha foi redefinida com sucesso."
   - "Seu agendamento do dia 29/05/2025 esta confirmado."
4. **No envio real, defina o campo com a copy persuasiva**

### Restricoes Tecnicas
- Variaveis NAO aceitam quebra de linha
- Para espacar: use multiplas variaveis com linha em branco entre elas no template
- Apenas saudacao, palavras de status e CTA neutro ficam no template fixo

### Aviso
Essa tecnica e uma "burla" no sistema da Meta. Funciona ate a presente data (2025), mas riscos existem. Use com consciencia.

---

## 6. Politicas Meta 2025-2026

### Timeline de Mudancas
| Data | Mudanca |
|------|---------|
| Abr 9, 2025 | Meta auto-reclassifica utility→marketing. `allow_category_change` removido |
| Abr 16, 2025 | Contas reincidentes perdem aviso previo de 24h antes da reclassificacao |
| Jul 1, 2025 | Definicao de utility mais restritiva (baseada em engagement/sentimento) |
| Jul 1, 2025 | Utility GRATIS dentro da janela de servico 24h |

### Sinais de Reclassificacao
- Conteudo promocional + transacional combinados = MARKETING sempre
- Upsell sutil ou nudge promocional = reclassificacao
- Historico de reclassificacoes na conta = aprovacao mais dificil para novos templates
- Templates reclassificados continuam aprovados mas cobram tarifa de marketing

### Metricas de Saude
- Taxa de "Bloquear Contato" < 4% = seguro
- Taxa de interacao > 30% = saudavel
- Qualidade da conta ALTA = pode arriscar com bases mais frias

---

## 7. Principios de Design de Mensagem

### Menos e Mais
- WhatsApp e app de conversas rapidas, nao romance
- Nenhum lead para pra ler dissertacao
- Quanto mais "ruim de copy" (simples, direto), melhor para utility

### Estrutura Padrao
```
[Saudacao + Nome] + [Identificacao]
[Status Word + Contexto da acao/inscricao]
[Pergunta de servico / convite para proxima acao]
[Botoes: Acao + Bloquear Contato]
```

### Botoes Recomendados
| Contexto | Botao Positivo | Botao Negativo |
|----------|---------------|----------------|
| Boas-vindas | Receber Informacoes | Bloquear Contato |
| Captacao | Sim, quero saber | Bloquear Contato |
| CPL | Sim / Receber Link | Sair / Bloquear Contato |
| Pos-compra | Esta tudo certo | Preciso de ajuda / Bloquear Contato |
| Recovery | Saber mais | Bloquear Contato |

---

## 8. Limites Tecnicos de Template (Validacao Obrigatoria)

| Componente | Limite | Notas |
|-----------|--------|-------|
| Header (text) | 60 caracteres | Suporta 1 variavel |
| Header (image) | JPG/PNG, recomendado 800x418px | — |
| Header (video) | MP4, max 16MB | — |
| Header (document) | PDF, max 100MB | — |
| Body | 1024 caracteres | Suporta multiplas variaveis |
| Footer | 60 caracteres | SEM variaveis |
| Quick Reply buttons | Max 10 botoes, 25 chars cada | — |
| URL buttons | Max 2 botoes, 25 chars label | Suporta sufixo dinamico |
| Phone buttons | Max 1 botao, 25 chars label | — |
| Total buttons | Max 10 combinados | — |
| Template name | Lowercase, underscores, max 512 chars | Sem espacos ou caracteres especiais |
| Variable example | Obrigatorio para cada `{{variavel}}` | Meta avalia o example na analise |

### Tipos de Variavel e Examples Seguros

| Tipo Meta | Sintaxe | Example seguro para aprovacao |
|-----------|---------|-------------------------------|
| texto | `{{texto}}` ou `{{1}}` | "Maria Silva", "consulta medica", "pedido #12345" |
| data | `{{data}}` | "15 de marco de 2026", "2026-03-15" |
| valor | `{{valor}}` | "R$ 150,00", "US$ 12,34" |
| numero | `{{numero}}` | "5", "1234", "3-5 dias uteis" |
| endereco | `{{endereco}}` | "Rua dos Jardins, 01, Bela Vista, SP" |
| telefone | `{{telefone}}` | "+55 11 99999-9999" |
| url | `{{url}}` | "https://example.com/status" |
| nome_comercial | `{{nome comercial}}` | "BilinskiZap" |
| group_id | `{{group_id}}` | "https://chat.whatsapp.com/abc123" |

---

## 9. Anti-Patterns: Motivos Reais de Rejeicao

### Caso 1: "Reservada" vs "Confirmada"
- **REJEITADO:** "Sua vaga esta *Reservada*" — Meta interpreta como marketing (escassez implicita)
- **APROVADO:** "Sua vaga esta *Confirmada*" — Tom de notificacao pura
- **Licao:** "Reservada" esta na lista de palavras proibidas por implicar exclusividade

### Caso 2: Mensagem longa demais
- **REJEITADO:** Mensagem com 800+ chars detalhando beneficios e features
- **APROVADO:** Mesma mensagem cortada para 200 chars com CTA simples
- **Licao:** Utility = notificacao, nao pitch de vendas. Menos e mais.

### Caso 3: Tom empolgado
- **REJEITADO:** "Estou SUPER empolgado para a live de hoje!!!"
- **APROVADO:** "A live de hoje esta confirmada para as 19h."
- **Licao:** Exclamacoes multiplas e superlativos emocionais = marketing

### Caso 4: CTA de venda disfarçado
- **REJEITADO:** "Garanta sua vaga agora!" / "Adquira o acesso completo"
- **APROVADO:** "Posso te enviar mais detalhes?" / "Receber informacoes"
- **Licao:** Verbos de venda (garantir, adquirir, comprar) = reclassificacao

### Caso 5: Conteudo misto (transacional + promocional)
- **REJEITADO:** "Seu pedido foi enviado! Aproveite 10% de desconto na proxima compra"
- **APROVADO:** "Seu pedido foi enviado! Rastreie abaixo."
- **Licao:** Qualquer elemento promocional junto com transacional = marketing SEMPRE

### Caso 6: Sem palavra de status
- **REJEITADO:** "Oi! Temos uma novidade incrivel para voce sobre nosso evento"
- **APROVADO:** "Oi! Sua inscricao no evento esta confirmada"
- **Licao:** Sem status word = sem ancora utility = reclassificacao provavel

### Caso 7: Historico de conta ruim
- **CENARIO:** Conta com 5+ templates reclassificados nos ultimos 30 dias
- **RESULTADO:** Templates identicos que antes passavam agora sao rejeitados
- **Licao:** Meta endurece aprovacao baseado no historico. Use variavel camuflagem como fallback.

---

## 10. Regras de Formatacao

| Formatacao | Sintaxe | Impacto na Classificacao |
|-----------|---------|--------------------------|
| **Bold** | `*texto*` | Neutro — use para status words |
| _Italico_ | `_texto_` | Neutro — use com moderacao |
| ~~Tachado~~ | `~texto~` | Evite — parece promocional |
| `Monospace` | `` `texto` `` | Neutro — use para codigos/numeros |
| Emojis | Unicode | 1-2 max. Muitos emojis = tom marketing |
| CAPS LOCK | "CONFIRMADA" | Evite — tom de urgencia/marketing |
| Quebra de linha | `\n` | Use para clareza. Variaveis NAO suportam |

---

## Referencias

- Guia de Mensagens de Utilidade v1.5 (Marcelo Tavora / Mentoria Asgard)
- Meta Template Categorization: https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/
- Meta Utility Templates: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/utility-templates/
- Meta Template Categorization (new): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization
- WhatsApp Business Policy: https://business.whatsapp.com/policy
