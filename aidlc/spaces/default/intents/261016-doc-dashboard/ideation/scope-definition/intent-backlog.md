# Intent Backlog & Proto-Units

## Overview
This intent backlog prioritizes the functional and technical deliverables for the corporate document management dashboard MVP, applying the MoSCoW framework and delivery sequencing preferences derived from upstream artifacts, the UI design concepts of [Conzol-Doc-tracker](https://mojiqaqc.github.io/Conzol-Doc-tracker/), and strictly grounded in the **actual data available in the CSV snapshot files (`@data`)**.

## Prioritized Backlog (MoSCoW)

### Must Have (P0 - Core MVP)
- **UNIT-01: CSV Ingestion API & Streaming Parser (Go)**
  - *Description*: Expose `/api/v1/ingest` HTTP POST endpoint receiving `multipart/form-data` CSV files. Implement streaming CSV parsing using Go's `encoding/csv` supporting automated Power Automate ingestion and frontend manual uploads. Parse and validate all 24 columns present in `@data`.
  - *Priority*: Must Have | *Effort*: Medium | *Risk*: Low
- **UNIT-02: PostgreSQL Storage & Upsert Schema (Go / SQL)**
  - *Description*: Design database schema for projects, documents, revisions, QA/QC categories (`ITP`, `RFI`, `NCR`, `CAR`, `DCR`, `VOR`, Drawings), transmittals, and snapshot metadata. Implement bulk upserts on composite keys `(project_id, doc_id, rev_id)` with status and discipline indexing.
  - *Priority*: Must Have | *Effort*: Medium | *Risk*: Low
- **UNIT-03: Document Analytics & Overdue Engine (Go)**
  - *Description*: Implement backend aggregation service computing QA/QC category metrics (Drawings, RFI, NCR, CAR, DCR, VOR), overdue status (`today > DUEDATE` without return date), discipline distributions (ME, EE, Civil), and project-level totals. Expose REST endpoints for dashboard queries.
  - *Priority*: Must Have | *Effort*: Medium | *Risk*: Low
- **UNIT-04: Multi-Project Comparison Matrix Table (React)**
  - *Description*: Primary dashboard view reproducing the clean table layout: multi-project comparison rows with site codes, total documents, overdue counts, QA/QC status chips, and expandable drawers showing discipline and DOCTYPE distributions.
  - *Priority*: Must Have | *Effort*: Medium | *Risk*: Low
- **UNIT-05: Executive Top KPI Cards & Summary Header (React)**
  - *Description*: Interactive top KPI summary cards (Total Documents, Total Overdue, In Review, Returned/Approved, and Category Totals) with click-to-expand project distributions.
  - *Priority*: Must Have | *Effort*: Medium | *Risk*: Low
- **UNIT-06: Frontend Manual CSV Upload Component (React)**
  - *Description*: Modal and drag-and-drop file upload component in React allowing users to manually submit CSV snapshot files to `/api/v1/ingest`, displaying upload progress and triggering dashboard refresh upon completion.
  - *Priority*: Must Have | *Effort*: Low | *Risk*: Low
- **UNIT-07: Containerized Packaging (Docker Compose)**
  - *Description*: Dockerfile definitions for Go backend and React frontend with unified `docker-compose.yml` orchestrating Go, React, and PostgreSQL.
  - *Priority*: Must Have | *Effort*: Low | *Risk*: Low

### Should Have (P1 - Enhanced MVP)
- **UNIT-08: Weekly Trend Analytics View (Go & React)**
  - *Description*: Record snapshot totals over time in a historical metrics ledger and provide React line/bar chart visualizations showing document volume progression and overdue trends across snapshot dates.
  - *Priority*: Should Have | *Effort*: Medium | *Risk*: Low
- **UNIT-09: Ingestion Diagnostics & Status Badge (React)**
  - *Description*: Header indicator displaying last ingestion timestamp, file name, rows processed, and parser status.
  - *Priority*: Should Have | *Effort*: Low | *Risk*: Low

### Could Have (P2 - Post-MVP Candidate)
- **UNIT-10: Exportable Summary Reports (CSV / PDF)**
  - *Description*: Client-side or server-side generation of summary reports for meetings.
  - *Priority*: Could Have | *Effort*: Low | *Risk*: Low

### Won't Have (P3 - Explicitly Excluded for MVP)
- Site physical construction progress (SharePoint S-Curve)
- Planned drawing target quotas (`plan` vs `actual`)
- Punchlist Set A / Set B tracking
- In-browser PDF/drawing viewer
- Inline row-level document metadata editing in web UI
- Role-based user authentication and corporate SSO
- Outbound automated email alert notifications

## Delivery Sequencing (Ingestion-First Strategy)
1. **Foundation & Ingestion (Sprint 1)**: UNIT-01 (Ingestion API) → UNIT-02 (PostgreSQL Schema & Upserts) → Verified against actual sample CSV files in `@data`.
2. **Domain Logic & Metrics Engine (Sprint 2)**: UNIT-03 (Status, Category & Overdue Engine) → Unit tests for overdue calculations.
3. **Executive Dashboard & Manual Upload (Sprint 3)**: UNIT-04 (Comparison Matrix Table & Drawers) → UNIT-05 (KPI Cards) → UNIT-06 (Manual CSV Upload UI).
4. **Trends & Container Integration (Sprint 4)**: UNIT-08 (Trend Analytics View) → UNIT-07 (Docker Compose Orchestration) → End-to-end integration validation.
