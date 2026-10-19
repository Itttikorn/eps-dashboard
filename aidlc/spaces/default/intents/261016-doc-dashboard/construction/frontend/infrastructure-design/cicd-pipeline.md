# CI/CD Pipeline & Quality Gate Specification — Unit: `frontend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-devsecops-agent`  
**Support Agents**: `aidlc-architect-agent`, `aidlc-aws-platform-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Standards Conformance

This CI/CD pipeline and automation specification details the automated quality gates, test execution suites, branch promotion workflows, and container image builds for the React 18 single-page application (`frontend`), tracing from:
- `performance-design.md`: Production bundle compression ceilings ($< 250\text{ KB}$ gzipped) (`NFR1.6`).
- `security-design.md`: Automated type check, linting, and branch promotion rules (`NFR3.2`).
- `scalability-design.md` & `reliability-design.md`: Predictable reproducible build pipelines.
- `observability-design.md` & `logical-components.md`: Component test isolation and module contracts.
- `components.md` & `functional-spec.md`: Component test suites and screen state assertions.
- `contract-summary.md`: DTO model validation and API client contracts (`NFR3.1`).

---

## 2. Linear Environment Promotion & Merge Strategy (NFR3.2)

### 2.1 Four-Stage Linear Promotion Pipeline
In strict adherence to affirmed team rules, all frontend code changes advance through linear environments:
$$\text{feat/scope} \longrightarrow \text{staging} \longrightarrow \text{dev} \longrightarrow \text{main}$$

### 2.2 Strict Non-Fast-Forward (`--no-ff`) Merges
- Direct pushes to `main`, `dev`, and `staging` are strictly forbidden.
- All branch merges must execute using **Create Merge Commit (`--no-ff`)** to retain complete PR context, commit provenance, and enable single-step atomic rollback capability (`git revert -m 1 <commit-hash>`).

---

## 3. Automated Quality Gates & Verification Pipeline (NFR3.1, NFR3.2)

### 3.1 Verification Gate Sequence
Before any PR can be merged into `staging`:
1. **Linting Check (`npm run lint`)**: ESLint validates syntax, prohibits `dangerouslySetInnerHTML`, and enforces React Hooks rules.
2. **Type Checking (`npm run type-check`)**: `tsc --noEmit` verifies strict TypeScript compilation with zero errors (`noImplicitAny`, `strictNullChecks`).
3. **Unit & Component Testing (`npm run test:coverage`)**: Vitest executes the complete test suite under jsdom, verifying all 4 mandatory UI states (`NFR5.1`).
4. **Coverage Floor Verification**: Line coverage must meet or exceed the $\ge 80\%$ threshold across all business logic, data transformers, and custom hooks.
5. **Production Build & Bundle Budget (`npm run build`)**: Vite compiles the static distribution and validates that the initial gzipped bundle remains $< 250\text{ KB}$ (`NFR1.6`).

---

## 4. Local Developer Parity & Lifecycle Scripts (NFR1.6, NFR6.1)

### 4.1 Standardized `package.json` Automation
Developer workstations and automated runners execute identical commands defined in `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4.2 Docker Image Verification
The container build process is verified locally or in CI via:
```bash
docker build -t wa-frontend:test ./frontend
docker run --rm -d -p 3000:8080 --name wa-frontend-test wa-frontend:test
wget -q --spider http://localhost:3000/ || exit 1
docker stop wa-frontend-test
```

