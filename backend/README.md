# EPS Dashboard — Backend Service

High-performance Go backend service for the Engineering Projects & Deliverables Dashboard (EPS Dashboard). Built with Go 1.22+, Chi v5 router, PostgreSQL 16, and GORM.

## Architecture

- **`cmd/server/main.go`**: Application entrypoint with graceful shutdown and automated migrations.
- **`internal/config/`**: Environment-based configuration loader with connection pool settings.
- **`internal/model/`**: GORM data models (`Project`, `Document`, `Discipline`, `KPISnapshot`, `OverdueLog`).
- **`internal/repository/`**: 3-tier persistence repository with transactions, batch upsert, and aggregations.
- **`internal/service/`**: Core business domain logic:
  - `csv_parser.go`: Streaming CSV parser with BOM stripping and defensive CSV formula injection protection.
  - `ingest_service.go`: Transactional snapshot ingestion with chronological downgrade protection.
  - `overdue_service.go`: Overdue calculation and aging bracket distribution (`0-30`, `31-60`, `61-90`, `>90`).
  - `metrics_service.go`: Macro executive KPI cards, project matrix sorting/filtering, discipline breakdown, and historical trend series.
- **`internal/transport/http/`**: Transport layer:
  - `envelope.go`: Universal 4-field corporate API response envelope.
  - `middleware.go`: Security headers (`nosniff`, `DENY`), `X-Request-ID` correlation, structured JSON logging (`slog`), and CORS.
  - `handler.go`: HTTP endpoints (`/api/v1/health`, `/api/v1/ingest`, `/api/v1/projects/*`, `/api/v1/analytics/trends`).
  - `router.go`: Chi router setup.

## Running Locally

### Prerequisites
- Go 1.22+
- PostgreSQL 16 (or run via Docker Compose)

### Running Tests
```bash
# Run unit test suite
make test

# Run tests with race detector (requires CGO)
make test-race

# Check line coverage
make cover
```

### Running with Docker Compose
```bash
# Start PostgreSQL and Backend services
docker compose up -d

# Check health
curl http://localhost:8080/api/v1/health
```

### API Endpoints

- `GET /api/v1/health`: Readiness probe
- `POST /api/v1/ingest`: Multipart form upload (`file=@snapshot.csv`)
- `GET /api/v1/projects/summary`: Macro KPI summary cards
- `GET /api/v1/projects`: Comparative project matrix (`?search=...&sort_by=...&sort_dir=...`)
- `GET /api/v1/projects/{projectCode}`: Project details and latest snapshot
- `GET /api/v1/projects/{projectCode}/overdue`: Overdue aging breakdown and document items
- `GET /api/v1/projects/{projectCode}/disciplines`: Discipline metrics breakdown
- `GET /api/v1/analytics/trends`: Historical time-series trends (`?project_code=...&from=...&to=...`)

