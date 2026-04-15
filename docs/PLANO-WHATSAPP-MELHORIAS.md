# Planejamento Estrategico — Melhorias WhatsApp Business no OUTBILI

**Data:** 2026-04-09
**Responsavel:** Zap (WhatsApp Chief) + Squad completo
**Baseline:** Auditoria de 3 especialistas (Atlas, Nova, Pulse, Flux, Link, Shield)

---

## Estado Atual do Sistema

### Inventario de Arquivos WhatsApp no OUTBILI

```
src/
  pages/
    CampaignsPage.tsx          (1234 linhas) — Wizard 4-steps, listagem, detail
    InboxPage.tsx              (85 linhas)   — Layout split-panel basico
    ReportsPage.tsx            (267 linhas)  — KPIs + graficos basicos
  components/inbox/
    ChatHeader.tsx             — Header basico (nome, modo, pause/resume, theme)
    ChatInput.tsx              — Textarea + send + quick replies (/) + AI suggest
    ChatPanel.tsx              — Container (header + messages + input)
    ConversationItem.tsx       — Linha de conversa (avatar, preview, badge)
    ConversationList.tsx       — Painel esquerdo (busca, tabs, lista)
    ConversationSearch.tsx     — Busca + tabs (Todas/Nao lidas/Bot/Humano)
    EmptyChat.tsx              — Estado vazio
    MessageBubble.tsx          — Baloes (text/image/audio/video/doc/template)
    MessageList.tsx            — Area scrollavel + wallpaper + date separators
  hooks/
    useInbox.ts                (234 linhas) — Orquestracao React Query + polling
    useBilinskiZap.ts          — Hooks de campanha
  services/
    inboxService.ts            (108 linhas) — 12 funcoes API wrapper
  types/
    inbox.ts                   (105 linhas) — Tipos espelhados do BilinskiZap
  lib/
    bilinskizap.ts             — zapFetch (exportado) + campaign/contact/template APIs
```

### Backend Disponivel (BilinskiZap — ja implementado)

| Area | Endpoints | Status |
|------|-----------|--------|
| Conversas | 10 endpoints (CRUD + actions) | Pronto, parcialmente consumido |
| Mensagens | GET + POST por conversa | Pronto, consumido |
| Labels | GET + POST + DELETE | Pronto, NAO consumido no UI |
| Quick Replies | GET + POST + PATCH + DELETE | Pronto, so GET consumido |
| AI Suggest | POST /inbox/suggest | Pronto, consumido |
| Reply Counts | GET /conversations/reply-counts | Pronto, hook existe mas sem UI |
| Templates | GET + POST + CREATE + DRAFTS + CLONE + DELETE | Pronto, OUTBILI so le |
| Campaigns | CREATE + DISPATCH + PAUSE + RESUME + CANCEL + WORKFLOW | Pronto, consumido |
| Flows | CRUD + ENDPOINT + SEND + SUBMISSIONS + KEYS | Pronto, NAO consumido |
| Webhook | Incoming messages + status updates + dedupe | Pronto, transparente |
| Interactive | Buttons + Lists + CTA + Location request | Pronto, NAO consumido |
| Media | Image + Video + Audio + Document + Sticker + Location + Carousel | Pronto, NAO consumido |
| Reactions | Send + Remove emoji reactions | Pronto, NAO consumido |

---

## SPRINT 1 — Quick Wins + Fundacao

**Objetivo:** Fechar 8 gaps que o backend ja suporta. Zero backend novo necessario.
**Estimativa:** 5 dias uteis

### 1.1 Reply Status Tabs no Inbox

**Problema:** Hook `useInbox` ja carrega `replyCounts` (all/replied/unreplied) mas nao existe UI visual.

**Solucao:** Adicionar tabs "Todas (N) | Nao respondidas (N) | Respondidas (N)" acima da lista de conversas.

**Arquivos a modificar:**
- `src/components/inbox/ConversationList.tsx` — Adicionar componente ReplyStatusTabs entre o header e a lista
- `src/components/inbox/ConversationSearch.tsx` — Integrar reply status filter nos tabs existentes ou substituir

**Implementacao:**
```
ConversationList
  +-- Header ("Inbox")
  +-- ReplyStatusTabs (NOVO) — 3 tabs com contadores
  +-- ConversationSearch (busca + mode filter)
  +-- Lista de conversas
```

