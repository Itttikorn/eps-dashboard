# User Stories: Corporate Document Management System Dashboard

**Stage**: `user-stories` (2.4)  
**Lead Agent**: `aidlc-product-agent`  
**Intent**: `261016-doc-dashboard`  
**Upstream Artifacts**:
- [Requirements Specification](../requirements-analysis/requirements.md)
- [User Personas](personas.md)
- [Scope Document](../../ideation/scope-definition/scope-document.md)
- [Team Practices](../../../../memory/team.md)

---

## Epic 1: Daily Ingestion & Live Delta Engine

### US1.1: Snapshot CSV Upload and Ingestion
**Story ID**: `US1.1`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR1.1`, `FR1.3`, `NFR1.3`  
**As a** Data Administrator / CSV Uploader,  
**I want to** upload a daily `AUTOEMAIL_FILE_06_*.csv` snapshot file via an intuitive upload modal or automated HTTP POST endpoint,  
**So that** the system ingests active document records and immediately updates the live dashboard state.

#### Acceptance Criteria
- **AC1.1.1**: **Given** a valid UTF-8 CSV snapshot file conforming to the 23-column schema, **When** uploaded via `POST /api/v1/ingest`, **Then** the Go streaming parser parses all rows and upserts active records into `document_revisions_current` within 500 ms for a 2,000-row file.
- **AC1.1.2**: **Given** an invalid or corrupted file (e.g. non-CSV, missing header columns), **When** submitted, **Then** the backend rejects the file, triggers an atomic rollback, and returns a 400 Bad Request envelope with a clear diagnostic description.
- **AC1.1.3**: **Given** a successful ingestion, **When** processing completes, **Then** the API returns a standard envelope containing row counts processed, new revisions found, and modified records.

### US1.2: In-Memory Delta Detection and Audit Logging
**Story ID**: `US1.2`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR1.2`, `FR1.4`, `NFR2.1`  
**As a** Data Administrator,  
**I want** the ingestion service to compare incoming records in memory against current database state and log only modified fields,  
**So that** database storage bloat is reduced by 98% while preserving an exact field-level audit trail.

#### Acceptance Criteria
- **AC1.2.1**: **Given** incoming snapshot rows identical to existing records in `document_revisions_current`, **When** evaluated in memory, **Then** the engine skips writing to the live table and writes zero rows to `document_change_log`.
- **AC1.2.2**: **Given** a document record whose status changes (e.g. `LASTSTATUS` changes from `40:WAIT SYN` to `50:RETURN` or `RET` is stamped), **When** ingested, **Then** the engine appends a change event to `document_change_log` recording `(project_id, doc_id, rev_id, field_name, old_value, new_value, changed_at)`.
- **AC1.2.3**: **Given** in-memory diffing of 2,000 documents, **When** executed on a standard server container, **Then** the diff algorithm finishes execution in $< 20\text{ ms}$.

### US1.3: Ingestion Idempotency and Out-of-Order Safeguards
**Story ID**: `US1.3`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR1.5`, `FR1.6`, `NFR4.3`  
**As a** Data Administrator,  
**I want** the system to track file hashes and snapshot dates,  
**So that** duplicate uploads or accidental out-of-order historical uploads never corrupt live document data.

#### Acceptance Criteria
- **AC1.3.1**: **Given** a CSV file whose SHA-256 hash already exists in `ingestion_batches`, **When** re-uploaded, **Then** the system recognizes the duplicate, safely bypasses processing, and returns `HTTP 200: ALREADY_INGESTED` with zero redundant delta events.
- **AC1.3.2**: **Given** an incoming document record with a revision date older than the current recorded revision date (`incoming.rev_date < current.rev_date`), **When** evaluated, **Then** the system ignores the downgrade to prevent state regression.
- **AC1.3.3**: **Given** a completed batch ingestion, **When** transaction commits, **Then** exactly one aggregated summary row is computed and inserted into `project_daily_metrics` for that project and date.

---

## Epic 2: Multi-Project Overview & Delinquency Scorecard

### US2.1: Global Topbar KPI Cards
**Story ID**: `US2.1`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR2.1`, `FR2.3`, `FR3.1`, `NFR1.1`  
**As a** Dashboard Viewer,  
**I want to** view global summary KPI cards across all active projects in the topbar header,  
**So that** I have an instant macro-level pulse of total volume and category distributions.

