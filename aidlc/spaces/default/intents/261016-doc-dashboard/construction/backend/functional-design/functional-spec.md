# Functional Specification: Unit `backend`

**Stage**: `functional-design` (3.1)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Provenance

This functional specification serves as the authoritative source of truth for ordered workflows, algorithmic state machines, and API behavior for the Go backend service and PostgreSQL storage layer, tracing from:
- `unit-of-work.md`: Unit definition for `backend` (`U1`) and its component ownership boundaries.
- `unit-of-work-story-map.md`: Traceability to stories `US1.1`, `US1.2`, `US1.3`, `US3.1`, and `US3.2`.
- `requirements.md`: Upstream requirements `FR1.1`–`FR1.6`, `FR2.1`–`FR2.3`, `FR3.2`–`FR3.4`, `FR5.1`, and `NFR1`–`NFR4`.
- `components.md`: Domain architecture components `IngestionEngine`, `DocumentTrackingDomain`, and `HistoricalAnalyticsDomain`.
- `contract-summary.md`: OpenAPI 3.0 interface specifications and response DTO schemas.

---

## 2. Behavioral Workflows & Step Sequences

### Workflow 1: Daily Snapshot CSV Ingestion & Atomic Delta Processing

This workflow specifies the complete end-to-end processing sequence executed when a daily snapshot CSV is uploaded to `POST /api/v1/ingest`:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Data Uploader / Pipeline
    participant Handler as Ingestion HTTP Handler
    participant Engine as IngestionEngine (Memory)
    participant DB as PostgreSQL Transaction (UoW)

    Client->>Handler: POST /api/v1/ingest (multipart/form-data)
    Note over Handler: Enforce http.MaxBytesReader (10MB limit - BR1.2)
    Handler->>Engine: Stream CSV bytes & calculate SHA-256
    Engine->>DB: Query IngestionBatch by file_sha256 (BR1.3)
    alt SHA-256 already exists
        DB-->>Engine: Existing batch found
        Engine-->>Handler: ALREADY_INGESTED (Idempotent bypass)
        Handler-->>Client: HTTP 200 OK (Status 1000, status: ALREADY_INGESTED)
    else New file upload
        Engine->>Engine: Parse header line (resilient mapping - BR1.1)
        alt Header invalid or missing required columns
            Engine-->>Handler: Validation error (missing columns)
            Handler-->>Client: HTTP 400 Bad Request (Status 1801)
        else Header valid
            Engine->>DB: Load active DocumentRevisionCurrent for project_id into Memory Map
            DB-->>Engine: Map[doc_id]DocumentRevisionCurrent
            Engine->>Engine: Stream CSV rows & execute in-memory diff (< 20ms - BR2.3)
            alt Any row has malformed primary key or invalid date
                Note over Engine: Fail-fast all-or-nothing policy (BR1.5)
                Engine-->>Handler: Row validation failure details
                Handler-->>Client: HTTP 400 Bad Request (Status 1801, row error list)
            else All rows valid
                Note over DB: BEGIN Transaction
                Engine->>DB: INSERT IngestionBatch (status: INGESTED)
                Engine->>DB: UPSERT DocumentRevisionCurrent (latest revisions only - BR2.4)
                Engine->>DB: INSERT DocumentChangeLog (detected attribute deltas only - BR2.2)
                Engine->>DB: Synchronous UPSERT ProjectDailyMetric (BR5.1)
                Note over DB: COMMIT Transaction
                Engine-->>Handler: IngestionResult (total_rows, deltas_updated, skipped_unchanged)
                Handler-->>Client: HTTP 201 Created (Status 1000, envelope wrapped - BR6.1)
            end
        end
    end
