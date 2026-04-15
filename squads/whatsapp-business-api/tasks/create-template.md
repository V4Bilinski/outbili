# Task: Create WhatsApp Template

## Metadata
- task: create-template
- tier: 1
- agents: [@template-strategist]
- elicit: true
- inputs: category, message purpose, target audience, variables needed, language
- outputs: complete template spec with JSON payload ready for Meta API submission
- quality-gates: [compliance pre-check passed, payload valid, preview approved]

## Prerequisites
- WABA ID and access credentials available
- Understanding of business use case and target audience
- Awareness of current template approval rates for the account

## Elicitation

Collect the following before proceeding:
1. **Category:** MARKETING, UTILITY, or AUTHENTICATION
2. **Message purpose:** What action should the recipient take?
3. **Target audience:** Who receives this message? (demographics, relationship stage)
4. **Variables needed:** List of dynamic fields (e.g., {{1}} = customer name, {{2}} = order number)
5. **Language:** Primary language code (e.g., pt_BR, en_US)
6. **Components desired:** Header (text/image/video/document)? Footer? Buttons (quick reply/URL/phone)?

## Steps

### Step 1: Select Category and Validate Use Case
Determine the correct template category:
1. **MARKETING** — Promotions, offers, product launches, re-engagement, newsletters
   - Requires explicit opt-in from recipient
   - Subject to marketing message pricing
2. **UTILITY** — Order updates, shipping notifications, appointment reminders, account alerts
   - Transactional in nature, tied to existing interaction
   - Lower cost than marketing messages
3. **AUTHENTICATION** — OTP codes, login verification, 2FA
   - Must use the authentication template format
   - Auto-generated buttons, strict format requirements

Validate that the stated purpose matches the selected category. Mismatched categories are the top rejection reason.

### Step 2: Design Header Component
Choose and design the header (optional but recommended):
1. **Text header:** Max 60 characters, supports 1 variable
   - Use for personalization: "Hi {{1}}, your order update"
2. **Image header:** JPG or PNG, recommended 800x418px
   - Use for marketing campaigns, product showcases
3. **Video header:** MP4, max 16MB
   - Use for demonstrations, tutorials
4. **Document header:** PDF
   - Use for invoices, receipts, contracts
5. **None:** Skip header for simple messages

### Step 3: Design Body Component
Craft the message body (required, max 1024 characters):
1. Write clear, concise copy aligned with the message purpose
2. Insert variables using `{{N}}` syntax where personalization is needed
3. Apply copywriting best practices:
   - Lead with value or urgency
   - One clear call-to-action per message
   - Use short paragraphs (mobile-first reading)
   - Avoid ALL CAPS, excessive punctuation, or spam-trigger words
4. For MARKETING: include value proposition and clear benefit
5. For UTILITY: include relevant transaction details and next steps
6. For AUTHENTICATION: use the standard OTP format with `{{1}}` for the code

### Step 4: Design Footer and Buttons
Configure optional components:
1. **Footer** (max 60 characters): Typically used for disclaimers or unsubscribe info
   - MARKETING templates should include opt-out language
2. **Quick Reply buttons** (max 3, each max 20 characters):
   - Use for binary choices: "Confirm" / "Cancel"
   - Use for menu options: "View Menu" / "Track Order" / "Talk to Agent"
3. **URL buttons** (max 2):
   - Static URL or dynamic URL with `{{1}}` suffix
   - Label max 20 characters
4. **Phone button** (max 1):
   - Include country code
5. **AUTHENTICATION special:** Use `OTP_TYPE` button (copy code / one-tap)

### Step 5: Compliance Pre-Check
Validate the template against Meta policies before submission:
1. No prohibited content (44+ categories including alcohol, gambling, tobacco, weapons)
2. No misleading claims or false urgency
3. No abusive language or discriminatory content
4. Variables are not used to circumvent content policies
5. MARKETING messages include clear sender identification
6. Opt-out mechanism available (footer or button)
7. Template does not request sensitive data (passwords, financial info in plain text)
8. Language matches the declared language code
9. Character limits respected for all components

### Step 6: Generate API Payload
Build the complete JSON payload for template creation:
1. Construct the `components` array with all designed elements
2. Set `language`, `name` (snake_case, max 512 chars), and `category`
3. Include `example` values for all variables (required for approval)
4. Validate JSON structure against the Graph API schema

### Step 7: Preview and Finalize
Review the complete template:
1. Render a text preview showing how the message will appear
2. Verify all variables are correctly placed and have example values
3. Confirm the template name follows naming conventions
4. Review the full JSON payload for completeness
5. Provide submission instructions (API call or Business Manager UI)

## Output Format

```markdown
# TEMPLATE SPEC

## Template Name: [snake_case_name]
## Category: [MARKETING/UTILITY/AUTHENTICATION]
## Language: [language_code]

### Preview
[Rendered preview of how the message will appear to the recipient]

### Components
- Header: [type] — [content]
- Body: [full text with {{variables}} highlighted]
- Footer: [text]
- Buttons: [list with types]

### Variables
| Variable | Component | Example Value | Description |
|----------|-----------|---------------|-------------|
| {{1}}    | header    | "Maria"       | Customer first name |
| {{1}}    | body      | "12345"       | Order number |

### Compliance Check: [PASS / ISSUES FOUND]
- [checklist results]

### API Payload
```json
{
  "name": "template_name",
  "language": "pt_BR",
  "category": "MARKETING",
  "components": [...]
}
```

### Submission Notes
- [any special instructions or warnings]
```

## Checklist
- [ ] Category validated against use case
- [ ] Header component designed (or explicitly skipped)
- [ ] Body copy written with variables placed
- [ ] Footer and buttons configured
- [ ] Compliance pre-check passed (all 9 points)
- [ ] API JSON payload generated and validated
- [ ] Preview rendered and approved
