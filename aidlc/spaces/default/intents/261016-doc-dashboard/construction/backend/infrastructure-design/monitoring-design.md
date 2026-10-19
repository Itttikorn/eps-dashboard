# Monitoring Design: Unit `backend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification defines the operational monitoring, telemetry metrics, alert routing, SLI/SLO commitments, and log aggregation architecture for the Go backend service and PostgreSQL storage tier, tracing from:
- `observability-design.md`: Structured single-line JSON logging, `X-Request-ID` correlation, and key telemetry metrics (`NFR7.1`–`NFR7.3`).
- `performance-design.md`: Sub-10ms executive summary and sub-15ms project matrix latency budgets (`NFR1.1`, `NFR1.2`).
- `reliability-design.md`: Health probe status (`/api/v1/health`) and ingestion error rate tracking (`NFR4.5`).

---

## 2. Metrics & Key Performance Indicators (KPIs)

| Metric | Source | Threshold | Why it matters |
|:---|:---|:---|:---|
| **API Request Latency (p95)** | HTTP Middleware (`http_request_duration_seconds`) | Summary: $< 10\text{ ms}$<br>Matrix: $< 15\text{ ms}$ | Ensures executive dashboard queries remain instantaneous without database queuing or table scan regressions. |
| **Ingestion Processing Latency (p95)** | Ingestion Handler (`ingestion_duration_seconds`) | Batch ($< 5\text{K}$ rows): $< 350\text{ ms}$<br>Large ($10\text{K}$ rows): $< 1,000\text{ ms}$ | Detects row diffing regressions or slow database commit bottlenecks during daily snapshot uploads. |
| **HTTP 5xx Error Rate** | HTTP Middleware (`http_requests_total{status=~"5.."}`) | $< 0.1\%$ of total requests over 5 min | Identifies unhandled exceptions, panic recoveries, or database connectivity drops. |
| **Ingestion Error Count** | Ingestion Handler (`ingestion_failures_total`) | $> 0$ consecutive failures | Flags corrupted CSV formats, schema validation failures, or uncommitted rollback events. |
| **DB Connection Pool Usage** | Database Pool (`db_connections_in_use`) | $> 18$ open connections (72% of pool) | Warns of connection starvation, slow leaked queries, or connection pool exhaustion. |
| **Container Memory Footprint** | Docker Engine (`container_memory_usage_bytes`) | $> 256\text{ MB}$ (50% of 512MB limit) | Detects memory leaks in streaming CSV reader or goroutine leaks. |
| **Container CPU Utilization** | Docker Engine (`container_cpu_usage_seconds_total`) | $> 80\%$ sustained for $> 2\text{ min}$ | Flags CPU-bound spinning or excessive serialization loops. |
| **PostgreSQL Disk Utilization** | Host Storage (`volume_bytes_used{volume="postgres_data"}`) | $> 80\%$ disk capacity | Prevents database halt due to out-of-disk space conditions. |

---

## 3. Alerts & Incident Routing

| Alert | Condition | Severity | Routes to |
|:---|:---|:---|:---|
| **ServiceDown** | `GET /api/v1/health` fails or returns 503 for $> 30\text{ s}$ | **P1 - Critical** | Engineering On-Call (Intranet alert webhook / Slack `#ops-alerts`) |
| **DatabaseUnreachable** | PostgreSQL container health status `unhealthy` for $> 1\text{ min}$ | **P1 - Critical** | Engineering On-Call & Database Administrator |
| **IngestionFailureSpike** | 2 consecutive CSV ingestion failures on any project | **P2 - High** | Data Engineering / QA Lead |
| **QueryLatencyDegradation** | p95 latency $> 50\text{ ms}$ on `/api/v1/projects` for $> 5\text{ min}$ | **P2 - High** | Backend Engineering Team |
| **ConnectionPoolSaturation** | Open DB connections $> 22$ (88% limit) for $> 2\text{ min}$ | **P3 - Warning** | Backend Engineering Team |
| **HighMemoryUtilization** | Container memory $> 384\text{ MB}$ (75% limit) for $> 5\text{ min}$ | **P3 - Warning** | DevOps / Infrastructure Team |
| **DiskSpaceRunningLow** | `postgres_data` volume free space $< 15\%$ | **P2 - High** | Infrastructure Team |

---

## 4. Service Level Indicators (SLIs) & Service Level Objectives (SLOs)

| SLI | SLO Target | Measurement Window | Tracking Method |
|:---|:---|:---|:---|
| **API Availability** | $\ge 99.9\%$ of valid requests return HTTP 2xx/4xx | Rolling 30-day window | `(Total Requests - HTTP 5xx) / Total Requests * 100` |
| **Summary Latency** | $\ge 95\%$ of `GET /api/v1/projects/summary` execute in $< 10\text{ ms}$ | Rolling 7-day window | Timer middleware histogram bucket analysis |
| **Matrix Latency** | $\ge 95\%$ of `GET /api/v1/projects` execute in $< 15\text{ ms}$ | Rolling 7-day window | Timer middleware histogram bucket analysis |
| **Ingestion Durability** | $100\%$ of committed CSV batches persist with 0 data loss | Continuous | Transaction commit log verification (`document_change_log`) |
| **Recovery Time (MTTR)** | Startup self-healing / container restart $< 30\text{ s}$ | Per incident | Container orchestration recovery timer |

---

## 5. Log Aggregation & Tracing Architecture

### 5.1 Structured Log Aggregation
- **Format**: Single-line JSON emitted to `stdout`/`stderr` adhering to standard Go `log/slog`.
- **Log Driver**: Docker default `json-file` log driver with mandatory file rotation:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "20m"
      max-file: "5"
  ```
- **Forwarding Pipeline**: Optional lightweight log collector (`promtail` or `fluent-bit`) shipping container JSON logs to central corporate logging (Grafana Loki or ELK Stack).
- **Log Sanitization**: Sensitive authorization tokens, database connection credentials, and file payload byte streams are strictly redacted at the logger middleware layer.

### 5.2 Distributed Request Tracing
- **Correlation ID**: Every HTTP request receives an `X-Request-ID` (extracted from client header if present, or generated via UUIDv4).
- **Context Propagation**: Injected into `context.Context` and attached as an attribute to every log event emitted during the request lifecycle.
- **Response Header**: Echoed in response header `X-Request-ID` and universal response envelope (`status.description`) for client-server traceability.

