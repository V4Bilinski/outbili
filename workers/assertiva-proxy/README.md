# Assertiva Proxy — Cloudflare Worker

Proxy server-side que resolve CORS e autentica OAuth2 com a Assertiva Localize v3.

## Regra critica

O Worker retorna a resposta RAW completa da Assertiva **sem filtrar nenhum campo**.
O frontend (`src/services/assertivaService.ts`) e responsavel por mapear os campos.

Campos que a Assertiva retorna e o frontend extrai:
- `resp.dadosCadastrais` — razaoSocial, nomeFantasia, site, cnaeDescricao, quantidadeFuncionarios
- `resp.telefones` — celulares (com flag WhatsApp/hotphone) + fixos (com flag WhatsApp Business)
- `resp.emails` — emails validados
- `resp.quadroSocietario` — socios com CPF e qualificacao
- `resp.redesSociais` — Instagram, Facebook, LinkedIn URLs
- `resp.faturamentoPresumido` — faturamento mensal estimado
- `resp.scoreCredito` — score de credito (0-1000)
- `resp.rendaPresumida` — renda estimada
- `resp.indicadorAtividade` — indicador de atividade da empresa
- `raw.cabecalho.protocolo` — protocolo para consulta de decisores

## Deploy

```bash
cd workers/assertiva-proxy

# Configurar secrets (uma vez)
npx wrangler secret put ASSERTIVA_CLIENT_ID
npx wrangler secret put ASSERTIVA_CLIENT_SECRET

# Deploy
npx wrangler deploy
```

## Endpoints

O Worker recebe POST com JSON body:

| action | Params | Assertiva endpoint |
|--------|--------|--------------------|
| `lookup-cnpj` | `cnpj` | `/localize/v3/cnpj` |
| `get-decision-makers` | `cnpj`, `protocolo` | `/localize/v3/possiveis-decisores` |
| `lookup-cpf` | `cpf` | `/localize/v3/cpf` |
| `lookup-phone` | `phone` | `/localize/v3/telefone` |
| `discover-endpoints` | — | Health check |

## URL de producao

```
https://outbili.v4bilinski-ferramentas.workers.dev
```

Configurada em `VITE_ASSERTIVA_WORKER_URL` no GitHub Actions deploy.
