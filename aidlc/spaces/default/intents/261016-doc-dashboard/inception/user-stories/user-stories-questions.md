# User Stories Questions & Planning

## Q1. What primary breakdown approach should be used to organize the user stories?
A. Epic-based functional breakdown: Organize stories into 4 functional epics: (1) Daily CSV Ingestion & Delta Engine, (2) Multi-Project Comparative Overview & Delinquency Scorecard, (3) Discipline & Document-Type Drill-Down Accordion, (4) Unlimited Multi-Project Trend Analytics & S-Curve Progress
B. Persona-based breakdown: Organize stories grouped by actor (Executive Director, Project Manager, Discipline Lead Engineer, Document Controller)
C. QA/QC Workflow breakdown: Group stories strictly by the 5 lifecycle stages (Baseline, Control, Corrective, Change, Complete)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. What story granularity and acceptance criteria format should be enforced?
A. BDD Given/When/Then scenarios with three-segment IDs (e.g., AC1.1.1) and MoSCoW priorities, ensuring testable criteria for unit and integration testing
B. Simplified bulleted checklist without formal Given/When/Then structure
C. High-level descriptive user goals without detailed scenario test fixtures
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. Which user personas should be established as primary actors in personas.md?
A. 4 Core EPC Roles: (1) Executive Director / Plant Owner (comparative health, overdue alerts, trend lines), (2) Project Manager (site schedule, net backlog change, contractor speed), (3) Discipline Lead Engineer (ME/CE/EE drawings, NCR/CAR aging), (4) Document Controller / Admin (upload health, batch verification, delta tracking)
B. 2 Simplified Roles: (1) Dashboard Viewer, (2) CSV Uploader
C. Single Unified Role: Corporate Internal Team Member
D. Not yet defined
X. Other (please specify)

[Answer]: B (2 Simplified Roles: Dashboard Viewer and CSV Uploader)

## Consolidated Summary Confirmation

- Story breakdown: Epic-based functional breakdown across 4 core epics (Ingestion & Delta Engine, Comparative Overview Matrix & Delinquency Scorecard, Discipline & Type Drill-Down, Unlimited Multi-Project Historical Trend Analytics).
- Acceptance criteria format: BDD Given/When/Then scenarios with stable three-segment IDs (AC{epic}.{story}.{crit}) and MoSCoW prioritization.
- User personas: 2 simplified roles: Dashboard Viewer (primary executive & engineering observer) and Data Administrator / CSV Uploader (secondary operational ingestor).
- Out-of-scope boundaries: Strict adherence to scope-document.md exclusions (no S-curves, no drawing quotas, no punchlists, no in-browser editing, no authentication/RBAC).

Does this all look correct before I generate the user stories artifacts?
- Looks correct
- Request changes

[Answer]: Looks correct


