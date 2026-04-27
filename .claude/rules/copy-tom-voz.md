---
name: copy-tom-voz
description: Tom de voz e padroes de copy do OUTBILI para SDR, BDR e Closers. Carregada quando edita UI source ou copy specs.
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "docs/copy/**/*.md"
severity: HARD (travessoes), SOFT (jargao)
guide: docs/copy/COPY-GUIDE-DEFINITIVO.md
hook: .claude/hooks/copy-style-guard.js
---

# Copy Tom de Voz. Regra de Sistema

## Purpose

Garantir que TODA copy do OUTBILI siga o tom comercial profissional definido em `docs/copy/COPY-GUIDE-DEFINITIVO.md`. Esta regra eh carregada automaticamente sempre que o assistente edita arquivo de UI ou de copy. Tem reforco deterministico via hook PreToolUse.

## Scope

Aplicada a:

- `src/**/*.tsx` e `src/**/*.ts` (componentes, paginas, services, hooks)
- `docs/copy/**/*.md` (specs e guias de copy)
- Toasts, labels, placeholders, helper texts, tooltips, headers, CTAs, empty states

Nao se aplica a:

- Comentarios de codigo (`//`, `/* */`, `{/* */}`)
- Regex (`/[-–]/`)
- Logs de debug (`console.*`)
- `src/components/animations/**` (JSDoc adaptado de brandbook externo)
- `src/lib/file-parser.ts` (regex de parse)
- `src/services/firecrawlService.ts` (console.warn)

## Regras Inegociaveis (HARD, hook bloqueia)

### 1. ZERO Travessoes em Strings Visiveis

NUNCA usar:

- `—` (em-dash, U+2014)
- `–` (en-dash, U+2013)

Em qualquer string que apareca para o usuario.

Substitutos validos:

| Caso | Substituto |
|------|-----------|
| Separa duas frases independentes | `.` (ponto final) |
| Introduz lista ou explicacao | `:` (dois pontos) |
| Pausa dentro de uma frase | `,` (virgula) |
| Separador decorativo entre nome e qualificador | `·` (ponto medio U+00B7) |
| Range numerico (`R$ 10k a 25k`) | ` a ` |

### 2. Voz e Verbos

CTA usa verbo no infinitivo aprovado: **Prospectar, Qualificar, Avancar, Agendar, Iniciar cadencia, Salvar, Enviar, Importar, Adicionar, Abrir**.

Proibido em CTA: `Visualizar`, `Acessar`, `Submeter`, `Pescar`, `Subir`, `Matar`.

## Regras Macias (SOFT, hook avisa)

### 3. Vocabulario Comercial Profissional. Sem Giria de SDR Junior

Lista negra (hook avisa, nao bloqueia):

| Proibido | Substituir por |
|----------|---------------|
| `pescar lead` | `prospectar`, `iniciar prospeccao` |
| `subir o lead` | `avancar oportunidade`, `mover para proxima etapa` |
| `matar a objecao` | `tratar objecao`, `responder objecao` |
| `zumbi no pipe` | `deal travado`, `oportunidade estagnada` |
| `bora pra mesa` | (eliminar) |
| `linha ta rodando` | `pipeline ativo` |
| `vai pra rua` | `iniciar prospeccao`, `ir a campo` |
| `caneta perto` / `caneta na mao` | `proximo do fechamento` |
| `fecha a porra` | (eliminar) |

### 4. Vocabulario Aprovado (B2B Sales)

Pipeline e funil: pipeline, oportunidade, deal, lead qualificado, MQL, SQL, estagio, conversao, win rate, ticket medio.

Prospeccao: prospectar, prospect, target, ICP, cadencia, sequencia, touchpoint, cold call, cold mail, primeiro toque, enriquecimento.

Qualificacao: score, SPICED, discovery, decisor, champion, gatekeeper, temperatura.

Fechamento: proposta, negociacao, fechamento, contrato, objecao, follow-up, stage gate.

Performance: meta, atingimento, quota, forecast, projecao, pipeline coverage, velocity, LTP.

Frameworks V4 (manter intactos): 8 Travas (T1 a T8), Linha de Montagem, Cascata 3 niveis, Tiers (Micro+, Small, Medium-, Medium=), SPICED, Throughput.

## Padroes de UI (resumidos. Detalhe completo no guide)

### Headers (h1)
Substantivo direto. `Pipeline`, `Prospeccao`, `Leads`, `Relatorios`, `Configuracoes`.

### Empty states
3 linhas. `{Estado neutro}. {O que significa}. [{CTA}]`

Exemplo: `Pipeline vazio. Nenhum lead em prospeccao. [Iniciar prospeccao]`

### Toasts
Sucesso: confirmacao concreta sem exclamacao dupla. `Lead criado.`
Erro: diagnostico mais acao corretiva. `CNPJ nao encontrado na base. Verifique os 14 digitos.`

### Empty values (placeholders de dado vazio)
Usar `'-'` (hifen ASCII), nunca `'—'`.

## Enforcement Automatico

### Hook PreToolUse (deterministic)

Registrado em `.claude/settings.json`:

```json
"hooks": {
  "PreToolUse": [
    { "matcher": "Edit|Write|MultiEdit",
      "hooks": [{ "type": "command", "command": "node .claude/hooks/copy-style-guard.js" }] }
  ]
}
```

Comportamento:

- Hook verifica se `file_path` esta em escopo (src/ ou docs/copy/, com extensao tsx/ts/md)
- Aplica diff proposto (Edit/Write/MultiEdit) e gera o conteudo candidato
- Detecta travessao em strings literais e em texto JSX. BLOQUEIA com exit 2
- Detecta giria caricatura. BLOQUEIA com exit 2 (politica HARD para giria explicita)
- Fail-open em erros de parse (nao bloqueia trabalho nao relacionado)

### Quando hook bloqueia, agente recebe stderr e refaz a edicao com o substituto correto.

## Ciclo de Atualizacao do Guide

Este guide eh vivo. Sempre que:

1. Usuario der feedback sobre tom (positivo ou negativo)
2. Novo termo comercial padrao aparecer no time
3. Decisao de produto exigir terminologia nova

Atualizar:

- `docs/copy/COPY-GUIDE-DEFINITIVO.md` (vocabulario, padroes)
- `docs/copy/CHANGELOG.md` (registro de mudanca + motivo)
- Esta rule (se mudar regra HARD/SOFT)
- Hook (se entrar/sair termo da lista negra)

Apos atualizar, registrar memory `feedback` com a mudanca para preservar entre sessoes.

## Referencia

- Guia mestre: `docs/copy/COPY-GUIDE-DEFINITIVO.md`
- Modelo de tom: `src/pages/InstitucionalPage.tsx` (versao v1)
- Hook validador: `.claude/hooks/copy-style-guard.js`
- Squad de copy: `squads/copy/` (Tier 0 a 3, 12 copywriters)
- Changelog: `docs/copy/CHANGELOG.md`
