# Security & Compliance Design Specification — Unit: `frontend`

**Stage**: `nfr-design` (3.3)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Security Posture

This security design specification establishes the client-side defense-in-depth mechanisms, input bounding, error masking, and intranet access models for the React 18 single-page application (`frontend`), tracing from:
- `security-requirements.md`: Upstream security requirements (`NFR3.1`, `NFR3.2`, `NFR5.1`, `NFR5.2`, `NFR6.1`, `NFR6.2`, `NFR6.3`, `NFR6.4`, `NFR6.5`).
- `performance-requirements.md` & `tech-stack-decisions.md`: Baseline frontend technology choices.
- `reliability-requirements.md`: Network retry and graceful degradation guardrails.
- `functional-spec.md`: Workflow 5 (CSV upload validation) and API error states.
- `contract-summary.md`: Standard OpenAPI response envelope (`status.code`, `status.message`, `status.description`).

---

## 2. Intranet Deployment & Authentication Model (NFR6.1)

### 2.1 Open Corporate Access Boundary
The Document Management Dashboard operates within an isolated corporate intranet network behind corporate firewall perimeters:
- **Zero Login Friction**: The frontend contains no login forms, credentials collection, or session cookies.
- **Direct Anonymous Access**: Authorized internal staff across engineering and operations view the dashboard directly upon browser navigation to the internal endpoint.

---

## 3. Cross-Site Scripting (XSS) & Content Security Policy (NFR6.3, NFR6.4)

### 3.1 Strict JSX Output Encoding
All dynamic data fields (project names, category tags, error descriptions, and metrics) are rendered via standard React JSX nodes, which automatically escape HTML entities:
- Direct utilization of `dangerouslySetInnerHTML` is prohibited across all frontend source files and enforced by ESLint.
- Tooltips, badge contents, and modal dialog text strictly accept typed strings rather than unescaped markup.

### 3.2 Content Security Policy (CSP) Directives
The web server (Vite dev server and production Nginx container) emits strict CSP headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8080; font-src 'self'; object-src 'none'; frame-ancestors 'none';
```

---

## 4. Error Envelope Handling & Information Masking (NFR3.1, NFR6.2)

### 4.1 Universal Envelope Unwrapping & Sanitization
The client-side API client (`api-client.ts`) unwraps the universal Go backend envelope:

```typescript
export interface ApiResponse<T> {
  status: {
    code: number;
    message: string;
    description: string;
  };
  data?: T;
}
```

### 4.2 Information Leakage Shield (NFR6.2)
- Raw HTTP error codes (e.g., 500 Internal Server Error) and backend driver traces (e.g., PostgreSQL connection resets, file path exceptions) are intercepted by the Axios/Fetch error handler.
- The UI displays only the sanitized user-facing string from `response.status.description` (e.g., *"Upload failed: CSV contains invalid date format on row 42"*), shielding all internal infrastructure details.

---

## 5. Client-Side Upload Validation & File Guardrails (NFR6.5)

### 5.1 Pre-Flight File Inspection
Before initiating the multipart form upload request to `/api/v1/ingest`:
- **File Extension**: Must strictly terminate in `.csv` (case-insensitive).
- **MIME Type Validation**: Restricted to `text/csv`, `application/vnd.ms-excel`, or `text/plain`.
- **Size Bounding**: Enforced ceiling of $\le 10\text{ MB}$ ($10,485,760\text{ bytes}$). Files exceeding the ceiling are rejected immediately with a client toast without transmitting any payload over the network.

---

## 6. UI State Integrity & Theming Compliance (NFR3.2, NFR5.1, NFR5.2)

### 6.1 Four Mandatory Screen States (NFR5.1)
Every data-driven view component implements 4 discrete UI states:
1. `LoadingState`: Dimension-matching skeleton components with pulse animation.
2. `EmptyState`: Contextual illustration, friendly guidance, and clear call-to-action.
3. `ErrorState`: Shielded error banner with retry trigger.
4. `SuccessState`: Populated data view.

### 6.2 Dual Theme CSS Token Architecture (NFR5.2)
Theming is implemented through semantic CSS custom properties defined in Tailwind CSS v4 (`--background`, `--foreground`, `--card`, `--border`, `--primary`):
- Light theme: Crisp high-contrast corporate palette.
- Dark theme: Reduced-luminance palette with WCAG 2.1 AA compliant text contrast ratios ($\ge 4.5:1$).

### 6.3 Code Quality & Branch Promotion Standards (NFR3.2)
All frontend code additions undergo automated type-checking (`tsc --noEmit`), linting (`eslint`), and unit testing (`vitest`) before merge promotion, ensuring zero regression across sprints.

