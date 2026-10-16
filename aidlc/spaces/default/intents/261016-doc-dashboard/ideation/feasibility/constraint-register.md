# Constraint Register

## Context & Scope
This register documents all technical, organizational, operational, and regulatory constraints identified during Feasibility & Constraints analysis for the document dashboard, tracing to upstream requirements in `intent-statement.md`.

## Technical Constraints
- **TC-1 (Language & Frameworks)**: Backend must be implemented in Go; frontend must be built with React.
- **TC-2 (Database Engine)**: Storage is constrained to PostgreSQL relational database with composite primary/unique key indexes on `(project_id, doc_id, rev_id)` for scalable upserts.
- **TC-3 (Ingestion Interface)**: Daily snapshot data must be received via an HTTP POST endpoint handling `multipart/form-data` CSV files dispatched by Power Automate.
- **TC-4 (Packaging & Runtime)**: The solution must be containerized and runnable via Docker / Docker Compose.
- **TC-5 (Streaming Ingestion Performance)**: The Go ingestion parser must use streaming CSV decoding (`encoding/csv`) and batch SQL operations to prevent unbounded memory growth as daily snapshot size increases with project growth.

## Operational & Schedule Constraints
- **OC-1 (Workflow Boundary)**: The upstream Power Automate workflow that retrieves daily email attachments and triggers the HTTP POST is external and outside this project's implementation scope.
- **OC-2 (Snapshot Data Volume & Scaling)**: Daily database snapshot files encompass multiple concurrent engineering projects (300–500 documents per medium project). Total records in each snapshot will increase steadily as project numbers expand (scaling from thousands to 50,000+ rows). Ingestion must scale smoothly without manual tuning.
- **OC-3 (Delivery Milestones)**: Timeline is flexible and driven by iterative executive feedback rather than rigid sprint deadlines.

## Regulatory & Security Constraints
- **RC-1 (Internal Environment)**: Dashboard is scoped for internal organizational access. No public Internet exposure is planned for the MVP.
- **RC-2 (Data Integrity)**: Database must enforce referential integrity across projects, document IDs, transmittals, and revision history.

