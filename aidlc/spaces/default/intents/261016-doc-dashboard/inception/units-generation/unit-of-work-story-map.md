# Unit of Work Story Map

**Stage**: `units-generation` (2.7)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-architect-agent`  
**Date**: 2026-10-16  

---

## 1. Master Story-to-Unit Mapping

Every user story from `stories.md` is unambiguously mapped to its primary implementing unit and target filesystem directory (`backend` and `frontend`):

| Story ID | Epic | User Story Title | Unit ID | Implementing Unit | Directory | Implementation Priority | Cross-Cutting Details |
|:---|:---|:---|:---|:---|:---|:---|:---|
| US1.1 | Epic 1 | Snapshot CSV Upload and Ingestion | U1 | `backend` | `backend` | Priority 1 (Ingestion Core) | Backend owns multipart stream parsing and DB upsert; frontend upload modal consumes this endpoint |
| US1.2 | Epic 1 | In-Memory Delta Detection and Audit Logging | U1 | `backend` | `backend` | Priority 1 (Ingestion Core) | Backend diff engine compares incoming records against live state and appends to change log |
| US1.3 | Epic 1 | Ingestion Idempotency and Out-of-Order Safeguards | U1 | `backend` | `backend` | Priority 1 (Ingestion Core) | Backend SHA-256 checksum tracking, revision chronology safeguards, and daily rollups |
| US2.1 | Epic 2 | Global Topbar KPI Cards | U2 | `frontend` | `frontend` | Priority 2 (UI Scorecards) | Frontend renders macro summary cards and category distribution badges from backend summary API |
| US2.2 | Epic 2 | Multi-Project Comparative Matrix Grid | U2 | `frontend` | `frontend` | Priority 2 (UI Scorecards) | Frontend renders comparative matrix table with real-time text search filtering and sorting |
| US2.3 | Epic 2 | Delinquency Ratio and Overdue Flagging | U2 | `frontend` | `frontend` | Priority 2 (UI Scorecards) | Frontend renders delinquency badges, pulsing critical alerts, and week-over-week trend indicators |
| US3.1 | Epic 3 | Expandable Discipline Drawing Breakdown | U1 | `backend` | `backend` | Priority 3 (Domain Depth) | Backend data model classifies ME, CE, and EE discipline codes from document metadata |
| US3.2 | Epic 3 | Corrective Action Aging Inspection | U1 | `backend` | `backend` | Priority 3 (Domain Depth) | Backend computes calendar day aging and flow categorization (Owner->EPS vs EPS->Contractor) |
| US4.1 | Epic 4 | Unlimited Historical Lifecycle Trend View | U2 | `frontend` | `frontend` | Priority 2 (UI Analytics) | Frontend renders unlimited time-series Recharts canvas with preset time window scaling |
| US4.2 | Epic 4 | Simultaneous Multi-Project Selection & Comparative Overlay | U2 | `frontend` | `frontend` | Priority 2 (UI Analytics) | Frontend renders multi-project curve overlays using deterministic palette with synchronized tooltips |

---

## 2. Cross-Cutting Concerns & Inter-Unit Collaboration

While each story has a primary implementing unit for ownership and construction assignment, several stories exhibit cross-cutting concerns spanning both units:

1. **CSV Ingestion Workflow (`US1.1`)**:
   - **Backend (`backend` / `U1`)**: Implements streaming parser, encoding detector, transaction coordinator, and returns structured JSON envelope with row counts and error diagnostics.
   - **Frontend (`frontend` / `U2`)**: Implements accessible drag-and-drop file upload dialog, file type validation, upload progress indicators, and completion alert dialog.
2. **Project Summaries & Matrix Metrics (`US2.1`, `US2.2`, `US2.3`)**:
   - **Backend (`backend` / `U1`)**: Computes category counts (Baseline, Control, Corrective, Change, Complete), evaluates overdue records (`DUEDATE`), and computes `% Pending` delinquency ratios.
   - **Frontend (`frontend` / `U2`)**: Binds API response data to responsive tabular layout, search input, pulsing visual alerts (`.chip-blink`), and trend indicators.
3. **Time-Series Analytics (`US4.1`, `US4.2`)**:
   - **Backend (`backend` / `U1`)**: Stores daily snapshots in `project_daily_metrics` and serves optimized time-series range queries filtered by date range and project IDs.
   - **Frontend (`frontend` / `U2`)**: Formats dates with `IBM Plex Sans Thai`, maps projects to deterministic colorway, and manages multi-selection checkbox state.

---

## 3. Story Implementation Sequence Within Units

### Unit 1: `backend` (`backend`)
1. **Foundation & Schema**: Initialize GORM models and PostgreSQL schema (`ingestion_batches`, `document_revisions_current`, `document_change_log`, `project_daily_metrics`).
2. **`US1.1`**: Core CSV parser and atomic batch ingestion pipeline.
3. **`US1.2`**: In-memory diff engine and audit event emission.
4. **`US1.3`**: SHA-256 batch idempotency, date downgrade prevention, and synchronous daily metrics calculation.
5. **`US3.1` & `US3.2`**: Discipline extraction and corrective action aging calculations.
6. **API Endpoints**: Expose `/api/v1/health`, `/api/v1/projects`, `/api/v1/projects/summary`, `/api/v1/analytics/trends`, `/api/v1/ingest`.

### Unit 2: `frontend` (`frontend`)
1. **Foundation & Scaffolding**: Setup Vite, TypeScript, Tailwind CSS, and `IBM Plex Sans Thai` typography.
2. **`US2.1`**: Topbar KPI summary cards with category distribution badges.
3. **`US2.2`**: Multi-project comparative matrix table with search filtering and 4 UI states.
4. **`US2.3`**: Delinquency tagging, pulsing alerts, and week-over-week backlog indicators.
5. **`US4.1`**: Unlimited historical time-series line chart with time window presets.
6. **`US4.2`**: Multi-project selection dropdown, overlaid curves, and synchronized tooltips.
7. **`US1.1` (UI)**: Drag-and-drop CSV upload modal with validation and feedback.

---

## 4. Coverage Verification & Validation

- **Total Upstream Stories**: 10 stories (`US1.1`, `US1.2`, `US1.3`, `US2.1`, `US2.2`, `US2.3`, `US3.1`, `US3.2`, `US4.1`, `US4.2`).
- **Assigned to `backend` (`U1`)**: 5 stories (`US1.1`, `US1.2`, `US1.3`, `US3.1`, `US3.2`).
- **Assigned to `frontend` (`U2`)**: 5 stories (`US2.1`, `US2.2`, `US2.3`, `US4.1`, `US4.2`).
- **Unassigned Stories**: 0 (100% upstream story coverage).
- **Empty Units**: 0 (both units carry critical, balanced delivery responsibilities).
