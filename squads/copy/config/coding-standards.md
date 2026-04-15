# Coding Standards — Copy Squad

Padroes de output, formatacao, naming conventions e quality minimums para todos
os copywriters do squad. Seguir estes padroes garante consistencia entre agents,
facilita revisao e assegura os quality gates obrigatorios.

---

## Principio Fundamental

> "Copy is the salesman in print."  
> Todo output deve ser produzido como se fosse o melhor vendedor da empresa,
> falando diretamente para uma pessoa — especifica, com uma dor real, neste momento.

**Regra de ouro:** Se voce nao consegue imaginar uma pessoa especifica lendo esta
frase e se identificando, reescreva.

---

## Quality Gates Obrigatorios

### Gate 1: Hopkins Audit (minimo 85/100)

Todo output de copy principal (sales page, VSL, email de pitch, landing page)
deve passar pela auditoria Hopkins antes de ser entregue.

```
Score < 85: REPROVAR — listar gaps especificos e revisar
Score 85-89: APROVADO COM RESSALVAS — entregar com notas de melhoria
Score 90-100: APROVADO — entregar
```

### Gate 2: Sugarman 30 Triggers (minimo 80% / 24 de 30)

Os 30 gatilhos psicologicos de Joseph Sugarman devem cobrir ao menos 80% na
producao de sales pages e VSLs. Verificar com checklist em
`checklists/copy-quality-checklist.md`.

```
Coverage < 24/30: REPROVAR — identificar triggers ausentes e incorporar
Coverage 24-27/30: APROVADO
Coverage 28-30/30: EXCELENTE
```

### Gate 3: Tier 0 Obrigatorio

Nenhum copywriter Tier 1-3 produz output sem diagnostico Tier 0 concluido.
Todo arquivo de output deve referenciar o diagnostico correspondente.

```yaml
# Cabecalho obrigatorio em todo output de copy:
meta:
  produto: [nome]
  copywriter: [nome do agent]
  diagnostico_ref: [caminho do arquivo de diagnostico]
  awareness_level: [1-5]
  market_sophistication: [1-5]
  hopkins_score: [score final]
  sugarman_coverage: [N/30]
  data: [YYYY-MM-DD]
  versao: [v1.0 / v2.0 / etc.]
```

---

## Formato de Sales Page

### Estrutura de Arquivo

```markdown
# Sales Page: [Nome do Produto]
<!-- meta: ver cabecalho YAML acima -->

---

## [HEADLINE PRINCIPAL]
### [Subheadline de suporte]

---

## [LEAD]
[Primeiros 300-500 palavras — gancho, identificacao, promessa]

---

## [MECANISMO UNICO]
[Por que este produto e diferente — mecanismo nomeado]

---

## [HISTORIA DE CREDIBILIDADE]
[Quem sou eu — jornada, vulnerabilidade, resultado]

---

## [BULLETS DE BENEFICIO]
- **[Beneficio especifico]** — [expansao com detalhe ou curiosidade]
- **[Beneficio especifico]** — [...]
[Minimo 15 bullets, ideal 20-25]

---

## [PROVA SOCIAL]
> "[Depoimento especifico com resultado mensuravel]"  
> — [Nome Completo], [cargo/perfil relevante]

---

## [STACK DE VALOR]
**[Item 1]: [Nome]**  
Valor de mercado: R$ ___  
[O que inclui / beneficio especifico]

**[Item 2]: [Nome Bonus]**  
Valor: R$ ___  
[Descricao]

**VALOR TOTAL: R$ ___**

---

## [PRECO E OFERTA]
[Estrutura de preco com justificativa]

---

## [GARANTIA]
[Garantia especifica e bold — minimo 1 paragrafo]

---

## [CTA PRINCIPAL]
[Botao: verbo + beneficio]
[Texto abaixo do botao: reassurance + garantia em 1 linha]

---

## [PS]
[PS 1 — urgencia ou beneficio]  
[PS 2 — garantia]  
[PS 3 — historia final, opcional]
```

### Convencoes de Formatacao — Sales Page

