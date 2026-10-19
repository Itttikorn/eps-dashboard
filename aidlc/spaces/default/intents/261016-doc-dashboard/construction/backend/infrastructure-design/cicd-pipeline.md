# Delivery & Automation Pipeline: Unit `backend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the build, test-automation integration, local development automation, promotion cadence, and release packaging for the Go backend service, tracing from:
- `team.md` / `project.md`: Affirmed team practices (Linear promotion `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`, `--no-ff` merge commits, 80% coverage floor, race detector `go test ./... -race -count=1`).
- `infrastructure-design-questions.md`: Q3 selected Local Makefile / Developer Automation scripts without hosted cloud CI/CD pipeline YAML workflows for MVP.

---

## 2. Local Automation Architecture (`Makefile`)

To ensure developer parity, automated validation is centralized in a clean, reproducible `Makefile` at the repository/backend root:

```makefile
.PHONY: all build test test-race cover lint docker-build compose-up compose-down clean

# Binary output and flags
BINARY_NAME=server
BUILD_DIR=./bin
GO_FILES=$(shell find . -name '*.go' -not -path './vendor/*')

all: lint test-race build

# Build static executable binary
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/server

# Standard table-driven unit tests
test:
	go test -v ./...

# Mandatory race detector test suite
test-race:
	go test -v -race -count=1 ./...

# Coverage verification against 80% floor
cover:
	go test -coverprofile=coverage.out -covermode=atomic ./...
	@go tool cover -func=coverage.out | grep total | awk '{print "Total Coverage: " $$3}'
	@go run ./scripts/check-coverage.go 80.0 coverage.out

# Code formatting and static linting
lint:
	gofmt -s -w $(GO_FILES)
	golangci-lint run --timeout=5m ./...

# Multi-stage Docker image build
docker-build:
	docker build -t eps-dashboard-backend:latest -f Dockerfile .

# Local Docker Compose lifecycle
compose-up:
	docker compose up -d --build

compose-down:
	docker compose down -v

clean:
	rm -rf $(BUILD_DIR) coverage.out
```

---

## 3. Pipeline Stages & Quality Gate Mapping

| Stage | Command / Tool | Success Criteria | Failure Action |
|:---|:---|:---|:---|
| **1. Formatting** | `gofmt -s -l .` | Zero unformatted Go files | Build stops; auto-reformat with `make lint` |
| **2. Static Analysis** | `golangci-lint run` | Zero linter errors (vet, staticcheck, errcheck) | Build stops; developer resolves issues |
| **3. Unit & Race Tests** | `go test -v -race -count=1 ./...` | 100% test pass; 0 data races detected | Build fails; race conditions blocked from merging |
| **4. Coverage Verification** | `go tool cover` | Line coverage $\ge 80.0\%$ on business logic | Build rejected if coverage drops below floor |
| **5. Multi-Stage Build** | `docker build` | Clean image output; $< 30\text{ MB}$; non-root user | Image build fails; dependencies audited |
| **6. Health Verification** | `docker compose up` | `GET /api/v1/health` returns `200 OK` in $< 30\text{ s}$ | Container logs inspected; roll forward/abort |

---

## 4. Environment Promotion & Branching Strategy

Per affirmed team practices, releases progress through strict linear branch promotion gates:

```
feature/scope-xyz (Local Branch)
        │
        │ [PR Gate]: make lint && make test-race && make cover
        ▼
staging (Integration Testing)
        │
        │ [Non-Fast-Forward Merge]: git merge --no-ff
        ▼
dev (Pre-Production Testing)
        │
        │ [Non-Fast-Forward Merge]: git merge --no-ff
        ▼
main (Production Release: Docker Compose Tag vX.Y.Z)
```

### Key Promotion Rules:
1. **Trunk Promotion**: Every PR merged into `staging`, `dev`, or `main` must use `--no-ff` (`Create Merge Commit`). Squash and fast-forward merges are forbidden to retain granular commit history and audit trails.
2. **Atomic Rollback**: If a defect reaches `staging` or `dev`, rollback is executed via single-command revert: `git revert -m 1 <merge-commit-hash>`.
3. **Semantic Versioning**: Releases on `main` are tagged with SemVer `v<MAJOR>.<MINOR>.<PATCH>`.

---

## 5. Deployment & Rollback Procedures

### 5.1 Deployment Procedure (Corporate Intranet VM / Host)
1. Pull target release tag from git:
   ```bash
   git fetch --tags && git checkout v1.0.0
   ```
2. Verify local environment variables in `.env` (database password, ports).
3. Execute zero-downtime rolling container rebuild:
   ```bash
   docker compose up -d --build --remove-orphans
   ```
4. Confirm health status:
   ```bash
   curl -f http://localhost:8080/api/v1/health
   ```

### 5.2 Rollback Procedure
If the deployed release fails health checks or exhibits runtime defects:
1. Revert to previous release tag:
   ```bash
   git checkout v0.9.0
   ```
2. Restart container topology using previous known-good image:
   ```bash
   docker compose up -d --build
   ```
3. Database backward compatibility: Migrations are strictly forward-additive; schema changes maintain backward compatibility across adjacent minor versions.

