# Technology Stack Decisions: Unit `frontend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-quality-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Standards Conformance

This technology stack decision record locks the foundational libraries, build tooling, state management patterns, and testing frameworks for the Document Management System dashboard (`frontend`), tracing from:
- `requirements.md`: `NFR3.1` (Universal API Envelope), `NFR5.1` (4 mandatory UI states), `NFR5.2` (Dual theme dark/light mode), and `NFR6.1` (Corporate intranet deployment).
- `functional-spec.md`: Workflows 1–5, component architecture, Recharts time-series canvas, and Nuqs URL synchronization.
- `contract-summary.md`: OpenAPI 3.0 TypeScript client generation and DTO models.
- `frontend-tech-stack.md` & `frontend-standards.md`: The Golden Path tier-1 standards, 4/8pt spatial scale, and IBM Plex Sans Thai typography.

---

## 2. Approved Core Technology Stack

| Domain | Selected Technology | Version | Architectural Rationale & Standards Conformance |
|:---|:---|:---|:---|
| **Core Framework** | React | `^18.3.1` | Component-based UI framework supporting concurrent features, high-performance DOM reconciliation, and hooks |
| **Language & Types** | TypeScript | `^5.5.0` | Strict type checking (`noImplicitAny: true`, `noUncheckedIndexedAccess: true`) ensuring compile-time contract enforcement |
| **Build & Dev Server** | Vite | `^5.4.0` | High-speed ESM-based development server and optimized Rollup production bundling |
| **Styling & Tokens** | Tailwind CSS | `^4.0.0` | Semantic CSS custom properties (`--bg`, `--paper`, `--ink`, `--line`), strict 4pt/8pt spatial rhythm |
| **UI Primitives** | Ant Design / Radix | `^6.0.0` | Accessible headless primitives for Dialogs, Dropdowns, Tooltips, and Accordion detail panels |
| **Iconography** | Lucide React | `^0.400.0` | Clean SVG iconography inheriting `currentColor` with explicit sizing classes (`h-4 w-4`) |
| **Chart Visualizations** | Recharts | `^2.12.0` | Declarative SVG-based charting library supporting smooth bezier curves, multi-project overlays, and crosshair tooltips |
| **Data Fetching & Cache** | TanStack Query | `^5.50.0` | Declarative asynchronous query caching, background refetching, and automatic cache invalidation |
| **URL State Synchronization** | Nuqs | `^1.17.0` | Type-safe URL query parameter synchronization for search queries (`?search=...`) and active tab states |
| **Unit & Component Testing** | Vitest + RTL | `^2.0.0` | Fast ESM unit testing runner paired with React Testing Library and jsdom for screen state assertions |
| **Typography Standard** | IBM Plex Sans Thai | System / Webfont | Universal bilingual typography supporting clean tabular numerals (`tabular-nums`) for aligned metrics |

