# OUTBILI — Gap Analysis Completo

> Análise cruzada: Sistema ao vivo + Código-fonte + Benchmarking de 13 plataformas CRM
> Foco: Jornada do usuário end-to-end e experiencia dentro do sistema

**Data:** 2026-03-27 | **Executado por:** Atlas (CRM Master) + Orion (AIOX Master)
**Sistema:** https://v4bilinski.github.io/outbili/
**Metodologia:** Benchmarking matrix (Pipedrive, HubSpot, Salesforce, ClickUp, Monday, Ekyte, Kommo, Pipefy, Bitrix24, RD Station, Asana, Trello, Notion)

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Bugs Críticos (P0)](#2-bugs-críticos-p0)
3. [Gaps Graves de UX (P1)](#3-gaps-graves-de-ux-p1)
4. [Gaps de Jornada por Fase](#4-gaps-de-jornada-por-fase)
5. [Benchmarking: O Que Falta vs Melhores do Mercado](#5-benchmarking-o-que-falta-vs-melhores-do-mercado)
6. [Código Órfão: Features Construídas Mas Nunca Expostas](#6-código-órfão-features-construidas-mas-nunca-expostas)
7. [Matriz de Prioridade (Impacto x Esforco)](#7-matriz-de-prioridade-impacto-x-esforco)
8. [Roadmap de Correção Sugerido](#8-roadmap-de-correcao-sugerido)

---

## 1. Resumo Executivo

### Score Geral do Sistema

| Dimensão | Score | Classificação |
|----------|-------|---------------|
| Funcionalidade Core | 7/10 | Bom — fluxo Search→Qualify→Prospect funciona |
| UX / Experiência | 6/10 | Melhorado — copy audit concluído, tooltips, micro-narrativas, consistência pt-BR |
| Pipeline Management | 5/10 | Parcial — drag-and-drop implementado (@dnd-kit), busca por texto funciona |
| Campanhas WhatsApp | 2/10 | Quebrado — disparo vai para número placeholder |
| Analytics / Reports | 7/10 | Bom — métricas com benchmarks, fórmulas explícitas, recomendações condicionais, filtro por período, export CSV |
| Mobile Experience | 4/10 | Crítico — página Reports inacessível, filtros limitados |
| Enriquecimento | 8/10 | Bom — CNPJa + Assertiva + re-enrichment batch + fix 422/rfPhone/Assertiva (2026-04-14) |
| Automação | 3/10 | Básico — n8n funciona mas cadência multi-step não existe |
| Pos-Venda / CS | 0/10 | Inexistente — sem health score, NPS, churn prevention |

### Veredicto

O OUTBILI tem uma **base sólida de discovery e qualificação** (SearchPage + SPICED + 7 tabs de inteligência), mas **quebra na hora de executar** (campanhas com número fake, status de lead imutável, cadência single-shot). A jornada do usuário tem **3 dead ends críticos** que impedem o fluxo natural de trabalho.

---

## 2. Bugs Críticos (P0)

Estes são bugs que **quebram funcionalidade core**. Devem ser corrigidos antes de qualquer melhoria.

### P0-RESOLVED (2026-04-14): 4 bugs críticos no pipeline PESCA corrigidos

| Bug | Causa raiz | Fix |
|-----|-----------|-----|
| **422 Airtable em Contacts** | Campo `phone` NAO existe na tabela Contacts. 147 de 149 contacts falhavam silenciosamente | Removido `phone` do Contact create. Telefone vai para `whatsapp` |
| **rfPhone ignorava celular** | `savePescaToAirtable` enviava `rfPhone: lead.phone` (fixo), ignorando `lead.whatsapp` (celular) | Agora `rfPhone: lead.whatsapp \|\| lead.phone` |
| **Assertiva não atualizava rfPhone** | WhatsApp validado ia para `assertivaPhoneValidated` (campo tecnico) mas NAO para `rfPhone` (campo visivel nos cards) | `enrichBatchWithAssertiva` agora atualiza `rfPhone` com WhatsApp validado |
| **Contact Assertiva com campos inexistentes** | `assertivaPhoneValidated`, `assertivaWhatsappValidated` não existem em Contacts — causavam 422 silencioso | Substituídos por `whatsappConfirmed`, `phoneIsHot` |

### P0-RESOLVED (2026-04-14): Bug prioridade employees

Assertiva `_quantidadeFuncionarios` (dado real RAIS/CAGED) era ignorado quando CNPJa ja tinha setado estimate (5/30/100 por porte). Fix: Assertiva SEMPRE sobrescreve.

---

### P0-1: Campanhas WhatsApp disparam para número placeholder

**Arquivo:** `src/pages/CampaignsPage.tsx` (linha ~181)
```typescript
phone: '5511999999999', // Placeholder - needs real decisor WhatsApp
```

**Impacto:** TODAS as campanhas WhatsApp enviam mensagens para um número falso. O usuário cria campanha, seleciona leads, confirma envio — e nada chega ao destinatario real. O número real do decisor (tabela Contacts) nunca e resolvido.

**Correção:** Resolver o WhatsApp do decisor principal de cada lead via `contactService` antes do dispatch.

---

### P0-2: Botao "Agendar reuniao" no Dashboard e no-op

**Arquivo:** `src/pages/DashboardPage.tsx`
```typescript
onClick: () => {}  // No-op
```

**Impacto:** O Dashboard mostra 4 acoes rapidas. "Agendar reuniao" e a mais importante para conversão — e não faz nada. Sem feedback, sem toast, sem redirect. O usuário clica e nada acontece. Isso gera desconfianca com o sistema inteiro.

**Correção:** Redirecionar para CompanyPage do lead HOT prioritario, ou abrir modal de agendamento.

---

### P0-3: Botao "Ver leads" usa hack de navegação

**Arquivo:** `src/pages/SearchPage.tsx` (linha ~507)
```typescript
onClick={() => window.location.hash = '#/leads'}
```

**Impacto:** Usa manipulacao direta de hash ao inves de `useNavigate()`. Em React Router, isso pode causar reload completo da SPA, perda de estado, ou navegação incorreta.

**Correção:** Substituir por `navigate('/leads')` do React Router.

---

### ~~P0-4: 422 Airtable — campo `phone` inexistente na tabela Contacts~~ RESOLVIDO (2026-04-14)

**O que acontecia:** O PESCA tentava salvar campo `phone` na tabela Contacts, mas esse campo NAO existe (apenas `whatsapp`). Isso causava 147 erros 422 silenciosos — leads eram criados mas contatos falhavam sem aviso.

**Fix:** Removido campo `phone` do payload de criacao de Contact. ROOT CAUSE de falhas silenciosas na pipeline.

---

### ~~P0-5: rfPhone vazio — preferencia errada de telefone~~ RESOLVIDO (2026-04-14)

**O que acontecia:** rfPhone do Lead salvava apenas telefone fixo, ignorando celular/WhatsApp. Assertiva encontrava WhatsApp validado mas salvava em `assertivaPhoneValidated` (campo que não existe em Contacts), ficando invisivel nos cards.

**Fix:** rfPhone agora salva `whatsapp || phone` (preferencia celular). Assertiva atualiza rfPhone no Lead quando encontra WhatsApp validado. Contacts usa `whatsappConfirmed`/`phoneIsHot` (campos reais da tabela).

---

### ~~P0-6: Assertiva campos invalidos em Contacts~~ RESOLVIDO (2026-04-14)

**O que acontecia:** Código tentava salvar `assertivaPhoneValidated`/`assertivaWhatsappValidated` na tabela Contacts, mas esses campos NAO existem. Substituídos por `whatsappConfirmed` (checkbox) e `phoneIsHot` (checkbox) que são os campos reais.

---

## 3. Gaps Graves de UX (P1)

### P1-1: Não e possivel mudar status do lead na CompanyPage

**O que acontece:** O usuário abre a ficha completa do lead (7 tabs de inteligência), decide que o lead e qualificado e quer mover para "Contactado" — mas não existe nenhum controle para isso. O status aparece como badge read-only no header.

**Benchmarking:**
- Pipedrive: Dropdown inline no deal card, drag-and-drop no kanban
- HubSpot: Lifecycle stage selector no contact record

**Impacto:** O pipeline inteiro fica estagnado. Leads entram como "Novo" e ficam "Novo" para sempre a menos que o usuário edite diretamente no Airtable.

**Correção:** Adicionar dropdown de status + temperatura no header da CompanyPage.

---

### P1-2: Mobile não tem acesso a página Reports

**O que acontece:** O `BottomNav` mobile tem 5 itens: Home, Busca, Leads, Camp., Config. "Relatorios" foi trocado por "Config". Um usuário mobile nunca consegue acessar analytics de funil.

**Sidebar (desktop):** Dashboard, Pesquisa, Leads, Campanhas, **Relatorios**, Settings
**BottomNav (mobile):** Dashboard, Pesquisa, Leads, Campanhas, **Config** (Settings)

**Correção:** Trocar "Config" por "Relatorios" no BottomNav, mover Settings para hamburger menu ou acessivel via Dashboard.

---

### ~~P1-3: Não existe busca por texto no LeadsPage~~ RESOLVIDO

**Status:** RESOLVIDO — Search bar implementada no LeadsPage, filtra por companyName e tradeName.

---

### ~~P1-4: Kanban sem drag-and-drop~~ RESOLVIDO

**Status:** RESOLVIDO — Drag-and-drop implementado com @dnd-kit + PATCH status no Airtable ao soltar. Stage gates com checklists por etapa.

---

### ~~P1-5: CNPJ coletado mas silenciosamente descartado~~ RESOLVIDO

**Status:** RESOLVIDO — Cadastro manual agora usa CNPJa para enriquecimento automatico por CNPJ. Nome real da empresa vem do CNPJa, CNPJ salvo corretamente no Airtable.

---

### P1-6: Sem preview de template antes de enviar campanha

**O que acontece:** O wizard de campanha pede para selecionar um template de um `<select>` dropdown por nome. O usuário não ve o corpo da mensagem, variaveis de merge, ou como o lead vai receber. Envia no escuro.

**Benchmarking:**
- Kommo: Preview com merge tags resolvidos
- HubSpot: Template editor + preview mobile

**Correção:** Renderizar preview do template selecionado com merge tags de exemplo.

---

### ~~P1-7: Sidebar collapse não persiste~~ RESOLVIDO

**Status:** RESOLVIDO — Estado da sidebar persistido em localStorage.

---

## 4. Gaps de Jornada por Fase

### Fase 1: Descoberta (SearchPage)

| O que funciona | O que falta |
|----------------|-------------|
| TagInput com sugestoes por segmento | Validacao cruzada min/max revenue (pode setar min > max) |
| Estados com recomendados separados | Campo de CNPJ descartado silenciosamente (P1-5) |
| Mensagens rotativas durante busca | Sem cancelar busca em andamento |
| Historico de buscas (localStorage) | Historico mostra 5 mas guarda 10 — sem "ver mais" |
| Modo massa vs especifico | Leads importados não aparecem no historico |
| | `getDaySegment()` existe mas não sugere segmento do dia |
| | SubSegmentos definidos mas nunca expostos como filtro |

### Fase 2: Qualificacao (LeadsPage)

| O que funciona | O que falta |
|----------------|-------------|
| Tabela + Kanban toggle | Sem busca por texto / nome (P1-3) |
| 3 filtros (segmento, temp, status) | Sem filtro por score range |
| Empty state com CTA para Search | Sem filtro por Trava (T1-T8) |
| Badge de contagem no Kanban | Kanban sem drag-and-drop (P1-4) |
| | Filtros resetam ao navegar e voltar |
| | Sem ordenação por coluna na tabela |
| | "Perdido" oculto no Kanban sem explicação |
| | Sem "limpar todos os filtros" |

### Fase 3: Análise do Lead (CompanyPage)

| O que funciona | O que falta |
|----------------|-------------|
| 7-8 tabs de inteligência completas | Sem controle de status/temperatura (P1-1) |
| Formulario inline de contato | Sem navegação prev/next entre leads |
| Back button | Back usa `navigate(-1)` — falha em deep links |
| Score SPICED detalhado | Sem breadcrumb (Leads > Clinica X) |
| | Tab state não persiste ao voltar |
| | Sem botao "Iniciar cadência" direto do lead |
| | Sem toast ao criar contato |
| | Links sociais duplicados (header + Resumo) |

### Fase 4: Prospecao WhatsApp (CampaignsPage)

| O que funciona | O que falta |
|----------------|-------------|
| Wizard de 3 etapas claro | Numero de WhatsApp PLACEHOLDER (P0-1) |
| Step indicator animado | Sem preview de template (P1-6) |
| Banner de alerta pre-envio | Sem validação de telefone por lead |
| Metricas de entrega no detalhe | Sem duplicar campanha |
| | Sem editar rascunho |
| | Sem refresh real-time durante envio |
| | Sem cadência multi-step (CADENCE_DEFAULT_DAYS órfão) |
| | Detalhe inline sem URL — back/forward quebrado |

### Fase 5: Acompanhamento (Dashboard + Reports)

| O que funciona | O que falta |
|----------------|-------------|
| 4 KPI cards com animacao | KPIs não clicaveis (sem drill-down) |
| NextActions prioriza HOT | Sem KPI de tendencia (delta, seta up/down) |
| Pipeline chart (Recharts) | Barras não clicaveis (sem filtrar por status) |
| Funil de conversão no Reports | Sem filtro de período/data (P2) |
| Recomendacoes estrategicas condicionais | Sem export PDF/CSV (P2) |
| | Sem métrica de tempo-de-ciclo |
| | Sem comparativo por campanha WhatsApp |
| | Reports inacessível no mobile (P1-2) |

### Fase 6: Pos-Venda / Customer Success

| O que funciona | O que falta |
|----------------|-------------|
| (nada implementado) | Health Score pos-venda |
| | NPS automatizado |
| | Alertas de churn |
| | Playbooks de retenção |
| | Pipeline de Upsell/Expansao |
| | Pipeline de Renewal |
| | Deal-to-Squad bridge |

---

## 5. Benchmarking: O Que Falta vs Melhores do Mercado

### Matriz Comparativa

| Funcionalidade | Benchmark | OUTBILI Tem? | Gap |
|---------------|-----------|-------------|-----|
| **Pipeline drag-and-drop** | Pipedrive | Sim | @dnd-kit implementado |
| **Rotting indicators** (deals estagnados) | Pipedrive | Não | Sem alerta de inatividade |
| **Activity-based selling** (prox acao) | Pipedrive | Parcial | NextActions no Dashboard, mas sem no CompanyPage |
| **Pipeline velocity** | Pipedrive | Não | Sem métrica de velocidade do funil |
| **Probabilidade por estagio** | Pipedrive | Não | Sem weighted pipeline value |
| **Health Score** pos-venda | HubSpot | Não | Zero CS no sistema |
| **NPS automatizado** | HubSpot | Não | Sem surveys |
| **Workflow builder** visual | HubSpot | Não | n8n cobre backend, sem UI |
| **CS Workspace** | HubSpot | Não | Sem area dedicada a CS |
| **Revenue forecasting** | Salesforce | Não | Sem forecast, apenas pipeline value simples |
| **Cross-entity reporting** | Salesforce | Não | Reports single-entity (leads only) |
| **Win/Loss analysis** | Salesforce | Não | "Perdido" some do Kanban sem análise |
| **Deal-to-Project bridge** | Monday.com | Não | Sem fluxo pos-fechamento |
| **Workload view** | ClickUp | Não | Sem gestao de capacidade |
| **WhatsApp como CRM** | Kommo | Parcial | Disparo existe mas sem CRM conversacional |
| **Salesbot qualificação** | Kommo/Pipefy | Não | Sem AI agent para pre-vendas |
| **ROI por cliente** | Ekyte | Não | Sem financeiro |
| **Producao de agencia** | Ekyte | Não | Sem gestao de demandas |
| **Template editor** | HubSpot | Não | Templates read-only, sem preview |
| **Global search** | Pipedrive | Sim | Search bar no LeadsPage |
| **Cadencia multi-step** | HubSpot/Kommo | Não | Constante definida mas não implementada |
| **Export PDF/CSV** | Todos | Não | Reports sem export |
| **Filtro por período** | Todos | Não | Tudo e all-time |

### O Que o OUTBILI Faz Melhor Que Muitos CRMs

| Diferencial | Descricao |
|-------------|-----------|
| SPICED scoring nativo | Framework de qualificação avançado com 5 dimensões ponderadas — a maioria dos CRMs tem lead scoring genérico |
| 8 Travas Hipotéticas | Framework de diagnóstico de negócios único (T1-T8) — nenhum CRM tem isso |
| Inteligencia de reuniao | Tab Reuniao com roteiro de 5 blocos + sinais positivos/negativos — não existe em nenhum CRM |
| Projeção de receita por lead | 3 cenários (agressivo/moderado/conservador) com timeline — único |
| Vulnerabilidades de marketing | 8 cards de fraquezas com impacto financeiro — análise que CRMs não fazem |
| Argumentos de venda contextualizados | Objeções previstas com contra-argumentos e ROI — CRMs não geram isso |
| Enrichment automatico | CNPJa + Assertiva = dados cadastrais, telefones validados que CRMs manuais não tem |

---

## 6. Código Órfão: Features Construídas Mas Nunca Expostas

Estas features **ja existem no código** mas não aparecem em nenhuma interface:

| Constante / Funcao | Arquivo | O que faz | Como expor |
|---------------------|---------|-----------|-----------|
| `CADENCE_DEFAULT_DAYS` = [0,3,7,10,14] | `constants.ts` | Define cadência D+0, D+3, D+7, D+10, D+14 | Implementar wizard de cadência multi-step no CampaignsPage |
| `getDaySegment()` | `constants.ts` | Retorna segmento do dia (Seg=Estetica, Ter=Odonto...) | Mostrar banner "Segmento do dia: Estetica" no Dashboard e SearchPage |
| `SEGMENTS[].subSegments` | `constants.ts` | Sub-segmentos (Odonto → Ortodontia, Implantes...) | Usar como filtro secundario ou sugestao de keywords na busca |
| `TRAPS` (T1-T8) como filtro | `constants.ts` | 8 tipos de trava hipotetica | Adicionar filtro "Trava" no LeadsPage |
| `eligibilityChecklist` | `types/index.ts` | Checklist de eligibilidade do lead | Renderizar no CompanyPage como pre-requisito para qualificação |
| `discoveryQuestions` | `types/index.ts` | Perguntas de descoberta geradas por AI | Ja aparecem na TabReuniao, mas poderiam ter destaque proprio |

---

## 7. Matriz de Prioridade (Impacto x Esforco)

```
                        IMPACTO ALTO
                            │
     ┌──────────────────────┼──────────────────────┐
     │                      │                      │
     │  QUICK WINS          │   BIG BETS           │
     │  (fazer primeiro)    │   (planejar sprint)  │
     │                      │                      │
     │  P0-1 Fix phone      │   P1-4 Drag-n-drop   │
     │  P0-2 Fix agendar    │   Cadencia multi-step │
     │  P0-3 Fix navigate   │   Health Score CS     │
     │  P1-1 Status dropdown│   Filtro por período  │
     │  P1-2 Mobile reports │   Export PDF/CSV      │
     │  P1-3 Text search    │   Pipeline velocity   │
     │  P1-5 Fix CNPJ       │   Win/Loss analysis   │
     │  P1-7 Persist sidebar│                      │
     │  Expor getDaySegment │                      │
ESFORCO                     │                      ESFORCO
BAIXO ──────────────────────┼────────────────────── ALTO
     │                      │                      │
     │  FILL INS            │   STRATEGIC          │
     │  (quando sobrar)     │   (v2.0)             │
     │                      │                      │
     │  Filtro por trava    │   CRM conversacional  │
     │  SubSegmentos        │   CS Workspace        │
     │  Prev/next leads     │   Revenue forecasting │
     │  Breadcrumbs         │   Deal-to-Squad       │
     │  Toast confirmacoes  │   Workflow builder     │
     │  Links sociais dedup │   AI salesbot          │
     │                      │   ROI por cliente     │
     │                      │                      │
     └──────────────────────┼──────────────────────┘
                            │
                        IMPACTO BAIXO
```

---

## 8. Roadmap de Correção Sugerido

### Sprint 1: Desbloqueio (P0 + Quick Wins)

**Meta:** Sistema funcional sem dead ends.

| # | Item | Tipo | Esforco | Status |
|---|------|------|---------|--------|
| 1 | Fix placeholder phone no CampaignsPage | Bug P0 | 2h | Pendente |
| 2 | Fix botao "Agendar reuniao" no Dashboard | Bug P0 | 1h | Pendente |
| 3 | Fix navegação "Ver leads" no SearchPage | Bug P0 | 15min | Pendente |
| 4 | ~~Fix CNPJ descartado no SearchPage~~ | Bug P1 | 30min | DONE |
| 5 | ~~Adicionar dropdown status/temp no CompanyPage~~ | Feature P1 | 3h | DONE |
| 6 | ~~Adicionar Reports no BottomNav mobile~~ | Fix P1 | 1h | DONE |
| 7 | ~~Adicionar text search no LeadsPage~~ | Feature P1 | 2h | DONE |
| 8 | ~~Persistir sidebar collapse em localStorage~~ | Fix P1 | 30min | DONE |
| 9 | Expor getDaySegment() como banner no Dashboard | Feature | 1h | Pendente |
| 10 | Adicionar filtro por Trava (T1-T8) no LeadsPage | Feature | 1h | Pendente |
| 11 | ~~Fix 422 Airtable — phone em Contacts~~ | Bug P0 | 1h | DONE |
| 12 | ~~Fix rfPhone preferencia celular~~ | Bug P0 | 1h | DONE |
| 13 | ~~Fix Assertiva campos invalidos Contacts~~ | Bug P0 | 1h | DONE |

**Total estimado: ~12h | Concluido: ~8h**

### Sprint 2: Pipeline Funcional

**Meta:** Usuario consegue mover leads pelo funil e acompanhar progresso.

| # | Item | Esforco |
|---|------|---------|
| 1 | Kanban drag-and-drop com PATCH de status | 8h |
| 2 | Preview de template no wizard de campanha | 4h |
| 3 | Filtro por período (data) no ReportsPage | 6h |
| 4 | KPI cards clicaveis (drill-down para leads filtrados) | 3h |
| 5 | Barras do pipeline chart clicaveis | 2h |
| 6 | Navegacao prev/next entre leads no CompanyPage | 3h |
| 7 | Breadcrumbs (Leads > Nome da Empresa) | 2h |
| 8 | Rotting indicators (leads sem atividade > 7 dias) | 4h |

**Total estimado: ~32h**

### Sprint 3: Campanhas Reais

**Meta:** Cadencias WhatsApp multi-step funcionando.

| # | Item | Esforco |
|---|------|---------|
| 1 | Wizard de cadência multi-step (usar CADENCE_DEFAULT_DAYS) | 12h |
| 2 | Validacao de telefone por lead antes do envio | 4h |
| 3 | Refresh real-time de métricas durante envio | 4h |
| 4 | Duplicar campanha | 2h |
| 5 | Editar rascunho de campanha | 4h |
| 6 | Export de relatorios (PDF/CSV) | 8h |

**Total estimado: ~34h**

### Sprint 4: Customer Success (v2.0)

**Meta:** Ciclo pos-venda com health score e retenção.

| # | Item | Esforco |
|---|------|---------|
| 1 | Health Score Formula (baseado no squad-crm) | 16h |
| 2 | Pipeline de Upsell/Expansao | 12h |
| 3 | Pipeline de Renewal | 8h |
| 4 | Alertas de churn automaticos | 8h |
| 5 | NPS automatizado em milestones | 12h |
| 6 | Win/Loss analysis para deals perdidos | 8h |

**Total estimado: ~64h**

---

## Apêndice A: Checklist de Validacao Pos-Fix

Usar apos cada sprint para validar correcoes:

### Sprint 1 Validation

- [ ] Campanha WhatsApp chega no número real do decisor
- [ ] Botao "Agendar reuniao" redireciona corretamente
- [ ] "Ver leads" usa React Router sem reload
- [ ] CNPJ salvo no Airtable ao criar lead especifico
- [x] Status/temperatura editável na CompanyPage (pipeline drag-and-drop implementado)
- [x] Reports acessível no mobile via BottomNav (implementado)
- [x] Busca por texto funciona no LeadsPage (implementado)
- [x] Sidebar lembra estado colapsado (implementado)
- [ ] Banner "Segmento do dia" aparece no Dashboard
- [ ] Filtro por Trava disponivel no LeadsPage

### Sprint 2 Validation

- [x] Drag-and-drop no Kanban atualiza status no Airtable (implementado com stage gates)
- [ ] Preview de template mostra corpo da mensagem
- [x] Filtro de data funciona no Reports (7d, 30d, 90d, Tudo)
- [ ] Click em KPI card navega para leads filtrados
- [ ] Click em barra do pipeline filtra por status
- [ ] Prev/Next funciona entre leads
- [x] Breadcrumb mostra hierarquia Leads > Empresa (implementado)

---

## Apêndice B: Arquivos Impactados por Correção

| Fix | Arquivo(s) |
|-----|-----------|
| P0-1 Phone | `src/pages/CampaignsPage.tsx`, `src/services/contactService.ts` |
| P0-2 Agendar | `src/pages/DashboardPage.tsx` |
| P0-3 Navigate | `src/pages/SearchPage.tsx` |
| P1-1 Status | `src/pages/CompanyPage.tsx`, `src/services/leadService.ts` |
| P1-2 Mobile | `src/components/layout/BottomNav.tsx` |
| P1-3 Search | `src/pages/LeadsPage.tsx` |
| P1-4 DnD | `src/pages/LeadsPage.tsx`, `package.json` (@dnd-kit) |
| P1-5 CNPJ | `src/pages/SearchPage.tsx` |
| P1-6 Preview | `src/pages/CampaignsPage.tsx` |
| P1-7 Sidebar | `src/components/layout/Sidebar.tsx` |
| Day Segment | `src/pages/DashboardPage.tsx`, `src/lib/constants.ts` |
| Trap Filter | `src/pages/LeadsPage.tsx` |

---

*Gap Analysis executado por Atlas (CRM Master) + Orion (AIOX Master) — 2026-03-27*
*Benchmarking: 13 plataformas | Código: 30+ arquivos analisados | Live: v4bilinski.github.io/outbili*


---

## Apêndice C: Auditoria Copy Squad (2026-04-14)

Auditoria completa de comunicação visual executada em 4 fases:

| Fase | Foco | Commits |
|------|------|---------|
| 1 | Quick Wins: inconsistências terminológicas, labels genéricos → específicos |  |
| 2 | Storytelling de dados: micro-narrativas, benchmarks, curiosity messages |  |
| 3 | Qualificação e educação: tooltips, pt-BR completo, celebrations |  |
| 4 | Polish final: erros orientados, consistência total |  |

**Score Hopkins:** 72/100 → 84/100

**Skill de referência:**  — usar para criar ou revisar copys do sistema.

**Padrões aplicados:**
- Terminologia unificada (Lead=masc, Campanha=fem, Website, Mensagens)
- Storytelling de dados (números com contexto, taxas com benchmark)
- Tooltips educativos (SPICED, Tier, WTP, Trava)
- Mensagens de erro orientadas a ação
- Enrichment status legível ("Enriquecido", "Processando...", "Dados completos")
