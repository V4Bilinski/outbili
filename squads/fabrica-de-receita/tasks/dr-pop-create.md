# POP DR — Criacao e Auditoria de Procedimentos Operacionais Padrao

---
name: dr-pop-create
description: Criar, auditar e manter POPs + artefatos padronizados DR (absorve trabalho de Executor v1.0)
agent: dr-chief
created_at: 2026-04-22
origem: Migrado do agent ops-dr (Executor) na refatoracao v2.0.0 do squad
---

## Objetivo

Garantir a excelencia operacional dos engajamentos Destrava Receita atraves da criacao
e manutencao de POPs (Procedimentos Operacionais Padrao), producao de artefatos
padronizados por produto DR, execucao de auditorias de qualidade e gestao da base de
conhecimento do squad FDR. Sem POPs e templates, cada engajamento vira artesanato —
o produto DR nao escala.

## Pre-requisitos

- Produto DR identificado (DR-X / DR-O / DR-T / DR-E)
- Processo a ser documentado (nome, objetivo, stakeholders)
- Acesso aos artefatos existentes na base de conhecimento
- Templates corporativos V4 (identidade visual, tom de voz)

## Passos

### Step 1: Identificar Processo e Escopo

Classificar o processo dentro do catalogo de POPs existentes:

| POP | Descricao | Versao atual |
|-----|-----------|--------------|
| POP-001 | Kick-off de engajamento DR | v2.1 |
| POP-002 | Sessao de diagnostico STEP | v1.3 |
| POP-003 | Producao e revisao de proposta | v2.0 |
| POP-004 | Weekly review com cliente | v1.5 |
| POP-005 | Escalonamento de problemas | v1.2 |
| POP-006 | Encerramento e handoff pos-DR | v1.0 |
| POP-007 | Coleta de NPS e case de sucesso | v1.1 |
| POP-008 | Onboarding de novo consultor DR | v1.4 |

Se o processo ja existe → atualizar versao com mudancas.
Se e novo → criar POP-00X com numeracao sequencial.

### Step 2: Estruturar o POP

Todo POP DR segue a mesma estrutura:

```
# POP-XXX: {Nome do Processo} (v{versao})

## Objetivo
Uma frase definindo o "para que" do processo.

## Quando Executar
Gatilhos especificos que acionam este POP.

## Responsaveis
- Owner: quem lidera a execucao
- Contribuintes: agentes/papeis envolvidos
- Aprovador: quem valida (usualmente Fabio ou Apex)

## Passos
Sequencia numerada, executavel, sem ambiguidade.

## Entregaveis
Artefatos produzidos (com links para templates).

## Criterios de Qualidade
Checklist objetivo de "pronto".

## Referencias
POPs relacionados, templates, frameworks (STEP/TOC/V4).
```

### Step 3: Gerar Artefato Padronizado (por Produto DR)

Usar catalogo de artefatos por produto:

#### DR-X (Express — 45 dias)
- Roteiro de sessao de diagnostico (4h)
- Template de Current Reality Tree
- Template de priorizacao de travas (ranking)
- Template de plano de acao 30 dias
- Template de apresentacao executiva de diagnostico

#### DR-O (Operacional — 12 meses)
- STEP framework document
- Template de implementacao por pilar V4
- Playbook documentado por processo
- Template de treinamento de equipe
- Dashboard template de metricas
- Relatorio de progresso mensal
- Template de relatorio final

#### DR-T (Times — 12 meses)
- Todos os artefatos do DR-O
- Ciclo de 90 dias detalhado
- Templates de sprints quinzenais
- OKRs e arvore de metricas
- Playbooks de todos os processos (4 pilares)
- Template de retrospectiva de ciclo
- Relatorio final com ROI documentado

#### DR-E (Enterprise — 12 meses)
- Todos os artefatos do DR-T (x2 ciclos ou mais)
- Arquitetura de time de receita
- Programa de lideranca em growth
- Modelo de integracao Marketing+Vendas+CS
- Forecast de receita 12 meses
- Template de revisao executiva trimestral

### Step 4: Aplicar Checklist de Qualidade (antes do envio ao cliente)

```
[ ] Metodologia corretamente aplicada (STEP, TOC, V4)
[ ] Dados e metricas do cliente utilizados (sem invencao — zero fantasia)
[ ] Plano de acao com responsaveis e prazos
[ ] Metricas de sucesso definidas e mensuraveis
[ ] Riscos e premissas documentados
[ ] Pilar V4 afetado explicito
[ ] Trava(s) atacada(s) nomeada(s) com taxonomia oficial V4
[ ] Aprovado pelo Dr-Chief (Apex) antes do envio
[ ] Quality gate de Fabio para engajamentos DR-T e DR-E
[ ] Formatacao e identidade visual padrao V4
[ ] Revisado por pelo menos um par (outro consultor)
```

### Step 5: Versionamento e Arquivo

- Salvar POP em `squads/fabrica-de-receita/pops/POP-XXX-vY.Y.md`
- Arquivar versao anterior em `pops/archive/`
- Atualizar catalogo em `data/pops-catalog.yaml`
- Notificar squad sobre mudancas relevantes (changelog breve)

### Step 6: Auditoria Continua

Periodicamente (trimestralmente ou pos-engajamento) auditar POPs existentes:
- Executar `*pop-audit {pop-id}` para revisao estruturada
- Coletar feedback de consultores que usaram o POP
- Registrar licoes aprendidas em `data/lessons-learned.yaml`
- Propor atualizacoes de versao quando gap identificado

## Comandos Relacionados (em Apex via dr-chief)

| Comando | Acao |
|---------|------|
| `*pop-create {processo}` | Cria novo POP para processo especifico |
| `*pop-audit {pop-id}` | Audita POP existente e recomenda atualizacoes |
| `*artefato {produto} {tipo}` | Gera artefato padronizado por produto DR e tipo |
| `*quality-check {entregavel}` | Aplica checklist de qualidade em entregavel |
| `*template-library` | Lista todos os templates disponiveis |
| `*knowledge-base-update` | Atualiza base de conhecimento |
| `*consultant-onboarding` | Plano de onboarding de novo consultor |
| `*engagement-audit {cliente}` | Audita qualidade do engajamento em andamento |
| `*lessons-learned` | Documenta licoes aprendidas pos-engajamento |

## Entregaveis

- POP versionado e publicado em `pops/`
- Artefato padronizado (template) disponivel na biblioteca
- Checklist de qualidade aplicado ao entregavel
- Relatorio de auditoria (quando aplicavel)
- Atualizacao do catalogo em `data/pops-catalog.yaml`

## Quality Gate (Fabio)

Para POPs que afetam entregaveis de cliente (DR-T, DR-E), Fabio valida:
- [ ] POP alinhado com metodologia V4 completa
- [ ] Artefato usa dados reais, zero invencao
- [ ] Checklist de qualidade cobre os 5 criterios do gate
- [ ] Integracao com outros POPs existentes (sem conflito)

## Handoffs

- **Entrada:** demanda vem de `@dr-chief` (Apex) durante engajamento
- **Saida:** POP publicado para uso por todo o squad FDR
- **Suporte:** `@fabrica-de-receita-master` (Fabio) para aprovacao final em casos criticos

## Referencias

- Estrutura geral: `FABRICA-DE-RECEITA.md` secao 6 (Linha de Negocio DR)
- Produtos DR em detalhe: `agents/dr-chief.md`
- Task de pitch que gera POPs de proposta: `tasks/dr-pitch.md`
