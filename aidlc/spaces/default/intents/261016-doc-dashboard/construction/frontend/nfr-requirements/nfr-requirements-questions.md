# NFR Requirements Questions: Unit `frontend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`, `aidlc-quality-agent`  
**Date**: 2026-10-19  

---

### Q1: Frontend Rendering Performance & DOM Scaling
For the comparative matrix grid (up to 100 projects) and historical time-series chart (up to 730 daily data points across multi-project overlays):

- A. Direct DOM rendering with React memoization for up to 100 projects, Recharts SVG rendering with < 50ms target, and pagination (default 20, max 100) (Recommended)
- B. Full virtualized windowing (React Virtual) for table rows and WebGL canvas for time-series charts
- C. Server-side pagination limited to 10 rows per page with reload
- X. Other (please specify)

[Answer]: A. Direct DOM rendering with React memoization for up to 100 projects, Recharts SVG rendering with < 50ms target, and pagination (default 20, max 100)

---

### Q2: Client Data Caching & Refetch Invalidation Strategy
How should client data caching, background revalidation, and state invalidation behave across API endpoints?

- A. TanStack Query v5 with 30s staleTime for project matrix, 120s for trend analytics, and automatic cache invalidation upon CSV upload (Recommended)
- B. Aggressive polling every 5 seconds for all endpoints
- C. Manual browser refresh with no client caching
- X. Other (please specify)

[Answer]: A. TanStack Query v5 with 30s staleTime for project matrix, 120s for trend analytics, and automatic cache invalidation upon CSV upload

---

### Q3: Visual Accessibility, Typography & Theme Support
What visual accessibility, typography standards, and theme switching capabilities should be enforced?

- A. WCAG 2.1 AA accessibility, keyboard navigation (Tab/Esc), IBM Plex Sans Thai with tabular numbers, and Tailwind CSS v4 CSS variable-driven dual theming (light/dark) (Recommended)
- B. Light theme only without keyboard navigation focus states
- C. High-contrast accessibility mode only
- X. Other (please specify)

[Answer]: A. WCAG 2.1 AA accessibility, keyboard navigation (Tab/Esc), IBM Plex Sans Thai with tabular numbers, and Tailwind CSS v4 CSS variable-driven dual theming (light/dark)

---

## Consolidated Summary Confirmation

- **Q1 (Rendering Performance)**: Direct DOM rendering with React memoization for up to 100 projects, Recharts SVG rendering with $< 50\text{ ms}$ target, and pagination (default 20, max 100).
- **Q2 (Caching Strategy)**: TanStack Query v5 with 30s staleTime for project matrix, 120s for trend analytics, and automatic cache invalidation upon CSV upload.
- **Q3 (Accessibility & Theming)**: WCAG 2.1 AA accessibility, keyboard navigation (Tab/Esc), IBM Plex Sans Thai with tabular numbers, and Tailwind CSS v4 CSS variable-driven dual theming (light/dark).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
