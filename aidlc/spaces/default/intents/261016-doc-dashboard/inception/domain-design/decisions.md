# Architecture Decision Records (ADRs)

**Stage**: `domain-design` (2.6)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-architect-agent`  
**Date**: 2026-10-16  

---

### ADR-001: 3-Table "Current State + Delta Change Log + Daily Metrics Rollup" Storage Architecture

#### Context
The system receives daily CSV exports containing 300–500 document revision rows per project. A naive approach of blindly appending full snapshots creates 95%+ redundant data bloat (~180,000 rows/year/project), degrades live dashboard query performance with heavy `ROW_NUMBER()` or `MAX(date)` filters, and makes detecting day-over-day changes expensive.

#### Decision
Decompose persistence across three purpose-built tables:
1. `document_revisions_current`: Stores active revisions per project (~300–500 rows/project) updated via `UPSERT`. Powers all live dashboard queries in sub-milliseconds.
2. `document_change_log`: Append-only event table recording only modified fields (`old_value`, `new_value`, `action`) when changes occur (~5–15 rows/day).
3. `project_daily_metrics`: Aggregated daily rollup table (exactly 1 row/project/day, ~365 rows/project/year) powering multi-project historical trend lines.

#### Consequences
- **Positive**: 98% reduction in storage growth; sub-millisecond query performance on current state; instant timeline auditability; fast time-series queries without row-level aggregation.
- **Negative**: Requires in-memory diffing logic in the Go ingestion engine prior to persistence.
- **Neutral**: Because 500 documents require < 1MB memory, diffing completes in under 20ms in Go memory.

#### Alternatives Rejected
- *Blind Snapshot Appending*: Rejected due to exponential storage bloat, slow dashboard queries, and expensive self-joins to detect weekly changes.
- *Single Event Sourcing Store*: Rejected as overly complex for an MVP EPC dashboard where current state and daily rollups satisfy all reporting needs.

---

### ADR-002: Synchronous Transactional Computation of Daily Metrics Rollups

#### Context
Historical trend analytics requires daily metric rollups (`project_daily_metrics`) to plot volume curves. We needed to choose whether to compute rollups synchronously during CSV ingestion or asynchronously via a background worker/cron.

#### Decision
Compute and persist the daily rollup row inside the exact same atomic database transaction (`*sql.Tx`) as the document upserts and delta logs during CSV ingestion.

#### Consequences
- **Positive**: Zero latency between CSV upload and trend visualization; 100% transactional consistency; eliminates background worker processes, cron schedulers, and eventual-consistency drift.
- **Negative**: Adds ~5ms to the CSV ingestion transaction runtime, which remains well within the sub-second requirement (< 500ms total upload processing).

#### Alternatives Rejected
- *Asynchronous Background Worker*: Rejected because introducing background workers or queues introduces operational overhead and potential race conditions between upload completion and user navigation to the Trends tab.
- *Query-Time Aggregation*: Rejected because aggregating historical trends on-the-fly across multi-year lifecycles for multiple projects causes unacceptable dashboard load times.

---

### ADR-003: RESTful JSON Communication over HTTP

#### Context
The dashboard frontend (`DashboardUIClient`) must communicate with backend services (`IngestionEngine`, `DocumentTrackingDomain`, `HistoricalAnalyticsDomain`) to fetch project scorecards, trend datasets, and execute CSV file uploads.

#### Decision
Expose clean, synchronous RESTful JSON HTTP endpoints using Go standard library / Chi router:
- `GET /api/projects`
- `GET /api/projects/summary?snapshot_date=YYYY-MM-DD`
- `GET /api/projects/trends?project_ids=...&start_date=...&end_date=...&metric=...`
- `POST /api/ingestion/upload` (multipart/form-data)
- `GET /api/ingestion/history`

#### Consequences
- **Positive**: Idiomatic, lightweight, easily testable with standard HTTP test fixtures, native caching in browser and React Query, zero extra runtime dependencies.
- **Negative**: Requires manual synchronization of client TypeScript types and Go API structs (handled via Contract Design in Stage 2.8).

#### Alternatives Rejected
- *GraphQL*: Rejected as over-engineered for fixed dashboard views with known query shapes.
- *gRPC-Web*: Rejected due to required envoy proxy or protobuf transcoding overhead for a simple internal web dashboard.

---

### ADR-004: Removal of Discipline & Document-Type Drill-Down Accordion from Scope

#### Context
During the Refined Mockups review, stakeholder feedback explicitly requested the removal of the Discipline & Document-Type Drill-Down Accordion page to focus the MVP strictly on multi-project comparative health and macro trend analytics.

#### Decision
Formally remove the Discipline & Document-Type Drill-Down Accordion screen and its associated sub-components from the system domain. Retain a focused 3-screen architecture:
1. QA/QC Multi-Project Comparative Overview
2. Historical Trend Analytics
3. Operational CSV Ingestion

#### Consequences
- **Positive**: Reduces UI complexity; simplifies backend query contracts; accelerates delivery; aligns strictly with stakeholder priorities.
- **Negative**: Engineering leads cannot drill down into individual drawing revision lists in this version; they rely on project-level pillar metrics.

#### Alternatives Rejected
- *Retaining Accordion as Hidden/Disabled Tab*: Rejected to prevent maintenance overhead and unneeded code in the walking skeleton.

