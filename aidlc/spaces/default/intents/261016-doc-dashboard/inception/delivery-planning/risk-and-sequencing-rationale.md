# Risk & Delivery Sequencing Rationale

**Stage**: `delivery-planning` (2.9)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-delivery-agent`  
**Date**: 2026-10-16  

---

## 1. Economic Sequencing Framework & Heuristics

To establish the optimal path through the Unit Dependency DAG, delivery planning employs a hybrid of **Weighted Shortest Job First (WSJF)** (Reinertsen / SAFe) and **Cockburn's Walking Skeleton Strategy**:

$$\text{WSJF} = \frac{\text{Cost of Delay (User-Business Value + Time Criticality + Risk Reduction / Opportunity Enablement)}}{\text{Job Size}}$$

### Metric Definitions
* **User-Business Value**: Direct executive visibility into project document health and delinquency bottlenecks.
* **Time Criticality**: Rapid transition from manual error-prone spreadsheet reviews to automated daily snapshot ingestion.
* **Risk Reduction & Opportunity Enablement (RR/OE)**: Validating 23-column CSV streaming throughput, SHA-256 deduplication, and atomic daily metrics rollups on live PostgreSQL.
* **Job Size**: Relative estimation (S=1, M=2, L=3, XL=5).

---

## 2. Comparative Bolt Scoring Table

| Bolt ID | Bolt Name | Bundled Unit | Business Value | Time Criticality | RR / OE | Cost of Delay (CoD) | Job Size | WSJF Score | Resolved Sequence |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Bolt 1** | Ingestion Engine & Backend Service | `backend` (`U1`) | 9 | 8 | 10 | 27 | 3 (L) | **9.0** | **Sequence 1 (First)** |
| **Bolt 2** | Corporate Management Dashboard UI | `frontend` (`U2`) | 10 | 7 | 4 | 21 | 2 (M) | **10.5\*** | **Sequence 2 (Second)** |

*\*Note on WSJF Sequencing*: While Bolt 2 carries high business value, it possesses a strict topological and integration dependency on Bolt 1. Cockburn's Walking Skeleton heuristic strictly dictates that the foundational infrastructure and data-bearing service must run first to validate the architecture end-to-end.

---

## 3. Detailed Sequencing Rationale

### Why Bolt 1 (`backend`) Must Deliver First (Walking Skeleton & Risk Reduction)
1. **Core Architectural Risk Elimination**:
   - The greatest technical uncertainty lies in parsing 2,000+ row CSV snapshots with encoding variations, executing in-memory diffing within $< 20\text{ ms}$, enforcing SHA-256 idempotency, and committing atomic database updates across 4 tables.
   - Proving this core data pipeline in Bolt 1 eliminates 90% of architectural risk before any visual UI components are authored.
2. **Deterministic Contract Realization**:
   - Delivering `backend` first creates a live, testable API container that serves the exact OpenAPI 3.0 specification.
   - When Session 2 begins for `frontend`, the frontend developer model integrates against real endpoints with realistic database state, eliminating mock divergence.
3. **Database Schema Stability**:
   - Establishing the GORM models and PostgreSQL relational schema first locks down column names, foreign keys, and analytical indexes, preventing downstream UI churn.

### Why Bolt 2 (`frontend`) Follows Bolt 1
1. **Zero Mock Rework**:
   - By constructing the frontend against a running backend API, the frontend developer model avoids creating throwaway mock layers or synthetic state machines that would require subsequent rewiring.
2. **Direct Visual Verification**:
   - Live CSV uploads can be tested end-to-end directly through the React upload modal, observing real-time table re-renders and chart updates immediately.

