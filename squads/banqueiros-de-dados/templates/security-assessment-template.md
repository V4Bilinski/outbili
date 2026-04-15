# Security Assessment Report

| Field          | Value                                   |
|----------------|-----------------------------------------|
| Assessment ID  | [SEC-YYYY-MM-DD-NNN]                   |
| Date           | [YYYY-MM-DD]                            |
| Assessor       | [ASSESSOR_NAME]                         |
| Scope          | [ASSESSMENT_SCOPE]                      |
| Methodology    | STRIDE / OWASP / Both                  |
| Story ID       | [STORY_ID]                              |

---

## Executive Summary

**Overall Risk Level:** [CRITICAL / HIGH / MEDIUM / LOW]

| Severity  | Count |
|-----------|-------|
| Critical  | [N]   |
| High      | [N]   |
| Medium    | [N]   |
| Low       | [N]   |

[EXECUTIVE_SUMMARY — Brief narrative describing the overall security posture, key risks identified, and recommended immediate actions.]

---

## Findings

| ID       | Severity | Category         | Description              | Affected Component | Remediation              | Status       |
|----------|----------|------------------|--------------------------|--------------------|--------------------------|--------------|
| [SEC-01] | [CRITICAL/HIGH/MEDIUM/LOW] | [CATEGORY] | [FINDING_DESCRIPTION] | [COMPONENT] | [REMEDIATION_ACTION] | [OPEN/IN_PROGRESS/RESOLVED] |
| [SEC-02] | [CRITICAL/HIGH/MEDIUM/LOW] | [CATEGORY] | [FINDING_DESCRIPTION] | [COMPONENT] | [REMEDIATION_ACTION] | [OPEN/IN_PROGRESS/RESOLVED] |
| [SEC-03] | [CRITICAL/HIGH/MEDIUM/LOW] | [CATEGORY] | [FINDING_DESCRIPTION] | [COMPONENT] | [REMEDIATION_ACTION] | [OPEN/IN_PROGRESS/RESOLVED] |

**Categories:** Authentication, Authorization, Injection, Data Exposure, Misconfiguration, Cryptography, Input Validation, Session Management

---

## STRIDE Analysis

### Component: [COMPONENT_NAME]

| Threat Category      | Applicable? | Description                    | Mitigation                     | Status   |
|----------------------|-------------|--------------------------------|--------------------------------|----------|
| **S**poofing         | [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |
| **T**ampering        | [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |
| **R**epudiation      | [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |
| **I**nfo Disclosure  | [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |
| **D**enial of Service| [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |
| **E**levation of Priv| [YES/NO]    | [THREAT_DESCRIPTION]           | [MITIGATION_ACTION]            | [STATUS] |

> Repeat the STRIDE section for each component in scope.

---

## RLS Coverage Matrix

| Table              | RLS Enabled | SELECT | INSERT | UPDATE | DELETE | Verified |
|--------------------|-------------|--------|--------|--------|--------|----------|
| [TABLE_NAME]       | [YES/NO]    | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [YES/NO] |
| [TABLE_NAME]       | [YES/NO]    | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [YES/NO] |
| [TABLE_NAME]       | [YES/NO]    | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [POLICY/NONE] | [YES/NO] |

**RLS Coverage:** [PERCENTAGE]% of tables have RLS enabled with verified policies.

---

## Encryption Status

| Data Type          | At Rest    | In Transit | Algorithm          | Key Management     |
|--------------------|------------|------------|--------------------|--------------------|
| [DATA_TYPE]        | [YES/NO]   | [YES/NO]   | [ALGORITHM]        | [KEY_MGMT_METHOD]  |
| [DATA_TYPE]        | [YES/NO]   | [YES/NO]   | [ALGORITHM]        | [KEY_MGMT_METHOD]  |
| [DATA_TYPE]        | [YES/NO]   | [YES/NO]   | [ALGORITHM]        | [KEY_MGMT_METHOD]  |

---

## Recommendations (Prioritized)

| Priority | Recommendation                          | Effort   | Impact   | Deadline      |
|----------|-----------------------------------------|----------|----------|---------------|
| 1        | [RECOMMENDATION]                        | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [YYYY-MM-DD] |
| 2        | [RECOMMENDATION]                        | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [YYYY-MM-DD] |
| 3        | [RECOMMENDATION]                        | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [YYYY-MM-DD] |

---

## Sign-off

| Role              | Name                  | Date         | Signature    |
|-------------------|-----------------------|--------------|--------------|
| Assessed by       | [ASSESSOR_NAME]       | [YYYY-MM-DD] |              |
| Reviewed by       | [REVIEWER_NAME]       | [YYYY-MM-DD] |              |
| Accepted by       | [ACCEPTOR_NAME]       | [YYYY-MM-DD] |              |

---

## Change Log

| Date         | Author          | Change Description                          |
|--------------|-----------------|---------------------------------------------|
| [YYYY-MM-DD] | [AUTHOR_NAME]  | [CHANGE_DESCRIPTION]                        |
