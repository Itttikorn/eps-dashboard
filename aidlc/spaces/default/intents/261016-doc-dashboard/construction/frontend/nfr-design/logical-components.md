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
- `functional-spec.md` & `frontend-components.md`: Complete component trees, 3-screen navigation tabs, and interactive workflow models.
- `contract-summary.md`: DTO structures, Universal Envelope (`status`, `result`, `total`, `search_params`), and REST endpoints.
- `mockups.md`: Screen 1 (QA/QC Overview), Screen 2 (Trend Analytics), and Screen 3 (CSV Ingestion).

---

## 2. Logical Component Topology & Responsibility Boundaries

The frontend application is structured into four cohesive architectural tiers:

### 2.1 Presentation & Shell Tier
- **`DashboardShell`**: Manages root responsive layout, corporate dark-navy header (`#152444`), 3-tab navigation bar, and active view router slot (`NFR5.2`).
- **`HeaderNav`**: Displays system branding, health heartbeat pill (`GET /health`), environment badge (`v1.0.0`), and upload action CTA button.
- **`NavigationTabs`**: Manages active view switching across:
  - `(1) QA/QC Comparative Overview`
  - `(2) Trend Analytics`
  - `(3) CSV Ingestion`
- **`GlobalFilterBar`**: Multi-project dropdown, snapshot date picker, and quick preset buttons (`Today`, `Yesterday`, `Latest Snapshot`).
- **`ToastContainer`**: Renders non-blocking notifications for upload confirmations, copy feedback, and sanitized error notices (`NFR6.2`).

### 2.2 Feature & Domain Tier

#### Screen 1: QA/QC Comparative Overview
- **`TopbarKpiCards`**: Renders executive overview KPI metrics (`NFR1.1`, `NFR5.1`) with animated pulse indicators (`.chip-blink`) for alert states ($\ge 45\%$).
- **`CategoryDetailGrid`**: Expanding drawer panel displaying project-level volume contributions for a selected QA/QC pillar.
- **`SearchToolbar`**: 200ms debounced search filtering by Project ID or Site Name with column sort triggers.
- **`ProjectMatrixTable`**: Comparative project list and card container rendering project health status (`ON TRACK`, `ATTENTION`, `CRITICAL`).
- **`ProjectCard`**: Individual project card with summary metrics and 5 QA/QC pillar progress bars.
- **`DisciplineAccordion`**: Collapsible section detailing engineering discipline stats (`ME`, `CE`, `EE`), drawing availability chips (`FS`, `GA`, etc.), and open item aging.

#### Screen 2: Trend Analytics
- **`HistoricalTrendChart`**: Recharts time-series canvas supporting dynamic multi-project curve overlays and 60 fps crosshair tooltips (`NFR1.4`).
- **`PresetToolbar`**: Preset buttons (`30D`, `90D`, `180D`, `1Y`, `ALL`) and custom date range inputs.
- **`MetricSelector`**: Radio controls for metric switching (`Total Volume`, `Approved`, `In-Review`, `Overdue`).
- **`ProjectSelectorDropdown`**: Multi-select project list with deterministic 8+16 color mapping badges.
- **`TrendTooltip`**: Unified hover tooltip showing metrics for all selected projects on hovered date.

#### Screen 3: CSV Ingestion
- **`CsvUploadZone`**: Drag-and-drop zone with pre-flight file validation (max 50MB, `.csv`), encoding check (UTF-8/ASCII), and upload progress bar (`NFR6.5`).
- **`IngestionHistoryTable`**: Historical batch ledger displaying batch ID, target project, snapshot date, row counts, deltas, and status (`SUCCESS`, `CONFLICT`, `ERROR`).
- **`IngestionErrorModal`**: Dialog presenting line-by-line corrupted data diagnostics and chronology downgrade warnings.

### 2.3 State Management & Integration Tier
- **`QueryProvider`**: TanStack Query v5 client managing query caches, retry strategies, and automatic revalidations (`NFR1.5`).
- **`UrlStateManager`**: Synchronizes search query strings (`?search=...`), active tab (`?tab=...`), and date presets with browser URL history without causing unneeded re-renders.
- **`ApiClient`**: Fetch/Axios client wrapper applying the base URL, unwrapping `ApiResponse<T>` envelopes, and sanitizing error payloads (`NFR3.1`, `NFR6.4`).
- **`normalizers`**: Pure data transformation functions that safely normalize API responses into UI view models, ensuring zero runtime exceptions from contract variations.

