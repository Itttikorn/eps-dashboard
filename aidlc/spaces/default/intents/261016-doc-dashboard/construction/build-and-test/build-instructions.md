# Build Instructions: Corporate Document Management System Dashboard

**Stage**: `build-and-test` (3.6)  
**Phase**: `construction`  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-quality-agent`  
**Support Agents**: `aidlc-devsecops-agent`  
**Date**: 2026-10-19  

---

## 1. Prerequisites & Toolchain Setup

The system consists of two primary deliverable units:
- **`backend` (`U1`)**: Go 1.22+ API server (`chi/v5`, PostgreSQL driver `pgx/v5`, GORM for SQLite testing).
- **`frontend` (`U2`)**: React 18+ SPA with Vite, TypeScript 5.5+, Tailwind CSS v4, and Ant Design 5.

### System Prerequisites
| Tool | Minimum Version | Purpose | Verification Command |
| :--- | :--- | :--- | :--- |
| **Go** | 1.22.0+ | Backend runtime, compilation, and testing | `go version` |
| **Node.js** | 20.0.0+ (LTS) | Frontend package management and execution | `node -v` |
| **npm** | 10.0.0+ | Frontend dependency resolution | `npm -v` |
| **Docker** | 24.0.0+ | Container runtime for multi-container orchestration | `docker --version` |
| **Docker Compose** | 2.20.0+ | Multi-service local and corporate VM runtime | `docker compose version` |

---

## 2. Dependency Installation Steps

### 2.1 Backend Dependencies
From the repository root:
```bash
cd backend
go mod download
go mod verify
```
This fetches all external packages (`github.com/go-chi/chi/v5`, `github.com/go-chi/cors`, `github.com/jackc/pgx/v5`, `gorm.io/gorm`, `gorm.io/driver/sqlite`) and confirms checksum integrity against `go.sum`.

### 2.2 Frontend Dependencies
From the repository root:
```bash
npm --prefix frontend install
```
This installs all development and runtime dependencies (`react`, `react-dom`, `antd`, `@ant-design/icons`, `@tanstack/react-query`, `lucide-react`, `recharts`, `nuqs`, `vitest`, `@testing-library/react`) into `frontend/node_modules/`.

---

## 3. Environment Setup & Local Services

### 3.1 Backend Configuration (`.env`)
Copy the environment template in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Key configuration parameters:
```env
PORT=8080
ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/eps_dashboard?sslmode=disable
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_UPLOAD_SIZE_MB=50
```

### 3.2 Frontend Configuration (`.env`)
Key configuration in `frontend/.env.development` or default environment:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 3.3 Containerized Local Database (PostgreSQL 16)
To start the database service locally via Docker Compose:
```bash
docker compose up -d db
```

---

## 4. Build Commands (Compile, Bundle, Transpile)

### 4.1 Backend Build (Go Binary)
To compile a production standalone executable:
```bash
# On Linux / macOS:
cd backend && CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/server .

# On Windows (PowerShell):
cd backend ; go build -ldflags="-s -w" -o bin/server.exe .
```
- Output: Single standalone binary (`backend/bin/server` or `backend/bin/server.exe`).
- Binary Size: ~15 MB.
- Architecture: Zero external runtime dependencies.

### 4.2 Frontend Build (Vite Production Bundle)
To transpile and bundle TypeScript and React components:
```bash
npm --prefix frontend run build
```
- Tool: Vite 5 + Rollup + TypeScript 5 compiler (`tsc -b`).
- Output Directory: `frontend/dist/`.
- Assets emitted:
  - Compressed JavaScript chunks (~41.5 KB gzipped initial payload).
  - Production stylesheet bundle (`dist/assets/*.css`).
  - Production HTML shell (`dist/index.html`).

### 4.3 Containerized Multi-Service Build
To build both production container images via Docker Compose:
```bash
docker compose build
```
- `wa-backend`: Multi-stage Go build with `scratch`/`alpine` unprivileged runner.
- `wa-frontend`: Multi-stage Node.js build with Nginx Alpine static server.

---

## 5. Build Verification Steps

Execute the following sequential health verification steps to confirm build success:

```bash
# 1. Verify Go syntax and compilation across all packages
go vet -C backend ./...
go build -C backend -o nul .

# 2. Verify TypeScript type soundness with zero type errors
npm --prefix frontend run type-check

# 3. Verify ESLint rules
npm --prefix frontend run lint

# 4. Verify production bundle output existence
test -f frontend/dist/index.html || Test-Path frontend/dist/index.html
```

---

## 6. Troubleshooting Common Build Issues

| Issue / Error Symptom | Root Cause | Resolution Step |
| :--- | :--- | :--- |
| `go: -race requires cgo; enable cgo` | CGO is disabled or gcc is missing from PATH on Windows host | Use standard `go test -v -count=1 ./...` on Windows dev hosts, or enable CGO with MinGW GCC in PATH. Linux CI images execute with `CGO_ENABLED=1`. |
| `window.getComputedStyle is not implemented` in Vitest | jsdom does not implement full computed style calculation for Ant Design modals | Provided custom mock stub in `frontend/src/test/setup.ts` (`window.getComputedStyle`). |
| `ResizeObserver is not defined` in Recharts tests | jsdom environment lacks native SVG layout engine | Provided polyfill in `frontend/src/test/setup.ts` (`global.ResizeObserver = class { ... }`). |
| `Cannot find module '@/*'` in frontend | Missing path alias mapping in tsconfig or vite.config | Path aliases are standardized via `vite-tsconfig-paths` and explicit `@/` resolution in `vite.config.ts`. |
| Port 8080 or 5432 already in use | Conflicting local background process | Modify `PORT` in `backend/.env` or map alternate host port in `docker-compose.yml`. |

