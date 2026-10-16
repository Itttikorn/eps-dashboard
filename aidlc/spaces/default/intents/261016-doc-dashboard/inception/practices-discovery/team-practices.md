# Team Practices

> Affirmed team practices discovered during Practices Discovery (Inception Phase).
> To be promoted to `aidlc/spaces/default/memory/team.md`.

## Way of Working

We enforce the organizational **Linear Environment Promotion Pipeline** with non-fast-forward merge commits:

- **Promotion Pipeline**: All code changes advance through strict gates: **`type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`**.
- **Merge Strategy**: All PR merges across every gate use **Create Merge Commit (`--no-ff`)** to preserve fine-grained commit history, maintain PR auditability, and enable single-step atomic rollbacks (`git revert -m 1 <hash>`).
- **Branch Naming**: Working branches adhere to `<type>/<scope>-<short-description>` (e.g., `feat/ingest-csv-streaming`, `fix/overdue-date-calculation`).
- **Commit Messages**: All commits must follow the **Conventional Commits 1.0.0** specification (`<type>(<scope>): <imperative-summary>`).
- **Delivery Sequence**: Ingestion-first cadence — build and verify the Go CSV streaming parser and PostgreSQL storage models before frontend dashboard integration.

## Walking Skeleton

We **do not build a thin end-to-end slice**. We build layers in structured isolation:

- Implement the PostgreSQL database schema and high-performance Go streaming CSV ingestion pipeline first.
- Implement the core QA/QC workflow domain engine, overdue calculations, and category aggregators second.
- Implement the React dashboard frontend and visualizations last, connecting to the established backend APIs.

## Testing Posture

We treat automated testing as a first-class deliverable in every deliverable unit:

- **Methodology**: test-after
- **Ordering**: Implement each applicable testable layer, then write and run that layer's tests.
- **Backend Testing**: Table-driven unit tests, in-memory fakes for domain repository interfaces, and mandatory race detector verification (`go test ./... -race -count=1`).
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
  - Input & Security: Request body bounded via `http.MaxBytesReader`; constant-time comparisons (`crypto/subtle.ConstantTimeCompare`) for secrets.
- **Frontend (TypeScript / React)**:
  - Language: TypeScript in strict mode (`noImplicitAny`, `noUncheckedIndexedAccess`).
  - Styling: Tailwind CSS v4 using semantic token variables; strict 4pt/8pt spatial rhythm.
  - Component Primitives: Ant Design v6 / Radix primitives with Lucide Icons.
  - Mandatory Screen States: Every view explicitly handles all 4 states (Loading skeleton with zero CLS, Empty, Error with retry, Success).
  - Navigation & Filters: URL query parameter synchronization (Nuqs) for dashboard filters, active tabs, and pagination.