```

#### Detailed Execution Steps:
1. **Transport Ingestion**: The HTTP handler mounts `http.MaxBytesReader` configured with a 10MB ceiling (`BR1.2`). Payloads exceeding 10MB are severed immediately.
2. **Streaming Checksum**: While reading the multipart stream into memory/disk buffer, compute the SHA-256 digest across raw bytes.
3. **Idempotency Verification**: Query `ingestion_batches` for existing `file_sha256` (`BR1.3`). If present, return HTTP 200 `ALREADY_INGESTED` with previous batch statistics.
4. **Header Normalization**: Parse the first CSV row using case-insensitive, whitespace-trimmed token matching (`BR1.1`). Verify presence of all 23 required columns.
5. **State Pre-Loading**: Query `document_revisions_current` where `project_id == parsed_project_id`, populating an in-memory hash map `docMap[doc_id]` in $< 5\text{ ms}$.
6. **Streaming In-Memory Diffing**: Iterate through incoming rows:
   - Validate presence of mandatory identifiers `PROJECTID`, `DOCID`, `REVID`, `DOCTYPE`. If validation fails, capture row number and column error (`BR1.5`).
   - If `doc_id` exists in `docMap`:
     - Compare `incoming.rev_date` against `current.rev_date`. If incoming is older, discard row to prevent historical regression (`BR1.4`).
     - Compare all 23 tracked attributes. If identical, increment `skipped_unchanged` (`BR2.1`).
     - If attributes differ, flag revision for UPSERT and construct discrete `DocumentChangeLog` event rows for each mutated field (`BR2.2`).
   - If `doc_id` does not exist in `docMap`:
     - Flag revision for creation UPSERT and construct a `DocumentChangeLog` event with `action = 'CREATE'`.
7. **Atomic Transaction Commit**:
   - Begin PostgreSQL transaction.
   - Insert new `IngestionBatch` record.
   - Execute bulk UPSERT on `document_revisions_current` on conflict `(revision_key)`.
   - Bulk insert generated `DocumentChangeLog` rows.
   - Compute and UPSERT the `ProjectDailyMetric` record for `(project_id, snapshot_date)` (`BR5.1`).
   - Commit transaction. If any database write fails, execute immediate rollback.
8. **Response Packaging**: Return HTTP 201 Created with JSON envelope (`BR6.1`).

---

### Workflow 2: Global Executive Summary Delivery

This workflow powers the topbar executive KPI cards (`GET /api/v1/projects/summary`):

1. **Request Intake**: Handler receives `GET /api/v1/projects/summary` without required query parameters.
2. **Aggregated Metric Query**: Application service invokes the repository port to execute an indexed aggregation query against `document_revisions_current`:
   - `total_projects`: `COUNT(DISTINCT project_id)`
   - `total_documents`: `COUNT(*)`
   - `total_overdue`: `COUNT(*) FILTER (WHERE is_overdue = TRUE)`
   - Category counts:
     - `baseline_drawings`: `COUNT(*) FILTER (WHERE qa_category = 'BASELINE_DRAWINGS')`
     - `control`: `COUNT(*) FILTER (WHERE qa_category = 'CONTROL')`
     - `corrective`: `COUNT(*) FILTER (WHERE qa_category = 'CORRECTIVE')`
     - `change`: `COUNT(*) FILTER (WHERE qa_category = 'CHANGE')`
     - `complete`: `COUNT(*) FILTER (WHERE qa_category = 'COMPLETE')`
   - `last_updated_at`: `MAX(updated_at)`
3. **Execution Latency SLA**: Query leverages the composite index `idx_doc_rev_curr_query` executing in $< 3\text{ ms}$.
4. **Envelope Serialization**: Output is mapped into `GlobalSummaryResponse` wrapped in the universal JSON envelope (`BR6.1`) and returned with HTTP 200 OK.

---

### Workflow 3: Multi-Project Comparative Matrix Grid

This workflow serves the comparative project overview table (`GET /api/v1/projects`):

1. **Parameter Sanitization**:
   - `search`: Trimmed string; if provided, matched case-insensitively against `project_id` or `site_code`.
   - `page`: Default 1, minimum 1.
   - `page_size`: Default 20, minimum 1, maximum 100.
2. **Project-Level Rollup Aggregation**:
   - For each active project matching search filters, aggregate current metrics from `document_revisions_current`:
     - Total baseline drawings count.
     - Category metrics for Control, Corrective, and Change: `total`, `open`, `closed`, `pending_pct` (`BR4.2`), `is_critical` (`BR4.2`), and `avg_age_days` (`BR3.4`).
     - Overdue document count (`BR4.1`).
     - Stated `last_snapshot_date`.
3. **Week-over-Week Net Change Evaluation**:
   - For each project, fetch the two most recent records from `project_daily_metrics` (current vs 7 days prior).
   - Compute `delta_open = current.in_review_count - previous.in_review_count`.
   - Assign `net_change` as `IMPROVING`, `DEGRADING`, or `STABLE` (`BR4.3`).
4. **Pagination Packaging**: Assemble `ProjectMatrixRow` collection, populate `total` matching projects, and echo `search_params` in the standard response envelope.

---

### Workflow 4: Historical Time-Series Analytics Assembly

This workflow serves multi-project trend curves (`GET /api/v1/analytics/trends`):

1. **Parameter Parsing**:
   - `project_ids`: Comma-separated list of target project IDs.
   - `preset`: Predefined window (`all_time`, `1_year`, `6_months`, `3_months`). If supplied, calculate `start_date` relative to current date.
   - `start_date` / `end_date`: Explicit ISO calendar bounds (YYYY-MM-DD).
2. **Direct Rollup Table Query**:
   - Query `project_daily_metrics` filtering strictly by `project_id IN (...)` and `metric_date BETWEEN start_date AND end_date`, ordered by `metric_date ASC`.
   - Bypasses raw revision tables entirely; query runs in $< 5\text{ ms}$ over 2+ years of data.
3. **Date Pivoting & Data Structuring**:
   - Pivot queried rows into a unified time-series array of `DateMetricPoint` objects.
   - Each date element contains a map of project IDs to their respective `total_documents` and `overdue_count` metrics on that calendar date.
4. **Response Serialization**: Return `HistoricalTrendsResponse` with HTTP 200 OK and populated `search_params`.

---

## 3. State Machines & Lifecycle Transitions

### 3.1 Ingestion Batch Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Upload stream accepted via POST /api/v1/ingest
    RECEIVED --> VALIDATING: Checksum calculated (SHA-256)
    
    VALIDATING --> ALREADY_INGESTED: Checksum match in ingestion_batches (BR1.3)
    ALREADY_INGESTED --> [*]: Return HTTP 200 (Bypass parsing)
    
    VALIDATING --> FAILED: Missing columns, payload > 10MB, or corrupted rows
    FAILED --> [*]: Transaction rollback, return HTTP 400
    
    VALIDATING --> COMMITTED: Headers verified, diff calculated, DB transaction committed
    COMMITTED --> [*]: Return HTTP 201 Created (IngestionResult)
```

