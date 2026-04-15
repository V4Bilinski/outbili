# Task: Quality Score Optimization

## Metadata
- task: optimize-quality
- tier: 1
- agents: [@campaign-optimizer]
- elicit: false
- inputs: current quality rating, messaging volume data, template performance metrics
- outputs: quality optimization plan with specific actions and timeline
- quality-gates: [current state diagnosed, root causes identified, action plan with timeline, monitoring alerts defined]

## Prerequisites
- Account health diagnosis completed (`diagnose-account` task)
- Access to messaging analytics (delivery rates, block rates, report rates)
- Template performance data available (read rates, reply rates per template)

## Steps

### Step 1: Diagnose Current Quality State
Assess the current quality situation in detail:
1. **Retrieve quality rating:** GREEN, YELLOW, or RED
2. **Determine messaging tier:** TIER_1K, TIER_10K, TIER_100K, TIER_UNLIMITED
3. **Check if tier was recently downgraded** (indicates quality problems)
4. **Gather key metrics for the last 30 days:**
   - Total messages sent per day (volume trend)
   - Delivery rate (delivered / sent)
   - Read rate (read / delivered)
   - Block rate (users who blocked the number)
   - Report rate (users who reported messages as spam)
   - Reply rate (user replies / messages delivered)
5. **Map quality trajectory:**
   - Was quality always at this level?
   - When did degradation start?
   - What changed? (new templates, volume increase, new segments)

### Step 2: Identify Problem Areas
Analyze root causes of quality degradation:
1. **Block analysis:**
   - Which templates have the highest block rate?
   - Which audience segments block most frequently?
   - Are blocks correlated with send time or frequency?
   - Threshold: > 0.3% block rate per template is concerning
2. **Report analysis:**
   - Which messages generate spam reports?
   - Is the opt-in process capturing genuine consent?
   - Are messages matching recipient expectations?
   - Threshold: > 0.1% report rate is a red flag
3. **Read rate analysis:**
   - Which templates have low read rates? (below 70%)
   - Could low reads indicate irrelevant content or poor targeting?
   - Are read rates declining over time? (content fatigue)
4. **Frequency analysis:**
   - Are some contacts receiving too many messages?
   - Is there a correlation between message frequency and blocks?
   - Recommended: max 4-8 marketing messages per contact per month
5. **Content analysis:**
   - Are templates using aggressive or misleading language?
   - Do templates deliver on the promises made?
   - Is content culturally appropriate for the target market?

### Step 3: Recommend Template Improvements
Provide specific template-level recommendations:
1. **For high-block templates:**
   - Rewrite with clearer value proposition
   - Add opt-out button (if missing)
   - Reduce frequency of use
   - Consider retiring and replacing with new template
2. **For low-read templates:**
   - Improve header copy (first thing recipients see)
   - Test with image/video headers vs. text headers
   - Shorten body copy (mobile-first)
   - Strengthen the opening line
3. **For low-reply templates:**
   - Add interactive elements (quick reply buttons)
   - Include a clear question or call to action
   - Personalize beyond just the name variable
   - Test different CTA phrasings
4. **General improvements:**
   - Ensure every template has a clear, single purpose
   - A/B test template variations (different headers, CTAs)
   - Refresh templates every 60-90 days to combat fatigue
   - Use UTILITY category for genuinely transactional messages

### Step 4: Plan Tier Upgrade Path
Create a roadmap to reach higher messaging tiers:
1. **Tier progression rules:**
   - TIER_1K → TIER_10K: Send quality messages to 1,000 unique users in 24h
   - TIER_10K → TIER_100K: Send quality messages to 10,000 unique users in 24h
   - TIER_100K → TIER_UNLIMITED: Send quality messages to 100,000 unique users in 24h
   - Quality must be GREEN or YELLOW for upgrade (never upgrades from RED)
   - Upgrades are automatic, checked every 24 hours