```
Titulos de secao: ALL CAPS entre colchetes — [HEADLINE PRINCIPAL]
Subheadlines: Sentenca normal, bold quando enfatico
Paragrafos: Maximo 3-4 linhas — copy de resposta direta respira
Bullets: Comecar com verbo ou substantivo concreto — nunca com artigo
Numeros: Sempre numeral (7, nao sete) — especificidade aumenta credibilidade
Moeda: R$ [valor] — sem ponto de milhar em valores < R$ 10.000
Palavras-chave: Bold no primeiro uso em cada secao
Instrucoes de producao: [INSTRUCAO: texto] em itálico entre colchetes
```

---

## Formato de Email

### Estrutura de Arquivo

Cada email e um bloco separado no arquivo de sequencia:

```markdown
---
## Email [N]: [Nome descritivo do email]
**Tipo:** welcome | nurture | pitch | urgency | last-chance | onboarding
**Dia:** [D+N da sequencia]
**Segmento:** prospects | compradores | lista-quente | reativacao

**ASSUNTO:** [texto do assunto — max 50 caracteres]
**PRE-HEADER:** [texto pre-header — max 90 caracteres, nao repetir assunto]

---

[CORPO DO EMAIL]

Oi [primeiro_nome],

[Abertura — gancho na primeira frase]

[Corpo — conteudo de valor ou pitch]

[CTA — unico, claro, especifico]

[Assinatura — nome + cargo/funcao]

P.S. [Post-scriptum — urgencia ou beneficio adicional]

---
**LINK CTA:** [URL ou placeholder]
**TRACKING TAG:** [tag para segmentacao]
```

### Convencoes de Formatacao — Email

```
Primeira frase: hook em menos de 10 palavras — nunca comecar com "Eu"
Comprimento: 200-400 palavras para nurture, 400-700 para pitch
Paragrafos: 1-3 linhas — emails sao lidos em mobile
Links: Minimo 2, maximo 4 por email (anchor text descritivo, nao "clique aqui")
Assunto: Sem All Caps, sem exclamacoes excessivas, sem spam words
CTA: Um por email — se houver dois, usar o mesmo link
PS: Obrigatorio em emails de pitch, urgency e last-chance
Bold: Usar para o beneficio principal e o CTA no corpo — nao abusar
```

---

## Formato de VSL Script

### Estrutura de Arquivo

```markdown
# VSL Script: [Nome do Produto]
<!-- meta: cabecalho YAML -->

**Duracao estimada:** [X minutos]
**Formato:** Sellerator (Jon Benson) | Long-form | Mini-VSL
**Apresentador:** [nome]

---

## [HOOK] 0:00 — 0:15
*[INSTRUCAO: falar devagar, pausa apos primeira frase]*

[texto do script]

---

## [PROBLEMA] 0:15 — 1:15
*[INSTRUCAO: tom empatico, nao julgamental]*

[texto do script]

---

## [AGITACAO] 1:15 — 2:15
*[INSTRUCAO: ritmo levemente mais rapido]*

[texto do script]

---

## [BIG PROMISE] 2:15 — 2:45
*[INSTRUCAO: pausa antes de falar a promessa]*

[texto do script]

---

[... demais secoes ...]
```

### Convencoes de Formatacao — VSL Script

```
Instrucoes de entrega: *[INSTRUCAO: texto]* em itálico antes de cada secao
Timing: marcado em cada secao — [0:00 — 0:15]
Pausas: marcadas no texto com [PAUSA] onde necessario
Enfase: palavras-chave em CAPS para indicar enfase de voz (max 3 por paragrafo)
Tom de voz: descrito no inicio de cada secao
Transicoes: indicadas explicitamente entre secoes
Slides/B-roll: [SLIDE: descricao] para indicar ao produtor do video
```

---

## Naming Conventions

### Arquivos de Output

```
sales-page-{produto-slug}-{YYYY-MM-DD}.md
  Exemplo: sales-page-curso-copywriting-2026-04-09.md

email-sequence-{produto-slug}-{YYYY-MM-DD}.md
  Exemplo: email-sequence-mentoria-vendas-2026-04-09.md

vsl-script-{produto-slug}-{YYYY-MM-DD}.md
  Exemplo: vsl-script-software-crm-2026-04-09.md

headlines-{produto-slug}-{YYYY-MM-DD}.md
  Exemplo: headlines-ebook-prospeccao-2026-04-09.md

lancamento-{produto-slug}-{YYYY-MM-DD}.md
  Exemplo: lancamento-plf-curso-vendas-2026-04-09.md

diagnostico-{produto-slug}-{YYYY-MM-DD}.yaml
  Exemplo: diagnostico-produto-b2b-2026-04-09.yaml
```

**Regras de slug:**
```
- Lowercase
- Hifens em vez de espacos
- Sem acentos ou caracteres especiais
- Maximo 30 caracteres no slug do produto
```

### Versoes de Copy

```
v1.0: Primeiro draft completo
v1.1: Revisoes menores (ajuste de headline, bullets, CTA)
v1.2: Revisao Hopkins aplicada
v2.0: Reescrita significativa (mudanca de angulo ou copywriter)
```

---

## Minimos de Qualidade por Tipo de Peca

### Sales Page

| Metrica | Minimo | Ideal |
|---------|--------|-------|
| Palavras totais | 1.500 | 3.000-5.000 |
| Bullets de beneficio | 15 | 20-25 |
| Depoimentos | 3 | 5-8 |
| Mencoes do CTA | 3 | 4-6 |
| Hopkins Score | 85/100 | 90+ |
| Sugarman Triggers | 24/30 | 27+ |
| PS obrigatorios | 2 | 2-3 |

### Email Sequence

| Metrica | Minimo | Ideal |
|---------|--------|-------|
| Total de emails | 5 | 7-10 |
| Palavras por email (nurture) | 200 | 300-400 |
| Palavras por email (pitch) | 400 | 500-700 |
| Assunto (caracteres) | — | < 50 |
| Hopkins Score (emails pitch) | 85/100 | 90+ |
| CTA por email | 1 | 1-2 (mesmo link) |

### VSL Script

| Metrica | Minimo | Ideal |
|---------|--------|-------|
| Duracao estimada | 8 min | 12-20 min |
| Palavras totais | 1.200 | 2.000-3.000 |
| Instrucoes de entrega | 1 por secao | 2+ por secao |
| Hopkins Score | 85/100 | 90+ |
| Secoes obrigatorias | 8 | 11 (completo) |

### Headlines

| Metrica | Minimo | Ideal |
|---------|--------|-------|
| Total gerado | 20 | 50 |
| Top 5 selecionadas | 5 | 5 com subheadlines |
| Score minimo (top 5) | 75/100 | 85+ |
| Formatos cobertos | 4/6 | 6/6 |

---

## Proibicoes Absolutas (Copy que NUNCA deve aparecer)

```
PROIBIDO:
- "O melhor do mercado" (sem prova especifica)
- "Revolucionario" (cliche sem substancia)
- "Unico no mundo" (claim sem suporte)
- "Garanto que..." (sem especificar a garantia)
- "Resultados podem variar" (evasivo — Hopkins reprovaria)
- Caixa alta desnecessaria em toda a headline
- "Clique aqui" como anchor text de CTA
- Urgencia fake (contadores que resetam, "oferta expira" permanente)
- Depoimentos sem identificacao (nome + perfil obrigatorio)
- Claims medicos ou de saude sem disclaimer
- Percentuais de resultado sem base (ex.: "aumente 300% suas vendas")
```

---

## Revisao Final — Checklist Universal

Antes de entregar qualquer output de copy:

- [ ] Cabecalho YAML preenchido (produto, copywriter, diagnostico_ref, scores)
- [ ] Naming convention seguida (arquivo com slug + data)
- [ ] Hopkins Score calculado e documentado (minimo 85/100)
- [ ] Sugarman Triggers verificados para sales pages e VSLs (minimo 24/30)
- [ ] Nenhuma proibicao absoluta presente no copy
- [ ] Primeira frase hook em menos de 10 palavras
- [ ] CTA especifico (verbo + beneficio — nunca "clique aqui")
- [ ] Garantia especifica e bold (nao vaga)
- [ ] Depoimentos com nome + perfil + resultado especifico
- [ ] Versao do arquivo anotada (v1.0, v1.1, etc.)
