# Construir Oferta Destrava Receita

---
name: construir-oferta-dr
description: Montar pitch e proposta Destrava Receita personalizada para o prospect
agent: dr-chief
---

## Objetivo

Construir uma proposta Destrava Receita (DR) personalizada e irresistivel para o prospect,
com base no diagnostico de travas ja realizado. A proposta deve conectar a dor especifica
do cliente com o produto DR mais adequado, comunicar o ROI esperado e reduzir o risco
percebido do investimento.

## Pre-requisitos

- Diagnostico de travas concluido (trava principal identificada)
- Qualificacao SPICED realizada (especialista-spiced.md)
- Informacoes do prospect: porte, mercado, time, faturamento estimado, urgencia
- Produto DR recomendado (DR-X / DR-O / DR-T / DR-E)
- Decision maker identificado (quem assina o contrato)

## Passos

### Step 1: Resumo do Diagnostico (Conexao com a Dor)

Abrir a proposta conectando com a dor real do cliente:

```
"Com base no nosso diagnostico, identificamos que [empresa] esta travada
principalmente na Trava [TX — Nome]. Isso esta custando aproximadamente
R$[valor estimado]/mes em receita deixada na mesa."
```

**Calcular o custo da inacao:**
- Se T2 (Silencio): estimar quantos leads a mais o mercado poderia trazer
- Se T4 (Desconfianca): estimar aumento de CVR de [x]% para [y]%
- Se T8 (Evasao): calcular impacto de reduzir churn em X pontos percentuais

**Formula do custo da inacao:**
```
Custo mensal = [Metrica atual] x [Gap %] x [Ticket medio]
Ex: 100 leads/mes x 15% gap na conversao x R$5.000 = R$75.000/mes perdidos
```

### Step 2: Framework STEP na Proposta

Estruturar a proposta usando o STEP:

**S — Situacao Atual**
- Onde a empresa esta hoje (numeros reais)
- O que esta funcionando (reconhecer pontos fortes)
- O que nao esta funcionando (sem julgamento, so dados)

**T — Trava Identificada**
- Qual a trava principal e por que ela e o gargalo agora
- Como ela se manifesta nos numeros do cliente
- O que acontece se continuar sem resolver

**E — Estrategia DR**
- Como o produto DR ataca especificamente essa trava
- Metodologia V4 aplicada ao contexto do cliente
- O que sera feito, por quem, em que ordem

**P — Plano de Execucao**
- Cronograma do ciclo 90 dias
- As 3 alavancas principais do primeiro ciclo
- Marcos mensais e entregaveis

### Step 3: Apresentar os Entregaveis do Produto

Para cada produto DR, os entregaveis padrao:

**DR-X (45 dias):**
- Diagnostico STEP completo documentado
- Mapa das 8 travas com trava principal identificada
- Plano estrategico para 3 ciclos de 90 dias
- Sprint de implantacao: 3 alavancas iniciais executadas
- Dashboard de metricas configurado

**DR-O (12 meses):**
- Tudo do DR-X (mes 1)
- 4 ciclos de 90 dias supervisionados
- Reviews mensais com C-level
- Ajustes de estrategia em tempo real
- Acesso ao squad completo por WhatsApp/Slack

**DR-T (12 meses):**
- Tudo do DR-O
- Treinamento do time (SDR, closer, CS) — 40h totais
- Construcao de playbooks de vendas e CS
- Processo comercial documentado (ICP, script, objecoes, follow-up)
- Implantacao e configuracao do CRM
- Reviews semanais com time operacional

**DR-E (12 meses):**
- Tudo do DR-T
- Squad dedicado embedded na operacao do cliente
- 4+ horas/semana de execucao direta pela equipe Outbili
- Advisory C-level quinzenal
- Garantia de resultado com SLA definido

### Step 4: Construir a Equacao de ROI

Mostrar o ROI esperado com numeros reais do cliente:

```
INVESTIMENTO: R$[valor produto DR]
IMPACTO ESPERADO:
  - Aumento de [metrica 1]: +[X]% = R$[valor]/mes
  - Aumento de [metrica 2]: +[Y]% = R$[valor]/mes
  - Reducao de [metrica 3]: -[Z]% = R$[valor]/mes

RESULTADO ESPERADO EM 90 DIAS: R$[total adicional]/mes
PAYBACK DO INVESTIMENTO: [X] meses
ROI NO PERIODO CONTRATADO: [X]x o investimento
```

**Benchmarks de ROI por trava (usar como referencia):**
- T2 (Silencio) resolvido: +30-80% em novos leads
- T4 (Desconfianca) resolvido: +15-40% na taxa de conversao
- T6 (Incompetencia) resolvido: +20-50% no win rate do time
- T8 (Evasao) resolvido: -30-60% no churn, +20-40% no LTV

### Step 5: Tratar Objecoes Previas

Incluir na proposta respostas as objecoes mais comuns:

| Objecao | Resposta na Proposta |
|---------|---------------------|
| "Nao temos time para implantar" | DR-E tem equipe dedicada. DR-T forma o time. |
| "Ja tentamos antes e nao funcionou" | O que mudou: diagnostico baseado em dados reais + TOC |
| "E muito caro" | Mostrar custo da inacao vs investimento DR |
| "Precisamos pensar" | Criar urgencia com prazo e quantidade de vagas |
| "Qual a garantia?" | Apresentar garantia do produto escolhido |

### Step 6: Call to Action e Proximo Passo

Terminar a proposta com um CTA claro:

```
PROXIMO PASSO:
"Para comecarmos o Ciclo 1, precisamos de:
1. Assinatura do contrato ate [data]
2. Kick-off agendado para [data sugerida]
3. Acesso aos dados de [ferramenta X, Y, Z]

Vagas abertas para [mes]: [X] empresas
Preco: R$[valor] (valido ate [data])"
```

## Output

- **Proposta DR** completa no template (proposta-dr-tmpl.md)
- **Slide deck** de apresentacao (5-7 slides maximos)
- **One-pager** para o decision maker (1 pagina com dor, solucao, ROI)
- **Email de follow-up** pos-apresentacao

## Validacao

- [ ] A proposta conecta diretamente com a trava diagnosticada?
- [ ] O ROI esperado e calculado com dados reais do cliente (nao hipotetico generico)?
- [ ] As objecoes mais provaveis estao endereçadas?
- [ ] O produto DR recomendado e compativel com o porte/urgencia/budget?
- [ ] O CTA e claro com prazo e proximo passo especifico?
- [ ] A proposta foi revisada antes de enviar ao cliente?
