# OUTBILI Copy Guide Definitivo

**Versão:** 3.1
**Data:** 2026-04-27
**Squad:** Copy Squad local (squads/copy)
**Modelo de tom:** InstitucionalPage v1 original
**Sucessor de:** REALINHAMENTO-RELATORIO.md (v2 caricatura abandonada)
**Status:** ATIVO. Regra de sistema com enforcement automatico via hook PreToolUse.

---

## Como este guide eh aplicado

Este nao eh apenas documento. Eh **regra de sistema** com 5 camadas de garantia:

| Camada | Mecanismo | Onde |
|--------|-----------|------|
| 1. Rule contextual | Carregada automaticamente quando edita UI/copy | `.claude/rules/copy-tom-voz.md` |
| 2. Hook PreToolUse | Bloqueia travessao e giria caricatura em Edit/Write | `.claude/hooks/copy-style-guard.js` |
| 3. Memory persistente | Tom preservado entre sessoes | `~/.claude/.../memory/feedback_copy_tom.md` |
| 4. CLAUDE.md | Referencia oficial na tabela de Rules System | `.claude/CLAUDE.md` |
| 5. Changelog | Historico de mudancas e ciclo de atualizacao | `docs/copy/CHANGELOG.md` |

Quando o assistente tenta salvar codigo com travessao em string visivel ou giria proibida (lista em secao 7), o hook bloqueia hard, retorna sugestao de fix e o assistente refaz a edicao automaticamente.

---

---

## 1. Princípio Mãe

A copy do OUTBILI fala com **time de vendas B2B profissional** que opera o sistema todo dia. O operador precisa **sentir conexão** ao usar o sistema. A copy não é vendedor de feira nem palestrante motivacional. É colega de mesa que sabe do que está falando.

> "Copy is the salesman in print." Mas o salesman aqui é **profissional sênior**, não SDR júnior em call center.

---

## 2. Regras Inegociáveis

### 2.1 Pontuação

> **NUNCA** usar travessão `—` (em-dash) ou `–` (en-dash) em copy de UI.

**Substitutos válidos:**
- Ponto final `.` (corta a frase)
- Vírgula `,` (continua a frase)
- Dois pontos `:` (introduz lista ou explicação)
- Parênteses `( )` (aposto explicativo)
- Quebra de linha (em descrições)

**Exemplo:**

ERRADO: `Sistema de inteligência comercial — V4 Bilinski & Co`
CERTO: `Sistema de inteligência comercial. V4 Bilinski & Co`
CERTO: `Sistema de inteligência comercial · V4 Bilinski & Co` (ponto médio decorativo)
CERTO: `Sistema de inteligência comercial (V4 Bilinski & Co)`

### 2.2 Tom de voz

**SIM:**
- Profissional comercial-técnico
- Direto, sem rodeios
- Frase curta com substância
- Vocabulário REAL de vendas B2B
- Pertencimento (`seu pipeline`, `sua oportunidade`, `seu próximo passo`)
- Especificidade (números, métricas, prazos concretos)

**NÃO:**
- Gíria de SDR júnior ("pescar", "matar", "subir", "porra", "bora", "vai pra rua")
- Brutalismo de copywriter velho ("zumbi no pipe", "caneta na mão")
- Corporativês ("solução escalável", "experiência transformacional")
- Slogan motivacional ("vamos lá", "você consegue", "hoje é o dia")
- Palavrão verbal disfarçado de tom

### 2.3 Voz

- **Segunda pessoa** (`você`) sempre que se referir ao operador
- **Imperativo** em CTA (`Prospecte`, `Qualifique`, `Avance`, `Agende`)
- **Indicativo** em descrição (`O score atualiza...`, `A cadência envia...`)

---

## 3. Vocabulário Aprovado

### 3.1 Pipeline e funil

| Termo aprovado | NÃO usar |
|----------------|----------|
| pipeline | funil (use só em "funil de conversão") |
| oportunidade, deal | "negócio" (genérico demais) |
| lead qualificado, MQL, SQL | "lead bom" |
| estágio, etapa | "fase" |
| conversão, taxa de conversão, win rate | "taxa de fechamento" (use win rate) |
| ticket, ticket médio, valor de contrato | "preço" |