### 3.2 Document Revision Composite Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT_UNSUBMITTED: LASTSTATUS == '00:NO FLOW' and TRANSMITAL_DATE is empty
    DRAFT_UNSUBMITTED --> PENDING_IN_REVIEW: Transmittal issued (TRANSMITAL_DATE != '' or LASTSTATUS == '40:WAIT SYN')
    
    PENDING_IN_REVIEW --> PENDING_IN_REVIEW: Status update or comment received while open
    PENDING_IN_REVIEW --> OVERDUE: snapshot_date > DUEDATE and document not returned (BR4.1)
    OVERDUE --> RETURNED_CLOSED: LASTSTATUS == '50:RETURN' or RET stamped or return_date present (BR3.2)
    PENDING_IN_REVIEW --> RETURNED_CLOSED: LASTSTATUS == '50:RETURN' or RET stamped or return_date present (BR3.2)
    
    RETURNED_CLOSED --> PENDING_IN_REVIEW: New revision issued with new transmittal
    
    DRAFT_UNSUBMITTED --> INACTIVE_CANCELLED: DOCSTATUS == 'C' or LASTSTATUS == '60:INACTIVE'
    PENDING_IN_REVIEW --> INACTIVE_CANCELLED: DOCSTATUS == 'C' or LASTSTATUS == '60:INACTIVE'
    OVERDUE --> INACTIVE_CANCELLED: DOCSTATUS == 'C' or LASTSTATUS == '60:INACTIVE'
