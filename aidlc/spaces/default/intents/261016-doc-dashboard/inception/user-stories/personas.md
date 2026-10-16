# User Personas: Corporate Document Management System Dashboard

**Stage**: `user-stories` (2.4)  
**Lead Agent**: `aidlc-product-agent`  
**Intent**: `261016-doc-dashboard`  
**Upstream Artifacts**:
- [Requirements Specification](../requirements-analysis/requirements.md)
- [Scope Document](../../ideation/scope-definition/scope-document.md)
- [Team Practices](../../../../memory/team.md)

---

## Primary Persona: Dashboard Viewer

### Profile & Context
- **Name**: Somchai Prasertkul (representing Executive Leadership, Project Managers, and Discipline Leads)
- **Role**: Corporate & Site EPC Stakeholder (Director, Project Manager, Lead Engineer)
- **Organization**: SCG / EPS Project Operations
- **Context**: Responsible for monitoring multi-project health across concurrent industrial construction sites (`SKK-IM-CM-26002`, `STS-CN-PP-26001`, `STS-EN-PP-26001`). Accesses the dashboard via desktop or workstation on the corporate internal intranet.

### Goals & Motivations
1. **Instant Multi-Project Overview**: Immediately identify which project sites have alarming overdue counts or critical QA/QC bottlenecks without digging through raw CSVs or email transmittals.
2. **Category Health Assessment**: Evaluate open vs closed progress across the 5 standard QA/QC categories (Baseline Drawings, Control, Corrective Actions, Change, and Complete).
3. **Delinquency Escalation**: Rapidly identify high-delinquency categories ($\ge 45\%$ pending) marked with pulsing alerts (`.chip-blink`) and overdue documents exceeding `DUEDATE`.
4. **Historical Trend Analysis**: Compare document velocity and volume curves across multiple selected projects simultaneously over the entire project lifecycle without arbitrary time limits.
5. **Discipline Deep Dive**: Expand project rows to inspect drawing progress by engineering discipline (Mechanical, Electrical, Civil) and investigate aging NCR/CAR action items.

### Pain Points
- Previously relied on fragmented daily Excel attachments sent via automated email.
- No historical time-series view to see whether a contractor's review backlog is growing ($\blacktriangle$) or shrinking ($\blacktriangledown$).
- Inability to compare multiple project sites side-by-side.

---

## Secondary Persona: Data Administrator / CSV Uploader

### Profile & Context
- **Name**: Supaporn Thanakorn
- **Role**: Lead Document Controller / System Administrator
- **Organization**: Central Project Controls & Ingestion Operations
- **Context**: Oversees daily data ingestion from Conzol exports. Manages automated ingestion scripts and performs manual on-demand CSV snapshot uploads when automated feeds are delayed or ad-hoc revisions are issued.

### Goals & Motivations
1. **Frictionless Ingestion**: Drag-and-drop or upload daily `AUTOEMAIL_FILE_06_*.csv` files directly via the UI modal and receive instant confirmation of row counts processed.
2. **Safe Idempotency**: Confidence that uploading the same file multiple times or uploading files out of order will never corrupt the database, duplicate change events, or revert newer document revisions.
3. **Change Audit Tracking**: Verify that status changes (e.g. `WAIT SYN` $\rightarrow$ `RETURN`, approval code stamped) are cleanly captured in the delta change log without table bloat.

### Pain Points
- Fear of corrupting database state with accidental duplicate uploads.
- Slow batch processing that freezes or times out during large document register updates.

---

## Persona Priority & Matrix

| Persona | Priority | Primary Workflows | Key UI Components |
| :--- | :--- | :--- | :--- |
| **Dashboard Viewer** | **Primary (P1)** | Executive monitoring, comparative analysis, discipline drill-down, multi-project trend filtering | Topbar KPI Cards, Multi-Project Matrix Grid, Discipline Accordion, Unlimited Trend View |
| **Data Administrator** | **Secondary (P2)** | Daily CSV upload, ingestion verification, batch status confirmation | Manual CSV Upload Modal, Ingestion Status Indicators |

