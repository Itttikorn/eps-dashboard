# Infrastructure Specification: Unit `backend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Scope

This specification formalizes the deployment topology, containerized compute architecture, networking, storage persistence, and infrastructure service sizing for the Go backend service and PostgreSQL 16 database, tracing from:
- `performance-design.md`: Sub-10ms query execution directly from PostgreSQL RAM buffers and connection pool sizing (`MaxOpenConns: 25`, `MaxIdleConns: 10`).
- `security-design.md`: Non-root container isolation, intranet network boundaries, and environment-driven secret injection (`NFR6.5`).
- `scalability-design.md`: Decoupled 3-tier storage architecture and bounded memory allocations (`NFR2.1`, `NFR2.2`).
- `reliability-design.md`: Layered startup resilience, PostgreSQL health probes, and graceful teardown (`NFR4.3`, `NFR4.4`, `NFR4.5`).
- `infrastructure-design-questions.md`: Q1 confirmed explicit Docker Compose health checks with `service_healthy` condition; Q2 confirmed named Docker volume `postgres_data`.

---

## 2. Deployment Architecture

The system executes as a multi-container topology orchestrated by Docker Compose on local workstations and corporate intranet VMs.

| Facet | Choice | Rationale |
|:---|:---|:---|
| **Compute Model** | Multi-stage Docker Container (`wa-backend`) | Built on `golang:1.22-alpine` builder and `alpine:3.20` runtime. Strips debug symbols, compiler toolchains, and package managers, producing a minimal static binary ($\approx 25\text{ MB}$) running under an unprivileged `appuser` (`UID 10001`). |
| **Networking Topology** | Internal Docker Bridge Network (`eps-net`) | Isolated user-defined bridge network (`172.28.0.0/16`). Backend container resolves database via Docker embedded DNS (`postgres:5432`). Port `8080:8080` bound to host interface; PostgreSQL port `5432` bound only to internal network (optionally exposed locally for admin). |
| **Storage Strategy** | Named Docker Volume (`postgres_data`) | Persistent database files stored in Docker-managed volume (`/var/lib/postgresql/data`). Provides native host NVMe/SSD I/O throughput without filesystem translation layers, clean permission isolation, and seamless cross-platform host portability. |
| **Environment Layout** | Single-Compose Promotion (`dev` $\rightarrow$ `staging` $\rightarrow$ `main`) | Uniform container topology across all promotion environments. Configuration differences (ports, database credentials, log levels) parameterized strictly via `.env` files and environment variables. |
| **IaC / Orchestration** | Declarative Docker Compose v2 (`docker-compose.yml`) | Declarative container specification incorporating service health checks, resource ceilings, log rotation, and restart policies without requiring external cloud infrastructure orchestrators. |
| **Resource Sizing** | Backend: 1.0 CPU, 512 MB RAM<br>PostgreSQL: 2.0 CPU, 1.0 GB RAM | Backend operates within bounded memory footprint ($< 64\text{ MB}$ normal, $< 128\text{ MB}$ during peak CSV streaming). PostgreSQL allocated 256 MB `shared_buffers` ensuring the entire active revision working set ($< 10\text{ MB}$) resides permanently in RAM. |

---

## 3. Infrastructure Services

| Service | Role | Configuration | Notes |
|:---|:---|:---|:---|
| **`postgres:16-alpine`** | Primary Relational Database | - Image: `postgres:16-alpine`<br>- Storage: `postgres_data:/var/lib/postgresql/data`<br>- Health Check: `pg_isready -U postgres -d eps_dashboard`<br>- Interval: `5s`, Timeout: `3s`, Retries: `5`<br>- `shared_buffers`: `256MB`<br>- `work_mem`: `16MB`<br>- `max_connections`: `100` | Manages 3-tier storage schema (`document_revisions_current`, `document_change_log`, `project_daily_metrics`). Health probe guarantees database readiness before dependent service startup. |
| **`wa-backend`** | API & Streaming Ingestion Engine | - Build: `./backend/Dockerfile`<br>- Ports: `8080:8080`<br>- Network: `eps-net`<br>- Depends On: `postgres` with `condition: service_healthy`<br>- Restart: `unless-stopped`<br>- User: `10001:10001`<br>- Read-Only Rootfs: `true` (with `/tmp` tmpfs) | Implements Chi router, CSV streaming ingestion, overdue calculations, and universal JSON response envelopes. Bound to port 8080 only after running forward migrations. |

---

## 4. Shared Infrastructure

| Shared Resource | Owner Unit | Consumer Units | Access Boundary |
|:---|:---|:---|:---|
| **`postgres:16-alpine`** | `backend` (`U1`) | `backend` (API), Migration Runner | Accessed internally over `eps-net:5432` with username/password authentication. Schema migrations owned and executed exclusively by the backend service on boot. |
| **`eps-net`** (Bridge Network) | `backend` (`U1`) | `backend` (`U1`), future `frontend` (`U2`) | Private bridge network with DNS service discovery. Prevents external internet ingress to database while routing HTTP traffic between reverse proxy, frontend, and backend. |
| **`postgres_data`** (Volume) | `backend` (`U1`) | `postgres` service exclusively | Volume mounted read-write only to `/var/lib/postgresql/data`. Direct host container access restricted by Docker daemon file permissions. |

---

## 5. Container Hardening & Environment Variables

### 5.1 Dockerfile Structure
```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
WORKDIR /src
RUN apk add --no-cache git ca-certificates tzdata
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

FROM alpine:3.20
RUN adduser -D -u 10001 -g appuser appuser
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/server /app/server
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["/app/server"]
```

### 5.2 Environment Variables Register
| Variable | Description | Default / Example | Security Classification |
|:---|:---|:---|:---|
| `SERVER_PORT` | HTTP listener port | `8080` | Non-sensitive |
| `DB_HOST` | Database hostname | `postgres` | Non-sensitive |
| `DB_PORT` | Database port | `5432` | Non-sensitive |
| `DB_USER` | Database username | `postgres` | Non-sensitive |
| `DB_PASSWORD` | Database password | *Injected via secret / .env* | **Confidential Secret** |
| `DB_NAME` | Database schema name | `eps_dashboard` | Non-sensitive |
| `DB_SSLMODE` | SSL connection mode | `disable` (internal Docker bridge) | Non-sensitive |
| `LOG_LEVEL` | Application logging level | `INFO` (`DEBUG`, `WARN`, `ERROR`) | Non-sensitive |
| `MAX_UPLOAD_SIZE_MB` | Body ceiling limit | `10` | Non-sensitive |

