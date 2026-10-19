# NFR Design Questions — Unit: `backend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `backend` (`U1`, kind: `service`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`  
**Date**: 2026-10-16  

---

## Questions

### Q1: Ingestion Concurrency & Project Isolation Pattern (Reliability / Performance)
When daily snapshot CSV uploads arrive, potentially concurrently from different projects or duplicate pipeline triggers:
How should concurrent ingestion requests be isolated and controlled?

- [x] A. Project-scoped synchronization + DB transaction lock (Recommended): Ingestions for different projects execute concurrently in parallel; concurrent ingestions targeting the *same* `project_id` are serialized, returning HTTP 409 Conflict if an upload for that project is actively in-flight.
- [ ] B. Global ingestion lock: Exactly one CSV upload is processed system-wide at any given time; any concurrent ingestion request returns HTTP 429 / 409 until the active upload completes.
- [ ] C. Asynchronous queue: Upload endpoint stores the file and returns HTTP 202 Accepted immediately, processing rows in a background worker goroutine.

[Answer]: A

---

### Q2: Dashboard Read Query Caching & Invalidation Architecture (Performance)
The topbar executive summary (`/api/v1/projects/summary`) and project matrix (`/api/v1/projects`) receive high-frequency reads from dashboard viewers:
What caching architecture should be designed?

- [ ] A. In-memory read-through cache with instant invalidation on batch commit: Cache aggregated summary DTOs in memory with a short 30-second TTL.
- [x] B. Pure indexed PostgreSQL queries (Direct reads - Selected): Bypasses application caching entirely, relying on PostgreSQL composite indexes and RAM buffer pool (< 5ms response time); guarantees zero stale data and eliminates cache invalidation complexity for moderate user concurrency.
- [ ] C. External Redis cache: Introduce an external Redis cache container inside Docker Compose.

[Answer]: B

---

### Q3: CORS & HTTP Security Header Configuration (Security)
For the backend Chi router serving the React dashboard SPA on internal corporate intranet / Docker Compose:
What CORS and HTTP security header policy should be enforced?

- [ ] A. Configurable intranet CORS + standard security headers: Chi CORS middleware allowing configured intranet origins.
- [x] B. Permissive wildcard CORS (Selected for now): Allow all origins (`*`) with standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) to streamline internal intranet / local development connectivity without origin constraints.
- [ ] C. Strict same-origin only: No CORS headers allowed.

[Answer]: B

---

## Consolidated Summary Confirmation

- **Q1 (Ingestion Concurrency)**: A. Project-scoped synchronization + DB transaction lock — Parallel concurrent ingestions across different projects; serialized execution per `project_id` returning HTTP 409 Conflict if an upload for the same project is in-flight.
- **Q2 (Read Caching Architecture)**: B. Pure indexed PostgreSQL queries (Direct reads) — Direct queries leveraging PostgreSQL composite indexes and memory buffer pool (< 5ms response time); zero cache invalidation complexity, zero stale data, and minimal RAM footprint for moderate user volume.
- **Q3 (CORS & Security Headers)**: B. Permissive wildcard CORS for now — Allow all origins (`*`) with standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) to streamline internal intranet / local development connectivity.

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct


