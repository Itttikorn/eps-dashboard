# Functional Design Specification: Unit `frontend`

**Stage**: `functional-design` (3.1)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Inception Alignment

This functional specification establishes the authoritative, end-to-end user interaction workflows, screen states, and component contracts for the corporate document management dashboard (`frontend` / `U2`), directly tracing from upstream Inception artifacts:
- [Requirements Specification (2.3)](file:///c:/Users/user/Desktop/SCG/eps-dashboard/aidlc/spaces/default/intents/261016-doc-dashboard/inception/requirements-analysis/requirements.md): `FR1.1`–`FR1.6` (CSV Ingestion & Validation), `FR2.1`–`FR2.3` (5 QA/QC Categories & Revision Rules), `FR3.1`–`FR3.4` (KPI Scorecards & Delinquency Tracking), `FR4.1`–`FR4.3` (Comparative Grid, Accordion & Search), `FR5.1`–`FR5.5` (Unlimited Multi-Project Trend Analytics), and `NFR1`–`NFR5`.
- [Refined Mockups Specification (2.5)](file:///c:/Users/user/Desktop/SCG/eps-dashboard/aidlc/spaces/default/intents/261016-doc-dashboard/inception/refined-mockups/mockups.md): Screen 1 (QA/QC Multi-Project Comparative Overview), Screen 2 (Unlimited Multi-Project Historical Trend Analytics), Screen 3 (Operational CSV Upload & Ingestion Monitor), Global 3-Tab Shell, and Dark-Navy Header (`#152444`).
- [Contract Summary (2.8)](file:///c:/Users/user/Desktop/SCG/eps-dashboard/aidlc/spaces/default/intents/261016-doc-dashboard/inception/contract-design/contract-summary.md): Formal OpenAPI 3.0.3 endpoints (`/api/v1/health`, `/api/v1/projects/summary`, `/api/v1/projects`, `/api/v1/projects/{projectId}`, `/api/v1/projects/{projectId}/disciplines`, `/api/v1/analytics/trends`, `/api/v1/ingest`) and Universal Envelope.
- [Frontend Standards & Architecture](file:///c:/Users/user/Desktop/SCG/eps-dashboard/aidlc/spaces/default/knowledge/aidlc-shared/frontend-standards.md): 5-layer architecture, 4 mandatory UI states (Loading, Empty, Error, Populated), IBM Plex Sans Thai typography, tabular numbers (`tabular-nums`), and 4/8pt spatial rhythm.

---

## 2. Global Shell & Navigation Framework

The application implements a Single-Page Application (SPA) architecture wrapped in `DashboardShell`:
- **Header (`HeaderNav`)**: Corporate dark-navy background (`#152444`), SCG / Conzol Doc Tracker brand logo, subtitle ("Corporate Document Management System"), environment/version pill (`v1.0.0`), system health indicator (connected to `GET /health`), and a quick action button "[Upload CSV]" triggering Screen 3 / Upload Modal.
- **Global Navigation Tabs (`NavigationTabs`)**:
  - `[ (1) QA/QC Comparative Overview ]` (Default active tab)
  - `[ (2) Trend Analytics ]`
  - `[ (3) CSV Ingestion ]`
- **Global Filter Bar (`GlobalFilterBar`)**:
  - Multi-Project Selector: `[All Projects (3) v]` with individual checkboxes.
  - Snapshot Date Picker: `[2026-03-31 v]` defaulting to latest snapshot.
  - Quick Date Presets: `[Today]`, `[Yesterday]`, `[Latest Snapshot]`.
  - State persists in client memory (and URL parameters via debounced router/query parameters) across tab transitions.

---

## 3. Screen 1: Multi-Project QA/QC Comparative Overview

### 3.1 Executive Portfolio Topbar KPI Cards (`TopbarKpiCards`)
- Displays portfolio macro totals aggregated across all active selected projects:
  - **Total Portfolio Documents**: Total count of active document revisions (`FR2.1`).
  - **Overall Backlog / In Review**: Active documents awaiting review/approval (`FR2.2`).
  - **Overdue Count & %**: Documents with `current_date > DUEDATE` and not returned (`FR3.2`).
  - **5 QA/QC Pillar Summary Cards**:
    1. **Baseline Drawings** (Color: `#2f6fce`): Total, Approved, In-Review, Overdue.
    2. **Control** (Color: `#12a4a0`): `ITP`, `RFI`, `ITR` Open vs Closed.
    3. **Corrective Actions** (Color: `#ee8a1f`): `NCR`, `CAR` Open vs Closed.
    4. **Change Management** (Color: `#26a65b`): `PCR`/`FCR`, `DCR`, `VOR` Open vs Closed.
    5. **Complete** (Color: `#8b5cf6`): Pre/post commissioning punchlists (`ชุด A`/`ชุด B`) & returned.
- **Expandable Category Detail (`CategoryDetailGrid`)**: Clicking any category card smoothly expands a detail drawer (`.kpi-detail`) showing project-by-project breakdown for that category.

### 3.2 Multi-Project Comparative Health Cards & Matrix (`ProjectMatrixTable`)
- Renders projects side-by-side or stacked in executive project cards (`ProjectCard`) matching Mockups Section 2:
  - **Project Header**: Project ID (`SKK-IM-CM-26002`), Site Description, Health Badge:
    - `ON TRACK`: Overdue $< 5\%$ (Green badge).
    - `ATTENTION`: Overdue $5\% - 15\%$ (Amber badge).
    - `CRITICAL`: Overdue $> 15\%$ (Red badge).
  - **Summary Metrics**: Total Docs, Approved (Count + %), In Review (Count + %), Overdue (Count + %).
  - **5 Pillar Progress Cards**: Each pillar renders count badges, approval progress bar, and delinquency indicators:
    - Progress %: $\frac{\text{Approved}}{\text{Total}} \times 100$.
    - Delinquency Alert: If $\% \text{ Pending} \ge 45.0\%$, applies `.chip-blink` pulsing alert animation (`animate-pulse border-red-500 bg-red-50/50`).
    - Directional Week-over-Week Net Change Indicator:
      - $\blacktriangledown$ Green: Backlog shrinking.
      - $\blacktriangle$ Red: Backlog expanding.
      - $-$ Neutral: Backlog stable.
- **Expandable Discipline Accordion (`DisciplineAccordion`)**:
  - Clicking `.expand-btn` reveals:
    - Engineering disciplines: Mechanical (`ME`), Civil (`CE`), Electrical (`EE`) total vs approved.
    - Drawing type presence chips: `FS`, `ML`, `PR`, `GA`, `LD`, `FD`, `PID`, `SLD`.
    - Pending aging metric: Average aging in days for open corrective/change items.

### 3.3 Search & Filter Toolbar (`SearchToolbar`)
- Input field `#searchInput` with 200ms debounce. Filters projects in real time by Project ID, Site Code, or Description.
- Column sorting by Total Documents, Overdue Count, or % Pending.

---

## 4. Screen 2: Unlimited Multi-Project Historical Trend Analytics

### 4.1 Time Window Presets & Metric Selector
- **Preset Buttons**: `[30 Days]`, `[90 Days]`, `[180 Days]`, `[1 Year]`, `[(All Time)]`.
- **Custom Range**: Start Date and End Date pickers.
- **Metric Radios**:
  - `(*) Total Volume`
  - `( ) Approved Volume`
  - `( ) In-Review Backlog`
  - `( ) Overdue Volume`

### 4.2 Multi-Project Selection & Deterministic Colorway
- Multi-select checkbox popover (`ProjectSelectorDropdown`):
  - Projects: `[x] SKK-IM-CM-26002`, `[x] STS-CN-PP-26001`, `[x] STS-EN-PP-26001`.
  - Actions: `[Select All]`, `[Clear All]`.
- Deterministic 8+16 color mapping: Each project maintains a permanent color across filtering/sorting (e.g., Project 1 = `#2f6fce` Royal Blue, Project 2 = `#ee8a1f` Amber, Project 3 = `#12a4a0` Teal, Project 4 = `#26a65b` Emerald, Project 5 = `#8b5cf6` Purple).

### 4.3 Interactive Chart Canvas (`HistoricalTrendChart`)
- High-performance SVG line chart utilizing Recharts.
- Continuous cubic bezier interpolation with subtle dot markers on milestone dates.
- Interactive crosshair cursor vertical line showing aligned values across all selected projects on hovered date.
- Unified hover tooltip (`TrendTooltip`) displaying date, project name, color badge, document volume, overdue count, and weekly delta.

---

## 5. Screen 3: Operational CSV Upload & Ingestion Monitor

### 5.1 Drag-and-Drop CSV Ingestion Zone (`CsvUploadZone`)
- Accepts daily `AUTOEMAIL_FILE_06_*.csv` snapshots up to 50MB.
- Supports UTF-8 and ASCII encoding auto-detection.
- Visual drag-and-drop feedback with dropzone hover highlight, file validation, and clear button.
- Target project selector (when uploading a single-project CSV, or auto-detecting from CSV `PROJECTID` column).
- Progress indicator with animated upload state and elapsed time.

### 5.2 Real-Time Batch Ingestion History (`IngestionHistoryTable`)
- Renders recent batch ingestion records directly under the upload dropzone (Mockups Screen 3):
  - **Batch ID**: e.g., `BATCH-260331`.
  - **Project Target**: e.g., `SKK-IM-CM-26002`.
  - **Snapshot Date**: e.g., `2026-03-31`.
  - **Rows Total**: e.g., `512 rows`.
  - **Deltas New/Updated**: e.g., `8 updated`.
  - **Skipped Unchanged**: e.g., `504 unchanged`.
  - **Ingestion Status**: `SUCCESS (18ms)`, `CONFLICT (Chronological downgrade)`, or `ERROR`.
- Detailed error diagnostics modal displaying corrupted line numbers, column names, or timestamp downgrade warnings when ingestion fails.

---

## 6. Mandatory Screen States & Visual Hygiene

Every screen and organism strictly enforces the 4 standard UI states:
1. **Loading State (`SkeletonState`)**:
   - Zero Cumulative Layout Shift (CLS $< 0.1$). Shimmer skeleton matching exact dimensions of KPI cards, matrix tables, and trend chart canvas.
2. **Empty Data State (`EmptyState`)**:
   - Centered container with Lucide icon, explanatory heading ("No Projects Found" or "No Ingestion History"), descriptive helper text, and action CTA ("Reset Filters" or "Upload CSV").
3. **Error State (`ErrorState`)**:
   - Accessible alert container with error message extracted from the universal API envelope (`status.description`), error code, and a primary "[Retry]" button with exponential backoff retry logic.
4. **Populated State (`PopulatedState`)**:
   - High-contrast, clean corporate aesthetic with `IBM Plex Sans Thai` typography, tabular numbers (`tabular-nums`), clear visual hierarchies, and responsive mobile/desktop breakpoints.
