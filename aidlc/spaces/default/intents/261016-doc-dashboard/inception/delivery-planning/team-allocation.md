# Team & Model Allocation

**Stage**: `delivery-planning` (2.9)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-delivery-agent`  
**Date**: 2026-10-16  

---

## 1. Bolt Ownership & Execution Persona

In alignment with the `mvp` scope configuration (where Stage 1.5 Team Formation was skipped), all construction delivery tasks are led by the autonomous AI developer persona:

| Bolt ID | Bolt Name | Lead Agent Persona | Execution Model | Session Allocation |
|:---|:---|:---|:---|:---|
| **Bolt 1** | Ingestion Engine & Backend Service (`backend`) | `aidlc-developer-agent` | AI Go / Systems Specialist Model | Construction Session 1 |
| **Bolt 2** | Corporate Management Dashboard UI (`frontend`) | `aidlc-developer-agent` | AI React / Frontend Specialist Model | Construction Session 2 |

---

## 2. Multi-Session Model Specialization Strategy

To maximize code quality and idiomatic architecture in both tiers, the user has designated separate chat sessions for Construction, enabling distinct frontier models specialized by domain:

### Session 1: Backend Construction
* **Target Unit**: `backend` (`U1`, directory: `backend`)
* **Recommended Model Profile**: High-reasoning systems engineering model with deep proficiency in Go 1.22+, GORM ORM patterns, PostgreSQL transactional semantics, streaming I/O, and concurrent table-driven test suites with race detection.
* **Responsibilities**:
  * Scaffolds Go project structure adhering to `aidlc-shared/backend-architecture.md` (handler $\rightarrow$ service $\rightarrow$ repository layers).
  * Implements GORM models and PostgreSQL migrations.
  * Implements streaming CSV parser, in-memory diffing, and SHA-256 deduplication.
  * Implements Chi HTTP router endpoints adhering to the OpenAPI 3.0 specification.
  * Authors unit and integration tests achieving $\ge 80\%$ line coverage.

### Session 2: Frontend Construction
* **Target Unit**: `frontend` (`U2`, directory: `frontend`)
* **Recommended Model Profile**: Modern frontend engineering model with deep proficiency in React 18, TypeScript, Tailwind CSS, Recharts data visualization, accessible DOM primitives, and Vitest component testing.
* **Responsibilities**:
  * Scaffolds Vite React 18 TypeScript project adhering to `aidlc-shared/frontend-architecture.md`.
  * Implements `IBM Plex Sans Thai` typography with tabular number alignment (`tabular-nums`).
  * Implements the 4 mandatory UI states (loading skeleton, empty illustration, error with retry, populated data).
  * Implements Recharts multi-project time-series canvas with the 8+16 deterministic palette.
  * Implements drag-and-drop CSV upload portal connecting to the live backend container.

---

## 3. Communication & Handoff Protocols

1. **Frozen Contract Hand-Off**: Both sessions share the exact OpenAPI 3.0 specification in `contract-summary.md`. No cross-session verbal negotiations or schema changes are permitted without an explicit RFC decision.
2. **Containerized Mock/Live Environment**:
   * The backend session delivers a working Docker Compose setup (`docker compose up -d postgres backend`).
   * The frontend session boots against this verified container environment, eliminating integration guesswork.

