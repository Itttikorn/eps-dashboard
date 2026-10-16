# Feasibility & Constraint Questions

## Q1. What SQL database engine and hosting environment should the Go backend use?
A. PostgreSQL (hosted on cloud like AWS RDS or standard internal server)
B. SQLite / embedded SQL (lightweight, zero-management single-file storage for MVP)
C. Microsoft SQL Server / MySQL (corporate standard relational DB)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. How will the Power Automate workflow deliver the daily document snapshot to the Go backend HTTP endpoint?
A. Direct multipart/form-data CSV file upload via HTTP POST
B. JSON payload containing the parsed document rows via HTTP POST
C. HTTP POST notification with a secure download URL to retrieve the CSV from OneDrive/SharePoint/S3
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. What is the expected volume and update pattern of the daily document list snapshots?
A. Daily full snapshot of active projects (~1,000 to 50,000 document records per file) replacing or updating previous state
B. Daily incremental snapshot containing only documents updated or created that day
C. Multi-project files delivered separately throughout the day
D. Not yet defined
X. Other (please specify)

[Answer]: A, multi-project database snapshot where an individual project averages 300-500 documents, but the snapshot contains many projects and the CSV size will continuously grow over time as project numbers increase

## Q4. Where will the Go backend and React frontend applications be hosted/deployed for MVP?
A. Internal containerized setup (Docker / Docker Compose on corporate VM or internal server)
B. Cloud-hosted (AWS ECS / Fargate, App Runner, or S3 + CloudFront for React and Go on VM/ECS)
C. Local developer / on-premises server execution
D. Not yet defined
X. Other (please specify)

[Answer]: A, Docker for now.

## Q5. Are there specific compliance, security, or authentication requirements for this dashboard?
A. Corporate intranet only (internal network IP whitelisting, basic auth or token for Power Automate POST)
B. Corporate Single Sign-On (SSO / OAuth2 / Azure AD) for executive users
C. Standard API key authentication for Power Automate ingestion + session-based dashboard login
D. None defined at this stage (open internal dashboard for MVP)
X. Other (please specify)

[Answer]: D

## Q6. What are the key timeline constraints or target delivery milestones for this MVP?
A. Rapid MVP within 1-2 weeks focusing on end-to-end ingestion and core dashboard views
B. Standard project cycle (3-4 weeks) including comprehensive testing and container deployment
C. Flexible timeline driven by validation with executive users
D. Not yet defined
X. Other (please specify)

[Answer]: C

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
