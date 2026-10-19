# Logical Component Architecture — Unit: `frontend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Component Overview

This specification establishes the logical component boundaries, state flow topology, error boundary isolation, and NFR enforcement points for the React 18 single-page application (`frontend`), tracing from:
- `nfr-requirements/`: Core NFR specifications (`performance-requirements.md`, `security-requirements.md`, `tech-stack-decisions.md`).
- `reliability-requirements.md` & `scalability-requirements.md`: Component fault isolation and client memory limits.
- `functional-spec.md`: Component trees and interactive workflow models.
- `contract-summary.md`: DTO structures and API endpoints.

---

## 2. Logical Component Topology & Responsibility Boundaries

The frontend application is structured into four cohesive architectural tiers:

### 2.1 Presentation & Shell Tier
- **`AppShell`**: Manages root responsive layout, header bar, theme toggle (`NFR5.2`), and global navigation.
- **`TopNavBar`**: Displays system branding, global upload trigger button (`UploadModalTrigger`), and environment status badges.
- **`ToastContainer`**: Renders non-blocking notifications for upload confirmations and masked error notices (`NFR6.2`).

### 2.2 Feature & Domain Tier
- **`KpiSummaryGrid`**: Renders executive overview KPI metrics (`NFR1.1`, `NFR5.1`) with animated pulse indicators (`.chip-blink`) for alert states ($\ge 45\%$).
- **`ProjectMatrixTable`**: Comparative project grid featuring 200ms debounced search, multi-column sorting, and `React.memo` row optimizations (`NFR1.1`).
- **`AnalyticsTrendChart`**: Recharts time-series canvas supporting dynamic multi-project curve overlays and 60 fps crosshair tooltips (`NFR1.4`).
- **`UploadModal`**: Dialog containing pre-flight file bounding, drag-and-drop file target, upload progress bar, and instant cache invalidation trigger (`NFR1.5`, `NFR6.5`).

### 2.3 State Management & Integration Tier
- **`QueryProvider`**: TanStack Query v5 client managing query caches, retry strategies, and automatic revalidations (`NFR1.5`).
- **`UrlStateManager`**: Nuqs adapter synchronizing search query strings (`?q=...`) and active project tabs with browser URL history without causing component re-mounts.
- **`ApiClient`**: Fetch/Axios client wrapper applying the CSP-compliant base URL, unwrapping `ApiResponse<T>` envelopes, and sanitizing error payloads (`NFR3.1`, `NFR6.4`).

---

## 3. Failure Domains & Error Boundary Architecture (NFR5.1)

To prevent component failures from crashing the entire user interface:
- **`RootErrorBoundary`**: Top-level React error boundary displaying a full-screen fallback page with application restart button if catastrophic initialization fails.
- **`ChartErrorBoundary`**: Isolated error boundary wrapping `AnalyticsTrendChart`. If Recharts fails to render malformed time-series data, it gracefully degrades to a concise error state while leaving the matrix table and KPI cards fully interactive.
- **`TableErrorBoundary`**: Isolated boundary wrapping `ProjectMatrixTable`, providing a retry button for the table without disrupting executive KPI summaries.

---

## 4. Master Component Register & NFR Mapping

| Component Name | File Path | Primary Responsibilities | Covered NFRs |
|:---|:---|:---|:---|
| `AppShell` | `src/components/layout/AppShell.tsx` | Layout container, theme injection, shell grid | `NFR5.2`, `NFR6.1` |
| `TopNavBar` | `src/components/layout/TopNavBar.tsx` | Branding, theme toggle, upload button trigger | `NFR5.2`, `NFR6.1` |
| `KpiSummaryGrid` | `src/components/dashboard/KpiSummaryGrid.tsx` | Global KPI metrics, 4 UI states, pulse alerts | `NFR1.1`, `NFR5.1` |
| `ProjectMatrixTable` | `src/components/dashboard/ProjectMatrixTable.tsx` | Sub-50ms table rendering, memoized rows, debounced search | `NFR1.1`, `NFR5.1` |
| `AnalyticsTrendChart` | `src/components/dashboard/AnalyticsTrendChart.tsx` | Recharts multi-project curves, 60fps tooltips | `NFR1.4`, `NFR5.1` |
| `UploadModal` | `src/components/upload/UploadModal.tsx` | Pre-flight file bounding ($\le 10\text{ MB}$, `.csv`), upload mutation | `NFR1.5`, `NFR6.5` |
| `ApiClient` | `src/services/api-client.ts` | Universal envelope unwrapping, error masking, CSP client | `NFR3.1`, `NFR6.2`, `NFR6.4` |
| `QueryProvider` | `src/providers/QueryProvider.tsx` | TanStack Query client, cache invalidation, retry policies | `NFR1.5`, `NFR3.2` |
| `ThemeContext` | `src/context/ThemeContext.tsx` | Dual-theme CSS custom property management | `NFR5.2` |

