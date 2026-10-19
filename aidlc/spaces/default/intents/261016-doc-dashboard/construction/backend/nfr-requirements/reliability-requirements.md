# Reliability Requirements: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-quality-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification establishes availability targets, startup resilience, fault tolerance, transaction atomicity, and disaster recovery invariants for the Go backend service and PostgreSQL storage layer, tracing from:
- `requirements.md`: Upstream requirements `NFR4.1`–`NFR4.3` (testing, race detection, transaction atomicity).
- `contract-summary.md`: `/api/v1/health` schema and HTTP status contracts.
- `functional-spec.md`: Workflows 1–4 and failure state transitions.
- `nfr-requirements-questions.md`: Q3 confirmed Embedded Startup Migrations with Exponential Retry Backoff.

---

## 2. Availability Targets (SLA & SLO)

Operating on internal corporate infrastructure / Docker Compose, the backend service enforces:

- **Service Availability Target (SLO)**: $\ge 99.5\%$ uptime during business hours (07:00 – 19:00 UTC+7).
- **Scheduled Maintenance Windows**: Weekends / off-peak hours for database backup and OS patching.
- **Mean Time to Recovery (MTTR)**: $< 60\text{ seconds}$ upon container restart via Docker Compose `restart: unless-stopped`.
- **Data Loss Tolerance (RPO)**: Zero data loss for committed transactions; daily snapshot CSV files remain recoverable from file storage or pipeline mailboxes.

---

## 3. Service Boot, Database Migration & Startup Resilience (`NFR4.4`)

Per Question Q3 decision, the backend service implements self-healing startup resilience to handle race conditions where the database container starts concurrently:

```go
// Startup Connectivity & Migration Flow
func WaitForDatabase(dsn string, maxTimeout time.Duration) (*gorm.DB, error) {
    deadline := time.Now().Add(maxTimeout)
    backoff := 500 * time.Millisecond
    
    for time.Now().Before(deadline) {
        db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
        if err == nil {
            sqlDB, err := db.DB()
            if err == nil && sqlDB.Ping() == nil {
                slog.Info("Database connection established successfully")
                return db, nil
            }
        }
        slog.Warn("PostgreSQL not ready yet, retrying...", "backoff_ms", backoff.Milliseconds())
        time.Sleep(backoff)
        if backoff < 4*time.Second {
            backoff *= 2 // Exponential backoff capped at 4s
        }
    }
    return nil, fmt.Errorf("database connectivity timeout exceeded after %v", maxTimeout)
}
```

### Startup Sequence Invariants:
1. **Connectivity Polling**: Retries connection with exponential backoff for up to 30 seconds. If PostgreSQL fails to respond within 30s, the process logs a fatal error and terminates with exit code 1.
2. **Automated Forward Migrations**: Once connected, executes automated forward GORM / SQL schema migrations (`AutoMigrate`) under a shared migration lock.
3. **HTTP Binding**: The HTTP server only binds port `8080` *after* database migrations have successfully verified. No traffic is served against un-migrated tables.

---

## 4. Health Checks & Readiness Probes (`NFR4.5`)

The service provides a dedicated health check endpoint mounted at `GET /api/v1/health`:

- **Database Reachable**: Returns HTTP 200 OK with universal envelope:
  ```json
  {
    "status": { "code": 1000, "header": "Success", "description": "Service is healthy" },
    "result": {
      "service": "UP",
      "database": "CONNECTED",
      "timestamp": "2026-10-16T18:00:00Z"
    }
  }
  ```
- **Database Disconnected**: Returns HTTP 503 Service Unavailable:
  ```json
  {
    "status": { "code": 1900, "header": "Server Error", "description": "Database connection lost" },
    "result": {
      "service": "UP",
      "database": "DISCONNECTED",
      "timestamp": "2026-10-16T18:00:00Z"
    }
  }
  ```
- **Docker Compose Integration**: The `docker-compose.yml` configures healthchecks targeting `GET /api/v1/health` with a 10s interval and 3-retry threshold.

---

## 5. Transaction Atomicity & Fail-Fast Integrity (`NFR4.3`)

- **Single Unit of Work**: Ingestion processing for a snapshot file operates entirely within a single PostgreSQL transaction (`tx := db.Begin()`).
- **All-or-Nothing Rollback**: If any validation rule fails (`BR1.1`–`BR1.5`), if any row date is malformed, or if any database write fails, `tx.Rollback()` is immediately invoked.
- **Zero Partial Corruption**: A failed snapshot upload leaves zero orphaned records in `ingestion_batches`, `document_revisions_current`, `document_change_log`, or `project_daily_metrics`.

---

## 6. Graceful Shutdown & Connection Draining

- The server captures `os.Interrupt`, `SIGINT`, and `SIGTERM` signals.
- Upon receiving a termination signal, the HTTP server initiates `server.Shutdown(ctx)` with a 5-second graceful shutdown budget:
  1. Closes the HTTP listener to reject new incoming connections.
  2. Allows active in-flight requests (including active ingestion transactions) up to 5 seconds to commit or complete.
  3. Closes idle database connections cleanly via `db.Close()`.
  4. Flushes any pending log buffers and exits.

