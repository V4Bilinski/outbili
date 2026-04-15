# Sales Page Template
# Agente: {{copywriter_agent}}
# Produto: {{product_name}}
# Data: {{date}}
# Hopkins Score Target: 85/100 | Sugarman Target: 80%

---

## METADATA (preencher antes de escrever)

| Campo | Valor |
|-------|-------|
| Produto | {{product_name}} |
| Preco | {{price}} |
| Publico-alvo | {{target_audience}} |
| Nivel de Awareness | {{awareness_level}} (1-5) |
| Big Promise | {{big_promise}} |
| Unique Mechanism | {{unique_mechanism}} |
| Copywriter | {{copywriter_agent}} |
| Formato de entrega | {{delivery_format}} |

---

## [PRE-HEADLINE]

> Instrucao: Uma linha curta (max 12 palavras) que segmenta o leitor e cria contexto.
> Formato: Negrito ou caps, posicionado acima da headline principal.
> Exemplo: "Para empreendedores que faturam entre R$50k e R$500k por mes..."

**{{pre_headline}}**

---

## [HEADLINE]

> Instrucao: A headline mais importante. Deve capturar atencao em 3 segundos,
> prometer um beneficio especifico ou abrir um loop irresistivel de curiosidade.
> Evitar: palavras vagas, inteligencia desnecessaria, mais de 2 linhas.
> Formulas: "Como [resultado especifico] em [tempo] sem [maior objecao]"
>            "O [adjetivo surpreendente] metodo que [resultado]"
>            "[Numero] [tipo de pessoa] ja [resultado] com [mecanismo]"

# {{headline_principal}}

---

## [SUBHEADLINE]

> Instrucao: Expande a headline, adiciona especificidade ou urgencia.
> Max 2 linhas. Deve fazer o leitor querer continuar.

*{{subheadline}}*

---

## [LEAD — Abertura]

> Instrucao: Os primeiros 3-5 paragrafos sao os mais importantes da page.
> Existem 4 tipos de lead. Escolher o mais adequado ao nivel de awareness:
>
> TIPO 1 — STORY LEAD (Awareness 1-2): Comecar com historia pessoal ou de cliente
> TIPO 2 — PROBLEM LEAD (Awareness 2-3): Comecar agitando o problema
> TIPO 3 — PROMISE LEAD (Awareness 3-4): Comecar com a promessa principal
> TIPO 4 — NEWS LEAD (Awareness 4-5): Comecar com novidade ou revelacao
>
> Tipo selecionado: {{lead_type}}

{{lead_paragraph_1}}

{{lead_paragraph_2}}

{{lead_paragraph_3}}

---

## [PROBLEMA + AGITACAO]

> Instrucao: Descrever o problema em profundidade. Usar a linguagem exata
> do publico-alvo (voz do cliente). Agitar as consequencias de NAO resolver.
> Nao resolver ainda — apenas aprofundar a dor.

### O Problema

{{problem_description}}

### Por Que Isso Acontece

{{problem_root_cause}}

### O Que Acontece Se Voce Nao Resolver

{{consequences}}

---

## [TRANSICAO — Bridge]

> Instrucao: Paragrafo(s) de transicao que conectam o problema a solucao.
> Criar esperanca sem revelar a solucao ainda. "E se existisse uma forma..."

{{bridge_paragraph}}

---

## [SOLUCAO + MECANISMO UNICO]

> Instrucao: Apresentar o produto/servico como a solucao.
> Explicar o MECANISMO UNICO — por que funciona diferente de tudo que existe.
> Nomear o mecanismo (ex: "O Sistema X", "O Metodo Y").

### Apresentando: {{product_name}}

{{solution_introduction}}

### Como Funciona: {{unique_mechanism_name}}

{{mechanism_explanation}}

---

## [BODY — O Que Voce Vai Ter]

> Instrucao: Descrever o que esta incluido no produto/servico.
> Cada item: Feature → Beneficio → Por que importa para voce.
> Usar linguagem do leitor. Nao listar specs tecnicas sem traduzir em beneficio.

