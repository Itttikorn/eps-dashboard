# Security Design: Unit `backend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-aws-platform-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the concrete security architecture, middleware interceptors, input sanitization routines, and container isolation controls satisfying the requirements defined in `security-requirements.md` (`NFR6.1`–`NFR6.5`):
- `security-requirements.md`: Open corporate intranet access, 10MB payload ceiling, CSV formula sanitization, non-root execution.
- `nfr-design-questions.md`: Q3 confirmed Permissive Wildcard CORS for MVP alongside standard protective HTTP security headers.

---

## 2. CORS Architecture & Security Headers Middleware (`NFR6.1`, `NFR6.3`)

### 2.1 Permissive Intranet CORS Configuration
Per Question Q3 decision, the Chi router mounts CORS middleware configured with permissive origins for internal intranet deployment:

```go
// CORS Middleware Configuration
corsMiddleware := cors.New(cors.Options{
    AllowedOrigins:   []string{"*"}, // Permissive wildcard for internal intranet / local dev
    AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
    AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
    ExposedHeaders:   []string{"X-Request-ID"},
    AllowCredentials: false,
    MaxAge:           300, // 5 minutes preflight cache
})
```

### 2.2 Security Headers Middleware Interceptor
To protect intranet users against content-type confusion and clickjacking, all HTTP responses pass through a dedicated security headers middleware:

```go
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("X-Content-Type-Options", "nosniff")
        w.Header().Set("X-Frame-Options", "DENY")
        w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
        w.Header().Set("X-XSS-Protection", "1; mode=block")
        if r.Method == http.MethodPost {
            w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
        }
        next.ServeHTTP(w, r)
    })
}
```

---

## 3. CSV Ingestion Sanitization Architecture (`NFR6.2`, `NFR6.3`)

The ingestion pipeline enforces defense-in-depth across three sequential stages:

```
[ Ingestion Stream ]
        │
        ▼ 1. Transport Bounding (http.MaxBytesReader: 10MB limit)
[ MaxBytesReader ]
        │
        ▼ 2. Encoding Validation (UTF-8 verify + strip BOM)
[ CSV Reader ]
        │
        ▼ 3. Cell-Level Formula Sanitization
[ Formula Sanitizer ] ──> Neutralizes =, @, +, - triggers
        │
        ▼ 4. Atomic PostgreSQL Transaction
[ DB Storage ]
```

### 3.1 Cell Formula Sanitization Routine:
```go
// Neutralizes Excel / CSV formula execution risks while preserving engineering units
func SanitizeCSVValue(raw string) string {
    v := strings.TrimSpace(raw)
    if len(v) == 0 {
        return v
    }
    // Formula triggers starting with '=' or '@'
    if v[0] == '=' || v[0] == '@' {
        return "'" + v
    }
    // Triggers starting with '+' or '-' (only if containing executable formula tokens)
    if (v[0] == '+' || v[0] == '-') && len(v) > 1 {
        if strings.ContainsAny(v, "()|`\"") {
            return "'" + v
        }
    }
    return v
}
```

---

## 4. Error Sanitization & Information Leakage Shield (`NFR6.4`)

- **Centralized Error Translator**: A domain error mapper intercepts internal errors before JSON serialization.
- **Envelope Compliance**: All responses conform strictly to `internal/utils/envelope.go`.
- **Masking Rules**:
  - PostgreSQL driver errors (`pq: duplicate key`, `syntax error`) are converted to clean, user-facing diagnostics (`"Invalid document record or constraint violation"`).
  - Internal panic recovery middleware intercepts runtime panics, logs the full stack trace securely to stdout via `slog.Error`, and returns HTTP 500 with sanitized message `"An internal server error occurred"`.

---

## 5. Container & Secret Hardening (`NFR6.5`)

```dockerfile
# Multi-stage Docker Hardening Pattern
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

FROM alpine:3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk --no-cache add ca-certificates tzdata
USER appuser:appgroup
WORKDIR /home/appuser
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["./server"]
```

- **Zero Hardcoded Secrets**: Secrets are parsed at runtime from environment variables (`DB_PASSWORD`, `DB_USER`). Missing credentials cause immediate startup exit.
- **Unprivileged Runtime**: Process runs strictly as non-root user `appuser:appgroup` (`uid: 10001`).