**Props necessarias:** `replyCounts: ReplyStatusCounts`, `activeReplyStatus`, `onReplyStatusChange`

**Verificacao:** Clicar "Nao respondidas" filtra lista, contadores atualizam via polling 15s.

---

### 1.2 Close/Reopen Conversa

**Problema:** Nenhuma forma de fechar ou reabrir conversas.

**Solucao:** Adicionar botoes no ChatHeader.

**Arquivos a modificar:**
- `src/components/inbox/ChatHeader.tsx` — Adicionar botao X (fechar) e Reopen
- `src/services/inboxService.ts` — Adicionar `closeConversation(id)` e `reopenConversation(id)` usando `updateConversation(id, { status: 'closed'|'open' })`
- `src/hooks/useInbox.ts` — Adicionar mutations `closeMutation` e `reopenMutation`

**Endpoint backend:** `PATCH /api/inbox/conversations/{id}` com `{ status: 'closed' }` ou `{ status: 'open' }`

**Verificacao:** Fechar conversa remove da lista (se filtro=open). Reabrir traz de volta.

---

### 1.3 Auto-Switch Bot → Humano ao Enviar Manual

**Problema:** Quando operador envia mensagem manual, o bot pode responder por cima.

**Solucao:** No `sendMessage` mutation, apos envio bem-sucedido, se `conversation.mode === 'bot'`, automaticamente chamar `handoffConversation(id)`.

**Arquivos a modificar:**
- `src/hooks/useInbox.ts` — No `onSuccess` do `sendMutation`, verificar modo e chamar handoff

**Implementacao:**
```typescript
onSuccess: () => {
  // Auto-switch to human mode when operator sends manually
  const conv = qc.getQueryData(['inbox-conversation', selectedId])
  if (conv?.mode === 'bot') {
    handoffConversation(selectedId!).catch(() => {})
    toast.info('Modo alterado para humano automaticamente')
  }
  qc.invalidateQueries(...)
}
```

**Verificacao:** Enviar mensagem em conversa modo "Bot" → badge muda para "Humano".

---

### 1.4 Prioridade + Labels UI no Header

**Problema:** Sem gerenciamento de prioridade nem labels visuais.

**Solucao:** Dropdown no ChatHeader com 4 niveis de prioridade + toggle de labels.

**Arquivos a modificar:**
- `src/components/inbox/ChatHeader.tsx` — Adicionar dropdown de prioridade + labels toggle
- `src/services/inboxService.ts` — `updateConversation` ja suporta `priority`; adicionar `toggleLabel(conversationId, labelId)`
- `src/hooks/useInbox.ts` — Adicionar `setPriority` e `toggleLabel` mutations
- `src/types/inbox.ts` — Ja tem `ConversationPriority` type

**UI do dropdown de prioridade:**
```
[!] Prioridade
  ( ) Baixa     — cinza
  (o) Normal    — padrao
  ( ) Alta      — laranja
  ( ) Urgente   — vermelho
```

**Labels toggle:** Lista de labels com checkbox colorido. Labels ativas aparecem como dots na ConversationItem.

**Verificacao:** Mudar prioridade → salva via API → conversa re-ordena. Toggle label → dot aparece.

---

### 1.5 Scroll-to-Bottom Button

**Problema:** Quando usuario scrolla para cima, nao consegue voltar rapido ao fim.

**Solucao:** Botao flutuante "↓" que aparece quando scrollado > 200px do fundo.

**Arquivos a modificar:**
- `src/components/inbox/MessageList.tsx` — Adicionar estado `showScrollButton` + botao absoluto

**Implementacao:**
```typescript
const [showScrollBtn, setShowScrollBtn] = useState(false)

// No onScroll do container:
const { scrollTop, scrollHeight, clientHeight } = containerRef.current
setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200)

// Botao:
{showScrollBtn && (
  <button onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
    className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-[var(--wa-panel)] shadow-lg ...">
    <ChevronDown />
  </button>
)}
```

**Verificacao:** Scrollar para cima → botao aparece. Clicar → scroll suave para baixo. Novas mensagens → botao some.

---

### 1.6 Preview com Substituicao Real de Variaveis

**Problema:** TemplatePreview mostra `[Variavel 1]` em vez do nome real do lead.

