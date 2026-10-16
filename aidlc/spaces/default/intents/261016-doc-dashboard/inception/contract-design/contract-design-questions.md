# Contract Design Questions & Planning

## How would you like to answer the questions?
A. Guide me (ask questions one by one with recommended defaults)
B. I'll edit the file directly
C. Chat (discuss contract conversationally)
X. Other (please specify)

[Answer]: A (Guide me)

## Q1. What protocol and specification standard should be established for the inter-unit boundary between `backend` and `frontend`?
A. OpenAPI 3.0.3 specification (YAML/JSON): Formal contract defining RESTful HTTP JSON resources, strict property schemas, parameter types, response models, and mock data examples to guarantee zero contract drift across separate construction sessions.
B. gRPC with Protocol Buffers (.proto)
C. GraphQL Schema Definition Language (SDL)
D. Not yet defined
X. Other (please specify)

[Answer]: A (OpenAPI 3.0.3 specification strictly adhering to aidlc-shared backend-standards.md Universal Response Envelope status/result/total/search_params and frontend-standards.md)

## Q2. What API route structure and resource endpoints should govern the system?
A. Standardized URI-versioned REST API (`/api/v1/*`):
   - `GET /api/v1/health`: Service health and database connectivity status
   - `GET /api/v1/projects`: Multi-project comparative matrix grid with 5 QA/QC category counts, overdue delinquency flags, and search parameters
   - `GET /api/v1/projects/summary`: Global topbar macro KPI cards and category distribution counts
   - `GET /api/v1/analytics/trends`: Multi-project historical volume time-series supporting unlimited date ranges and preset windows (`All Time`, `1 Year`, `6 Months`, `3 Months`)
   - `POST /api/v1/ingest`: Multipart/form-data CSV snapshot upload with streaming ingestion, SHA-256 deduplication, and atomic batch report
B. Unversioned `/api/*` flat routes
C. Action-based RPC endpoints (e.g. `/api/uploadCSV`, `/api/getProjects`)
D. Not yet defined
X. Other (please specify)

[Answer]: A (Standardized URI-versioned REST API /api/v1/* with /health, /projects, /projects/summary, /analytics/trends, and /ingest)

## Q3. How should error handling, error envelopes, and status codes be governed across the boundary?
A. Standardized Structured JSON Error Envelope (`{"error": string, "code": string, "details": any}`) with strict HTTP status codes:
   - `200 OK`: Successful data retrieval or idempotent duplicate upload recognition (`ALREADY_INGESTED`)
   - `201 Created`: New snapshot batch successfully parsed, upserted, and daily metrics computed
   - `400 Bad Request`: Malformed CSV header, missing required columns, or invalid date formats
   - `404 Not Found`: Project ID or resource not found
   - `500 Internal Server Error`: Database connection failure or unhandled transaction abort with sanitized error messaging
B. Unstructured plaintext error responses
C. Always return HTTP 200 with embedded `{success: false, message: ...}` body
D. Not yet defined
X. Other (please specify)

[Answer]: A (Enforced Universal Envelope Contract with status/result/total/search_params and standard application codes per aidlc-shared backend-standards.md)

## Consolidated Summary Confirmation

- **Contract Protocol & Specification Standard**:
  - OpenAPI 3.0.3 specification (YAML/JSON) defining all RESTful HTTP resources, payload schemas, query parameters, and mock fixtures.
- **API Routing & Resource Endpoints**:
  - `GET /api/v1/health`: Liveness and database connectivity check.
  - `GET /api/v1/projects`: Multi-project comparative matrix with 5 QA/QC category counts, overdue delinquency flags, search filtering, and pagination.
  - `GET /api/v1/projects/summary`: Global topbar macro KPI cards and category distribution counts across all active sites.
  - `GET /api/v1/analytics/trends`: Multi-project historical volume time-series with unlimited date ranges and preset windows.
  - `POST /api/v1/ingest`: Multipart/form-data CSV snapshot upload (10MB body limit) with streaming ingestion, SHA-256 deduplication, and atomic batch report.
- **Universal Response & Error Envelopes (`aidlc-shared/backend-standards.md` §3)**:
  - All responses encapsulated in standard 4-field envelope: `{"status": {"code": integer, "header": string, "description": string}, "result": any, "total": *int, "search_params": map}`.
  - Application status codes: `1000` (Success, HTTP 200/201), `1799` (Already Ingested / Conflict, HTTP 409), `1801` (Invalid Request, HTTP 400), `1802` (Not Found, HTTP 404), `1900` (Server Error, HTTP 500).
- **Inter-Session Boundary Governance**:
  - The OpenAPI 3.0.3 contract in `contract-summary.md` is frozen at the end of this stage to guarantee zero contract drift across separate construction sessions.

Does this all look correct before I generate the contract design artifacts?
- Looks correct
- Request changes

[Answer]: Looks correct
