# Business Rules Specification: Unit `backend`

**Stage**: `functional-design` (3.1)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Provenance

This business rules specification formally defines the algorithmic logic, validation constraints, calculation rules, and operational policies for the Go backend service and PostgreSQL storage layer, tracing from:
- `unit-of-work.md`: Unit boundaries and responsibilities for `backend` (`U1`).
- `unit-of-work-story-map.md`: Traceability to user stories `US1.1`, `US1.2`, `US1.3`, `US3.1`, and `US3.2`.
- `requirements.md`: Upstream requirements `FR1.1`–`FR1.6`, `FR2.1`–`FR2.3`, `FR3.2`–`FR3.4`, `FR5.1`, and `NFR1`–`NFR4`.
- `components.md`: Domain logic ownership across `IngestionEngine`, `DocumentTrackingDomain`, and `HistoricalAnalyticsDomain`.
- `contract-summary.md`: OpenAPI 3.0 response codes, field constraints, and envelope structures.

---

## 2. Machine-Readable Business Rules Specification

```yaml
rules:
  - id: BR1.1
    statement: Ingestion CSV files must contain all 23 core columns with case-insensitive and whitespace-tolerant matching.
    category: validation
    applies_to: IngestionEngine
    trigger: Execution of CSV header parsing during file upload.
    logic: >
      IF the uploaded CSV header contains all 23 required column tokens (PROJECTID, DOCID, REVID, DISCIPLINE, DISCIPLINE_NAME,
      TITLE, DOCSTATUS, COMPANY, WBSID, DOCTYPE, REVDATE, PLANDATE, TRANSMITTAL, TRANSMITAL_DATE, ISSUEFOR, DUEDATE, RETURNDATE,
      RET, RESPONSEDATE, REMARK, LASTSTATUS, COMMENTLIST, STATUSALLUSER) regardless of casing, leading/trailing whitespace,
      or column order, THEN parse the file and safely ignore any extraneous columns;
      ELSE reject the file immediately with HTTP 400 (Status 1801: Invalid request) naming the missing columns.
    violation_behaviour: Reject ingestion batch, abort parsing, rollback transaction, and return descriptive HTTP 400 envelope.
    source: FR1.1

  - id: BR1.2
    statement: Maximum uploaded file payload size is strictly bounded at 10 megabytes.
    category: constraint
    applies_to: IngestionEngine
    trigger: HTTP POST request header evaluation at /api/v1/ingest.
    logic: >
      IF the incoming request body exceeds 10,485,760 bytes (10MB),
      THEN terminate stream reading via http.MaxBytesReader and return HTTP 400 (Status 1801);
      ELSE stream and process the payload.
    violation_behaviour: Terminate connection, discard remaining buffer, return HTTP 400 envelope.
    source: NFR1.3

  - id: BR1.3
    statement: Ingestion requests matching an existing SHA-256 file checksum must be recognized as idempotent duplicates.
    category: policy
    applies_to: IngestionEngine
    trigger: Computation of SHA-256 hash across uploaded file bytes.
    logic: >
      IF IngestionBatch table already contains a record with file_sha256 == computed_sha256,
      THEN bypass CSV parsing and state upserts, return HTTP 200 with status: ALREADY_INGESTED and row statistics;
      ELSE proceed with full delta ingestion.
    violation_behaviour: Safely short-circuit execution without emitting error or duplicate audit events.
    source: FR1.6

  - id: BR1.4
    statement: Incoming document revisions older than the current recorded revision date must not overwrite live state.
    category: validation
    applies_to: IngestionEngine
    trigger: Comparing incoming record against DocumentRevisionCurrent during in-memory diffing.
    logic: >
      IF an existing record exists for (project_id, doc_id) AND incoming.rev_date < current.rev_date,
      THEN ignore the incoming record to prevent historical regression from out-of-order CSV uploads;
      ELSE proceed with delta evaluation and upsert.
    violation_behaviour: Suppress state overwrite, log a warning entry in the ingestion batch report.
    source: FR1.6

  - id: BR1.5
    statement: Ingestion operations across live state, change logs, batches, and daily rollups must execute inside an atomic transaction.
    category: policy
    applies_to: IngestionEngine
    trigger: Committing batch database operations.
    logic: >
      IF any row validation fails, database constraint error occurs, or panic arises during batch processing,
      THEN execute a full rollback of the database transaction, leaving zero partial state in database;
      ELSE commit all changes atomically.
    violation_behaviour: Complete transactional rollback, return HTTP 400 or HTTP 500 envelope with sanitized error message.
    source: FR1.6

  - id: BR2.1
    statement: Unchanged document attributes must be skipped without generating database writes or audit log entries.
    category: constraint
    applies_to: IngestionEngine
    trigger: Field-by-field in-memory comparison of incoming row against current revision state.
    logic: >
      IF all 23 parsed attributes of incoming row are identical to existing record in DocumentRevisionCurrent,
      THEN increment skipped_unchanged counter and write zero records to DocumentChangeLog;
      ELSE identify mutated fields.
    violation_behaviour: Silent skip of unchanged records to preserve database storage efficiency.
    source: FR1.2

  - id: BR2.2
    statement: Attribute-level mutations must be isolated and appended as discrete change events in the audit log.
    category: policy
    applies_to: DocumentTrackingDomain
    trigger: Detection of field-level difference during in-memory diffing.
    logic: >
      IF any tracked attribute (LASTSTATUS, RET, DUEDATE, RETURNDATE, RESPONSEDATE, COMMENTLIST, REVID, TITLE) has changed,
      THEN append a new DocumentChangeLog row recording (batch_id, project_id, doc_id, rev_id, field_name, old_value, new_value, changed_at);
      ELSE do not create an audit row.
    violation_behaviour: Record unalterable audit row in append-only table.
    source: FR1.4

  - id: BR2.3
    statement: In-memory diffing of 2,000 document records must complete in under 20 milliseconds.
    category: constraint
    applies_to: IngestionEngine
    trigger: Execution of in-memory diffing algorithm.
    logic: >
      Load active project revisions into a memory hash map keyed by doc_id;
      stream CSV rows through map lookup in O(1) time complexity;
      total diff execution must not exceed 20 ms.
    violation_behaviour: Profile and optimize hash map memory lookups to maintain performance SLA.
    source: FR1.2

  - id: BR2.4
    statement: Exactly one active revision row per (project_id, doc_id) is maintained in DocumentRevisionCurrent.
    category: constraint
    applies_to: DocumentTrackingDomain
    trigger: Committing state updates to DocumentRevisionCurrent.
    logic: >
      Perform an idempotent UPSERT on primary key revision_key = project_id:doc_id;
      historical superseded revisions are overwritten in this table while preserved in DocumentChangeLog.
    violation_behaviour: Enforced by primary key constraint pk_document_revisions_current.
    source: FR1.3

  - id: BR3.1
    statement: Documents are automatically classified into exactly one of five standardized QA/QC lifecycle categories.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Document ingestion and evaluation.
    logic: >
      IF doc_type IN [DDD, GA, SLD, PID, CRT, CBL, IOL, WD, DS, CAL, SPE, LD, FD, FS, TYD, STR, BOM, SUB] THEN qa_category = BASELINE_DRAWINGS;
      ELSE IF doc_type IN [ITP, RFI, ITR, MIR, QAR, FAT, SAT, PQR, QCR] THEN qa_category = CONTROL;
      ELSE IF doc_type IN [NCR, CAR] THEN qa_category = CORRECTIVE;
      ELSE IF doc_type IN [PCR, FCR, DCR, VOR, VO] THEN qa_category = CHANGE;
      ELSE IF doc_type IN [PUNCH, PL, HANDOVER, TOC] THEN qa_category = COMPLETE;
      ELSE qa_category = BASELINE_DRAWINGS.
    violation_behaviour: Fallback to BASELINE_DRAWINGS for unmapped general engineering types.
    source: FR2.3

  - id: BR3.2
    statement: Document composite closed status is evaluated from status codes, return stamps, and dates.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Ingestion evaluation and query rendering.
    logic: >
      IF last_status == '50:RETURN' OR ret_code IN ['A', 'AC', 'RC', 'ACK'] OR return_date IS NOT NULL OR response_date IS NOT NULL,
      THEN is_closed = true;
      ELSE is_closed = false.
    violation_behaviour: Deterministic boolean flag evaluation stored in DocumentRevisionCurrent.
    source: FR2.2

  - id: BR3.3
    statement: Engineering drawings must be classified into Mechanical, Civil, and Electrical disciplines.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Document revision aggregation.
    logic: >
      IF discipline IN ['ME', 'MECH', 'MECHANICAL'] THEN normalized_discipline = 'ME';
      ELSE IF discipline IN ['CE', 'CIVIL', 'STR', 'STRUCTURAL'] THEN normalized_discipline = 'CE';
      ELSE IF discipline IN ['EE', 'ELEC', 'ELECTRICAL', 'INST', 'I&C'] THEN normalized_discipline = 'EE';
      ELSE normalized_discipline = 'OTHER'.
    violation_behaviour: Stored as standardized 2-character code for accordion breakdown aggregation.
    source: FR4.2

  - id: BR3.4
    statement: Corrective Action documents (NCR, CAR) are tracked as a unified category with average aging calculated from transmittal date.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Aggregating corrective action metrics.
    logic: >
      Track total, open, closed, and overdue counts for all NCR and CAR documents in a unified category;
      average aging in calendar days = (sum of (snapshot_date - transmittal_date) for all open NCR/CAR records) / (total open NCR/CAR records);
      directional splitting (Owner vs Contractor) is explicitly excluded from domain logic.
    violation_behaviour: Unified metrics returned in CategoryMetrics schema without sub-flow segregation.
    source: FR2.3

  - id: BR4.1
    statement: A document is classified as overdue if due date is exceeded and document is not closed.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Snapshot ingestion and overdue calculation.
    logic: >
      IF is_closed == false AND due_date IS NOT NULL AND due_date < snapshot_date,
      THEN is_overdue = true AND overdue_days = snapshot_date - due_date;
      ELSE is_overdue = false AND overdue_days = 0.
    violation_behaviour: Flags stored in DocumentRevisionCurrent and tallied into ProjectDailyMetric.overdue_count.
    source: FR3.2

  - id: BR4.2
    statement: Category delinquency ratio is computed as percentage of open items, flagged critical at 45% or above.
    category: calculation
    applies_to: DocumentTrackingDomain
    trigger: Scorecard API query computation.
    logic: >
      IF (open_count + closed_count) > 0,
      THEN pending_pct = (open_count / (open_count + closed_count)) * 100.0;
      ELSE pending_pct = 0.0;
      IF pending_pct >= 45.0 THEN is_critical = true; ELSE is_critical = false.
    violation_behaviour: Returns pending_pct rounded to 1 decimal place and boolean is_critical flag.
    source: FR3.3

  - id: BR4.3
    statement: Week-over-week net backlog change direction indicates whether open document load is shrinking or expanding.
    category: calculation
    applies_to: HistoricalAnalyticsDomain
    trigger: Comparing latest project rollup with rollup from 7 days prior.
    logic: >
      delta_open = current_rollup.in_review_count - previous_week_rollup.in_review_count;
      IF delta_open < 0 THEN net_change = 'IMPROVING';
      ELSE IF delta_open > 0 THEN net_change = 'DEGRADING';
      ELSE net_change = 'STABLE'.
    violation_behaviour: Returns net_change enum in ProjectMatrixRow response DTO.
    source: FR3.4

  - id: BR5.1
    statement: Each committed ingestion batch synchronously computes and writes exactly one ProjectDailyMetric row.
    category: calculation
    applies_to: HistoricalAnalyticsDomain
    trigger: Ingestion batch transaction commit.
    logic: >
      Calculate aggregate counts (total_docs, approved_count, in_review_count, overdue_count, baseline_count,
      control_count, corrective_count, change_count, complete_count) across DocumentRevisionCurrent for the target project;
      UPSERT into ProjectDailyMetric on (project_id, metric_date).
    violation_behaviour: Guaranteed synchronization inside the same atomic database transaction.
    source: FR1.5

  - id: BR5.2
    statement: Historical trends endpoint serves daily aggregated time-series data without time limits or table joins.
    category: calculation
    applies_to: HistoricalAnalyticsDomain
    trigger: GET /api/v1/analytics/trends query.
    logic: >
      Query ProjectDailyMetric filtering by project_ids and optional start_date/end_date range;
      return ordered array of DateMetricPoint objects containing document volumes and overdue tallies per project.
    violation_behaviour: Response returned within 10 ms SLA from pre-computed rollup table.
    source: FR5.1

  - id: BR6.1
    statement: All API endpoints wrap responses in the standardized four-field JSON envelope.
    category: policy
    applies_to: Presentation
    trigger: Response serialization across all HTTP handlers.
    logic: >
      Every response payload must be structured with root keys: status (containing code, header, description),
      result (data payload or null), total (integer or omitted), and search_params (object or omitted).
    violation_behaviour: Enforced by internal/utils/envelope.go helper functions.
    source: NFR3.1

  - id: BR6.2
    statement: Error responses map to standard application codes and must never leak internal database diagnostics.
    category: policy
    applies_to: Presentation
    trigger: HTTP error handling.
    logic: >
      Log internal error, query, and stack trace to server logs with request_id;
      sanitize client-facing status.description using standard catalog (1801: Invalid request, 1802: Not found,
      1799: Unable to proceed, 1900: Server error).
    violation_behaviour: Strict suppression of driver and SQL strings in response payloads.
    source: NFR3.1
```