2. **If currently RED:**
   - Immediately reduce volume to minimum necessary messages
   - Pause all marketing campaigns
   - Send only high-value utility messages
   - Expected recovery to YELLOW: 7-14 days of clean messaging
   - Expected recovery to GREEN: 14-30 days after reaching YELLOW
3. **If currently YELLOW:**
   - Reduce marketing volume by 50%
   - Audit and fix problematic templates (Step 3)
   - Focus on high-engagement segments only
   - Expected recovery to GREEN: 7-14 days of improved metrics
4. **If currently GREEN (seeking tier upgrade):**
   - Gradually increase daily unique recipients
   - Maintain quality metrics during ramp-up
   - Send to most engaged segments first
   - Monitor quality score daily during upgrade period
5. **Volume ramp-up schedule for tier upgrades:**
   - Week 1: 25% of target tier volume
   - Week 2: 50% of target tier volume
   - Week 3: 75% of target tier volume
   - Week 4: 100% of target tier volume (trigger upgrade check)

### Step 5: Set Monitoring Alerts
Define ongoing monitoring to protect quality:
1. **Daily monitoring dashboard:**
   - Quality rating check (API query)
   - Messaging tier status
   - Daily send volume vs. tier limit
   - Block rate (last 24h)
   - Report rate (last 24h)
2. **Alert thresholds:**
   | Metric | Warning | Critical | Action |
   |--------|---------|----------|--------|
   | Block rate | > 0.3% | > 0.5% | Pause template, investigate |
   | Report rate | > 0.1% | > 0.2% | Pause campaign, review content |
   | Quality score | YELLOW | RED | Execute Step 4 recovery plan |
   | Delivery failure | > 5% | > 15% | Check number list validity |
   | Read rate drop | > 15% decline | > 30% decline | Refresh templates |
3. **Weekly review cadence:**
   - Monday: Review previous week metrics
   - Wednesday: Mid-week quality check
   - Friday: Weekend send planning (reduce volume)
4. **Automated responses to alerts:**
   - WARNING alert: Notify team, reduce volume by 25%
   - CRITICAL alert: Auto-pause campaigns, escalate to team lead
   - Quality downgrade: Execute recovery plan immediately

## Output Format

```markdown
# QUALITY OPTIMIZATION PLAN

## Account: [WABA Name]
## Current Quality: [GREEN/YELLOW/RED]
## Current Tier: [TIER_1K/10K/100K/UNLIMITED]
## Date: [YYYY-MM-DD]

### Diagnosis Summary
- Quality rating: [rating] (trend: [improving/stable/declining])
- Block rate (30d avg): [percentage]%
- Report rate (30d avg): [percentage]%
- Read rate (30d avg): [percentage]%
- Root cause: [primary cause of quality issues]

### Problem Areas
1. [problem] — Impact: [HIGH/MEDIUM/LOW] — Root cause: [cause]
2. ...

### Template Actions
| Template | Issue | Action | Priority | Deadline |
|----------|-------|--------|----------|----------|
| [name] | High blocks | Rewrite + reduce freq | HIGH | [date] |
| [name] | Low reads | New header + shorten | MEDIUM | [date] |

### Tier Upgrade Roadmap
- Current: [tier] → Target: [tier]
- Estimated timeline: [weeks]
- Volume ramp schedule: [week-by-week plan]

### Monitoring Setup
| Metric | Warning | Critical | Auto-Action |
|--------|---------|----------|-------------|
| Block rate | [%] | [%] | [action] |
| Report rate | [%] | [%] | [action] |

### Recovery Timeline
- Week 1: [actions]
- Week 2: [actions]
- Week 3: [expected milestone]
- Week 4: [expected outcome]
```

## Checklist
- [ ] Current quality state fully diagnosed with 30-day metrics
- [ ] Problem areas identified with root causes
- [ ] Template-specific improvements recommended
- [ ] Tier upgrade path planned with volume ramp schedule
- [ ] Monitoring alerts defined with thresholds and auto-actions
