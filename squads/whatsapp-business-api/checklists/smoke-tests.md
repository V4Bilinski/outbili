# Smoke Tests — WhatsApp Business API Squad

Validation checklist for agent activation, command execution, and structural integrity.
Run after any squad modification to ensure nothing is broken.

## 1. Structural Integrity

- [ ] `squad.yaml` parses without YAML errors
- [ ] All 8 agent files exist in `agents/` and are valid Markdown
- [ ] All 12 task files exist in `tasks/`
- [ ] All 3 workflow files exist in `workflows/`
- [ ] All 3 checklist files exist in `checklists/`
- [ ] All 3 template files exist in `templates/`
- [ ] All 10 data files exist in `data/`
- [ ] All 4 rule files exist in `rules/`
- [ ] All 3 config files exist in `config/`
- [ ] `tool-overrides.yaml` exists and parses without errors
- [ ] `README.md` exists and references current version

## 2. squad.yaml Validation

- [ ] `version` field is present and follows semver
- [ ] `icon`, `slashPrefix`, `patternPrefix` are defined
- [ ] `tiers` section references valid agent IDs only
- [ ] `profiles` section references valid agent IDs only
- [ ] `commands` section groups are non-empty
- [ ] `quality_standards` has all 4 dimensions (delivery, templates, integration, compliance)
- [ ] `agents[]` lists match files in `agents/` directory
- [ ] `tasks[]` lists match files in `tasks/` directory
- [ ] `data[]` lists match files in `data/` directory

## 3. Agent L0-L1-L2 Format

For each agent in `agents/*.md`, verify:

### Level 0 (Loader)
- [ ] `IDE-FILE-RESOLUTION` block present with `base_path`
- [ ] `REQUEST-RESOLUTION` block present with at least 3 command mappings
- [ ] `activation-instructions` with STEP 1-4 and HALT
- [ ] `command_loader` with at least 1 command entry
- [ ] Each command_loader entry has `requires` and optionally `optional`
- [ ] `dependencies` section lists tasks, workflows, checklists, data as applicable

### Level 1 (Identity)
- [ ] `agent` block with: name, id, title, icon, tier, whenToUse
- [ ] `scope.does` with at least 3 entries
- [ ] `scope.does_not` with at least 2 entries
- [ ] `metadata` with version and architecture
- [ ] `persona` with role, style, identity, focus

### Level 2 (Frameworks)
- [ ] `core_principles` with at least 3 entries
- [ ] `operational_frameworks` or equivalent section present
- [ ] `never` list with at least 3 entries

## 4. Cross-Reference Validation

- [ ] Every task in `command_loader.requires` exists in `tasks/`
- [ ] Every data file in `command_loader.optional` exists in `data/`
- [ ] Every rule file referenced exists in `rules/`
- [ ] Every config file referenced exists in `config/`
- [ ] Every checklist referenced exists in `checklists/`
- [ ] `data/agent-routing-matrix.yaml` references all 8 agent IDs
- [ ] `data/veto-conditions.yaml` has 15 veto conditions

## 5. Agent Activation Smoke Test

For each agent, verify activation flow works:

| Agent | Activation | Expected Greeting |
|-------|-----------|-------------------|
| @whatsapp-chief | `@whatsapp-chief` | "📱 Zap, Director..." |
| @cloud-api-architect | `@cloud-api-architect` | "🏗️ Atlas, Cloud API..." |
| @template-strategist | `@template-strategist` | "✨ Nova, Template..." |
| @compliance-guardian | `@compliance-guardian` | "🛡️ Shield, Compliance..." |
| @campaign-optimizer | `@campaign-optimizer` | "📊 Pulse, Campaign..." |
| @integration-engineer | `@integration-engineer` | "🔗 Link, Integration..." |
| @flow-builder | `@flow-builder` | "🔀 Flux, WhatsApp Flows..." |
| @utility-validator | `@utility-validator` | "🔧 Forge, Utility..." |

- [ ] Agent displays greeting with correct icon and persona name
- [ ] Agent shows available commands
- [ ] Agent HALTs after greeting (no auto-execution)
- [ ] Agent responds correctly to `*help`

## 6. Command Execution Smoke Test

Test at least one command from each agent:

| Agent | Command | Expected Behavior |
|-------|---------|-------------------|
| @whatsapp-chief | `*team` | Lists all 8 specialists |
| @cloud-api-architect | `*error 130429` | Returns rate limit diagnosis |
| @template-strategist | `*category-guide` | Shows category decision tree |
| @compliance-guardian | `*content-scan` | Scans for prohibited words |
| @campaign-optimizer | `*quality-monitor` | Shows quality score assessment |
| @integration-engineer | `*dedup` | Shows Redis SET NX pattern |
| @flow-builder | `*pattern` | Shows flow patterns (booking, survey) |
| @utility-validator | `*validate` | Runs PACTO validation |

- [ ] Command loads required task file
- [ ] Command produces structured output
- [ ] Command references correct arsenal/ or data/ files

## 7. Workflow Smoke Test

- [ ] `template-lifecycle.yaml` parses and has 6+ steps
- [ ] `campaign-execution.yaml` parses and references template-lifecycle as nested
- [ ] `integration-setup.yaml` parses and ends with go-live step
- [ ] All workflow steps reference existing tasks or agents

## 8. Pre-Send Validator

```bash
# Test PACTO scoring
node scripts/pre-send-validator.js --text "Confirmada: sua consulta com Dr. Silva"
# Expected: score >= 70, P_status_word: PASS

# Test prohibited word detection
node scripts/pre-send-validator.js --text "Aproveite nossa promoção exclusiva"
# Expected: score < 50, prohibited_words found
```

- [ ] PACTO scoring returns valid 0-100 score
- [ ] Prohibited words are detected correctly
- [ ] Status words are identified correctly
- [ ] Component limit validation works

## Verdict

| Result | Criteria |
|--------|----------|
| **PASS** | All sections have 100% checkmarks |
| **PASS WITH NOTES** | Sections 1-4 pass, sections 5-8 have minor issues |
| **FAIL** | Any item in sections 1-4 fails |
