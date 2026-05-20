# Migrations Remotas — Histórico W2 (Airtable → Supabase) e W3-01

> **Projeto:** Supabase `outbili-spo` (`yxppliytwvlajeqqrrny`)
> **Aplicadas via:** MCP `apply_migration` (não há `.sql` local correspondente)
> **Aberto:** 2026-05-19 · **Atualizado:** 2026-05-19

As migrations abaixo foram aplicadas **direto no banco remoto** durante a Wave 2 da migração
e o início da Wave 3. Para que o histórico local (`supabase/migrations/*.sql`) reflita o estado
remoto, o operador `@devops` precisa reconciliar via `supabase migration repair --status applied`.

## Histórico aplicado

| # | Versão | Nome | Tipo | Propósito |
|---|---|---|---|---|
| 1 | `20260505180000` | `wrapper_setup` | W1 | (já local) Wrappers FDW + vault |
| 2 | `20260505190000` | `schema_init` | W1 | (já local) Schemas `app` + `audit` |
| 3 | `20260505200000` | `advisors_fix` | W1 | (já local) Ajustes RLS |
| 4 | `20260505210000` | `foreign_tables` | W1 | (já local) Foreign tables FDW (1ª versão) |
| 5 | `20260505220000` | `foreign_tables` | W1 | (já local) Foreign tables FDW (2ª versão) |
| 6 | `20260505230000` | `bridge_views` | W1 | (já local) Views auxiliares |
| 7 | `20260506000000` | `auth_setup` | W1 | (já local) `auth.users` + `handle_new_user` |
| 8 | `20260519203059` | `fix_fdw_foreign_table_leads` | **W2/W1-fix** | Recria `airtable_fdw.leads` com tipos corretos (`number`→`double precision`, `checkbox`→`boolean`) + coluna `id` (record id do Airtable) |
| 9 | `20260519203442` | `etl_w2_01a_leads_core` | **W2** | ETL 601 leads → `app.leads` (90 colunas, idempotente por `airtable_record_id`) |
| 10 | `20260519204220` | `etl_w2_01b_leads_children` | **W2** | Decompõe em filhas: `lead_phones` (702), `lead_emails` (628), `lead_social` (106). `lead_trademarks` vazio. Trigger `denormalize_preferred_phone` aplicado |
| 11 | `20260519204538` | `fix_fdw_foreign_table_contacts` | **W2/W1-fix** | Recria `airtable_fdw.contacts` corrigido + `"Lead" jsonb` (record link como array) |
| 12 | `20260519204648` | `etl_w2_02_contacts` | **W2** | ETL 728 contacts → `app.contacts`; 701 resolvem `lead_id` via link `Lead`/`leadId`, 27 órfãos registrados em `errors` |
| 13 | `20260519205051` | `fix_fdw_foreign_table_partners` | **W2/W1-fix** | Recria `airtable_fdw.partners` corrigido |
| 14 | `20260519205130` | `etl_w2_03_lead_partners` | **W2** | ETL 596 partners → `app.lead_partners`; **zero órfãos**, zero CPF |
| 15 | `20260519205600` | `fix_fdw_foreign_table_users` | **W2/W1-fix** | Recria `airtable_fdw.users` corrigido |
| 16 | `20260519205927` | `fix_handle_new_user_citext_schema` | **W1-bug fix** | **Bug encontrado e corrigido:** `handle_new_user()` e `sync_profile_email()` usavam `::citext` sem schema qualificado com `search_path` vazio → quebrava todo signup. Cast trocado para `::public.citext` |
| 17 | `20260519205945` | `etl_w2_04_users` | **W2** | ETL 10 users → `auth.users` + `app.profiles` (via trigger). Senha NÃO migrada (política do epic — force password reset) |
| 18 | `20260519210402` | `fix_fdw_foreign_table_activity_log` | **W2/W1-fix** | Recria `airtable_fdw.activity_log` corrigido |
| 19 | `20260519210450` | `etl_w2_05_audit_log` | **W2** | ETL 1.369 ActivityLog → `audit.audit_log` (mapeamento aproximado: `page`→`resource_table`, `details`+`userName`→`after` jsonb) |
| 20 | `20260519210629` | `fix_fdw_foreign_tables_w2_06` | **W2/W1-fix** | Recria as 3 foreign tables `activities`, `enrichment_log`, `pipeline_events` corrigidas |
| 21 | `20260519210747` | `etl_w2_06_activities_enrichment_pipeline` | **W2** | ETL 9 registros: activities (3), enrichment_runs (5), pipeline_events (1) |

**Total:** 21 migrations remotas. 7 locais (W1 original); 14 a reconciliar.

## Como reconciliar local

Quando o `@devops` puder rodar o `supabase` CLI autenticado:

```bash
cd V4_Company/V4_Creator/Sistemas/outbili

# Opção 1: marcar todas como aplicadas localmente
for v in 20260519203059 20260519203442 20260519204220 20260519204538 \
         20260519204648 20260519205051 20260519205130 20260519205600 \
         20260519205927 20260519205945 20260519210402 20260519210450 \
         20260519210629 20260519210747; do
  supabase migration repair --status applied "$v" --linked
done

# Opção 2: regenerar .sql via db pull (mais limpo, requer Docker)
supabase db pull --linked
```

Após reconciliar, `supabase migration list --linked` deve mostrar local = remoto.

## Resultado da Wave 2

| Tabela destino | Origem (Airtable) | Linhas | Status |
|---|---|---:|---|
| `app.leads` | Leads | 601 / 601 | ✅ |
| `app.lead_phones` | (derivada) | 702 | ✅ |
| `app.lead_emails` | (derivada) | 628 | ✅ |
| `app.lead_social` | (derivada) | 106 | ✅ |
| `app.lead_partners` | Partners | 596 / 596 | ✅ |
| `app.contacts` | Contacts | 728 / 728 | ✅ (27 órfãos) |
| `app.profiles` | Users | 10 / 10 | ✅ (force reset) |
| `auth.users` | Users | 10 / 10 | ✅ |
| `audit.audit_log` | ActivityLog | 1.369 / 1.369 | ✅ |
| `app.activities` | Activities | 3 / 3 | ✅ |
| `app.enrichment_runs` | EnrichmentLog | 5 / 5 | ✅ |
| `app.pipeline_events` | PipelineEvents | 1 / 1 | ✅ |
| **TOTAL origem** | — | **3.313 / 3.313** | **NFR-4 ✅** |

## Pendências catalogadas

Ver [`PENDENCIAS-MIGRACAO.md`](./PENDENCIAS-MIGRACAO.md):
1. PII — CPF não cifrado (leads + 102 contacts)
2. 29 registros órfãos referenciando 25 leads inexistentes na origem
3. 9 campos vagos do Airtable
4. `role="user"` genérico (9 usuários)
5. Senha force-reset (10 usuários)
6. Mapeamento aproximado ActivityLog → audit_log
