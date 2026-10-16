# Feasibility Assessment

## Executive Summary
This feasibility assessment evaluates the technical viability, architecture feasibility, and operational delivery for the corporate document management system dashboard (`intent-statement.md`). The solution pairs a Go backend service with a React single-page frontend application, backed by PostgreSQL and packaged using Docker Compose.

## Technical Feasibility & Viability
- **Ingestion Pipeline & Scalability**: The Go backend exposes an HTTP POST endpoint receiving `multipart/form-data` CSV uploads triggered by Power Automate. While an individual medium-sized project averages 300–500 documents, the daily payload is a multi-project database snapshot containing multiple active and historical projects. Total records will increase steadily over time as project count expands (scaling from thousands to 50,000+ rows). Go's streaming CSV decoder (`encoding/csv`) combined with chunked batch database operations (e.g. `pgx.CopyFrom` or batched bulk upserts of 500–1,000 rows) efficiently processes multi-megabyte files within seconds, ensuring negligible memory overhead and zero request timeout risks.
- **Data Storage & Indexing**: PostgreSQL provides strong ACID guarantees, structured schema modeling for multi-project transmittals and document revisions, and optimized composite B-tree indexing on `(project_id, doc_id, rev_id)` and status columns (`doc_status`, `due_date`, `last_status`). This maintains sub-second query performance for dashboard aggregations even as table volume grows into hundreds of thousands of historical records.
- **Frontend Dashboard**: A React dashboard will consume RESTful JSON endpoints from the Go backend. High-level KPI summary cards (total documents, overdue counts, returned statuses) and project-filtered categorization tables deliver the immediate readability and intuitive navigation required by executive stakeholders across all projects.

## Architectural Tradeoffs
- **Containerized Monolith vs Microservices**: A single Docker Compose setup containing the Go backend, PostgreSQL, and React web client minimizes operational complexity for the MVP while enabling clean separation of concerns and seamless future migration.
- **Snapshot Upsert vs Full Replacement**: The ingestion pipeline employs an intelligent upsert mechanism based on `(project_id, doc_id, rev_id)` and recorded snapshot ingestion timestamps. This preserves document revision histories across snapshot cycles without destructive table truncations or duplicate records.

## Platform & Compliance Synthesis
- **Platform Assessment (AWS Platform Agent)**: For the current MVP stage, the architecture targets Docker containers running in an internal environment. The containerized design remains fully portable for future transition to AWS (ECS Fargate + RDS PostgreSQL) if cloud hosting is requested as data volume scales.
- **Compliance & Governance (Compliance Agent)**: Document lists contain corporate engineering project metadata (document codes, transmittal numbers, reviewer names). Operating within an internal corporate intranet environment satisfies data confidentiality and access control expectations for the initial release.