**Solucao:** Quando leads estao selecionados no Step 2, substituir variaveis no preview com dados do primeiro lead selecionado.

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Componente `TemplatePreview` (linhas ~434-490)

**Implementacao:**
```typescript
// Receber prop: sampleLead?: LeadWithContact
// No body text rendering:
body.text
  .replace('{{1}}', sampleLead?.decisorContact?.name || '[Nome do decisor]')
  .replace('{{2}}', sampleLead?.companyName || '[Empresa]')
  .replace('{{3}}', sampleLead?.segment || '[Segmento]')
  .replace('{{4}}', sampleLead?.city || '[Cidade]')
```

**Verificacao:** Selecionar lead no Step 2 → voltar ao Step 1 → preview mostra dados reais.

---

### 1.7 Cooldown Check (24h) no Precheck

**Problema:** Sistema permite enviar multiplas campanhas ao mesmo contato sem intervalo.

**Solucao:** No Step 2 (selecao de publico), marcar visualmente contatos que receberam mensagem < 24h.

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Step 2, adicionar check contra campanhas recentes
- `src/lib/bilinskizap.ts` — Adicionar `getCampaignHistory(phone)` ou usar dados locais

**Implementacao simplificada:** Usar os dados de `useZapCampaigns` ja carregados. Para cada lead selecionado, verificar se o telefone aparece em campanha com status COMPLETED nas ultimas 24h.

```typescript
const recentCampaigns = campaigns.filter(c =>
  c.status === 'COMPLETED' &&
  new Date(c.completedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
)
// Warning badge: "Recebeu campanha ha Xh"
```

**Verificacao:** Lead que recebeu campanha ontem mostra badge amarelo "Contactado ha 18h". Nao bloqueia, apenas avisa.

---

### 1.8 Timezone no Agendamento

**Problema:** Input `datetime-local` usa hora local sem indicar timezone do destinatario.

**Solucao:** Adicionar seletor de timezone ao lado do datetime input + mostrar hora equivalente no fuso do destinatario.

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Step 1 (linhas ~674), adicionar select de timezone

**Implementacao:**
```
[Agendar para (opcional)]
[____/____/____ __:__] [America/Sao_Paulo ▼]
Destinatarios receberao as 09:00 no horario de Brasilia
```

**Timezones comuns Brasil:** America/Sao_Paulo, America/Manaus, America/Belem, America/Recife

**Verificacao:** Selecionar timezone diferente → texto informativo mostra hora no fuso selecionado.

---

## SPRINT 2 — Template Creator + Inbox Pro

**Objetivo:** Destravar criacao de templates e completar inbox para nivel producao.
**Estimativa:** 7-8 dias uteis
**Dependencias:** Sprint 1 completo

### 2.1 Template Creator UI

**Problema:** Usuarios precisam ir ao Meta Business Suite para criar templates. Maior gap do sistema.

**Backend disponivel:** `POST /api/templates/create` aceita:
```typescript
{
  name: string                    // snake_case, sem espacos
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string                // pt_BR
  components: [
    { type: 'HEADER', format: 'TEXT'|'IMAGE'|'VIDEO'|'DOCUMENT', text?, example? },
    { type: 'BODY', text: string },
    { type: 'FOOTER', text: string },
    { type: 'BUTTONS', buttons: Array<{ type, text, url?, phone_number? }> }
  ]
}
```

**Arquivos a criar:**
- `src/pages/TemplatesPage.tsx` — Pagina com listagem + botao "Criar template"
- `src/components/templates/TemplateEditor.tsx` — Editor visual com preview lado-a-lado
- `src/components/templates/TemplatePreviewLive.tsx` — Preview WhatsApp-style com dados reais
- `src/services/templateService.ts` — CRUD wrapper (create, list, sync, delete, drafts)
- `src/hooks/useTemplates.ts` — React Query hooks

**Arquivos a modificar:**
- `src/App.tsx` — Adicionar rota `/templates`
- `src/components/layout/Sidebar.tsx` — Adicionar nav item "Templates"
- `src/lib/bilinskizap.ts` — Adicionar `createTemplate()`, `deleteTemplate()`, `listDrafts()`, `submitDraft()`

