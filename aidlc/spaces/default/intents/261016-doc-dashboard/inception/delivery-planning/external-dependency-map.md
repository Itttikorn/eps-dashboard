# External Dependency Map

**Stage**: `delivery-planning` (2.9)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-delivery-agent`  
**Date**: 2026-10-16  

---

## 1. External Dependencies & Gated Prerequisites

The document management system dashboard is designed as a self-contained corporate application without dependencies on third-party cloud SaaS APIs, proprietary external services, or unvetted external team hand-offs:

| Dependency Name | Kind | Required By | Availability / Source | Criticality | Fallback / Mitigation |
|:---|:---|:---|:---|:---|:---|
| **PostgreSQL 16 Engine** | Infrastructure / Database | Bolt 1 (`backend`) | Public Docker Hub official image (`postgres:16-alpine`) | High | Standardized multi-stage Docker Compose container; zero external provisioning required |
| **Go 1.22+ Runtime** | Compiler & Toolchain | Bolt 1 (`backend`) | Local system or official Docker `golang:1.22-alpine` | High | Multi-stage Docker build encapsulates compilation toolchain |
| **Node.js 20+ / Vite** | Toolchain & Bundler | Bolt 2 (`frontend`) | Local system or official Docker `node:20-alpine` | High | Containerized build stage ensures deterministic frontend bundling |
| **Sample CSV Snapshot** | Test Data Fixture | Bolt 1 & Bolt 2 | Synthetic test fixture generated from the verified 23-column schema in `requirements.md` | Medium | Test fixture generator generates valid 2,000-row `AUTOEMAIL_FILE_06_*.csv` test data offline |

---

## 2. External Risk Assessment & Mitigation

1. **Third-Party API Outages**: Zero risk. The system operates entirely within the corporate network boundary without external cloud API dependencies.
2. **Schema Drift from Source Document System**:
   - The 23 columns of `AUTOEMAIL_FILE_06_*.csv` are frozen in `requirements.md`.
   - The backend streaming parser validates headers strictly upon upload, rejecting invalid schemas with clear diagnostic errors before database writes occur.
3. **Database Connectivity Latency**:
   - Backend service implements exponential retry connection logic to wait for PostgreSQL container health checks before binding HTTP ports.