#### Acceptance Criteria
- **AC2.1.1**: **Given** active projects in the database, **When** the dashboard loads, **Then** the topbar renders total document count and category pill counts (Baseline Drawings, Control, Corrective, Change, and Complete) in $< 50\text{ ms}$.
- **AC2.1.2**: **Given** multiple revisions of a document `(PROJECTID, DOCID)`, **When** computing topbar counts, **Then** the engine counts only the latest active revision, excluding superseded historical revisions.
- **AC2.1.3**: **Given** an interactive KPI card in the topbar, **When** clicked by a user, **Then** it toggles an expanded category details grid (`.kpi-detail`) showing project-level contributions.

### US2.2: Multi-Project Comparative Matrix Grid
**Story ID**: `US2.2`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR4.1`, `FR4.3`, `NFR5.1`  
**As a** Dashboard Viewer,  
**I want to** view all active project sites side-by-side in a comparative matrix table,  
**So that** I can benchmark document management health across sites in a single screen.

#### Acceptance Criteria
- **AC2.2.1**: **Given** the comparative overview view, **When** rendered, **Then** each project row displays Site Code, Project ID, Baseline Drawings, Control (ITP, RFI, ITR), Corrective (NCR, CAR), Change (PCR/FCR, DCR, VOR), and Overdue counts.
- **AC2.2.2**: **Given** user input in the search toolbar (`#searchInput`), **When** typing a project ID or site name, **Then** the matrix dynamically filters rows in real time without a page reload.
- **AC2.2.3**: **Given** empty, error, or loading states, **When** encountering network latency or zero records, **Then** the table displays the 4 mandatory UI states (skeleton shimmer, empty illustration, error alert with retry button, or populated tabular data).

### US2.3: Delinquency Ratio and Overdue Flagging
**Story ID**: `US2.3`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR2.2`, `FR3.2`, `FR3.3`, `FR3.4`  
**As a** Dashboard Viewer,  
**I want to** see overdue documents and high-delinquency categories highlighted with clear visual status tags,  
**So that** I can immediately escalate review bottlenecks and prioritize contractor reviews.

#### Acceptance Criteria
- **AC2.3.1**: **Given** a document revision with `current_date > DUEDATE` and not returned (`LASTSTATUS != '50:RETURN'`), **When** evaluated, **Then** it increments the project's Overdue count (`เกินกำหนด`).
- **AC2.3.2**: **Given** categories with open/closed states (RFI, NCR, CAR, Change), **When** pending percentage ($\frac{\text{Open}}{\text{Open}+\text{Closed}} \times 100$) reaches $\ge 45\%$, **Then** the cell renders as critical with a pulsing animation (`.chip-blink`).
- **AC2.3.3**: **Given** historical snapshot rollups, **When** comparing the current week to the previous week, **Then** the status pill displays a net change tag ($\blacktriangledown$ green for shrinking backlog, $\blacktriangle$ red for expanding backlog).

---

## Epic 3: Discipline & Document-Type Drill-Down

### US3.1: Expandable Discipline Drawing Breakdown
**Story ID**: `US3.1`  
**Priority**: Should Have (MoSCoW)  
**Traceability**: `FR4.2`, `FR2.3`, `NFR5.1`  
**As a** Dashboard Viewer,  
**I want to** expand a project row to inspect drawing counts by engineering discipline (ME, CE, EE),  
**So that** I can identify which engineering discipline is lagging behind.

#### Acceptance Criteria
- **AC3.1.1**: **Given** a project row in the comparative table, **When** clicking the expand chevron button (`.expand-btn`), **Then** an accordion row smoothly slides open displaying Mechanical (`ME`), Civil (`CE`), and Electrical (`EE`) drawing counts.
- **AC3.1.2**: **Given** active drawing types in the snapshot, **When** expanded, **Then** the view shows availability badges for drawing types (`FS`, `GA`, `SLD`, `PID`, `WD`, `CBL`) indicating active delivery.

### US3.2: Corrective Action Aging Inspection
**Story ID**: `US3.2`  
**Priority**: Should Have (MoSCoW)  
**Traceability**: `FR2.3`, `FR4.2`  
**As a** Dashboard Viewer,  
**I want to** see the average age in days for unresolved NCRs and CARs,  
**So that** I can address contractor quality issues that have remained stagnant.

#### Acceptance Criteria
- **AC3.2.1**: **Given** open NCR or CAR items in an expanded project view, **When** calculated, **Then** the system displays the average age in calendar days from `TRANSMITAL_DATE` to `current_date`.
- **AC3.2.2**: **Given** corrective action items, **When** categorized, **Then** the system clearly separates items by flow: `Owner → EPS` vs `EPS → Contractor`.

---

## Epic 4: Unlimited Multi-Project Historical Trend Analytics

### US4.1: Unlimited Historical Lifecycle Trend View
**Story ID**: `US4.1`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR5.1`, `FR5.5`, `NFR1.4`  
**As a** Dashboard Viewer,  
**I want to** view document volume trends across the full historical lifecycle of projects without time limits,  
**So that** I can evaluate long-term document velocity and burn-down performance.

#### Acceptance Criteria
- **AC4.1.1**: **Given** the trend tab (`#view-trend`), **When** selected, **Then** the system queries `project_daily_metrics` and renders a continuous time-series chart spanning the full lifetime of project data in $< 50\text{ ms}$.
- **AC4.1.2**: **Given** time range preset buttons in the toolbar (`All Time`, `1 Year`, `6 Months`, `3 Months`), **When** clicking a preset, **Then** the graph canvas dynamically scales its horizontal axis to the selected window.

### US4.2: Simultaneous Multi-Project Selection & Comparative Overlay
**Story ID**: `US4.2`  
**Priority**: Must Have (MoSCoW)  
**Traceability**: `FR5.2`, `FR5.3`, `FR5.4`  
**As a** Dashboard Viewer,  
**I want to** select multiple projects simultaneously from a filter dropdown,  
**So that** their trend curves are overlaid onto the same canvas with distinctive colors for direct comparison.

#### Acceptance Criteria
- **AC4.2.1**: **Given** the project filter dropdown (`ตัวกรองโครงการ`), **When** checking multiple project checkboxes (e.g. Project A and Project B), **Then** both projects render as distinct trend lines using stable categorical colors (`--trend-1`, `--trend-2`).
- **AC4.2.2**: **Given** multiple overlaid project lines, **When** hovering over any point along the timeline, **Then** a unified tooltip appears displaying the date and the document volume of all currently selected projects side-by-side.
- **AC4.2.3**: **Given** unchecking a project, **When** unchecked, **Then** that project's curve is cleanly removed from the canvas while remaining curves maintain their assigned colors.

---

## INVEST Compliance & Boundary Summary

1. **Independent**: Epics can be developed and verified in structured isolation (Ingestion first, Core Domain second, Matrix UI third, Trend Analytics fourth).
2. **Negotiable**: Time range presets and visual color thresholds can be adjusted during implementation without altering the core database models.
3. **Valuable**: Eliminates daily spreadsheet manual review and provides immediate multi-project QA/QC visibility.
4. **Estimable**: Clear scope grounded strictly in the 23 verified CSV columns.
5. **Small**: Sized for incremental implementation across the three planned delivery layers.
6. **Testable**: Every acceptance criterion is specified in verifiable BDD Given/When/Then scenarios.

### Explicit Out-of-Scope Enforcement
- No stories for physical S-curve site progress (external to document management).
- No stories for planned drawing quotas (`plan` vs `actual`).
- No stories for punchlists (Set A / Set B).
- No stories for in-browser file rendering or inline cell editing.
- No stories for user authentication, passwords, or fine-grained RBAC.

