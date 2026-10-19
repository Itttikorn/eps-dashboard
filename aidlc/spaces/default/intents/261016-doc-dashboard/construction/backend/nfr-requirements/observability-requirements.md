# Observability Requirements: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-quality-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification defines structured logging standards, request tracing, telemetry metrics, and alerting thresholds for the Go backend service and PostgreSQL storage layer, tracing from:
- `backend-standards.md`: Organizational logging standards and single-line JSON format.
- `functional-spec.md`: Workflows 1–4 and batch metric emissions.
- `nfr-requirements-questions.md`: Q4 confirmed Standard Library `log/slog` with standard telemetry fields.

---

## 2. Structured JSON Logging Standard (`NFR7.1`)

Per Question Q4 decision, the backend implements Go 1.21+ standard library `log/slog` configuring a production JSON handler writing to standard output:

```go
// Production JSON Logger Initialization
handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
    ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
        if a.Key == slog.TimeKey {
            a.Value = slog.StringValue(a.Value.Time().UTC().Format(time.RFC3339Nano))
        }
        return a
    },
})
logger := slog.New(handler)
slog.SetDefault(logger)
```

### Mandatory Schema Fields for HTTP Requests:

Every completed HTTP request emits exactly one structured log line conforming to the schema:

```json
{
  "time": "2026-10-16T18:05:00.123456789Z",
  "level": "INFO",
  "msg": "HTTP request completed",
  "request_id": "7f8b9a2c-4e12-4a9b-8d3e-1b2c3d4e5f6a",
  "method": "GET",
  "path": "/api/v1/projects",
  "status": 200,
  "latency_ms": 4.25,
  "bytes_in": 0,
  "bytes_out": 14250,
  "client_ip": "192.168.1.10"
}
```

---

## 3. Distributed Request Correlation (`NFR7.2`)

To enable end-to-end tracing across reverse proxies, client browsers, and database transactions:
- **`X-Request-ID` Middleware**:
  - If incoming request carries `X-Request-ID`, validate and reuse the identifier.
  - If missing, generate a new UUIDv4 string.
  - Attach the `request_id` to the request `context.Context`.
  - Echo `X-Request-ID` in all outgoing HTTP response headers.
- **Log Context Propagation**:
  All log statements within handlers or repository calls inherit the contextual logger (`loggerFromContext(ctx)`) to automatically include `"request_id"`.

---

## 4. Log Levels & Severity Thresholds (`NFR7.3`)

| Level | Usage Criteria | Examples |
|:---|:---|:---|
| **`DEBUG`** | Verbose diagnostic traces during development; disabled in production | In-memory diff row comparisons, SQL query debug statements. |
| **`INFO`** | Normal operational events and completed HTTP transactions | Service boot, migration complete, batch ingested, HTTP 2xx/3xx. |
| **`WARN`** | Recoverable anomalies, client errors, or approaching thresholds | HTTP 400 Bad Request, CSV validation failure, Postgres reconnect retry. |
| **`ERROR`** | Unrecoverable failures, server faults, or transaction rollbacks | HTTP 500 Server Error, database transaction abort, migration failure. |

---

## 5. Key Operational Telemetry & Service Level Indicators (SLIs)

### 1. Ingestion Performance Telemetry:
Upon batch completion, the ingestion engine logs an aggregated metric event:
```json
{
  "level": "INFO",
  "msg": "CSV snapshot batch committed",
  "batch_id": "e48ff318-e2d1-41a0-996d-d5d0085eae29",
  "project_id": "PRJ-001",
  "total_rows": 2150,
  "deltas_updated": 45,
  "skipped_unchanged": 2105,
  "duration_ms": 320.5,
  "throughput_rows_sec": 6708.2
}
```

### 2. Database Connection Pool Telemetry:
Periodic background diagnostic (logged every 5 minutes at `INFO` or exposed via debug endpoint):
- `open_connections`: Active count from `db.Stats().OpenConnections`.
- `in_use_connections`: Currently running queries (`db.Stats().InUse`).
- `idle_connections`: Idle in pool (`db.Stats().Idle`).
- `wait_count`: Total connection wait count (`db.Stats().WaitCount`).

---

## 6. Alerting Triggers & Thresholds

| Alert Indicator | Threshold | Severity | Immediate Operational Action |
|:---|:---|:---|:---|
| **Database Disconnection** | `/api/v1/health` returns 503 | `CRITICAL` | Docker Compose restart policy triggers container restart. |
| **Ingestion Rollback Spike** | $> 2$ consecutive batch failures | `HIGH` | Check CSV header schema and data source pipeline exports. |
| **Critical Backlog Delinquency** | Any project pending ratio $\ge 45\%$ | `WARNING` | Highlights project row with pulsing visual alert (`.chip-blink`). |
| **API Latency Degradation** | Summary p95 latency $> 50\text{ ms}$ | `WARNING` | Inspect slow query logs and PostgreSQL index health. |

