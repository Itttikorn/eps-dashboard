# Functional Design Questions: Unit `backend`

**Stage**: `functional-design` (3.1)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-16  

---

### Q1: CSV Snapshot Header & Column Mapping Tolerance
The daily ingestion engine processes `AUTOEMAIL_FILE_06_*.csv` snapshots with 23 standard columns (`PROJECTID`, `DOCID`, `REVID`, `DISCIPLINE`, `DISCIPLINE_NAME`, `TITLE`, `DOCSTATUS`, `COMPANY`, `WBSID`, `DOCTYPE`, `REVDATE`, `PLANDATE`, `TRANSMITTAL`, `TRANSMITAL_DATE`, `ISSUEFOR`, `DUEDATE`, `RETURNDATE`, `RET`, `RESPONSEDATE`, `REMARK`, `LASTSTATUS`, `COMMENTLIST`, `STATUSALLUSER`). How strictly should the Go CSV ingestion parser handle header variations, case sensitivity, and unexpected columns?

- A. Strict 23-column exact match — enforce exact header casing and column ordering; reject any CSV file with extraneous columns, missing columns, or altered casing with HTTP 400.
- B. Resilient header mapping (Recommended) — case-insensitive and whitespace-trimmed header matching; require all 23 core columns to be present in any order, while safely ignoring unexpected extra columns.
- C. Permissive column mapping — require only the minimum primary keys and status fields (`PROJECTID`, `DOCID`, `REVID`, `DOCTYPE`, `DUEDATE`, `LASTSTATUS`); fill any missing optional columns with defaults.
- X. Other (please specify)

[Answer]: B. Resilient header mapping

---

### Q2: Document Revision Supersession & Active State Maintenance
When a new snapshot contains a new revision (`REVID`) for an existing document (`PROJECTID`, `DOCID`), how should the backend maintain live records in `document_revisions_current` to optimize sub-millisecond query performance?

- A. Overwrite in-place with latest revision (Recommended) — maintain exactly one row per `(project_id, doc_id)` in `document_revisions_current` containing the highest revision, recording all superseded field deltas into `document_change_log` without historical snapshot table bloat.
- B. Multi-revision current table — store all historical revisions within `document_revisions_current` with an indexed `is_latest` boolean flag, filtering by `is_latest = TRUE` on queries.
- C. Active + archive table separation — move superseded revisions to a separate `document_revisions_history` table and keep only the latest revision in `document_revisions_current`.
- X. Other (please specify)

[Answer]: A. Overwrite in-place with latest revision

---

### Q3: Overdue Horizon & Reference Evaluation Anchor
A document revision is defined as overdue if due date is exceeded and status is not returned (`DUEDATE < anchor_date` AND `LASTSTATUS != '50:RETURN'`). What date should be used as the benchmark anchor for overdue calculations and historical daily rollups?

- A. Snapshot date as anchor (Recommended) — evaluate overdue status against the snapshot date parsed from the CSV filename/transmittal date. Guarantees deterministic historical reproducibility and prevents artificial overdue shifts during historical batch re-runs.
- B. Live system clock (CURRENT_DATE) anchor — evaluate overdue status dynamically against the server's current calendar date whenever queried.
- C. Dual anchor strategy — persist static overdue flags during ingestion using the snapshot date, while dynamically recalculating real-time elapsed overdue days in API response serialization.
- X. Other (please specify)

[Answer]: A. Snapshot date as anchor

---

### Q4: Corrective Actions (NCR/CAR) Directional Flow Classification
Requirements state that Corrective Action documents (NCR, CAR) must be classified by flow direction (`Owner → EPS` vs `EPS → Contractor/ผรม`) to distinguish client punch-ins from contractor defaults. How should the domain engine determine this flow direction from CSV metadata?

- A. Company and transmittal prefix matching (Recommended) — derive direction from `COMPANY` and `TRANSMITTAL` prefix/suffix (e.g. if `COMPANY` contains 'SCG' or transmittal originates from Owner code, classify as `OWNER_TO_EPS`; otherwise classify as `EPS_TO_CONTRACTOR`).
- B. Configurable contractor mapping table — maintain an internal database mapping table associating contractor company IDs and codes with flow roles.
- C. WBSID and transmittal segment parsing — parse the structured WBS hierarchy code and transmittal document type suffix to establish responsibility.
- X. Other (please specify)

[Answer]: Excluded — No directional splitting (Owner vs Contractor); track unified NCR/CAR metrics (Total, Open, Closed, Overdue, Average Aging) as agreed.

---

### Q5: Ingestion Transaction Atomicity & Row Validation Error Handling
If an uploaded CSV file contains 2,000 rows where a small fraction (e.g., 2 rows) fails validation due to missing mandatory identifiers (`DOCID` or `PROJECTID`) or malformed dates: how should the ingestion transaction handle the error?

- A. Strict fail-fast all-or-nothing (Recommended) — roll back the entire database transaction, reject the batch, and return HTTP 400 with a detailed error list naming corrupted rows and columns so the source file can be corrected.
- B. Quarantine invalid rows — commit the valid rows in an atomic transaction, write rejected rows to an `ingestion_quarantine_log` table, and return HTTP 201 with warning diagnostics.
- C. Skip and log warning — silently skip invalid rows, ingest all valid rows, and record a summary warning note in `ingestion_batches`.
- X. Other (please specify)

[Answer]: A. Strict fail-fast all-or-nothing

---

## Consolidated Summary Confirmation

- **Q1 (Header mapping tolerance)**: B. Resilient header mapping — case-insensitive and whitespace-trimmed header matching; require all 23 core columns in any order, safely ignoring unexpected extra columns.
- **Q2 (Document revision supersession)**: A. Overwrite in-place with latest revision — maintain exactly one row per `(project_id, doc_id)` containing the highest revision in `document_revisions_current`, recording all superseded field deltas into `document_change_log`.
- **Q3 (Overdue evaluation anchor)**: A. Snapshot date as anchor — evaluate overdue status against the snapshot date parsed from the CSV filename/transmittal date, guaranteeing deterministic historical reproducibility and avoiding artificial overdue shifts.
- **Q4 (Corrective actions flow classification)**: Excluded — No directional splitting (`Owner → EPS` vs `EPS → Contractor`); track unified NCR/CAR metrics (Total, Open, Closed, Overdue, Average Aging).
- **Q5 (Ingestion error handling)**: A. Strict fail-fast all-or-nothing — roll back the entire database transaction, reject the batch, and return HTTP 400 with a detailed error list naming corrupted rows and columns so the source file can be corrected.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
