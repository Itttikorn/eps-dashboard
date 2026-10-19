# Code Generation Plan: Unit `backend`

**Stage**: `code-generation` (3.5)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19  

---

## Summary

- Builds: Go 1.22+ backend service with Chi router, PostgreSQL 16 3-tier persistence, streaming CSV parser, and KPI/matrix APIs
- Touches: backend/cmd/server/, backend/internal/{model,repository,service,transport,config,utils}/, backend/Dockerfile, Makefile
- Tests: 30+ table-driven unit tests, race detector verification, and 80%+ line coverage floor across model, repository, and service layers

---

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "Implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "mvp",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "We treat automated testing as a first-class deliverable in every deliverable unit:\n\n- **Methodology**: test-after\n- **Ordering**: Implement each applicable testable layer, then write and run that layer's tests.\n- **Backend Testing**: Table-driven unit tests, in-memory fakes for domain repository interfaces, and mandatory race detector verification (`go test ./... -race -count=1`).\n- **Frontend Testing**: Vitest + React Testing Library for component rendering, user interactions, and custom hooks.\n- **Coverage Floor**: 80% line-coverage floor on core business logic (CSV parser, overdue calculation engine, discipline and category aggregators).\n- **CI Quality Gate**: Automated PR gate runs unit tests, race detector, linting (`gofmt`, `golangci-lint`), and coverage verification prior to `--no-ff` merge into `staging`."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Meet an 80% line-coverage floor.",
      "Run the selected tests in CI before merge."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:ffc01259e29f44cd2c7aeb0317e55128cd6c12959e754debba17f17e9cf50fb3",
  "contract_sha256": "sha256:30610fa8d636bcb59c68fd8d06620d800a8cacc62658e704a27757ba111cb7c5"
}
```

---

## 1. Implementation Steps & Traceability

Following the `test-after` methodology from the affirmed Testing Contract, each testable layer is implemented first, followed immediately by writing and verifying that layer's test suite:

### Step 1: Project Structure & Production Configuration Skeleton
- Initialize Go module `eps-dashboard/backend` in `backend/go.mod` (Go 1.22+).
- Implement centralized environment configuration loader in `backend/internal/config/config.go` with environment variable overrides for database DSN, port (`SERVER_PORT`), log level (`LOG_LEVEL`), body ceiling limit (`10MB`), and connection pooling parameters.
- [Traceability: `NFR1.2`, `NFR6.5`]

### Step 2: Bootstrap Minimal Test Runner & Unit-Scoped Command
- Create `backend/Makefile` with targets: `test`, `test-race` (`go test -v -race -count=1 ./...`), `cover` (80% line coverage gate), `lint` (`gofmt` and `golangci-lint`), and `build`.
- Create synthetic test fixtures in `backend/test/fixtures/` including valid snapshot CSV samples, out-of-order date samples, and malicious spreadsheet formula samples (`=cmd|' /C calc'!A0`).
- Verify exact runnable unit command: `cd backend && go test -v -race -cover ./...`.
- [Traceability: Testing Contract obligation]

### Step 3: Data Model / Database Behavior — Implementation
- Implement GORM database entities in `backend/internal/model/`:
  - `document.go`: `DocumentRevisionCurrent` model representing active state of each document with composite B-tree index annotations.
  - `change_log.go`: `DocumentChangeLog` model storing audit delta entries for every status, revision, and metadata modification.
  - `metric.go`: `ProjectDailyMetric` and `IngestionBatch` models storing pre-computed daily time-series rollups and batch idempotency checksums.
- Implement database connection initialization and connection pooling in `backend/internal/repository/db.go` (`MaxOpenConns: 25`, `MaxIdleConns: 10`, `ConnMaxLifetime: 5m`, `ConnMaxIdleTime: 2m`).
- [Traceability: `US1.1`, `US1.3`, `ENT-001`, `ENT-002`, `ENT-003`, `ENT-004`, `NFR1.2`, `NFR2.1`]

### Step 4: Data Model / Database Behavior — Tests
- Implement table-driven model tests in `backend/internal/model/document_test.go`:
  - Verify JSON tagging and database field mapping invariants.
  - Verify zero-value handling, timestamps, and UUID defaults.
  - Verify entity validation helpers and boundary constraints.
- [Traceability: `test-after` step for Step 3]

### Step 5: Repository / Data Access Layer — Implementation
- Implement repository interfaces and GORM implementations in `backend/internal/repository/`:
  - `document_repo.go`: Methods for querying active revisions, filtered counts by category, and project-scoped lookups.
  - `change_log_repo.go`: Methods for bulk appending change log entries within an existing database transaction.
  - `metrics_repo.go`: Methods for querying time-series ranges from `project_daily_metrics` and recording batch checksums in `ingestion_batches`.
  - `migrations.go`: Automated forward-only schema migration runner executing upon startup before HTTP listener activation.
- [Traceability: `US1.1`, `US1.2`, `US1.3`, `US2.1`, `US2.2`, `NFR1.1`, `NFR1.4`, `NFR4.4`]

### Step 6: Repository / Data Access Layer — Tests
- Implement repository tests in `backend/internal/repository/document_repo_test.go` and `metrics_repo_test.go`:
  - Verify automated schema creation and index generation.
  - Verify bulk insert performance, composite queries, and time-series range filtering.
  - Verify transaction rollback on intentional query failure (`BEGIN ... ROLLBACK`).
- [Traceability: `test-after` step for Step 5]

### Step 7: Business Logic: Streaming CSV Ingestion & Diffing Engine — Implementation
- Implement streaming CSV ingestion engine in `backend/internal/service/`:
  - `sanitizer.go`: Defensive cell sanitization stripping or prepending single quotes to formulas (`=`, `+`, `-`, `@`) targeting spreadsheet formula injection while preserving legitimate engineering notes.
  - `coordinator.go`: `IngestionCoordinator` managing in-memory mutex locks per `project_id` to serialize concurrent uploads targeting the same project while allowing parallel execution across distinct projects.
  - `ingest_service.go`: Streaming CSV parser using Go's `encoding/csv.Reader`, evaluating headers, loading pre-existing project documents into an in-memory map in $< 3\text{ ms}$, diffing rows, detecting changes, and writing to `document_revisions_current` and `document_change_log` within a single ACID transaction.
  - Enforce chronology safeguards: Reject or warn if incoming snapshot date is older than existing revision date.
  - Record SHA-256 batch checksum in `ingestion_batches` to guarantee idempotency.
- [Traceability: `US1.1`, `US1.2`, `US1.3`, `BR1.1`, `BR1.2`, `BR1.3`, `BR1.4`, `NFR1.3`, `NFR4.2`, `NFR6.2`, `NFR6.3`]

### Step 8: Streaming CSV Ingestion & Diffing Engine — Tests
- Implement unit tests in `backend/internal/service/ingest_service_test.go` and `sanitizer_test.go`:
  - Test happy-path 500-row and 2,000-row CSV streaming ingestion.
  - Test delta detection: Unchanged rows produce 0 change log entries; modified status produces `UPDATE` change log entry; new document produces `CREATE` change log entry.
  - Test out-of-order date downgrade rejection.
  - Test duplicate batch SHA-256 idempotency.
  - Test formula sanitization across all Excel/Calc trigger characters.
  - Test concurrent upload race conditions with `IngestionCoordinator`.
- [Traceability: `test-after` step for Step 7]

### Step 9: Business Logic: QA/QC Workflow, Discipline & Overdue Aggregations — Implementation
- Implement analytics services in `backend/internal/service/`:
  - `overdue_service.go`: Evaluates overdue status based on `DUEDATE` vs `METRIC_DATE` or current clock. Categorizes documents into QA categories: `BASELINE_DRAWINGS`, `CONTROL`, `CORRECTIVE`, `CHANGE`, `COMPLETE`.
  - Classifies disciplines from document numbers (`ME` = Mechanical, `CE` = Civil, `EE` = Electrical).
  - Computes corrective action aging (calendar days elapsed between issue date and resolution/current date).
  - `metrics_service.go`: Aggregates global executive summary KPIs (`/api/v1/projects/summary`), comparative project matrix rows (`/api/v1/projects`), and historical trend time-series (`/api/v1/analytics/trends`).
- [Traceability: `US2.1`, `US2.2`, `US2.3`, `US3.1`, `US3.2`, `US4.1`, `US4.2`, `BR2.1`, `BR2.2`, `BR3.1`, `BR3.2`]

### Step 10: QA/QC Workflow, Discipline & Overdue Aggregations — Tests
- Implement unit tests in `backend/internal/service/overdue_service_test.go` and `metrics_service_test.go`:
  - Table-driven overdue calculation tests with varied dates, leap years, and edge cases.
  - Table-driven discipline parsing tests (`ME-001`, `CE-102`, `EE-999`, unknown fallback).
  - Corrective aging calculation tests across 0, 30, 60, 90+ days.
  - Topbar macro summary aggregation tests comparing expected counts against model collections.
- [Traceability: `test-after` step for Step 9]

### Step 11: Transport Layer: Chi Router, Middlewares & API Handlers — Implementation
- Implement transport components in `backend/internal/transport/http/`:
  - `envelope.go`: Universal four-field response envelope (`status: { code, header, description }`, `result`, `total`, `search_params`).
  - `middleware.go`: Permissive CORS handler, security headers (`nosniff`, `DENY`, `strict-origin`), `slog` structured request logger, `X-Request-ID` generation/propagation, and `http.MaxBytesReader` 10MB ceiling interceptor.
  - `handler.go`: HTTP endpoints:
    - `GET /api/v1/health`: Readiness probe returning 200 OK or 503 Service Unavailable based on live DB ping.
    - `POST /api/v1/ingest`: Multipart CSV upload triggering `IngestService`.
    - `GET /api/v1/projects/summary`: Macro executive KPI cards.
    - `GET /api/v1/projects`: Multi-project comparative matrix grid with search and sorting.
    - `GET /api/v1/analytics/trends`: Historical time-series query with date range and project filters.
  - `router.go`: Chi router composition assembling all routes and middlewares.
  - `cmd/server/main.go`: Application entrypoint handling signal traps (`SIGINT`, `SIGTERM`), exponential backoff startup loop, migration execution, and 5-second graceful shutdown.
- [Traceability: `NFR1.1`, `NFR1.7`, `NFR3.1`, `NFR4.5`, `NFR6.1`, `NFR6.4`]

### Step 12: Transport Layer & API Handler — Tests
- Implement HTTP handler tests in `backend/internal/transport/http/handler_test.go` and `middleware_test.go` using `net/http/httptest`:
  - Test `/api/v1/health` returning 200 OK and 503 DB failure simulation.
  - Test `/api/v1/projects/summary` verifying four-field response envelope structure.
  - Test `/api/v1/projects` verifying filtering, sorting, and pagination metadata.
  - Test `/api/v1/ingest` with valid multipart CSV, oversized file (>10MB returning 413), and invalid MIME type.
  - Test CORS headers and security headers on responses.
  - Test `X-Request-ID` echoing in response headers.
- [Traceability: `test-after` step for Step 11]

### Step 13: Packaging & Environment Build Configuration
- Create `backend/Dockerfile` using multi-stage build (`golang:1.22-alpine` builder, `alpine:3.20` unprivileged runner `appuser:10001`).
- Create `backend/.dockerignore` excluding `.git`, test outputs, binary artifacts, and documentation.
- Create `docker-compose.yml` defining `postgres:16-alpine` and `wa-backend` services on bridge network `eps-net` with persistent volume `postgres_data` and healthcheck dependencies.
- Create `backend/.env.example` documenting default configuration keys.
- [Traceability: `NFR6.5`, Infrastructure Specification]

### Step 14: Documentation, Source Manifest & Traceability
- Create `backend/README.md` with instructions on local setup, running tests with race detector, and starting Docker Compose.
- Create `source-manifest.json` under `construction/backend/code-generation/source-manifest.json` indexing all generated files.
- Create `traceability.json` mapping all user stories (`US1.1`–`US3.2`), acceptance criteria (`AC*`), business rules (`BR*`), and `NFR*` IDs to concrete workspace files.
- Create `code-summary.md` documenting implementation decisions and test verification metrics.
- [Traceability: Stage completion requirements]