**UI do TemplateEditor:**
```
+----------------------------------------------------+
| [Voltar] Criar Template WhatsApp                    |
+------------------------+---------------------------+
| CONFIGURACAO           | PREVIEW                    |
|                        |                            |
| Nome: [____________]   | +------------------------+ |
| Categoria: [UTILITY ▼] | | 📱 WhatsApp Preview    | |
| Idioma: [pt_BR    ▼]  | |                        | |
|                        | | [Header imagem]        | |
| HEADER (opcional)      | |                        | |
| Tipo: [Texto ▼]       | | Ola {{1}}, seu pedido  | |
| Texto: [___________]  | | {{2}} foi confirmado.  | |
|                        | |                        | |
| BODY (obrigatorio)     | | _V4 Bilinski&Co_       | |
| [____________________] | |                        | |
| [____________________] | | [📞 Ligar] [🔗 Site]  | |
| Variaveis: {{1}} {{2}} | +------------------------+ |
|                        |                            |
| FOOTER (opcional)      | Custo estimado:            |
| [____________________] | UTILITY: ~R$0.15/conversa  |
|                        | Aprovacao: 24-48h          |
| BOTOES (max 10)        |                            |
| [+ Adicionar botao]    |                            |
|                        |                            |
| [Salvar rascunho]      |                            |
| [Enviar para aprovacao]|                            |
+------------------------+---------------------------+
```

**Compliance gate (Shield):** Antes de submeter, rodar validacao automatica:
- Nome snake_case sem caracteres especiais
- Body nao contem palavras proibidas (lista em arsenal/mercado/)
- Marketing template tem mecanismo de opt-out
- Variaveis tem exemplos preenchidos
- Header image/video dentro dos limites de tamanho

**Verificacao:** Criar template → preview mostra resultado → submeter → status PENDING → aguardar aprovacao Meta (24-48h) → status APPROVED aparece na lista.

---

### 2.2 Filtros Avancados no Inbox (12+ criterios)

**Problema:** Inbox so tem busca, status, modo e reply status. Backend suporta 14 filtros.

**Arquivos a criar:**
- `src/components/inbox/InboxFilterPopover.tsx` — Popover com filtros avancados
- `src/components/inbox/ActiveFiltersBar.tsx` — Barra mostrando filtros ativos com X para remover

**Arquivos a modificar:**
- `src/components/inbox/ConversationList.tsx` — Adicionar botao filtro + ActiveFiltersBar
- `src/hooks/useInbox.ts` — Expandir estado de filtros para 14 campos
- `src/services/inboxService.ts` — Expandir `listConversations` com todos os params
- `src/types/inbox.ts` — Expandir `ConversationListParams`

**Filtros a implementar:**

| Filtro | Tipo UI | Param API |
|--------|---------|-----------|
| Status | Toggle (open/closed) | `status` |
| Modo | Toggle (bot/human) | `mode` |
| Label | Multi-select dropdown | `labelId` |
| Reply status | Tabs | `replyStatus` |
| Telefone | Input texto | `phone` |
| Nome contato | Input texto | `contactName` |
| DDD | Input texto | `areaCode` |
| Atendente | Dropdown | `assignedTo` |
| Campanha | Dropdown | `campaignId` |
| Data inicio | Date picker | `createdAfter` |
| Data fim | Date picker | `createdBefore` |
| Tag | Multi-select | `tagIds` |
| Campo custom | Key + Value inputs | `customFieldKey` + `customFieldValue` |

**Verificacao:** Aplicar 3+ filtros → barra mostra chips ativos → lista filtra → limpar chip remove filtro → contadores atualizam.

---

### 2.3 Envio de Template pelo Inbox

**Problema:** Dentro do chat, so envia texto. Para contatos fora da janela 24h, PRECISA enviar template.

**Arquivos a modificar:**
- `src/components/inbox/ChatInput.tsx` — Adicionar botao "Template" que abre seletor
- `src/services/inboxService.ts` — Modificar `sendMessage` para aceitar `message_type: 'template'` + `template_name` + `template_params`

**UI:** Botao ao lado do input que abre drawer com lista de templates aprovados. Selecionar template → preencher variaveis → enviar.

**Verificacao:** Abrir conversa sem janela ativa → clicar Template → selecionar → preencher → enviar → mensagem aparece como template no chat.

---

### 2.4 Envio de Midia no Inbox

**Problema:** So envia texto. Backend suporta image, video, audio, document.

