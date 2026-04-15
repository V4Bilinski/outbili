# Migration Plan

| Field          | Value                                   |
|----------------|-----------------------------------------|
| Migration ID   | [MIG-YYYY-MM-DD-NNN]                   |
| Date           | [YYYY-MM-DD]                            |
| Author         | [AUTHOR_NAME]                           |
| Risk Level     | Low / Medium / High / Critical          |
| Story ID       | [STORY_ID]                              |
| Target Env     | [DEVELOPMENT/STAGING/PRODUCTION]        |

---

## Summary

### What Changes

[CHANGE_SUMMARY — Describe the database changes being made: new tables, altered columns, new indexes, RLS policies, etc.]

### Why

[CHANGE_REASON — Business or technical justification for this migration. Reference the story or requirement driving the change.]

### Impact Assessment

[IMPACT_DESCRIPTION — Which services, queries, or features are affected. Estimate downtime if any. Identify dependent systems.]

---

## Pre-Migration Checklist

- [ ] Database backup taken and verified: [BACKUP_LOCATION]
- [ ] Stakeholders notified: [STAKEHOLDER_LIST]
- [ ] Maintenance window scheduled: [WINDOW_START] to [WINDOW_END]
- [ ] Rollback script tested in staging: [YES/NO]
- [ ] Application code compatible with both old and new schema: [YES/NO]
- [ ] Read replicas considered: [YES/NO — impact on replication lag]
- [ ] Disk space verified for migration: [ESTIMATED_SPACE_NEEDED]
- [ ] Connection pool sizing reviewed: [YES/NO]

---

## Changes

| #  | Type       | Description                    | Affected Tables    | Est. Duration | Reversible? |
|----|------------|--------------------------------|--------------------|---------------|-------------|
| 1  | [DDL/DML/RLS] | [CHANGE_DESCRIPTION]        | [TABLE_NAMES]      | [DURATION]    | [YES/NO]    |
| 2  | [DDL/DML/RLS] | [CHANGE_DESCRIPTION]        | [TABLE_NAMES]      | [DURATION]    | [YES/NO]    |
| 3  | [DDL/DML/RLS] | [CHANGE_DESCRIPTION]        | [TABLE_NAMES]      | [DURATION]    | [YES/NO]    |

**Total Estimated Duration:** [TOTAL_DURATION]

---

## SQL Scripts

### Forward Migration

```sql
-- Migration: [MIG-YYYY-MM-DD-NNN]
-- Description: [MIGRATION_DESCRIPTION]
-- Author: [AUTHOR_NAME]

BEGIN;

[FORWARD_SQL_STATEMENTS]

COMMIT;
```

### Rollback Migration

```sql
-- Rollback: [MIG-YYYY-MM-DD-NNN]
-- Description: Reverts [MIGRATION_DESCRIPTION]
-- Author: [AUTHOR_NAME]

BEGIN;

[ROLLBACK_SQL_STATEMENTS]

COMMIT;
```

---

## Testing Plan

| Test Case                          | Expected Result                  | Actual Result | Pass? |
|------------------------------------|----------------------------------|---------------|-------|
| [TEST_CASE_1]                      | [EXPECTED_RESULT_1]              | [ACTUAL]      | [Y/N] |
| [TEST_CASE_2]                      | [EXPECTED_RESULT_2]              | [ACTUAL]      | [Y/N] |
| [TEST_CASE_3]                      | [EXPECTED_RESULT_3]              | [ACTUAL]      | [Y/N] |
| Rollback execution succeeds        | Schema reverts to previous state | [ACTUAL]      | [Y/N] |
| Application functions post-migrate | No errors, features work         | [ACTUAL]      | [Y/N] |

---

## Post-Migration Verification

- [ ] Schema matches expected state: `SELECT * FROM information_schema.columns WHERE table_name = '[TABLE]';`
- [ ] Row counts verified: [EXPECTED_COUNTS]
- [ ] RLS policies active: `SELECT * FROM pg_policies WHERE tablename = '[TABLE]';`
- [ ] Indexes created: `SELECT * FROM pg_indexes WHERE tablename = '[TABLE]';`
- [ ] Application health check passing: [HEALTH_CHECK_URL]
- [ ] Query performance within acceptable range: [BENCHMARK_COMPARISON]
- [ ] Replication lag within tolerance: [MAX_ACCEPTABLE_LAG]

---

## Communication Plan

| When              | Who                    | Channel        | Message                        |
|-------------------|------------------------|----------------|--------------------------------|
| Before migration  | [STAKEHOLDER_GROUP]    | [CHANNEL]      | [PRE_MIGRATION_MESSAGE]        |
| During migration  | [OPS_TEAM]             | [CHANNEL]      | [STATUS_UPDATES]               |
| After success     | [STAKEHOLDER_GROUP]    | [CHANNEL]      | [SUCCESS_MESSAGE]              |
| If rollback       | [STAKEHOLDER_GROUP]    | [CHANNEL]      | [ROLLBACK_MESSAGE]             |

---

## Change Log

| Date         | Author          | Change Description                          |
|--------------|-----------------|---------------------------------------------|
| [YYYY-MM-DD] | [AUTHOR_NAME]  | [CHANGE_DESCRIPTION]                        |
