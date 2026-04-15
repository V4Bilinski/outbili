# Task: Validate & Convert Utility Template

## Metadata
- task: validate-utility
- tier: 1
- agents: [@utility-validator]
- elicit: true
- inputs: message text, intended purpose, target audience type
- outputs: validated utility template with PACTO score, risk assessment, and ready-to-submit payload
- quality-gates: [PACTO compliance passed, prohibited word scan clean, risk score >= 70]

## Prerequisites
- Message text or intent description provided
- Understanding of target audience (base quente vs fria)
- Knowledge of account quality status (Alta/Media/Baixa) for risk calibration

## Elicitation

Collect the following before proceeding:
1. **Message text or intent:** The original message to validate/convert, OR a description of what needs to be communicated
2. **Use case:** boas-vindas | captacao | antecipacao-cpl | order-bump | upsell | downsell | recovery | suporte | outro
3. **Target audience:** inscrito (base quente) | base fria | comprador | lead antigo
4. **Expert name:** Name/brand for identification in message (e.g., "Luiz Henrique")
5. **Project/Event name:** Name of course, event, or product referenced
6. **Account quality:** Alta | Media | Baixa | Desconhecida
7. **Mode:** validate-only | convert | camouflage

## Steps

### Step 1: Prohibited Word Scan
Scan the input message against the full prohibited words list:
- **CRITICO (instant reject):** Desconto, Oferta, Promocao, Aproveite agora, Compre ja, Nao perca, Ultima chance, Imperdivel, Preco especial, So hoje, Oferta limitada, Frete gratis, Liquidacao, Clique aqui para comprar
- **ALTO (likely reclassification):** Exclusivo, Ganhe, Economize, Bonus, Brinde, Venda, Preco baixo, Reserve ja, Corra, Condicao exclusiva/especial
- **MEDIO (caution):** Reservada (use "Confirmada" instead), superlativos, promessas de resultado

Output: List of found words with severity level.

### Step 2: PACTO Framework Compliance Check
Evaluate each PACTO element:

| Element | Check | Pass Criteria |
|---------|-------|---------------|
| **P** — Palavra de Status | Is a status word present? | At least 1 approved status word (ideally "Confirmada") |
| **A** — Apresentacao | Has personal greeting + identification? | "{Nome}" + expert identification present |
| **C** — Clareza | Is tone neutral and informative? | No superlatives, no exaggeration, no hype |
| **T** — Tomada de Acao | CTA sounds like service? | Uses "receber", "acompanhar", "confirmar" — not "garantir", "adquirir" |
| **O** — Omissao | Zero promotional appeals? | No urgency, no scarcity, no direct sales language |

Output: PASS/FAIL per element with specific feedback.

### Step 3: Risk Score Calculation
Calculate composite risk score (0-100):

| Factor | Weight | Scoring |
|--------|--------|---------|
| Prohibited words | 35% | 0 found = 100, 1 ALTO = 50, 1 CRITICO = 0 |
| PACTO compliance | 30% | 5/5 = 100, 4/5 = 80, 3/5 = 60, <3 = 30 |
| Tone analysis | 20% | Pure informative = 100, Mixed = 50, Promotional = 0 |
| Button design | 10% | Has Bloquear Contato + service CTA = 100 |
| Message length | 5% | < 500 chars = 100, 500-800 = 70, > 800 = 40 |

**Score interpretation:**
- 90-100: SAFE — Submit as utility with confidence
- 70-89: LIKELY — Minor adjustments recommended, submit after fixes
- 50-69: RISK ZONE — High reclassification chance, rewrite or use camouflage
- 0-49: MARKETING — Do not submit as utility, convert or submit as marketing

### Step 4: Generate Recommendation
Based on mode selected:

**validate-only:**
- Output full analysis report (scan + PACTO + risk score)
- List specific issues and fixes needed
- Recommend: APPROVE AS-IS / MINOR FIXES / REWRITE NEEDED / USE CAMOUFLAGE / SUBMIT AS MARKETING

**convert:**
- Apply PACTO framework to rewrite the message
- Select best-fit framework from KB (boas-vindas, captacao, antecipacao, etc.)
- Replace prohibited words with utility-safe alternatives
- Add status word if missing
- Design appropriate quick reply buttons
- Output: ready-to-submit template text + JSON payload

**camouflage:**
- Design neutral template shell with strategic variable placement
- Generate approval-safe variable examples (100% utility)
- Generate real send-time variable content (persuasive copy)
- Document variable mapping for automation setup
- Output: template + approval examples + real copy + setup instructions

### Step 5: Generate API Payload
For convert and camouflage modes, generate the Meta API payload:

```json
{
  "name": "utility_{use_case}_{timestamp}",
  "language": "pt_BR",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "...",
      "example": {
        "body_text": [["..."]]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        { "type": "QUICK_REPLY", "text": "..." },
        { "type": "QUICK_REPLY", "text": "Bloquear Contato" }
      ]
    }
  ]
}
```

### Step 6: Component Limits Validation
Verify all technical limits:
- [ ] Header text <= 60 characters (if present)
- [ ] Body <= 1024 characters
- [ ] Footer <= 60 characters, no variables (if present)
- [ ] Each button label <= 25 characters
- [ ] Total buttons <= 10
- [ ] Template name: lowercase + underscores only
- [ ] Every `{{variable}}` has a safe utility example
- [ ] Variable examples use correct type (texto, data, valor, numero, endereco)
- [ ] No mixed formatting (CAPS LOCK, excessive emojis, multiple !!!)

### Step 7: Final Validation
Re-run Steps 1-3 on the output to confirm:
- [ ] Zero prohibited words in template body
- [ ] PACTO 5/5 compliance
- [ ] Risk score >= 70
- [ ] Buttons include "Bloquear Contato"
- [ ] Variable examples are 100% utility (for camouflage mode)
- [ ] Message length < 500 characters (ideal)
- [ ] All component limits passed (Step 6)

## Output Format

```
## Utility Template Validation Report

### Input
- Original message: ...
- Use case: ...
- Mode: ...

### Prohibited Word Scan
- Found: [list] or CLEAN
- Severity: CRITICO / ALTO / MEDIO / NONE

### PACTO Compliance
- P (Status Word): PASS/FAIL — [word found or suggestion]
- A (Apresentacao): PASS/FAIL — [feedback]
- C (Clareza): PASS/FAIL — [feedback]
- T (Tomada Acao): PASS/FAIL — [feedback]
- O (Omissao): PASS/FAIL — [feedback]

### Risk Score: XX/100 — [SAFE/LIKELY/RISK ZONE/MARKETING]

### Recommendation: [APPROVE AS-IS / MINOR FIXES / REWRITE NEEDED / USE CAMOUFLAGE / SUBMIT AS MARKETING]

### Output Template
[template text or converted version]

### API Payload
[JSON payload ready for submission]
```

## References
- Knowledge base: `data/utility-templates-kb.md`
- Meta Template Guidelines: https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/
- Framework source: Guia de Mensagens de Utilidade v1.5 (Marcelo Tavora)