**Arquivos a modificar:**
- `src/components/inbox/ChatInput.tsx` — Adicionar botao paperclip com menu (Imagem, Video, Audio, Documento)
- `src/services/inboxService.ts` — Expandir `sendMessage` para aceitar `media_url`
- `src/lib/bilinskizap.ts` — Adicionar `uploadMedia(file)` se necessario

**Implementacao simplificada (v1):** Aceitar URL de midia (link direto). Upload de arquivo local requer endpoint de media upload no BilinskiZap.

**Verificacao:** Colar URL de imagem → enviar → balao mostra thumbnail. Enviar documento PDF → balao mostra icone + nome.

---

### 2.5 Custom Variable Mapping no Wizard

**Problema:** Variaveis hardcoded: {{1}}=nome, {{2}}=empresa, {{3}}=segmento, {{4}}=cidade.

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Step 3 (personalizacao), tornar mapeamento editavel

**UI:**
```
Personalizacao:
  {{1}} → [Nome do decisor  ▼]  (dropdown: nome, empresa, segmento, cidade, email, cargo, custom)
  {{2}} → [Nome da empresa   ▼]
  {{3}} → [Segmento          ▼]
  {{4}} → [Cidade             ▼]
```

**Verificacao:** Mudar {{1}} para "empresa" → preview atualiza → disparar → mensagem usa empresa no lugar de nome.

---

## SPRINT 3 — Cadencias + Interatividade

**Objetivo:** Automacao multi-step e mensagens interativas WhatsApp.
**Estimativa:** 7-8 dias uteis
**Dependencias:** Sprint 2 completo (Template Creator necessario para cadencias)

### 3.1 Cadencia Multi-Step (D+0, D+1, D+3)

**Problema:** Maior gap funcional. So existe disparo unico (one-shot). Follow-up e manual.

**Arquivos a criar:**
- `src/components/campaigns/CadenceBuilder.tsx` — Editor visual de cadencia
- `src/components/campaigns/CadenceStep.tsx` — Passo individual (template + delay + condicao)
- `src/services/cadenceService.ts` — API wrapper para cadencias (se backend suportar) ou scheduling local

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Adicionar opcao "Cadencia" no wizard ou nova pagina
- `src/types/index.ts` — Tipo `Cadence` com steps, delays, conditions

**Arquitetura da cadencia:**
```
Cadencia "Odontologia D+0/D+1/D+3"
  Step 1 (D+0): Template "ola_consultorio" → Enviar imediatamente
  Step 2 (D+1): Template "followup_consulta" → Enviar apos 24h SE nao respondeu
  Step 3 (D+3): Template "ultima_tentativa" → Enviar apos 72h SE nao respondeu
```

**Backend:** Usar QStash scheduled messages do BilinskiZap. Cada step agenda o proximo via delay.

**UI do CadenceBuilder:**
```
+-- Step 1 ----------------------------------------+
| Template: [ola_consultorio ▼]  Delay: [Imediato] |
+-- Step 2 ----------------------------------------+
| Template: [followup_consulta ▼] Delay: [24h    ] |
| Condicao: [Enviar se NAO respondeu ▼]            |
+-- Step 3 ----------------------------------------+
| Template: [ultima_tentativa ▼]  Delay: [72h    ] |
| Condicao: [Enviar se NAO respondeu ▼]            |
+--------------------------------------------------+
| [+ Adicionar step]                                |
+--------------------------------------------------+
```

**Verificacao:** Criar cadencia 3 steps → disparar → Step 1 envia → apos 24h Step 2 envia para quem nao respondeu → apos 72h Step 3 para restantes.

---

### 3.2 Mensagens Interativas (Botoes, Listas)

**Problema:** Backend suporta buttons (3), lists (10 items), CTA URL. OUTBILI nao expoe.

**Arquivos a criar:**
- `src/components/inbox/InteractiveMessageBuilder.tsx` — Builder de mensagens interativas

**Arquivos a modificar:**
- `src/components/inbox/ChatInput.tsx` — Adicionar botao "+" para tipos de mensagem
- `src/services/inboxService.ts` — Expandir `sendMessage` com `message_type: 'interactive'`
- `src/components/inbox/MessageBubble.tsx` — Renderizar botoes e listas recebidas

