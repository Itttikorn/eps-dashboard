# Observability Design: Unit `backend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the telemetry architecture, structured logging middleware, correlation tracing, and metric emissions satisfying `observability-requirements.md` (`NFR7.1`–`NFR7.3`):
- `observability-requirements.md`: Standard Go `log/slog`, `X-Request-ID` tracing, telemetry schema.
- `nfr-requirements-questions.md`: Q4 confirmed Go `log/slog` structured JSON format.

---

## 2. Structured Logging Middleware Design (`NFR7.1`, `NFR7.2`)

The Chi router mounts a high-performance, zero-allocation logging middleware that captures request lifecycle attributes:

```go
func StructuredLoggingMiddleware(logger *slog.Logger) func(next http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            
            // Extract or generate X-Request-ID
            reqID := r.Header.Get("X-Request-ID")
            if reqID == "" {
                reqID = uuid.New().String()
            }
            w.Header().Set("X-Request-ID", reqID)
            
            // Wrap response writer to capture status code and bytes written
            ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
            
            // Inject request-scoped logger into context
            ctx := context.WithValue(r.Context(), "request_id", reqID)
            
            next.ServeHTTP(ww, r.WithContext(ctx))
            
            duration := time.Since(start)
            logger.Info("HTTP request completed",
                slog.String("request_id", reqID),
                slog.String("method", r.Method),
                slog.String("path", r.URL.Path),
                slog.Int("status", ww.Status()),
                slog.Float64("latency_ms", float64(duration.Microseconds())/1000.0),
                slog.Int("bytes_out", ww.BytesWritten()),
                slog.String("client_ip", r.RemoteAddr),
            )
        })
    }
}
```

---

## 3. Log Context Propagation Architecture

To avoid passing request IDs manually across domain services:
- A package-level helper `LoggerFromContext(ctx context.Context) *slog.Logger` extracts the `request_id` and attaches it as a child attribute:
  ```go
  func FromContext(ctx context.Context) *slog.Logger {
      if reqID, ok := ctx.Value("request_id").(string); ok && reqID != "" {
          return slog.Default().With(slog.String("request_id", reqID))
      }
      return slog.Default()
  }
  ```

---

## 4. Batch Ingestion Telemetry Emission

When an ingestion batch commits, the `IngestionService` emits an operational telemetry event:

```go
slog.Info("CSV batch ingested successfully",
    slog.String("batch_id", batch.ID.String()),
    slog.String("project_id", batch.ProjectID),
    slog.Int("total_rows", batch.RowCount),
    slog.Int("deltas_updated", batch.DeltasUpdated),
    slog.Int("skipped_unchanged", batch.SkippedUnchanged),
    slog.Float64("duration_ms", durationMs),
    slog.Float64("throughput_rows_sec", float64(batch.RowCount)/(durationMs/1000.0)),
)
```

---

## 5. Operational Dashboard & Alerting Integration

- **Standard Output Transport**: All logs are emitted to `stdout` in single-line JSON format, allowing Docker Compose or container logging daemons (Fluentbit, Promtail, CloudWatch) to ingest them with zero log parsing overhead.
- **Log Level Governance**:
  - `INFO`: Normal API traffic and completed batches.
  - `WARN`: Client validation errors (400), conflicts (409), retry events.
  - `ERROR`: Unhandled panics, database failures (500), transaction rollbacks.

