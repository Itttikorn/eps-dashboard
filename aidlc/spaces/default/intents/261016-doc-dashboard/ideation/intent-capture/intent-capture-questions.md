# Intent Capture Questions

## Sources

- [desc] Initial description: "Create a corporate document management system dashboard"
- [scope] Workflow-selected scope: `mvp`.

## Q1. What core business problem is the document management dashboard solving?
A. Lack of visibility into pending, overdue, and returned engineering document deliverables across projects
B. Inability to monitor vendor/engineering contractor transmittal compliance and response turnaround times
C. Disconnected daily email reports causing manual data consolidation and delay in identifying project bottlenecks
D. Not yet defined
X. Other (please specify)

[Answer]: A, It's hard for executives to be looking at the real document database tables

## Q2. Who is the primary target user/customer for this dashboard, and what pain do they experience?
A. Project managers and project directors needing high-level health metrics, overdue counts, and document completion status
B. Document controllers and lead engineers tracking transmittal turnaround, return dates, and discipline-specific submissions
C. Corporate management and cross-functional teams monitoring multiple concurrent engineering projects
D. Not yet defined
X. Other (please specify)

[Answer]: Mostly a and c, they need an easy to read and easy to understand dashboard

## Q3. What measurable outcomes and metrics define success for this dashboard?
A. Accurate document categorization, clear overdue document visibility, and transmittal turnaround tracking
B. Automated daily ingestion eliminating manual spreadsheet handling and reducing reporting lag
C. Active adoption by project teams to review project document status without requiring ad-hoc queries
D. None defined at this stage
X. Other (please specify)

[Answer]: D

## Q4. What is the primary trigger or driver for initiating this project now?
A. Operational necessity to automate tracking of daily document snapshots sent from engineering document systems
B. Project governance and compliance requirements to prevent delivery schedule overruns due to delayed document reviews
C. Technical modernization to replace manual email/Excel parsing with a dedicated Go backend and React dashboard
D. Not yet defined
X. Other (please specify)

[Answer]: X, it's hard for executives to view the database tables

## Q5. Who are the key stakeholders and what is their primary area of interest?
A. Document Control (transmittal logging, document status integrity), Engineering Leads (discipline deliverables: EE, ME, etc.), and Project Management (schedule & overdue risks)
B. IT/System Integration team (Go API security, SQL database reliability, Power Automate integration) and Business Management (project health reports)
C. External clients and engineering contractors (timely reviews and transmittals)
D. Not identified
X. Other (please specify)

[Answer]: X, executives

## Q6. Who holds authority for scope decisions and priority trade-offs for this system?
A. Project Manager / Product Owner responsible for project delivery
B. Lead Document Controller / Engineering Operations Lead
C. Shared governance between Engineering Management and IT
D. Not yet defined
X. Other (please specify)

[Answer]: D

## Q7. What are the operational reporting and communication expectations for this dashboard?
A. Daily automated ingestion reflecting updated daily document snapshots, with real-time web dashboard access for stakeholders
B. Weekly summary reporting / exportable dashboard views alongside daily dashboard updates
C. On-demand filtering by project, discipline, document type, and overdue status
D. None / Not applicable
X. Other (please specify)

[Answer]: A

## Q8. The workflow was started with the `mvp` scope. Does this match your intended product boundary?
A. Confirm `mvp` scope: Build core Go backend (HTTP ingestion endpoint, SQL storage, status calculation) and React frontend (overdue tracking, document type table, project status summary)
B. Adjust to `poc` scope: Minimal functional prototype focusing strictly on parsing the CSV snapshot and rendering a basic table
C. Expand to `feature` scope: Include advanced alerting, historical trend analytics, and user role-based access control
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
