# Performance Requirements: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-quality-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification defines the quantifiable performance benchmarks, latency budgets, resource constraints, and connection pooling invariants for the Go backend service and PostgreSQL storage layer, tracing from:
- `requirements.md`: Upstream requirements `NFR1.1`–`NFR1.4`.
- `contract-summary.md`: OpenAPI 3.0 query latency contracts and payload ceilings.
- `functional-spec.md`: Workflows 1–4 (Ingestion, Executive Summary, Project Matrix, Trend Analytics).
- `nfr-requirements-questions.md`: Q1 confirmed Standard Container Pool (`MaxOpenConns: 25`, `MaxIdleConns: 10`).

---

## 2. Latency Budgets & Target SLAs

The backend service operates on a corporate intranet / local Docker Compose network and must satisfy the following strict latency thresholds:

| Requirement ID | Operation / Endpoint | Target Latency (p95) | Target Latency (p99) | Payload Ceiling | Concurrency Target |
|:---|:---|:---|:---|:---|:---|
| **NFR1.1** | `GET /api/v1/projects/summary` | $< 10\text{ ms}$ | $< 25\text{ ms}$ | $< 5\text{ KB}$ | 50 req/sec |
| **NFR1.2** | `GET /api/v1/projects` (Matrix Grid) | $< 15\text{ ms}$ | $< 35\text{ ms}$ | $< 50\text{ KB}$ | 30 req/sec |
| **NFR1.3** | `POST /api/v1/ingest` (2,000–5,000 rows) | $< 350\text{ ms}$ | $< 500\text{ ms}$ | 10 MB limit | 2 concurrent uploads |
| **NFR1.3.1** | `POST /api/v1/ingest` (10,000 rows scaling) | $< 1,000\text{ ms}$ | $< 1,500\text{ ms}$ | 10 MB limit | 1 upload |
| **NFR1.4** | `GET /api/v1/analytics/trends` (2-year range) | $< 10\text{ ms}$ | $< 20\text{ ms}$ | $< 100\text{ KB}$ | 20 req/sec |
| **NFR1.5** | In-Memory Snapshot Pre-Load (`docMap`) | $< 5\text{ ms}$ | $< 10\text{ ms}$ | Internal RAM | Single batch |
| **NFR1.6** | In-Memory Row Diffing SLA (per row) | $< 5\ \mu\text{s}$ | $< 10\ \mu\text{s}$ | Zero allocation | Streamed |
| **NFR1.7** | `GET /api/v1/health` (Readiness Probe) | $< 2\text{ ms}$ | $< 5\text{ ms}$ | $< 1\text{ KB}$ | 100 req/sec |

---

## 3. Database Connection Pooling Invariants

Per Question Q1 decision, database connections to PostgreSQL 16 are managed via `database/sql` / GORM with explicit connection pooling tuned for Docker Compose:

```go
// Database Connection Pool Configuration
db.SetMaxOpenConns(25)                  // Maximum number of open connections to the database
db.SetMaxIdleConns(10)                  // Maximum number of connections in the idle connection pool
db.SetConnMaxLifetime(5 * time.Minute)  // Maximum amount of time a connection may be reused
db.SetConnMaxIdleTime(2 * time.Minute)  // Maximum amount of time a connection may be idle before being closed
```

### Rationales:
- **Headroom for Ingestion**: A full CSV batch ingestion occupies exactly 1 dedicated transaction connection for $< 500\text{ ms}$. With `MaxOpenConns: 25`, 24 remaining connections remain instantly available to serve incoming dashboard read queries with zero queuing delay.
- **Connection Recycling**: `ConnMaxLifetime: 5m` prevents stale connection leakage across container restarts or intermediate corporate NAT/firewall timeouts.

---

## 4. Query Indexing & Execution Plans

To ensure sub-5ms query performance without table scans:
1. **Active State Composite Index**:
   ```sql
   CREATE UNIQUE INDEX idx_doc_rev_curr_pk ON document_revisions_current (project_id, doc_id);
   CREATE INDEX idx_doc_rev_curr_query ON document_revisions_current (project_id, qa_category, is_closed, is_overdue);
   ```
2. **Daily Metrics Fast Rollup Index**:
   ```sql
   CREATE UNIQUE INDEX idx_proj_daily_metric_date ON project_daily_metrics (project_id, metric_date);
   CREATE INDEX idx_proj_daily_metric_lookup ON project_daily_metrics (metric_date DESC);
   ```
3. **Audit Log Chronological Index**:
   ```sql
   CREATE INDEX idx_doc_change_log_lookup ON document_change_log (project_id, doc_id, changed_at DESC);
   ```

---

## 5. Resource Constraints & Memory Footprint

- **Maximum Process Memory (RSS)**: $< 128\text{ MB}$ under steady-state dashboard querying; peak $< 256\text{ MB}$ during a 10,000-row ingestion pass.
- **CPU Utilization**: $< 5\%$ idle; peak $< 50\%$ of 1 CPU core during in-memory CSV diff calculation and SHA-256 calculation.
- **Garbage Collection Overhead**: Streaming ingestion processes CSV records line-by-line using `encoding/csv.Reader`, avoiding bulk memory buffering and keeping heap allocations below 15MB per ingestion batch.