**Tipos interativos:**
```
Reply Buttons (max 3):
  [Sim, tenho interesse]
  [Agendar reuniao]
  [Nao, obrigado]

List Message (4-10 items):
  Selecione um servico ▼
  - Consultoria de Marketing
  - Gestao de Trafego
  - Automacao WhatsApp
  - Design e Branding

CTA URL:
  [Acessar proposta →] (link com tracking)
```

**Verificacao:** Enviar reply buttons → contato ve 3 botoes → clicar responde → resposta aparece no chat.

---

### 3.3 Contact Memories/Notas

**Problema:** Sem contexto historico do contato no inbox. Operador nao sabe o historico.

**Arquivos a criar:**
- `src/components/inbox/ContactPanel.tsx` — Painel lateral com info do contato
- `src/components/inbox/ContactNotes.tsx` — Notas internas sobre o contato

**Arquivos a modificar:**
- `src/components/inbox/ChatHeader.tsx` — Adicionar botao "Info" que abre ContactPanel
- `src/pages/InboxPage.tsx` — Adicionar terceiro painel (opcional, colapsavel)

**Conteudo do ContactPanel:**
```
+-- Contato -------------------+
| Avatar + Nome                |
| Telefone: +5511999999999     |
| Email: contato@empresa.com   |
|                              |
| -- Lead Vinculado --         |
| Empresa: Clinica Sorriso     |
| Segmento: Odontologia        |
| Score SPICED: 4.2            |
| Status Pipeline: Qualificado |
|                              |
| -- Notas Internas --         |
| "Interessado em gestao de    |
|  trafego, orcamento R$5k/mes"|
| [+ Adicionar nota]           |
|                              |
| -- Historico Campanhas --    |
| Campanha "Odonto D+0" - Lido |
| Campanha "Re-engage" - Falhou|
+------------------------------+
```

**Verificacao:** Abrir painel → ver dados do lead → adicionar nota → nota persiste entre sessoes.

---

### 3.4 Assignment de Atendente

**Problema:** Conversas nao podem ser distribuidas entre membros do time.

**Arquivos a criar:**
- `src/components/inbox/AttendantsPopover.tsx` — Lista de atendentes com assign

**Arquivos a modificar:**
- `src/components/inbox/ChatHeader.tsx` — Adicionar botao "Atribuir"
- `src/services/inboxService.ts` — Adicionar `assignConversation(id, userId)`
- `src/components/inbox/ConversationItem.tsx` — Mostrar avatar do atendente assignado

**Verificacao:** Assignar conversa → avatar do atendente aparece na lista → filtrar por atendente funciona.

---

## SPRINT 4 — Analytics + Flows

**Objetivo:** Metricas avancadas e integracao WhatsApp Flows.
**Estimativa:** 7-8 dias uteis
**Dependencias:** Sprint 3 completo

### 4.1 Per-Contact Response Tracking

**Problema:** Nao rastreia se contato respondeu. So delivery status (sent/delivered/read).

**Solucao:** Webhook de incoming message marca contato como "respondeu" na campanha.

**Arquivos a criar:**
- Nenhum novo no OUTBILI — depende de mudanca no backend BilinskiZap

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — CampaignDetail: adicionar coluna "Respondeu" nos logs
- `src/pages/ReportsPage.tsx` — Adicionar metricas de response rate

**Metricas novas:**
```
Campaign Detail:
  Enviadas: 150 | Entregues: 142 (95%) | Lidas: 98 (69%) | RESPONDERAM: 23 (16%) | Falhas: 8
```

**Verificacao:** Campanha concluida → ver quantos responderam → filtrar logs por "Respondeu".

---

### 4.2 A/B Testing em Campanhas

**Problema:** Sem forma de testar 2 templates e comparar performance.

**Arquivos a modificar:**
- `src/pages/CampaignsPage.tsx` — Step 1: opcao "A/B Test" com 2 templates
- `src/services/campaignService.ts` (se necessario)

**UI:**
```
[x] Ativar A/B Test
  Variante A: [template_ola_v1 ▼]  — 50%
  Variante B: [template_ola_v2 ▼]  — 50%
  [Ajustar distribuicao: 50/50]
```

**Backend:** Usar `ab-split.ts` do BilinskiZap (ja implementado com SHA-256 deterministico).

