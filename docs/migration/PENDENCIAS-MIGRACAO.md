# Pendências, Gaps e Bugs — Migração Airtable → Supabase

> **Registro vivo e completo** de tudo que foi extraído de campos vagos, todo bug
> encontrado e toda decisão de mapeamento que precisa de revisão humana.
> **Regra:** nada aqui bloqueia o ETL. Tudo é resolvido **após** a W2-08 (migração 100% validada).
> **Epic:** `EPIC-airtable-to-supabase-migration` · **Aberto:** 2026-05-19 · **Última atualização:** 2026-05-19

**Legenda de severidade:** 🔴 Bug (quebra funcionalidade) · 🟡 Gap (dado ausente/incompleto) · 🔵 Decisão (mapeamento a revisar)

---

## 1. 🔴 Bugs do schema W1

### BUG-01 — Foreign tables FDW mal declaradas
As 12 foreign tables `airtable_fdw.*` foram criadas com **todos os campos `text`** e a coluna de
record id nomeada `airtable_id`. O wrapper Airtable: (a) não converte número JSON → `text`
(erro `data type not match`); (b) só popula o record id numa coluna chamada `id`.
**Impacto:** sem correção, nenhum campo numérico é legível e a chave de migração vem `NULL`.
**Estado:** corrigida sob demanda por wave — ✅ `leads`, `contacts`, `partners`, `users`.
Pendente recriar: `activity_log`, `activities`, `enrichment_log`, `pipeline_events`, `campaigns`, `segments`, `trademarks`, `messages`.
**Ação pós-migração:** nenhuma — as foreign tables serão dropadas na Story 021 (W3). Registro só do motivo do retrabalho.

### BUG-02 — `handle_new_user()` / `sync_profile_email()` quebram signup ✅ CORRIGIDO
Ambas as funções fazem `new.email::citext` com `SET search_path TO ''`. O tipo `citext` vive
em `public` e não é resolvido sem qualificação → **todo signup/criação de usuário falhava**.
**Estado:** ✅ corrigido nesta sessão — migration `fix_handle_new_user_citext_schema` (cast → `public.citext`).
**Ação pós-migração:** validar no app que o fluxo de signup/convite funciona ponta a ponta.

---

## 2. 🟡 PII — CPF não cifrado

Colunas `bytea` (`pgsodium`) ficaram `NULL` na carga. Não foi inventado esquema de cifragem (Constituição, Art. IV).

| Campo destino | Tabela | Volume | Origem Airtable |
|---|---|---:|---|
| `assertiva_cpf_decisor_encrypted` | `app.leads` | a apurar | `assertivaCpfDecisor` (texto plano) |
| `cpf_encrypted` | `app.contacts` | 102 | `cpf` (texto plano) |
| `cpf_encrypted` | `app.lead_partners` | 0 — sem pendência | `cpf` vazio nos 596 |

**Ação pós-migração:** inspecionar o setup `pgsodium` do W1 (função `read_pii`, SECURITY LABELs / key id), depois cifrar via `UPDATE` idempotente.

---

## 3. 🟡 Registros órfãos — referências quebradas na origem (W2-07 ✅ investigado)

| Tabela | Volume | Descrição |
|---|---:|---|
| `app.contacts` (`lead_id` NULL) | 27 | Apontam para leads inexistentes |
| `app.activities` (`lead_id` NULL) | 2 | Apontam para leads inexistentes |

**Investigação W2-07 (conclusiva):** os 29 registros referenciam **25 leads distintos** que
**não existem na tabela `Leads` do Airtable** (`existem_no_airtable_leads = 0`). São referências
quebradas **na própria origem** — leads deletados no Airtable sem limpar contacts/activities filhos.
A migração reproduziu fielmente o estado do Airtable; **não é erro de ETL**.

**Decisão pós-migração (do operador):** escolher entre —
(a) manter os 29 registros com `lead_id` NULL (contatos/atividades sem empresa); ou
(b) deletá-los como lixo de dados herdado do Airtable.

---

## 4. 🟡 Campos vagos do Airtable (tipagem fraca / formato inconsistente)

Campos `singleLineText`/`multilineText` que deveriam ter tipo forte — fonte de risco de extração.

| Campo Airtable | Tabela | Tipo atual | Deveria ser | Observação |
|---|---|---|---|---|
| `foundingDate` | Leads | singleLineText | date | 1 registro em formato BR (`27/08/2020`) — convertido na carga; formatos mistos |
| `partners` | Leads | multilineText ("JSON") | — | Vazio nos 601; campo legado pré-decomposição |
| `cnaeSecondary` | Leads | multilineText ("JSON") | array/jsonb | Texto livre migrado as-is para coluna `text` |
| `enrichmentSources` | Leads | multilineText ("JSON") | jsonb | Texto livre as-is |
| `enrichmentLog` | Leads | multilineText ("JSON") | jsonb | Texto livre as-is |
| `inpiTrademarks` | Leads | multilineText ("JSON") | — | Vazio nos 601 |
| `assertivaSocialMedia` | Leads | multilineText ("JSON") | jsonb | Vazio nos 601 |
| `websiteEmails` | Leads | multilineText ("JSON array") | — | Vazio nos 601 |
| `websitePhones` | Leads | multilineText ("JSON array") | — | Vazio nos 601 |
| `leadId` | Contacts | singleLineText | — | Redundante com o link `Lead`; só 48/728 preenchidos — usar sempre o link |
| (sem campo de data) | Activities | — | timestamp | Tabela `Activities` não tem `createdAt`/`timestamp` — `occurred_at` ficou `now()` (data da migração, não a real) |
| `metadata` | PipelineEvents | multilineText | jsonb | Encapsulado como `{"raw": …}` — não parseado como JSON estruturado |

