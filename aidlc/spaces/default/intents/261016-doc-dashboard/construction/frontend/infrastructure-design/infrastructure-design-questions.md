# Infrastructure Design Questions — Unit: `frontend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-19  

---

## Questions

### Q1: Frontend Containerization & Reverse Proxy Architecture (Infrastructure)
The React single-page application requires production containerization for deployment in Docker Compose alongside `wa-backend` and PostgreSQL on corporate intranet VM:
How should the frontend container and HTTP delivery architecture be designed?

- [x] A. Multi-stage Dockerfile with unprivileged Nginx (Recommended): Stage 1 compiles TypeScript and assets via Vite (`npm run build`); Stage 2 packages output into `nginxinc/nginx-unprivileged:alpine` running as non-root user (UID 101). Configures SPA fallback routing (`try_files $uri $uri/ /index.html;`), reverse proxying `/api/` to `wa-backend:8080`, and security headers (CSP, nosniff, DENY).
- [ ] B. Node.js SSR runtime: Run `vite preview` or Express server inside a Node 20 container to serve static assets.
- [ ] C. Host-level static hosting: Serve static build artifacts directly from host VM directory without containerization.

[Answer]: A

---

### Q2: Client Telemetry, Core Web Vitals & Health Probes (Monitoring)
The frontend application requires continuous validation of Core Web Vitals and server health:
What telemetry and monitoring architecture should be established?

- [x] A. Client-side Web Vitals telemetry + Nginx container healthcheck (Recommended): Instrument client-side measurement for LCP, FID/INP, and CLS; output structured metrics to console/telemetry buffer; Nginx container defines Docker healthcheck probe (`wget -q --spider http://localhost:8080/health || exit 1`) ensuring zero-downtime container lifecycle management.
- [ ] B. External APM agent (Datadog/Sentry): Embed third-party SaaS SDKs requiring external internet egress.
- [ ] C. Minimal Docker status check: Rely exclusively on Docker engine default exit status without HTTP healthcheck endpoints.

[Answer]: A

---

### Q3: CI/CD Quality Gates & Frontend Verification Automation (CI/CD)
Per team standards (80% test coverage floor, strict TypeScript checking, ESLint, production bundle size ceilings):
How should the automated verification and build pipeline be formalized?

- [x] A. Standardized npm lifecycle scripts + local verification pipeline (Recommended): Implement `npm run lint`, `npm run type-check`, `npm run test`, `npm run test:coverage`, and `npm run build` scripts in `package.json`; enforces $\ge 80\%$ line coverage in Vitest, zero TypeScript errors (`tsc --noEmit`), and bundle size verification ($< 250\text{ KB}$ gzipped) before promotion.
- [ ] B. Full GitHub Actions workflow YAML: Author GitHub Actions pipeline definitions for hosted runner execution.
- [ ] C. Manual developer builds: Execute raw Vite commands without standardized automated verification scripts.

[Answer]: A

---

## Consolidated Summary Confirmation

- **Q1 (Containerization & Reverse Proxy)**: A. Multi-stage Dockerfile with unprivileged Nginx — Multi-stage build with `nginxinc/nginx-unprivileged:alpine` non-root execution, SPA routing fallback, `/api/` reverse proxy to `wa-backend:8080`, and security headers.
- **Q2 (Telemetry & Health Probes)**: A. Client Web Vitals telemetry + Nginx healthcheck — Core Web Vitals instrumentation (LCP $< 1.2\text{ s}$, CLS $< 0.1$, INP $< 100\text{ ms}$) and `/health` Docker container probe.
- **Q3 (CI/CD & Quality Gates)**: A. Standardized npm lifecycle scripts + local verification pipeline — Automated scripts enforcing $\ge 80\%$ Vitest coverage floor, strict type-checking, ESLint, and bundle size constraints.

Does this all look correct before I generate the artifacts?

- Looks correct
- Request changes

[Answer]: Looks correct
