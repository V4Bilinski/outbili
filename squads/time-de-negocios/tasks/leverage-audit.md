# Auditoria de Leverage

## Agente: Naval
## Fase: Diagnostico / Oferta / Pre-Mesa

---

## Objetivo
Auditar os 4 tipos de leverage presentes (ou ausentes) no negocio, deal ou
posicionamento do usuario. Identificar onde esta alavancado, onde esta linear,
e como migrar para leverage permissionless.

## Pre-Condicoes
- Descricao do negocio, produto/servico ou deal em analise
- Contexto: o usuario quer avaliar seu negocio OU um deal especifico

## Steps

### Step 1: Mapeamento dos 4 Tipos de Leverage
**Elicit:** Peca ao usuario para descrever:
1. O que voce vende ou faz? (produto, servico, consultoria, emprego)
2. Como voce entrega? (voce pessoalmente, time, software, conteudo)
3. Quantas pessoas precisam estar envolvidas para entregar?
4. Se voce parasse de trabalhar amanha, a receita continuaria?
5. Qual o custo marginal de atender mais um cliente?

### Step 2: Score de Leverage (1-10 cada)
Avaliar cada tipo:

| Tipo | Descricao | Score | Permissionless? |
|------|-----------|-------|-----------------|
| **Labor** | Pessoas trabalhando para voce | _/10 | Nao — precisa contratar e gerenciar |
| **Capital** | Dinheiro trabalhando para voce | _/10 | Nao — precisa levantar ou ter |
| **Code** | Software que escala sem custo marginal | _/10 | Sim — crie e distribua |
| **Media** | Conteudo que alcanca sem custo marginal | _/10 | Sim — crie e distribua |

**Formula:** Leverage Score = (Labor + Capital + Code + Media) / 4

### Step 3: Diagnostico de Dependencia
Para cada tipo com score < 5, perguntar:
- Por que nao tem esse tipo de leverage?
- O que impede de construir?
- Qual o caminho mais curto para ativar?

### Step 4: Plano de Migracao de Leverage
Priorizar migracao:
1. **Quick win** — Qual leverage pode ativar em 30 dias? (geralmente Media)
2. **Medium term** — Qual leverage ativa em 90 dias? (geralmente Code)
3. **Long term** — Qual leverage ativa em 1 ano? (geralmente Capital)

### Step 5: Veredicto Naval

| Score Medio | Veredicto | Acao |
|-------------|-----------|------|
| >= 7 | **ALAVANCADO** | Otimizar. Compounding ja esta ativo. |
| 4-6 | **PARCIAL** | Migrar. Identificar o tipo ausente e construir. |
| < 4 | **LINEAR** | Alerta. Voce esta alugando seu tempo. Redesenhar. |

## Output
- Mapa de leverage com scores por tipo
- Gaps identificados
- Plano de migracao priorizado (30/90/365 dias)
- Veredicto: ALAVANCADO / PARCIAL / LINEAR
