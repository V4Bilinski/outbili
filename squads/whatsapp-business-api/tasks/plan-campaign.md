# Task: Campaign Planning

## Metadata
- task: plan-campaign
- tier: 1
- agents: [@campaign-optimizer]
- elicit: true
- inputs: campaign goal, target audience, message category, budget, timeline
- outputs: campaign plan document with template specs, segmentation, timing, metrics
- quality-gates: [objectives defined, audience segmented, templates specified, timing optimized, metrics set]

## Prerequisites
- Account health diagnosis completed (quality score GREEN preferred)
- Messaging tier sufficient for planned volume (or upgrade path identified)
- Approved templates available or template creation planned
- Audience data available with opt-in status verified

## Elicitation

Collect the following before proceeding:
1. **Campaign goal:** What is the primary objective? (sales, re-engagement, onboarding, retention, event promotion, feedback collection)
2. **Target audience:** Who are the recipients? (segment description, estimated volume, relationship stage)
3. **Message category:** MARKETING or UTILITY? (impacts pricing and opt-in requirements)
4. **Budget:** Available budget for messaging costs (per-conversation pricing varies by category and country)
5. **Timeline:** Campaign start date, duration, any fixed deadlines
6. **Existing assets:** Available templates, media assets, landing pages

## Steps

### Step 1: Define Campaign Objectives
Establish clear, measurable goals:
1. Set the **primary objective** (one per campaign):
   - **Sales:** Drive purchases or sign-ups (conversion-focused)
   - **Re-engagement:** Reactivate dormant contacts (win-back)
   - **Onboarding:** Welcome and educate new contacts (nurture)
   - **Retention:** Reduce churn, increase loyalty (relationship)
   - **Event:** Drive registrations or attendance (time-bound)
   - **Feedback:** Collect NPS, reviews, or survey data (research)
2. Define **success metrics** with specific targets:
   - Open rate target (benchmark: 85-95% for WhatsApp)
   - Reply rate target (benchmark: 15-25% for well-targeted campaigns)
   - Conversion rate target (varies by objective)
   - Opt-out rate ceiling (keep below 2%)
   - Block rate ceiling (keep below 1%)
3. Set **quality score protection thresholds:**
   - If quality drops to YELLOW: reduce volume by 50%
   - If quality drops to RED: pause campaign immediately

### Step 2: Segment Target Audience
Define audience segments for targeted messaging:
1. **Segment by relationship stage:**
   - New leads (< 30 days since opt-in)
   - Active customers (purchase in last 90 days)
   - Dormant contacts (no interaction in 90+ days)
   - VIP/high-value (top 20% by revenue or engagement)
2. **Segment by behavior:**
   - Previous campaign responders vs. non-responders
   - Product category affinity
   - Engagement frequency (daily, weekly, monthly)
3. **Segment by demographics (if available):**
   - Geographic region (important for timezone and language)
   - Age group, gender, preferences
4. **Validate opt-in status for each segment:**
   - Confirm explicit marketing consent exists
   - Remove contacts who opted out or were inactive for 12+ months
   - Verify phone number validity (remove invalid/disconnected)
5. **Estimate segment sizes** and validate against messaging tier limits

### Step 3: Select and Design Templates
Plan the message templates for each campaign phase:
1. **Map the message sequence:**
   - Initial message (day 0): Main campaign offer/content
   - Follow-up (day 1-3): Reminder for non-responders
   - Final push (day 5-7): Last chance / urgency (if applicable)
   - Thank you / confirmation: For those who converted
2. **Select template category** for each message:
   - MARKETING for promotional content (requires opt-in)
   - UTILITY for transactional follow-ups (order confirmations, receipts)
3. **Design template specifications:**
   - Header type and content (text, image, or video)
   - Body copy with personalization variables
   - CTA buttons (URL, quick reply, phone)
   - Footer with opt-out option for MARKETING messages
4. **Plan media assets** needed:
   - Images: 800x418px recommended, < 5MB
   - Videos: MP4, < 16MB, 3:2 or 9:16 aspect ratio
5. Delegate to `create-template` task for each template needed

### Step 4: Plan Campaign Timing
Optimize send times for maximum engagement:
1. **Brazil timezone considerations:**
   - BRT (UTC-3): Sao Paulo, Rio, Brasilia — majority of population
   - AMT (UTC-4): Manaus, Cuiaba
   - ACT (UTC-5): Rio Branco
   - FNT (UTC-2): Fernando de Noronha
