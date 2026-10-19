# Performance Design Specification — Unit: `frontend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-aws-platform-agent`, `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Architectural Context

This performance design specification details the client-side rendering strategies, caching architectures, bundle optimizations, and latency guardrails for the React 18 single-page application (`frontend`), tracing from:
- `performance-requirements.md`: Quantitative SLOs (`NFR1.1`, `NFR1.4`, `NFR1.5`, `NFR1.6`, `NFR1.7`).
- `security-requirements.md` & `tech-stack-decisions.md`: Tier-1 React 18, Vite, TanStack Query v5, Recharts, and Tailwind CSS v4 stack.
- `scalability-requirements.md`: Handled for frontend via client-side memory capping and pagination boundaries.
- `observability-requirements.md`: Core Web Vitals instrumentation and frontend console telemetry.
- `functional-spec.md`: Workflows 1–4 (matrix table browsing, 200ms debounced search, time-series chart overlays).
- `contract-summary.md`: Backend REST endpoints (`/api/v1/projects`, `/api/v1/projects/summary`, `/api/v1/analytics/trends`).

---

## 2. Table Rendering & DOM Optimization Strategy

### 2.1 DOM Reconciliation & Sub-50ms Latency (NFR1.1)
The comparative matrix table renders between 20 and 100 project records with multiple numeric and status columns. To guarantee the rendering ceiling ($\le 50\text{ ms}$) without introducing unnecessary virtualization complexity:
- **`React.memo` Row Isolation**: Table rows (`ProjectTableRow`) are wrapped in `React.memo` with custom equality comparators evaluating project `id`, `updated_at`, and KPI alert thresholds (`alert_active`).
- **`useMemo` Transformations**: Filtering (debounced search), multi-column sorting (status, variance, document count), and summary metric derivations are memoized on data change.
- **CSS Paint Containment**: Each table row and card utilizes CSS `contain: layout paint;` to prevent browser reflow propagation outside the active table container.

```typescript
export const ProjectTableRow = React.memo(function ProjectTableRow({
  project, onSelect
}: { project: ProjectSummary; onSelect: (id: string) => void }) {
  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-3 font-medium">{project.name}</td>
      <td className="p-3 font-mono tabular-nums">{project.total_docs}</td>
      <td className="p-3 font-mono tabular-nums">{project.variance_pct.toFixed(1)}%</td>
    </tr>
  );
});
```

### 2.2 Layout Stability & Cumulative Layout Shift (CLS < 0.1) (NFR5.1)
To prevent visual layout shifts during data loading and pagination swaps:
- Dimensional `Skeleton` components (`TableSkeleton`, `SummaryCardSkeleton`, `ChartSkeleton`) mirror the exact geometric height and grid dimensions of the fulfilled DOM elements.
- The topbar KPI metrics grid maintains fixed aspect ratio containers with CSS `min-height: 120px` to ensure $\text{CLS} < 0.05$ during initial hydration.

---

## 3. Multi-Project Trend Visualization Optimization (NFR1.4)

### 3.1 Recharts Canvas Sizing & Slicing
The time-series chart component displays multi-project curves across configurable historical intervals (30d, 90d, 1y, all-time):
- Data slicing occurs client-side via `useMemo` so that Recharts renders at most 730 points per active project curve.
- Bezier curves utilize `type="monotone"` with `isAnimationActive={false}` during multi-project comparison toggles to eliminate rendering lag and meet the $\le 50\text{ ms}$ threshold.
- Recharts tooltips use `throttle` (16ms) to guarantee steady 60 fps interactions during mouse scrubbing across timeline curves.

---

## 4. Client Caching & Invalidation Architecture (NFR1.5)

### 4.1 TanStack Query v5 Tiered Cache Policy
Client-side data fetching leverages TanStack Query v5 with query key hierarchies and domain-tailored freshness policies:
- `/api/v1/projects`: `staleTime = 30_000` (30s), `gcTime = 300_000` (5m).
- `/api/v1/projects/summary`: `staleTime = 60_000` (60s), `gcTime = 600_000` (10m).
- `/api/v1/analytics/trends`: `staleTime = 120_000` (120s), `gcTime = 900_000` (15m).

### 4.2 Mutation Invalidation Protocol
Upon successful completion of the CSV ingestion mutation (`POST /api/v1/ingest`), TanStack Query synchronously invalidates the dependent query caches:

```typescript
const uploadMutation = useMutation({
  mutationFn: uploadCsvFile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }
});
```

---

## 5. Production Bundle Architecture & Core Web Vitals (NFR1.6, NFR1.7)

### 5.1 Code Splitting & Vendor Chunk Distribution
Vite Rollup bundling is configured with explicit `manualChunks` to keep the initial compressed entry point $< 250\text{ KB}$ gzipped:
- `vendor-react`: `react`, `react-dom` (~45 KB gzip).
- `vendor-charts`: `recharts` (~85 KB gzip, loaded dynamically).
- `vendor-query`: `@tanstack/react-query`, `nuqs` (~25 KB gzip).
- `vendor-ui`: `lucide-react`, `@radix-ui/*` (~20 KB gzip).

### 5.2 Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: $< 1.2\text{ s}$ achieved through early HTML skeleton delivery and deferred non-critical chart chunk loading.
- **Interaction to Next Paint (INP)**: $< 100\text{ ms}$ via debounced search inputs (200ms) and lightweight non-blocking event handlers.
- **First Input Delay (FID)**: $< 50\text{ ms}$ maintained by keeping main-thread scripting tasks below 50ms execution slices.

