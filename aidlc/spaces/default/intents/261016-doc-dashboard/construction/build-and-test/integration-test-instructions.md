# Integration Test Instructions: Corporate Document Management System Dashboard

**Stage**: `build-and-test` (3.6)  
**Phase**: `construction`  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-quality-agent`  
**Support Agents**: `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## 1. Overview & Integration Boundaries

This instruction set defines integration testing requirements between:
1. **Unit `backend` (`U1`)**: Go HTTP API handlers, CSV streaming ingest parser, transactional repository, and PostgreSQL storage.
2. **Unit `frontend` (`U2`)**: React Query client, data normalizers, TanStack Query cache, UI state transitions, and interactive views.
3. **External CSV Feeds**: 23-column `AUTOEMAIL_FILE_06_*.csv` file format.

### Key Integration Boundaries
- **Boundary B1: CSV Multipart Ingestion**: `POST /api/v1/ingest` receiving `multipart/form-data` with streaming parser, in-memory diffing, database transaction, and JSON envelope output.
- **Boundary B2: Universal Response Envelope**: Every HTTP response matches `{ "status": { "code": 200, "header": "OK", "description": "..." }, "result": ..., "total": ..., "search_params": ... }`.
- **Boundary B3: Real-Time Overview Aggregation**: `GET /api/v1/projects/summary` aggregating latest document revisions across projects, returning topbar KPIs and comparative matrix cards.
- **Boundary B4: Historical Trend Delivery**: `GET /api/v1/analytics/trends` querying multi-project time-series metrics over daily rollups.

---

## 2. Test Framework Setup & Harness

### 2.1 Backend HTTP Integration Suite
- **Tool**: Go `httptest` + in-memory database instance (`sqlite::memory:?cache=shared`).
- **Location**: `backend/api_test.go`, `backend/internal/ingest/handler_test.go`, `backend/internal/project/handler_test.go`.
- **Harness**: Instantiates full Chi router (`MountAPIRoutes`), registers middleware (CORS, Request Logger, Recoverer), binds in-memory SQLite storage, and dispatches real HTTP requests via `httptest.NewRecorder()`.

### 2.2 Frontend Mocked-Transport Integration Suite
- **Tool**: Vitest + Mocked `globalThis.fetch` + React Testing Library.
- **Location**: `frontend/src/api/client.test.ts`, `frontend/src/api/queries.test.tsx`, `frontend/src/features/overview/*.test.tsx`, `frontend/src/features/trend/*.test.tsx`, `frontend/src/features/ingestion/*.test.tsx`.
- **Harness**: Intercepts HTTP fetch calls, validates request headers and bodies, serves contract-aligned universal response envelopes, and asserts on component re-renders, caching behavior, and error handling.

---

## 3. How to Run Integration Tests

### 3.1 Backend Integration Test Execution
Run the Go HTTP and database integration test suites:
```bash
# Run all backend endpoint integration tests
go test -C backend -v -run "TestProjectHandlerEndpoints|TestHandler_IngestCSV|TestHealthEndpointResultContract" ./...
```

### 3.2 Frontend Integration Test Execution
Run the frontend API-to-UI integration test suite:
```bash
# Run client, normalizers, queries, and connected screen integration tests
npm --prefix frontend exec vitest -- run src/api src/features/overview src/features/trend src/features/ingestion
```

### 3.3 End-to-End Local Smoke Test (Docker Compose)
To execute end-to-end verification against live services:
```bash
# 1. Start containers in background
docker compose up -d

# 2. Wait for backend readiness probe
curl -f http://localhost:8080/health

# 3. Test CSV Ingest Boundary with sample data
curl -X POST http://localhost:8080/api/v1/ingest \
  -F "file=@backend/test/fixtures/valid_snapshot_small.csv"

# 4. Verify Overview Summary Endpoint
curl -s http://localhost:8080/api/v1/projects/summary | jq .

# 5. Verify Trend Analytics Endpoint
curl -s "http://localhost:8080/api/v1/analytics/trends?projects=SKK-IM-CM-26002&metric=total_docs" | jq .

# 6. Tear down containers
docker compose down
```

---

## 4. Test Data Management & Fixtures

Integration test fixtures are maintained in two locations:
- **Backend Fixtures (`backend/test/fixtures/`)**:
  - `valid_snapshot_small.csv`: 10 rows spanning multiple disciplines (`ME`, `CE`, `EE`) and categories.
  - `valid_snapshot_500.csv`: 500 rows for bulk ingestion and delta detection benchmarking.
  - `out_of_order_date.csv`: File with older revision dates to verify chronological regression guards.
  - `formula_injection.csv`: Rows containing defensive CSV payloads (`=cmd|`, `+SUM`, `@HYPERLINK`).
- **Frontend Fixtures (`frontend/src/test/fixtures/`)**:
  - `summary.backend.ts`: Real backend output fixture for `GET /api/v1/projects/summary`.
  - `summary.contract.ts`: Contract-aligned normalized fixture.
  - `trends.backend.ts`: Backend time-series response fixture for multi-project overlays.
  - `ingest.responses.ts`: Multipart ingestion response fixture.

---

## 5. Expected Coverage & Verification Assertions

1. **Universal Envelope Schema Verification**:
   - `status.code` is an integer matching the HTTP status code (200, 400, 404, 500).
   - `status.header` is a short capitalized status string (`OK`, `BAD_REQUEST`, `INTERNAL_ERROR`).
   - `status.description` contains human-readable message without leaking internal database schemas or stack traces.
2. **Delta Ingestion State Transitions**:
   - First ingest of `valid_snapshot_small.csv` inserts 10 rows into `document_revisions_current`.
   - Re-uploading identical file returns `ALREADY_INGESTED` with zero redundant delta log writes.
   - Modified row updates `LASTSTATUS` and writes exactly 1 change event to `document_change_log`.
3. **Frontend UI State Machine**:
   - Loading query displays animated skeleton shimmers.
   - Successful query renders data tables and charts.
   - Failed query renders ErrorAlert with interactive "Retry" trigger.

