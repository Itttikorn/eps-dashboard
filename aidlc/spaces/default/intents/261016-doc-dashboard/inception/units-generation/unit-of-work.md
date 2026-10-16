# Units of Work Specification

**Stage**: `units-generation` (2.7)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-architect-agent`  
**Date**: 2026-10-16  

---

## 1. Unit Inventory & Master Directory Table

The system architecture is decomposed into two discrete, high-cohesion deliverable units aligned directly with the project's two-session construction lifecycle, utilizing clean root-level directory folders:

| Unit ID | Unit Name | Kind | Directory | Complexity | Deployment Model | Summary Description |
|:---|:---|:---|:---|:---|:---|:---|
| U1 | `backend` | service | `backend` | L | Standalone Service Container | Core Go backend service and PostgreSQL database managing CSV ingestion, delta calculation, 5 QA/QC category tracking, and time-series analytics |
| U2 | `frontend` | ui | `frontend` | M | Standalone Client SPA | Modern React 18 TypeScript SPA dashboard managing executive scorecards, historical trend charts, and operational upload UI |

---

## 2. Unit Detailed Definitions & Responsibilities

### Unit 1: `backend` (`U1`)
- **Unit Name**: `backend`
- **Unit ID**: `U1`
- **Target Directory**: `backend`
- **Kind**: `service`
- **Component Ownership**:
  - `IngestionEngine` (CSV stream parser, SHA-256 deduplication, state diffing, transaction manager)
  - `DocumentTrackingDomain` (Active document revisions, 5 QA/QC classification, overdue calculations, project KPI rollups)
  - `HistoricalAnalyticsDomain` (`project_daily_metrics` queries, multi-project time-series generation)
- **Primary Responsibilities**:
  1. **Streaming Ingestion**: Parses `AUTOEMAIL_FILE_06_*.csv` snapshots with encoding auto-detection (UTF-8, ASCII) and strict 23-column header validation.
  2. **Idempotency & Deduplication**: Computes SHA-256 checksums to reject duplicate snapshot uploads and validates snapshot dates to prevent historical state overwrites.
  3. **In-Memory Diffing**: Loads active project records into memory, evaluates delta changes per field, and logs audit events to `document_change_log` without storing duplicate snapshots.
  4. **Active State Maintenance**: Performs atomic upserts into `document_revisions_current` keeping only the latest active revision per document ID.
  5. **5 QA/QC Category Classification**: Automatically classifies documents into Baseline Drawings, Control (ITP, RFI, ITR), Corrective (NCR, CAR), Change (PCR/FCR, DCR, VOR), and Complete.
  6. **Overdue & Delinquency Rules**: Calculates overdue records based on `DUEDATE` and `LASTSTATUS != '50:RETURN'`, computes `% Pending` delinquency ratios.
  7. **Daily Analytics Rollups**: Computes synchronous project-level daily snapshots into `project_daily_metrics` upon every completed batch transaction.
  8. **RESTful API Delivery**: Serves JSON endpoints for health, projects summary, comparative matrix metrics, time-series historical trends, and CSV file upload.
- **Technology Stack**: Go 1.22+, Chi HTTP router, GORM ORM, PostgreSQL 16 driver, Docker, Docker Compose.
- **Deployment Model**: Standalone containerized service interacting with a dedicated PostgreSQL database container.
- **Complexity Estimate**: **L** (Large) — contains high-throughput streaming CSV parser, stateful in-memory diff engine, transactional relational database operations, and analytical query aggregates.
- **Implementation Constraints**:
  - Must process 2,000 CSV rows in $< 500\text{ ms}$ and diff in $< 20\text{ ms}$.
  - Must enforce atomic transaction commits across `ingestion_batches`, `document_revisions_current`, `document_change_log`, and `project_daily_metrics`.

---

### Unit 2: `frontend` (`U2`)
- **Unit Name**: `frontend`
- **Unit ID**: `U2`
- **Target Directory**: `frontend`
- **Kind**: `ui`
- **Component Ownership**:
  - `DashboardUIClient` (React SPA client, comparative matrix views, chart visualizations, upload portal)
- **Primary Responsibilities**:
  1. **Executive Topbar KPI Cards**: Renders macro-level project counts, category distribution badges, and toggleable category drill-down details.
  2. **Comparative Matrix View**: Displays all active projects side-by-side with 5 QA/QC category columns, overdue badges, search toolbar filtering, and sorting.
  3. **Delinquency Visual Feedback**: Renders critical overdue tags, flashing alerts (`.chip-blink`) for categories with $\ge 45\%$ pending ratio, and week-over-week trend indicators ($\blacktriangledown$ / $\blacktriangle$).
  4. **Historical Trend Analytics**: Renders unlimited time-series line chart using Recharts, with time range preset selectors (`All Time`, `1 Year`, `6 Months`, `3 Months`) and multi-project simultaneous overlay using an 8+16 deterministic colorway.
  5. **Operational Upload Portal**: Provides drag-and-drop CSV upload modal with real-time validation feedback, progress state, and batch ingestion summary dialog.
  6. **Mandatory UI States**: Renders 4 standard UI states across all components: loading skeleton shimmer, empty data illustration, error alert with retry button, and populated data views.
  7. **Typography & Styling**: Strictly English-only UI, formatted using `IBM Plex Sans Thai` typography with tabular numbers (`tabular-nums`) for clean financial/engineering column alignment.
- **Technology Stack**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts.
- **Deployment Model**: Standalone single-page application (SPA), served via Vite dev server or static Nginx container, communicating with `backend` over HTTP.
- **Complexity Estimate**: **M** (Medium) — client-side routing, responsive data tables with real-time filtering, high-performance SVG chart visualizations, and accessible upload interactions.
- **Implementation Constraints**:
  - Must render all views in $< 50\text{ ms}$ upon data receipt.
  - Strictly English-only interface text.

---

## 3. Session Boundary & Construction Strategy

To accommodate the user's requirement to use distinct AI models for backend and frontend construction, the construction phase will be split into two separate chat sessions:

1. **Session 1: Backend Construction (`backend` / `U1`)**:
   - Directory: `backend`
   - Focuses entirely on Go backend service with GORM, PostgreSQL relational schema, CSV streaming parser, diff engine, daily rollups, and RESTful API endpoints.
   - Verified via unit tests, integration tests against PostgreSQL, and curl/HTTP endpoint verification.
2. **Session 2: Frontend Construction (`frontend` / `U2`)**:
   - Directory: `frontend`
   - Focuses entirely on React 18 SPA, Tailwind styling, Recharts visualization, search filtering, and upload modal.
   - Built against the frozen OpenAPI 3.0 specification produced in Stage 2.8 (`contract-design`), integrating seamlessly with the running backend service.
3. **Contract Guarantees**:
   - Stage 2.8 (`contract-design`) generates an immutable OpenAPI 3.0 specification (`openapi.yaml` / `contract.md`) and mock fixtures to ensure zero contract drift between Session 1 and Session 2.

---

## 4. Scope Exclusions & Boundary Invariants

The following items are strictly out of scope across both `U1` and `U2`:
1. **Physical Construction S-Curves**: Site progress tracking is out of scope.
2. **Planned Drawing Quotas**: No `plan` vs `actual` target quotas.
3. **Punchlists**: No Set A / Set B site inspection tracking.
4. **In-Browser Document Rendering**: No PDF or CAD viewers.
5. **Inline Metadata Editing**: Document status updates occur exclusively via daily CSV snapshots.
6. **User Authentication & RBAC**: No login walls, passwords, or permission tiers.
7. **Discipline Drill-Down Accordion**: Accordion sub-table for ME/CE/EE drawings is descoped from the UI.
