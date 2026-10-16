# Practices Discovery Evidence

## Sources Inspected

1. **Organizational Knowledge Catalog (`aidlc/spaces/default/knowledge/aidlc-shared/`)**:
   - `git-standards.md`: Authoritative Git standard defining `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main` promotion, `--no-ff` merge commits, Conventional Commits, SemVer release tagging, and hotfix back-porting.
   - `backend-standards.md`: Universal API design rules (REST `/api/v1` vs `/ws`), timeout scoping, universal JSON response envelope (`internal/utils/envelope.go`), `http.MaxBytesReader`, parameterized queries, structured JSON logging (`log/slog`), and constant-time secret comparison.
   - `backend-tech-stack.md`: Golden Path backend specification: Go 1.22+, Chi v5, PostgreSQL 15+ (GORM/pgx), Redis 7+, table-driven tests with `go test -race`.
   - `backend-architecture.md`: Clean Architecture / Hexagonal Architecture blueprint, Inward Dependency Rule, 3-tier data model (DTO, Domain Entity, Database Record).
   - `frontend-standards.md`: Design system rules, Tailwind CSS v4, 4/8pt spatial rhythm, 4 mandatory interactive view states (Loading skeleton, Empty, Error, Success), accessible component primitives (Ant Design / Radix), Lucide Icons.
   - `frontend-tech-stack.md`: Golden Path frontend specification: TypeScript strict mode, Next.js / React 19 / Vite SPA, pnpm, TanStack Query / SWR, Vitest + React Testing Library, ESLint 9 + Prettier.
   - `frontend-architecture.md`: Feature-driven frontend structure, custom hooks, Nuqs URL query parameter state.

2. **Project State & Upstream Ideation Deliverables**:
   - `aidlc-state.md`: Greenfield project status, MVP scope, Inception phase.
   - `intent-statement.md`, `feasibility-assessment.md`, `scope-document.md`, `wireframes.md`: High-level goals, CSV snapshot schema, Go + PostgreSQL + React + Docker Compose architecture.

## Observations & Inferences

- The organizational knowledge establishes clear, authoritative practices that supersede generic framework defaults:
  - **Git**: Instead of generic trunk-based squash-merge, the team mandates a 4-tier branch promotion lifecycle (`type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`) using Create Merge Commit (`--no-ff`).
  - **Backend**: Strict enforcement of the universal response envelope (`status: { code, header, description }`, `result`, `total`, `search_params`) and Chi v5 router.
  - **Testing**: Mandatory race detection (`-race`) on all Go test runs and 80% line coverage on domain/business logic.
  - **Frontend**: Enforced 4 view states, zero layout shift (CLS) with skeleton loaders matching final table dimensions, and Nuqs for URL search state.

## Gaps for Interview

1. **Way of Working**: Confirm adherence to the `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main` promotion lifecycle and `--no-ff` merge commits.
2. **Walking Skeleton**: Confirm building a thin end-to-end slice (CSV ingest $\rightarrow$ Postgres $\rightarrow$ Chi REST API $\rightarrow$ React Table with skeleton) before expanding feature depth.
3. **Testing Posture**: Confirm test-after cadence, table-driven testing, and the 80% domain coverage threshold with `-race`.
4. **Deployment**: Confirm Docker Compose containerization and SemVer release tagging.
5. **Code Style**: Confirm Go standards (`gofmt`, `golangci-lint`, Universal Envelope) and TypeScript/Tailwind standards.
