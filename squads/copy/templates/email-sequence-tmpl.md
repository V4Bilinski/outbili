# Email Sequence Template
# Agente: {{copywriter_agent}}
# Produto/Campanha: {{product_name}}
# Tipo de Sequencia: {{sequence_type}}
# Data de Inicio: {{start_date}}

---

## METADATA DA SEQUENCIA

| Campo | Valor |
|-------|-------|
| Produto/Campanha | {{product_name}} |
| Objetivo da Sequencia | {{sequence_objective}} |
| Tipo | {{sequence_type}} |
| Publico | {{target_audience}} |
| Nivel de Awareness | {{awareness_level}} (1-5) |
| Numero de Emails | {{total_emails}} |
| Duracao Total | {{total_days}} dias |
| Copywriter | {{copywriter_agent}} |

---

## VISAO GERAL DA SEQUENCIA

> Instrucao: Mapear todos os emails antes de escrever qualquer um.
> Cada email deve ter UM objetivo principal. Nunca tentar fazer dois objetivos no mesmo email.

| # | Dia | Subject Line | Preview Text | Objetivo Principal | Tipo de Trigger | Agente |
|---|-----|-------------|--------------|-------------------|----------------|--------|
| 1 | {{email_1_day}} | {{email_1_subject}} | {{email_1_preview}} | {{email_1_objective}} | {{email_1_trigger}} | {{email_1_agent}} |
| 2 | {{email_2_day}} | {{email_2_subject}} | {{email_2_preview}} | {{email_2_objective}} | {{email_2_trigger}} | {{email_2_agent}} |
| 3 | {{email_3_day}} | {{email_3_subject}} | {{email_3_preview}} | {{email_3_objective}} | {{email_3_trigger}} | {{email_3_agent}} |
| 4 | {{email_4_day}} | {{email_4_subject}} | {{email_4_preview}} | {{email_4_objective}} | {{email_4_trigger}} | {{email_4_agent}} |
| 5 | {{email_5_day}} | {{email_5_subject}} | {{email_5_preview}} | {{email_5_objective}} | {{email_5_trigger}} | {{email_5_agent}} |
| 6 | {{email_6_day}} | {{email_6_subject}} | {{email_6_preview}} | {{email_6_objective}} | {{email_6_trigger}} | {{email_6_agent}} |
| 7 | {{email_7_day}} | {{email_7_subject}} | {{email_7_preview}} | {{email_7_objective}} | {{email_7_trigger}} | {{email_7_agent}} |

> [Adicionar linhas para sequencias mais longas]

---

## TIPOS DE SEQUENCIA (referencia)

| Tipo | Emails | Objetivo | Copywriter Ideal |
|------|--------|----------|-----------------|
| Welcome | 3-5 | Onboarding, primeira impressao | @robert-collier |
| Nurture | 5-10 | Educacao + construcao de confianca | @gary-halbert |
| Launch | 6-10 | PLF pre-venda | @jeff-walker |
| Vendas | 5-7 | Conversao direta | @dan-kennedy |
| Reativacao | 3-5 | Recuperar inativo | @gary-halbert |
| Onboarding | 5-7 | Pos-compra, ativacao | @ry-schwartz |
| Abandono | 2-3 | Recuperar carrinho abandonado | @dan-kennedy |

---

## TEMPLATE DE EMAIL INDIVIDUAL

> Copiar e preencher para cada email da sequencia

---

### EMAIL {{email_number}} — {{email_name}}

**Dia:** {{send_day}}
**Horario sugerido:** {{send_time}}
**Objetivo:** {{email_objective}}
**Trigger Sugarman principal:** {{primary_trigger}}
**Agente executor:** {{email_agent}}

---

#### SUBJECT LINE

> Instrucao: O subject e o email mais importante — sem ele, nada e lido.
> Formatos de alta abertura:
>   - Curiosidade: "Voce ja tentou [X]?" / "Isso nao deveria funcionar..."
>   - Beneficio: "Como [resultado especifico] em [tempo]"
>   - Historia: "Quando [situacao surpreendente] aconteceu..."
>   - Urgencia: "[X] horas. Depois disso, acabou."
>   - Pattern interrupt: "[Confissao]" / "Errei feio aqui"
>   - Numero: "3 razoes pelas quais [resultado]"
>
> Regras:
> - Max 50 caracteres (ideal: 30-40)
> - Sem clickbait (deve entregar o que promete)
> - Personalizar com {{first_name}} quando possivel
> - Evitar spam triggers: GRATIS, %, $$$, URGENTE em caps

