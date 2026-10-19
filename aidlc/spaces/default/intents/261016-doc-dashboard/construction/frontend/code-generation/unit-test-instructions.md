# Unit Test Instructions: Unit `frontend`

**Stage**: `code-generation` (3.5)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Strategy**: Standard (5-8 tests per component) with the `mvp` scope floor (80% line coverage, run in CI before merge)  
**Methodology**: test-after (per the affirmed Testing Contract)

---

## 1. Test Framework Setup

| Concern | Choice |
|:---|:---|
| Runner | Vitest `^2` (`jsdom` environment) |
| Component testing | React Testing Library + `@testing-library/user-event` + `@testing-library/jest-dom` |
| Coverage | `@vitest/coverage-v8` |
| Config | `frontend/vitest.config.ts`, `frontend/src/test/setup.ts` |
| Setup file stubs | `ResizeObserver`, `matchMedia`, `URL.createObjectURL` (needed by Recharts and Radix under jsdom) |

One-time install (from the repository root):

```bash
npm --prefix frontend install
```

---

## 2. How to Run THIS Unit's Tests

All commands are scoped to the `frontend` unit only (they never touch `backend/`).

| Purpose | Exact command |
|:---|:---|
| Run the unit's full suite once with coverage (the CI / Build and Test command) | `npm --prefix frontend run test:coverage` |
| Run the unit's suite once, no coverage | `npm --prefix frontend run test` |
| Run one module's tests | `npm --prefix frontend exec vitest -- run src/lib/delinquency.test.ts` |
| Run the API layer only | `npm --prefix frontend exec vitest -- run src/api` |
| Run the overview feature only | `npm --prefix frontend exec vitest -- run src/features/overview` |
| Run the trend feature only | `npm --prefix frontend exec vitest -- run src/features/trend` |
| Run the upload feature only | `npm --prefix frontend exec vitest -- run src/features/upload` |
| Watch mode while developing | `npm --prefix frontend run test:watch` |

Related quality gates for the unit (run by CI, not counted as tests):

```bash
npm --prefix frontend run lint
npm --prefix frontend run type-check
npm --prefix frontend run build
```

---

## 3. Expected Coverage Targets

- **Line coverage floor: 80%** on `src/api/**`, `src/lib/**`, and custom hooks (`src/features/**/use*.ts`), enforced as a Vitest `coverage.thresholds` setting. The threshold is never lowered to make a run pass; a shortfall is reported as a gap instead.
- Expected volume: about 70 tests (5-8 per component or module), grouped as:

| Group | Files | Approx. tests |
|:---|:---|:---|
| Data access | `client`, `normalizers`, `queries` | 18 |
| Business logic | `delinquency`, `palette`, `validation`, `trend`, `useDebouncedValue` | 22 |
| Primitives & shell | `Skeletons`, `EmptyState`, `ErrorAlert`, `Badges`, `ThemeToggle`, `HeaderNav`, `DashboardShell` | 14 |
| Overview features | `TopbarKpiCards`, `CategoryDetailGrid`, `SearchToolbar`, `ProjectMatrixTable`, `ProjectTableRow` | 14 |
| Trend features | `HistoricalTrendChart`, `PresetToolbar`, `ProjectSelectorDropdown`, `UnifiedCustomTooltip` | 10 |
| Upload feature | `CsvUploadModal` | 8 |

- Integration-level tests (standard strategy, key boundaries): mocked-`fetch` tests that exercise API client → normalizer → hook → component for the summary, matrix, trend, and upload flows.

---

## 4. Mocking & Stubbing Guidance

- **Network**: stub `globalThis.fetch` per test (a small `mockFetch` helper in `src/test/`); never call a real backend. Responses use the universal envelope (`status`, `result`, `total`, `search_params`). Provide both a contract-shaped and an as-implemented-backend fixture for each endpoint (see the Drift Register in the plan).
- **TanStack Query**: wrap components in a fresh `QueryClient` per test with `retry: false` and `gcTime: Infinity` to keep tests deterministic.
- **URL state (Nuqs)**: use the Nuqs testing adapter / `withNuqsTestingAdapter` so `?search=` and tab changes are observable without a router.
- **Time**: use `vi.useFakeTimers()` for the 200 ms search debounce, the 30 s health poll, and the 2.5 s upload auto-close.
- **Recharts**: render inside a fixed-size container (jsdom has no layout); assert on series count, stroke colors, and tooltip contents rather than SVG geometry.
- **Files**: build `File` objects in memory (`new File([...], 'AUTOEMAIL_FILE_06_20261016.csv', { type: 'text/csv' })`); simulate the 10 MB boundary with an object whose `size` is overridden via `Object.defineProperty`.

---

## 5. Test Data Management

- Fixtures live in `frontend/src/test/fixtures/` as typed TypeScript modules (no binary files): `summary.contract.ts`, `summary.backend.ts`, `projects.contract.ts`, `projects.backend.ts`, `trends.contract.ts`, `trends.backend.ts`, `ingest.responses.ts`.
- Boundary data is explicit: pending ratio 44.9 vs 45.0, overdue bands at 4.9 / 5 / 15 / 15.1, file size 10,485,760 vs 10,485,761 bytes, zero denominators, and empty arrays.
- Fixtures contain synthetic project codes only (for example `PRJ-001`, `BKK-01`); no real project, personal, or customer data.

