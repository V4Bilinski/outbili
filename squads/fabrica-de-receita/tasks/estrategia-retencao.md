# Estrategia de Retencao e LTV

---
name: estrategia-retencao
description: Estrategia anti-churn e maximizacao de LTV atacando Trava T8 (Evasao)
agent: retention-master
---

## Objetivo

Construir uma estrategia completa de retencao de clientes que reduza o churn, aumente o LTV
e transforme clientes em promotores. A estrategia ataca a Trava T8 (Evasao) com uma abordagem
sistemica: onboarding estruturado, health score proativo, expansao de conta e programa de
advocacy.

## Pre-requisitos

- Dados de churn atual (mensal e anual)
- LTV medio atual
- Motivos de churn mapeados (se disponivel — pesquisa de saida)
- NPS atual (ou estimativa)
- Descricao do processo de onboarding atual
- Time de CS disponivel (quantas pessoas, carga atual)

## Passos

### Step 1: Diagnostico de Retencao

**Metricas baseline a coletar:**

| Metrica | Valor Atual | Benchmark do Segmento | Gap |
|---------|-------------|----------------------|-----|
| Churn rate mensal | % | B2B SaaS: <2% | |
| Churn rate anual | % | B2B SaaS: <10% | |
| NPS | pts | >40 bom, >70 excelente | |
| LTV medio | R$ | LTV:CAC > 3:1 | |
| Revenue churn (liquido) | % | Ideal: negativo (expansao > churn) | |
| Taxa de expansao | % | >20% da receita | |
| Time-to-value (TTV) | dias | Quanto menor, melhor | |

**Categorizar clientes por risco:**
```
SAUDE VERDE (low risk):
  - Engajamento alto no produto/servico
  - Pagamentos em dia
  - NPS >= 8
  - Expansao recente ou planejada

SAUDE AMARELA (medium risk):
  - Engajamento caindo
  - Sem interacao nos ultimos 30 dias
  - NPS 6-7 (passivos)
  - Sem uso de features principais

SAUDE VERMELHA (high risk):
  - Engajamento muito baixo
  - Pedido de cancelamento ou reclamacoes
  - NPS <= 5 (detratores)
  - Atraso em pagamentos
```

### Step 2: Redesenhar o Onboarding

O onboarding e o primeiro e mais critico momento para prevenir churn.

**Marco de Ativacao (Activation Milestone):**
Definir o "momento aha" — a primeira entrega de valor que faz o cliente dizer
"isso foi valido". Exemplos:
- SaaS: Primeira integracao rodando com dados reais
- Consultoria: Primeiro quick win entregue com ROI mensurado
- Agencia: Primeiro relatorio com dados positivos

```
Marco de Ativacao do Cliente: [descrever especificamente]
Prazo alvo: [X] dias apos inicio do contrato
Como medir: [metrica ou evento]
```

**Jornada de Onboarding (30 dias):**

| Dia | Acao | Responsavel | Objetivo |
|-----|------|-------------|----------|
| D0 | Email de boas-vindas + login/acesso | CS | Primeira impressao |
| D1 | Kickoff call (30 min) — alinhar expectativas | CS + cliente | Clareza de metas |
| D3 | Check-in rapido (5 min) — esta conseguindo usar? | CS | Remover fricoes |
| D7 | Primeira entrega / primeiro resultado | Squad DR | Marco de ativacao |
| D14 | Review da primeira semana — o que funcionou? | CS + cliente | Feedback e ajuste |
| D30 | Review do mes 1 — primeiros resultados | CS + DR Lead | Confirmar sucesso |

### Step 3: Sistema de Health Score

Criar um score de saude do cliente para intervencao proativa:

**Dimensoes do Health Score (total 100 pontos):**

| Dimensao | Peso | Como Medir |
|----------|------|------------|
| Engajamento com produto/servico | 30% | Frequencia de uso, interacoes, reunioes |
| Resultado entregue vs prometido | 30% | % de metas atingidas no ciclo |
| Relacionamento | 20% | NPS, responsividade, feedback |
| Expansao | 10% | Upsell realizado, novos projetos |
| Pagamentos | 10% | Pontualidade, ausencia de disputas |

**Protocolo por score:**