### 3.2 Prospecção

| Termo aprovado | NÃO usar |
|----------------|----------|
| prospectar, prospecção | pescar, caçar |
| prospect, target, ICP | "alvo", "vítima" |
| cadência, sequência, touchpoint | "disparo" |
| cold call, cold mail, cold WhatsApp, primeiro toque | abordagem fria |
| enriquecimento, dados, inteligência | "informação" |

### 3.3 Qualificação

| Termo aprovado | NÃO usar |
|----------------|----------|
| score, qualificar, SPICED | "nota", "avaliação" |
| discovery, descoberta | "investigação" |
| decisor, champion, influenciador, gatekeeper | "dono", "chefão", "estagiário" |
| temperatura (Quente, Morno, Frio) | "tipo" |

### 3.4 Fechamento

| Termo aprovado | NÃO usar |
|----------------|----------|
| proposta, negociação, fechamento, contrato | "venda" (uso reservado a verbo) |
| objeção, contraponto, resposta | "desculpa", "barreira" |
| follow-up, próximo passo | "retorno" |
| stage gate, checklist | "verificação" |

### 3.5 Performance

| Termo aprovado | NÃO usar |
|----------------|----------|
| meta, atingimento, quota | "número" |
| forecast, projeção, pipeline coverage | "previsão" |
| velocity, ciclo de venda | "tempo médio" |
| LTP (Lifetime Throughput do Projeto) | manter, é jargão V4 |
| Throughput (T) | manter, é jargão TOC/V4 |

### 3.6 Frameworks V4 (manter intactos)

- **8 Travas (T1 a T8):** Cegueira, Exposição, Atenção, Interesse, Qualificação, Compromisso, Decisão, Dependência
- **Linha de Montagem:** Pesquisa, Enriquecimento, Qualificação, Inteligência, Prospecção
- **Cascata 3 níveis:** telefones empresa, telefones decisores, celular CPF do sócio
- **Tiers:** Micro+, Small, Medium-, Medium=
- **SPICED:** Situation, Pain, Impact, Critical Event, Decision

---

## 4. Padrões de UI

### 4.1 Headers de página (h1)

**Padrão:** Substantivo direto, sem floreio.

| Página | h1 |
|--------|-----|
| Dashboard | "Dashboard" ou "Visão geral do pipeline" |
| Pesquisa | "Prospecção" |
| Leads | "Leads" |
| Pipeline | "Pipeline" |
| Mensagens | "Inbox" ou "Mensagens" |
| Campanhas | "Campanhas" |
| Relatórios | "Relatórios" |
| Configurações | "Configurações" |

### 4.2 Subtítulo de página

**Padrão:** Métrica concreta + contexto. Curto.

Exemplos:
- `42 leads no pipeline`
- `R$ 187 mil em oportunidades ativas`
- `12 deals aguardando follow-up`

### 4.3 CTAs (botões primários)

**Padrão:** Verbo no infinitivo + objeto direto. 1 a 4 palavras.

| Ação | CTA |
|------|-----|
| Iniciar prospecção | `Nova prospecção` ou `Prospectar` |
| Importar lista | `Importar lista` |
| Qualificar lead | `Qualificar` |
| Avançar estágio | `Avançar para Reunião` |
| Agendar reunião | `Agendar reunião` |
| Disparar cadência | `Iniciar cadência` |
| Enviar mensagem | `Enviar` |
| Salvar | `Salvar` ou `Salvar alterações` |
| Cancelar | `Cancelar` |

**Proibido em CTA:**
- "Pescar", "Subir", "Matar", "Bora"
- "Visualizar" (use `Ver` ou `Abrir`)
- "Acessar" (use `Abrir` ou `Entrar`)
- "Submeter" (use `Enviar`)

### 4.4 Empty states

**Padrão de 3 linhas:**

1. **Linha 1 (h3):** Estado neutro descritivo. Não dramático.
2. **Linha 2 (p):** O que isso significa em termos comerciais.
3. **Linha 3 (CTA):** Próxima ação direta.

**Exemplo (Dashboard sem leads):**

```
Pipeline vazio.
Nenhum lead em prospecção. Comece pela busca por segmento.
[Iniciar prospecção]
```

