# Scope Definition Questions

## Q1. What specific categorization and summary metrics must the React dashboard display?
A. Document type categorization table (counts per DOCTYPE: SLD, IOL, CBL, etc.), overdue document count, and overall project status summary
B. Multi-discipline view (counts categorized by DISCIPLINE: EE, ME, Civil, etc.) in addition to DOCTYPE counts
C. High-level executive KPI scorecard (Total Documents, Total Overdue, In Review, Approved) followed by detailed category breakdown
D. Not yet defined
X. Other (please specify)

[Answer]: QA/QC workflow categories directly derived from real CSV snapshot data: Drawing milestones (FS, ML, PR, GA, LD, FD, SLD, IOL, CBL, etc.), Control records (ITP, RFI), Corrective actions (NCR, CAR), Changes (DCR, VOR), Overdue tracking (`today > DUEDATE` without return), discipline breakdowns (ME, CE, EE), and executive KPI totals. Data not in CSV (Site S-curve progress, planned quotas, and Punchlists A/B) are excluded.

## Q2. How should the system determine and flag that a document is "overdue"?
A. Current date > `DUEDATE` where the document does not yet have a completion/return status (`RETURNDATE` is empty or status is pending)
B. Document turnaround time exceeds standard SLA based on `TRANSMITAL_DATE` and `ISSUEFOR` code (e.g. IFA vs IFI)
C. Based strictly on `LASTSTATUS` code (e.g. non-zero flow without return)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. How should multi-project document visibility be structured on the dashboard?
A. Multi-project dashboard showing an executive project overview table, with the ability to filter or drill down into individual projects
B. Single active project selector dropdown at the top, updating all dashboard metrics for the chosen project
C. Unified view displaying all documents across all projects simultaneously
D. Not yet defined
X. Other (please specify)

[Answer]: A, structured as a project comparison matrix table (Project Name, Site Code, Total Documents, Overdue Count, QA/QC column metrics, and Net Backlog Trend) with expandable drawers for discipline breakdowns.

## Q4. What document detail or search/filter features are needed for the MVP?
A. Filter by Project, Document Type, Discipline, and Overdue Status; search by Document ID or Title
B. Read-only summary metrics table without row-level document search
C. Full row-level document register table with pagination, sorting, and CSV export
D. Not yet defined
X. Other (please specify)

[Answer]: A, with instant search by Project Name / Site Code, sorting by Overdue / Pending / Project Name, and expandable row details showing discipline and DOCTYPE distributions.

## Q5. Which capabilities should be explicitly OUT OF SCOPE for this MVP release?
A. Out of scope: In-browser PDF/binary file viewing, manual editing of document records in the web UI, user authentication/roles, and the external Power Automate setup
B. Out of scope: Historical trend analytics, email alert notifications, and external user portals
C. Both A and B are explicitly out of scope for MVP
D. Not yet defined
X. Other (please specify)

[Answer]: Exclude all data and features not in the current CSV dataset: Site S-curve progress (SharePoint physical progress), planned drawing quotas (`plan`), Punchlist Set A/B, in-browser PDF viewing, row-level metadata editing, authentication/RBAC, and external Power Automate setup. Keep Historical Trends and frontend manual CSV upload in scope.

## Q6. What is the delivery sequencing preference for the MVP units?
A. Ingestion-first: Build and verify the Go CSV ingestion and SQL storage pipeline first, then build the React dashboard
B. UI-first: Mock the dashboard UI and metrics cards first with sample data, then connect the Go backend
C. Vertical slice: Implement end-to-end ingestion and display for one project, then expand to multi-project dashboard
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
