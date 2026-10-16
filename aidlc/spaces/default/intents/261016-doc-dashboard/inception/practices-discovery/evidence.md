# Practices Discovery Evidence

## Sources Inspected

1. **Organizational Knowledge Catalog (`aidlc/spaces/default/knowledge/aidlc-shared/`)**:
   - `git-standards.md`: Authoritative Git standard defining `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main` promotion, `--no-ff` merge commits, Conventional Commits, SemVer release tagging, and hotfix back-porting.
   - `backend-standards.md`: Universal API design rules (REST `/api/v1` vs `/ws`), timeout scoping, universal JSON response envelope (`internal/utils/envelope.go`), `http.MaxBytesReader`, parameterized queries, structured JSON logging (`log/slog`), and constant-time secret comparison.
   - `backend-tech-stack.md`: Golden Path backend specification: Go 1.22+, Chi v5, PostgreSQL 15+ (GORM/pgx), Redis 7+, table-driven tests with `go test -race`.
   - `backend-architecture.md`: Clean Architecture / Hexagonal Architecture blueprint, Inward Dependency Rule, 3-tier data model (DTO, Domain Entity, Database Record).
   - `frontend-standards.md`: Design system rules, Tailwind CSS v4, 4/8pt spatial rhythm, 4 mandatory interactive view states (Loading skeleton, Empty, Error, Success), accessible component primitives (Ant Design / Radix), Lucide Icons.
   - `frontend-tech-stack.md`: Golden Path frontend specification: TypeScript strict mode, React 19, pnpm, TanStack Query / SWR, Vitest + React Testing Library, ESLint 9 + Prettier.
   - `frontend-architecture.md`: Feature-driven frontend structure, custom hooks, Nuqs URL query parameter state.

2. **Project State & Upstream Ideation Deliverables**:
   - `aidlc-state.md`: Greenfield project status, MVP scope, Inception phase.
   - `intent-statement.md`, `feasibility-assessment.md`, `scope-document.md`, `wireframes.md`: High-level goals, CSV snapshot schema, Go + PostgreSQL + React + Docker Compose architecture.

3. **Interview Decisions (`practices-discovery-questions.md`)**:
   - Q1: Affirmed Linear Promotion Pipeline (`type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`) with Create Merge Commit (`--no-ff`) and Conventional Commits.
   - Q2: Decided against a walking skeleton thin slice; affirmed building layers in structured isolation (database schema & Go streaming ingestion first, followed by business logic, then frontend UI).
   - Q3: Affirmed test-after methodology with table-driven tests, mandatory race detection (`-race`), and 80% domain coverage floor in CI; Vitest + React Testing Library for frontend.
   - Q4: Affirmed Docker Compose containerization for local and corporate VM deployment, with automated migrations on boot and SemVer release tagging.
   - Q5: Affirmed Clean Architecture with Chi v5, Universal Response Envelope, `gofmt`/`golangci-lint`, and Tailwind CSS v4 with 4 mandatory view states.

## Observations & Inferences

- The organizational knowledge establishes clear, authoritative practices that supersede generic framework defaults.
- All 3 support agents (Quality, Developer, DevSecOps) agreed with the lead's proposals with zero objections.
- Human confirmation affirmed all 5 practice domains and established the layer-by-layer delivery sequence without a walking skeleton.

## Unresolved Uncertainty

- None. All 5 areas are explicitly resolved and confirmed.
