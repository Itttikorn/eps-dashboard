# Contract Summary Specification

**Stage**: `contract-design` (2.8)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-architect-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Inputs

This contract specification formalizes the inter-unit interface boundary defined across upstream design artifacts:
* [Units of Work Specification](../units-generation/unit-of-work.md): Defines `backend` (`U1`, kind: `service`, directory: `backend`) and `frontend` (`U2`, kind: `ui`, directory: `frontend`).
* [Unit Dependency Topology](../units-generation/unit-of-work-dependency.md): Defines the ingestion-first directed dependency edge where `frontend` depends on `backend`.
* [Component Catalogue & Architecture](../domain-design/components.md): Derives entity schemas from `IngestionEngine`, `DocumentTrackingDomain`, and `HistoricalAnalyticsDomain`.
* [Requirements Specification](../requirements-analysis/requirements.md): Enforces response latencies ($< 50\text{ ms}$ for analytics, $< 500\text{ ms}$ for 2,000-row ingestion) and standard HTTP envelopes.
* [Backend Standards](../../knowledge/aidlc-shared/backend-standards.md): Governs route URI conventions, HTTP status codes, and the universal 4-field envelope (`status`, `result`, `total`, `search_params`).
* [Frontend Standards](../../knowledge/aidlc-shared/frontend-standards.md): Enforces responsive tabular layouts, 4 mandatory UI states, and English typography.

---

## 2. Contracts Master Register

The system integration surface comprises one primary inter-unit boundary, serving both as the internal inter-unit contract and the client-facing presentation API:

| # | Provider Unit | Consumer | Mechanism | Owner | Scope & Surface |
|:---|:---|:---|:---|:---|:---|
| 1 | `backend` (`U1`) | `frontend` (`U2`) | Synchronous REST / HTTP JSON | `backend` (`U1`) | Core application API (`/api/v1/health`, `/api/v1/projects`, `/api/v1/projects/summary`, `/api/v1/analytics/trends`, `/api/v1/ingest`) |

---

## 3. Formal OpenAPI 3.0 Specification

The following fenced YAML block defines the complete, immutable OpenAPI 3.0.3 contract between `backend` and `frontend`. Both the backend construction session and frontend construction session must implement and consume this exact contract:

