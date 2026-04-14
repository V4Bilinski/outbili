# Página Institucional OUTBILI — Especificação de Copy

## Propósito

Landing page INTERNA do OUTBILI. Acessível sem login. Primeiro contato de novos membros da V4 Bilinski & Co com o sistema.

**CTA principal:** Acessar como usuário (login) ou Criar acesso (registro)

---

## Estrutura da Página

### Hero

**Headline:** "Do CNPJ ao contrato. Sem lista fria. Sem achismo. Sem trava."

**Sub-headline:** "O sistema de inteligência comercial da V4 Bilinski & Co. Prospecção outbound com a Fábrica de Receita operacionalizada."

**CTA duplo:**
- [Acessar] → redireciona para /#/login
- [Criar acesso] → redireciona para fluxo de registro

**Visual:** Screenshot hero do sistema (DashboardPage ou PipelinePage)

---

### Seção 1: O Problema

**Título:** "Depender de um canal é uma trava."

**Copy:**
Toda unidade V4 conhece o LeadBroker. Funciona. Mas quando 100% da receita nova depende de um canal que você não controla, você não tem operação comercial — tem esperança gerenciada por terceiros.

Prospecção outbound é um dos canais de maior rentabilidade no B2B. Mas fazer manual é brutal: pesquisar empresa por empresa, achar CNPJ, descobrir o dono, encontrar telefone que nunca é o certo.

**O OUTBILI resolve isso.**

---

### Seção 2: A Linha de Montagem

**Título:** "5 estações. Zero improvisação."

**Visual:** Diagrama horizontal das 5 estações

| Estação | O que faz |
|---------|-----------|
| Pesquisa | Busca por segmento e localização via CNPJa |
| Enriquecimento | Cascata 3 níveis até o WhatsApp do decisor |
| Qualificação | Score SPICED automático + temperatura |
| Inteligência | 5 tabs: Reunião, Projeção, Vulnerabilidades, Competitiva, Argumentos |
| Prospecção | Campanhas WhatsApp via BilinskiZap |

---

### Seção 3: As 8 Travas

**Título:** "Cada funcionalidade destranca uma trava."

**Visual:** Grid 2x4 com ícone + trava + funcionalidade

(Conteúdo do mapa de travas do manifesto)

---

### Seção 4: O Mecanismo

**Título:** "O WhatsApp do dono. Não o email do estagiário."

**Copy sobre cascata 3 níveis + diferencial vs ferramentas genéricas**

---

### Seção 5: O Compromisso

**Título:** "5 regras de quem opera o OUTBILI."

(As 5 regras do manifesto em formato visual)

---

### Seção 6: CTA Final

**Título:** "Entre na linha."

**CTA duplo:**
- [Acessar como usuário] → /#/login
- [Solicitar acesso] → formulário ou WhatsApp do admin

---

## Rota

`/#/institucional` — pública, sem autenticação

Se o usuário já está logado, redireciona para `/#/` (Dashboard).

---

## Tom

Institucional, orgulho, pertencimento. Não é uma página de vendas — é uma página de **identidade**. O novo membro lê e pensa: "quero fazer parte disso."
