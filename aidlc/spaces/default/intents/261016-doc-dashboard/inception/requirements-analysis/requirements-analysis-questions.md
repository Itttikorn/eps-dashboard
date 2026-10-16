# Requirements Analysis Questions

## Q1. How should document revision history be evaluated for KPI counts and status tracking?
A. Latest revision only: for each unique (PROJECTID, DOCID), only evaluate the record with the most recent REVID / REVDATE for KPI summaries and overdue tracking
B. All revisions: count every individual revision row in the CSV snapshot as a separate trackable item
C. Distinct transmittals: group by TRANSMITTAL and report status per transmittal package
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. What exact criteria determine whether a document is classified as "Returned / Closed" vs "Pending / In Review"?
A. Populated RETURNDATE or closed status codes in LASTSTATUS (e.g., "APP", "AWC", "REJ", "CLO") indicate returned; empty RETURNDATE with blank or pending status indicates in review
B. RETURNDATE populated only, ignoring LASTSTATUS text
C. Explicit status code in STATUSALLUSER or LASTSTATUS only, ignoring dates
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. How should the Overdue Engine calculate overdue items and delinquency severity?
A. Overdue when current_date > DUEDATE and document is not returned/closed; severity categorized by days past due (1-7 days: Minor, 8-30 days: Moderate, >30 days: Critical)
B. Overdue when current_date > DUEDATE regardless of returned status
C. Simple binary flag (Overdue vs On-Time) without severity brackets
D. Not yet defined
X. Other (please specify)

[Answer]: C

## Q4. How should document types (DOCTYPE) be categorized into high-level executive functional areas?
A. 5 Standard Business Categories: (1) Drawings & Design (SLD, CBL, GA, PID, etc.), (2) Clarifications (RFI), (3) Quality & Inspection (ITP), (4) Non-Conformance & Actions (NCR, CAR), (5) Change Orders (DCR, VOR)
B. Display raw DOCTYPE codes directly in alphabetical order without grouping
C. Categorize strictly by engineering discipline (Mechanical, Electrical, Civil) rather than document purpose
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q5. How should daily snapshot CSV uploads update the database and historical trend ledger?
A. Idempotent upsert: update current document state for the project, and append aggregated daily metric totals into a historical trend ledger for weekly/monthly curve rendering
B. Full overwrite: purge previous snapshot records for the project and replace with new CSV data (no historical trend tracking)
C. Append-only raw log: store raw CSV rows into an append-only table without pre-aggregating metrics
D. Not yet defined
X. Other (please specify)

[Answer]: A (Current State + Delta Change Log + Daily Metrics Rollup)

## Q6. What user authorization and project visibility model should be enforced for the MVP dashboard?
A. Open corporate visibility: all authenticated users can view all project dashboards, with multi-project filter controls
B. Strict Project-level RBAC: users can only see projects explicitly assigned to their user ID
C. Public open access without authentication for local internal network deployment
D. Not yet defined
X. Other (please specify)

[Answer]: C (No user access control for MVP)

## Consolidated Summary Confirmation

- Document revision tracking: Evaluate latest revision only per unique (PROJECTID, DOCID) for KPI scorecards and status metrics.
- Return vs Pending criteria: Composite status logic (LASTSTATUS == '50:RETURN', RET code in ['A','AC','RC','ACK'], or populated RETURNDATE/RESPONSEDATE indicates Returned/Closed; populated TRANSMITAL_DATE without return status indicates Pending/In Review).
- Overdue tracking: Binary flag (Overdue vs On-Time when current_date > DUEDATE and document is not returned/closed) without severity aging brackets.
- Document type categorization: 5 Standard Executive / QA/QC Functional Categories matching Conzol Doc Tracker mock (Baseline Drawings, Control ITP/RFI/ITR, Corrective NCR/CAR with Owner vs Contractor flow, Change FCR/DCR/VO, Complete Punchlists, plus Overdue).
- Snapshot ingestion & database architecture: 3-table pattern (document_revisions_current live upsert, document_change_log delta events, project_daily_metrics 1 row/day) with ingestion_batches idempotency (SHA-256 hash tracking, out-of-order date check, atomic transactions).
- Trend visualization: Unlimited historical lifecycle range with flexible time presets (All Time, 1Y, 6M, 3M, Custom) and multi-project comparative overlay (simultaneous selection and overlay of multiple projects).
- Access control & project visibility: Public open internal access without authentication for local intranet deployment for MVP (no user access control).

Does this all look correct before I generate the requirements artifact?
- Looks correct
- Request changes

[Answer]: Looks correct


