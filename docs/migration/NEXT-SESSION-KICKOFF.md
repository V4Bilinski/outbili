# Próxima Sessão — Kickoff (preparado em 2026-05-24)

> **Como iniciar:** abra o OUTBILI e acione `@aiox-master` (Orion) com:
> *"Retome o OUTBILI: execute o W3-09 (eliminar n8n/Worker) seguindo o kickoff em
> docs/migration/NEXT-SESSION-KICKOFF.md, começando pela Fase A."*
> Tudo desta sessão está em `main` (deploy ok) e documentado em `SESSION-HANDOFF-2026-05-24.md`.

## Estado atual (ponto de partida)
- Banco 100% Supabase (11 users, 25 tabelas RLS, 746 leads). Deep enrichment (sócios) + redes sociais (Apify) em produção.
- Airtable eliminado do código ativo (`lib/airtable.ts` removido). Resta só compat de ID + foreign tables `airtable_fdw`.
- **Único vetor n8n/Worker restante** → é o objetivo da próxima sessão (W3-09).

## 🔴 PASSO 0 (antes de tudo) — Rotação de credenciais Assertiva
Ação do operador (não dá para automatizar — portal externo):
1. Portal Assertiva → gerar novo `CLIENT_ID` + `CLIENT_SECRET`, revogar os antigos.
2. `! supabase secrets set --project-ref yxppliytwvlajeqqrrny ASSERTIVA_CLIENT_ID='...' ASSERTIVA_CLIENT_SECRET='...'`
3. Avisar o agente → revalidar `assertiva-enrich` com 1 lead.
> Motivo: as credenciais vazaram em repo público (removidas do HEAD, mas no histórico) = comprometidas.

## 🎯 W3-09 — Eliminar n8n + Cloudflare Worker (épico principal)

### Mapa do que migrar
| Fluxo | Hoje | Arquivos | Destino |
|-------|------|----------|---------|
| **Enriquecimento raso Assertiva** | Worker Cloudflare + n8n fallback | `services/assertivaService.ts` (`VITE_ASSERTIVA_WORKER_URL`, `VITE_N8N_ASSERTIVA_PROXY`) | Edge Function Supabase |
| **Busca de leads** (tela Pesquisa) | n8n webhook (`n8n.bilinski.cloud/webhook/outbili-search`, scraping Google Maps) | `lib/n8n-webhook.ts`, `hooks/useN8nSearch.ts`, `pages/SearchPage.tsx` | Edge Function (decidir fonte) |

Consumidores do `assertivaService`: `enrichmentService`, `pescaService`, `SearchPage`, `integrationHealthService`.

### Fase A — Enriquecimento raso → Edge Function (DESBLOQUEADO, fazer primeiro)
Modelo pronto: a `assertiva-enrich` já faz OAuth + consultas Assertiva server-side. Replicar o padrão.
1. Criar Edge Function `assertiva-proxy` (ou estender) cobrindo as ações do `assertivaService`: `lookup-cnpj`, `get-decision-makers`, `lookup-cpf`, `lookup-phone`, `discover-endpoints`. Reusa secrets `ASSERTIVA_CLIENT_ID/SECRET/ID_FINALIDADE` (já no Supabase).
2. Refatorar `assertivaService.ts` → `supabase.functions.invoke('assertiva-proxy', {...})` em vez de `WORKER_URL`/`N8N_URL`.
3. Remover `VITE_ASSERTIVA_WORKER_URL` + `VITE_N8N_ASSERTIVA_PROXY` (código + secrets GitHub).
4. Validar E2E: enriquecer 1 lead via PESCA/SearchPage; confirmar telefones/WhatsApp no Supabase.

### Fase B — Busca de leads → Edge Function (DECISÃO pendente)
O n8n hoje faz scraping de Google Maps por segmento/cidade e cria leads. **Decidir a fonte substituta:**
- **Opção 1 — CNPJa search** (`cnpjaService.searchOfficesPaginated` já existe): busca por CNAE/UF/cidade direto na CNPJa. Sem scraping, dados oficiais. Mais limpo.
- **Opção 2 — Apify Google Maps scraper** (secret `API_APIFY` já existe): replica o que o n8n fazia (Maps), via Edge Function.
1. Criar Edge Function `lead-search` com a fonte escolhida (orquestra busca + dedupe + insert em `app.leads`).
2. Refatorar `SearchPage` → chamar a Edge Function; aposentar `useN8nSearch` + `lib/n8n-webhook.ts`.
3. Remover `VITE_N8N_WEBHOOK_URL`.

### Limpeza final do W3-09
- Deletar `lib/n8n-webhook.ts`, `hooks/useN8nSearch.ts`, código Worker do `assertivaService`.
- Remover envs `VITE_N8N_*`, `VITE_ASSERTIVA_WORKER_URL` (GitHub Secrets + `.env*`).
- Confirmar grep `n8n|worker|cloudflare` no `src/` = só falsos positivos (Promise.all workers, pdf.worker).
- Atualizar `OUTBILI.md` (stack sem n8n/Worker) + este handoff.

## Pendências menores (depois do W3-09)
| ID | Item | Nota |
|----|------|------|
| #5 | 4 workers órfãos (`outbili-workers/`) | Já gitignored. Recomendação: **descartar** (legado, substituídos por Edge Functions). |
| Story 021 | Drop foreign tables `airtable_fdw.*` + envs `VITE_AIRTABLE_*` | `lib/airtable.ts` já removido. Falta dropar FDW + limpar envs. |
| #9 | Refinar índice de negociação | Penalizar `não-perturbe` no score por sócio. |
| W2-P06 | Reconciliar 21 migrations W1/W2 locais | Cosmético (`migration list` mostra remote-only). |

## Pré-requisitos já prontos (não precisa reconfigurar)
- Secrets no Supabase: `ASSERTIVA_CLIENT_ID/SECRET/ID_FINALIDADE/CPF_HASH_SALT`, `API_APIFY`, `CNPJA_API_KEY`, `CLOUDFLARE_*`.
- Projeto: `outbili-spo` (`yxppliytwvlajeqqrrny`). Repo: `V4Bilinski/outbili` (público). Deploy: GitHub Pages on push `main`.
- Lead de teste E2E: `4F CLINICA ODONTOLOGICA` (uuid `52f21097-3647-4fe6-b268-3e2da2936ef7`, rec `recNWUFb085Xjnm5V`).
- Login QA: `qa-w3-07@outbili.test` / `Teste200$`.

## Lições/armadilhas registradas
- Editar `.github/workflows/*` exige token com scope `workflow` → usar **MCP github**, não `gh`/git push local.
- `migration list` mostra 21 migrations W1/W2 remote-only (dívida W2-P06) — esperado.
- Apify token válido: `cognitive_numbers` (FREE) — já no secret `API_APIFY`.
- Edge Functions Supabase: secrets `ASSERTIVA_*`/`API_APIFY` não são auto-injetados (só `SUPABASE_URL`/`SERVICE_ROLE_KEY`).
