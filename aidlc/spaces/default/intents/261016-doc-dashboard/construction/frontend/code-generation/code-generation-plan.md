# Code Generation Plan: Unit `frontend`

**Stage**: `code-generation` (3.5)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19

---

## Summary

- Builds: React 18 + TypeScript + Vite dashboard SPA (KPI topbar, comparative matrix, historical trend chart, CSV upload modal) with typed API client, dual theme, and Nginx container
- Touches: frontend/ (package.json, vite/vitest/eslint config, src/{api,lib,components,features}, Dockerfile, nginx.conf), plus a `frontend` service in docker-compose.yml
- Tests: ~70 Vitest + React Testing Library tests (5-8 per component/module) with an 80% line-coverage floor on API normalizers, derived-metric logic, and hooks

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

## Contract Drift Register (read before approving)

The implemented `backend` unit does not currently serve the exact shapes in `contract-summary.md`. The frontend is designed against the **frozen contract** (`contract-summary.md` §4: backend owns the spec; consumers practice tolerant parsing), with a single normalization seam (`src/api/normalizers.ts`) that also accepts what the backend serves today, so the UI works now and tightens automatically when the backend is aligned.

| Endpoint | Frozen contract (`contract-summary.md`) | Backend as implemented (`backend/internal/project`, `ingest`) | Frontend handling |
|:---|:---|:---|:---|
| `GET /projects/summary` | `total_projects`, `total_documents`, `total_overdue`, `category_counts{baseline_drawings,control,corrective,change,complete}`, `last_updated_at` | `total_projects`, `total_documents`, `approved_documents`, `under_review_documents`, `overdue_documents`, `global_approval_rate` | Contract fields preferred; `overdue_documents` accepted as `total_overdue`; missing `category_counts` render as "—" (category pills show an "unavailable" tooltip), never as fabricated zeros |
| `GET /projects` | `project_id`, `site_code`, per-category `CategoryMetrics`, `net_change`, `page`/`page_size` | `project_code`, `project_name`, `total/approved/under_review/overdue_documents`, `approval_rate`, `last_updated`; supports `search`, `sort_by`, `sort_dir`; no pagination | `project_code` accepted as `project_id`; category metrics absent → "—"; pagination params sent but client-side paging used when `total` ≥ rows returned |
| `GET /analytics/trends` | query `project_ids`, `preset`, `start_date`, `end_date`; `result[]` = `{date, project_metrics{<id>:{total_documents,overdue_count}}}` | query `project_code`, `from`, `to`; `result[]` = `{date,total,approved,under_review,overdue,approval_rate}` for a single project | Client sends both parameter families; merges per-project fetches (one call per selected project) into the contract's `date → project_metrics` shape when the backend returns the single-project form |
| `POST /ingest` | `201`/`200`, `result{batch_id,file_sha256,status,snapshot_date,total_rows,deltas_updated,skipped_unchanged}` | `200`, `result{project_code,total_rows,processed_count,snapshot_date,errors[]}`; `409` when chronology downgrade (code `1801`) | Success toast renders whichever counts exist; `409` → Conflict state; `400` → Error state showing `status.description` |
| `GET /health` | `result{service,database,timestamp}` | `result{status:"healthy",time}` | Healthy when `result.service==="UP"` **or** `result.status==="healthy"` |

> [!IMPORTANT]
> Category pills, per-category delinquency (`.chip-blink`, ≥45%), and week-over-week trend tags (AC2.1.1, AC2.2.1, AC2.3.2, AC2.3.3) can only show real values once the backend serves the contract's category metrics. Until then the UI renders the 4 mandatory states honestly with "—" placeholders. Aligning the backend is a separate decision (see `code-summary.md` once generated); this plan does not modify `backend/`.

---

## 1. Implementation Steps & Traceability

Following `test-after`, each layer is implemented first and its tests are written and run immediately after.

