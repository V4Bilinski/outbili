# Session Handoff — 2026-05-23/24 · W3-08 Deep Enrichment + Camada 2 + Segurança + LGPD

> Sessão de retomada (a anterior fechou abruptamente com o W3-08 em WIP). Resultado:
> **W3-08 concluído end-to-end**, **Camada 2 (redes sociais) entregue**, **incidente de
> segurança tratado** e **bloco LGPD/CPF fechado**. Tudo 100% Supabase, validado em
> produção (lead 4F CLINICA ODONTOLOGICA). Sem n8n, sem Airtable runtime, sem Worker Cloudflare.

## 1. Backend — Deep Enrichment Assertiva (W3-08)

**Edge Function `assertiva-enrich`** (ACTIVE) substitui o proxy n8n/Worker. Fluxo:
`CNPJ → .resposta.socios[] (CPF completo) → por sócio: /cpf + /conexoes + /pessoas-de-referencia + /mais-telefones`.
Monta o grafo e persiste. **Idempotente** (deleta sócios do lead antes de reinserir).

**Tabelas (schema `app`):**
- `socios` — decisores por CNPJ; CPF cifrado (`cpf_cifrado` bytea) + `cpf_hash` (dedupe) + `indice_probabilidade_negociacao`
- `socio_telefones` — telefones pessoais (1:N), `whatsapp_pessoal`/`whatsapp_confirmado`/`is_hot`/`origem`/`raw`
- `socio_vinculos` — familiares + societárias cruzadas
- `socio_redes` — redes sociais (Camada 2)

**Cifragem CPF (LGPD art. 10):** `pgp_sym_encrypt` + chave `outbili_cpf_master_key` (Vault). Funções `app.encrypt_cpf`/`decrypt_cpf` (SECURITY DEFINER) + helpers `insert_socio`/`insert_vinculo_familiar` (cifram internamente, evitam round-trip bytea no PostgREST).

**Telefones da empresa:** a consulta CNPJ também traz telefones da empresa; persistidos em `app.lead_phones` (owner=empresa, upsert por e164). Antes só 1 era salvo; agora **todos**.

**Migrations:** `20260523145820` (tabelas) · `150650` (cifragem) · `151108` (helpers).

**Bugs achados/corrigidos durante a validação E2E real:**
1. Extração de sócios usava `/possiveis-decisores` (vazio) → corrigido para `.resposta.socios[]` (CPF vem completo, sem máscara).
2. RPC chamava `public.insert_socio` → corrigido para `.schema('app').rpc(...)`.
3. Reprocessar duplicava sócios → adicionado `DELETE` idempotente.

## 2. Camada 2 — Redes sociais via Apify

**Edge Function `social-enrich`** (ACTIVE). Apify usado **exclusivamente** para redes sociais.
- **Validação anti-filial (crítico para franquias):** busca `nome+via+cidade` (nunca só a franquia); cruza `businessAddress` do perfil com o endereço real do lead. Logradouro/CEP batem → `alta`; só cidade → `media`; nada → **descartado**. Nunca atribui rede de outra filial.
- Detecta menção de sócio na bio → atribui a rede ao decisor.
- **Link da bio (linktr.ee, etc.) vira `leads.website`** (presença digital), exibido ao lado das redes. Regra NON_NEGOTIABLE em `.claude/rules/social-media-enrichment.md`.
- Popula `app.lead_social` (source=`apify`) → alimenta o painel **Presença Digital** do header.

**Migrations:** `20260523224317` (tabela `socio_redes`) · `20260523233514` (enum `social_media_source` += `apify`).

**Decisão — validador de WhatsApp:** investigado o BilinskiZap; ele **não** expõe check de presença no WhatsApp (`/api/whatsapp/check` → 404; `precheck` exige contato cadastrado; `createContact` retorna opt-in, não presença). **Decisão do operador:** usar a flag `aplicativos.whatsApp` da Assertiva (já no sistema). Z-API/Whapi não adotados.

## 3. Frontend (React 19 + Vite + Tailwind)

