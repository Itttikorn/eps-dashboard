# Bolt Delivery Plan

**Stage**: `delivery-planning` (2.9)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-delivery-agent`  
**Date**: 2026-10-16  

---

## 1. Delivery Sequencing Overview

This document establishes the execution sequence of **Bolts** — where a Bolt represents a planned Construction delivery slice (one build pass over a piece of work, ending in something that runs and can be verified). 

Following the affirmed delivery rules in `team.md` and the user's two-session construction strategy across distinct AI models, delivery is decomposed into two sequential Bolts:

| Bolt ID | Bolt Name | Bundled Units | Unit Kinds | Construction Session | Role in Architecture |
|:---|:---|:---|:---|:---|:---|
| **Bolt 1** | Ingestion Engine & Backend Service | `backend` (`U1`) | `service` | Session 1 (Go Model) | **Walking Skeleton**: Database schema, GORM models, streaming CSV parser, in-memory diffing, audit logging, daily rollups, and live REST API |
| **Bolt 2** | Corporate Management Dashboard UI | `frontend` (`U2`) | `ui` | Session 2 (React Model) | **Client Surface**: React 18 SPA, Recharts analytics, comparative matrix table, and CSV drag-and-drop upload modal |

---

## 2. Bolt Detailed Specifications

### Bolt 1: Ingestion Engine & Backend Service (`backend` / `U1`)
* **Bundled Unit**: `backend` (`U1`, directory: `backend`)
* **Unit Kind**: `service`
* **Walking Skeleton**: **YES** (The walking skeleton — the smallest working end-to-end slice through the relevant integration points). Bolt 1 boots the PostgreSQL database container, initializes GORM schemas, executes streaming CSV parsing, and exposes verified HTTP REST endpoints before any frontend code is authored.
* **Definition of Done (DoD)**:
  1. PostgreSQL 16 container and GORM migration schema (`ingestion_batches`, `document_revisions_current`, `document_change_log`, `project_daily_metrics`) boot cleanly.
  2. Streaming CSV parser parses a 2,000-row `AUTOEMAIL_FILE_06_*.csv` snapshot in $< 500\text{ ms}$.
  3. In-memory diff engine evaluates record deltas in $< 20\text{ ms}$, logging audit changes to `document_change_log` without duplicating unchanged rows.
  4. SHA-256 batch idempotency recognizes re-uploaded files and returns `HTTP 200: ALREADY_INGESTED` with zero duplicate writes.
  5. Synchronous daily rollups compute and insert summary records into `project_daily_metrics`.
  6. All REST endpoints (`/api/v1/health`, `/api/v1/projects`, `/api/v1/projects/summary`, `/api/v1/analytics/trends`, `/api/v1/ingest`) conform strictly to the OpenAPI 3.0 specification in `contract-summary.md` and return the universal 4-field envelope (`status`, `result`, `total`, `search_params`).
  7. Automated unit and integration tests pass with race detection enabled (`go test ./... -race -count=1`) meeting an $\ge 80\%$ line coverage threshold.
* **Confidence Hypothesis**:
  * *What will shipping Bolt 1 prove?* It proves that streaming 23-column CSV ingestion, in-memory state diffing, and transactional daily metric rollups achieve the target throughput ($< 500\text{ ms}$) on live PostgreSQL without state regression or memory leaks.
* **Expected Demo**:
  * Run Docker Compose to boot `backend` and `postgres`.
  * Upload a real 2,000-row sample CSV file via `curl -X POST -F "file=@sample.csv" http://localhost:8080/api/v1/ingest`.
  * Verify `HTTP 201 Created` response envelope, inspect database tables, re-upload to confirm `ALREADY_INGESTED`, and verify `/api/v1/projects` returns populated matrix data.

---

### Bolt 2: Corporate Management Dashboard UI (`frontend` / `U2`)
* **Bundled Unit**: `frontend` (`U2`, directory: `frontend`)
* **Unit Kind**: `ui`
* **Walking Skeleton**: No (Depends on Bolt 1).
* **Definition of Done (DoD)**:
  1. React 18 TypeScript SPA scaffolds cleanly with Vite, Tailwind CSS, Lucide icons, and Recharts.
  2. All user-facing text is strictly English-only, styled with `IBM Plex Sans Thai` and tabular numbers (`tabular-nums`).
  3. Global Topbar KPI cards render total document counts and category distribution pills from `GET /api/v1/projects/summary`.
  4. Comparative matrix table renders all active projects with real-time text search filtering (`#searchInput`) and 4 mandatory UI states (loading skeleton, empty illustration, error alert with retry button, and populated data).
  5. Critical delinquency tags pulse with `.chip-blink` animation when category pending ratio reaches $\ge 45\%$.
  6. Historical trend analytics renders multi-project time-series curves using the deterministic 8+16 colorway, supporting time window presets (`All Time`, `1 Year`, `6 Months`, `3 Months`) and synchronized tooltips.
  7. Drag-and-drop CSV upload portal allows selecting and submitting files to `/api/v1/ingest` with real-time progress indicators and batch summary modal.
  8. Automated frontend component tests pass via Vitest (`npm test`) and production build succeeds (`npm run build`).
* **Confidence Hypothesis**:
  * *What will shipping Bolt 2 prove?* It proves that project directors and engineers can evaluate multi-project QA/QC health, benchmark delinquency bottlenecks, inspect unlimited historical trends, and ingest daily snapshots in a unified, accessible dashboard interface without UI lag ($< 50\text{ ms}$ render time).
* **Expected Demo**:
  * Boot frontend via `npm run dev` and open dashboard in a browser.
  * Search for a project site, verify comparative scorecard metrics, switch time range presets on the historical trend chart, toggle multiple project lines, and upload a CSV snapshot verifying live state updates.

---

## 3. Two-Session Construction Alignment

To support the user's explicit requirement of employing different AI models for backend and frontend construction:

```
+---------------------------------------------------------------------------------+
|                       INCEPTION PHASE (This Session)                            |
| Complete & Freeze: Requirements -> Stories -> Architecture -> Units -> Contracts|
+---------------------------------------------------------------------------------+
                                      |
                      [Phase Boundary Handoff & Pause]
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+     +----------------------------------+
|   SESSION 1: BACKEND BUILD       |     |   SESSION 2: FRONTEND BUILD      |
| Model: Go / Systems Specialist   |     | Model: React / UI Specialist     |
| Scope: Bolt 1 (`backend` / `U1`) |     | Scope: Bolt 2 (`frontend` / `U2`)|
| Contract: Implements OpenAPI 3.0 |     | Contract: Consumes OpenAPI 3.0   |
| Verification: go test -race      |     | Verification: npm test && build  |
+----------------------------------+     +----------------------------------+
```

