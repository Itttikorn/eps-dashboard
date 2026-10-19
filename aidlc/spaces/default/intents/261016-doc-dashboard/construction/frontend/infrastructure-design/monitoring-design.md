# Monitoring & Observability Design Specification — Unit: `frontend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-architect-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Telemetry Framework

This monitoring design specification defines client-side metrics collection, Core Web Vitals telemetry, error reporting, and container health probes for the React 18 single-page application (`frontend`), tracing from:
- `performance-design.md`: Latency ceilings (`NFR1.1`, `NFR1.4`), client caching (`NFR1.5`), and Web Vitals (`NFR1.7`).
- `security-design.md`: Sanitized error masking (`NFR6.2`) and UI states (`NFR5.1`).
- `scalability-design.md` & `reliability-design.md`: Client error boundary recovery and retry telemetry.
- `observability-design.md` & `logical-components.md`: Telemetry provider architecture.
- `components.md` & `functional-spec.md`: Workflows 1–5 instrumentation hooks.
- `contract-summary.md`: API response status codes and timing.

---

## 2. Core Web Vitals & Client-Side Telemetry (NFR1.1, NFR1.4, NFR1.7, NFR5.1)

### 2.1 Web Vitals Metrics Register
The application embeds lightweight runtime measurement hooks utilizing standard browser Performance APIs (`web-vitals` / `PerformanceObserver`):

| Metric | Target Ceiling | Measurement Mechanism | Business / User Impact |
|:---|:---|:---|:---|
| **LCP (Largest Contentful Paint)** | $< 1.2\text{ s}$ | `PerformanceObserver(largest-contentful-paint)` | Initial dashboard perceived render speed |
| **INP (Interaction to Next Paint)** | $< 100\text{ ms}$ | `PerformanceObserver(event)` | Responsiveness of search inputs and filter chips |
| **CLS (Cumulative Layout Shift)** | $< 0.1$ | `PerformanceObserver(layout-shift)` | Visual stability during data loading transitions |
| **FID (First Input Delay)** | $< 50\text{ ms}$ | `PerformanceObserver(first-input)` | Initial click-to-response readiness |
| **Table Render Time** | $< 50\text{ ms}$ | `performance.measure('matrix-table-render')` | Smooth rendering of up to 100 project records |
| **Chart Re-render Time** | $< 50\text{ ms}$ | `performance.measure('trend-chart-render')` | Time-series multi-project curve rendering |

### 2.2 Client-Side Performance Instrumentation
```typescript
export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onFID(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  }
}
```

---

## 3. Query Cache & API Telemetry (NFR1.5, NFR6.2)

### 3.1 TanStack Query Cache Telemetry
TanStack Query v5 logs structured cache events in development mode and maintains metrics for:
- Query cache hit/miss ratio across `/projects`, `/projects/summary`, and `/analytics/trends`.
- Background revalidation duration and network latency.
- Mutation completion timing for CSV ingestion.

### 3.2 Error Logging & Information Shielding (NFR6.2)
- All client-side runtime errors caught by `RootErrorBoundary`, `TableErrorBoundary`, or `ChartErrorBoundary` log contextual diagnostic data to the browser console.
- Sensitive backend stack traces, database schema references, and private corporate identifiers are stripped prior to display in user toast notifications.

---

## 4. Container Health Probes & Lifecycle Monitoring (NFR5.1)

### 4.1 Nginx Liveness & Readiness Probes
The container exposes lightweight probes ensuring Docker Compose and container orchestrators maintain accurate service status:
- **Liveness Probe**: HTTP GET `/` returns HTTP 200 within $\le 5\text{ ms}$.
- **Readiness Probe**: HTTP GET `/health` returns `{"status":"UP"}` confirming Nginx worker processes and reverse proxy sockets are operational.
- **Compose Status Integration**: Docker Compose executes health check polls every 10 seconds with a 3-retry threshold before marking `wa-frontend` unhealthy.

