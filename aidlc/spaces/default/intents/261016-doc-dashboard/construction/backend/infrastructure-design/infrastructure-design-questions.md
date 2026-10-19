# Infrastructure Design Questions — Unit: `backend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `backend` (`U1`, kind: `service`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-16  

---

## Questions

### Q1: Docker Compose Service Topology & Container Health Orchestration
How should the backend service orchestrate startup and database readiness inside `docker-compose.yml`?

- [x] A. Explicit Docker Compose health checks with `service_healthy` condition (Recommended): Define healthcheck on PostgreSQL container (`pg_isready -U postgres`) and configure backend service with `depends_on: postgres: condition: service_healthy`, coupled with Go application exponential retry backoff loop (up to 30s) for layered startup resilience.
- [ ] B. Pure application-level retry loop: Standard `depends_on: [postgres]` without Compose health condition; rely exclusively on Go backend exponential backoff retry loop.
- [ ] C. External wait-for-it wrapper script: Inject a container entrypoint shell script to poll TCP port 5432 before starting the Go binary.

[Answer]: A

---

### Q2: PostgreSQL Data Storage & Persistence Strategy
How should PostgreSQL database data be persisted across Docker container recreations and host reboots?

- [x] A. Named Docker Volume (Recommended): Use a dedicated named volume (e.g., `postgres_data`) managed by Docker engine. Ensures optimal filesystem I/O performance, isolated container permissions, and clean cross-platform portability.
- [ ] B. Host Bind Mount directory: Map `./data/postgres` directly to the host filesystem for easy host-level inspection and external backup scripts.
- [ ] C. Ephemeral container storage: Container filesystem without persistent volume mapping (data lost upon container teardown).

[Answer]: A

---

### Q3: CI/CD Pipeline Automation Engine & Quality Gates
Per affirmed team practices (Linear Promotion Pipeline, `--no-ff` merge commits, 80% coverage floor, `go test ./... -race -count=1`):
How should the automated verification and build pipeline be formalized?

- [ ] A. GitHub Actions CI Workflow + Local Makefile automation: Standard GitHub Actions workflow (`.github/workflows/backend-ci.yml`) triggering on PRs and merges across promotion branches, executing `golangci-lint`, `go test -v -race -cover ./...`, coverage threshold check, and Docker build; backed by a local `Makefile` for developer parity.
- [ ] B. GitLab CI/CD Pipeline (`.gitlab-ci.yml`) + Local Makefile: GitLab CI definition with lint, test, coverage, and container build stages.
- [x] C. Local Makefile / Shell Scripts only (Selected for now): Standalone developer automation scripts without hosted CI/CD pipeline definitions.

[Answer]: C

---

## Consolidated Summary Confirmation

- **Q1 (Service Topology & Health Orchestration)**: A. Explicit Docker Compose health checks with `service_healthy` condition — Define PostgreSQL healthcheck (`pg_isready -U postgres`) and configure backend service with `depends_on: postgres: condition: service_healthy`, paired with Go application exponential retry backoff loop (up to 30s) for layered startup resilience.
- **Q2 (Storage & Persistence Strategy)**: A. Named Docker Volume (`postgres_data`) — Dedicated Docker-managed named volume ensuring optimal filesystem I/O performance, isolated container permissions, and clean cross-platform portability.
- **Q3 (CI/CD Pipeline Automation)**: C. Local Makefile / Shell Scripts only for now — Standalone local build, test, and verification automation scripts without hosted CI/CD workflow YAML definitions.

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct


