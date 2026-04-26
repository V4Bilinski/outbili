# WhatsApp Templates — OUTBILI

Catálogo de 50 templates WhatsApp Business aprovados pela Meta Cloud API v24.0, organizados por pilar e prontos para uso na cadência personalizada do outbili.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `catalog.json` | Fonte de verdade — 50 templates em formato Meta-compatível |
| `submit-templates.sh` | Script bash que submete ao Meta em lote (rate-limited) |
| `submit-results.log` | Log de cada submissão (criado pelo script) |

Helpers TypeScript (consumidores do `catalog.json`):
- `src/lib/template-catalog.ts` — tipos, resolver de variáveis, `pickColdOpeningTemplate()`
- `src/services/cadenceGeneratorService.ts` — `generateCadence(lead)` retorna cadência de 5 mensagens

## Distribuição

| Pilar | Qtd | Categoria Meta | Uso |
|---|---|---|---|
| 1 — Cold opening | 10 | MARKETING | Primeiro contato |
| 2 — Follow-up sem resposta | 10 | MARKETING | Mensagens D+2 a D+28 |
| 3 — Agendamento & confirmação | 9 | UTILITY / 1 MARKETING | Fluxo de reunião |
| 4 — Trava + oferta V4 | 10 | MARKETING | T1-T8 + DR-X / DR-O |
| 5 — Reativação & nutrição | 10 | MARKETING | Lead frio 3-6 meses |

Total: **41 MARKETING + 9 UTILITY** (ratio aceito para WABA em desenvolvimento).

## Variáveis (named params)

### Auto-resolvidas do lead (6)

| Variável | Campo Lead |
|---|---|
| `{{decisor}}` | `decisorContact.name` |
| `{{empresa}}` | `companyName` |
| `{{empresa_curta}}` | `tradeName` (fallback → companyName) |
| `{{segmento}}` | `segment` |
| `{{cidade}}` | `city` |
| `{{cargo}}` | `decisorContact.role` |

### Custom (10) — preenchidas no momento do envio

`case_empresa`, `dado`, `dor`, `evento`, `indicador`, `horario1`, `horario2`, `horario3`, `link`, `material`

## Como submeter ao Meta

### Pré-requisitos

1. `.env.local` populado (já está) com:
   - `WHATSAPP_WABA_ID=1253502413584752`
   - `WHATSAPP_ACCESS_TOKEN=...` (System User Nexus, permanente)
2. `jq` instalado (`brew install jq` se não tiver)

### Comandos

```bash
cd whatsapp-templates

# Dry-run: mostra payload sem enviar (CONFERIR ANTES de submeter todos)
bash submit-templates.sh --dry-run

# Submeter 1 pilar de cada vez (recomendado — facilita debug)
bash submit-templates.sh --pillar 1
bash submit-templates.sh --pillar 2
bash submit-templates.sh --pillar 3
bash submit-templates.sh --pillar 4
bash submit-templates.sh --pillar 5

# OU submeter tudo de uma vez (demora ~6 minutos por causa do rate-limit)
bash submit-templates.sh

# Submeter 1 template específico
bash submit-templates.sh --name outbili_cold_curto

# Ajustar delay entre submissões (default 7s)
bash submit-templates.sh --delay 10
```

### Acompanhar aprovação

```bash
source ../.env.local
curl -s "https://graph.facebook.com/v24.0/$WHATSAPP_WABA_ID/message_templates?fields=name,status&limit=100" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  | jq '.data[] | select(.name | startswith("outbili_")) | {name, status}'
```

Status possíveis:
- `APPROVED` — pronto para uso em campanhas
- `PENDING` — em análise Meta (geralmente < 2h)
- `REJECTED` — ver motivo em `reason` (ajustar texto e re-submeter com sufixo `_v2`)
- `PAUSED` — foi pausado por baixa qualidade

## Uso em código (TypeScript)

```ts
import { generateCadence } from '@/services/cadenceGeneratorService'
import { previewTemplate, getTemplateByName } from '@/lib/template-catalog'

// 1. Gerar cadência automática para um lead
const plan = generateCadence(lead, {
  customValues: {
    case_empresa: 'BetaTech',
    material: 'Playbook Aceleração 2026',
  },
})

console.log(plan.reason) // "Decisor e CEO/Founder"
console.log(plan.steps[0].preview) // Mensagem já renderizada
console.log(plan.totalDurationHours) // 240

// 2. Preview ad-hoc de qualquer template
const tpl = getTemplateByName('outbili_cold_caso_setor')!
const preview = previewTemplate(tpl, lead, { case_empresa: 'BetaTech' })
```

## Próximos passos (roadmap)

1. **Aprovação dos templates** (24-48h por batch, começar hoje)
2. **Integrar no CampaignsPage** — adicionar botão "Gerar cadência IA" na CompanyPage que chama `generateCadence(lead)` e pré-popula o wizard
3. **Deploy do webhook worker** (`workers/whatsapp-webhook/`) — quando lead responder, abre janela 24h e permite mensagens livres
4. **Expandir catálogo por segmento** — v2 com 5 templates específicos por setor (Saúde, Educação, Tech, etc.)

## Notas importantes

- **Não renomear templates após aprovação** — name é chave única. Se precisar mudar copy, criar `_v2`.
- **Follow-ups livres (texto arbitrário)** só funcionam na janela de 24h após o lead responder. Fora disso, sempre usar template aprovado.
- Templates de pilar 4 e 5 **dependem de dados mapeados no lead** (trava, vulnerabilidades, score). Se o lead não tiver esses dados, o `pickColdOpeningTemplate()` usa fallback.
- **Rate limit Meta para criação de templates**: ~10/minuto em contas em desenvolvimento. Script já respeita.