### Step 1: Project Structure & Production Configuration Skeleton
- [ ] Create `frontend/package.json` (scripts exactly as `cicd-pipeline.md` §4.1: `dev`, `build`, `preview`, `lint`, `type-check`, `test`, `test:watch`, `test:coverage`), with pinned dependencies: `react@^18.3.1`, `react-dom`, `@tanstack/react-query@^5.50`, `recharts@^2.12`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `nuqs` and dev dependencies `typescript@^5.5`, `vite@^5.4`, `@vitejs/plugin-react`, `tailwindcss@^4` + `@tailwindcss/vite`, `vitest@^2`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks`.
- [ ] Create `frontend/tsconfig.json` / `tsconfig.node.json` (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`), `frontend/vite.config.ts` (dev proxy `/api` → `http://localhost:8080`, `manualChunks`: `vendor-react`, `vendor-charts`, `vendor-query`, `vendor-ui`), `frontend/eslint.config.js` (bans `dangerouslySetInnerHTML` via `no-restricted-syntax`), `frontend/index.html`, `frontend/.env.example`.
- [ ] Create `frontend/src/index.css` with Tailwind v4 `@theme` tokens (`--bg`, `--paper`, `--ink`, `--ink-dim`, `--line`, `--headerbg`, the 5 pillar colors, `--trend-1`…`--trend-16`), light/dark variants, IBM Plex Sans Thai stack, `.chip-blink`, and `tabular-nums` utilities.
- [Traceability: `NFR1.6`, `NFR5.2`, `NFR6.3`, `NFR3.2`]

### Step 2: Bootstrap Minimal Test Runner & Unit-Scoped Command
- [ ] Create `frontend/vitest.config.ts` (jsdom environment, `src/test/setup.ts` with jest-dom matchers, `ResizeObserver`/`matchMedia` stubs for Recharts/Radix, V8 coverage with an **80% line threshold** on `src/api`, `src/lib`, and `src/features/**/use*.ts`; thresholds are never lowered).
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
- [ ] `frontend/src/lib/validation.ts`: CSV pre-flight (`.csv` case-insensitive, MIME in `text/csv`/`application/vnd.ms-excel`/`text/plain`, ≤ 10,485,760 bytes).
- [ ] `frontend/src/lib/trend.ts`: preset → date window (`all_time`/`1_year`/`6_months`/`3_months`), per-project point cap (730) downsampling, merge of per-project series by date.
- [ ] `frontend/src/lib/format.ts` and `frontend/src/lib/useDebouncedValue.ts` (200 ms).
- [Traceability: `AC2.3.1`, `AC2.3.2`, `AC2.3.3`, `AC4.1.2`, `AC4.2.1`, `AC4.2.3`, `BR9.1`, `BR9.2`, `BR9.3`, `BR10.2`, `BR10.3`, `BR10.5`, `BR11.2`, `NFR1.4`, `NFR6.5`]

### Step 7: Business Logic — Tests
- [ ] `delinquency.test.ts` (threshold boundary at 44.9/45.0, zero denominators, band edges, trend mapping), `palette.test.ts` (determinism, stability after removal, dashed slots), `validation.test.ts` (extension, MIME, size boundary 10,485,760 / 10,485,761), `trend.test.ts` (preset windows, 730-point cap, merge), `useDebouncedValue.test.ts` (200 ms with fake timers).
- [Traceability: `test-after` for Step 6; 80% line-coverage floor]

### Step 8: API / Endpoint
- Not applicable (server endpoints are owned by `backend`). Client consumption of the five routes is covered by Steps 4–5.

### Step 9: Frontend Behavior — Primitives & Shell — Implement
- [ ] `src/components/ui/`: `Skeletons.tsx` (`CardSkeleton`, `TableSkeleton`, `ChartSkeleton` with fixed dimensions for CLS < 0.1; KPI container `min-height: 120px`), `EmptyState.tsx`, `ErrorAlert.tsx` (Retry button), `Badges.tsx` (`CategoryBadge`, `DelinquencyChip` with `.chip-blink`, `OverdueBadge`, `TrendTag`), `ThemeToggle.tsx` (persists `light`/`dark`, respects `prefers-color-scheme`).
- [ ] `src/components/layout/`: `DashboardShell.tsx` (header + tab nav `#view-overview` / `#view-trend`, tab state in URL via Nuqs), `HeaderNav.tsx` (brand, health heartbeat from `useHealthCheck`, "Upload Snapshot CSV" trigger).
- [ ] `src/main.tsx`, `src/App.tsx` (QueryClientProvider, Nuqs adapter, lazy-loaded trend view via `React.lazy`).
- [Traceability: `AC2.2.3`, `BR8.3`, `BR9.1`, `BR9.2`, `BR9.3`, `NFR1.1`, `NFR1.7`, `NFR5.1`, `NFR5.2`]

