# Task: Design WhatsApp Flow

## Metadata
- task: design-flow
- tier: 2
- agents: [@flow-builder]
- elicit: true
- inputs: flow purpose, screens needed, data collection requirements, backend endpoints
- outputs: Flow JSON definition + endpoint handler template with encryption setup
- quality-gates: [flow JSON valid, screens navigable, data_exchange planned, crypto documented]

## Prerequisites
- WhatsApp Flows feature enabled on the WABA
- Understanding of the business process to be automated
- Backend infrastructure available for data_exchange endpoints
- Knowledge of encryption requirements (RSA + AES-GCM)

## Elicitation

Collect the following before proceeding:
1. **Flow purpose:** booking, lead qualification, survey, purchase, customer support, other
2. **Screens needed:** List of screens with their purpose (max 10 screens per flow)
3. **Data collection:** What fields need to be captured? (name, email, phone, date, selections)
4. **Backend integration:** Will the flow use data_exchange endpoints or be self-contained?
5. **Completion action:** What happens after the flow completes? (send message, create record, trigger workflow)
6. **Branding:** Any specific copy tone, button labels, or validation rules?

## Steps

### Step 1: Define Flow Architecture
Plan the overall flow structure:
1. Map the user journey from entry to completion
2. Define each screen with its purpose:
   - **Screen ID:** Unique identifier (snake_case)
   - **Screen title:** What the user sees (max 80 chars)
   - **Components:** Input fields, text blocks, media, buttons
   - **Navigation:** Which screen comes next based on user action
3. Plan the data model:
   - What data is collected on each screen
   - What data flows between screens
   - What data is sent to the backend
4. Identify decision points where navigation branches
5. Keep the flow under 10 screens (WhatsApp limit)

### Step 2: Design Individual Screens
For each screen, define the components:
1. **TextHeading / TextSubheading / TextBody:** Static text for instructions and context
2. **TextInput:** Free-text fields with validation rules
   - Set `input-type`: text, number, email, phone, password
   - Set `required`: true/false
   - Set `helper-text` for guidance
3. **DatePicker:** Date selection with min/max constraints
4. **RadioButtonsGroup:** Single-select options (use for 2-5 choices)
5. **CheckboxGroup:** Multi-select options
6. **Dropdown:** Single-select for longer lists (6+ options)
7. **OptIn:** Consent/agreement checkboxes (critical for compliance)
8. **Image:** Visual elements (product images, diagrams)
9. **Footer button:** Primary action button per screen (required, max 35 chars)

Design rules:
- Each screen needs exactly ONE footer button
- Place the most important fields first (mobile UX)
- Group related fields logically
- Limit to 4-5 input components per screen to avoid scroll fatigue
- Use helper text for complex fields

### Step 3: Plan Navigation Logic
Define screen transitions:
1. **Linear flow:** Screen A -> Screen B -> Screen C -> Complete
2. **Conditional flow:** Based on user input, skip or branch
   - Example: If "existing customer" -> skip registration screen
3. **Back navigation:** Allow users to return to previous screens
4. **Error handling:** What happens if validation fails
5. Define the `routing_model` for each navigation action:
   - `"navigate"` — go to next screen
   - `"data_exchange"` — call backend before navigating
   - `"complete"` — end the flow

### Step 4: Plan data_exchange Endpoints
For flows requiring backend interaction:
1. Define the endpoint URL for each data_exchange action
2. Plan the request payload structure:
   - `screen`: current screen ID
   - `data`: user-provided data from the screen
   - `flow_token`: session identifier
3. Plan the response structure:
   - `screen`: next screen ID to navigate to
   - `data`: pre-filled data for the next screen
4. Handle error responses:
   - Return appropriate error messages
   - Allow retry or fallback navigation
5. Document timeout handling (WhatsApp enforces 10-second timeout)

### Step 5: Plan Endpoint Encryption
WhatsApp Flows requires encryption for data_exchange:
1. **Key pair generation:**
   - Generate RSA 2048-bit key pair
   - Register public key with WhatsApp via Business Manager
   - Store private key securely on backend
2. **Request decryption flow:**
   - Receive encrypted request from WhatsApp
   - Decrypt AES key using RSA private key
   - Decrypt payload using AES-128-GCM
   - Validate the decrypted data
3. **Response encryption flow:**
   - Generate random AES key and IV
   - Encrypt response with AES-128-GCM
   - Encrypt AES key with WhatsApp public key
   - Return encrypted response
4. Document the crypto implementation for the development team

### Step 6: Generate Flow JSON
Build the complete Flow JSON definition:
1. Set flow metadata: `version` (current: "5.0"), `name`, `categories`
2. Define `data_api_version` if using data_exchange
3. Build the `screens` array with all components
4. Validate the JSON structure:
   - All screen IDs are unique
   - All navigation targets reference valid screen IDs
   - Required fields are marked correctly
   - Component types and properties are valid
5. Include `routing_model` configuration

### Step 7: Generate Handler Skeleton
Provide a backend handler template:
1. Express.js / Node.js handler for the data_exchange endpoint
2. Include encryption/decryption boilerplate
3. Include request validation and screen routing logic
4. Include error handling patterns
5. Include logging for debugging
6. Add comments for customization points

## Output Format

```markdown
# WHATSAPP FLOW SPEC

## Flow Name: [name]
## Purpose: [description]
## Screens: [count]
## Uses data_exchange: [YES/NO]

### Flow Diagram
[Screen A] → [Screen B] → [Screen C] → [Complete]
                ↓ (condition)
           [Screen D] → [Complete]

### Screen Definitions
#### Screen 1: [screen_id] — [Title]
- Components: [list]
- Data collected: [fields]
- Navigation: → [next screen]

### Flow JSON
```json
{
  "version": "5.0",
  "screens": [...]
}
```

### Endpoint Handler (skeleton)
```javascript
// data_exchange handler
```

### Encryption Setup Guide
1. [Key generation steps]
2. [Registration steps]
3. [Implementation notes]

### Testing Checklist
- [ ] Flow renders correctly in preview
- [ ] All navigation paths work
- [ ] Data validation triggers on invalid input
- [ ] data_exchange endpoints respond within 10s
- [ ] Encryption/decryption working end-to-end
```

## Checklist
- [ ] Flow architecture mapped with all screens
- [ ] Individual screens designed with components
- [ ] Navigation logic defined (linear + conditional)
- [ ] data_exchange endpoints planned (if applicable)
- [ ] Encryption implementation documented
- [ ] Flow JSON generated and validated
- [ ] Handler skeleton generated with crypto boilerplate