**Metricas A/B:**
```
Variante A: 75 enviadas → 68% entrega → 45% leitura
Variante B: 75 enviadas → 72% entrega → 52% leitura ← VENCEDORA
```

**Verificacao:** Criar campanha A/B → disparar → metricas separadas por variante → indicar vencedora.

---

### 4.3 WhatsApp Flows Integration

**Problema:** Backend completo com crypto + handlers + calendar booking. OUTBILI nao expoe nada.

**Arquivos a criar:**
- `src/pages/FlowsPage.tsx` — Listagem de flows + status
- `src/components/flows/FlowBuilder.tsx` — Editor visual de flow screens
- `src/components/flows/FlowPreview.tsx` — Preview mobile do flow
- `src/services/flowService.ts` — CRUD wrapper
- `src/hooks/useFlows.ts` — React Query hooks

**Arquivos a modificar:**
- `src/App.tsx` — Rota `/flows`
- `src/components/layout/Sidebar.tsx` — Nav item "Flows"
- `src/lib/bilinskizap.ts` — Adicionar flow API methods

**Endpoints disponveis:**
```
GET    /api/flows              — Listar flows
POST   /api/flows              — Criar flow
GET    /api/flows/{id}         — Detalhes
PATCH  /api/flows/{id}         — Atualizar
POST   /api/flows/send         — Enviar flow message
GET    /api/flows/submissions   — Listar submissions (dados coletados)
GET    /api/flows/endpoint/keys — Gerenciar chaves RSA
POST   /api/flows/endpoint/test — Testar endpoint
```

**Tipos de flow implementados no backend:**
- **Calendar Booking** — Selecao de servico + data + horario + confirmacao
- **Lead Qualification** — Formulario multi-step com dados da empresa
- **Appointment Scheduling** — Integracao Google Calendar

**Verificacao:** Criar flow → preview no mobile → enviar para contato → contato preenche → dados aparecem em submissions.

---

### 4.4 Reactions no Inbox

**Problema:** Backend suporta envio de reactions (emoji). OUTBILI nao expoe.

**Arquivos a modificar:**
- `src/components/inbox/MessageBubble.tsx` — Adicionar hover action para reagir (emoji picker simples)
- `src/services/inboxService.ts` — Adicionar `sendReaction(conversationId, messageId, emoji)`

**UI:** Hover sobre balao → icone emoji aparece → clicar abre picker com 6 emojis comuns (👍❤️😂😢🙏🔥) → clicar envia reaction.

**Verificacao:** Reagir com 👍 → emoji aparece abaixo do balao → contato ve a reacao no WhatsApp.

---

### 4.5 Campaign ROI Analytics

**Problema:** Sem visao de custo vs. retorno das campanhas.

**Arquivos a modificar:**
- `src/pages/ReportsPage.tsx` — Adicionar card de ROI

**Metricas:**
```
Custo Total: R$ 48,00 (150 msgs x R$0.32 Marketing)
Respostas: 23 (15.3%)
Reunioes Agendadas: 5 (de leads que responderam)
Custo por Resposta: R$ 2,09
Custo por Reuniao: R$ 9,60
```

**Verificacao:** Ver ReportsPage → card ROI mostra custos estimados e taxas de conversao.

---

## Resumo de Arquivos por Sprint

### Sprint 1 (Modificar 6 existentes)
| Arquivo | Modificacao |
|---------|-------------|
| `components/inbox/ConversationList.tsx` | Reply status tabs |
| `components/inbox/ChatHeader.tsx` | Close/reopen + prioridade + labels |
| `components/inbox/MessageList.tsx` | Scroll-to-bottom button |
| `hooks/useInbox.ts` | Auto-switch + close/reopen + priority mutations |
| `services/inboxService.ts` | closeConversation, reopenConversation |
| `pages/CampaignsPage.tsx` | Preview com dados reais + cooldown + timezone |

### Sprint 2 (Criar 5 novos + Modificar 7)
| Novo | Modificar |
|------|-----------|
| `pages/TemplatesPage.tsx` | `App.tsx` (rota) |
| `components/templates/TemplateEditor.tsx` | `Sidebar.tsx` (nav) |
| `components/templates/TemplatePreviewLive.tsx` | `lib/bilinskizap.ts` (template CRUD) |
| `services/templateService.ts` | `components/inbox/ChatInput.tsx` (template + media) |
| `hooks/useTemplates.ts` | `services/inboxService.ts` (expanded send) |
| | `hooks/useInbox.ts` (expanded filters) |
| | `pages/CampaignsPage.tsx` (variable mapping) |