**Exemplo (Pipeline sem deals em qualificação):**

```
Nenhuma oportunidade em qualificação.
Avance leads contactados para esta etapa quando responderem.
[Ver leads contactados]
```

### 4.5 Toasts e mensagens

**Sucesso:** Confirmação concreta. Sem exclamação dupla.

| Ação | Toast |
|------|-------|
| Login | `Login realizado.` |
| Lead criado | `Lead criado.` |
| Cadência iniciada | `Cadência ativa. Primeiro touchpoint disparado.` |
| Proposta enviada | `Proposta enviada. Follow-up em 3 dias.` |
| Reunião agendada | `Reunião agendada para {data}.` |

**Erro:** Diagnóstico + ação corretiva.

| Erro | Toast |
|------|-------|
| Email/senha | `Email ou senha incorretos.` |
| Sem CNPJ | `CNPJ não encontrado na base.` |
| Sem decisor | `Decisor não localizado. Tente enriquecimento manual.` |
| Falha API | `Falha de conexão. Tente novamente em instantes.` |

### 4.6 Labels de campos

**Padrão:** Substantivo curto. Sem "Digite seu...".

| Campo | Label |
|-------|-------|
| Nome | `Nome completo` |
| Email | `Email` |
| Senha | `Senha` |
| CNPJ | `CNPJ` |
| Telefone | `Telefone` ou `WhatsApp` |
| Segmento | `Segmento (CNAE)` |
| UF | `UF` |
| Faturamento | `Faturamento estimado` |

### 4.7 Placeholders de input

**Padrão:** Exemplo concreto.

| Campo | Placeholder |
|-------|-------------|
| Email | `seu@empresa.com.br` |
| CNPJ | `00.000.000/0000-00` |
| Telefone | `(11) 90000-0000` |
| Busca empresa | `Razão social ou nome fantasia` |
| Busca lead | `Buscar por empresa, decisor ou CNPJ` |

### 4.8 Helper text (microcopy abaixo do campo)

**Padrão:** Instrução prática. Curta.

Exemplo:
- `Use o email corporativo. Senha mínima: 6 caracteres.`
- `Selecione até 5 segmentos para refinar a busca.`
- `Cadência envia 1 mensagem a cada 2 dias úteis.`

---

## 5. Padrões de Status e Estado

### 5.1 Temperatura de lead

| Estado | Label | Cor |
|--------|-------|-----|
| Quente (SPICED 3.7-5.0) | `Quente` | hot/red |
| Morno (SPICED 2.5-3.6) | `Morno` | warm/yellow |
| Frio (SPICED 1.0-2.4) | `Frio` | cold/blue |

### 5.2 Status de pipeline

| Status | Label | Voz comercial |
|--------|-------|---------------|
| Novo | `Novo` | Lead recém-importado, aguardando enriquecimento |
| Qualificado | `Qualificado` | Pronto para primeiro toque |
| Contactado | `Contactado` | Cadência ativa, aguardando resposta |
| Respondeu | `Respondeu` | Engajamento confirmado, agendar discovery |
| Reunião | `Reunião` | Discovery ou demo agendada |
| Proposta | `Proposta` | Em negociação |
| Fechado | `Fechado` | Contrato assinado |
| Perdido | `Perdido` | Oportunidade encerrada |

### 5.3 Status de tarefa

| Status | Label |
|--------|-------|
| Pendente | `Pendente` |
| Em andamento | `Em andamento` |
| Atrasada | `Atrasada` |
| Concluída | `Concluída` |

---

## 6. Padrões de Hint Comercial (textos contextuais)

**Padrão:** Conexão emocional sem dramatização. Diz onde o operador está e qual o próximo passo.

### Por temperatura

| Temperatura | Hint |
|-------------|------|
| Quente (com leads) | `Pronto para primeiro toque ou agendamento direto.` |
| Quente (sem leads) | `Sem leads quentes no momento. Re-qualifique mornos para subir score.` |
| Morno (com leads) | `Em qualificação. Aprofunde discovery ou descarte se não houver fit.` |
| Morno (sem leads) | `Sem leads mornos. Importe lista ou inicie nova prospecção.` |
| Frio (com leads) | `Em cadência de aquecimento ou descarte por falta de fit.` |
| Frio (sem leads) | `Pipeline limpo de leads frios.` |

