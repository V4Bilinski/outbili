# Montar Funil de Conversao

---
name: montar-funil
description: Design completo de funil de conversao atacando travas T2-T5 (aquisicao)
agent: conversion-optimizer + fabricante-aquisicao
---

## Objetivo

Projetar ou redesenhar um funil de conversao completo, desde a atracao do trafego ate
o fechamento da venda. O funil deve ser construido para atacar especificamente as travas
de aquisicao (T2-T5) identificadas no diagnostico, com cada etapa otimizada para maximizar
a conversao para a proxima.

## Pre-requisitos

- Diagnostico de travas concluido (trava principal em T2, T3, T4 ou T5)
- ICP definido (perfil do cliente ideal com demograficos, psicograficos, dores)
- Oferta principal definida (o que sera vendido, ticket, modelo de negocio)
- Budget disponivel para trafego e ferramentas
- Stack tecnologica disponivel (landing page builder, CRM, email, automacao)

## Passos

### Step 1: Mapear a Jornada do ICP

Antes de desenhar o funil, mapear a jornada de consciencia do cliente ideal:

**Niveis de consciencia (Eugene Schwartz):**
1. **Sem consciencia** — nao sabe que tem o problema
2. **Consciente do problema** — sabe que tem a dor, nao sabe a solucao
3. **Consciente da solucao** — sabe que existe solucao, nao conhece voce
4. **Consciente do produto** — conhece voce, ainda nao esta convencido
5. **Pronto para comprar** — so precisa do impulso final

**Para cada nivel, definir:**
- Canal onde essa pessoa esta
- Mensagem que a move para o proximo nivel
- CTA (call to action) adequado

### Step 2: Arquitetura do Funil (5 Etapas)

**TOPO DO FUNIL (ToFu) — Trafego → Leads**
- **Objetivo:** Atrair o ICP e capturar o primeiro dado (email ou contato)
- **Conteudo:** Lead magnet, webinar, teste gratuito, desconto inicial
- **Copy:** Focar na dor do nivel 2-3 de consciencia
- **Meta de conversao:** [X]% dos visitantes viram leads

**Elementos obrigatorios ToFu:**
- [ ] Headline que espelha a dor principal do ICP
- [ ] Lead magnet de alto valor percebido (nao generico)
- [ ] Formulario minimo (nome + email ou email + WhatsApp apenas)
- [ ] Prova social no formulario (N pessoas ja baixaram)
- [ ] Thank you page com proxima acao clara

**MEIO DO FUNIL (MoFu) — Leads → Oportunidades**
- **Objetivo:** Educar, construir autoridade e criar desejo
- **Conteudo:** Sequencia de emails, retargeting, conteudo de valor, cases
- **Copy:** Focar em prova e resultado (nivel 3-4 de consciencia)
- **Meta de conversao:** [X]% dos leads viram oportunidades qualificadas

**Elementos obrigatorios MoFu:**
- [ ] Sequencia de nurture 5-7 emails (primeiros 14 dias)
- [ ] 1 case de sucesso com ROI real (video ou texto longo)
- [ ] 1 aula/webinar/conteudo de profundidade media
- [ ] Retargeting ativo para leads que abriram emails
- [ ] CTA claro para dar o proximo passo (agendar reuniao, pedir proposta)

**FUNDO DO FUNIL (BoFu) — Oportunidades → Propostas**
- **Objetivo:** Converter a intencao em uma conversa de vendas
- **Conteudo:** Pagina de vendas, VSL, agendamento, diagnostico gratuito
- **Copy:** Focar em urgencia e reducao de risco (nivel 4-5 de consciencia)
- **Meta de conversao:** [X]% das oportunidades viram propostas enviadas

**Elementos obrigatorios BoFu:**
- [ ] Pagina de vendas ou landing page de conversao com VSL ou copy longa
- [ ] Garantia clara que elimina risco percebido
- [ ] FAQ com as 5 principais objecoes respondidas
- [ ] Urgencia real (vagas, prazo, bonus)
- [ ] CTA para agendamento ou compra direta

**CONVERSAO — Propostas → Clientes**
- **Objetivo:** Fechar o deal com maxima eficiencia
- **Ferramentas:** Script de vendas, proposta visual, contrato digital
- **Meta:** Win rate acima de [X]% das propostas enviadas

