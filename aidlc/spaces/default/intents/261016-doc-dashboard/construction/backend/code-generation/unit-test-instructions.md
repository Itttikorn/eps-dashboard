# Unit Test Instructions: Unit `backend`

**Stage**: `code-generation` (3.5)  
**Unit**: `backend` (`U1`, kind: `service`, directory: `backend`)  
**Lead Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19  

---

## 1. Overview & Test Scope

This instruction set establishes the testing execution parameters, coverage floors, runner commands, and mocking conventions for unit `backend` (Bolt 1).

- **Active Test Strategy**: `Standard` (5–8 tests per component, covering happy path, validation boundaries, and failure cases).
- **Testing Methodology**: `test-after` (implement each testable layer, then author and run its tests).
- **Mandatory Quality Gates**:
  - Race detector enabled on all test runs: `-race`.
  - Line-coverage floor: $\ge 80.0\%$ on core business logic (parser, overdue engine, aggregators).
  - Pure unit execution: zero external network calls or persistent database dependencies required for unit suites.

---

## 2. Exact Unit-Scoped Test Commands

All test executions must be strictly scoped to the `backend` unit.

### 2.1 Standard Test Suite (Scoped to Backend)
From the repository root:
```bash
go test -v -race -count=1 ./backend/...
```

Or from within the `backend/` directory:
```bash
cd backend && go test -v -race -count=1 ./...
```

### 2.2 Coverage Verification Command
To verify line coverage against the 80% floor:
```bash
cd backend && go test -coverprofile=coverage.out -covermode=atomic ./...
go tool cover -func=coverage.out
```

### 2.3 Single Component Test (Targeted Execution)
To run a specific test suite during development:
```bash
cd backend && go test -v -race -run TestIngestService ./internal/service/...
```

---

## 3. Test Framework & Configuration

- **Runner**: Standard Go `testing` toolchain (Go 1.22+).
- **Assertions**: Standard table-driven tests using `t.Run()` and standard library helpers (or `github.com/stretchr/testify/assert` / `require` if imported).
- **Execution Flags**:
  - `-v`: Verbose output detailing each individual test case.
  - `-race`: Data race detector actively monitoring concurrent goroutine memory access.
  - `-count=1`: Disables test caching to ensure every run verifies fresh code execution.

---

## 4. Test Isolation & Mocking Strategy

1. **Repository Layer Isolation**:
   - Repository unit tests execute against an in-memory SQLite database instance (`sqlite::memory:?cache=shared`) with GORM or table-driven fakes implementing repository interfaces.
   - External PostgreSQL is required only for full integration testing in `build-and-test`.
2. **HTTP Transport Layer Isolation**:
   - HTTP handlers are tested using Go's `net/http/httptest` package (`httptest.NewRecorder()`, `httptest.NewRequest()`).
   - Mock service implementations are injected into handler constructors, isolating HTTP deserialization, header inspection, and response envelope validation from underlying persistence.
3. **Time Determinism**:
   - Clock-dependent tests (overdue calculations, aging elapsed days) accept an explicit reference `time.Time` or inject a mock clock interface to avoid flaky tests due to clock drift.

---

## 5. Test Data Management & Fixtures

Test fixtures reside in `backend/test/fixtures/`:
- `valid_snapshot_small.csv`: Standard 10-row snapshot across ME, CE, and EE disciplines.
- `valid_snapshot_500.csv`: 500-row snapshot for performance and bulk aggregation benchmarks.
- `out_of_order_date.csv`: Snapshot with older timestamp to verify chronology downgrade protection.
- `malformed_rows.csv`: CSV missing required columns or invalid date formats.
- `formula_injection.csv`: CSV containing `=CMD|`, `+SUM(A1)`, `-10`, and `@HYPERLINK` prefixes to verify defensive formula sanitization.