2. **Optimal send windows (Brazil market):**
   - B2C: Tuesday-Thursday, 10:00-12:00 or 14:00-16:00 BRT
   - B2B: Tuesday-Thursday, 09:00-11:00 BRT
   - E-commerce: Thursday-Friday for weekend purchases
   - Avoid: Mondays before 10:00, Fridays after 16:00, weekends (unless retail)
3. **Pacing strategy** (critical for quality score protection):
   - Never send full volume on day 1 — ramp up gradually
   - Day 1: 20% of total volume (test segment)
   - Day 2: 30% if metrics are healthy
   - Day 3+: Remaining volume
   - Monitor block/report rates between batches
4. **Frequency limits:**
   - Max 1 marketing message per contact per week
   - Max 3 marketing messages per contact per month
   - Utility messages exempt from frequency caps (but respect user experience)

### Step 5: Budget and Cost Planning
Calculate messaging costs and optimize spend:
1. **Per-conversation pricing (Brazil, approximate):**
   - Marketing conversations: ~R$0.50 per conversation
   - Utility conversations: ~R$0.15 per conversation
   - Authentication conversations: ~R$0.20 per conversation
   - Service conversations: free (user-initiated, 24h window)
2. **Calculate total campaign cost:**
   - Volume per segment x price per category = segment cost
   - Add 10% buffer for retries and follow-ups
   - Compare against budget constraints
3. **Optimize for ROI:**
   - Start with highest-value segments
   - Use UTILITY templates where legitimately applicable (lower cost)
   - Bundle messages within the 24h conversation window when possible
4. **Set budget alerts:**
   - 50% budget consumed: review metrics and adjust
   - 80% budget consumed: decide on continuation
   - 100% budget: pause remaining sends

### Step 6: Define Monitoring and Success Metrics
Set up real-time monitoring for the campaign:
1. **Real-time metrics to track:**
   - Messages sent / delivered / read / failed (per hour)
   - Reply rate and sentiment (positive/neutral/negative)
   - Opt-out rate (per batch)
   - Block/report rate (per batch)
   - Quality score changes
2. **Alerting thresholds:**
   - Opt-out rate > 2% per batch: review content and targeting
   - Block rate > 1% per batch: pause and investigate
   - Delivery failure > 10%: check number validity and API health
   - Quality score changes to YELLOW: reduce volume by 50%
3. **Post-campaign analysis plan:**
   - Overall conversion rate and ROI
   - Best/worst performing segments
   - Best/worst performing templates
   - Optimal send time confirmation
   - Lessons learned for future campaigns

## Output Format

```markdown
# CAMPAIGN PLAN

## Campaign: [Name]
## Objective: [Primary goal]
## Timeline: [Start] to [End]
## Budget: R$ [amount]

### Target Audience
| Segment | Size | Category | Opt-in Status |
|---------|------|----------|---------------|
| [name]  | [n]  | [type]   | [verified]    |

### Message Sequence
| Day | Message | Template | Segment | Volume |
|-----|---------|----------|---------|--------|
| 0   | Initial | [name]   | All     | [n]    |
| 2   | Follow-up | [name] | Non-resp | [n]   |
| 5   | Final   | [name]   | Non-resp | [n]   |

### Timing Plan
- Send window: [time range] BRT
- Pacing: [ramp-up schedule]
- Frequency: [limits]

### Budget Breakdown
| Item | Volume | Unit Cost | Total |
|------|--------|-----------|-------|
| Marketing msgs | [n] | R$0.50 | R$[x] |
| Utility msgs | [n] | R$0.15 | R$[x] |
| **Total** | | | **R$[x]** |

### Success Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Open rate | [%] | < [%] |
| Reply rate | [%] | < [%] |
| Conversion | [%] | < [%] |
| Opt-out | < [%] | > [%] |
| Block rate | < [%] | > [%] |

### Quality Protection Rules
1. [rule 1]
2. [rule 2]
```

## Checklist
- [ ] Campaign objectives defined with measurable targets
- [ ] Audience segmented and opt-in verified
- [ ] Template specifications designed for each message
- [ ] Send timing optimized for Brazil market
- [ ] Budget calculated with cost breakdown
- [ ] Success metrics and alerting thresholds defined