---

## 3. Human-Readable Rules Summary Table

| Rule ID | Category | Summary Description | Trigger Point | Upstream Source |
|:---|:---|:---|:---|:---|
| `BR1.1` | Validation | Resilient 23-column CSV header mapping | Ingestion parsing | `FR1.1`, `AC1.1.1` |
| `BR1.2` | Constraint | 10MB payload size ceiling (`MaxBytesReader`) | Ingestion upload | `NFR1.3` |
| `BR1.3` | Policy | SHA-256 upload idempotency and deduplication | Upload check | `FR1.6`, `AC1.3.1` |
| `BR1.4` | Validation | Chronological snapshot date guard against regression | State comparison | `FR1.6`, `AC1.3.2` |
| `BR1.5` | Policy | Atomic transaction rollback on validation failure | Batch execution | `FR1.6`, `NFR4.3` |
| `BR2.1` | Constraint | Skip identical incoming rows without DB writes | In-memory diff | `FR1.2`, `AC1.2.1` |
| `BR2.2` | Policy | Append attribute deltas to `document_change_log` | Delta detected | `FR1.4`, `AC1.2.2` |
| `BR2.3` | Constraint | In-memory diff latency $< 20\text{ ms}$ for 2,000 rows | Diff execution | `FR1.2`, `AC1.2.3` |
| `BR2.4` | Constraint | Single active revision in `document_revisions_current` | Upsert commit | `FR1.3`, `AC1.1.1` |
| `BR3.1` | Calculation | 5 QA/QC category classification mapping | Doc evaluation | `FR2.3`, `AC2.1.1` |
| `BR3.2` | Calculation | Closed status resolution via return stamps and dates | Status evaluation | `FR2.2` |
| `BR3.3` | Calculation | Engineering discipline classification (ME, CE, EE) | Doc aggregation | `FR4.2`, `AC3.1.1` |
| `BR3.4` | Calculation | Unified Corrective Actions aging (no directional split) | NCR/CAR rollup | `FR2.3`, `AC3.2.1` |
| `BR4.1` | Calculation | Overdue calculation against snapshot date anchor | Overdue check | `FR3.2`, `AC2.3.1` |
| `BR4.2` | Calculation | Delinquency percentage and critical flagging ($\ge 45\%$) | Matrix metric query | `FR3.3`, `AC2.3.2` |
| `BR4.3` | Calculation | Week-over-week net backlog change direction | Matrix metric query | `FR3.4`, `AC2.3.3` |
| `BR5.1` | Calculation | Synchronous daily rollup to `project_daily_metrics` | Batch commit | `FR1.5`, `AC1.3.3` |
| `BR5.2` | Calculation | Full-lifecycle time-series query assembly | Trends query | `FR5.1`, `AC4.1.1` |
| `BR6.1` | Policy | Standard 4-field envelope (`status`, `result`, `total`, `search_params`) | HTTP serialization | `NFR3.1`, `AC1.1.3` |
| `BR6.2` | Policy | Sanitized status code mapping without diagnostic leaks | Error handling | `NFR3.1`, `AC1.1.2` |

