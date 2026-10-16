# Team Practices

> Sourced from organizational knowledge (`aidlc/spaces/default/knowledge/aidlc-shared/`) and drafted by `aidlc-pipeline-deploy-agent` during Practices Discovery.
> To be affirmed by the team and promoted to `memory/team.md`.

## Way of Working

We enforce the organizational **Linear Environment Promotion Pipeline** with non-fast-forward merge commits:

- **Promotion Pipeline**: Changes advance through strict gates: **`type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`**.
- **Merge Strategy**: All PR merges across every gate use **Create Merge Commit (`--no-ff`)** to preserve fine-grained history, maintain PR traceability, and enable single-step atomic rollbacks (`git revert -m 1 <hash>`).
- **Branch Naming**: Working branches adhere to `<type>/<scope>-<short-description>` (e.g., `feat/ingest-csv-streaming`, `fix/overdue-date-calculation`).
- **Commit Messages**: All commits must follow the **Conventional Commits 1.0.0** specification (`<type>(<scope>): <imperative-summary>`).
- **Delivery Sequence**: Ingestion-first cadence for MVP — establish and verify the Go CSV streaming parser and PostgreSQL storage models before frontend dashboard integration.

## Walking Skeleton

We **build a thin end-to-end slice first**. A walking skeleton is a minimal version that runs the whole way through, built first to prove the pieces connect before the real features go in.

- **Scope of Slice**: Minimal Go streaming CSV ingestion endpoint, basic PostgreSQL persistence, Chi v5 REST API wrapping data in the Universal Response Envelope, and a minimal React dashboard view with a loading skeleton and basic table render.
- **Verification**: Verifies architecture connectivity, container orchestration, and database performance before implementing complex analytical calculations, category metrics, and trend charts.

## Testing Posture

We treat testing as a first-class deliverable in every deliverable unit:

- **Methodology**: test-after
- **Ordering**: Implement each applicable testable layer, then write and run that layer's tests.
- **Backend Testing**: Table-driven unit tests, in-memory fakes for domain interfaces, and mandatory race detector verification (`go test ./... -race -count=1`).
- **Frontend Testing**: Vitest + React Testing Library for component rendering, user interactions, and custom hooks.
- **Coverage Floor**: 80% line-coverage floor on core business logic (CSV parser, overdue calculation engine, discipline and category aggregators).
- **CI Quality Gate**: Automated PR gate runs unit tests, race detector, linting (`gofmt`, `golangci-lint`), and coverage verification prior to `--no-ff` merge into `staging`.

## Deployment

We use **Docker Compose containerization** for local development and corporate VM deployment:

- **Runtime & Packaging**: Multi-stage Dockerfile with unprivileged non-root user execution.
- **Container Topology**: Multi-container Docker Compose setup (`wa-backend` Go service, `wa-frontend` React service, `postgres:16` database).
- **Database Migrations**: Automated forward-only migrations executing on container boot before API server readiness.
- **Release Management**: Production releases on `main` tagged with Semantic Versioning (`v<MAJOR>.<MINOR>.<PATCH>`). Emergency fixes use `hotfix/<scope>` branched from `main` and back-ported to `staging` and `dev`.

## Code Style

We follow the organizational backend and frontend engineering standards:

- **Backend (Go 1.22+)**:
  - Router: Chi v5 (`github.com/go-chi/chi/v5`) with REST timeout scoping under `/api`.
  - Architecture: Clean Architecture (Presentation $\rightarrow$ Domain $\rightarrow$ Infrastructure) respecting the Inward Dependency Rule.
  - Universal Envelope: All HTTP API responses strictly adhere to `internal/utils/envelope.go` (`status: { code, header, description }`, `result`, `total`, `search_params`).
  - Formatting & Linting: `gofmt` and `golangci-lint` enforced in CI.
  - Logging: Standard `log/slog` structured single-line JSON logging with `request_id`, `duration_ms`, and zero credentials/PII.
  - Input & Security: Request body bound via `http.MaxBytesReader`; constant-time comparisons (`crypto/subtle.ConstantTimeCompare`) for secrets.
- **Frontend (TypeScript / React)**:
  - Language: TypeScript in strict mode (`noImplicitAny`, `noUncheckedIndexedAccess`).
  - Styling: Tailwind CSS v4 using semantic token variables; strict 4pt/8pt spatial rhythm.
  - Component Primitives: Ant Design v6 / Radix primitives with Lucide Icons.
  - Mandatory Screen States: Every view explicitly handles all 4 states (Loading skeleton with zero CLS, Empty, Error with retry, Success).
  - Navigation & Filters: URL query parameter synchronization (Nuqs) for dashboard filters, active tabs, and pagination.