### Step 10: Frontend Behavior — Primitives & Shell — Tests
- [ ] `Skeletons.test.tsx`, `EmptyState.test.tsx`, `ErrorAlert.test.tsx` (retry callback), `Badges.test.tsx` (chip-blink applied only at ≥ 45%, trend colors never inverted), `ThemeToggle.test.tsx` (class toggle + persistence), `HeaderNav.test.tsx` (healthy / unhealthy heartbeat, upload trigger), `DashboardShell.test.tsx` (tab switch).
- [Traceability: `test-after` for Step 9]

### Step 11: Frontend Behavior — Overview Features — Implement
- [ ] `src/features/overview/TopbarKpiCards.tsx` + `CategoryDetailGrid.tsx`: total count, 5 category pills (Baseline Drawings, Control, Corrective, Change, Complete), accordion `.kpi-detail` toggle (`transition-all duration-300`, close on second click/outside click), 4 states, "—" when category data unavailable (Drift Register).
- [ ] `src/features/overview/SearchToolbar.tsx` (`#searchInput`, 200 ms debounce, `?search=` via Nuqs, cleared param removed) and `ProjectMatrixTable.tsx` + memoized `ProjectTableRow.tsx` (`React.memo`, `useMemo` filtering, `contain: layout paint`, Site Code / Project ID / Baseline / Control / Corrective / Change / Overdue / trend columns, `EmptyState` with "Clear Search Filters", `data-testid` on interactive elements).
- [Traceability: `AC2.1.1`, `AC2.1.2`, `AC2.1.3`, `AC2.2.1`, `AC2.2.2`, `AC2.2.3`, `AC2.3.1`, `AC2.3.2`, `AC2.3.3`, `BR7.1`, `BR7.2`, `BR7.3`, `BR8.1`, `BR8.2`, `BR8.3`, `BR9.1`, `BR9.2`, `BR9.3`, `NFR1.1`, `NFR5.1`]

### Step 12: Frontend Behavior — Overview Features — Tests
- [ ] `TopbarKpiCards.test.tsx` (loading / error+retry / empty / success, category toggle open/close), `CategoryDetailGrid.test.tsx`, `SearchToolbar.test.tsx` (debounce, URL sync, clear), `ProjectMatrixTable.test.tsx` (4 states, columns, overdue badge, critical chip, zero-match empty state), `ProjectTableRow.test.tsx` (memo equality).
- [Traceability: `test-after` for Step 11]

### Step 13: Frontend Behavior — Historical Trend — Implement
- [ ] `src/features/trend/HistoricalTrendChart.tsx` (Recharts `LineChart`, `type="monotone"`, `isAnimationActive={false}`, shared canvas, chart chunk loaded lazily, 4 states, "select a project" empty prompt), `PresetToolbar.tsx` (`All Time`, `1 Year`, `6 Months`, `3 Months`, `aria-pressed`), `ProjectSelectorDropdown.tsx` (Radix popover + checkboxes + color swatches from `palette.ts`), `UnifiedCustomTooltip.tsx` (crosshair + date + all selected projects side-by-side, `tabular-nums`).
- [Traceability: `AC4.1.1`, `AC4.1.2`, `AC4.2.1`, `AC4.2.2`, `AC4.2.3`, `BR10.1`, `BR10.2`, `BR10.3`, `BR10.4`, `BR10.5`, `NFR1.4`, `NFR5.1`]

### Step 14: Frontend Behavior — Historical Trend — Tests
- [ ] `HistoricalTrendChart.test.tsx` (4 states, one line per selected project, empty prompt), `PresetToolbar.test.tsx` (active state + callback), `ProjectSelectorDropdown.test.tsx` (check/uncheck keeps sibling colors), `UnifiedCustomTooltip.test.tsx` (all selected projects listed with matching colors).
- [Traceability: `test-after` for Step 13]

