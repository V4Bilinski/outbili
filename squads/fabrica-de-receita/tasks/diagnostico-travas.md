# Diagnostico de Travas de Receita

---
name: diagnostico-travas
description: Identificar qual das 8 travas e o gargalo principal usando TOC (5 Focusing Steps)
agent: diagnosticador
---

## Objetivo

Diagnosticar qual das 8 Travas de Receita e o gargalo principal da empresa usando a
Teoria das Restricoes (TOC) — especificamente os 5 Focusing Steps de Goldratt.
O output e uma classificacao clara da trava prioritaria e uma recomendacao de produto DR.

## Pre-requisitos

- Descricao da empresa (segmento, modelo de negocio, ticket medio, tamanho do time)
- Metricas atuais disponiveis (mesmo que estimadas): MRR/ARR, CAC, LTV, churn, conversao
- Principal dor reportada pelo prospect (o que o fez buscar ajuda)
- Contexto de mercado (B2B ou B2C, maturidade do produto, tempo de mercado)

## Passos

### Step 1: Triagem Rapida das 8 Travas
Apresentar ao usuario as 8 travas com sintomas e pedir confirmacao:

| Trava | Pergunta de Triagem |
|-------|---------------------|
| T1 Cegueira | Voce nao sabe quais metricas olhar ou nao tem dados confiaveis? |
| T2 Silencio | Poucos leads chegam? O mercado nao conhece sua marca? |
| T3 Frieza | Leads chegam mas nao se engajam? Taxa de abertura/clique muito baixa? |
| T4 Desconfianca | Engajam mas nao compram? Ciclo de decisao longo sem fechamento? |
| T5 Abandono | Iniciam a compra mas desistem no checkout ou na proposta? |
| T6 Incompetencia | Fecha deals mas o time nao converte bem? Taxa de ganho baixa? |
| T7 Complexidade | Ciclo de vendas muito longo? Muita burocracia no processo? |
| T8 Evasao | Clientes compram mas churn e alto? LTV muito baixo? |

**Elicit:** Pedir ao usuario para marcar quais sintomas se aplicam (pode ser mais de um).

### Step 2: Mapeamento do Fluxo de Receita
Construir o mapa do fluxo atual com numeros:

```
TRAFEGO → LEADS → ENGAJADOS → OPORTUNIDADES → CLIENTES → ATIVOS
[___/mes]   [___]     [___%]       [___]          [___%]    [___]
```

Identificar onde o maior vazamento acontece (maior queda percentual entre etapas).

### Step 3: 5 Focusing Steps (TOC)

**IDENTIFY — Qual e a restricao?**
- Baseado no fluxo mapeado, qual etapa tem o maior vazamento?
- Qual trava melhor explica esse vazamento?
- Confirmar com o usuario: "Sua maior dor hoje e [trava X]?"

**EXPLOIT — Como extrair o maximo sem investimento extra?**
- O que ja existe que nao esta sendo usado bem?
- Quais quick wins podem ser executados imediatamente?
- Exemplos: reativar base, melhorar copy existente, treinar time com material atual

**SUBORDINATE — O que mais precisa mudar para servir a restricao?**
- Quais outros pilares precisam se reorganizar para dar suporte ao gargalo?
- O que deve parar de ser feito para focar no que importa?

**ELEVATE — Que investimento quebraria a restricao?**
- Qual seria a acao de maior impacto para eliminar o gargalo?
- Quanto tempo e recurso seria necessario?
- Qual o ROI estimado de quebrar essa restricao?

**REPEAT — Qual seria o proximo gargalo?**
- Apos resolver a trava principal, qual apareceria em seguida?
- Isso ajuda a desenhar o roadmap de ciclos 90 dias.

### Step 4: Scoring de Travas
Para cada trava identificada, atribuir score de 1-5 em 3 dimensoes:

| Trava | Impacto na Receita | Urgencia | Facilidade de Resolver | Score Total |
|-------|-------------------|---------|------------------------|-------------|
| TX    | /5                | /5       | /5                     | /15         |

A trava com maior score total = gargalo principal.

### Step 5: Recomendacao de Produto DR
Com base na trava e no contexto da empresa:

| Criterio | DR-X | DR-O | DR-T | DR-E |
|----------|------|------|------|------|
| Urgencia | Alta | Media | Media | Alta |
| Porte | Qualquer | PME | PME/Medio | Medio/Grande |
| Investimento disponivel | R$20-40k | R$50k/ano | R$150k/ano | R$350k/ano |
| Maturidade do time | Qualquer | Com time | Com time | Time robusto |

## Output

- **Mapa do fluxo de receita** com vazamentos identificados
- **Trava principal** com justificativa baseada em dados
- **Top 3 quick wins** para atacar imediatamente
- **Recomendacao DR** (qual produto e por que)
- **Roadmap de 3 ciclos 90 dias** (trava 1 → trava 2 → consolidacao)

## Validacao

- [ ] A trava identificada explica o principal sintoma relatado pelo cliente?
- [ ] O mapa de fluxo tem numeros reais ou estimativas razoaveis?
- [ ] Os 5 Focusing Steps foram aplicados completamente?
- [ ] A recomendacao DR e compativel com o porte e urgencia do cliente?
- [ ] O cliente concordou com o diagnostico antes de gerar o output?
