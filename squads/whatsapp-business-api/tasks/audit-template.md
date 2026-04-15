# Task: Audit Existing Templates

## Metadata
- task: audit-template
- tier: 1
- agents: [@template-strategist, @compliance-guardian]
- elicit: false
- inputs: WABA ID, template name or list of templates to audit
- outputs: template audit report with scores and improvement recommendations
- quality-gates: [all templates scored, compliance verified, recommendations provided]

## Prerequisites
- WABA ID and API access available
- At least one active template to audit
- Access to template performance metrics (if available)

## Steps

### Step 1: Retrieve Template Inventory
Gather all templates for analysis:
1. Fetch templates via `GET /{waba-id}/message_templates`
2. Filter by scope: audit all templates or a specified subset
3. For each template, record:
   - Name, category, language, status
   - Components (header, body, footer, buttons)
   - Variable count and types
   - Creation date and last modified date
4. Organize templates by category (MARKETING / UTILITY / AUTHENTICATION)

### Step 2: Analyze Template Structure (@template-strategist)
Evaluate the quality of each template's design:
1. **Header effectiveness** (0-10):
   - Does it grab attention? Is media appropriate for the use case?
   - Is personalization used effectively?
2. **Body copy quality** (0-10):
   - Clarity of message and call-to-action
   - Appropriate length (concise for mobile)
   - Proper use of formatting (bold, italic, line breaks)
   - Value proposition clarity
3. **Button/CTA design** (0-10):
   - Are buttons action-oriented?
   - Is the primary action obvious?
   - Are quick replies relevant and concise?
4. **Variable usage** (0-10):
   - Personalization adds value (not just name-dropping)
   - Variables are placed naturally in the copy
   - Example values are realistic and helpful for reviewers
5. **Overall coherence** (0-10):
   - Components work together as a unified message
   - Tone matches the category and audience

### Step 3: Compliance Validation (@compliance-guardian)
Check each template against Meta policies and local regulations:
1. **Content policy compliance:**
   - No prohibited categories (44+ categories)
   - No misleading claims or deceptive content
   - No excessive use of special characters or emojis
   - No URL shorteners that mask destination
2. **Category accuracy:**
   - Template content matches declared category
   - MARKETING templates are not disguised as UTILITY
   - UTILITY templates contain genuine transactional content
3. **Opt-out compliance:**
   - MARKETING templates include opt-out mechanism
   - Opt-out language is clear and accessible
4. **LGPD / data privacy:**
   - No unnecessary collection of personal data
   - Sensitive data handling follows privacy guidelines
5. **Language and localization:**
   - Content matches declared language code
   - Cultural appropriateness for target market (Brazil focus)

### Step 4: Evaluate Quality Signals
Assess predictive quality indicators:
1. **Approval likelihood:** Based on structure, content, and category alignment
   - HIGH: Clean structure, compliant content, clear purpose
   - MEDIUM: Minor issues that may trigger manual review
   - LOW: Policy violations or category mismatch detected
2. **Engagement prediction:** Based on copy quality and CTA design
   - Estimate read rate, reply rate, and click-through potential
3. **Block/report risk:** Identify content that may trigger user complaints
   - Aggressive sales language, high frequency potential, irrelevant content
4. **Longevity assessment:** Will this template remain relevant and compliant?

### Step 5: Score and Rank Templates
Generate a composite score for each template:
1. Calculate **Structure Score** (average of Step 2 dimensions): 0-10
2. Calculate **Compliance Score** (Step 3 pass rate): 0-100%
3. Calculate **Quality Signal Score** (Step 4 assessment): 0-10
4. Compute **Overall Template Score**: weighted average
   - Structure: 35%, Compliance: 40%, Quality Signals: 25%
5. Rank templates from highest to lowest score
6. Flag templates scoring below 60% overall as **NEEDS IMPROVEMENT**
7. Flag templates with compliance failures as **REQUIRES ACTION**

### Step 6: Generate Audit Report
Compile all findings into a comprehensive report:
1. Executive summary with portfolio health overview
2. Individual template scorecards
3. Compliance issues requiring immediate action
4. Improvement recommendations prioritized by impact
5. Template retirement candidates (low score + low usage)
6. New template suggestions to fill gaps in the portfolio

## Output Format

```markdown
# TEMPLATE AUDIT REPORT

## Account: [WABA Name]
## Date: [YYYY-MM-DD]
## Templates Audited: [count]

### Portfolio Summary
- Total templates: [number]
- Average score: [number]/100
- Compliance pass rate: [percentage]%
- Templates needing action: [number]

### Category Breakdown
| Category | Count | Avg Score | Compliance |
|----------|-------|-----------|------------|
| MARKETING | [n] | [score] | [%] |
| UTILITY | [n] | [score] | [%] |
| AUTHENTICATION | [n] | [score] | [%] |

### Individual Template Scorecards
#### [Template Name] — [SCORE]/100
- Category: [category] | Status: [status]
- Structure: [score]/10 | Compliance: [PASS/FAIL] | Quality: [score]/10
- Issues: [list]
- Recommendations: [list]

### Critical Actions Required
1. [COMPLIANCE] [template name] — [issue and fix]
2. ...

### Improvement Recommendations
1. [template name] — [specific improvement with expected impact]
2. ...

### Retirement Candidates
- [template name] — Reason: [low score / outdated / redundant]

### Suggested New Templates
- [purpose] — [category] — [rationale]
```

## Checklist
- [ ] Template inventory retrieved and organized
- [ ] Structure analysis completed for all templates
- [ ] Compliance validation performed by @compliance-guardian
- [ ] Quality signals evaluated for each template
- [ ] Scores calculated and templates ranked
- [ ] Audit report generated with actionable recommendations
