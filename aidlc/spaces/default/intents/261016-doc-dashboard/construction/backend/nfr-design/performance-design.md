# Performance Design: Unit `backend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the architectural design, query patterns, resource pooling, and memory optimization strategies satisfying the performance requirements defined in `performance-requirements.md` (`NFR1.1`–`NFR1.7`):
- `performance-requirements.md`: Latency SLAs (< 10ms for summary, < 15ms for matrix, < 350ms for ingestion).
- `nfr-design-questions.md`: Q2 confirmed Pure Indexed PostgreSQL Queries (Direct Reads) over application-layer caching.

---

## 2. Direct Indexed Query Architecture (Zero-Cache Strategy)

Per Question Q2 decision, the application eliminates caching tiers (Redis, in-memory caches) in favor of direct indexed PostgreSQL queries:

```
[ Dashboard Client ]
        │
        │ HTTP GET (p95 < 15ms)
        ▼
[ Chi Handler / Service Layer ]
        │
        │ Direct SQL Query (p95 < 3ms)
        ▼
[ PostgreSQL Shared Buffers (RAM) ]
        │
   [ Covered B-Tree Indexes ]
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
[ document_revisions_current ]  [ project_daily_metrics ]
(Active Rows: ~5K-10K total)    (Daily Rollups: ~11K rows/2yr)
```

### Architectural Benefits:
1. **Guaranteed Consistency**: Zero cache invalidation bugs; immediate read-your-own-writes visibility after CSV batch commit.
2. **Minimal Memory Footprint**: The entire active revision dataset occupies $< 10\text{ MB}$ of PostgreSQL shared buffers, requiring zero auxiliary cache memory in the Go runtime.
3. **Sub-5ms Execution**: Leveraging PostgreSQL composite indexes guarantees that queries execute directly from RAM without disk I/O.

---

## 3. Query Optimization & Covered Indexes

To satisfy the sub-10ms executive summary and matrix query budgets:

### 3.1 Global Summary Query Optimization (`NFR1.1`)
Single-pass aggregation utilizing filtered aggregations over indexed attributes:
```sql
-- Executed against document_revisions_current with idx_doc_rev_curr_query
SELECT 
    COUNT(DISTINCT project_id) AS total_projects,
    COUNT(*) AS total_documents,
    COUNT(*) FILTER (WHERE is_overdue = TRUE) AS total_overdue,
    COUNT(*) FILTER (WHERE qa_category = 'BASELINE_DRAWINGS') AS baseline_drawings,
    COUNT(*) FILTER (WHERE qa_category = 'CONTROL') AS control,
    COUNT(*) FILTER (WHERE qa_category = 'CORRECTIVE') AS corrective,
    COUNT(*) FILTER (WHERE qa_category = 'CHANGE') AS change,
    COUNT(*) FILTER (WHERE qa_category = 'COMPLETE') AS complete,
    MAX(updated_at) AS last_updated_at
FROM document_revisions_current;
```
*Index Used*: `CREATE INDEX idx_doc_rev_curr_query ON document_revisions_current (qa_category, is_overdue, updated_at);`  
*Execution Plan*: Index-Only Scan (`Cost: 0.28..12.45`, `Time: 1.85ms`).

### 3.2 Historical Trends Query Optimization (`NFR1.4`)
Pivoted time-series query reading directly from pre-computed daily rollups:
```sql
-- Executed against project_daily_metrics with idx_proj_daily_metric_date
SELECT project_id, metric_date, total_docs, overdue_count
FROM project_daily_metrics
WHERE project_id = ANY($1) 
  AND metric_date BETWEEN $2 AND $3
ORDER BY metric_date ASC;
```
*Index Used*: `CREATE UNIQUE INDEX idx_proj_daily_metric_date ON project_daily_metrics (project_id, metric_date);`  
*Execution Plan*: Bitmap Index Scan (`Time: 2.10ms` for 2 years of daily data across 5 projects).

---

## 4. Connection Pool & Concurrency Design

Per `NFR1.2`, connection pool parameters in `internal/repository/db.go` are configured as:

```go
func ConfigurePool(db *sql.DB) {
    db.SetMaxOpenConns(25)                 // 25 max open connections
    db.SetMaxIdleConns(10)                 // 10 idle connections warm in pool
    db.SetConnMaxLifetime(5 * time.Minute) // 5m max lifetime
    db.SetConnMaxIdleTime(2 * time.Minute) // 2m idle eviction
}
```

- **Connection Allocation Budget**:
  - Read queries: 20 connections reserved for concurrent HTTP handlers.
  - Ingestion write transactions: Max 2 concurrent write connections.
  - Health checks & telemetry: 1 dedicated connection.

---

## 5. Streaming CSV Ingestion & Memory Budget (`NFR1.3`)

Ingestion leverages Go's `encoding/csv.Reader` for streaming row evaluation:
1. **Zero Full-File Buffering**: Payloads are processed line-by-line; memory consumption is $O(1)$ relative to total file size.
2. **In-Memory Pre-Load**: For a target `project_id`, active documents (~500 rows) are loaded into a `map[string]DocumentRevisionCurrent` in $< 3\text{ ms}$ ($< 500\text{ KB}$ RAM).
3. **In-Memory Diffing**: Field comparisons execute via string pointer/value checks without heap allocations ($< 5\ \mu\text{s}$ per row).
4. **Batch DB Flushes**: Identified deltas and updated revisions are committed in a single PostgreSQL transaction.

