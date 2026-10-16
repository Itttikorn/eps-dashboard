# Domain Design Questions & Architectural Decisions

## How would you like to answer the questions?
A. Guide me (ask questions one by one with recommended defaults)
B. I'll edit the file directly
C. Chat (discuss architectural boundaries conversationally)
X. Other (please specify)

[Answer]: A

## Q1. What component boundary decomposition should be established for the system?
A. 4 Cohesive Logical Components: (1) `IngestionEngine` (handles CSV streaming, SHA-256 batch idempotency, in-memory diffing, delta change logging), (2) `DocumentTrackingDomain` (owns live document state, 5 QA/QC category classification, overdue calculations, and project summary cards), (3) `HistoricalAnalyticsDomain` (owns daily rollup aggregation, unlimited time-series queries, and multi-project comparative trend streams), (4) `DashboardUIClient` (React SPA rendering comparative scorecards, Recharts multi-project trends with 8+16 colorway, and CSV drag-and-drop upload)
B. Monolithic Single-Domain Component: A single unified backend component owning all ingestion, tracking, and metrics together
C. Micro-component decomposition (separating parsing, diffing, overdue evaluation, metrics, and cards into 8+ distinct services)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. When should project daily metrics rollups (`project_daily_metrics`) be computed?
A. Synchronous Ingestion Pipeline (atomic transaction): The daily rollup row is computed and committed inside the same database transaction as the document upserts and delta logs, ensuring instant chart availability without background job lag
B. Asynchronous Background Worker: A background cron worker periodically scans and generates daily rollup rows
C. Query-time on-the-fly aggregation without persistent daily metrics rollup table
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. What communication and interaction style should connect the UI client to the backend domain components?
A. Synchronous RESTful JSON API over HTTP (clean resource endpoints: `/api/projects`, `/api/projects/summary`, `/api/projects/trends`, `/api/ingestion/upload`) with high cacheability and simple integration
B. GraphQL API with a single flexible query endpoint
C. gRPC-Web with protobuf serialization
D. Not yet defined
X. Other (please specify)

[Answer]: A (Synchronous RESTful JSON API over HTTP)

## Consolidated Summary Confirmation

- Component Boundaries: 4 cohesive logical components:
  1. `IngestionEngine`: Handles CSV streaming, SHA-256 batch idempotency, in-memory diffing, upserts to `document_revisions_current`, delta events to `document_change_log`, and daily metrics rollups.
  2. `DocumentTrackingDomain`: Owns active document revisions, 5 QA/QC category classification, `% Pending` delinquency ratios, and project health scorecards.
  3. `HistoricalAnalyticsDomain`: Owns `project_daily_metrics` queries, unlimited date range filtering, and multi-project comparative time-series trend generation.
  4. `DashboardUIClient`: React SPA using `IBM Plex Sans Thai` typography, rendering comparative scorecards, Recharts multi-project trends with 8+16 deterministic colorway, and CSV upload portal.
- Rollup Strategy: Synchronous transactional rollup computation committed atomically with document upserts.
- Interface & Interaction Style: Synchronous RESTful JSON API over HTTP.
- Strict Exclusions: Exclude physical construction S-curves, drawing quotas, punchlists, in-browser viewing, inline editing, user auth/RBAC, and discipline drill-down accordion.

Does this all look correct before I generate the domain design artifacts?
- Looks correct
- Request changes

[Answer]: Looks correct
