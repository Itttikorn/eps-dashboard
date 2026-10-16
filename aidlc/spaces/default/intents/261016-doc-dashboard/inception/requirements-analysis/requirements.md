# Requirements Specification: Corporate Document Management System Dashboard

**Stage**: `requirements-analysis` (2.3)  
**Lead Agent**: `aidlc-product-agent`  
**Intent**: `261016-doc-dashboard`  
**Status**: APPROVED by Consolidated Summary Confirmation (Revision 2)  
**Upstream Artifacts**:
- [Intent Statement](../../ideation/intent-capture/intent-statement.md)
- [Scope Document](../../ideation/scope-definition/scope-document.md)
- [Team Practices](../../../../memory/team.md)
- [Project Configuration](../../../../memory/project.md)
- [Requirements Analysis Questions](requirements-analysis-questions.md)
- [Reference UI Architecture](https://mojiqaqc.github.io/Conzol-Doc-tracker/)

---

## Intent Analysis

### Business Context & Problem Statement
Engineering, Procurement, and Construction (EPC) management at SCG / EPS oversees complex industrial projects involving thousands of engineering drawings, technical clarifications (RFIs), quality inspection records (ITPs, ITRs), corrective action requests (NCRs, CARs), and change orders (DCRs, VORs). Document metadata is exported daily via automated CSV reports (`AUTOEMAIL_FILE_06_*.csv`). 

Currently, project engineers and executive leaders lack a unified, real-time dashboard to monitor document velocity, approval bottlenecks, and contractor review delinquency across multiple active project sites (`SKK-IM-CM-26002`, `STS-CN-PP-26001`, `STS-EN-PP-26001`). Manual spreadsheet tracking is error-prone, obscures overdue items, and prevents cross-project comparative QA/QC oversight.

### Executive Objectives
1. **Multi-Project QA/QC Overview**: Deliver an executive dashboard adapting the Conzol Doc Tracker architecture (`QA/QC เปรียบเทียบโครงการ`) to display comparative health across all active projects in a single view.
2. **Sub-Millisecond Operational Visibility**: Provide instant visibility into open vs closed documents across 5 standardized QA/QC lifecycle stages: Baseline Drawings, Control, Corrective Actions, Change Management, and Completion.
3. **High-Performance Delta Ingestion & Storage Optimization**: Eliminate 98%+ redundant database bloat through an intelligent Go ingestion engine using the "Current State + Delta Change Log + Daily Metrics Rollup" pattern with strict idempotency and atomic transactional guarantees.
4. **Unlimited Multi-Project Trend Analytics**: Provide full lifecycle trend curves across multiple projects simultaneously without arbitrary time limits, supported by dynamic project selection and comparative overlays.

---

## Functional Requirements

### FR1: Daily Snapshot Ingestion & Delta Engine
- **FR1.1: Automated CSV Ingestion**: System shall ingest standard daily AUTOEMAIL CSV snapshot files (`AUTOEMAIL_FILE_06_*.csv`), parsing 23 core columns: `PROJECTID`, `DOCID`, `REVID`, `DISCIPLINE`, `DISCIPLINE_NAME`, `TITLE`, `DOCSTATUS`, `COMPANY`, `WBSID`, `DOCTYPE`, `REVDATE`, `PLANDATE`, `TRANSMITTAL`, `TRANSMITAL_DATE`, `ISSUEFOR`, `DUEDATE`, `RETURNDATE`, `RET`, `RESPONSEDATE`, `REMARK`, `LASTSTATUS`, `COMMENTLIST`, and `STATUSALLUSER`.
- **FR1.2: In-Memory Delta Detection**: The Go ingestion service shall load the project's current known state into memory and compute a deterministic diff against incoming snapshot rows in $< 20\text{ ms}$, detecting:
  - *Unchanged records*: Skipped without database write.
  - *New records / revisions*: Captured as creation events.
  - *Modified records*: Changes in `LASTSTATUS`, `RET`, `DUEDATE`, `RETURNDATE`, `RESPONSEDATE`, or `COMMENTLIST` detected and isolated.
- **FR1.3: Live State Upsert (`document_revisions_current`)**: System shall perform an idempotent `UPSERT` on `(project_id, doc_id, rev_id)` into `document_revisions_current`, keeping active rows lean (~300–500 rows per project) to power instant dashboard queries without subqueries or window functions.
- **FR1.4: Field-Level Audit Log (`document_change_log`)**: System shall record every detected attribute change as an append-only event row with `(project_id, doc_id, rev_id, field_name, old_value, new_value, changed_at, batch_id)`.
- **FR1.5: Historical Metrics Rollup (`project_daily_metrics`)**: System shall calculate and insert exactly 1 aggregated summary row per project per snapshot date containing: `total_docs`, `approved_count`, `in_review_count`, `overdue_count`, `baseline_drawings_count`, and category breakdown metrics.
- **FR1.6: Ingestion Batch Tracking & Safeguards**:
  - *Idempotent Upload*: An `ingestion_batches` ledger records each upload with `(id, project_id, filename, file_sha256, snapshot_date, row_count, ingested_at)`. Duplicate file uploads matching `file_sha256` are safely recognized as already processed with zero redundant event generation.
  - *Out-of-Order Upload Guard*: Updates to `document_revisions_current` verify `incoming.rev_date >= current.rev_date` to prevent regression from out-of-order historical CSV uploads.
  - *Atomic Transactions*: The diff calculation, live state upsert, change log insertion, and daily rollup write execute inside a single atomic database transaction (`BEGIN ... COMMIT`).

### FR2: Document Lifecycle & Classification Engine
- **FR2.1: Latest Revision Evaluation**: For KPI scorecards, delinquency counts, and overview tables, the engine shall evaluate only the latest revision (`MAX(REVID)` or `MAX(REVDATE)`) per unique `(PROJECTID, DOCID)`. Historical superseded revisions (`DOCSTATUS == 'I'`) are archived and excluded from active backlog counts.
- **FR2.2: Composite Status Determination**:
  - **Returned / Closed**: Classified when `LASTSTATUS == '50:RETURN'` OR `RET` in `['A', 'AC', 'RC', 'ACK']` OR `RETURNDATE != ''` OR `RESPONSEDATE != ''`. Effective resolution date falls back to `RESPONSEDATE` when `RETURNDATE` is empty.
  - **Pending / In Review**: Classified when document is issued (`TRANSMITAL_DATE != ''` OR `LASTSTATUS == '40:WAIT SYN'`) AND document is not yet returned/closed.
  - **Draft / Unsubmitted**: Classified when `LASTSTATUS == '00:NO FLOW'` and `TRANSMITAL_DATE == ''`.
  - **Inactive / Cancelled**: Classified when `DOCSTATUS == 'C'` OR `LASTSTATUS == '60:INACTIVE'`.
- **FR2.3: 5 Standardized Executive QA/QC Categories**: System shall map raw DOCTYPE codes into 5 executive lifecycle groups matching the Conzol reference implementation:
  - **① Baseline (Drawings & Technical Design)**: `DDD`, `GA`, `SLD`, `PID`, `CRT`, `CBL`, `IOL`, `WD`, `DS`, `CAL`, `SPE`, `LD`, `FD`, `FS`, `TYD`, `STR`. Tracked alongside engineering discipline (`ME`, `CE`, `EE`).
  - **② Control**: `ITP` (Inspection & Test Plan: tracked per discipline ME/CE/EE, max 3 per site), `RFI` (Requests for Information: Open vs Closed), `ITR` / Inspection Reports (`MIR`, `QAR`, `FAT`, `SAT`, `PQR`, `QCR`).
  - **③ Corrective Actions**: `NCR` (Non-Conformance Reports) and `CAR` (Corrective Action Requests), segmented by flow direction (`Owner → EPS` vs `EPS → Contractor/ผรม`) derived from `COMPANY` and `TRANSMITTAL` prefix/suffix.
  - **④ Change Management**: `PCR`/`FCR` (Field Change Requests), `DCR` (Design Change Requests), `VOR`/`VO` (Variation Orders).
  - **⑤ Complete**: Punchlists (Pre-commissioning `ชุด A`, Post-commissioning `ชุด B`) and final handover transmittals.

### FR3: KPI Scorecards & Delinquency Tracking
- **FR3.1: Global Topbar KPI Row**: Dashboard header shall render interactive summary cards: Total Documents, ① Baseline, ② Control, ③ Corrective, ④ Change, ⑤ Complete, and Overdue. Clicking a card expands a detailed category breakdown grid (`.kpi-detail`).
- **FR3.2: Binary Overdue Engine**: A document revision is classified as **Overdue** if `current_date > DUEDATE` AND document is not returned/closed. Displayed as a dedicated count column (`เกินกำหนด`) in the project overview.
- **FR3.3: Backlog Delinquency Ratio**: For categories with open/closed states (RFI, NCR, CAR, FCR, DCR, VO), the system shall compute:
  $$\text{\% Pending} = \frac{\text{Open}}{\text{Open} + \text{Closed}} \times 100$$
  Visual color coding:
  - **Normal / Healthy (`st-good`)**: $< 25\%$ pending (muted text / green pill).
  - **Warning / Watch (`st-warn`)**: $25\% - 44\%$ pending (amber pill).
  - **Critical / Action Required (`st-bad`)**: $\ge 45\%$ pending (red pill with pulsing animation `.chip-blink`).
- **FR3.4: Week-over-Week Net Backlog Change**: System shall compute and display net weekly backlog change ($\Delta = \text{Opened} - \text{Closed}$) with directional indicators:
  - $\blacktriangledown$ Green: Net backlog shrinking.
  - $\blacktriangle$ Red: Net backlog expanding (alert).
  - Flat Gray: Stable backlog.

### FR4: Multi-Project Comparative Grid & Discipline Expansion
- **FR4.1: Comparative Overview Table**: Renders all active projects in a standardized grid with columns: Site / Project, Baseline Drawing, Control (ITP, RFI, ITR), Corrective (NCR/CAR Owner vs Contractor), Change (FCR, DCR, VO), Complete (Punchlist A/B), and Overdue (`เกินกำหนด`).
- **FR4.2: Expandable Discipline Accordion**: Clicking the expand toggle (`.expand-btn`) on a project row reveals:
  - Drawing breakdown by discipline: Mechanical (`ME`), Civil (`CE`), and Electrical (`EE`) comparing plan vs actual.
  - Drawing type availability tiles (`FS`, `ML`, `PR`, `GA`, `LD`, `FD`) indicating presence in active phase.
  - Pending document aging details (average age in days for open NCRs/CARs).
- **FR4.3: Real-Time Search & Sorting**: Toolbar provides text filtering (`#searchInput`) by Project ID or Site Name, and column sorting by Total Documents, Overdue Count, or Pending %.

### FR5: Unlimited Multi-Project Historical Trend View
- **FR5.1: Full Lifecycle Time-Series Range**: The trend view (`#view-trend`) shall support querying and rendering the full historical lifecycle of documents without arbitrary time limits (e.g. 6 months, 1 year, 2+ years), powered by `project_daily_metrics`.
- **FR5.2: Multi-Project Comparative Overlay**: Users can select and view any combination of multiple projects simultaneously on the same trend canvas using multi-select checkboxes in the project filter menu (`ตัวกรองโครงการ`).
- **FR5.3: Categorical Trend Styling**: Each selected project shall render as an independent trend line utilizing a fixed categorical color palette (`--trend-1` through `--trend-8`) that remains stable across filtering and sorting.
- **FR5.4: Interactive Comparative Tooltip**: Hovering over any date on the trend canvas displays a unified tooltip comparing the document volumes and backlog metrics for all currently enabled projects.
- **FR5.5: Time Range Presets**: Toolbar shall provide quick time-window filters: `All Time`, `1 Year`, `6 Months`, `3 Months`, plus custom date range inputs.

### FR6: Project Physical Progress S-Curve
- **FR6.1: Progress Side Panel**: Right-hand panel displays overall site physical progress (% Actual vs % Plan) with visual progress bars and status badges (`ahead`, `mid`, `behind`).

---

## Non-Functional Requirements

### NFR1: Performance & Query Latency
- **NFR1.1**: Dashboard initial load and multi-project table rendering shall execute in $< 50\text{ ms}$ on internal network.
- **NFR1.2**: Backend API queries against `document_revisions_current` and `project_daily_metrics` shall execute in $< 5\text{ ms}$ using indexed composite keys `(project_id, doc_id, rev_id)`.
- **NFR1.3**: Ingestion of a 2,000-row snapshot CSV file shall complete (diff calculation, transaction commit, and daily rollup calculation) in $< 500\text{ ms}$.
- **NFR1.4**: Multi-project trend queries spanning up to 2 years of daily rollups across multiple selected projects shall execute in $< 10\text{ ms}$ with a payload size $< 100\text{ KB}$.

### NFR2: Storage & Database Efficiency
- **NFR2.1**: Database growth shall be capped by storing only active revisions in `document_revisions_current` and true delta events in `document_change_log`, reducing year-one row footprint by $\ge 95\%$ compared to blind snapshot appending (~35,000 total rows vs 1,800,000 rows).

### NFR3: Architectural Consistency & API Design
- **NFR3.1: Universal Response Envelope**: Every HTTP API endpoint implemented in Go shall utilize the standardized envelope defined in `internal/utils/envelope.go`:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": { "timestamp": "2026-10-16T15:00:00Z", "version": "v1" }
  }
  ```
- **NFR3.2: Conventional Commit & Branching**: All code commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`) promoted via linear branch workflow (`feat/*` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`) using `--no-ff` merge commits.

### NFR4: Testing & Reliability Floor
- **NFR4.1**: Go backend test suite shall maintain $\ge 80\%$ test coverage across domain logic, parser routines, and API handlers.
- **NFR4.2**: Ingestion routines must pass concurrency and race condition verification using `go test -race ./...`.
- **NFR4.3**: Database transactions must be strictly atomic; an error in parsing or change logging triggers an immediate rollback with zero partial state corruption.

### NFR5: User Interface & Accessibility
- **NFR5.1: 4 Mandatory UI States**: Every data component must implement:
  1. *Loading State*: Skeleton shimmers matching table row heights.
  2. *Error State*: Clear user-facing error message with retry trigger.
  3. *Empty State*: Informative empty notice with instructions to upload a CSV snapshot.
  4. *Populated State*: Tabular numeric formatting (`font-variant-numeric: tabular-nums`) with smooth accordion transitions.
- **NFR5.2: Dual Theme Support**: Full light and dark mode styling utilizing CSS custom properties (`--bg`, `--paper`, `--ink`, `--line`, `--headerbg`) and Tailwind CSS v4 variables.

### NFR6: Deployment & Authorization Model
- **NFR6.1: Open Internal Corporate Access**: Open access across all projects without mandatory user authentication or complex RBAC for the MVP phase, optimized for internal intranet deployment.

---

## Constraints

1. **Technology Stack**:
   - Backend: Go 1.22+ with `chi/v5` router and standard library SQL driver (`pgx` / `database/sql`).
   - Frontend: React 18+ with Vite and Tailwind CSS v4.
   - Database: PostgreSQL 15+ relational database.
2. **Delivery Sequencing**:
   - Layer-by-layer structured delivery as confirmed in Practices Discovery:
     - Layer 1: PostgreSQL schema migrations, repository layer, and Go CSV ingestion parser.
     - Layer 2: Domain calculation engine (KPIs, overdue, deltas, category mappings, API routes).
     - Layer 3: React frontend dashboard, comparative grid, and interactive trend charts.
3. **Session Boundary**:
   - Inception phase boundary strictly observed: notify user upon completion of Stage 2.9 (Delivery Planning) before proceeding to Construction.

---

## Assumptions

1. **CSV Format Stability**: Daily exports from Conzol adhere to the 23-column header schema found in `data/AUTOEMAIL_FILE_06_*.csv`.
2. **Revision Ordering**: When determining latest revision, string sorting on `REVID` or chronological ordering on `REVDATE` reliably resolves the latest issue.
3. **Discipline Standard Codes**: Standard discipline codes map cleanly to `EE` (Electrical), `ME` (Mechanical), and `CE` (Civil). Unknown codes default to `General`.
4. **Physical Progress Input**: Physical S-Curve progress metrics (`siteProgress.plan`, `siteProgress.actual`) are seeded or ingested alongside the project configuration for MVP.

---

## Out of Scope (MVP)

1. **User Authentication & Permission Roles**: User logins, passwords, JWT session management, and fine-grained project-level RBAC are excluded from the MVP.
2. **Conzol Two-Way Writeback**: System does not push status changes or edits back to the upstream Conzol repository.
3. **Automated SMTP Mailbox Polling**: Real-time email listening via IMAP/POP3 is excluded for MVP; ingestion is executed via file upload endpoint and scheduled file ingest.
4. **Mobile Native Apps**: Native iOS/Android clients are excluded; web layout is fully responsive for desktop and tablet screens.

---

## Open Questions

1. **Drawing Plan Targets**: Should baseline drawing plan targets (`draw.plan`) per project be configurable via a lightweight UI settings modal, or loaded from a seed configuration table? *(To be resolved in Stage 2.8 Contract Design / 2.9 Delivery Planning)*.
2. **S-Curve Data Feeds**: Preferred future mechanism for updating physical progress percentages (e.g. manual weekly entry vs automated SharePoint Excel sync).

---

## Traceability Matrix

| Requirement ID | Category | Upstream Source | Target Implementation Component |
| :--- | :--- | :--- | :--- |
| **FR1.1 - FR1.6** | Data Ingestion & Safeguards | Scope Document, User Delta Change Log Decision, Idempotency Safeguards | `internal/ingest/csv_parser.go`, `internal/repository/snapshot.go` |
| **FR2.1 - FR2.2** | Revision & Status | Questions Q1, Q2, Snapshot Data Analysis | `internal/domain/status_engine.go` |
| **FR2.3** | Categorization | Question Q4, Conzol Mock Reference | `internal/domain/category_mapper.go` |
| **FR3.1 - FR3.4** | KPI & Delinquency | Question Q3, Conzol Mock Formulas | `internal/domain/kpi_service.go`, `web/src/components/TopBarKPI.tsx` |
| **FR4.1 - FR4.3** | Comparative Grid | Scope Document, Conzol Mock Architecture | `web/src/components/ProjectTable.tsx`, `web/src/components/DisciplineAccordion.tsx` |
| **FR5.1 - FR5.5** | Unlimited Multi-Project Trends | User Trend Requirements, Conzol `#view-trend` | `web/src/components/TrendView.tsx`, `internal/api/trend_handler.go` |
| **FR6.1** | S-Curve Progress | Conzol Mock Right Panel | `web/src/components/ProgressPanel.tsx` |
| **NFR1 - NFR6** | Quality Attributes | Team Practices (`team.md`, `project.md`) | Go backend architecture, React Tailwind v4 components |
