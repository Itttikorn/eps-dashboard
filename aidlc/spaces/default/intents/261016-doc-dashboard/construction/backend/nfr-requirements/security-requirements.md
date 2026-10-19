# Security Requirements: Unit `backend`

**Stage**: `nfr-requirements` (3.2)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-16  

---

## 1. Upstream Traceability & Threat Model

This specification establishes the security baseline, defensive input boundaries, threat analysis, and container hardening controls for the Go backend service and PostgreSQL storage layer, tracing from:
- `requirements.md`: Upstream requirements `NFR6.1` (open internal access), `NFR4.3` (error sanitization), and `NFR3.1` (universal response envelope).
- `contract-summary.md`: OpenAPI error contracts and multipart ingestion schema.
- `functional-spec.md`: Workflows 1–4 and data lifecycle transitions.
- `nfr-requirements-questions.md`: Q2 confirmed Defensive Formula Sanitization and 10MB payload limit.

---

## 2. Authentication & Authorization Model (`NFR6.1`)

- **Intranet Deployment Scope**: Per `NFR6.1`, the MVP operates strictly within the internal corporate LAN/VPN network. User logins, session tokens (JWT), and granular RBAC are excluded from the MVP scope to maximize executive adoption and simplify local deployment.
- **Network Boundary Defense**: The backend binds port `8080` internally within the Docker Compose network. Direct exposure to the public internet without an upstream corporate reverse proxy / API gateway is strictly prohibited.
- **Future Extensibility**: All handler logic is decoupled from transport authentication through Chi middleware chains, allowing seamless injection of OAuth2 / OIDC headers or mTLS certificates post-MVP.

---

## 3. Input Validation & Request Bounding (`NFR6.2`)

To protect the server against buffer exhaustion, slowloris attacks, and memory exhaustion:

| Control | Mechanism | Parameter / Limit | Enforcement Location |
|:---|:---|:---|:---|
| **Request Body Limit** | `http.MaxBytesReader` | 10 MB (`10 * 1024 * 1024` bytes) | Mounted directly on `POST /api/v1/ingest` handler |
| **Environment Override** | `MAX_INGEST_FILE_BYTES` | Defaults to 10MB; configurable | Environment variable parsed on boot |
| **MIME Validation** | Header sniffing & Content-Type | `text/csv`, `text/plain`, `application/vnd.ms-excel` | Checked prior to streaming parsing |
| **Header Schema Bounds** | 23 mandatory column check | Case-insensitive token match; max 255 chars per header | Pre-parsing validation |
| **Query Param Sanitization** | Strict integer / date parsing | `page` (min 1), `page_size` (1–100), ISO 8601 dates | Query parser middleware |

---

## 4. Defensive CSV Sanitization & Formula Injection Defense (`NFR6.3`)

When spreadsheets (Microsoft Excel, LibreOffice Calc, Google Sheets) open CSV files, cell values starting with executable prefix characters (`=`, `+`, `-`, `@`) can trigger Dynamic Data Exchange (DDE) formulas, arbitrary command execution, or data exfiltration.

Per Question Q2 decision, the ingestion parser enforces **Defensive CSV Sanitization**:

1. **Executable Formula Detection**:
   Any cell value in text columns (`TITLE`, `REMARK`, `COMMENTLIST`, `TRANSMITTAL`, `COMPANY`) is inspected for dangerous leading characters:
   ```go
   func SanitizeCSVField(val string) string {
       trimmed := strings.TrimSpace(val)
       if len(trimmed) == 0 {
           return val
       }
       // Detect formula triggers: =, @, or dangerous expressions starting with +, -
       firstChar := trimmed[0]
       if firstChar == '=' || firstChar == '@' {
           return "'" + val // Prefix single quote to neutralize formula execution in Excel
       }
       if (firstChar == '+' || firstChar == '-') && len(trimmed) > 1 {
           // Allow legitimate engineering measurements (e.g. "+15.5m", "-2.0")
           // Disarm formula expressions (e.g. "+cmd|' /C calc'!A0")
           if strings.ContainsAny(trimmed, "()|`\"") {
               return "'" + val
           }
       }
       return val
   }
   ```
2. **Preservation of Engineering Units**:
   Legitimate engineering elevations, tolerances, and notes (such as `+12.0m EL` or `-5 mm`) are preserved without unnecessary escaping, ensuring dashboard readability remains pristine.
3. **Control Character Stripping**:
   Embedded null bytes (`\0`) and non-printable control characters are stripped from incoming strings.

---

## 5. Information Disclosure & Error Sanitization (`NFR6.4`)

To eliminate information leakage:
- **Zero SQL / Stack Leakage**: Handlers must never serialize internal PostgreSQL driver errors, table names, query strings, or stack traces in API response envelopes.
- **Universal Status Mapping**: All errors are normalized to the organizational four-field JSON envelope:
  - Code `1801` (`Header: "Invalid Request"`): Validation failures with user-friendly field descriptions.
  - Code `1799` (`Header: "Conflict"`): Out-of-order snapshot rejections.
  - Code `1900` (`Header: "Server Error"`): Internal server errors masked with generic text (`"An unexpected error occurred. Please contact the administrator with Request ID: <UUID>"`).
- **Audit Masking**: Log messages redact any potential secrets, passwords, or connection strings (`log/slog` filters).

---

## 6. Container Hardening & Runtime Security (`NFR6.5`)

- **Non-Root Execution**: The Docker container executes as an unprivileged user (`uid: 10001, gid: 10001`) with read-only root filesystem capabilities where feasible.
- **Multi-Stage Build**: Binary is compiled in a `golang:1.22-alpine` builder stage and copied into a minimal `scratch` or `alpine:3.20` runtime image containing only CA certificates and tzdata.
- **Database Credential Isolation**: Database passwords, user credentials, and connection strings are injected strictly via environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), never committed to source control or baked into container layers.

---

## 7. STRIDE Threat Analysis Matrix

| Threat Category | Potential Threat Vector | Mitigating Architectural Control | Status |
|:---|:---|:---|:---|
| **Spoofing** | Attacker impersonates data uploader | Open intranet scope for MVP (`NFR6.1`); network perimeter restricted to corporate LAN/VPN. | Controlled |
| **Tampering** | Uploading forged or corrupted CSV snapshot | Checksum verification (`file_sha256`), out-of-order date guard (`rev_date >= current`), and strict atomic transaction rollback (`NFR4.3`). | Enforced |
| **Repudiation** | Denying an uploaded document modification | Append-only `document_change_log` recording exact field mutations, `changed_at` timestamps, and `batch_id` references. | Enforced |
| **Information Disclosure** | Database schema or stack trace leakage | Universal 4-field envelope masking internal errors; sanitized JSON status codes (`NFR6.4`). | Enforced |
| **Denial of Service** | Oversized file upload (> 100MB) or memory bloat | `http.MaxBytesReader` 10MB ceiling (`NFR6.2`); streaming line-by-line CSV parsing with $< 15\text{ MB}$ memory footprint. | Enforced |
| **Elevation of Privilege** | Container breakout or database root compromise | Unprivileged non-root container execution (`uid 10001`); dedicated non-superuser PostgreSQL role. | Enforced |

