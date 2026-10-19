# Scalability Design: Unit `backend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the architectural scalability design, multi-tier storage decomposition, batch processing boundaries, and horizontal scaling provisions satisfying `scalability-requirements.md` (`NFR2.1`–`NFR2.3`):
- `scalability-requirements.md`: 98%+ storage reduction, 10,000-row batch scaling, 3-year capacity projections.
- `nfr-design-questions.md`: Q1 (project isolation concurrency) and Q2 (direct database read architecture).

---

## 2. Decoupled 3-Tier Storage Architecture (`NFR2.1`, `NFR2.2`)

To eliminate relational table bloat while supporting unlimited historical time-series analytics, data persistence is split into three decoupled operational tiers:

```
[ Ingestion Engine ]
        │
   ┌────┼──────────────────────────┐
   │    │                          │
   ▼    ▼                          ▼
Tier 1: Active State      Tier 2: Delta Ledger       Tier 3: Daily Rollup
[ doc_revisions_curr ]    [ doc_change_log ]         [ proj_daily_metrics ]
- Lean bounded table      - Append-only events       - Exactly 1 row/day/prj
- ~300-500 rows / project - Stored only on changes   - 10,950 rows / 2 years
- Powers live dashboards  - Full field-level audit   - Powers trend analytics
```

### Tier Invariants:
1. **Tier 1 (Active State)**:
   - Contains strictly the highest revision per unique `(project_id, doc_id)`.
   - Never grows indefinitely; rows are mutated in-place via `ON CONFLICT (project_id, doc_id) DO UPDATE`.
   - Table size stays capped at ~5,000 to 10,000 rows across all corporate projects.
2. **Tier 2 (Audit Delta Ledger)**:
   - Receives inserts only when an attribute mutation is identified between incoming snapshot and current state.
   - Zero inserts for identical/unchanged records (eliminating ~98% of blind redundant storage).
3. **Tier 3 (Materialized Daily Metrics)**:
   - Pre-computed rollup row generated synchronously at the end of every successful ingestion transaction.
   - Decouples historical chart rendering from the raw document tables.

---

## 3. Streaming Ingestion Batch Chunking

For scaling beyond 5,000 rows up to 10,000+ rows per snapshot:
1. **Streaming Memory Buffers**:
   - The CSV parser streams rows sequentially without allocating the whole file into an array.
   - Identified changes are batched into chunks of 1,000 rows for bulk SQL insertion:
     ```go
     // Bulk insert chunking pattern
     const chunkSize = 1000
     for i := 0; i < len(changes); i += chunkSize {
         end := min(i+chunkSize, len(changes))
         tx.CreateInBatches(changes[i:end], chunkSize)
     }
     ```
2. **PostgreSQL WAL Protection**:
   - Chunked bulk operations minimize write amplification and prevent WAL (Write-Ahead Logging) disk spikes.

---

## 4. Stateless Service Design & Horizontal Scaling

- **Zero In-Process Session State**: The Go backend maintains zero user sessions, zero sticky state, and zero local cache dependencies.
- **Shared PostgreSQL Database**: All shared state resides exclusively in PostgreSQL.
- **Horizontal Scalability Ready**: If traffic increases in future phases, multiple instances of `wa-backend` can be deployed behind a standard load balancer (e.g. Nginx, AWS ALB, Traefik) without code modification.

