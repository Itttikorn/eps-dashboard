# Units Generation Questions & Planning

## How would you like to answer the questions?
A. Guide me (ask questions one by one with recommended defaults)
B. I'll edit the file directly
C. Chat (discuss unit decomposition conversationally)
X. Other (please specify)

[Answer]: A

## Q1. What unit boundary decomposition should be established to support your two-session construction strategy?
A. 2 Discrete Deliverable Units: (1) `wa-backend` (`U1`, kind: `service`, directory: `u1-backend-service`): Go backend service and PostgreSQL database managing CSV ingestion, delta calculation, 5 QA/QC category tracking, and time-series rollups; (2) `wa-frontend` (`U2`, kind: `ui`, directory: `u2-frontend-dashboard`): React SPA client managing scorecards, trend charts, and upload UI
B. 3 Units: Separating Ingestion Engine into a standalone CLI worker unit, with API Service and Web UI as separate units
C. Single Monolithic Unit: Developing frontend and backend together in a unified repository unit
D. Not yet defined
X. Other (please specify)

[Answer]: A (2 Discrete Deliverable Units: backend and frontend)

## Q2. How should interface contracts between the backend and frontend units be governed across sessions?
A. Formal OpenAPI 3.0 REST contract frozen in Stage 2.8 (Contract Design): Produces deterministic request/response schemas, endpoint URLs, and mock fixtures so that the backend model and frontend model can construct their units with zero contract drift
B. Informal shared markdown notes without strict JSON schema validation
C. Ad-hoc endpoint integration during frontend construction
D. Not yet defined
X. Other (please specify)

[Answer]: A (Formal OpenAPI 3.0 REST contract frozen in Stage 2.8)

## Q3. What dependency structure and construction sequencing should be enforced between units?
A. Ingestion-first topological dependency (`wa-backend` -> `wa-frontend`): `wa-backend` establishes the database schema, CSV parser, and verified REST endpoints first; `wa-frontend` depends on `wa-backend` and integrates against the running API container
B. Frontend-first with mock server
C. Fully parallel construction without shared integration verification
D. Not yet defined
X. Other (please specify)

[Answer]: A (Ingestion-first topological dependency: backend -> frontend)

## Consolidated Summary Confirmation

- **Unit 1 (`backend` / `U1`)**:
  - Kind: `service`
  - Target directory: `backend`
  - Tech stack: Go, Chi router, GORM, PostgreSQL 16, Docker
  - Scope: CSV Ingestion Engine (streaming parser, SHA-256 deduplication, idempotent upsert, diff engine), Document Tracking Domain (5 QA/QC category classification, `% Pending` calculation, project health metrics), Historical Analytics Domain (`project_daily_metrics` queries, multi-project comparative trends), and REST API endpoints.
- **Unit 2 (`frontend` / `U2`)**:
  - Kind: `ui`
  - Target directory: `frontend`
  - Tech stack: React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts, Vite
  - Scope: Executive QA/QC Overview (comparative scorecards, delinquent alerts), Historical Trend Analytics (multi-project line chart with 8+16 deterministic palette, date range selector), Operational CSV Ingestion (drag-and-drop upload portal, validation feedback), strictly English UI, `IBM Plex Sans Thai` font with `tabular-nums`.
- **Interface Contract & Inter-Session Boundary**:
  - Frozen OpenAPI 3.0 REST specification established in Stage 2.8 (`contract-design`) to guarantee zero contract drift across separate Construction sessions.
- **Topological Dependency & Construction Sequencing**:
  - Ingestion-first topological dependency: `backend` (U1) constructed first, followed by `frontend` (U2) consuming the verified contract and backend API.
- **Strict Scope Exclusions**:
  - Exclude physical construction S-curves, drawing quotas, punchlists (Set A/B), in-browser CAD/PDF viewing, inline metadata editing, user auth/RBAC, and discipline drill-down accordion.

Does this all look correct before I generate the units generation artifacts?
- Looks correct
- Request changes

[Answer]: Looks correct