**Ação pós-migração:** decidir, caso a caso, se o campo deve ser normalizado no schema `app`, parseado para `jsonb`, ou descartado.

---

## 5. 🔵 Decisões de mapeamento a revisar

### DEC-01 — `role="user"` genérico (Users)
9 dos 10 usuários têm `role="user"` no Airtable — valor **inexistente** no enum `app.user_role`
(`admin`/`sdr`/`closer`/`viewer`). Mapeados para `viewer` (regra default do trigger `handle_new_user`).
**Ação pós-migração:** revisar individualmente quem deveria ser `sdr` ou `closer` — `UPDATE app.profiles SET role = ...`.

### DEC-02 — Senha não migrável + usuários inativos
Hashes do Airtable não migram (política do epic). Os 10 perfis ficaram `is_active = false`,
`encrypted_password = NULL`.
**Ação pós-migração:** disparar `generateLink(recovery)` para os 10 usuários (force password reset).
Ao concluir o reset, o usuário deve passar a `is_active = true` (Story 016).

### DEC-03 — `contact_type` com capitalização inconsistente ✅ TRATADO
33 contacts vinham como `"Decisor"` (maiúscula) vs `"decisor"`. Normalizado com `lower()` na carga.
**Ação pós-migração:** nenhuma — registro informativo. Padronizar no Airtable se ele continuar em uso transitório.

### DEC-04 — Mapeamento ActivityLog → `audit.audit_log` é aproximado
O `ActivityLog` do Airtable é um log de atividade de UI (`action`/`page`/`details`/`userName`),
não um audit de mudança de dados (modelo do `audit_log`: `before`/`after`/`resource_*`).
Mapeamento aplicado: `page` → `resource_table`; `details` + `userName` preservados em `after` (jsonb)
para garantir zero perda. `before`, `resource_id`, `user_agent`, `request_id` ficaram `NULL`.
**Ação pós-migração:** decidir se o `audit_log` ganha colunas dedicadas (`page`, `actor_name`) ou se o modelo atual é suficiente.

---

## 6. Cobertura por wave (atualizado a cada checkpoint)

| Wave | Tabela | Airtable | Supabase | Exceções |
|---|---|---:|---:|---|
| W2-01 | `app.leads` | 601 | 601 | CPF decisor pendente (PII) |
| W2-01 | `lead_phones` / `lead_emails` / `lead_social` | — | 702 / 628 / 106 | — |
| W2-01 | `lead_trademarks` | 0 | 0 | origem vazia |
| W2-02 | `app.contacts` | 728 | 728 | 27 órfãos · 102 CPF pendente |
| W2-03 | `app.lead_partners` | 596 | 596 | — |
| W2-04 | `auth.users` + `app.profiles` | 10 | 10 | role genérico · senha force-reset |
| W2-05 | `audit.audit_log` | 1.369 | 1.369 | mapeamento aproximado (ver DEC-04) |
| W2-06 | `activities`/`enrichment_runs`/`pipeline_events` | 3/5/1 | 3/5/1 | 2 activities órfãs · Activities sem data |
| W2-07 | reconciliação de FK | — | — | ✅ 25 leads fantasmas identificados na origem; FK 100% íntegras |
| W2-08 | validação de integridade (NFR-4) | 3.313 | 3.313 | ✅ paridade total — zero perda |

---

## Log de atualizações

- **2026-05-19** — Documento criado (W2-01, W2-02).
- **2026-05-19** — W2-03 concluída sem novas pendências.
- **2026-05-19** — Reescrito como registro completo. Adicionados BUG-01, BUG-02 (corrigido), DEC-01/02/03 após a W2-04.
- **2026-05-19** — W2-05 (ActivityLog) concluída: 1.369/1.369. Adicionado DEC-04 (mapeamento aproximado).
- **2026-05-19** — W2-06 concluída: activities 3, enrichment_runs 5, pipeline_events 1. +2 activities órfãs, Activities sem campo de data.
- **2026-05-19** — **W2-07 e W2-08 concluídas. Wave 2 do epic ENCERRADA com paridade total Airtable=Supabase (3.313=3.313). Zero perda, FK 100% íntegras. Pendências catalogadas neste doc para resolução pós-migração antes do cutover W3.**
