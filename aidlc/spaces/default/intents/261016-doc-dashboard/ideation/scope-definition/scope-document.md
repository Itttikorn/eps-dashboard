# Scope Definition Document

## Context & Upstream Traceability
This scope definition establishes the realistic product and architectural boundary for the corporate document management system dashboard, tracing from `intent-statement.md`, `feasibility-assessment.md`, `constraint-register.md`, the UI design concepts of the prototype ([Conzol-Doc-tracker](https://mojiqaqc.github.io/Conzol-Doc-tracker/)), and strictly grounded in the **actual data available in the CSV snapshot files (`@data`)**.

## In-Scope Capabilities

### 1. Ingestion Pipeline & Data Processing (Backend)
- **Automated & Manual Ingestion Endpoint**:
  - HTTP POST endpoint (`/api/v1/ingest`) accepting `multipart/form-data` daily database snapshot CSV uploads.
  - Supports automated daily pipeline uploads (from Power Automate) and manual user uploads via frontend.
- **Go Streaming Parser & Validation**:
  - High-performance streaming CSV parser (`encoding/csv`) mapping all 24 columns present in the snapshot files (`PROJECTID`, `DOCID`, `REVID`, `DISCIPLINE`, `DISCIPLINE_NAME`, `TITLE`, `DOCSTATUS`, `COMPANY`, `WBSID`, `DOCTYPE`, `REVDATE`, `TRANSMITTAL`, `TRANSMITAL_DATE`, `ISSUEFOR`, `DUEDATE`, `RETURNDATE`, `RET`, `RESPONSEDATE`, `REMARK`, `LASTSTATUS`, `COMMENTLIST`, `STATUSALLUSER`).
  - Validation, sanitization, and snapshot timestamp logging.
- **Relational Storage & Modeling (PostgreSQL)**:
  - Idempotent upsert logic tracking document revision history across daily snapshots.
  - Compound indexing on `(project_id, doc_id, rev_id)` and status fields.

### 2. QA/QC Workflow Domain Engine (Backend Business Logic)
Directly computed from the real document types and fields present in the CSV data:
- **Baseline Deliverables & Drawings**:
  - Tracking of Engineering Deliverables and Drawings present in the dataset: `SLD`, `IOL`, `CBL`, `WD`, `GA`, `FS`, `LD`, `FD`, `TYD`, `PID`, `BOM`, `SUB`, etc.
  - Discipline aggregation: Mechanical (`ME`), Electrical (`EE`), Civil (`Civil`/`CE`), etc.
- **Site Quality & Clarification Records**:
  - Tracking of `ITP` (Inspection & Test Plan) records.
  - Tracking of `RFI` (Request for Information) records (Open vs Returned/Closed via `LASTSTATUS` and `RETURNDATE`).
- **Corrective Actions**:
  - Tracking of `NCR` (Non-Conformance Reports) and `CAR` (Corrective Action Requests).
  - Open vs Returned tallies, pending status tracking, and average age calculation based on `TRANSMITAL_DATE` / `DUEDATE`.
- **Engineering Changes**:
  - Tracking of `DCR` (Design Change Request) and `VOR` (Variation Order Request / VO) records.
- **Overdue Engine**:
  - Deterministic overdue calculation (`current_date > DUEDATE` where `RETURNDATE` is empty or status is pending).
- **Historical Snapshot & Trend Tracking**:
  - Persistence of daily/weekly snapshot totals in a historical metrics ledger to build authentic volume and overdue trend curves over time.
- **Net Backlog Trend Indicator**:
  - Tracking net changes in open/pending deliverables across snapshot cycles (`▲ ค้างเพิ่ม` / `▼ ค้างลด` / `— ค้างคงที่`).

### 3. Executive Dashboard & UI Experience (React Frontend)
Clean, modern dashboard reflecting the layout style of [Conzol-Doc-tracker](https://mojiqaqc.github.io/Conzol-Doc-tracker/) without requiring missing external data:
- **Top Summary KPI Cards**:
  - Total Documents, Total Overdue, In Review / Open, Approved / Returned, and QA/QC Category Totals (Drawings, RFI, NCR, CAR, DCR, VOR).
  - Click-to-expand cards showing per-project distribution.
- **Project Comparison Matrix Table**:
  - Multi-project comparative rows showing Project ID, Site Code, Total Documents, Overdue Count, Open RFI/NCR/CAR, and Net Backlog Trend tag.
  - Expandable row chevrons (`expand-btn`) revealing discipline breakdown (Mechanical, Electrical, Civil) and document type distributions.
- **Toolbar & Filtering**:
  - Instant text search by Project Name, Site Code, or Document ID/Title.
  - Multi-criteria sorting: by Overdue count, Total Pending, or Project Name.
- **Weekly Trend Analytics View**:
  - Tabbed toggle switching between the Comparison Table and the Weekly Trend Chart (historical tracking of total documents and overdue count across snapshot timestamps).
- **Manual CSV Upload Modal / Component**:
  - Drag-and-drop or file-picker CSV upload modal directly posting to `/api/v1/ingest`, displaying upload progress, row count processed, and refreshing the dashboard.

### 4. Containerized Packaging (Docker Compose)
- Docker Compose configuration orchestrating Go backend, PostgreSQL database, and React frontend.

## Explicit Out-of-Scope Boundaries (Data & Capabilities Excluded)
- **Site Physical Progress S-Curve**: Excluded because physical construction S-curves are managed outside the document management database (e.g. SharePoint S-curves).
- **Planned Drawing Quotas (`plan` vs `actual`)**: Excluded because baseline target numbers are not stored in the daily document register CSV.
- **Punchlist Set A / Set B**: Excluded from MVP as punchlist records are not present in the current engineering document transmittal snapshots.
- **In-Browser Document Rendering**: Direct binary viewing/rendering of PDFs, CAD drawings, or Office documents is excluded.
- **Row-Level Inline Metadata Editing**: Document status updates occur solely via CSV snapshot ingestion; inline manual editing of rows is excluded.
- **Upstream Automation Creation**: Construction and maintenance of the external Power Automate email workflow is excluded.
- **User Authentication & RBAC**: Deferred post-MVP.

## Value Stream Mapping
1. **Ingestion**: Power Automate automated POST OR Frontend Manual Upload → `/api/v1/ingest`.
2. **Parsing & Storage**: Go streaming parser ingests 24 CSV columns → Upserts to PostgreSQL → Updates snapshot timestamp ledger.
3. **Analytics Engine**: Go service computes overdue items, QA/QC category metrics, discipline breakdowns, and snapshot deltas.
4. **Interactive Dashboard**: React frontend renders multi-project comparison matrix, expandable discipline drawers, manual upload controls, and historical trend charts.