---

## 3. Failure Domains & Error Boundary Architecture (NFR5.1)

To prevent component failures from crashing the entire user interface:
- **`RootErrorBoundary`**: Top-level React error boundary displaying a full-screen fallback page with application restart button if catastrophic initialization fails.
- **`ChartErrorBoundary`**: Isolated error boundary wrapping `HistoricalTrendChart`. If Recharts fails to render malformed time-series data, it gracefully degrades to a concise error state while leaving the matrix table and KPI cards fully interactive.
- **`TableErrorBoundary`**: Isolated boundary wrapping `ProjectMatrixTable`, providing a retry button for the table without disrupting executive KPI summaries.
- **`UploadErrorBoundary`**: Isolated boundary around `CsvUploadZone` preventing upload network crashes from interrupting the rest of the application.

---

## 4. Master Component Register & NFR Mapping

| Component Name | File Path | Primary Responsibilities | Covered NFRs |
|:---|:---|:---|:---|
| `DashboardShell` | `src/components/layout/DashboardShell.tsx` | Layout container, theme injection, tab view router slot | `NFR5.2`, `NFR6.1` |
| `HeaderNav` | `src/components/layout/HeaderNav.tsx` | Branding, dark-navy styling (#152444), health heartbeat, upload trigger | `NFR5.2`, `NFR6.1` |
| `NavigationTabs` | `src/components/layout/NavigationTabs.tsx` | 3-tab primary navigation switcher | `NFR5.1` |
| `GlobalFilterBar` | `src/components/layout/GlobalFilterBar.tsx` | Multi-project selector, date picker, quick presets | `NFR1.1`, `NFR5.1` |
| `TopbarKpiCards` | `src/components/dashboard/TopbarKpiCards.tsx` | Macro totals, 5 QA/QC category summary cards, pulse alerts | `NFR1.1`, `NFR5.1` |
| `CategoryDetailGrid` | `src/components/dashboard/CategoryDetailGrid.tsx` | Expanding detail drawer for category volume breakdown | `NFR1.1` |
| `ProjectMatrixTable` | `src/components/dashboard/ProjectMatrixTable.tsx` | Project card container, sorting, sub-50ms render | `NFR1.1`, `NFR5.1` |
| `ProjectCard` | `src/components/dashboard/ProjectCard.tsx` | Status badge, 5 pillar progress bars, delinquency alerts | `NFR1.1`, `NFR5.1` |
| `DisciplineAccordion` | `src/components/dashboard/DisciplineAccordion.tsx` | ME/CE/EE breakdown, drawing availability chips | `NFR1.1` |
| `SearchToolbar` | `src/components/dashboard/SearchToolbar.tsx` | 200ms debounced search, URL sync | `NFR1.1`, `NFR4.3` |
| `HistoricalTrendChart` | `src/components/trends/HistoricalTrendChart.tsx` | Recharts multi-project curves, 60fps tooltips | `NFR1.4`, `NFR5.1` |
| `PresetToolbar` | `src/components/trends/PresetToolbar.tsx` | Preset buttons (30D, 90D, 180D, 1Y, ALL) + custom range | `NFR1.4` |
| `CsvUploadZone` | `src/components/ingest/CsvUploadZone.tsx` | Drag-and-drop CSV upload, progress bar, validation | `NFR6.5` |
| `IngestionHistoryTable` | `src/components/ingest/IngestionHistoryTable.tsx` | Recent batch ingestion ledger table | `NFR1.1`, `NFR5.1` |
| `SkeletonShimmer` | `src/components/ui/SkeletonShimmer.tsx` | Zero-CLS loading state shimmer placeholders | `NFR1.1`, `NFR5.1` |
| `EmptyState` | `src/components/ui/EmptyState.tsx` | Empty data illustration with recovery CTA | `NFR5.1` |
| `ErrorAlert` | `src/components/ui/ErrorAlert.tsx` | Accessible error state with Retry callback | `NFR5.1`, `NFR6.2` |