```

---

## 4. Derived Views

### 4.1 Derived Entity-Relationship Diagram

Derived from the authoritative definitions in `entities.md`:

```mermaid
erDiagram
    IngestionBatch ||--o{ DocumentChangeLog : "generates audit events"
    DocumentRevisionCurrent ||--o{ DocumentChangeLog : "audit history for revision"
    ProjectDailyMetric }o--|| IngestionBatch : "materialized daily from batch"

    IngestionBatch {
        uuid batch_id PK
        string project_id
        date snapshot_date
        string file_name
        string file_sha256 UK
        int total_rows
        int deltas_updated
        int skipped_unchanged
        string status
        timestamp created_at
    }

    DocumentRevisionCurrent {
        string revision_key PK "project_id:doc_id"
        string project_id
        string doc_id
        string rev_id
        string doc_type
        string qa_category
        date rev_date
        date due_date
        date return_date
        string last_status
        boolean is_closed
        boolean is_overdue
        int overdue_days
        timestamp updated_at
    }

    DocumentChangeLog {
        bigint event_id PK
        uuid batch_id FK
        string project_id
        string doc_id
        string rev_id
        string action
        string field_name
        string old_value
        string new_value
        timestamp changed_at
    }

    ProjectDailyMetric {
        bigint metric_id PK
        string project_id UK
        date metric_date UK
        int total_docs
        int approved_count
        int in_review_count
        int overdue_count
        int baseline_count
        int control_count
        int corrective_count
        int change_count
        int complete_count
        timestamp created_at
    }
```

---

## 5. Derived Business Rules Reference Summary

Derived from the authoritative rules in `rules.md`:

| Rule Group | Rules Included | Key Invariants Enforced |
|:---|:---|:---|
| **Ingestion Core (`BR1.x`)** | `BR1.1`, `BR1.2`, `BR1.3`, `BR1.4`, `BR1.5` | Resilient 23-column header mapping; 10MB request ceiling; SHA-256 deduplication; out-of-order date safeguard; atomic transactional commit/rollback. |
| **Delta Engine (`BR2.x`)** | `BR2.1`, `BR2.2`, `BR2.3`, `BR2.4` | Unchanged row suppression; attribute delta logging to `document_change_log`; $< 20\text{ ms}$ diffing SLA; single active row in `document_revisions_current`. |
| **Lifecycle & Classification (`BR3.x`)** | `BR3.1`, `BR3.2`, `BR3.3`, `BR3.4` | 5 QA/QC category mapping; composite closure evaluation; ME/CE/EE discipline categorization; unified Corrective Action aging (no directional split). |
| **Delinquency & Overdue (`BR4.x`)** | `BR4.1`, `BR4.2`, `BR4.3` | Overdue anchor against snapshot date; $\ge 45\%$ delinquency critical alert; week-over-week net backlog direction. |
| **Rollup & Analytics (`BR5.x`)** | `BR5.1`, `BR5.2` | Synchronous `project_daily_metrics` rollup insertion; full-lifecycle multi-project time-series streaming. |
| **Presentation Envelope (`BR6.x`)** | `BR6.1`, `BR6.2` | Universal four-field JSON envelope (`status`, `result`, `total`, `search_params`); sanitized status code mapping. |

