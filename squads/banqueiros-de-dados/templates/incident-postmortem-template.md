# Incident Postmortem

| Field              | Value                                   |
|--------------------|-----------------------------------------|
| Incident ID        | [INC-YYYY-MM-DD-NNN]                   |
| Date               | [YYYY-MM-DD]                            |
| Severity           | P1 / P2 / P3 / P4                      |
| Duration           | [TOTAL_DURATION]                        |
| Affected Services  | [SERVICE_LIST]                          |
| Story ID           | [STORY_ID] (if applicable)              |
| Author             | [AUTHOR_NAME]                           |

---

## Timeline

| Timestamp           | Event                                   | Actor            |
|---------------------|-----------------------------------------|------------------|
| [YYYY-MM-DD HH:MM] | **Detection:** [HOW_DETECTED]           | [WHO/WHAT]       |
| [YYYY-MM-DD HH:MM] | **Response initiated:** [FIRST_ACTION]  | [RESPONDER]      |
| [YYYY-MM-DD HH:MM] | **Escalation:** [ESCALATION_ACTION]     | [RESPONDER]      |
| [YYYY-MM-DD HH:MM] | **Mitigation applied:** [MITIGATION]    | [RESPONDER]      |
| [YYYY-MM-DD HH:MM] | **Resolution confirmed:** [RESOLUTION]  | [RESPONDER]      |

| Metric                   | Value          |
|--------------------------|----------------|
| Time to Detection (TTD)  | [DURATION]     |
| Time to Response (TTR)   | [DURATION]     |
| Time to Mitigation (TTM) | [DURATION]     |
| Time to Resolution       | [DURATION]     |

---

## Impact

### Users Affected

[USER_IMPACT — Number of users affected, which user segments, geographic regions, etc.]

### Data Affected

[DATA_IMPACT — Was data lost, corrupted, or exposed? Quantify if possible. Include data classification level.]

### SLA Breach

| SLA Metric         | Target          | Actual          | Breached? |
|--------------------|-----------------|-----------------|-----------|
| [SLA_METRIC]       | [TARGET_VALUE]  | [ACTUAL_VALUE]  | [YES/NO]  |
| [SLA_METRIC]       | [TARGET_VALUE]  | [ACTUAL_VALUE]  | [YES/NO]  |

### Financial Impact

[FINANCIAL_IMPACT — Estimated cost: lost revenue, remediation effort, customer credits, etc.]

---

## Root Cause Analysis

### 5 Whys

1. **Why did the incident occur?**
   [ANSWER_1]

2. **Why did [ANSWER_1] happen?**
   [ANSWER_2]

3. **Why did [ANSWER_2] happen?**
   [ANSWER_3]

4. **Why did [ANSWER_3] happen?**
   [ANSWER_4]

5. **Why did [ANSWER_4] happen?**
   [ROOT_CAUSE]

### Root Cause Summary

[ROOT_CAUSE_SUMMARY — One paragraph describing the definitive root cause.]

---

## Contributing Factors

- [FACTOR_1 — Environmental, process, or tooling factor that contributed to the incident.]
- [FACTOR_2 — Any gaps in monitoring, alerting, or documentation.]
- [FACTOR_3 — Team knowledge gaps, missing runbooks, or communication failures.]

---

## What Went Well

- [POSITIVE_1 — Effective actions taken during response.]
- [POSITIVE_2 — Tools or processes that worked as intended.]
- [POSITIVE_3 — Team behaviors that helped contain or resolve the incident.]

---

## What Went Wrong

- [NEGATIVE_1 — Delays in detection or response.]
- [NEGATIVE_2 — Tools or processes that failed or were missing.]
- [NEGATIVE_3 — Communication breakdowns or knowledge gaps.]

---

## Action Items

| ID   | Action                              | Owner           | Priority     | Deadline      | Status       |
|------|-------------------------------------|-----------------|--------------|---------------|--------------|
| AI-1 | [ACTION_DESCRIPTION]                | [OWNER_NAME]    | [P1/P2/P3]  | [YYYY-MM-DD]  | [OPEN/IN_PROGRESS/DONE] |
| AI-2 | [ACTION_DESCRIPTION]                | [OWNER_NAME]    | [P1/P2/P3]  | [YYYY-MM-DD]  | [OPEN/IN_PROGRESS/DONE] |
| AI-3 | [ACTION_DESCRIPTION]                | [OWNER_NAME]    | [P1/P2/P3]  | [YYYY-MM-DD]  | [OPEN/IN_PROGRESS/DONE] |
| AI-4 | [ACTION_DESCRIPTION]                | [OWNER_NAME]    | [P1/P2/P3]  | [YYYY-MM-DD]  | [OPEN/IN_PROGRESS/DONE] |

---

## Lessons Learned

1. [LESSON_1 — Key takeaway and how it changes future behavior.]
2. [LESSON_2 — Process improvement identified.]
3. [LESSON_3 — Technical improvement identified.]

---

## Prevention Measures

| Measure                             | Type            | Estimated Effort | Story Created? |
|-------------------------------------|-----------------|------------------|----------------|
| [PREVENTION_MEASURE_1]             | [PROCESS/TECHNICAL/MONITORING] | [LOW/MED/HIGH] | [STORY_ID/NO] |
| [PREVENTION_MEASURE_2]             | [PROCESS/TECHNICAL/MONITORING] | [LOW/MED/HIGH] | [STORY_ID/NO] |
| [PREVENTION_MEASURE_3]             | [PROCESS/TECHNICAL/MONITORING] | [LOW/MED/HIGH] | [STORY_ID/NO] |

---

## Change Log

| Date         | Author          | Change Description                          |
|--------------|-----------------|---------------------------------------------|
| [YYYY-MM-DD] | [AUTHOR_NAME]  | [CHANGE_DESCRIPTION]                        |