**Subject:** {{email_subject_line}}

**Alternativas de subject para teste A/B:**
- A: {{subject_alt_a}}
- B: {{subject_alt_b}}

---

#### PREVIEW TEXT

> Instrucao: Texto exibido apos o subject no inbox. Complementa o subject,
> nao o repete. Max 90 caracteres. Deve criar curiosidade adicional.

{{preview_text}}

---

#### CORPO DO EMAIL

> Instrucao: Formato recomendado para emails de copy:
> - Abertura de loop (hook) nas primeiras 2 linhas
> - Paragrafos curtos (max 3 linhas) — mobile first
> - Uma ideia por paragrafo
> - Linguagem conversacional, como carta para um amigo
> - Sem formatacao excessiva (italico e negrito apenas para enfase real)
> - CTA unico e claro
> - PS obrigatorio (segundo elemento mais lido)

Ola, {{first_name}},

{{email_opening_hook}}

{{email_paragraph_1}}

{{email_paragraph_2}}

{{email_paragraph_3}}

{{email_paragraph_4}}

{{email_bridge_to_cta}}

---

#### CTA

> Instrucao: Um unico CTA por email. Especifico, com verbo de acao.
> Para emails de vendas: link de compra com contexto.
> Para emails de nutricao: link para conteudo + beneficio de clicar.
> Evitar: "Clique aqui", "Saiba mais" sem contexto.

**{{cta_text}}**
[{{cta_button_or_link_text}}]({{cta_url}})

---

#### ASSINATURA

{{sender_name}}
{{sender_title}}
{{company_name}}

---

#### PS

> Instrucao: PS e obrigatorio. E o segundo elemento mais lido.
> Usar para: reafirmar beneficio, criar urgencia, contar continuacao da historia,
> ou dar um recado pessoal que reforca a relacao.

**P.S.** {{ps_text}}

{{#if ps_2}}
**P.P.S.** {{ps_2_text}}
{{/if}}

---

#### METRICAS ESPERADAS

| Metrica | Benchmark | Meta desta Sequencia |
|---------|-----------|---------------------|
| Taxa de Abertura | 20-35% | {{open_rate_target}} |
| CTR | 2-5% | {{ctr_target}} |
| Conversao (se venda) | 1-3% | {{conversion_target}} |
| Descadastro | < 0.5% | < 0.5% |

---

#### CHECKLIST DO EMAIL

- [ ] Subject <= 50 caracteres
- [ ] Preview text complementa o subject (nao repete)
- [ ] Hook nas primeiras 2 linhas
- [ ] Paragrafos curtos (max 3 linhas cada)
- [ ] UM unico objetivo no email
- [ ] UM unico CTA
- [ ] PS presente e forte
- [ ] Linguagem conversacional (sem jargao corporativo)
- [ ] Mobile-friendly (testado mentalmente em tela pequena)
- [ ] Trigger Sugarman principal identificado e presente

---

> [Repetir o bloco "EMAIL X" para cada email da sequencia]

---

## REGRAS GERAIS DA SEQUENCIA

### Frequencia
- Sequencia de boas-vindas: email a cada 1-2 dias
- Nurture: 2-3x por semana
- Launch: 1x por dia (close: 2-3x no ultimo dia)
- Pos-compra: espacar mais (nao bombardear cliente)

### Tom de Voz
- {{tone_description}}
- Evitar: {{tone_to_avoid}}

### Segmentacao
- Segmento principal: {{main_segment}}
- Remover se: {{remove_condition}} (ex: "comprou", "clicou no link X")
- Bifurcar se: {{branch_condition}} (ex: "abriu mas nao clicou")

### Variaveis de Personalizacao Disponiveis
- {{first_name}} — nome
- {{company}} — empresa
- {{city}} — cidade
- {{last_purchase}} — ultimo produto comprado
- {{signup_source}} — origem do lead
- [adicionar variaveis do ESP utilizado]

---

## REVISAO E APROVACAO

| Email | V1 | V2 (revisao) | Hopkins Check | Aprovado |
|-------|----|----|---|---|
| Email 1 | [ ] | [ ] | [ ] | [ ] |
| Email 2 | [ ] | [ ] | [ ] | [ ] |
| Email 3 | [ ] | [ ] | [ ] | [ ] |
| Email 4 | [ ] | [ ] | [ ] | [ ] |
| Email 5 | [ ] | [ ] | [ ] | [ ] |
| Email 6 | [ ] | [ ] | [ ] | [ ] |
| Email 7 | [ ] | [ ] | [ ] | [ ] |