### Por estágio

| Estágio | Hint |
|---------|------|
| Pesquisa | `Leads novos descobertos, ainda sem enriquecimento de contato.` |
| Enriquecimento | `Em coleta de dados (CNPJa, Assertiva).` |
| Qualificação | `Enriquecidos com SPICED calculado, prontos para abordagem.` |
| Inteligência | `Em contato ativo (mensagem enviada, respondeu, reunião marcada).` |
| Prospecção | `Com proposta entregue, próximos do fechamento.` |

---

## 7. Anti-padrões (proibidos)

### 7.1 Frases proibidas

| Proibido | Motivo |
|----------|--------|
| "Bora pra mesa" | Caricatura de SDR jovem |
| "Linha tá rodando" | Coloquial demais |
| "Pesca lead" / "Pescar" | Gíria informal |
| "Subir o lead" | Ambíguo, jargão de squad |
| "Matar a objeção" / "Matar a porra" | Violento, fora do tom |
| "Zumbi" | Excessivo, dramatiza estagnação |
| "Caneta perto" / "Caneta na mão" | Coloquial demais |
| "Vai pra rua na sua" | Caricatura |
| "Bem-vindo!" (com exclamação) | Genérico, não conecta |
| "Tudo certo!" | Genérico |
| "Vamos juntos!" | Motivacional vazio |

### 7.2 Estruturas proibidas

| Proibido | Substituir por |
|----------|----------------|
| "Solução escalável de inteligência..." | "Sistema de inteligência comercial" |
| "Experiência transformacional" | (eliminar) |
| "Operacionaliza" | "Funciona", "executa", "roda" |
| "Alavanca seu funil" | "Aumenta sua conversão" |
| "Disrupta o mercado" | (eliminar) |
| "Melhor da categoria" | (eliminar, substitua por mecanismo único) |

### 7.3 Pontuação proibida

| Proibido | Substituir por |
|----------|----------------|
| `—` (em-dash) | `.` ou `:` ou `,` |
| `–` (en-dash) | `.` ou `:` ou `,` |
| `…` (reticências unicode) | `...` (3 pontos ASCII) ou eliminar |
| `!!` (exclamação dupla) | `.` (ponto) ou `!` (única, raro) |

---

## 8. Padrões de Conexão (Robert Collier — mental conversation)

A copy precisa **entrar na conversa que o operador já está tendo na cabeça**. Nunca falar SOBRE ele. Sempre falar COM ele.

### 8.1 O que o SDR/BDR pensa

- "Quem é meu próximo prospect?"
- "Qual o próximo lead pra cadenciar?"
- "Esse lead respondeu, e agora?"
- "Tá quente ou ainda preciso aquecer?"
- "Tô atrasado em 3 follow-ups."

### 8.2 O que o Closer pensa

- "Quais reuniões tenho amanhã?"
- "Tô preparado pra discovery dessa empresa?"
- "Essa proposta tá há quantos dias na mesa?"
- "Quanto tem em forecast pro mês?"
- "Quem tá perto de fechar?"

### 8.3 Padrões de copy que respondem

| Pergunta mental | Copy que responde |
|-----------------|-------------------|
| "Quem é meu próximo prospect?" | `3 leads quentes prontos para primeiro toque.` |
| "Esse lead respondeu, e agora?" | `Respondeu há 2 horas. Avance para reunião agendada.` |
| "Tô preparado pra reunião?" | `5 tabs de inteligência prontas (Reunião, Projeção, Vulnerabilidades, Competitiva, Argumentos).` |
| "Quanto tem em forecast?" | `R$ 187 mil em oportunidades quentes. Fechamento previsto em 30 dias.` |

---

## 9. Padrões de Erro (Padrão Kennedy: diagnóstico + ação)

Erro nunca é "Algo deu errado". Erro é **diagnóstico + ação corretiva**.

| Erro | Mensagem |
|------|----------|
| API down | `Serviço de enriquecimento indisponível. Tente novamente em alguns minutos.` |
| Limite atingido | `Limite mensal de enriquecimento atingido. Acesse Configurações para upgrade.` |
| Validação | `CNPJ inválido. Verifique os 14 dígitos.` |
| Permissão | `Sem permissão para esta ação. Solicite acesso ao admin.` |
| Sessão expirada | `Sessão expirada. Faça login novamente.` |