| Score | Status | Acao |
|-------|--------|------|
| 80-100 | Verde | Nurture para expansao, pedir indicacao |
| 60-79 | Amarelo | Check-in proativo em 72h, identificar problema |
| 40-59 | Laranja | Reuniao urgente de QBR, plano de salvamento |
| 0-39 | Vermelho | Escalada imediata para C-level |

**Ritual de Health Score:**
- Review semanal do CS: clientes amarelos e laranjas
- Review mensal do DR Lead: todos os clientes
- Alerta automatico: quando score cai mais de 15 pontos em uma semana

### Step 4: Playbook de Salvamento (Red Accounts)

Para clientes em risco vermelho:

**Protocolo de Salvamento (72 horas):**

1. **H+0:** CS identifica sinal vermelho → alerta imediato para DR Lead
2. **H+4:** DR Lead liga para o champion da conta (nao esperar email)
3. **H+24:** Reuniao emergencial agendada (maximo 48h a partir do sinal)
4. **H+48:** Reuniao realizada — entender raiz do problema
5. **H+72:** Proposta de resolucao entregue com cronograma

**Na reuniao de salvamento:**
- Nao comecar com desculpas — comecar com "nos queremos resolver isso"
- Perguntar: "O que aconteceu especificamente que criou essa insatisfacao?"
- Nao defender — escutar e registrar
- Perguntar: "O que precisaria acontecer para voce ficar satisfeito?"
- Propor solucao concreta com prazo

**Opcoes de resolucao:**
- [ ] Acelerar entrega de resultado especifico
- [ ] Adicionar recurso/servico sem custo adicional
- [ ] Oferecer credito ou desconto na renovacao
- [ ] Escalar atendimento para nivel superior
- [ ] Redesenhar escopo se expectativas estavam desalinhadas

### Step 5: Programa de Expansao

Transformar clientes satisfeitos em mais receita:

**Gatilhos de Expansao Natural:**
- Marco de ativacao atingido → oferecer proximo nivel
- Resultado 1.5x do prometido → proposta de expansao
- Novo desafio mencionado pelo cliente → conectar com produto/servico adicional
- Crescimento da empresa do cliente → mais vagas, mais licencas, mais modulos

**Tipos de Expansao:**
| Tipo | O que e | Quando Oferecer |
|------|---------|----------------|
| Upsell | Upgrade para produto maior | Apos resultado confirmado (D+60) |
| Cross-sell | Novo produto complementar | Apos 3 meses de sucesso |
| Expansao de escopo | Mais servicos no mesmo produto | Quando nova dor e identificada |
| Expansao de time | Mais usuarios/licencas | Quando empresa cresce |

**Cadencia de conversas de expansao:**
- QBR (Quarterly Business Review) — todo trimestre
- Review de renovacao — 60 dias antes do vencimento
- Check-in de expansao — M+3 e M+6 de todo contrato

### Step 6: Programa de Advocacy

Transformar clientes em promotores ativos:

**Criterios para solicitar indicacao:**
- NPS >= 9 (promotores)
- Marco de ativacao atingido com resultado visivel
- Pelo menos 60 dias de contrato

**Tipos de Advocacy:**
1. **Indicacao direta** — "Quem na sua rede tem o mesmo problema?"
2. **Case em video** — Depoimento de 2-3 min com ROI real
3. **Texto de depoimento** — Para site e materiais de venda
4. **Participacao em evento** — Contar historia em webinar ou evento
5. **LinkedIn post** — Publicar resultado espontaneamente

**Incentivos para Advocacy:**
- Desconto na renovacao
- Mes adicional gratuito
- Acesso antecipado a novos produtos
- Co-marketing (visibilidade da marca do cliente)

## Output

- **Mapa de saude** atual da base de clientes (verde/amarelo/laranja/vermelho)
- **Jornada de onboarding** redesenhada com marcos e responsaveis
- **Sistema de health score** com criterios e protocolos por nivel
- **Playbook de salvamento** para contas em risco
- **Plano de expansao** com gatilhos e cadencia
- **Programa de advocacy** com criterios de solicitacao

## Validacao

- [ ] O marco de ativacao foi definido de forma especifica e mensuravel?
- [ ] O health score tem criterios objetivos (nao so percepcao do CS)?
- [ ] O protocolo de salvamento tem prazo maximo de 72h para intervencao?
- [ ] Existe processo definido para revisar health score semanalmente?
- [ ] O programa de expansao esta integrado ao CRM com alertas?
