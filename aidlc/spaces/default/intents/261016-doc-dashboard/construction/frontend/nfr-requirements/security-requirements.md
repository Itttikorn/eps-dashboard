# Security Requirements Specification: Unit `frontend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Security Posture

This security requirements specification defines client-side data protection, XSS defenses, input bounding, and access policies for the React 18 single-page application (`frontend`), tracing from:
- `requirements.md`: `NFR3.1` (universal response envelope), `NFR3.2` (linear branch promotion & `--no-ff` merge commits), `NFR5.1` (4 mandatory UI states), `NFR5.2` (dual theme support), and `NFR6.1` (open internal corporate intranet access without login walls).
- `functional-spec.md`: Workflow 5 (CSV file upload validation) and client-side error sanitization.
- `contract-summary.md`: OpenAPI 3.0 error envelope contracts and payload bounds.

---

## 2. Security & Compliance Requirements

### 2.1 Access Control & Deployment Context
- **NFR6.1: Open Internal Corporate Intranet Access**:
  - The MVP frontend requires no user login forms, session cookies, passwords, or complex RBAC walls.
  - Deployed exclusively on protected internal corporate VM / intranet network behind enterprise firewalls.
- **NFR6.2: Sensitive Information Masking**:
  - The client UI shall never display internal database schema names, stack traces, driver errors, or raw server file paths.
  - Error messages must display sanitized user-friendly descriptions extracted from `envelope.status.description`.

### 2.2 Cross-Site Scripting (XSS) & Injection Defense
- **NFR6.3: Strict Output Sanitization**:
  - Prohibit raw `dangerouslySetInnerHTML` across all UI components.
  - All dynamic data rendered in tables, search inputs, tooltips, and badges is escaped via React automatic JSX encoding.
- **NFR6.4: Content Security Policy (CSP)**:
  - Default policy restricts script and style execution:
    ```
    default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8080;
    ```

### 2.3 File Upload Security & Bounding
- **NFR6.5: Client-Side Upload Constraints**:
  - File extension strictly checked for `.csv`.
  - Max upload size verified before transmission: $\le 10\text{ MB}$ ($10,485,760\text{ bytes}$).
  - File MIME type validated against `text/csv`, `application/vnd.ms-excel`, and `text/plain`.

