# Domain Entities Specification: Unit `backend`

**Stage**: `functional-design` (3.1)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Provenance

This entity model defines the physical and logical data structures for the Go backend service and PostgreSQL storage layer, tracing from the following upstream inception deliverables:
- `unit-of-work.md`: Defines unit boundary `backend` (`U1`, kind: `service`) owning `IngestionEngine`, `DocumentTrackingDomain`, and `HistoricalAnalyticsDomain`.
- `unit-of-work-story-map.md`: Assigns stories `US1.1`, `US1.2`, `US1.3`, `US3.1`, and `US3.2` to this unit.
- `requirements.md`: Defines functional requirements `FR1.1`–`FR1.6`, `FR2.1`–`FR2.3`, `FR3.2`–`FR3.4`, and NFR storage caps.
- `components.md`: Details architectural components and entity responsibilities.
- `contract-summary.md`: Implements schema types for API contracts (`/api/v1/health`, `/api/v1/projects`, `/api/v1/projects/summary`, `/api/v1/analytics/trends`, `/api/v1/ingest`).

---

## 2. Machine-Readable Entity Model Specification

```yaml
entities:
  - name: IngestionBatch
    description: >
      Audit ledger tracking every uploaded CSV snapshot file. Enforces SHA-256 idempotency,
      chronological snapshot ordering, and records row-level processing telemetry.
    attributes:
      - name: batch_id
        logical_type: uuid
        required: true
        unique: true
        description: Unique surrogate identifier for the ingestion batch run.
      - name: project_id
        logical_type: string
        required: true
        max_length: 64
        description: Target project identifier (e.g. SKK-IM-CM-26002).
      - name: snapshot_date
        logical_type: date
        required: true
        description: Date of the snapshot as stated in CSV header or filename (YYYY-MM-DD).
      - name: file_name
        logical_type: string
        required: true
        max_length: 255
        description: Original filename of the uploaded CSV file.
      - name: file_sha256
        logical_type: string
        required: true
        max_length: 64
        description: Hex-encoded SHA-256 checksum of raw uploaded file bytes.
      - name: total_rows
        logical_type: integer
        required: true
        min: 0
        description: Total data rows parsed from the CSV file.
      - name: deltas_updated
        logical_type: integer
        required: true
        min: 0
        description: Number of document revisions created or mutated in this batch.
      - name: skipped_unchanged
        logical_type: integer
        required: true
        min: 0
        description: Number of incoming rows identical to current live state and skipped.
      - name: status
        logical_type: enum
        allowed_values: [INGESTED, ALREADY_INGESTED, FAILED]
        default: INGESTED
        required: true
        description: Terminal processing status of the ingestion batch.
      - name: error_message
        logical_type: string
        required: false
        description: Detailed error summary in case of validation or processing failure.
      - name: created_at
        logical_type: timestamp
        required: true
        description: UTC timestamp when the ingestion transaction was committed.
    entity_constraints:
      - name: uq_ingestion_batches_sha256
        type: unique
        attributes: [file_sha256]
        description: Rejects duplicate physical file uploads across all projects.
      - name: idx_ingestion_batches_project_date
        type: index
        attributes: [project_id, snapshot_date]
        description: Facilitates chronological snapshot ordering queries.
    relationships:
      - target_entity: DocumentChangeLog
        cardinality: one-to-many
        direction: source-to-target
        description: One ingestion batch produces zero or more field-level change log events.

  - name: DocumentRevisionCurrent
    description: >
      The lean, active state table holding exactly one record per unique document ID.
      Updated in-place via idempotent upsert; superseded revisions are never duplicated
      here, ensuring sub-millisecond query performance for executive scorecards.
    attributes:
      - name: revision_key
        logical_type: string
        required: true
        unique: true
        description: Natural composite primary key formatted as `project_id:doc_id`.
      - name: project_id
        logical_type: string
        required: true
        max_length: 64
        description: Project identifier code.
      - name: doc_id
        logical_type: string
        required: true
        max_length: 128
        description: Engineering document identification number.
      - name: rev_id
        logical_type: string
        required: true
        max_length: 32
        description: Active revision number/code (e.g. 0, A, B, 01).
      - name: discipline
        logical_type: string
        required: false
        max_length: 32
        description: Engineering discipline code (e.g. ME, CE, EE, I&C).
      - name: discipline_name
        logical_type: string
        required: false
        max_length: 128
        description: Human-readable engineering discipline title.
      - name: title
        logical_type: string
        required: false
        max_length: 512
        description: Document title or subject description.
      - name: doc_status
        logical_type: string
        required: false
        max_length: 16
        description: Lifecycle flag (e.g. A for Active, I for Inactive/Superseded).
      - name: company
        logical_type: string
        required: false
        max_length: 128
        description: Responsible contractor or issuing company name.
      - name: wbs_id
        logical_type: string
        required: false
        max_length: 64
        description: Work Breakdown Structure code.
      - name: doc_type
        logical_type: string
        required: true
        max_length: 32
        description: Engineering document classification code (e.g. GA, SLD, ITP, RFI, NCR, CAR, DCR).
      - name: rev_date
        logical_type: date
        required: false
        description: Stated revision publication date.
      - name: plan_date
        logical_type: date
        required: false
        description: Baseline scheduled submission date.
      - name: transmittal
        logical_type: string
        required: false
        max_length: 128
        description: Transmittal delivery package number.
      - name: transmittal_date
        logical_type: date
        required: false
        description: Physical date of transmittal dispatch.
      - name: issue_for
        logical_type: string
        required: false
        max_length: 64
        description: Purpose of transmittal issue (e.g. IFA, IFC, IFR, APP).
      - name: due_date
        logical_type: date
        required: false
        description: Formal contractual review deadline.
      - name: return_date
        logical_type: date
        required: false
        description: Actual return date from client review.
      - name: ret_code
        logical_type: string
        required: false
        max_length: 32
        description: Review outcome stamp (A, AC, RC, ACK, REJ).
      - name: response_date
        logical_type: date
        required: false
        description: Date contractor acknowledged or replied to review return.
      - name: remark
        logical_type: string
        required: false
        description: General engineering remarks or transmittal notes.
      - name: last_status
        logical_type: string
        required: false
        max_length: 64
        description: Workflow status code (e.g. 50:RETURN, 40:WAIT SYN, 00:NO FLOW).
      - name: comment_list
        logical_type: string
        required: false
        description: Consolidated reviewer remarks, issues, or action comments.
      - name: status_all_user
        logical_type: string
        required: false
        max_length: 128
        description: Cross-departmental reviewer tracking summary.
      - name: qa_category
        logical_type: enum
        allowed_values: [BASELINE_DRAWINGS, CONTROL, CORRECTIVE, CHANGE, COMPLETE]
        required: true
        description: Evaluated executive QA/QC classification pillar.
      - name: is_closed
        logical_type: boolean
        required: true
        default: false
        description: True if status is returned/approved (50:RETURN, RET stamped, return_date present).
      - name: is_overdue
        logical_type: boolean
        required: true
        default: false
        description: True if snapshot_date > due_date and is_closed is false.
      - name: overdue_days
        logical_type: integer
        required: true
        default: 0
        min: 0
        description: Elapsed calendar days beyond due_date as of the snapshot date.
      - name: updated_at
        logical_type: timestamp
        required: true
        description: UTC timestamp when the current revision record was last upserted.
    entity_constraints:
      - name: pk_document_revisions_current
        type: primary_key
        attributes: [revision_key]
        description: Enforces exactly one record per project and document ID.
      - name: idx_doc_rev_curr_query
        type: index
        attributes: [project_id, qa_category, is_closed, is_overdue]
        description: Composite index powering instant sub-5ms scorecard queries.
    relationships:
      - target_entity: DocumentChangeLog
        cardinality: one-to-many
        direction: source-to-target
        description: Historical mutations for this document revision are recorded in the audit log.

  - name: DocumentChangeLog
    description: >
      Append-only audit ledger recording every detected attribute delta between incoming
      snapshots and the active document state. Enables full auditability without duplicating
      identical snapshot rows.
    attributes:
      - name: event_id
        logical_type: bigint
        required: true
        unique: true
        description: Monotonically increasing unique surrogate identifier.
      - name: batch_id
        logical_type: uuid
        required: true
        references: IngestionBatch.batch_id
        description: Foreign key linking the change event to the causing ingestion batch.
      - name: project_id
        logical_type: string
        required: true
        max_length: 64
        description: Project identifier code.
      - name: doc_id
        logical_type: string
        required: true
        max_length: 128
        description: Target document identifier.
      - name: rev_id
        logical_type: string
        required: true
        max_length: 32
        description: Active revision identifier at the time of change.
      - name: action
        logical_type: enum
        allowed_values: [CREATE, UPDATE]
        required: true
        description: Nature of mutation (CREATE for new document, UPDATE for delta change).
      - name: field_name
        logical_type: string
        required: true
        max_length: 64
        description: Name of the mutated attribute (e.g. LASTSTATUS, RET, DUEDATE).
      - name: old_value
        logical_type: string
        required: false
        description: Attribute value prior to batch ingestion (null on CREATE).
      - name: new_value
        logical_type: string
        required: true
        description: Attribute value parsed from incoming snapshot.
      - name: changed_at
        logical_type: timestamp
        required: true
        description: UTC timestamp when the delta was committed.
    entity_constraints:
      - name: pk_document_change_log
        type: primary_key
        attributes: [event_id]
      - name: idx_change_log_doc
        type: index
        attributes: [project_id, doc_id, changed_at]
        description: Optimizes document-level revision timeline queries.
    relationships:
      - target_entity: IngestionBatch
        cardinality: many-to-one
        direction: source-to-target
        description: Links audit events back to the originating physical upload batch.

  - name: ProjectDailyMetric
    description: >
      Synchronously materialized daily aggregate snapshot holding exactly one summary record
      per project per snapshot date. Powers unlimited historical time-series analytics without
      expensive runtime row aggregations.
    attributes:
      - name: metric_id
        logical_type: bigint
        required: true
        unique: true
        description: Monotonically increasing surrogate identifier.
      - name: project_id
        logical_type: string
        required: true
        max_length: 64
        description: Project identifier code.
      - name: metric_date
        logical_type: date
        required: true
        description: Calendar snapshot date for the metrics rollup (YYYY-MM-DD).
      - name: total_docs
        logical_type: integer
        required: true
        min: 0
        description: Total active document count for the project on this date.
      - name: approved_count
        logical_type: integer
        required: true
        min: 0
        description: Count of documents in closed/approved state.
      - name: in_review_count
        logical_type: integer
        required: true
        min: 0
        description: Count of documents currently pending client review.
      - name: overdue_count
        logical_type: integer
        required: true
        min: 0
        description: Count of documents currently flagged overdue.
      - name: baseline_count
        logical_type: integer
        required: true
        min: 0
        description: Total engineering baseline drawings count.
      - name: control_count
        logical_type: integer
        required: true
        min: 0
        description: Total quality control records count (ITP, RFI, ITR).
      - name: corrective_count
        logical_type: integer
        required: true
        min: 0
        description: Total corrective action records count (NCR, CAR).
      - name: change_count
        logical_type: integer
        required: true
        min: 0
        description: Total design change records count (PCR/FCR, DCR, VOR).
      - name: complete_count
        logical_type: integer
        required: true
        min: 0
        description: Total completion records count.
      - name: created_at
        logical_type: timestamp
        required: true
        description: UTC timestamp when the rollup was computed.
    entity_constraints:
      - name: uq_project_daily_metric_date
        type: unique
        attributes: [project_id, metric_date]
        description: Enforces exactly one aggregate rollup row per project per day.
      - name: idx_project_daily_metric_range
        type: index
        attributes: [project_id, metric_date]
        description: Supports high-performance time-series queries spanning years.
    relationships: []
```

---

## 3. Relational Architecture & Storage Invariants

The data model enforces four critical architectural invariants to satisfy performance and storage requirements:

1. **Storage Optimization (95%+ Reduction)**:
   - Traditional daily snapshot storage of 2,000 rows/day yields $\approx 730,000$ rows per project annually.
   - The Current + Delta pattern restricts `document_revisions_current` to active revisions only ($\approx 500$ rows), writing to `document_change_log` only when an attribute genuinely mutates ($\approx 20\text{--}50$ deltas/day) and `project_daily_metrics` to 1 row/day.
2. **Deterministic Deduplication**:
   - `IngestionBatch.file_sha256` prevents redundant processing of identical snapshot CSV files.
3. **Out-of-Order Safeguards**:
   - Upserts into `document_revisions_current` verify `incoming.rev_date >= current.rev_date` to prevent historical data overwrite.
4. **Sub-Millisecond Query Response**:
   - Compound indexes on `(project_id, qa_category, is_closed, is_overdue)` ensure dashboard scorecard endpoints execute in $< 5\text{ ms}$ without table scans.

