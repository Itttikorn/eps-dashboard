# Security Test Instructions: Corporate Document Management System Dashboard

**Stage**: `build-and-test` (3.6)  
**Phase**: `construction`  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-devsecops-agent`  
**Support Agents**: `aidlc-quality-agent`  
**Date**: 2026-10-19  

---

## 1. Overview & Security Objectives

This instruction set establishes security test cases, defensive validation rules, and automated verification commands for the security posture affirmed in `requirements.md` and `memory/project.md`:

| Target ID | Concern | Defensive Measure | Test Location |
| :--- | :--- | :--- | :--- |
| **SEC-01** | CSV Formula Injection (DDE) | Escape spreadsheet prefix chars (`=`, `+`, `-`, `@`, `\t`, `\r`) | `internal/ingest/parser_test.go` |
| **SEC-02** | Chronological Downgrade | Reject or ignore out-of-order historical revisions | `internal/ingest/service_test.go` |
| **SEC-03** | Denial of Service (OOM) | Enforce `http.MaxBytesReader` (50 MB limit) on upload endpoints | `backend/api.go`, `internal/ingest/handler_test.go` |
| **SEC-04** | Information Leakage | Mask internal DB errors, schemas, and driver traces in API responses | `internal/utils/envelope.go`, `api_test.go` |
| **SEC-05** | Cross-Origin Request Abuse | Enforce CORS whitelist middleware (`CORS_ALLOWED_ORIGINS`) | `backend/api.go`, `api_test.go` |
| **SEC-06** | Container Privilege Escalation | Enforce unprivileged user execution (`USER nonroot:nonroot`) in Dockerfile | `backend/Dockerfile`, `frontend/Dockerfile` |

---

## 2. Test Framework Setup & Test Harness

### 2.1 Backend Defensive Security Test Suite
- **Tool**: Go `testing` toolchain.
- **Harness**: Table-driven tests feeding active malicious payloads into CSV parser routines, multipart upload handlers, and error formatting pipelines.

### 2.2 Container Security Linter
- Dockerfile inspection verifying multi-stage build structure and non-root execution.

---

## 3. How to Run Security Tests

### 3.1 CSV Formula Injection Verification (`SEC-01`)
Run table-driven formula sanitization tests:
```bash
go test -C backend -v -run TestSanitizeFormulaDefensive ./internal/ingest/...
```
Test cases verified:
- Empty string $\rightarrow$ Empty string.
- Normal text (`Engineering Drawing`) $\rightarrow$ Untouched.
- Formula prefix `=CMD|' /C calc'!A0` $\rightarrow$ Sanitized with single quote prefix `\=' /C calc'!A0`.
- Mathematical formula prefix `+SUM(A1:A10)` $\rightarrow$ Sanitized with single quote prefix `\'+SUM(A1:A10)`.
- Minus prefix `-100` $\rightarrow$ Sanitized with single quote prefix `\'-100`.
- At-sign hyperlink `@HYPERLINK(...)` $\rightarrow$ Sanitized with single quote prefix `\'@HYPERLINK(...)`.
- Whitespace leading control characters (`\t`, `\r`) $\rightarrow$ Neutralized.

### 3.2 Chronological Downgrade Protection Verification (`SEC-02`)
Verify state regression resistance:
```bash
go test -C backend -v -run "TestIngestService_ChronologicalDowngradeProtection|TestHandler_IngestCSV_ChronologicalDowngradeConflict" ./internal/ingest/...
```
Assertion:
- Given an existing record with revision date `2026-10-15`.
- Ingesting a record with revision date `2026-10-01` must NOT overwrite current live state.
- Ingestion completes safely without crashing or corrupting historical sequence.

### 3.3 Request Body Limit & Content Type Verification (`SEC-03`)
Verify upload boundaries:
```bash
go test -C backend -v -run "TestHandler_IngestCSV_InvalidContentType|TestHandler_IngestCSV_MissingFile" ./internal/ingest/...
```
Assertion:
- Uploads exceeding 50 MB are terminated by `http.MaxBytesReader` with HTTP 413 or 400.
- Non-multipart/form-data and non-text/csv uploads are rejected with HTTP 415 or 400.

### 3.4 Error Masking & Information Leakage Verification (`SEC-04`)
Verify that SQL driver errors and internal file paths are never exposed to the client:
```bash
go test -C backend -v -run "TestWriteJSON|TestEnvelopeConstructors" ./internal/utils/...
```
Assertion:
- `status.code` matches HTTP status.
- `status.description` contains sanitized human message (e.g. `An internal server error occurred`).
- Driver stack traces and SQL query strings are omitted from response envelopes.

### 3.5 Container Non-Root Execution Verification (`SEC-06`)
Verify Dockerfiles adhere to container security best practices:
```bash
# Verify backend Dockerfile executes as unprivileged user
Select-String -Path backend/Dockerfile -Pattern "USER"

# Verify frontend Dockerfile executes as unprivileged user
Select-String -Path frontend/Dockerfile -Pattern "USER"
```
Both images explicitly specify non-root execution.