### Sprint 3 (Criar 5 novos + Modificar 5)
| Novo | Modificar |
|------|-----------|
| `components/campaigns/CadenceBuilder.tsx` | `pages/CampaignsPage.tsx` (cadencia) |
| `components/campaigns/CadenceStep.tsx` | `components/inbox/ChatInput.tsx` (interactive) |
| `components/inbox/InteractiveMessageBuilder.tsx` | `components/inbox/MessageBubble.tsx` (botoes) |
| `components/inbox/ContactPanel.tsx` | `components/inbox/ChatHeader.tsx` (info + assign) |
| `components/inbox/AttendantsPopover.tsx` | `pages/InboxPage.tsx` (3o painel) |

### Sprint 4 (Criar 5 novos + Modificar 5)
| Novo | Modificar |
|------|-----------|
| `pages/FlowsPage.tsx` | `App.tsx` (rota flows) |
| `components/flows/FlowBuilder.tsx` | `Sidebar.tsx` (nav) |
| `components/flows/FlowPreview.tsx` | `pages/CampaignsPage.tsx` (A/B test) |
| `services/flowService.ts` | `pages/ReportsPage.tsx` (ROI + response) |
| `hooks/useFlows.ts` | `components/inbox/MessageBubble.tsx` (reactions) |

---

## Criterios de Verificacao por Sprint

### Sprint 1 — Checklist
- [ ] Reply status tabs filtram conversas por replied/unreplied
- [ ] Close conversa remove da lista ativa
- [ ] Reopen conversa traz de volta
- [ ] Enviar mensagem em modo Bot → auto-switch para Humano
- [ ] Prioridade salva e re-ordena lista
- [ ] Labels toggleaveis com dots visuais
- [ ] Scroll-to-bottom aparece ao scrollar e funciona
- [ ] Preview mostra nome/empresa do lead selecionado
- [ ] Warning de cooldown aparece para contatos recentes
- [ ] Timezone selecionavel no agendamento
- [ ] TypeScript: zero erros
- [ ] Build: npm run build passa

### Sprint 2 — Checklist
- [ ] Template Creator: criar template com header/body/footer/botoes
- [ ] Template submetido aparece como PENDING na lista
- [ ] Template aprovado aparece no seletor de campanhas
- [ ] Filtros avancados: 12+ criterios funcionais
- [ ] Active filters bar mostra chips removiveis
- [ ] Template enviavel pelo inbox chat
- [ ] URL de midia enviavel pelo inbox
- [ ] Variable mapping customizavel no wizard

### Sprint 3 — Checklist
- [ ] Cadencia 3 steps criavel e disparavel
- [ ] Steps subsequentes respeitam condicao "se nao respondeu"
- [ ] Reply buttons enviaveis pelo inbox
- [ ] List message enviavel pelo inbox
- [ ] Contact panel mostra dados do lead vinculado
- [ ] Notas internas persistem
- [ ] Assignment de atendente funcional

### Sprint 4 — Checklist
- [ ] Response rate visivel por campanha
- [ ] A/B test cria 2 variantes com metricas separadas
- [ ] Flows page lista flows do BilinskiZap
- [ ] Flow enviavel para contato pelo inbox
- [ ] Reactions enviaveis (6 emojis)
- [ ] ROI card no Reports com custo/resposta/reuniao

---

## Dependencias Externas

| Dependencia | Sprint | Risco |
|-------------|--------|-------|
| Template approval Meta (24-48h) | Sprint 2 | Medio — testar com templates ja aprovados |
| QStash scheduling para cadencias | Sprint 3 | Baixo — ja implementado no BilinskiZap |
| Mem0 API para contact memories | Sprint 3 | Medio — verificar se BilinskiZap expoe endpoint |
| Google Calendar para flows | Sprint 4 | Baixo — ja integrado no BilinskiZap |
| Media upload endpoint | Sprint 2 | Medio — pode nao existir no BilinskiZap |

---

**Pronto para implementacao imediata. Sprint 1 pode comecar agora.**

— Zap, sempre integrando com precisao 📱
