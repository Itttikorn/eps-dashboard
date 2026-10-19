# NFR Requirements Questions — Unit: `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`, `aidlc-quality-agent`  
**Date**: 2026-10-16  

---

## Questions

### Q1: Database Connection Pool Sizing & Concurrency (Performance / NFR1)
For the Go backend connecting to PostgreSQL 16 via Docker Compose, handling concurrent dashboard queries (< 5ms) alongside daily multi-thousand-row CSV ingestions (< 500ms):
What connection pool configuration should be enforced?

- [x] A. Standard container pool: `MaxOpenConns: 25`, `MaxIdleConns: 10`, `ConnMaxLifetime: 5m`, `ConnMaxIdleTime: 2m` (Balanced resource usage for corporate VM/Docker Compose).
- [ ] B. Lean resource pool: `MaxOpenConns: 10`, `MaxIdleConns: 5`, `ConnMaxLifetime: 10m` (Minimizes memory footprint on constrained internal VMs).
- [ ] C. High-throughput pool: `MaxOpenConns: 50`, `MaxIdleConns: 25`, `ConnMaxLifetime: 2m` (Maximized query concurrency for high-traffic environments).

[Answer]: A

---

### Q2: CSV File Ingestion Sanitization & Injection Defense (Security / NFR6)
While the MVP runs in an internal corporate intranet without mandatory authentication (`NFR6.1`), uploaded CSV files could theoretically contain malicious payload formulas (`=`, `+`, `-`, `@`) or excessively large headers:
What security posture should the ingestion parser apply?

- [x] A. Defensive sanitization: Enforce `http.MaxBytesReader` (10MB ceiling), validate CSV content-type/encoding, and sanitize/escape leading formula characters (`=`, `+`, `-`, `@`) when storing text fields to prevent CSV formula injection in spreadsheet exports.
- [ ] B. Structural validation only: Enforce 10MB ceiling and 23-column schema validation; preserve raw string contents as-is without formula escaping (assuming trusted internal AUTOEMAIL pipeline).
- [ ] C. Strict rejection: Enforce 10MB ceiling; immediately reject the entire CSV upload with HTTP 400 if any cell begins with formula prefixes (`=`, `+`, `-`, `@`).

[Answer]: A

---

### Q3: Service Boot, Database Migration & Liveness Health Checks (Reliability / NFR4)
In the Docker Compose environment, the database container (`postgres:16`) and backend service (`wa-backend`) boot concurrently:
How should database migration execution and startup resilience be handled?

- [x] A. Embedded startup migrations with retry backoff: Backend checks DB connectivity with exponential backoff (up to 30s); executes forward migrations before binding the HTTP listener; exposes `/api/v1/health` returning 200 `{"service":"UP","database":"CONNECTED"}` or 503 `{"service":"UP","database":"DISCONNECTED"}`.
- [ ] B. Dedicated migration init-container: Docker Compose executes a separate migration step before starting `wa-backend`; the Go service fails fast immediately if tables are not found.
- [ ] C. Manual migration: Schema scripts are executed manually by the administrator; backend does not manage migrations automatically.

[Answer]: A

---

### Q4: Structured Logging & Telemetry Standard (Observability)
Per organizational backend standards and Clean Architecture, backend operations and API requests need consistent observability:
Which structured logging library and standard fields should be implemented?

- [x] A. Standard library `log/slog` (Go 1.21+): Zero external dependency, high performance, emitting structured JSON: `{"time", "level", "msg", "request_id", "method", "path", "status", "latency_ms", "bytes_in"}`.
- [ ] B. Uber `zap` structured logger: High performance with customizable log levels and production encoders.
- [ ] C. Simple standard library `log.Printf`: Text-based console output without JSON structuring.

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 (Connection Pool Sizing)**: A. Standard container pool — `MaxOpenConns: 25`, `MaxIdleConns: 10`, `ConnMaxLifetime: 5m`, `ConnMaxIdleTime: 2m` providing balanced resource utilization and concurrent query throughput on Docker Compose.
- **Q2 (CSV Injection Defense)**: A. Defensive sanitization — Enforce `http.MaxBytesReader` (10MB ceiling, configurable), UTF-8 decoding, and formula escape guards (`=`, `+`, `-`, `@`) targeting executable spreadsheet triggers while preserving valid engineering measurements.
- **Q3 (Service Startup & DB Migration)**: A. Embedded startup migrations with retry backoff — Go backend verifies Postgres connectivity with exponential backoff (up to 30s); executes schema migrations automatically before opening port 8080; exposes `/api/v1/health` with live DB status.
- **Q4 (Structured Logging)**: A. Standard library `log/slog` (Go 1.21+) — Zero external dependencies, high performance, emitting structured single-line JSON (`{"time", "level", "msg", "request_id", "method", "path", "status", "latency_ms", "bytes_in"}`).

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct


