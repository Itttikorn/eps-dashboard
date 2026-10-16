# Unit Dependency DAG & Integration Topology

**Stage**: `units-generation` (2.7)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-architect-agent`  
**Date**: 2026-10-16  

---

## 1. Machine-Readable Unit Dependency Block

The following fenced block declares the complete, acyclic topological dependency graph between units. The runtime compiler and downstream Bolt dispatchers consume this block directly:

```yaml
units:
  - name: backend
    kind: service
    depends_on: []
  - name: frontend
    kind: ui
    depends_on: [backend]
```

---

## 2. Topological Dependency Analysis

### Directed Edges
- **`frontend` (`U2`) $\rightarrow$ `backend` (`U1`)**:
  - `frontend` depends on `backend`.
  - The frontend client consumes the REST API endpoints served by the backend service. It relies on the contract schemas for project scorecards, comparative matrices, historical time-series analytics, and CSV upload ingestion responses.
- **`backend` (`U1`)**:
  - Root dependency (`depends_on: []`).
  - Independent of any upstream internal application units. It depends only on external infrastructure (PostgreSQL database and Docker runtime environment).

### Cyclic Dependency Check
- Graph vertex set: $\{ \text{backend}, \text{frontend} \}$
- Directed edges: $\{ (\text{frontend}, \text{backend}) \}$
- In-degrees: $\text{backend}: 0$, $\text{frontend}: 1$
- Out-degrees: $\text{backend}: 1$, $\text{frontend}: 0$
- **Result**: Cycle-free directed acyclic graph (DAG).

---

## 3. Integration Points & Contracts

The interface boundary between `backend` and `frontend` is strictly defined by an HTTP RESTful JSON API:

| Integration Point | Protocol & Format | Producer | Consumer | Data Transferred |
|:---|:---|:---|:---|:---|
| **Health Check** | HTTP GET `/api/v1/health` (JSON) | `backend` | `frontend` | Service status, database connectivity flag |
| **Comparative Summary** | HTTP GET `/api/v1/projects/summary` (JSON) | `backend` | `frontend` | Topbar KPI metrics, category totals across all projects |
| **Matrix Grid** | HTTP GET `/api/v1/projects` (JSON) | `backend` | `frontend` | Multi-project rows with 5 QA/QC category counts, overdue counts, delinquency flags |
| **Historical Trends** | HTTP GET `/api/v1/analytics/trends` (JSON) | `backend` | `frontend` | Multi-project daily document volume time-series, date range query parameters |
| **CSV File Ingestion** | HTTP POST `/api/v1/ingest` (`multipart/form-data`) | `backend` | `frontend` | CSV payload upload, batch processing summary, error diagnostics |

### Inter-Session Contract Governance
To ensure that backend and frontend construction can proceed in separate chat sessions with separate models without drift:
1. The exact JSON request and response payloads, HTTP status codes, error envelopes, and URL routes are formally specified in Stage 2.8 (`contract-design`) as an OpenAPI 3.0 document (`openapi.yaml`).
2. Mock fixtures derived from `openapi.yaml` will be generated during contract design to allow offline client-side validation if needed.

---

## 4. Integrated Walking Skeleton Slice

In alignment with the skeleton-on strategy:
- `backend` (`U1`) represents the first integrated slice. It can be built, booted via Docker, and tested end-to-end with real database schemas, CSV streaming ingestion, and HTTP endpoints before any frontend code is authored.
- Once `backend` is verified, `frontend` (`U2`) connects directly to the live backend instance, providing immediate end-to-end validation across the complete stack.

---

## 5. Parallel Development & Topological Notes

- **Independent Parallelism**: Because `frontend` depends on `backend`, pure parallel construction without an interface contract would introduce integration risk. However, with the frozen OpenAPI 3.0 specification produced in Stage 2.8 (`contract-design`), frontend component scaffolding and mock-data rendering can theoretically run in parallel if desired.
- **Topological Orderings**:
  1. `backend` $\rightarrow$ `frontend` (Strict serial: backend establishes live API first, frontend integrates against live service).
- **Economic Sequencing Notice**: This document specifies topological constraints only. Economic path selection, risk prioritization, and final construction session scheduling are determined in Stage 2.9 (Delivery Planning).
