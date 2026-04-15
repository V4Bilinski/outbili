# Filtro Estrategico de Deal (Naval)

## Agente: Naval
## Fase: Diagnostico (pre-filtro antes de Goldratt e Hormozi)

---

## Objetivo
Avaliar se um deal, oportunidade ou projeto vale ser jogado ANTES de otimizar
como fecha-lo. Filtro de primeiro principio: asymmetric upside, compounding,
leverage e alinhamento de longo prazo.

## Pre-Condicoes
- Descricao basica do deal/oportunidade
- Pode ser usado ANTES do diagnostico completo (pre-filtro rapido)

## Steps

### Step 1: Coleta Rapida
**Elicit:** 6 perguntas essenciais:
1. Qual a oportunidade? (descreva em 2 frases)
2. Qual o upside maximo se der certo?
3. Qual o downside maximo se der errado?
4. Voce esta entrando como principal (dono) ou agente (prestador)?
5. Esse deal cria um ativo que compoe? Ou e one-shot?
6. Voce faria esse deal se nao precisasse do dinheiro?

### Step 2: Filtro de 7 Criterios Naval
Avaliar cada criterio (1-10):

| # | Criterio | Pergunta-chave | Score |
|---|----------|----------------|-------|
| 1 | **Asymmetric Upside** | Downside limitado (1x) mas upside alto (10-1000x)? | _/10 |
| 2 | **Compounding** | Esse deal compoe no longo prazo (relacoes, reputacao, capital)? | _/10 |
| 3 | **Leverage** | Usa code, media ou capital? Ou depende 100% do seu tempo? | _/10 |
| 4 | **Principal Position** | Voce esta na posicao de dono, nao de empregado? | _/10 |
| 5 | **Specific Knowledge** | Usa seu specific knowledge (moat real)? | _/10 |
| 6 | **Long-term People** | As pessoas envolvidas jogam jogos de longo prazo? | _/10 |
| 7 | **Authenticity** | Esse deal esta alinhado com quem voce realmente e? | _/10 |

**Formula:** Naval Score = media dos 7 criterios

### Step 3: Red Flags Automaticas
Qualquer item abaixo = FLAG VERMELHA:
- [ ] Upside simetrico (voce ganha 1x mas pode perder 1x)
- [ ] Voce e o agente, nao o principal
- [ ] O deal nao compoe (one-shot sem residual)
- [ ] Depende 100% do seu tempo (zero leverage)
- [ ] As pessoas envolvidas tem historico de jogos de curto prazo
- [ ] Voce nao faria de graca (desalinhado com curiosidade genuina)

### Step 4: Veredicto

| Score | Veredicto | Acao |
|-------|-----------|------|
| >= 7 | **PLAY** | Jogue com tudo. Esse deal compoe. Prossiga para Goldratt + Hormozi. |
| 5-6 | **NEGOTIATE TERMS** | O deal tem potencial mas os termos precisam mudar. Renegocie posicao. |
| 3-4 | **PASS** | O deal nao tem leverage ou compounding suficiente. Seu tempo vale mais. |
| < 3 | **HARD NO** | "If you can't decide, the answer is no." Saia. |

### Step 5: Recomendacao de Rota
- **PLAY** → Encaminhar para `*diagnosticar` (Goldratt) + `*grand-slam-offer` (Hormozi)
- **NEGOTIATE TERMS** → Usar `*principal-agent` para redesenhar posicao
- **PASS/HARD NO** → Calcular `*hourly-rate` e redirecionar tempo para deals melhores

## Output
- Scorecard de 7 criterios com notas
- Red flags identificadas
- Veredicto: PLAY / NEGOTIATE TERMS / PASS / HARD NO
- Rota recomendada (proximo agente/task)
