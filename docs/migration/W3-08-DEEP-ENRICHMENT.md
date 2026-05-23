# W3-08 — Deep Enrichment Assertiva (sem n8n) · Registro de conclusão (backend)

> **Data:** 2026-05-23 · **Escopo:** backend (DB + Edge Function) concluído e validado. Frontend pendente.
> **Origem:** reescopo de W3-08 após decisão do operador (2026-05-20) de **eliminar o n8n** do fluxo Assertiva.

## O que foi entregue

Pipeline de enriquecimento profundo que monta o **grafo `empresa → sócios → {vínculos, telefones}`** a partir da Assertiva Localize V3, rodando inteiramente numa **Edge Function Supabase** (substitui o proxy n8n + Worker Cloudflare).

### Banco de dados (schema `app`)

| Objeto | Migration | Função |
|--------|-----------|--------|
| `socios`, `socio_vinculos`, `socio_telefones` | `20260523145820_assertiva_deep_enrichment_w3_08` | Grafo de sócios/decisores (FK CASCADE, índices, RLS, trigger `updated_at`) |
| `encrypt_cpf` / `decrypt_cpf` + chave `outbili_cpf_master_key` (Vault) | `20260523150650_assertiva_cpf_encryption_w3_08` | Cifragem reversível `pgp_sym` de CPF (LGPD) |
| `insert_socio` / `insert_vinculo_familiar` | `20260523151108_w3_08_insert_socio_helper` | Inserção com cifragem interna (evita round-trip bytea no PostgREST) |

### Edge Function

`supabase/functions/assertiva-enrich/index.ts` — `ACTIVE` (v1), `verify_jwt: true`.

## Validação executada (2026-05-23, sem custo Assertiva)

| Verificação | Resultado |
|-------------|-----------|
| Migrations local ↔ remoto (`145820/150650/151108`) | ✅ sincronizadas (`supabase migration list`) |
| Roundtrip `encrypt_cpf` → `decrypt_cpf` | ✅ `123.456.789-09` (ciphertext não-determinístico, IV aleatório) |
| `insert_socio` (sócio fake + cleanup) | ✅ cifrou CPF, gravou índice (0.85) e hash; removido |
| Tabelas vazias pós-teste | ✅ `socios=0, vinculos=0, telefones=0` |
| Secrets da Edge Function (8) | ✅ configurados pelo operador |
| Advisor de segurança | RLS `USING(true)` nas tabelas `socios*` (padrão do projeto, ver decisão LGPD abaixo) |

## Pendências (rastreadas)

1. **Integração frontend** — `assertivaService.ts` ainda usa Worker + n8n; criar service/hook + UI do grafo na CompanyPage.
2. **Validação E2E real** — invocar a função com 1 lead (custa crédito Assertiva). Autorizado: 1 lead barato escolhido pelo agente.
3. **Governança LGPD** — `decrypt_cpf` executável por `authenticated` + RLS `SELECT USING(true)` → qualquer logado decifra CPF. Revisar.
4. **W2-P06** — 21 migrations W1/W2 remote-only sem arquivo local (dívida pré-existente, separada do W3-08).
5. **Workers órfãos** — `apify/cnpja/cron-reenrichment/llm-analyzer` perderam `src/` (bundle recuperável); decidir recuperar ou descartar.