**Elementos obrigatorios Conversao:**
- [ ] Script de apresentacao de proposta (Belfort/Voss)
- [ ] Proposta visual com ROI calculado
- [ ] Contrato digital (DocuSign, ClickSign)
- [ ] Processo de follow-up pos-proposta (D+1, D+3, D+7)

**POS-VENDA — Clientes → Ativados**
- **Objetivo:** Garantir ativacao rapida e primeira entrega de valor
- **Meta:** 100% dos novos clientes ativados em [X] dias
- **Handoff:** Passagem de venda para CS/entrega com contexto completo

### Step 3: Metricas por Etapa

Definir a cadeia de conversao com metas:

```
TRAFEGO
[10.000 visitas/mes]
    ↓ [3% CVR]
LEADS
[300 leads/mes]
    ↓ [20% conversao]
OPORTUNIDADES QUALIFICADAS
[60 oportunidades/mes]
    ↓ [40% conversao]
PROPOSTAS
[24 propostas/mes]
    ↓ [30% win rate]
NOVOS CLIENTES
[7 clientes/mes]
```

**Para cada etapa, definir:**
- Metrica atual (baseline)
- Meta em 30 dias
- Meta em 90 dias
- Acao para mover o numero

### Step 4: Identificar Vazamentos por Trava

**Se T2 (Silencio) — Topo do Funil e o problema:**
- Prioridade: Aumentar volume de trafego qualificado
- Acoes: Trafego pago, SEO, parcerias, co-marketing
- Meta: +50% em volume de trafego nos 90 dias

**Se T3 (Frieza) — Engajamento e o problema:**
- Prioridade: Melhorar lead magnet e sequencia de nurture
- Acoes: Reescrever hooks, novo lead magnet, segmentar lista
- Meta: Open rate +5pp, CTR +1pp em 30 dias

**Se T4 (Desconfianca) — Meio do Funil e o problema:**
- Prioridade: Construir prova e autoridade
- Acoes: Cases em video, pagina de provas, garantia ousada
- Meta: CVR do MoFu para BoFu +10pp em 60 dias

**Se T5 (Abandono) — Fundo do Funil e o problema:**
- Prioridade: Remover fricoes e tratar objecoes
- Acoes: Simplificar proposta, sequencia de recuperacao, follow-up sistemático
- Meta: Proposta → fechamento +5pp win rate em 30 dias

### Step 5: Ferramentas e Automacoes

**Stack recomendada por porte:**

| Porte | CRM | Email | Landing Page | Automacao |
|-------|-----|-------|-------------|-----------|
| Pequeno (<R$500k ARR) | HubSpot Free | Mailchimp | Webflow | Make/n8n |
| Medio (R$500k-5M ARR) | RD Station / Pipedrive | ActiveCampaign | Webflow | RD Station |
| Grande (>R$5M ARR) | Salesforce / HubSpot Pro | HubSpot / Marketo | HubSpot | Salesforce Flow |

**Automacoes minimas obrigatorias:**
- [ ] Welcome email imediato apos captura do lead
- [ ] Sequencia de nurture 5 emails em 14 dias
- [ ] Alerta de SQL (lead qualificado) para vendedor
- [ ] Follow-up automatico D+1 apos proposta enviada
- [ ] Notificacao de abandono de checkout

## Output

- **Arquitetura do funil** visual (do trafego ao cliente)
- **Copy de cada etapa** (headline, CTA, sequencia de emails)
- **Cadeia de conversao** com metas por etapa
- **Lista de automacoes** necessarias com ferramentas
- **Prioridade de implantacao** (o que fazer primeiro baseado na trava)

## Validacao

- [ ] O funil cobre todas as 5 etapas (ToFu, MoFu, BoFu, Conversao, Pos-venda)?
- [ ] Cada etapa tem copy adequado ao nivel de consciencia do ICP?
- [ ] As metas de conversao sao referencadas em benchmarks do segmento?
- [ ] A trava principal identificada e atacada diretamente?
- [ ] A stack tecnologica e compativel com o que o cliente ja usa?