```yaml
openapi: 3.0.3
info:
  title: Corporate Document Management System Dashboard API
  version: 1.0.0
  description: >
    Formal RESTful interface contract between the backend Go service and the
    frontend React SPA dashboard. Implements the organizational universal envelope
    contract (status, result, total, search_params) per backend-standards.md.
servers:
  - url: http://localhost:8080/api/v1
    description: Local development backend container
paths:
  /health:
    get:
      summary: Service Health & Readiness Check
      description: Returns service liveness, uptime, and PostgreSQL connectivity flag.
      operationId: getHealth
      responses:
        '200':
          description: Service is healthy and database is connected
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /projects/summary:
    get:
      summary: Global Executive Topbar KPIs
      description: Returns aggregate document metrics, category distribution counts, and total overdue count across all active projects.
      operationId: getGlobalSummary
      responses:
        '200':
          description: Successfully retrieved global metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GlobalSummaryResponse'
        '500':
          $ref: '#/components/responses/ServerError'

  /projects:
    get:
      summary: Comparative Multi-Project Matrix Grid
      description: Returns side-by-side project metrics across 5 QA/QC categories, overdue counts, search filtering, and pagination.
      operationId: listProjects
      parameters:
        - name: search
          in: query
          required: false
          description: Search filter query string matching project ID or site code
          schema:
            type: string
        - name: page
          in: query
          required: false
          description: Page number for pagination (minimum 1, default 1)
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: page_size
          in: query
          required: false
          description: Number of project rows per page (minimum 1, maximum 100, default 20)
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
      responses:
        '200':
          description: Successfully retrieved project matrix rows
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectMatrixListResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/ServerError'

  /analytics/trends:
    get:
      summary: Multi-Project Historical Time-Series Analytics
      description: Returns daily aggregated document volumes for selected projects across full historical lifecycles or preset windows.
      operationId: getHistoricalTrends
      parameters:
        - name: project_ids
          in: query
          required: false
          description: Comma-separated list of project IDs to filter (e.g. "PRJ-01,PRJ-02")
          schema:
            type: string
        - name: start_date
          in: query
          required: false
          description: Start date filter in YYYY-MM-DD format
          schema:
            type: string
            format: date
        - name: end_date
          in: query
          required: false
          description: End date filter in YYYY-MM-DD format
          schema:
            type: string
            format: date
        - name: preset
          in: query
          required: false
          description: Predefined time window scaling preset
          schema:
            type: string
            enum: [all_time, 1_year, 6_months, 3_months]
      responses:
        '200':
          description: Successfully retrieved time-series trend data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HistoricalTrendsResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/ServerError'

  /ingest:
    post:
      summary: Upload Daily Snapshot CSV File
      description: Ingests AUTOEMAIL_FILE_06_*.csv snapshot, executes in-memory diffing, upserts active revisions, and computes daily metrics.
      operationId: uploadSnapshotCSV
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
              properties:
                file:
                  type: string
                  format: binary
                  description: UTF-8 encoded CSV file adhering to the 23-column schema (max 10MB)
      responses:
        '200':
          description: Idempotent duplicate recognized (SHA-256 match); processing bypassed safely
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestionResponse'
        '201':
          description: Snapshot successfully parsed, state diffed, and committed to database
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IngestionResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          description: Out-of-order snapshot conflict or state regression rejected
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          $ref: '#/components/responses/ServerError'

components:
  responses:
    BadRequest:
      description: Syntactically invalid payload, missing parameters, or corrupted CSV schema
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ServerError:
      description: Unexpected internal server fault, database failure, or rollback
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

  schemas:
    StatusInfo:
      type: object
      required:
        - code
        - header
        - description
      properties:
        code:
          type: integer
          example: 1000
          description: Organizational status code (1000=Success, 1799=Conflict, 1801=Invalid Request, 1802=Not Found, 1900=Server Error)
        header:
          type: string
          example: Success
          description: High-level outcome category
        description:
          type: string
          example: Operation completed successfully
          description: Context-specific outcome or error diagnostic

    HealthResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
        result:
          type: object
          required:
            - service
            - database
            - timestamp
          properties:
            service:
              type: string
              example: UP
            database:
              type: string
              example: CONNECTED
            timestamp:
              type: string
              format: date-time
              example: "2026-10-16T16:50:00Z"

    GlobalSummary:
      type: object
      required:
        - total_projects
        - total_documents
        - total_overdue
        - category_counts
        - last_updated_at
      properties:
        total_projects:
          type: integer
          example: 12
        total_documents:
          type: integer
          example: 18450
        total_overdue:
          type: integer
          example: 142
        category_counts:
          type: object
          required:
            - baseline_drawings
            - control
            - corrective
            - change
            - complete
          properties:
            baseline_drawings:
              type: integer
              example: 7200
            control:
              type: integer
              example: 4100
            corrective:
              type: integer
              example: 1250
            change:
              type: integer
              example: 900
            complete:
              type: integer
              example: 5000
        last_updated_at:
          type: string
          format: date-time
          example: "2026-10-16T09:30:00Z"

    GlobalSummaryResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
        result:
          $ref: '#/components/schemas/GlobalSummary'

    CategoryMetrics:
      type: object
      required:
        - total
        - pending_pct
        - is_critical
      properties:
        total:
          type: integer
          example: 45
        open:
          type: integer
          example: 22
        closed:
          type: integer
          example: 23
        pending_pct:
          type: number
          format: float
          example: 48.9
          description: Pending ratio percentage (Open / (Open + Closed) * 100)
        is_critical:
          type: boolean
          example: true
          description: Flagged true if pending_pct >= 45% (triggers pulsing visual alert)
        avg_age_days:
          type: number
          format: float
          example: 18.5
          description: Applicable to corrective actions (average age from transmit date)

    ProjectMatrixRow:
      type: object
      required:
        - project_id
        - site_code
        - project_name
        - baseline_drawings
        - control
        - corrective
        - change
        - overdue_count
        - net_change
        - last_snapshot_date
      properties:
        project_id:
          type: string
          example: PRJ-001
        site_code:
          type: string
          example: BKK-01
        project_name:
          type: string
          example: Central Logistics Hub
        baseline_drawings:
          type: integer
          example: 850
        control:
          $ref: '#/components/schemas/CategoryMetrics'
        corrective:
          $ref: '#/components/schemas/CategoryMetrics'
        change:
          $ref: '#/components/schemas/CategoryMetrics'
        overdue_count:
          type: integer
          example: 14
        net_change:
          type: string
          enum: [IMPROVING, DEGRADING, STABLE]
          example: IMPROVING
        last_snapshot_date:
          type: string
          format: date
          example: "2026-10-15"

    ProjectMatrixListResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
        result:
          type: array
          items:
            $ref: '#/components/schemas/ProjectMatrixRow'
        total:
          type: integer
          example: 12
        search_params:
          type: object
          properties:
            search:
              type: string
              example: BKK
            page:
              type: integer
              example: 1
            page_size:
              type: integer
              example: 20

    ProjectMetricPoint:
      type: object
      required:
        - total_documents
        - overdue_count
      properties:
        total_documents:
          type: integer
          example: 1240
        overdue_count:
          type: integer
          example: 15

    DateMetricPoint:
      type: object
      required:
        - date
        - project_metrics
      properties:
        date:
          type: string
          format: date
          example: "2026-10-15"
        project_metrics:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/ProjectMetricPoint'
          example:
            PRJ-001:
              total_documents: 1250
              overdue_count: 14
            PRJ-002:
              total_documents: 980
              overdue_count: 5

    HistoricalTrendsResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
        result:
          type: array
          items:
            $ref: '#/components/schemas/DateMetricPoint'
        search_params:
          type: object
          properties:
            project_ids:
              type: string
              example: "PRJ-001,PRJ-002"
            start_date:
              type: string
              example: "2026-01-01"
            end_date:
              type: string
              example: "2026-10-15"
            preset:
              type: string
              example: "all_time"

    IngestionResult:
      type: object
      required:
        - batch_id
        - file_sha256
        - status
        - snapshot_date
        - total_rows
        - deltas_updated
        - skipped_unchanged
        - created_at
      properties:
        batch_id:
          type: string
          format: uuid
          example: "e48ff318-e2d1-41a0-996d-d5d0085eae29"
        file_sha256:
          type: string
          example: "a7050cb850111184e176d5a329e740d273e468bbb5cb1fc38758e0a65a9b8299"
        status:
          type: string
          enum: [INGESTED, ALREADY_INGESTED]
          example: INGESTED
        snapshot_date:
          type: string
          format: date
          example: "2026-10-15"
        total_rows:
          type: integer
          example: 2150
        deltas_updated:
          type: integer
          example: 45
        skipped_unchanged:
          type: integer
          example: 2105
        created_at:
          type: string
          format: date-time
          example: "2026-10-16T09:30:15Z"

    IngestionResponse:
      type: object
      required:
        - status
        - result
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
        result:
          $ref: '#/components/schemas/IngestionResult'

    ErrorResponse:
      type: object
      required:
        - status
      properties:
        status:
          $ref: '#/components/schemas/StatusInfo'
```

