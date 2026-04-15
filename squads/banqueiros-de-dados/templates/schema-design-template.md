# Schema Design Document

| Field       | Value                          |
|-------------|--------------------------------|
| Project     | [PROJECT_NAME]                 |
| Author      | [AUTHOR_NAME]                  |
| Date        | [YYYY-MM-DD]                   |
| Status      | Draft / Review / Approved      |
| Story ID    | [STORY_ID]                     |
| Epic        | [EPIC_ID]                      |

---

## Overview

### Business Context

[BUSINESS_CONTEXT — Describe the business problem this schema addresses, the domain it belongs to, and any relevant background information.]

### Data Model Description

[DATA_MODEL_DESCRIPTION — High-level summary of the entities, their relationships, and the data flow. Include a brief explanation of the domain model and how it maps to the database tables.]

---

## Entity Relationship Diagram

[ERD_REFERENCE — Link to diagram or embed Mermaid/PlantUML notation below.]

```mermaid
erDiagram
    [ENTITY_A] ||--o{ [ENTITY_B] : "[RELATIONSHIP]"
```

---

## Tables

### Table: [TABLE_NAME]

**Description:** [TABLE_DESCRIPTION]

#### Columns

| Column Name       | Type          | Nullable | Default        | Description                    |
|-------------------|---------------|----------|----------------|--------------------------------|
| [COLUMN_NAME]     | [DATA_TYPE]   | [YES/NO] | [DEFAULT_VALUE]| [COLUMN_DESCRIPTION]           |
| [COLUMN_NAME]     | [DATA_TYPE]   | [YES/NO] | [DEFAULT_VALUE]| [COLUMN_DESCRIPTION]           |
| [COLUMN_NAME]     | [DATA_TYPE]   | [YES/NO] | [DEFAULT_VALUE]| [COLUMN_DESCRIPTION]           |

#### Primary Key

- `[PRIMARY_KEY_COLUMN]`

#### Foreign Keys

| Column            | References            | On Delete   | On Update   |
|-------------------|-----------------------|-------------|-------------|
| [FK_COLUMN]       | [REF_TABLE]([REF_COL])| [CASCADE/RESTRICT/SET NULL] | [CASCADE/NO ACTION] |

#### Indexes

| Index Name        | Columns               | Type        | Unique | Purpose                        |
|-------------------|-----------------------|-------------|--------|--------------------------------|
| [INDEX_NAME]      | [COLUMN(S)]           | [BTREE/GIN/GIST] | [YES/NO] | [INDEX_PURPOSE]           |

#### RLS Policy

| Policy Name       | Operation     | Using Expression              | With Check Expression         |
|-------------------|---------------|-------------------------------|-------------------------------|
| [POLICY_NAME]     | [SELECT/INSERT/UPDATE/DELETE] | [USING_EXPR]   | [WITH_CHECK_EXPR]             |

> Repeat the "Table" section above for each table in the schema.

---

## Naming Conventions

| Element           | Convention              | Example                       |
|-------------------|-------------------------|-------------------------------|
| Tables            | [CONVENTION]            | [EXAMPLE]                     |
| Columns           | [CONVENTION]            | [EXAMPLE]                     |
| Foreign Keys      | [CONVENTION]            | [EXAMPLE]                     |
| Indexes           | [CONVENTION]            | [EXAMPLE]                     |
| Enums             | [CONVENTION]            | [EXAMPLE]                     |
| RLS Policies      | [CONVENTION]            | [EXAMPLE]                     |

---

## Migration Notes

- [MIGRATION_NOTE_1 — Any sequencing requirements, data backfill needs, or dependencies on other migrations.]
- [MIGRATION_NOTE_2 — Performance considerations during migration, estimated row counts, locking implications.]
- [MIGRATION_NOTE_3 — Rollback strategy if migration fails mid-execution.]

---

## Approval

| Role              | Name                  | Date         | Signature    |
|-------------------|-----------------------|--------------|--------------|
| Designed by       | [DESIGNER_NAME]       | [YYYY-MM-DD] |              |
| Reviewed by       | [REVIEWER_NAME]       | [YYYY-MM-DD] |              |
| Approved by       | [APPROVER_NAME]       | [YYYY-MM-DD] |              |

---

## Change Log

| Date         | Author          | Change Description                          |
|--------------|-----------------|---------------------------------------------|
| [YYYY-MM-DD] | [AUTHOR_NAME]  | [CHANGE_DESCRIPTION]                        |