### Step 15: Frontend Behavior — CSV Upload — Implement
- [ ] `src/features/upload/CsvUploadModal.tsx` (Radix dialog with focus trap; states `Idle → DragOver → Validating → Ready → Uploading → Success | Conflict | Error`; drag-and-drop + native picker; client validation from `validation.ts`; indeterminate progress; success summary using whichever counts the response carries; auto-close after 2.5 s; invalidates caches via `useUploadSnapshot`).
- [Traceability: `AC1.1.1`, `AC1.1.2`, `AC1.1.3`, `BR11.1`, `BR11.2`, `BR11.3`, `NFR6.2`, `NFR6.5`]

### Step 16: Frontend Behavior — CSV Upload — Tests
- [ ] `CsvUploadModal.test.tsx`: rejects non-`.csv` and > 10 MB without any network call, accepts valid file → Ready, submit → Uploading → Success summary, 409 → Conflict message, 400/500 → Error showing only `status.description`, cache invalidation after success, dialog focus/escape handling.
- [Traceability: `test-after` for Step 15; `NFR6.5`]

### Step 17: Environment / Build Configuration
- [ ] `frontend/Dockerfile` (multi-stage `node:20-alpine` builder → `nginxinc/nginx-unprivileged:alpine` runner, non-root UID 101, `EXPOSE 8080`), `frontend/nginx.conf` (gzip, `client_max_body_size 10M`, CSP/`X-Content-Type-Options`/`X-Frame-Options`, immutable `/assets/` cache, `/api/` proxy, SPA fallback), `frontend/.dockerignore`.
- [ ] Add a `frontend` service to the repository `docker-compose.yml` on the existing `eps-net` network, host port `3000 → 8080`, `depends_on: backend`, healthcheck. **Deviation from `infrastructure-specification.md`**: the spec names `wa-backend` / `cbm-network`; the implemented compose file uses service `backend` and network `eps-net`, so the proxy target (`http://backend:8080`) and network follow the existing file. CSP `connect-src` uses `'self'` because the browser reaches the API through the same-origin `/api/` proxy.
- [ ] Run `npm run lint`, `npm run type-check`, `npm run test:coverage`, `npm run build` and verify the initial gzipped bundle < 250 KB (`NFR1.6`).
- [Traceability: `NFR1.6`, `NFR3.2`, `NFR5.2`, `NFR6.1`, `NFR6.4`, `NFR6.5`]

### Step 18: Documentation & Traceability
- [ ] `frontend/README.md` (scripts, env vars, architecture, Drift Register summary, theming).
- [ ] Write `code-summary.md`, `source-manifest.json`, and `traceability.json` (every assigned `AC*`, `BR*`, and `NFR*` mapped to an existing implementation or test file) in this stage's record directory.
- [Traceability: all assigned IDs]

---

## 2. Deliberate Deviations from Upstream Design (for the approver)

| # | Upstream statement | Planned behavior | Reason |
|:---|:---|:---|:---|
| D1 | `tech-stack-decisions.md`: Nuqs `^1.17.0` | Use `nuqs@^2` with its React (non-Next) adapter | Nuqs 1.x targets the Next.js router; a Vite SPA needs the 2.x React adapter. Same URL-state behavior (`?search=`, tab) |
| D2 | `tech-stack-decisions.md`: "Ant Design / Radix ^6.0.0" (ambiguous) | Radix UI primitives only (`dialog`, `popover`) | `performance-design.md` §5.1 budgets `@radix-ui/*` in `vendor-ui`; avoids shipping a second UI kit against the 250 KB budget |
| D3 | `infrastructure-specification.md`: `wa-backend`, `cbm-network` | `backend`, `eps-net` | Matches the existing `docker-compose.yml` already built by the backend unit |
| D4 | `performance-design.md` §2.1 sample uses `project.name`, `total_docs` | Field names follow the normalized view models | The sample predates the contract; view models are authoritative |

---

## 3. Open Items Outside This Unit

- **Verification command**: the recorded Construction Verification Command is `go test -C backend -v -count=1 ./...`, which exercises only the backend. Verifying this unit at its checkpoint needs a command that also runs `npm --prefix frontend run test:coverage`; changing it requires a separate approval from the person.
- **Backend/contract alignment**: see the Drift Register. No `backend/` files are modified by this stage.

