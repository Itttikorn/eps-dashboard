# NFR Design Questions — Unit: `frontend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## Questions

### Q1: Table Rendering & Performance Optimization Pattern (Performance)
The comparative project matrix table renders up to 100 project rows (default 20) with multiple metrics and badges, with an SLO of $\le 50\text{ ms}$ rendering latency:
How should table rendering and data transformations be optimized?

- [x] A. Direct React DOM rendering with memoization (Recommended): Use `React.memo` for table rows and `useMemo` for search/sort transformations; maintain standard DOM table nodes with CSS containment (`contain: paint`). Avoids virtualization library overhead while guaranteeing $< 10\text{ ms}$ rendering for 100 rows and $\text{CLS} < 0.1$.
- [ ] B. Virtualized list rendering: Integrate `@tanstack/react-virtual` to window table rows into a fixed viewport.
- [ ] C. Paginated server-side rendering: Fetch only the active page from the backend on each page change.

[Answer]: A

---

### Q2: Caching, Invalidation & Retry Strategy (Performance / Resilience)
The dashboard issues read queries for projects matrix, executive summary, and multi-project trend curves:
What client caching and background refetching architecture should TanStack Query v5 implement?

- [x] A. Tiered stale-while-revalidate with upload invalidation (Recommended): Configure 30s staleTime for `/projects`, 60s for `/projects/summary`, and 120s for `/analytics/trends`. Successful CSV uploads trigger instant cache invalidation (`queryClient.invalidateQueries`). Read queries retry twice with exponential backoff; upload mutations fail fast with zero retries.
- [ ] B. Real-time polling: Poll all endpoints every 5 seconds without cache retention.
- [ ] C. Manual refresh only: Disable automatic background revalidation; reload only on explicit user click.

[Answer]: A

---

### Q3: Security Posture, Error Masking & CSP (Security)
For the React SPA deployed in an internal corporate intranet environment:
What client-side security defenses and error handling policies should be designed?

- [x] A. Strict JSX encoding, CSP defense, and universal envelope extraction (Recommended): Reject `dangerouslySetInnerHTML`, enforce CSP headers (`connect-src http://localhost:8080`), validate CSV upload constraints client-side ($\le 10\text{ MB}$, `.csv`), and extract user-friendly messages from `status.description` while masking internal traces.
- [ ] B. Permissive inline scripts: Allow inline script evaluation without CSP restrictions.
- [ ] C. Direct error passthrough: Display raw server error bodies and stack traces in error alerts.

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 (Rendering Optimization)**: A. Direct React DOM rendering with `React.memo` and `useMemo` — Guarantees sub-50ms table rendering latency and zero layout shift ($\text{CLS} < 0.1$) without virtualizer complexity.
- **Q2 (Caching & Invalidation)**: A. Tiered stale-while-revalidate with upload invalidation — 30s/60s/120s TanStack Query caching with instant post-upload invalidation and fail-fast mutation policies.
- **Q3 (Security & Error Masking)**: A. Strict JSX encoding, CSP defense, and universal envelope extraction — Strict XSS defenses, pre-flight upload bounding, and sanitized error envelopes masking internal infrastructure details.

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct
