---
name: criar-roteiro
description: Workflow guiado para criar roteiros de video com hook, narrativa e CTA
agent: scriptwriter
execution_type: agent
input:
  - Tema ou briefing do video
  - Tipo (short, reel, video longo, VSL, ad)
  - Duracao desejada
  - Publico-alvo
  - Tom de voz
output:
  - Roteiro completo com timestamps e instrucoes
quality_gate: checklists/roteiro.md
---

# Task: Criar Roteiro

Workflow guiado para criar roteiros que prendem atencao, entregam valor e convertem.

---

## Pre-requisitos

- [ ] Tema/assunto definido
- [ ] Tipo de roteiro (short 60s, reel 30s, video longo, VSL, ad)
- [ ] Duracao desejada
- [ ] Objetivo claro (educar, entreter, vender, engajar)
- [ ] Publico-alvo definido
- [ ] Tom de voz (serio, leve, provocador, inspiracional)

---

## Passo a Passo

### 1. Coletar Briefing

```
Responda:
- Qual o tema/assunto?
- Pra qual plataforma? (YouTube, Reels, TikTok, LinkedIn)
- Qual a duracao? (30s, 60s, 90s, 5min, 10min)
- Qual o objetivo? (educar, entreter, vender, engajar)
- Quem e o publico? (idade, interesses, nivel de conhecimento)
- Qual o tom? (serio, leve, provocador, inspiracional)
- Tem referencia? (link de video similar que gosta)
```

### 2. Definir Estrutura

| Tipo | Estrutura |
|------|-----------|
| Short (30-60s) | Hook (3s) → Problema (5s) → Solucao (15-30s) → CTA (5s) |
| Reel (15-30s) | Hook (2s) → Valor (10-20s) → CTA (3s) |
| Video Longo | Hook (10s) → Contexto (30s) → Desenvolvimento (5-15min) → CTA (30s) |
| VSL | Hook (15s) → Problema (60s) → Agitacao (60s) → Solucao (120s) → Prova (60s) → Oferta (60s) → CTA (30s) |
| Ad | Hook (3s) → Dor (5s) → Promessa (10s) → Prova (10s) → CTA (5s) |

### 3. Criar Hook (primeiros 3 segundos)

Tecnicas de hook:
1. **Pergunta provocadora** — "Voce sabia que 90% dos criadores..."
2. **Afirmacao chocante** — "Isso mudou tudo no meu negocio"
3. **Contra-intuitivo** — "Pare de postar todo dia"
4. **Numero** — "3 coisas que aprendi gastando R$100k"
5. **Desafio** — "Aposto que voce nao sabe isso"
6. **Historia** — "Ha 2 anos eu estava falido..."

### 4. Desenvolver Corpo

- Cada ponto = 1 ideia clara
- Transicoes suaves entre pontos
- Exemplos concretos (nao generico)
- Manter ritmo (nao arrastar)
- Se video longo: recap a cada 3-5 min

### 5. Fechar com CTA

| Objetivo | CTA |
|----------|-----|
| Engajamento | "Comenta aqui qual desses voce ja faz" |
| Seguidores | "Segue pra mais conteudo como esse" |
| Salvamentos | "Salva esse video pra consultar depois" |
| Venda | "Link na bio / Acesse agora" |
| Compartilhamento | "Manda pro amigo que precisa ouvir isso" |

### 6. Formatar Roteiro

```markdown
# [TITULO DO VIDEO]
**Tipo:** Short 60s | **Plataforma:** TikTok | **Tom:** Provocador

---

## HOOK (0:00 - 0:03)
[Texto exato do hook]
*Instrucao: Olhar direto pra camera, energia alta*

## PONTO 1 (0:03 - 0:15)
[Texto do primeiro ponto]
*Instrucao: Corte seco, texto na tela "PONTO 1"*

## PONTO 2 (0:15 - 0:30)
[Texto do segundo ponto]
*Instrucao: B-roll ou exemplo visual*

## PONTO 3 (0:30 - 0:50)
[Texto do terceiro ponto]
*Instrucao: Aumentar energia, aproximar camera*

## CTA (0:50 - 0:60)
[Texto do CTA]
*Instrucao: Texto na tela com seta, musica sobe*
```

### 7. Validar com Checklist

Aplicar `checklists/roteiro.md` — score minimo 75%.

## Output

- Roteiro completo formatado com timestamps
- Instrucoes de gravacao/edicao por bloco
- 3 opcoes de hook alternativo
- CTA adequado ao objetivo

## Handoff

→ Se aprovado: usuario grava ou passa para Video Editor
→ Se reprovado: Scriptwriter ajusta conforme feedback