---

## 10. Estrutura de cobertura no sistema

Páginas a cobrir nesta refatoração:

- [x] **InstitucionalPage** (modelo de tom, manter v1)
- [ ] **LoginPage**
- [ ] **DashboardPage**
- [ ] **SearchPage**
- [ ] **LeadsPage**
- [ ] **PipelinePage**
- [ ] **CompanyPage** (5 Tabs internas)
- [ ] **CampaignsPage**
- [ ] **InboxPage**
- [ ] **ReportsPage**
- [ ] **SettingsPage**
- [ ] **AdminPage**
- [ ] **GlossarioPage**

Componentes a cobrir:

- [ ] **Sidebar** (labels nav)
- [ ] **BottomNav** (mobile nav)
- [ ] **MobileHeader**
- [ ] **InstitucionalNav**
- [ ] **ImportModal**
- [ ] Componentes UI compartilhados (Button, EmptyState, Skeleton)

---

## 11. Auditoria final (checklist)

Para cada página revisada:

- [ ] Zero travessões `—` ou `–` no código
- [ ] CTAs com verbo no infinitivo aprovado
- [ ] Empty states em 3 linhas
- [ ] Toasts no padrão diagnóstico+ação
- [ ] Vocabulário comercial profissional (não gíria)
- [ ] Pertencimento (`seu`, `sua`) onde aplicável
- [ ] Especificidade (números, métricas, prazos)
- [ ] Frameworks V4 preservados (8 Travas, SPICED, LTP, Cascata, Tiers)

---

## 12. Ciclo de Atualizacao do Guide

Este guide eh **vivo**. Atualiza conforme uso real do sistema, feedback do time e novos termos comerciais emergentes.

### Quando atualizar

Atualize sempre que:

1. **Feedback do usuario**. Reportou que termo X soa caricatura ou que termo Y agora eh padrao do time.
2. **Novo termo comercial**. Time comecou a usar termo novo no dia a dia que precisa entrar no vocabulario.
3. **Decisao de produto**. Mudanca de feature exige terminologia nova (ex.: novo produto DR, nova trava T9, novo Tier).
4. **Resultado de hook bloqueando muito**. Se o hook bloqueia legitimamente um padrao novo, ajustar a lista negra/branca.
5. **Mudanca no squad de copy**. Se Copy Squad atualiza Tier 0 (Schwartz/Hopkins) ou orientacao geral.

### Como atualizar (5 passos)

1. **Editar `COPY-GUIDE-DEFINITIVO.md`**. Adicionar/remover termo, padrao, exemplo.
2. **Editar `docs/copy/CHANGELOG.md`**. Nova entrada no topo com versao, data, autor, motivo, impacto.
3. **Editar `.claude/rules/copy-tom-voz.md`**. Se mudou regra HARD ou SOFT.
4. **Editar `.claude/hooks/copy-style-guard.js`**. Se entrou/saiu termo da lista negra (atualizar arrays `CARICATURE_JARGON` e tabelas).
5. **Salvar memory feedback**. Para preservar contexto entre sessoes futuras.

### Quem atualiza

- **Usuario** decide o que muda.
- **AIOX Master (Orion)** ou **Copy Chief** executa a mudanca seguindo os 5 passos.
- **Hook valida** automaticamente se a mudanca quebra alguma regra existente.

### Versionamento

Semantic-ish:

- **Patch (3.1.x)**: termo novo na lista, ajuste fino de exemplo.
- **Minor (3.x.0)**: nova secao, novo padrao de UI, nova regra SOFT.
- **Major (X.0.0)**: mudanca de tom mae, regra HARD nova ou modificada.

---

**Modelo de tom de referência:** `src/pages/InstitucionalPage.tsx` (versão original v1, antes da v2 caricatura).
**Hook validador:** `.claude/hooks/copy-style-guard.js`
**Rule contextual:** `.claude/rules/copy-tom-voz.md`
**Changelog:** `docs/copy/CHANGELOG.md`
