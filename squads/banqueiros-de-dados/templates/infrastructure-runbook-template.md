# Infrastructure Runbook

| Field             | Value                                   |
|-------------------|-----------------------------------------|
| Runbook ID        | [RB-NNN]                                |
| Service           | [SERVICE_NAME]                          |
| Last Updated      | [YYYY-MM-DD]                            |
| Owner             | [OWNER_NAME]                            |
| Review Frequency  | Monthly / Quarterly / Biannually        |
| Next Review       | [YYYY-MM-DD]                            |

---

## Overview

### What This Runbook Covers

[RUNBOOK_SCOPE — Describe the service or system this runbook addresses, its purpose, and what operations are documented here.]

### When to Use

[USAGE_CONTEXT — Specific scenarios that trigger the use of this runbook: alerts, scheduled maintenance, scaling events, recovery procedures, etc.]

### Architecture Context

[ARCHITECTURE_BRIEF — Brief description of how this service fits into the broader system. Include relevant dependencies and data flow.]

---

## Prerequisites

### Access Required

| System/Tool        | Access Level    | How to Request            |
|--------------------|-----------------|---------------------------|
| [SYSTEM_NAME]      | [ACCESS_LEVEL]  | [REQUEST_PROCEDURE]       |
| [SYSTEM_NAME]      | [ACCESS_LEVEL]  | [REQUEST_PROCEDURE]       |
| [SYSTEM_NAME]      | [ACCESS_LEVEL]  | [REQUEST_PROCEDURE]       |

### Tools Needed

- [TOOL_1 — Version requirement, installation notes]
- [TOOL_2 — Version requirement, installation notes]
- [TOOL_3 — Version requirement, installation notes]

### Environment Variables

| Variable            | Description                | Where to Find             |
|---------------------|----------------------------|---------------------------|
| [ENV_VAR_NAME]      | [DESCRIPTION]              | [LOCATION]                |
| [ENV_VAR_NAME]      | [DESCRIPTION]              | [LOCATION]                |

---

## Procedures

### Procedure 1: [PROCEDURE_NAME]

**Purpose:** [PROCEDURE_PURPOSE]
**Estimated Time:** [DURATION]
**Risk Level:** [LOW/MEDIUM/HIGH]

| Step | Action                              | Command / SQL                        | Expected Output                | If Fails                       |
|------|-------------------------------------|--------------------------------------|--------------------------------|--------------------------------|
| 1    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |
| 2    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |
| 3    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |
| 4    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |

### Procedure 2: [PROCEDURE_NAME]

**Purpose:** [PROCEDURE_PURPOSE]
**Estimated Time:** [DURATION]
**Risk Level:** [LOW/MEDIUM/HIGH]

| Step | Action                              | Command / SQL                        | Expected Output                | If Fails                       |
|------|-------------------------------------|--------------------------------------|--------------------------------|--------------------------------|
| 1    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |
| 2    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |
| 3    | [ACTION_DESCRIPTION]                | `[COMMAND_OR_SQL]`                   | [EXPECTED_OUTPUT]              | [TROUBLESHOOTING_STEPS]        |

> Repeat the "Procedure" section for each operational procedure.

---

## Health Checks

### Post-Procedure Verification

| Check                              | Command / Query                      | Expected Result                | Critical? |
|------------------------------------|--------------------------------------|--------------------------------|-----------|
| [HEALTH_CHECK_1]                   | `[COMMAND_OR_QUERY]`                 | [EXPECTED_RESULT]              | [YES/NO]  |
| [HEALTH_CHECK_2]                   | `[COMMAND_OR_QUERY]`                 | [EXPECTED_RESULT]              | [YES/NO]  |
| [HEALTH_CHECK_3]                   | `[COMMAND_OR_QUERY]`                 | [EXPECTED_RESULT]              | [YES/NO]  |

### Monitoring Dashboards

| Dashboard          | URL                                  | What to Look For              |
|--------------------|--------------------------------------|-------------------------------|
| [DASHBOARD_NAME]   | [DASHBOARD_URL]                      | [KEY_METRICS_TO_MONITOR]      |
| [DASHBOARD_NAME]   | [DASHBOARD_URL]                      | [KEY_METRICS_TO_MONITOR]      |

---

## Escalation

### When to Escalate

- [ESCALATION_TRIGGER_1 — Specific condition that requires escalation.]
- [ESCALATION_TRIGGER_2 — Timeout threshold exceeded.]
- [ESCALATION_TRIGGER_3 — Data integrity concern detected.]

### Escalation Contacts

| Level   | Contact              | Role                 | Channel           | Response SLA    |
|---------|----------------------|----------------------|-------------------|-----------------|
| L1      | [CONTACT_NAME]       | [ROLE]               | [CHANNEL]         | [SLA]           |
| L2      | [CONTACT_NAME]       | [ROLE]               | [CHANNEL]         | [SLA]           |
| L3      | [CONTACT_NAME]       | [ROLE]               | [CHANNEL]         | [SLA]           |

---

## Related Runbooks

| Runbook ID   | Title                              | Relationship                   |
|--------------|------------------------------------|--------------------------------|
| [RB-NNN]     | [RUNBOOK_TITLE]                    | [DEPENDENCY/PREREQUISITE/RELATED] |
| [RB-NNN]     | [RUNBOOK_TITLE]                    | [DEPENDENCY/PREREQUISITE/RELATED] |

---

## Change Log

| Date         | Author          | Change Description                          |
|--------------|-----------------|---------------------------------------------|
| [YYYY-MM-DD] | [AUTHOR_NAME]  | [CHANGE_DESCRIPTION]                        |