- **`socioService.ts`** — busca grafo de sócios + telefones empresa + redes; `runDeepEnrichment` / `runSocialEnrich`; gera links `wa.me`; resolve UUID do lead (compat `rec...`).
- **`TabSocios.tsx`** — WhatsApp pessoal por sócio (todos os números, link wa.me, badge não-perturbe/confirmado), índice de negociação, redes sociais, vínculos. WhatsApp da empresa ao final (menos relevante).
- **Unificação:** a **aba "Sócios" deixou de existir**; o conteúdo foi **indexado dentro da página de Resumo**, substituindo o antigo "Quadro Societário + Contatos".
- **Ajustes UI:** título usa `trade_name` ("Sorridents"); razão social vira subtítulo. Painel Presença Digital sem badge de fonte/data. Contatos deduplicados.

## 4. Segurança (incidente tratado)

`outbili-workers/assertiva-proxy/wrangler.toml` continha `ASSERTIVA_CLIENT_ID/SECRET` em texto plano num repo **público**.
- ✅ `git rm --cached` dos 3 arquivos tracked + `outbili-workers/` no `.gitignore` (commit `9c34d1f`). Confirmado via MCP GitHub: arquivo retorna 404 no HEAD.
- ⚠️ **Histórico git ainda contém** (operador optou por NÃO reescrever história).
- 🔴 **Rotação pendente (ação do operador):** gerar novo CLIENT_ID/SECRET no portal Assertiva + atualizar o secret no Supabase. Credenciais expostas em repo público = comprometidas.

## 5. LGPD / CPF

- **CPF legado cifrado (W2-P01):** 102 CPFs de `app.contacts` cifrados (puxados de `airtable_fdw.contacts.cpf` → `encrypt_cpf`). 88 CPFs válidos + 14 CNPJs (campo errado no Airtable). Zero CPF em texto plano persistido.
- **Acesso minimizado:** `decrypt_cpf`/`encrypt_cpf` restritos a `service_role` (migration `20260524004012`). `authenticated` não decifra. Frontend não exibe CPF.

## 6. Secrets (Supabase Edge Functions)

`ASSERTIVA_CLIENT_ID` · `ASSERTIVA_CLIENT_SECRET` · `ASSERTIVA_CPF_HASH_SALT` · `ASSERTIVA_ID_FINALIDADE` · `API_APIFY` (corrigido — estava inválido; token `cognitive_numbers` FREE) · CNPJa/Cloudflare. `SUPABASE_URL`/`SERVICE_ROLE_KEY` auto-injetados.

## 7. Validação E2E (lead 4F CLINICA ODONTOLOGICA · uuid `52f21097-...` · rec`recNWUFb085Xjnm5V`)

3 sócios (Ivan/Maria/Carolina), 8 telefones pessoais, 3 WhatsApp da empresa, 1 rede social (`@sorridents_augusta`, match alta por endereço, atribuída à Carolina), website `linktr.ee/sorridentsaugusta`. CPF cifrado/decifrado OK. 0 erros no console em produção.

## 8. Pendências restantes (backlog)

| ID | Item | Prioridade |
|----|------|:--:|
| Operador | 🔴 Rotacionar credenciais Assertiva (portal) + atualizar secret | Alta |
| #5 | Destino dos 4 workers órfãos (gitignored) — recuperar do bundle ou descartar | Baixa |
| #9 | Refinar índice de negociação (penalizar não-perturbe) | Baixa |
| Story 021 | Drop foreign tables `airtable_fdw.*` + `lib/airtable.ts` + envs `VITE_AIRTABLE_*` | Baixa |
| W2-P06 | Reconciliar histórico local das 21 migrations W1/W2 remote-only | Baixa |

## 9. Commits da sessão (main)

`cef8a67` (W3-08 backend) · `5c3ab1d` (frontend sócios) · `76be8cb` (telefones empresa) · `445df4e` (dedupe) · `5233bc2` (Camada 2 Apify) · `c328e7e` (4 ajustes UI) · `9261312` (limpeza presença digital) · `2810a13` (linktr.ee website) · `fc600b4` (regra link bio) · `079e931` (unificação Resumo) · `9c34d1f` (segurança) · `1699749` (LGPD CPF). Todos com deploy GitHub Pages `success`.
