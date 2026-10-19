# Code Generation Plan: Unit `frontend`

**Stage**: `code-generation` (3.5)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19

---

## Summary

- Builds: React 18 + TypeScript + Vite 3-tab dashboard SPA: (1) QA/QC Comparative Overview (macro Topbar KPI cards with 5 QA/QC lifecycle pillars, `.kpi-detail` expander, ProjectCard matrix with `.chip-blink` delinquency alert and DisciplineAccordion); (2) Trend Analytics (30D/90D/180D/1Y/All Time presets, multi-project selector, Recharts canvas, deterministic 8+16 colorway); (3) CSV Ingestion Screen (`CsvUploadZone` drag-and-drop portal + `IngestionHistoryTable` batch ledger + HeaderNav upload modal) with typed API client, dual theme, and Nginx container
- Touches: frontend/ (package.json, vite/vitest/eslint config, src/{api,lib,components,features}, Dockerfile, nginx.conf), plus a `frontend` service in docker-compose.yml
- Tests: ~75 Vitest + React Testing Library tests (5-8 per component/module) with an 80% line-coverage floor on API normalizers, derived-metric logic, and hooks

---

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "team",
  "ordering": "Implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "mvp",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "We treat automated testing as a first-class deliverable in every deliverable unit:\n\n- **Methodology**: test-after\n- **Ordering**: Implement each applicable testable layer, then write and run that layer's tests.\n- **Backend Testing**: Table-driven unit tests, in-memory fakes for domain repository interfaces, and mandatory race detector verification (`go test ./... -race -count=1`).\n- **Frontend Testing**: Vitest + React Testing Library for component rendering, user interactions, and custom hooks.\n- **Coverage Floor**: 80% line-coverage floor on core business logic (CSV parser, overdue calculation engine, discipline and category aggregators).\n- **CI Quality Gate**: Automated PR gate runs unit tests, race detector, linting (`gofmt`, `golangci-lint`), and coverage verification prior to `--no-ff` merge into `staging`."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Meet an 80% line-coverage floor.",
      "Run the selected tests in CI before merge."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:ffc01259e29f44cd2c7aeb0317e55128cd6c12959e754debba17f17e9cf50fb3",
  "contract_sha256": "sha256:30610fa8d636bcb59c68fd8d06620d800a8cacc62658e704a27757ba111cb7c5"
}
```

**Layer applicability for `frontend`**: Data model / database behavior and API / endpoint (server side) are owned by the `backend` unit and are **not applicable** here. The frontend maps the remaining layers as: *Repository / data access* = typed API client, envelope unwrapping, normalizers, TanStack Query hooks; *Business logic* = pure derived-metric, palette, validation, and filtering modules; *Frontend behavior* = components, screen states, and interactions.

---

## Contract Alignment (backend realigned)

The `backend` unit was realigned to the frozen `contract-summary.md` and now serves the contract shapes (a superset that keeps some legacy fields). The frontend is built against the contract (`contract-summary.md` §4: consumers practice tolerant parsing).

| Endpoint | What the backend now serves | Frontend handling |
|:---|:---|:---|
| `GET /projects/summary` | `total_projects`, `total_documents`, `total_overdue`, `category_counts{baseline_drawings,control,corrective,change,complete}`, `last_updated_at` (plus legacy `overdue_documents`, `approved_documents`, `under_review_documents`, `global_approval_rate`) | Reads contract fields; ignores legacy fields |
| `GET /projects` | `project_id`, `site_code`, `project_name`, `baseline_drawings`, per-category `CategoryMetrics{total,open,closed,pending_pct,is_critical,avg_age_days}`, `overdue_count`, `net_change` (`IMPROVING`/`DEGRADING`/`STABLE`), `last_snapshot_date`; accepts `search`, `sort_by`, `sort_dir`, `page`, `page_size` | Reads contract fields; legacy `project_code` accepted as a fallback for `project_id` |
| `GET /analytics/trends` | Accepts `project_ids`, `preset`, `start_date`/`end_date` (and legacy `project_code`, `from`, `to`); `result[]` = `{date, project_metrics{<id>:{total_documents,overdue_count,…}}}` | Sends the contract parameters; reads `project_metrics` |
| `POST /ingest` (also `/ingest/csv`) | `result{batch_id,file_sha256,status(INGESTED\|ALREADY_INGESTED),snapshot_date,total_rows,deltas_updated,skipped_unchanged,created_at}` (plus legacy `project_code`, `processed_count`, `errors[]`); `409` for chronology downgrade | Success summary uses whichever counts exist; `409` → Conflict state; `400` → Error state showing only `status.description` |
| `GET /health` | `result{service:"UP",database,timestamp}` (plus legacy `status:"healthy"`) | Healthy when `result.service==="UP"` |

The normalization seam (`src/api/normalizers.ts`) stays as a thin tolerance layer: unknown fields are ignored and a missing optional field becomes `null` ("—" in the UI), never a fabricated zero. No `backend/` files are modified by this stage.

---

## 1. Implementation Steps & Traceability

Following `test-after`, each layer is implemented first and its tests are written and run immediately after.

### Step 1: Project Structure & Production Configuration Skeleton
- [ ] Create `frontend/package.json` (scripts exactly as `cicd-pipeline.md` §4.1: `dev`, `build`, `preview`, `lint`, `type-check`, `test`, `test:watch`, `test:coverage`), with pinned dependencies: `react@^18.3.1`, `react-dom`, `@tanstack/react-query@^5.50`, `recharts@^2.12`, `lucide-react`, `antd@^6` (imported per component for tree-shaking; Radix is not used), `nuqs` and dev dependencies `typescript@^5.5`, `vite@^5.4`, `@vitejs/plugin-react`, `tailwindcss@^4` + `@tailwindcss/vite`, `vitest@^2`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks`.
- [ ] Create `frontend/tsconfig.json` / `tsconfig.node.json` (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`), `frontend/vite.config.ts` (dev proxy `/api` → `http://localhost:8080`, `manualChunks`: `vendor-react`, `vendor-charts`, `vendor-query`, `vendor-ui`), `frontend/eslint.config.js` (bans `dangerouslySetInnerHTML` via `no-restricted-syntax`), `frontend/index.html`, `frontend/.env.example`.
- [ ] Create `frontend/src/index.css` with Tailwind v4 `@theme` tokens (`--bg`, `--paper`, `--ink`, `--ink-dim`, `--line`, `--headerbg`, the 5 pillar colors, `--trend-1`…`--trend-16`), light/dark variants, IBM Plex Sans Thai stack, `.chip-blink`, and `tabular-nums` utilities.
- [ ] Create `frontend/src/theme/antdTheme.ts`: Ant Design `ConfigProvider` theme (design tokens mapped from the same palette: `colorPrimary`, `colorBgBase`, `colorTextBase`, `colorBorder`, IBM Plex Sans Thai `fontFamily`, 4/8pt spacing) with `theme.defaultAlgorithm` / `theme.darkAlgorithm` switched by the theme toggle; Ant Design styles are ordered below Tailwind utilities with CSS `@layer` so utility classes override component defaults, and `App` is wrapped in `ConfigProvider` + antd `App` (for `message`/`notification`).
- [Traceability: `NFR1.6`, `NFR5.2`, `NFR6.3`, `NFR3.2`]

### Step 2: Bootstrap Minimal Test Runner & Unit-Scoped Command
- [ ] Create `frontend/vitest.config.ts` (jsdom environment, `src/test/setup.ts` with jest-dom matchers, `ResizeObserver`/`matchMedia`/`getComputedStyle` stubs for Recharts/Ant Design, V8 coverage with an **80% line threshold** on `src/api`, `src/lib`, and `src/features/**/use*.ts`; thresholds are never lowered).
- [ ] Run `npm install` in `frontend/` and a smoke test to prove the runner executes.
- [ ] Record the exact unit-scoped command: `npm --prefix frontend run test:coverage` (documented in `unit-test-instructions.md`).
- [Traceability: Testing Contract obligation, `NFR3.2`]

### Step 3: Data Model / Database Behavior
- Not applicable to `frontend` (no persistence; owned by `backend`). The client-side data model is covered by Step 5's typed DTOs.

### Step 4: Repository / Data Access — Implement
- [ ] `frontend/src/api/types.ts`: contract DTOs (`StatusInfo`, `GlobalSummary`, `ProjectMatrixRow`, `CategoryMetrics`, `DateMetricPoint`, `IngestionResult`) as **optional-tolerant** types plus the UI view models from `frontend-components.md` (`GlobalSummaryData`, `ProjectMatrixRow` view model, `DailyTrendDataPoint`).
- [ ] `frontend/src/api/client.ts`: fetch wrapper that unwraps the universal envelope, inspects `status.code` (never plain text), classifies errors (`network`, `client`, `conflict`, `server`), and surfaces only `status.description` (never raw bodies/stack traces); base URL `/api/v1`; `AbortSignal` support; multipart upload.
- [ ] `frontend/src/api/normalizers.ts`: pure functions mapping contract **and** as-implemented backend payloads (see Drift Register) to view models; unknown fields ignored.
- [ ] `frontend/src/api/queryClient.ts` + `frontend/src/api/queries.ts`: `useHealthCheck` (30s poll, stale 15s), `useGlobalSummary` (stale 60s, gc 10m), `useProjectMatrix(search)` (stale 30s, gc 5m, `placeholderData: keepPreviousData`), `useHistoricalTrends(projects, preset)` (stale 120s, gc 15m), `useUploadSnapshot` (invalidates `['projects']`, `['summary']`, `['analytics']`).
- [Traceability: `AC1.1.1`, `AC1.1.2`, `AC1.1.3`, `AC2.1.2`, `BR7.2`, `BR11.1`, `BR11.3`, `NFR1.5`, `NFR3.1`, `NFR6.2`]

### Step 5: Repository / Data Access — Tests
- [ ] `client.test.ts`: success unwrap, `status.code !== 1000` error mapping, HTTP 400/409/500 classification, network failure, sanitization (no leaked raw body), multipart payload.
- [ ] `normalizers.test.ts`: contract-shaped payloads, as-implemented backend payloads, missing optional fields → `null` (not 0), unknown fields ignored.
- [ ] `queries.test.tsx`: cache-key hierarchy, invalidation after upload mutation, polling interval for health.
- [Traceability: `test-after` for Step 4; `NFR3.1`, `NFR6.2`]

### Step 6: Business Logic — Implement
- [ ] `frontend/src/lib/delinquency.ts`: `pendingRatio = open/(open+closed)*100`, `isCritical = ratio >= 45`, overdue health bands (`<5%` good, `5–15%` warning, `>15%` critical), `trendDirection` (`shrinking`/`expanding`/`stable`) mapped from `net_change` (`IMPROVING`→▼ green, `DEGRADING`→▲ red, `STABLE`→—).
- [ ] `frontend/src/lib/palette.ts`: stable 24-slot color assignment (`--trend-1`…`--trend-16` plus HSL-rotated extension), keyed by project id so unchecking a sibling never re-indexes colors; dashed stroke for slots 9+.
- [ ] `frontend/src/lib/validation.ts`: CSV pre-flight (`.csv` case-insensitive, MIME in `text/csv`/`application/vnd.ms-excel`/`text/plain`, ≤ 52,428,800 bytes (50 MB, single `MAX_UPLOAD_BYTES` constant per the realigned `functional-spec.md` / `logical-components.md`; see Open Items)).
- [ ] `frontend/src/lib/trend.ts`: preset → date window (`all_time`/`1_year`/`6_months`/`3_months`), per-project point cap (730) downsampling, merge of per-project series by date.
- [ ] `frontend/src/lib/format.ts` and `frontend/src/lib/useDebouncedValue.ts` (200 ms).
- [Traceability: `AC2.3.1`, `AC2.3.2`, `AC2.3.3`, `AC4.1.2`, `AC4.2.1`, `AC4.2.3`, `BR9.1`, `BR9.2`, `BR9.3`, `BR10.2`, `BR10.3`, `BR10.5`, `BR11.2`, `NFR1.4`, `NFR6.5`]

### Step 7: Business Logic — Tests
- [ ] `delinquency.test.ts` (threshold boundary at 44.9/45.0, zero denominators, band edges, trend mapping), `palette.test.ts` (determinism, stability after removal, dashed slots), `validation.test.ts` (extension, MIME, size boundary 52,428,800 / 52,428,801), `trend.test.ts` (preset windows, 730-point cap, merge), `useDebouncedValue.test.ts` (200 ms with fake timers).
- [Traceability: `test-after` for Step 6; 80% line-coverage floor]

### Step 8: API / Endpoint
- Not applicable (server endpoints are owned by `backend`). Client consumption of the five routes is covered by Steps 4–5.

### Step 9: Frontend Behavior — Primitives & Shell — Implement
- [ ] `src/components/ui/`: `Skeletons.tsx` (`CardSkeleton`, `TableSkeleton`, `ChartSkeleton` with fixed dimensions for CLS < 0.1; KPI container `min-height: 120px`), `EmptyState.tsx`, `ErrorAlert.tsx` (Retry button), `Badges.tsx` (`CategoryBadge`, `DelinquencyChip` with `.chip-blink`, `OverdueBadge`, `TrendTag`), `ThemeToggle.tsx` (persists `light`/`dark`, respects `prefers-color-scheme`, switches the Ant Design algorithm and the Tailwind dark class together).
- [ ] `src/components/layout/`: `DashboardShell.tsx` (corporate shell with header + 3 global navigation tabs `#view-overview`, `#view-trends`, `#view-ingest` per mockups.md §1 & functional-spec.md §2; tab state synchronized via Nuqs / URL hash; `GlobalFilterBar.tsx` for multi-project selector & snapshot date picker), `HeaderNav.tsx` (corporate dark-navy `#152444`, brand logo, health heartbeat from `useHealthCheck`, "[Upload CSV]" quick trigger).
- [ ] `src/main.tsx`, `src/App.tsx` (QueryClientProvider, Nuqs adapter, lazy-loaded tab views via `React.lazy`).
- [Traceability: `AC2.2.3`, `BR8.3`, `BR9.1`, `BR9.2`, `BR9.3`, `NFR1.1`, `NFR1.7`, `NFR5.1`, `NFR5.2`]

### Step 10: Frontend Behavior — Primitives & Shell — Tests
- [ ] `Skeletons.test.tsx`, `EmptyState.test.tsx`, `ErrorAlert.test.tsx` (retry callback), `Badges.test.tsx` (chip-blink applied only at ≥ 45%, trend colors never inverted), `ThemeToggle.test.tsx` (class toggle + persistence), `HeaderNav.test.tsx` (healthy / unhealthy heartbeat, upload trigger), `DashboardShell.test.tsx` (tab switch).
- [Traceability: `test-after` for Step 9]

### Step 11: Frontend Behavior — Screen 1: QA/QC Overview Features — Implement
- [ ] `src/features/overview/TopbarKpiCards.tsx` + `CategoryDetailGrid.tsx`: total portfolio documents, overall backlog, overdue volume & %, 5 QA/QC category pills (Baseline Drawings `#2f6fce`, Control `#12a4a0`, Corrective `#ee8a1f`, Change `#26a65b`, Complete `#8b5cf6`), accordion `.kpi-detail` toggle (`transition-all duration-300`, expands project breakdown, close on second click/outside click), 4 states, "—" when category data unavailable (Drift Register).
- [ ] `src/features/overview/SearchToolbar.tsx` (`#searchInput`, 200 ms debounce, `?search=` via Nuqs, cleared param removed, sort controls).
- [ ] `src/features/overview/ProjectMatrixTable.tsx` / `ProjectCard.tsx` + memoized `ProjectTableRow.tsx` (`React.memo`, `useMemo` filtering, `contain: layout paint`; status badges: ON TRACK `<5%`, ATTENTION `5–15%`, CRITICAL `>15%`; 5 pillar progress bars; delinquency alert `.chip-blink` pulsing when pending ≥ 45%; week-over-week net change indicator: ▼ green / ▲ red / — neutral).
- [ ] `src/features/overview/DisciplineAccordion.tsx` (`.expand-btn` toggle; engineering disciplines ME, CE, EE total vs approved; drawing type chips `FS`, `ML`, `PR`, `GA`, `LD`, `FD`, `PID`, `SLD`; pending aging stats in days).
- [Traceability: `AC2.1.1`, `AC2.1.2`, `AC2.1.3`, `AC2.2.1`, `AC2.2.2`, `AC2.2.3`, `AC2.3.1`, `AC2.3.2`, `AC2.3.3`, `BR7.1`, `BR7.2`, `BR7.3`, `BR8.1`, `BR8.2`, `BR8.3`, `BR9.1`, `BR9.2`, `BR9.3`, `NFR1.1`, `NFR5.1`]

### Step 12: Frontend Behavior — Screen 1: QA/QC Overview Features — Tests
- [ ] `TopbarKpiCards.test.tsx` (loading / error+retry / empty / success, category toggle open/close, 5 pillar badges), `CategoryDetailGrid.test.tsx`, `SearchToolbar.test.tsx` (debounce, URL sync, clear), `ProjectMatrixTable.test.tsx` (4 states, columns, overdue badge, critical chip, zero-match empty state), `ProjectCard.test.tsx`, `ProjectTableRow.test.tsx` (memo equality), `DisciplineAccordion.test.tsx` (expand/collapse, discipline metrics, drawing chips).
- [Traceability: `test-after` for Step 11]

### Step 13: Frontend Behavior — Screen 2: Historical Trend Analytics — Implement
- [ ] `src/features/trend/HistoricalTrendChart.tsx` (Recharts `LineChart`, cubic bezier monotone, dot markers on milestone dates, shared canvas, chart chunk loaded lazily, 4 states, "select a project" empty prompt), `PresetToolbar.tsx` (`30 Days`, `90 Days`, `180 Days`, `1 Year`, `All Time`, `aria-pressed`, custom start/end date inputs), `MetricSelector.tsx` (Total Volume, Approved, In-Review, Overdue radio filters), `ProjectSelectorDropdown.tsx` (Ant Design `Popover` + `Checkbox.Group` + Select All / Clear All + color swatches from `palette.ts`), `UnifiedCustomTooltip.tsx` (crosshair cursor vertical line + aligned date + all selected projects side-by-side, `tabular-nums`).
- [Traceability: `AC4.1.1`, `AC4.1.2`, `AC4.2.1`, `AC4.2.2`, `AC4.2.3`, `BR10.1`, `BR10.2`, `BR10.3`, `BR10.4`, `BR10.5`, `NFR1.4`, `NFR5.1`]

### Step 14: Frontend Behavior — Screen 2: Historical Trend Analytics — Tests
- [ ] `HistoricalTrendChart.test.tsx` (4 states, one line per selected project, empty prompt), `PresetToolbar.test.tsx` (active preset state + callback), `MetricSelector.test.tsx` (metric radio switching), `ProjectSelectorDropdown.test.tsx` (check/uncheck keeps sibling colors), `UnifiedCustomTooltip.test.tsx` (all selected projects listed with matching colors and crosshair sync).
- [Traceability: `test-after` for Step 13]

### Step 15: Frontend Behavior — Screen 3: CSV Ingestion Screen & Upload Primitives — Implement
- [ ] `src/features/ingestion/CsvIngestionScreen.tsx`: Tab 3 operational monitor container uniting upload zone and batch ledger.
- [ ] `src/features/ingestion/CsvUploadZone.tsx`: drag-and-drop daily CSV snapshot export portal (Mockups Screen 3), 50MB max, UTF-8/ASCII auto-detection, visual dropzone hover feedback, client validation from `validation.ts`, upload progress indicator, invalidates caches via `useUploadSnapshot`.
- [ ] `src/features/ingestion/IngestionHistoryTable.tsx`: recent batch ingestion ledger (Batch ID, Project Target, Snapshot Date, Rows Total, Deltas New/Updated, Skipped Unchanged, Ingestion Status with elapsed ms).
- [ ] `src/features/ingestion/CsvUploadModal.tsx`: Ant Design `Modal` (built-in focus trap, Escape and mask handling) triggered from HeaderNav quick action button, embedding `CsvUploadZone` for quick upload access from any tab; auto-close after 2.5 s on success.
- [ ] `src/features/ingestion/IngestionErrorModal.tsx`: diagnostics modal for corrupted lines, column mismatches, and timestamp downgrade conflicts (`409`).
- [Traceability: `AC1.1.1`, `AC1.1.2`, `AC1.1.3`, `BR11.1`, `BR11.2`, `BR11.3`, `NFR6.2`, `NFR6.5`]

### Step 16: Frontend Behavior — Screen 3: CSV Ingestion Screen & Upload Primitives — Tests
- [ ] `CsvUploadZone.test.tsx`: drag-and-drop file rejection for non-`.csv` and > 50 MB without network calls, accepts valid file → Uploading state, submit → success feedback, cache invalidation after success.
- [ ] `IngestionHistoryTable.test.tsx`: 4 UI states (loading skeleton, empty history, error, populated table with batch rows and status pills).
- [ ] `CsvUploadModal.test.tsx`: dialog open/close, focus trap, Escape key handling, and auto-dismiss after success.
- [ ] `IngestionErrorModal.test.tsx`: rendering 409 conflict and corrupted row details.
- [Traceability: `test-after` for Step 15; `NFR6.5`]


### Step 17: Environment / Build Configuration
- [ ] `frontend/Dockerfile` (multi-stage `node:20-alpine` builder → `nginxinc/nginx-unprivileged:alpine` runner, non-root UID 101, `EXPOSE 8080`), `frontend/nginx.conf` (gzip, `client_max_body_size 50M`, CSP/`X-Content-Type-Options`/`X-Frame-Options`, immutable `/assets/` cache, `/api/` proxy, SPA fallback), `frontend/.dockerignore`.
- [ ] Add a `frontend` service to the repository `docker-compose.yml` on the existing `eps-net` network, host port `3000 → 8080`, `depends_on: backend`, healthcheck. **Deviation from `infrastructure-specification.md`**: the spec names `wa-backend` / `cbm-network`; the implemented compose file uses service `backend` and network `eps-net`, so the proxy target (`http://backend:8080`) and network follow the existing file. CSP `connect-src` uses `'self'` because the browser reaches the API through the same-origin `/api/` proxy.
- [ ] Run `npm run lint`, `npm run type-check`, `npm run test:coverage`, `npm run build` and verify the initial gzipped bundle < 250 KB (`NFR1.6`).
- [Traceability: `NFR1.6`, `NFR3.2`, `NFR5.2`, `NFR6.1`, `NFR6.4`, `NFR6.5`]

### Step 18: Documentation & Traceability
- [ ] `frontend/README.md` (scripts, env vars, architecture, contract alignment summary, Ant Design + Tailwind theming).
- [ ] Write `code-summary.md`, `source-manifest.json`, and `traceability.json` (every assigned `AC*`, `BR*`, and `NFR*` mapped to an existing implementation or test file) in this stage's record directory.
- [Traceability: all assigned IDs]

---

## 2. Deliberate Deviations from Upstream Design (for the approver)

| # | Upstream statement | Planned behavior | Reason |
|:---|:---|:---|:---|
| D1 | `tech-stack-decisions.md`: Nuqs `^1.17.0` | Use `nuqs@^2` with its React (non-Next) adapter | Nuqs 1.x targets the Next.js router; a Vite SPA needs the 2.x React adapter. Same URL-state behavior (`?search=`, tab) |
| D2 | `tech-stack-decisions.md`: "Ant Design / Radix ^6.0.0" (ambiguous) | Ant Design `antd@^6` only (`Modal`, `Popover`, `Checkbox`, `Table`, `DatePicker`, `ConfigProvider`); no Radix | Decision by the person: use Ant Design. `performance-design.md` §5.1 budgets `@radix-ui/*` in `vendor-ui`; that chunk now holds `antd` (per-component imports) and the 250 KB budget is still enforced |
| D3 | `infrastructure-specification.md`: `wa-backend`, `cbm-network` | `backend`, `eps-net` | Matches the existing `docker-compose.yml` already built by the backend unit |
| D4 | `performance-design.md` §2.1 sample uses `project.name`, `total_docs` | Field names follow the normalized view models | The sample predates the contract; view models are authoritative |

---

## 3. Open Items Outside This Unit

- **Verification command**: the recorded Construction Verification Command is `go test -C backend -v -count=1 ./...`, which exercises only the backend. Verifying this unit at its checkpoint needs a command that also runs `npm --prefix frontend run test:coverage`; changing it requires a separate approval from the person.
- **Upload size limit (needs a decision)**: the realigned frontend design (`functional-spec.md`, `logical-components.md`, `mockups.md`) says 50 MB, while `security-design.md` and `security-requirements.md` (`NFR6.5`) still say 10 MB, and the backend defines `utils.MaxBodyBytes` as 10 MB (applied to the raw-body upload path; its multipart path parses up to 32 MB in memory). This plan follows the realigned frontend design (50 MB, one `MAX_UPLOAD_BYTES` constant, Nginx `client_max_body_size 50M`). Because `NFR6.5` is a defined target, the mismatch is surfaced rather than silently resolved: either the security documents and backend limit move to 50 MB, or the frontend constant drops back to 10 MB (a one-constant change). Say which you want.
- **Bundle budget risk**: Ant Design is heavier than Radix. The < 250 KB gzipped initial-bundle target (`NFR1.6`) is protected by per-component imports, lazy-loaded tab views, and a `vendor-ui` chunk. If the measured initial bundle exceeds the budget, the gap will be reported instead of the budget being relaxed.
- **Backend contract alignment**: resolved (see Contract Alignment). No `backend/` files are modified by this stage.

