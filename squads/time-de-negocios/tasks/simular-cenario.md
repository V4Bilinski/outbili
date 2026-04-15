# Simulação de Cenário de Negociação

## Tipo: Ferramenta Transversal (todas as fases)
## Agentes Ativos: Roteamento por fase (ver matriz abaixo)

---

## Objetivo
Simular cenários de negociação com os agentes corretos para cada fase,
permitindo praticar táticas, testar abordagens e preparar para situações reais.

## Pré-condições
- [ ] Cenário de negociação definido (quem, o quê, quanto)
- [ ] Fase do pipeline identificada
- [ ] Modo de simulação escolhido (Roleplay, Coaching ou War Room)

## Matriz de Routing: Fase → Agentes Permitidos

| Fase | Agentes permitidos | Agentes bloqueados |
|------|-------------------|-------------------|
| Diagnóstico | Goldratt, Hormozi | Ury, Voss, Belfort, Trump, Cohen |
| Oferta | Goldratt, Hormozi, Cialdini | Ury, Voss, Belfort, Trump, Cohen |
| Pré-mesa | Ury, Cialdini | Goldratt, Hormozi, Voss, Belfort, Trump, Cohen |
| Funil | Voss, Cialdini | Goldratt, Hormozi, Ury, Belfort, Trump, Cohen |
| Fechamento | Voss, Belfort, Cialdini | Goldratt, Hormozi, Ury, Trump, Cohen |
| Alta pressão | Trump, Cohen | Goldratt, Hormozi, Ury, Cialdini, Voss, Belfort |
| Treino | Belfort, Cialdini, Cohen | Goldratt, Hormozi, Ury, Voss, Trump |

**Regra:** Se o usuário escolher um agente bloqueado para a fase, informar o erro e sugerir os agentes permitidos.
**Exceção:** Modo War Room ignora restrições (análise multi-perspectiva).
**Alta pressão:** Requer autorização explícita de Rockefeller mesmo em simulação.

## Modos de Simulação

### Modo 1: Roleplay (Agente como Prospect)
O agente assume o papel de prospect e o usuário pratica:
- Call de vendas
- Reunião de negociação
- Manejo de objeções
- Fechamento

**Framework aplicado:** O agente usa os frameworks da sua persona para criar resistência realista.

### Modo 2: Coaching (Agente como Coach)
O usuário descreve o cenário e o agente guia passo a passo:
- "Como eu deveria abrir essa conversa?"
- "Como responder a essa objeção?"
- "Qual a melhor estratégia para esse prospect?"

**Framework aplicado:** O agente ensina usando seus frameworks específicos (ex: Voss usa empatia tática, Belfort usa Straight Line).

### Modo 3: War Room (Múltiplos Agentes)
Análise completa com perspectivas de múltiplos agentes:
- Goldratt analisa o sistema (TOC, 5 Focusing Steps)
- Hormozi avalia a oferta (Value Equation, Grand Slam)
- Ury mapeia a mesa (BATNA, interesses vs posições)
- Cialdini sugere gatilhos (7 princípios, Pre-Suasion)
- Voss prepara a abordagem (empatia tática, labeling)
- Cohen calibra emoções (Poder + Tempo + Informação)

**Nota:** War Room não tem restrição de fase — todos os agentes contribuem com sua perspectiva.

## Steps

### Step 1: Coleta de Contexto
**Elicit:** Peça ao usuário:
1. Descreva o cenário (quem, o quê, quanto, quando)
2. Qual fase do pipeline? (diagnóstico/oferta/pré-mesa/funil/fechamento/pressão/treino)
3. Qual agente você quer simular? (ou War Room para todos)
4. Modo: Roleplay, Coaching ou War Room?

### Step 2: Validação de Routing
**OBRIGATÓRIO antes de configurar:**
1. Consultar a matriz de routing acima
2. Verificar se o agente escolhido é permitido para a fase selecionada
3. Se **bloqueado** → informar ao usuário e sugerir agentes corretos:
   - "Para a fase [X], os agentes disponíveis são: [lista]. Qual prefere?"
4. Se **alta pressão** → verificar autorização de Rockefeller
5. Se **War Room** → pular validação (todos participam)

### Step 3: Configurar Simulação
Com base no contexto validado:
- Selecionar agente(s) ativo(s) (confirmados pelo routing)
- Definir perfil do prospect (persona, setor, objeções prováveis)
- Estabelecer regras da simulação (duração, nível de dificuldade)
- Definir métricas de avaliação por framework:
  - Voss: uso de espelhamento, labeling, perguntas calibradas
  - Belfort: Three Tens score, tonalidade, looping
  - Ury: foco em interesses, uso de BATNA, critérios objetivos
  - Cialdini: gatilhos aplicados corretamente
  - Goldratt: gargalo identificado, 5 Focusing Steps seguidos
  - Hormozi: Value Equation completa, naming, garantia
  - Trump: ancoragem efetiva, structured choice
  - Cohen: controle das 3 variáveis, desapego calibrado

### Step 4: Executar Simulação
Rodar a simulação no modo escolhido, aplicando os frameworks
específicos do(s) agente(s) selecionado(s):
- **Roleplay:** Agente responde como prospect usando resistência baseada no cenário
- **Coaching:** Agente guia cada passo usando seus frameworks documentados
- **War Room:** Cada agente contribui sua análise na sequência do pipeline

### Step 5: Debrief
Após a simulação:
1. O que funcionou? (citar frameworks aplicados corretamente)
2. O que precisa melhorar? (citar frameworks mal aplicados ou ausentes)
3. Score por framework utilizado (1-10)
4. Score geral (1-10)
5. Comparação: o que o agente faria diferente?
6. Recomendações para a situação real
7. Próximo passo sugerido (outra simulação, task específica, ou execução real)

## Output
- Transcrição da simulação (se roleplay)
- Análise de performance com score por framework
- Recomendações específicas do agente
- Plano de ação para cenário real
