# Conzol Doc Tracker — Frontend Application

Production-grade Single Page Application (SPA) for the SCG Engineering Project Services (EPS) Corporate Document Management System.

Built with **React 18**, **Vite 5**, **Tailwind CSS v4**, **Ant Design 5**, **TanStack Query 5**, and **Recharts 2**.

---

## 1. Directory Structure

```
frontend/
├── index.html                   # HTML5 entry with IBM Plex Sans Thai typography
├── vite.config.ts               # Vite configuration with chunk splitting & dev proxy
├── vitest.config.ts             # Vitest jsdom test runner with v8 coverage configuration
├── tsconfig.json                # Strict TypeScript configuration with @/* path alias
├── eslint.config.js             # Flat ESLint 9 configuration banning dangerouslySetInnerHTML
├── Dockerfile                   # Multi-stage production container build (Node 22 -> Nginx 1.27)
├── nginx.conf                   # Reverse proxy (/api/), 50 MB body limit & SPA rewrite
└── src/
    ├── main.tsx                 # Root bootstrap with TanStack QueryClientProvider
    ├── App.tsx                  # Shell coordinator, tab router & dark/light theme provider
    ├── index.css                # Semantic CSS tokens, pillar colors, and animations
    ├── theme/
    │   └── antdTheme.ts         # Dual-theme Ant Design tokens aligned with corporate navy palette
    ├── api/
    │   ├── types.ts             # Envelope DTOs, OpenAPI models & UI view models
    │   ├── client.ts            # Envelope unwrapper, error sanitization & multipart uploader
    │   ├── normalizers.ts       # Pure DTO -> View Model mappers with 45% delinquency detection
    │   ├── queryClient.ts       # QueryClient singleton with exponential backoff & 4xx filter
    │   └── queries.ts           # useHealthCheck, useGlobalSummary, useProjectMatrix, etc.
    ├── components/
    │   ├── layout/              # HeaderNav, NavigationTabs, GlobalFilterBar, DashboardShell
    │   └── ui/                  # Badges, Skeletons, ErrorAlert, EmptyState, ThemeToggle, ErrorBoundaries
    ├── features/
    │   ├── overview/            # TopbarKpiCards, SearchToolbar, ProjectMatrixTable, CategoryDetailGrid
    │   ├── trend/               # PresetToolbar, MetricSelector, ProjectSelector, HistoricalTrendChart
    │   └── ingestion/           # CsvUploadZone, IngestionHistoryTable, IngestionErrorModal, CsvUploadModal
    └── lib/
        ├── delinquency.ts       # 45% critical flag, pending ratio & overdue health band classification
        ├── palette.ts           # 24-slot deterministic color assignment (slots 9+ dashed 5 5)
        ├── validation.ts        # Client-side 50 MB boundary & CSV MIME pre-flight verification
        ├── trend.ts             # Preset windows (30D, 90D, 180D, 1Y, ALL) & 730-point downsampling
        ├── format.ts            # Localized number, percentage, date and duration formatters
        └── useDebouncedValue.ts # 200 ms debounce hook for high-frequency search filtering
```

---

## 2. Development & Operational Commands

Execute all commands from the `frontend/` directory (or using `npm --prefix frontend <command>` from the project root):

```bash
# Install dependencies
npm install

# Start local development server (with /api proxy to http://localhost:8080)
npm run dev

# Run static type checking
npm run type-check

# Run linter
npm run lint

# Run all unit and component tests (Vitest)
npm run test

# Run tests with code coverage analysis (>80% floor on api & lib)
npm run test:coverage

# Build optimized production bundle
npm run build
```

---

## 3. Production Docker & Container Deployment

The application is containerized with a two-stage Alpine image:
- **Build stage**: `node:22-alpine` compiles TypeScript and creates the tree-shaken static assets.
- **Runtime stage**: `nginx:1.27-alpine` serves static files, proxies `/api/` calls to the Go backend (`http://backend:8080`), and handles SPA HTML5 history routing.

Run with Docker Compose:
```bash
docker compose up -d frontend
```
The dashboard is accessible on port `3000` (e.g. `http://localhost:3000`).

