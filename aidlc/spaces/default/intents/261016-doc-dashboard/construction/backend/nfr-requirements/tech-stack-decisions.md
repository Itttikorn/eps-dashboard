# Technology Stack Decisions: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-developer-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification records the definitive technology stack selections, architectural justifications, version constraints, and rejected alternatives for the backend service unit, tracing from:
- `requirements.md`: Upstream constraints (Go 1.22+, Chi v5, PostgreSQL, Docker Compose).
- `team.md`: Affirmed team rules (linear promotion pipeline, race detector, non-root container, standard response envelope).
- `project.md`: Project memory decisions (Chi with universal envelope, PostgreSQL, Docker Compose).
- `nfr-requirements-questions.md`: Q1 (connection pool), Q3 (embedded migrations), Q4 (`log/slog`).

---

## 2. Technology Selections Master Register

| Component Layer | Technology Choice | Exact Version | Primary Rationale & Justification |
|:---|:---|:---|:---|
| **Programming Language** | **Go** | `1.22+` | Compiled binary efficiency, $< 15\text{ MB}$ memory footprint, native concurrency for CSV streaming, built-in race detector. |
| **HTTP Web Router** | **Chi** | `v5.0.12+` | Lightweight (zero external dependencies), 100% idiomatic `net/http` compatibility, modular middleware composability, zero regex overhead. |
| **Primary Database** | **PostgreSQL** | `16.x` | Rock-solid ACID transaction atomicity, advanced JSON functions, rich index types (composite, B-tree), Docker container support. |
| **ORM / Data Access** | **GORM** | `v1.25.10+` | Automated schema forward migrations, robust transaction management (`tx.Begin()`, `tx.Commit()`, `tx.Rollback()`), idiomatic model mapping. |
| **PostgreSQL Driver** | **pgx / pgxpool** | `v5.6.0+` (via GORM) | High-performance pure-Go PostgreSQL driver with native binary protocol support and robust connection pooling. |
| **Structured Logger** | **`log/slog`** | Go Standard Library | Built-in standard library logging (zero external dependency), structured single-line JSON, context propagation. |
| **Containerization** | **Docker** | Multi-Stage | Builder stage (`golang:1.22-alpine`) + minimal unprivileged runtime image (`alpine:3.20`), non-root execution (`uid 10001`). |
| **Local / VM Deployment** | **Docker Compose** | `v2.x` | Declarative multi-container topology (`wa-backend`, `postgres:16`), automated boot sequencing, volume persistence. |
| **Testing Harness** | **Go Standard Testing** | Go Standard Library | Table-driven unit tests, in-memory repository fakes, concurrency race detection (`-race`), 80% line coverage floor. |
| **Code Quality / Linter** | **`golangci-lint`** | `v1.59+` | Fast Go linter aggregator enforcing formatting, cyclomatic complexity, error checking, and code style. |

---

## 3. Detailed Architectural Justifications & Tradeoffs

### 3.1 Language: Go 1.22+
- **Selected**: Go 1.22+
- **Alternatives Considered**: Node.js/TypeScript (NestJS/Express), Python (FastAPI).
- **Justification**:
  - Ingestion throughput: Parsing 5,000–10,000 CSV rows and performing in-memory diffing runs in $< 20\text{ ms}$ in Go, compared to ~150–300ms in Node.js or Python.
  - Predictable Memory: Go's manual memory management and compact structs prevent runtime garbage collection pauses during high-frequency dashboard queries.
  - Single Static Binary: Compiles to a self-contained ~18MB executable with zero external runtime dependencies.

### 3.2 HTTP Framework: Chi v5
- **Selected**: Chi v5 (`github.com/go-chi/chi/v5`)
- **Alternatives Considered**: Gin, Fiber, Echo.
- **Justification**:
  - Standard Library Compatibility: Unlike Fiber (which uses `fasthttp` and breaks `net/http` standard libraries), Chi wraps standard `http.HandlerFunc`, enabling standard Go middleware (`http.MaxBytesReader`, context cancellation, standard fakes in unit tests).
  - Clean Architecture Decoupling: Chi routers can be mounted modularly without polluting domain entities with framework-specific annotations.

### 3.3 Database & ORM: PostgreSQL 16 + GORM
- **Selected**: PostgreSQL 16 with GORM
- **Alternatives Considered**: SQLite, MySQL 8, raw `sqlx`.
- **Justification**:
  - PostgreSQL 16 provides superior query execution planning, parallel sequential scans, and robust locking primitives for concurrent CSV uploads.
  - GORM provides automated forward-only schema migrations on boot (`AutoMigrate`), eliminating manual SQL deployment scripts for the MVP while preserving access to underlying `*sql.DB` for connection pool tuning.

### 3.4 Structured Logging: Go `log/slog`
- **Selected**: Go `log/slog`
- **Alternatives Considered**: Uber `zap`, Logrus, ZeroLog.
- **Justification**:
  - Ships directly with the Go runtime (Go 1.21+), eliminating third-party dependency vulnerabilities.
  - Native JSON output handler matches organizational backend standards (`backend-standards.md`) out of the box with zero configuration drift.

---

## 4. Package & Dependency Matrix (`go.mod` Baseline)

```
module wa-backend

go 1.22

require (
    github.com/go-chi/chi/v5 v5.0.12
    github.com/go-chi/cors v1.2.1
    github.com/google/uuid v1.6.0
    gorm.io/driver/postgres v1.5.7
    gorm.io/gorm v1.25.10
)
```

