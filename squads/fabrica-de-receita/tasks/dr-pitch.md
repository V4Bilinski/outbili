# Pitch Destrava Receita — Diagnostico Express + Proposta

---
name: dr-pitch
description: Conduzir pitch DR do primeiro contato ate proposta formal (absorve trabalho de Dara v1.0)
agent: dr-chief
created_at: 2026-04-22
origem: Migrado do agent destrava-receita-consultant (Dara) na refatoracao v2.0.0 do squad
---

## Objetivo

Conduzir o engajamento de pre-venda DR do pitch inicial ate a entrega formal da proposta.
Garantir que o cliente compreenda a metodologia das 8 travas, viva o diagnostico express
ao vivo e receba uma proposta DR (X/O/T/E) conectada com sua dor real e ROI quantificado.

## Pre-requisitos

- Contato com decisor do prospect (fundador, CRO, VP Growth)
- Informacoes minimas: faturamento estimado, porte, mercado, fase (0-100k / 100k-1M / scale)
- 30-45 minutos agendados para a sessao de pitch + diagnostico
- Cases de sucesso relevantes ao setor do prospect
- Acesso aos materiais de pitch (deck, diagnostico template)

## Passos

### Step 1: Abertura (2 min)

Enquadrar a metodologia antes de mergulhar em perguntas.

```
"A maioria das empresas nao tem problema de mercado.
Tem problema de sistema de receita.
Nos identificamos 8 travas que impedem o crescimento previsivel.
A Destrava Receita e o processo para destravar essas travas, uma a uma."
```

### Step 2: Diagnostico Express (15 min — 5 perguntas)

Aplicar as 5 perguntas de diagnostico rapido e mapear visualmente as travas enquanto
o cliente responde. Sair desta etapa com trava principal identificada + quick wins.

1. **"Qual foi o crescimento de receita nos ultimos 3 meses?"**
   → Identifica tendencia e urgencia
2. **"Quantos leads qualificados entram por mes? Qual a taxa de conversao?"**
   → Identifica travas T2-T5 (Exposicao, Atencao, Interesse, Qualificacao)
3. **"Qual e o churn mensal e o LTV medio dos clientes?"**
   → Identifica trava T8 (Retencao)
4. **"Quantas propostas viram contratos? Qual o tempo medio de fechamento?"**
   → Identifica travas T6-T7 (Compromisso, Decisao)
5. **"Se voce pudesse resolver apenas UM problema de receita amanha, qual seria?"**
   → Identifica a dor mais urgente e o sponsor do projeto

### Step 3: Mapeamento das Travas Ao Vivo (5 min)

Apresentar visualmente quais das 8 travas aparecem nas respostas, ranqueadas por impacto
estimado em receita adicional. Usar TOC para focar na trava-gargalo principal.

### Step 4: Proposta (10 min)

Apresentar o produto DR mais adequado + escopo + timeline + investimento:

| Produto | Investimento | Duracao | Fit |
|---------|--------------|---------|-----|
| DR-X | R$ 20-40k | 45 dias | Cliente precisa de clareza rapida sobre maior gargalo |
| DR-O | R$ 50k/ano | 12 meses | Cliente sabe a trava e precisa implementar 1-2 pilares |
| DR-T | R$ 150k/ano | 12 meses | Cliente quer transformacao completa + treinamento de time |
| DR-E | R$ 350k/ano | 12 meses | Medio porte em escala ou pre-IPO, dedicacao exclusiva |

Comunicar ROI esperado com referencias quantitativas dos cases do setor.

### Step 5: Fechamento (5 min)

- Proximo passo claro (kick-off, contrato, reuniao executiva)
- Urgencia e razao para agir agora (janela de mercado, competidores, deadline do cliente)
- Agendar follow-up se nao houver decisao imediata

### Step 6: Tratamento de Objecoes

Responder objecoes comuns usando o framework 8-travas como ancora:
- "Esta muito caro" → ROI quantificado em reais de receita adicional
- "Nao temos tempo" → Quick wins nos primeiros 30 dias
- "Ja tentamos consultoria" → Diferenca metodologica (TOC + 8 travas vs. consultoria generica)
- "Preciso pensar" → Oferta de diagnostico gratuito (DR-X com escopo reduzido)

### Step 7: Estruturacao da Proposta Formal

Apos o pitch ao vivo, estruturar proposta por escrito contendo:
- Resumo do diagnostico (conexao com dor)
- Produto DR recomendado + escopo detalhado
- Cronograma (marcos, entregaveis por fase)
- Time envolvido (consultores, agentes do squad)
- Investimento (valores, condicoes de pagamento, garantias)
- Proximos passos (kick-off, contratacao)

Acionar `*dr-pop-create` de Apex (task `dr-pop-create.md`) para aplicar o template padrao.

## Entregaveis

- Deck executivo do pitch (personalizado por prospect)
- Mapa visual das 8 travas com ranking de impacto
- Lista de quick wins identificados ao vivo
- Proposta formal DR (X/O/T/E) por escrito
- Sequencia de follow-up pos-pitch (3 emails + 2 calls)

## Quality Gate (Fabio)

Antes de enviar a proposta ao cliente, Fabio valida:
- [ ] Diagnostico alinhado com metodologia STEP
- [ ] Trava principal identificada com evidencia quantitativa
- [ ] Pilar V4 afetado explicito na proposta
- [ ] Metricas de sucesso mensuraveis definidas
- [ ] Escopo cabe no ciclo 90d (ou decomposto em multiplos ciclos)

## Handoffs

- **Entrada:** vem de `@nexus` (triage) ou lead qualificado por `@especialista-spiced`
- **Saida:** se proposta aceita → handoff para `@dr-chief` *dr-kickoff
- **Suporte operacional:** `dr-pop-create.md` (templates padronizados de proposta)

## Referencias

- Produtos DR em detalhe: ver `agents/dr-chief.md` secao "Produtos DR em Detalhe"
- Taxonomia oficial das 8 travas: ver `FABRICA-DE-RECEITA.md` secao 4
- Tratamento de objecoes avancado: `@maquina-comercial` *objection-playbook
