# Performance Requirements Specification: Unit `frontend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-quality-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Provenance

This performance specification defines the client-side latency ceilings, rendering benchmarks, Core Web Vitals targets, and data scaling constraints for the React 18 single-page application (`frontend`), tracing from:
- `requirements.md`: `NFR1.1` (dashboard initial load and table rendering in $< 50\text{ ms}$), `NFR1.4` (multi-project trend query $< 50\text{ ms}$), and `NFR5.1` (4 mandatory UI states with zero CLS).
- `functional-spec.md`: Workflows 1, 2, and 4 (initial load, 200ms debounced search, time-series preset scaling).
- `contract-summary.md`: OpenAPI 3.0 query latency budgets and pagination boundaries (`page_size` default 20, max 100).

---

## 2. Measurable Performance Targets & Quantitative SLOs

### 2.1 Latency & Rendering Ceilings
- **NFR1.1: Initial View & Table Rendering Latency**:
  - Target: The initial dashboard view and comparative project matrix table must render within $\le 50\text{ ms}$ following receipt of API response payload on internal 1Gbps network.
  - Cumulative Layout Shift: $\text{CLS} < 0.1$ across all loading-to-success transitions via dimensional `TableSkeleton` placeholders.
- **NFR1.4: Multi-Project Trend Rendering**:
  - Target: Recharts SVG canvas must render multi-project time-series curves (up to 730 daily data points per project across multiple projects) within $\le 50\text{ ms}$ of data arrival.
  - Interaction Overhead: Crosshair tooltip hover rendering latency must execute within $\le 16\text{ ms}$ ($60\text{ fps}$ frame rate).

### 2.2 Client-Side Caching & Invalidation
- **NFR1.5: Client Cache Retention & Background Revalidation**:
  - `/api/v1/projects`: `staleTime = 30\text{ s}`, `cacheTime = 5\text{ min}`.
  - `/api/v1/projects/summary`: `staleTime = 60\text{ s}`, `cacheTime = 10\text{ min}`.
  - `/api/v1/analytics/trends`: `staleTime = 120\text{ s}`, `cacheTime = 15\text{ min}`.
  - Ingestion Invalidation: Successful `POST /api/v1/ingest` immediately invalidates `/projects` and `/projects/summary` caches.

### 2.3 Network & Bundle Ceilings
- **NFR1.6: Production Bundle Size Ceilings**:
  - Total compressed initial JavaScript bundle $< 250\text{ KB}$ (gzipped).
  - Vendor chunk separation: React, Lucide Icons, and Recharts loaded in distinct modular chunks.
- **NFR1.7: Core Web Vitals Floor**:
  - Largest Contentful Paint (LCP): $< 1.2\text{ s}$.
  - Interaction to Next Paint (INP): $< 100\text{ ms}$.
  - First Input Delay (FID): $< 50\text{ ms}$.

