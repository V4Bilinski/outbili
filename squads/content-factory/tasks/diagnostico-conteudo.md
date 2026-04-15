---
name: diagnostico-conteudo
description: AIOX Chief faz diagnostico completo do conteudo do criador e recomenda proximo passo
agent: aiox-chief
execution_type: hybrid
input:
  - Link do canal/perfil do criador
  - Objetivo do criador
output:
  - Diagnostico com gaps e recomendacoes
  - Plano de acao com agente recomendado
---

# Task: Diagnostico de Conteudo

AIOX Chief analisa a situacao do criador e recomenda o melhor caminho.

---

## Pre-requisitos

- [ ] Link ou @ do canal/perfil
- [ ] Plataforma principal (YouTube, Instagram, TikTok)
- [ ] Objetivo (crescer, monetizar, viralizar, consistencia)

---

## Passo a Passo

### 1. Coletar Contexto

```
Responda:
- Qual seu canal/perfil? (link ou @)
- Qual plataforma principal?
- Quantos seguidores/inscritos?
- Frequencia de postagem atual?
- Qual seu maior desafio agora?
- Qual seu objetivo nos proximos 90 dias?
- Ja tem conteudo longo (lives, podcasts, aulas)?
```

### 2. Diagnosticar Gaps

| Area | Perguntas | Agente |
|------|-----------|--------|
| **Volume** | Posta pouco? Sem consistencia? | Repurposing |
| **Qualidade** | Cortes ruins? Sem estrutura? | Video Editor |
| **Estrategia** | Nao sabe o que funciona no nicho? | Espiao |
| **Roteiro** | Videos sem hook? Sem CTA? Perde atencao? | Scriptwriter |
| **Tudo** | Comecando do zero? | Chief coordena todos |

### 3. Classificar Prioridade

| Prioridade | Criterio | Acao |
|-----------|---------|------|
| P1 — Urgente | Sem conteudo nenhum saindo | Scriptwriter → roteiro basico |
| P2 — Importante | Tem conteudo mas sem resultado | Espiao → analisar o que funciona |
| P3 — Otimizacao | Ja publica mas quer escalar | Repurposing → multiplicar |
| P4 — Refinamento | Ja escala mas quer viralizar | Video Editor → cortes virais |

### 4. Gerar Plano de Acao

```markdown
# Diagnostico — @canal

## Situacao Atual
- Plataforma: ___
- Seguidores: ___
- Frequencia: ___
- Maior gap: ___

## Recomendacao
1. **Primeiro:** [Agente] → [Acao]
2. **Depois:** [Agente] → [Acao]
3. **Manter:** [Agente] → [Acao recorrente]

## Proximo Passo
> Quer que eu acione o [Agente] agora?
```

### 5. Rotear para Agente

Apos aprovacao do usuario, Chief aciona o agente recomendado com contexto completo.

## Output

- Diagnostico formatado com gaps identificados
- Plano de acao priorizado (P1-P4)
- Recomendacao de agente + acao
- Handoff automatico para agente aprovado