---

## 4. Contract Ownership & Governance Rules

1. **Spec Authority**: The `backend` unit owns and serves the implementation of this specification.
2. **Additive Evolution**: Downstream consumers (`frontend`) must practice tolerant parsing: unknown or newly introduced additive fields in response payloads must be ignored without client runtime failure.
3. **Breaking Change Freeze**:
   - URL routes (`/api/v1/*`), required query parameter names, and core envelope keys (`status`, `result`, `total`, `search_params`) are strictly frozen across the separate backend and frontend construction sessions.
   - Any proposed modification to route names or required parameters requires an explicit RFC decision log entry in `decisions.md` before implementation.
4. **Error Handling Integrity**:
   - The frontend client must inspect `status.code` rather than parsing plaintext strings.
   - Server must never leak raw database SQL statements or internal stack traces in `status.description`.

---

## 5. Open Questions & Boundary Invariants

| Contract | Question | Blocks | Resolution / Status |
|:---|:---|:---|:---|
| `/api/v1/ingest` | Should CSV upload accept compressed `.zip` / `.gz` files? | Neither unit | Resolved: MVP accepts uncompressed `.csv` files up to 10MB; compression deferred to post-MVP. |
| `/api/v1/analytics/trends` | Maximum date range resolution for long-lived projects? | Neither unit | Resolved: Backend serves daily granularity aggregated from `project_daily_metrics`; frontend downsamples points automatically if rendering $> 500$ points. |