{{#each modules_or_components}}
### {{this.name}}

{{this.description}}

**O que isso significa para voce:** {{this.benefit}}

{{/each}}

---

## [BULLETS — Fascinations]

> Instrucao: 7-15 bullets de alta tensao psicologica.
> Formato ideal: "Como [fazer X] mesmo que [objecao]"
>               "O segredo de [resultado] que [autoridade] nao quer que voce saiba"
>               "A tecnica de [numero] minutos que [resultado especifico]"
> Cada bullet deve criar curiosidade e fazer o leitor pensar "preciso saber isso"

- {{bullet_1}}
- {{bullet_2}}
- {{bullet_3}}
- {{bullet_4}}
- {{bullet_5}}
- {{bullet_6}}
- {{bullet_7}}
- {{bullet_8}}
- {{bullet_9}}
- {{bullet_10}}
- {{bullet_11}}
- {{bullet_12}}

---

## [PROVA — Social Proof e Testimoniais]

> Instrucao: Minimo 3 testimoniais. Ideal: 5-8.
> Formato de testimonial de alta conversao:
>   - Nome completo + foto + empresa/cargo (credibilidade)
>   - Resultado especifico com numero ou tempo
>   - Objecao que tinham antes de comprar
>   - Como o produto resolveu
> Evitar: testimoniais vagos ("mudou minha vida"), sem resultados especificos

### O Que Clientes Dizem

---

**"{{testimonial_1_quote}}"**
— {{testimonial_1_name}}, {{testimonial_1_role}}
*Resultado: {{testimonial_1_result}}*

---

**"{{testimonial_2_quote}}"**
— {{testimonial_2_name}}, {{testimonial_2_role}}
*Resultado: {{testimonial_2_result}}*

---

**"{{testimonial_3_quote}}"**
— {{testimonial_3_name}}, {{testimonial_3_role}}
*Resultado: {{testimonial_3_result}}*

---

> [Adicionar mais testimoniais aqui se disponivel — ideal 5-8]

### Outros Resultados

> Instrucao: Cases, dados agregados, numeros de clientes, prints de resultados

{{social_proof_data}}

---

## [OFERTA]

> Instrucao: Apresentar a oferta completa com tudo que esta incluido.
> Calcular e mostrar o valor percebido total vs preco real.
> Adicionar bonus que aumentam valor percebido sem aumentar custo.
> Formato: Listar cada item com valor individual, depois mostrar total vs preco.

### Tudo Que Voce Recebe Hoje

| Item | Valor Normal |
|------|-------------|
| {{offer_item_1}} | R$ {{offer_item_1_value}} |
| {{offer_item_2}} | R$ {{offer_item_2_value}} |
| {{offer_item_3}} | R$ {{offer_item_3_value}} |
| **BONUS: {{bonus_1}}** | R$ {{bonus_1_value}} |
| **BONUS: {{bonus_2}}** | R$ {{bonus_2_value}} |
| **TOTAL DE VALOR** | **R$ {{total_value}}** |

### Seu Investimento Hoje

> ~~R$ {{original_price}}~~

# R$ {{sale_price}}

{{#if installments}}
ou {{installments}}x de R$ {{installment_value}}
{{/if}}

### Por Que Este Preco?

{{price_justification}}

---

## [GARANTIA]

> Instrucao: Garantia inverte o risco. Quanto mais forte a garantia,
> maior a conversao. Nomear a garantia (ex: "Garantia Satisfacao Total").
> Ser especifico sobre o que e como funciona o reembolso.

### {{guarantee_name}}

{{guarantee_description}}

**Prazo:** {{guarantee_days}} dias

**Como funciona:** {{guarantee_process}}

{{guarantee_strong_statement}}

---

## [URGENCIA / ESCASSEZ]

> Instrucao: Usar apenas se for REAL. Nunca mentir sobre urgencia/escassez.
> Tipos: tempo limitado, vagas limitadas, bonus por tempo, preco por tempo.
> Se nao houver urgencia real, omitir esta secao.

{{#if has_urgency}}
### {{urgency_headline}}

{{urgency_explanation}}

**{{urgency_deadline}}**
{{/if}}

---

## [CTA — Call to Action Principal]

> Instrucao: Um unico CTA claro e especifico.
> Incluir: verbo de acao + beneficio + reducao de fricao.
> Botao deve repetir o beneficio, nao apenas "Comprar" ou "Clique aqui".
> Adicionar nota de seguranca e formas de pagamento.

### {{cta_headline}}

{{cta_subtext}}

**[{{cta_button_text}}]**

{{payment_security_note}}
*{{payment_methods}}*

---

## [OBJECOES — FAQ]

> Instrucao: Responder as 5-7 principais objecoes de forma honesta e direta.
> Nao ser defensivo. Mostrar compreensao antes de responder.

**{{objection_1_question}}**
{{objection_1_answer}}

**{{objection_2_question}}**
{{objection_2_answer}}

**{{objection_3_question}}**
{{objection_3_answer}}

**{{objection_4_question}}**
{{objection_4_answer}}

**{{objection_5_question}}**
{{objection_5_answer}}

---

## [CTA SECUNDARIO]

> Instrucao: Repetir o CTA apos o FAQ. Para quem leu ate aqui e esta pronto.
> Mais direto que o CTA principal. Focar na transformacao.

{{cta_secondary_text}}

**[{{cta_secondary_button}}]**

---

## [PS]

> Instrucao: O PS e o segundo elemento mais lido (depois da headline).
> Usar para: reafirmar a promessa principal, urgencia, garantia ou historia.
> Maximo 3 PS. Cada um com objetivo diferente.

**P.S.** {{ps_1}}

**P.P.S.** {{ps_2}}

{{#if ps_3}}
**P.P.P.S.** {{ps_3}}
{{/if}}

---

## CHECKLIST DE QUALIDADE (preencher apos escrever)

### Hopkins Audit (meta: 85/100)
- [ ] Especificidade: /10
- [ ] Prova: /10
- [ ] Curiosidade: /10
- [ ] Clareza: /10
- [ ] Oferta: /10
- [ ] Headline: /10
- [ ] Beneficios: /10
- [ ] Reason Why: /10
- [ ] CTA: /10
- [ ] Flow: /10
- **TOTAL: /100**

### Sugarman Triggers (meta: 80%)
- [ ] Triggers presentes: /30
- [ ] Triggers nao aplicaveis: /30
- [ ] Score: % (presentes / aplicaveis)

### Revisoes
- [ ] V1 — Rascunho completo
- [ ] V2 — Revisao pelo copywriter
- [ ] V3 — Hopkins Audit aplicado
- [ ] V4 — Sugarman aplicado
- [ ] FINAL — Aprovado pelo @copy-chief
