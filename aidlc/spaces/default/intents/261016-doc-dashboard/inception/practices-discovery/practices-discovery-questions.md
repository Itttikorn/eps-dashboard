# Practices Discovery Questions

## Q1. How should the team organize branches, code promotion, and pull request integration?
A. Linear Promotion Pipeline (`type/scope` -> `staging` -> `dev` -> `main`) with Create Merge Commit (`--no-ff`) and Conventional Commits
B. Trunk-based development merging directly into `main` with squash-merge
C. GitFlow with long-lived release and hotfix branches
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. Build a thin end-to-end slice first? A walking skeleton is a minimal version that runs the whole way through, built first to prove the pieces connect before the real features go in.
A. Yes, build a thin end-to-end slice first (Go streaming CSV ingest -> PostgreSQL -> Chi v5 API with universal envelope -> React dashboard table with skeleton) to verify architecture early
B. No, build layers completely in isolation (full database models first, then business logic, then frontend UI last)
X. Other (please specify)

[Answer]: B

## Q3. What testing methodology and coverage standard should we enforce?
A. Test-after with table-driven tests, mandatory race detection (`go test -race`), and 80% line-coverage floor on business logic in CI; Vitest + React Testing Library for frontend
B. Strict Test-Driven Development (TDD) writing unit tests before any implementation code
C. Minimal happy-path unit testing without coverage floors or race checks
X. Other (please specify)

[Answer]: A

## Q4. How should the system be packaged and deployed across environments?
A. Docker Compose containerization for local development and corporate VM deployment, with automated migrations on boot and SemVer release tagging
B. Single monolithic binary deployed directly onto the host OS without containerization
C. Managed cloud infrastructure (AWS ECS/Fargate + RDS PostgreSQL)
X. Other (please specify)

[Answer]: A

## Q5. What code style, API envelope, and UI standards should be enforced across the codebase?
A. Clean Architecture with Chi v5, Universal Response Envelope (`status: { code, header, description }`, `result`, `total`, `search_params`), `gofmt`/`golangci-lint`, and Tailwind CSS v4 with 4 mandatory view states (Loading skeleton, Empty, Error, Success)
B. Custom internal conventions without standardized API envelopes or linters
C. Permissive style without enforced architectural boundaries
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
