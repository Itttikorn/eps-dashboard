# Scalability Requirements: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-quality-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification defines data volume projections, storage optimization architecture, capacity planning, and concurrency scaling models for the Go backend service and PostgreSQL storage layer, tracing from:
- `requirements.md`: Upstream requirement `NFR2.1` (95%+ storage reduction) and `FR5.1` (unlimited multi-project historical trends).
- `entities.md`: Data models for `IngestionBatch`, `DocumentRevisionCurrent`, `DocumentChangeLog`, and `ProjectDailyMetric`.
- `nfr-requirements-questions.md`: Q1 (connection pooling) and Q2 (10,000-row batch scaling).

---

## 2. Data Volume Projections & Capacity Planning

### Operational Scale Assumptions:
- **Active Projects**: 10–25 simultaneous industrial projects.
- **Documents per Project**: 300–800 active engineering documents per project.
- **Daily Ingestion Cadence**: 1 snapshot CSV per project per day (or 1 combined snapshot containing all projects).
- **Snapshot Size**: 2,000–5,000 rows standard; peak scaling up to 10,000 rows.
- **Historical Retention Horizon**: Unlimited (full lifecycle tracking across 2+ years).

### 3-Year Growth Projections:

| Storage Dimension | Traditional Blind Append Approach | AI-DLC Delta Engine Approach | Reduction % |
|:---|:---|:---|:---|
| **Daily Ingestion Rows** | 5,000 rows/day appended | ~50 true attribute deltas/day | **99.0%** |
| **Year 1 Total Rows** | 1,825,000 rows | ~18,250 deltas + 5,000 active rows | **98.7%** |
| **Year 3 Total Rows** | 5,475,000 rows | ~55,000 deltas + 10,000 active rows | **98.8%** |
| **Year 1 Database Size** | ~1.2 GB | ~35 MB (including indexes) | **97.1%** |
| **Year 3 Database Size** | ~3.8 GB | ~110 MB (including indexes) | **97.1%** |

---

## 3. Storage Optimization & Partitioning Architecture (`NFR2.1`)

The backend achieves sub-millisecond query performance and compact disk footprint through three decoupled storage tiers:

1. **Lean Active State (`document_revisions_current`)**:
   - Stores strictly the highest revision per unique `(project_id, doc_id)`.
   - Table size remains bounded (~5,000 to 10,000 rows total across all active corporate projects).
   - Entire table fits easily in PostgreSQL `shared_buffers` in RAM (< 10 MB buffer cache).
2. **Append-Only True Delta Ledger (`document_change_log`)**:
   - Records discrete field mutation events only when incoming values differ from current values.
   - Unchanged rows generate 0 bytes of database storage.
   - Indexed chronologically for fast per-document audit trails without impacting dashboard queries.
3. **Pre-Aggregated Daily Rollup (`project_daily_metrics`)**:
   - Exactly 1 row per project per calendar date.
   - For 15 active projects over 2 years: $15 \times 730 = 10,950\text{ rows}$ total.
   - Powers multi-project trend curves (`GET /api/v1/analytics/trends`) in $< 10\text{ ms}$ over full lifecycles with zero dynamic table scans or runtime aggregations.

---

## 4. Concurrency & Throughput Scaling Model

### Workload Characteristics:
- **Read Workload (Dashboard Viewers)**: 90% of requests (`GET /api/v1/projects`, `GET /api/v1/projects/summary`, `GET /api/v1/analytics/trends`).
- **Write Workload (Daily CSV Ingestion)**: 10% of requests (`POST /api/v1/ingest`), typically concentrated during scheduled morning pipeline runs or manual administrative uploads.

### Scaling Enforcements:
- **Connection Sizing**: 25 maximum open connections comfortably support up to 50 concurrent dashboard users without connection starvation.
- **Query Optimization**: All dashboard queries leverage covered composite indexes; no full table scans or unbounded joins are permitted.
- **Ingestion Serialization**: Concurrent snapshot uploads for the same `project_id` are synchronized via row-level locks on `projects` or atomic database transactions to prevent conflicting state updates.

---

## 5. Scaling Thresholds & Trigger Metrics

| Metric | Normal Operating Level | Warning Threshold | Architectural Scaling Action |
|:---|:---|:---|:---|
| **Active Projects** | 10–25 projects | $> 50$ projects | Add read-replica connection pool if query latency exceeds 25ms. |
| **Ingestion Rows** | 2,000–5,000 rows | $> 10,000$ rows | Enforce batch chunking (insert in 1,000-row chunks inside single transaction). |
| **Trend Timeframe** | 1–2 years | $> 5$ years | Implement client-side downsampling for chart rendering when points $> 500$. |
| **API p95 Latency** | $< 15\text{ ms}$ | $> 50\text{ ms}$ | Review index statistics (`ANALYZE document_revisions_current`) and vacuum tables. |

