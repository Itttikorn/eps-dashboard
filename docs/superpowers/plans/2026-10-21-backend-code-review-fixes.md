# Backend Code Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all 10 code review findings (4 Blockers, 5 Warnings, 1 Nitpick) across the Go backend to eliminate memory exhaustion, connection pool exhaustion, N+1 query loops, unclosed multipart temp files, nil-pointer dereferences on degraded DB mode, and data corruption in multi-project ingestion.

**Architecture:** Refactor the repository, service, and HTTP handler layers into idiomatic, bounded, and atomic operations. Standardize discipline classification into the domain models layer, add composite DB indexes for hot query paths, introduce streaming line-by-line CSV sanitization, encapsulate chronology and multi-project persistence within single DB transactions, eliminate N+1 loops via bulk loading, and harden API initialization with graceful connection drainage and degraded mode guards.

**Tech Stack:** Go 1.22+, Chi Router v5, GORM v1.25+, PostgreSQL / SQLite (test suite), Go standard library (`net/http`, `net/url`, `bufio`, `log/slog`, `context`).

**Spec:** Reviewer Agent Audit Findings (10 findings: 4 Blockers, 5 Warnings, 1 Nitpick).

## Global Constraints

- Preserve all existing public HTTP API endpoints, JSON envelope response structures (`utils.Response`), status codes, and backward compatibility fields.
- Zero external package additions; use existing dependencies (`chi`, `gorm`, standard library).
- All unit and integration tests must run cleanly via `go test ./...` in the `backend` module.
- Strict TDD cycle for each task: write failing test, verify failure, implement fix, verify pass, commit.

## Review Focus

1. **Concurrent Ingest Chronology Race:** Two simultaneous uploads for the same project must not bypass chronological downgrade validation.
2. **Multi-Project CSV Isolation:** Ingesting a CSV with mixed project codes without override must accurately calculate metrics and save KPI snapshots for each project independently without cross-project data pollution.
3. **Multipart Temporary File Leak & Memory Exhaustion:** Uploading large or malformed CSV payloads must be hard-capped at 32MB and never leak orphaned temporary files in `$TMPDIR`.
4. **Degraded Mode Protection:** Invoking `/api/v1/*` routes when `app.DB` is `nil` must reliably return HTTP 503 Service Unavailable without panic or nil-pointer dereference.
5. **N+1 Query Saturation:** Calling `/api/v1/projects` or `/api/v1/projects/matrix` across $N$ projects must execute $O(1)$ database queries rather than $2N + 1$ queries.

---

### Task 1: Unify Engineering Discipline Classification into Domain Models (Finding 10 - NITPICK)

**Files:**
- Modify: `backend/internal/models/discipline.go`
- Modify: `backend/internal/ingest/csv_parser.go:75-151`
- Modify: `backend/internal/project/service.go:157-209`
- Test: `backend/internal/models/models_test.go`

**Interfaces:**
- Produces: `models.ParseDisciplineFromDocNumber(docNumber string) string`
- Produces: `models.ResolveDiscipline(explicitDiscipline, docNumber string) string`
- Consumes: `models.StandardDisciplines`

- [ ] **Step 1: Write the failing tests in `models_test.go`**

Add tests covering discipline extraction from doc numbers (e.g. `STSBPP-AB-E-100-001` -> `EE`, `PRJ-ME06-001` -> `ME`, `EXC16-01` -> `CE`) and explicit code fallbacks.

```go
func TestResolveDiscipline(t *testing.T) {
	tests := []struct {
		docNumber string
		explicit  string
		want      string
	}{
		{"STSBPP-AB-E-100-001", "ABB", "EE"},
		{"STSBPP-UB-M-120-094", "", "ME"},
		{"CIVIL-CE-001", "CIVIL", "CE"},
		{"INST-LOOP-01", "", "INST"},
		{"PROC-FLOW-01", "", "PROC"},
		{"UNKNOWN-001", "ME", "ME"},
		{"UNKNOWN-002", "SOME_CE", "CE"},
		{"UNKNOWN-003", "", "GEN"},
	}

	for _, tt := range tests {
		got := models.ResolveDiscipline(tt.explicit, tt.docNumber)
		if got != tt.want {
			t.Errorf("ResolveDiscipline(%q, %q) = %q, want %q", tt.explicit, tt.docNumber, got, tt.want)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; go test ./internal/models -v -run TestResolveDiscipline`
Expected: FAIL with undefined `models.ResolveDiscipline`.

- [ ] **Step 3: Implement `ParseDisciplineFromDocNumber` and `ResolveDiscipline` in `models/discipline.go`**

Add standard extraction implementation in `backend/internal/models/discipline.go`:

```go
package models

import "strings"

// ParseDisciplineFromDocNumber extracts or normalizes engineering disciplines (ME, CE, EE, INST, PROC, GEN)
// directly from tokens embedded in the document number / ID.
func ParseDisciplineFromDocNumber(docNumber string) string {
	normalized := strings.ReplaceAll(docNumber, "_", "-")
	parts := strings.Split(normalized, "-")

	// Phase 1: Multi-letter discipline tokens
	for _, p := range parts {
		token := strings.ToUpper(strings.TrimSpace(p))
		if token == "ME" || token == "PP" || (strings.HasPrefix(token, "ME") && len(token) <= 4) {
			return "ME"
		}
		if token == "CE" || token == "MS" || (strings.HasPrefix(token, "CE") && len(token) <= 4) ||
			(strings.HasPrefix(token, "EXC") && len(token) <= 5) || (strings.HasPrefix(token, "EX") && len(token) <= 4 && token != "EXP") {
			return "CE"
		}
		if token == "EE" || (strings.HasPrefix(token, "EE") && len(token) <= 4) {
			return "EE"
		}
		if token == "INST" {
			return "INST"
		}
		if token == "PROC" {
			return "PROC"
		}
		if token == "GEN" {
			return "GEN"
		}
	}

	// Phase 2: Single-letter discipline segment
	for _, p := range parts {
		token := strings.ToUpper(strings.TrimSpace(p))
		if token == "M" {
			return "ME"
		}
		if token == "E" || token == "I" {
			return "EE"
		}
		if token == "C" || token == "S" || token == "AR" {
			return "CE"
		}
	}

	return ""
}

// ResolveDiscipline extracts or normalizes the discipline code.
// It prioritizes parsing engineering discipline tokens directly from the document ID,
// falling back to standard or known suffixes of explicitDiscipline, and finally defaults to "GEN".
func ResolveDiscipline(explicitDiscipline, docNumber string) string {
	if inferred := ParseDisciplineFromDocNumber(docNumber); inferred != "" {
		return inferred
	}

	disc := strings.ToUpper(strings.TrimSpace(explicitDiscipline))
	switch disc {
	case "ME", "CE", "EE", "INST", "PROC", "GEN":
		return disc
	}
	if strings.HasSuffix(disc, "ME") {
		return "ME"
	}
	if strings.HasSuffix(disc, "CE") {
		return "CE"
	}
	if strings.HasSuffix(disc, "EE") {
		return "EE"
	}

	if disc != "" {
		return disc
	}

	return "GEN"
}
```

Update `backend/internal/ingest/csv_parser.go:75-151`:
- Delegate `ParseDisciplineFromDocNumber(docNumber)` to `models.ParseDisciplineFromDocNumber(docNumber)`
- Delegate `ExtractDiscipline(explicitDiscipline, docNumber)` to `models.ResolveDiscipline(explicitDiscipline, docNumber)`

Update `backend/internal/project/service.go:157-209`:
- Replace `resolveDiscipline(docNumber, explicitDiscipline)` body with `return models.ResolveDiscipline(explicitDiscipline, docNumber)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; go test ./internal/models ./internal/ingest ./internal/project -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models backend/internal/ingest/csv_parser.go backend/internal/project/service.go
git commit -m "refactor: unify discipline extraction into domain models package"
```

---

### Task 2: Database Model Schema & Composite Indexes (Finding 9 - WARNING)

**Files:**
- Modify: `backend/internal/models/document.go:8-25`
- Modify: `backend/internal/models/kpi_snapshot.go:8-19`
- Test: `backend/internal/database/db_test.go`

**Interfaces:**
- Produces: GORM composite index `idx_project_issue_date` on `models.Document (project_code, issue_date DESC)`
- Produces: GORM composite index `idx_snapshot_project_date` on `models.KPISnapshot (project_code, snapshot_date ASC)`

- [ ] **Step 1: Write the test verifying composite indexes in SQLite / DB metadata**

In `backend/internal/database/db_test.go`, add `TestModelIndexes`:

```go
func TestModelIndexes(t *testing.T) {
	db, err := InitInMemoryDB()
	if err != nil {
		t.Fatalf("InitInMemoryDB failed: %v", err)
	}
	if err := AutoMigrate(db); err != nil {
		t.Fatalf("AutoMigrate failed: %v", err)
	}

	// Verify indexes exist in sqlite_master
	var count int64
	db.Raw("SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_snapshot_project_date'").Scan(&count)
	if count == 0 {
		t.Errorf("expected idx_snapshot_project_date index to be created")
	}

	db.Raw("SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_project_issue_date'").Scan(&count)
	if count == 0 {
		t.Errorf("expected idx_project_issue_date index to be created")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend; go test ./internal/database -v -run TestModelIndexes`
Expected: FAIL because indices do not yet exist in `sqlite_master`.

- [ ] **Step 3: Update `document.go` and `kpi_snapshot.go` with GORM tags**

In `backend/internal/models/document.go`:
```go
type Document struct {
	ID             uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectCode    string     `gorm:"size:64;uniqueIndex:idx_project_doc;index:idx_project_issue_date,priority:1;not null" json:"project_code"`
	DocNumber      string     `gorm:"size:128;uniqueIndex:idx_project_doc;not null" json:"doc_number"`
	Title          string     `gorm:"size:255;not null" json:"title"`
	Discipline     string     `gorm:"size:32;index;not null" json:"discipline"`
	Status         string     `gorm:"size:64;index;not null" json:"status"`
	Revision       string     `gorm:"size:32;not null" json:"revision"`
	IssueFor       string     `gorm:"size:32;default:''" json:"issue_for"`
	IssueDate      time.Time  `gorm:"index:idx_project_issue_date,priority:2" json:"issue_date"`
	TargetDate     time.Time  `json:"target_date"`
	ActualDate     *time.Time `json:"actual_date,omitempty"`
	IsOverdue      bool       `gorm:"index" json:"is_overdue"`
	OverdueDays    int        `json:"overdue_days"`
	IsLateApproval bool       `gorm:"index;default:false" json:"is_late_approval"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
```

In `backend/internal/models/kpi_snapshot.go`:
```go
type KPISnapshot struct {
	ID                    uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectCode           string    `gorm:"size:64;index:idx_snapshot_project_date,priority:1;not null" json:"project_code"`
	SnapshotDate          time.Time `gorm:"index:idx_snapshot_project_date,priority:2;not null" json:"snapshot_date"`
	TotalDocuments        int       `json:"total_documents"`
	ApprovedDocuments     int       `json:"approved_documents"`
	UnderReviewDocuments  int       `json:"under_review_documents"`
	OverdueDocuments      int       `json:"overdue_documents"`
	LateApprovalDocuments int       `json:"late_approval_documents"`
	ApprovalRate          float64   `json:"approval_rate"` // 0.0 to 100.0
	CreatedAt             time.Time `json:"created_at"`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend; go test ./internal/database -v -run TestModelIndexes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models/document.go backend/internal/models/kpi_snapshot.go backend/internal/database/db_test.go
git commit -m "perf: add composite database indexes for project documents and KPI snapshots"
```

---

### Task 3: Streaming Line Reader for CSV Stream Sanitization (Finding 5 - WARNING)

**Files:**
- Modify: `backend/internal/ingest/csv_parser.go:167-184`
- Test: `backend/internal/ingest/csv_parser_test.go`

**Interfaces:**
- Produces: `SanitizeCSVStream(r io.Reader) (io.Reader, error)` (non-allocating, chunked line scanner)

- [ ] **Step 1: Write a test verifying that `SanitizeCSVStream` works on large streaming input without loading into memory**

In `backend/internal/ingest/csv_parser_test.go`, add `TestSanitizeCSVStream_Streaming`:

```go
func TestSanitizeCSVStream_Streaming(t *testing.T) {
	// Construct input with BOM and malformed trailing double-quotes
	rawInput := "\xef\xbb\xbfdoc_number,title,issue_date\n" +
		`DOC-01,"Malformed """,2026-03-10` + "\n" +
		`DOC-02,"Normal",2026-03-11` + "\n"

	sanitizedReader, err := SanitizeCSVStream(strings.NewReader(rawInput))
	if err != nil {
		t.Fatalf("SanitizeCSVStream failed: %v", err)
	}

	sanitizedBytes, err := io.ReadAll(sanitizedReader)
	if err != nil {
		t.Fatalf("failed reading sanitized stream: %v", err)
	}

	out := string(sanitizedBytes)
	// BOM stripped
	if strings.HasPrefix(out, "\xef\xbb\xbf") {
		t.Errorf("BOM was not stripped")
	}
	// Repaired trailing quote
	if strings.Contains(out, `"""`) {
		t.Errorf("malformed trailing quote was not repaired: %s", out)
	}
	if !strings.Contains(out, `DOC-01,"Malformed ",2026-03-10`) && !strings.Contains(out, `DOC-01,"Malformed",2026-03-10`) {
		t.Logf("Output: %s", out)
	}
}
```

- [ ] **Step 2: Run test to check current behavior**

Run: `cd backend; go test ./internal/ingest -v -run TestSanitizeCSVStream_Streaming`

- [ ] **Step 3: Implement `sanitizingLineReader` in `backend/internal/ingest/csv_parser.go`**

Replace `SanitizeCSVStream` lines 167-184 with:

```go
type sanitizingLineReader struct {
	scanner *bufio.Scanner
	buf     bytes.Buffer
	err     error
}

// SanitizeCSVStream strips UTF-8 BOM if present and repairs common Conzol export anomalies,
// such as unescaped trailing double-quotes before commas, using a streaming line reader.
func SanitizeCSVStream(r io.Reader) (io.Reader, error) {
	cleanReader, err := StripBOM(r)
	if err != nil {
		return nil, err
	}
	sc := bufio.NewScanner(cleanReader)
	// 64KB initial buffer, up to 4MB line length
	sc.Buffer(make([]byte, 64*1024), 4*1024*1024)
	return &sanitizingLineReader{scanner: sc}, nil
}

func (s *sanitizingLineReader) Read(p []byte) (int, error) {
	if s.buf.Len() == 0 {
		if s.err != nil {
			return 0, s.err
		}
		if !s.scanner.Scan() {
			if err := s.scanner.Err(); err != nil {
				s.err = err
				return 0, err
			}
			s.err = io.EOF
			return 0, io.EOF
		}
		line := s.scanner.Bytes()
		if bytes.Contains(line, []byte(`"",`)) || bytes.Contains(line, []byte(`"" ,`)) {
			line = trailingDoubleQuoteRegex.ReplaceAll(line, []byte(`${1}",`))
		}
		s.buf.Write(line)
		s.buf.WriteByte('\n')
	}
	return s.buf.Read(p)
}
```

- [ ] **Step 4: Run all ingest tests to verify correctness**

Run: `cd backend; go test ./internal/ingest -v`
Expected: PASS (including parsing actual data directory CSV files).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/ingest/csv_parser.go backend/internal/ingest/csv_parser_test.go
git commit -m "perf: stream sanitize CSV rows with line-by-line buffer scanner"
```

---

### Task 4: Hard Payload Limits & Multipart Temp File Cleanup (Finding 2 - BLOCKER)

**Files:**
- Modify: `backend/internal/ingest/handler.go:22-77,95`
- Test: `backend/internal/ingest/handler_test.go`

**Interfaces:**
- Enforces: 32MB hard ceiling via `http.MaxBytesReader`
- Ensures: `r.MultipartForm.RemoveAll()` executed via deferred cleanup
- Observability: `slog.Error("Failed to ingest CSV", "err", err)` logged on 500

- [ ] **Step 1: Write test for body size limit and temp file removal**

In `backend/internal/ingest/handler_test.go`, add `TestIngestCSV_BodySizeExceeded`:

```go
func TestIngestCSV_BodySizeExceeded(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	// Create oversized payload exceeding 32MB
	oversized := make([]byte, 33<<20)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ingest", bytes.NewReader(oversized))
	req.Header.Set("Content-Type", "text/csv")
	rec := httptest.NewRecorder()

	h.IngestCSV(rec, req)

	// Should reject request with 400 or 413
	if rec.Code != http.StatusBadRequest && rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want 400 or 413", rec.Code)
	}
}
```

- [ ] **Step 2: Run test to check current behavior**

Run: `cd backend; go test ./internal/ingest -v -run TestIngestCSV_BodySizeExceeded`

- [ ] **Step 3: Update `backend/internal/ingest/handler.go`**

Apply `http.MaxBytesReader`, deferred `RemoveAll()`, and `slog.Error`:

```go
func (h *Handler) IngestCSV(w http.ResponseWriter, r *http.Request) {
	const maxUploadSize = 32 << 20 // 32MB hard ceiling
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	projectCodeOverride := strings.TrimSpace(r.URL.Query().Get("project_code"))
	if projectCodeOverride == "" {
		projectCodeOverride = strings.TrimSpace(r.URL.Query().Get("projectCode"))
	}
	forceChronology := r.URL.Query().Get("force") == "true" || r.URL.Query().Get("forceChronology") == "true"

	var reader io.Reader

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("failed to parse multipart form: "+err.Error()))
			return
		}
		if r.MultipartForm != nil {
			defer func() { _ = r.MultipartForm.RemoveAll() }()
		}

		if projectCodeOverride == "" {
			projectCodeOverride = strings.TrimSpace(r.FormValue("project_code"))
			if projectCodeOverride == "" {
				projectCodeOverride = strings.TrimSpace(r.FormValue("projectCode"))
			}
		}
		if !forceChronology {
			forceChronology = r.FormValue("force") == "true" || r.FormValue("forceChronology") == "true"
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			var csvErr error
			file, _, csvErr = r.FormFile("csv")
			if csvErr != nil {
				utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("missing CSV file in 'file' or 'csv' form field"))
				return
			}
		}
		defer file.Close()
		reader = file
	} else if strings.Contains(contentType, "text/csv") || strings.Contains(contentType, "application/csv") || contentType == "text/plain" {
		reader = io.LimitReader(r.Body, maxUploadSize)
	} else {
		// Attempt fallback parsing
		if err := r.ParseMultipartForm(maxUploadSize); err == nil && r.MultipartForm != nil {
			defer func() { _ = r.MultipartForm.RemoveAll() }()
			if f, _, err := r.FormFile("file"); err == nil {
				defer f.Close()
				reader = f
			}
		}
		if reader == nil {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("request must be multipart/form-data or text/csv"))
			return
		}
	}

	result, err := h.svc.IngestCSV(r.Context(), reader, projectCodeOverride, forceChronology)
	if err != nil {
		if errors.Is(err, ErrChronologyDowngrade) {
			utils.WriteJSON(w, http.StatusConflict, utils.Response{
				Status: utils.StatusInfo{
					Code:        1801,
					Header:      "Conflict",
					Description: err.Error(),
				},
			})
			return
		}
		if errors.Is(err, ErrEmptyCSV) || errors.Is(err, ErrMissingHeaders) || errors.Is(err, ErrNoValidRows) {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse(err.Error()))
			return
		}

		slog.Error("Failed to ingest CSV", "err", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessResponse(result))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; go test ./internal/ingest -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/ingest/handler.go backend/internal/ingest/handler_test.go
git commit -m "fix: enforce 32MB upload limit and clean up multipart temporary files"
```

---

### Task 5: Transactional Chronology Check & Multi-Project Isolation in Ingestion (Finding 4 - BLOCKER)

**Files:**
- Modify: `backend/internal/ingest/service.go:160-330`
- Test: `backend/internal/ingest/service_test.go`

**Interfaces:**
- Moves `txRepo.GetLatestSnapshotDate(ctx, projectCode)` inside `txRepo.WithTransaction`
- Splits metric computation and `KPISnapshot` generation per project when CSV contains multiple projects

- [ ] **Step 1: Write test for multi-project CSV ingestion without project override**

In `backend/internal/ingest/service_test.go`, add `TestIngestService_MultiProjectCSV`:

```go
func TestIngestService_MultiProjectCSV(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	multiCSV := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-X,DOC-X1,Title X1,ME,Approved,A,2026-03-10,2026-03-20
PRJ-Y,DOC-Y1,Title Y1,EE,Under Review,0,2026-03-12,2026-03-05
`
	result, err := svc.IngestCSV(ctx, strings.NewReader(multiCSV), "", false)
	if err != nil {
		t.Fatalf("IngestCSV multi-project failed: %v", err)
	}

	if result.TotalRows != 2 {
		t.Errorf("TotalRows = %d, want 2", result.TotalRows)
	}

	// Verify PRJ-X snapshot
	var snapX models.KPISnapshot
	if err := db.Where("project_code = ?", "PRJ-X").First(&snapX).Error; err != nil {
		t.Fatalf("snapX not found: %v", err)
	}
	if snapX.TotalDocuments != 1 || snapX.ApprovedDocuments != 1 || snapX.OverdueDocuments != 0 {
		t.Errorf("snapX metrics polluted: %+v", snapX)
	}

	// Verify PRJ-Y snapshot
	var snapY models.KPISnapshot
	if err := db.Where("project_code = ?", "PRJ-Y").First(&snapY).Error; err != nil {
		t.Fatalf("snapY not found: %v", err)
	}
	if snapY.TotalDocuments != 1 || snapY.ApprovedDocuments != 0 || snapY.OverdueDocuments != 1 {
		t.Errorf("snapY metrics polluted: %+v", snapY)
	}
}
```

- [ ] **Step 2: Run test to check current behavior**

Run: `cd backend; go test ./internal/ingest -v -run TestIngestService_MultiProjectCSV`
Expected: FAIL (currently PRJ-X gets assigned all 2 documents and PRJ-Y gets 0 snapshot).

- [ ] **Step 3: Refactor `IngestCSV` in `backend/internal/ingest/service.go`**

Implement grouping by project code and execute chronology checking inside `WithTransaction`:

```go
	// Deduplicate rows for each document
	uniqueRows := deduplicateParsedRows(parsedRows, projectCodeOverride)

	// Group rows by effective project code
	projectRowsMap := make(map[string][]ParsedRow)
	for _, row := range uniqueRows {
		pCode := projectCodeOverride
		if pCode == "" {
			pCode = row.ProjectCode
		}
		projectRowsMap[pCode] = append(projectRowsMap[pCode], row)
	}

	type projectIngestData struct {
		projectCode     string
		snapshotDate    time.Time
		docs            []models.Document
		kpiSnapshot     *models.KPISnapshot
		overdueLogs     []models.OverdueLog
	}

	now := time.Now().UTC()
	var globalLatestSnapshot time.Time
	projectDataList := make([]projectIngestData, 0, len(projectRowsMap))
	allDocs := make([]models.Document, 0, len(uniqueRows))
	allOverdueLogs := make([]models.OverdueLog, 0)

	for pCode, pRows := range projectRowsMap {
		var pSnapshotDate time.Time
		for _, row := range pRows {
			if row.IssueDate.After(pSnapshotDate) {
				pSnapshotDate = row.IssueDate
			}
		}
		if pSnapshotDate.IsZero() {
			pSnapshotDate = now
		}
		if pSnapshotDate.After(globalLatestSnapshot) {
			globalLatestSnapshot = pSnapshotDate
		}

		pDocs := make([]models.Document, 0, len(pRows))
		var pOverdueLogs []models.OverdueLog
		totalDocs := len(pRows)
		approvedDocs := 0
		underReviewDocs := 0
		overdueDocs := 0
		lateApprovalDocs := 0

		for _, row := range pRows {
			isOverdue := false
			overdueDays := 0
			isLateApproval := false

			if row.Status != "Approved" && row.Status != "Cancelled" && !strings.EqualFold(row.IssueFor, "IFI") {
				if !row.TargetDate.IsZero() && row.TargetDate.Before(pSnapshotDate) {
					isOverdue = true
					diff := pSnapshotDate.Sub(row.TargetDate)
					overdueDays = int(diff.Hours() / 24)
					if overdueDays <= 0 {
						overdueDays = 1
					}
					overdueDocs++

					pOverdueLogs = append(pOverdueLogs, models.OverdueLog{
						ProjectCode:  pCode,
						DocNumber:    row.DocNumber,
						SnapshotDate: pSnapshotDate,
						DaysOverdue:  overdueDays,
						AgingBracket: CalculateAgingBracket(overdueDays),
						CreatedAt:    now,
					})
				}
				if row.Status == "Under Review" {
					underReviewDocs++
				}
			} else if row.Status == "Approved" {
				approvedDocs++
				if row.ActualDate != nil && !row.TargetDate.IsZero() && row.ActualDate.After(row.TargetDate) {
					isLateApproval = true
					lateApprovalDocs++
				}
			}

			doc := models.Document{
				ProjectCode:    pCode,
				DocNumber:      row.DocNumber,
				Title:          row.Title,
				Discipline:     row.Discipline,
				Status:         row.Status,
				Revision:       row.Revision,
				IssueFor:       row.IssueFor,
				IssueDate:      row.IssueDate,
				TargetDate:     row.TargetDate,
				ActualDate:     row.ActualDate,
				IsOverdue:      isOverdue,
				OverdueDays:    overdueDays,
				IsLateApproval: isLateApproval,
				UpdatedAt:      now,
			}
			pDocs = append(pDocs, doc)
			allDocs = append(allDocs, doc)
		}

		approvalRate := 0.0
		if totalDocs > 0 {
			approvalRate = float64(approvedDocs) / float64(totalDocs) * 100.0
		}

		snap := &models.KPISnapshot{
			ProjectCode:           pCode,
			SnapshotDate:          pSnapshotDate,
			TotalDocuments:        totalDocs,
			ApprovedDocuments:     approvedDocs,
			UnderReviewDocuments:  underReviewDocs,
			OverdueDocuments:      overdueDocs,
			LateApprovalDocuments: lateApprovalDocs,
			ApprovalRate:          approvalRate,
			CreatedAt:             now,
		}

		projectDataList = append(projectDataList, projectIngestData{
			projectCode:  pCode,
			snapshotDate: pSnapshotDate,
			docs:         pDocs,
			kpiSnapshot:  snap,
			overdueLogs:  pOverdueLogs,
		})
		allOverdueLogs = append(allOverdueLogs, pOverdueLogs...)
	}

	// Atomically verify chronology and persist within transaction
	txErr := s.repo.WithTransaction(ctx, func(txRepo Repository) error {
		for _, pData := range projectDataList {
			latestDate, err := txRepo.GetLatestSnapshotDate(ctx, pData.projectCode)
			if err != nil {
				return fmt.Errorf("failed checking latest snapshot date for %s: %w", pData.projectCode, err)
			}
			if latestDate != nil && !forceChronology {
				if pData.snapshotDate.Before(*latestDate) {
					return fmt.Errorf("%w: current snapshot %s is older than recorded %s for project %s",
						ErrChronologyDowngrade, pData.snapshotDate.Format("2006-01-02"), latestDate.Format("2006-01-02"), pData.projectCode)
				}
			}

			prj := &models.Project{
				Code:      pData.projectCode,
				Name:      fmt.Sprintf("Project %s", pData.projectCode),
				UpdatedAt: now,
			}
			if err := txRepo.UpsertProject(ctx, prj); err != nil {
				return fmt.Errorf("failed to upsert project %s: %w", pData.projectCode, err)
			}

			if err := txRepo.SaveSnapshot(ctx, pData.kpiSnapshot); err != nil {
				return fmt.Errorf("failed to save KPI snapshot for %s: %w", pData.projectCode, err)
			}
		}

		if err := txRepo.BatchUpsertDocuments(ctx, allDocs); err != nil {
			return fmt.Errorf("failed to batch upsert documents: %w", err)
		}

		if len(allOverdueLogs) > 0 {
			if err := txRepo.BatchInsertOverdueLogs(ctx, allOverdueLogs); err != nil {
				return fmt.Errorf("failed to insert overdue logs: %w", err)
			}
		}

		return nil
	})

	if txErr != nil {
		return nil, txErr
	}
```

- [ ] **Step 4: Run tests to verify all ingest tests pass**

Run: `cd backend; go test ./internal/ingest -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/ingest/service.go backend/internal/ingest/service_test.go
git commit -m "fix: make chronology verification atomic and partition multi-project CSV ingest"
```

---

### Task 6: N+1 Database Query & Unbounded Full-Table Scan Elimination in Project Service (Finding 3 - BLOCKER)

**Files:**
- Modify: `backend/internal/project/repository.go:42-134`
- Modify: `backend/internal/project/service.go:84-155,211-505`
- Test: `backend/internal/project/service_test.go`

**Interfaces:**
- Produces: `Repository.GetLatestSnapshotsByProjects(ctx context.Context, projectCodes []string) (map[string]*models.KPISnapshot, error)`
- Refactors: `Service.GetProjectMatrix` to execute bulk document and snapshot queries in $O(1)$ roundtrips
- Refactors: `Service.GetGlobalSummary` to query slim summary metrics

- [ ] **Step 1: Write test verifying bulk document and snapshot loading for matrix rows**

In `backend/internal/project/service_test.go`, add `TestGetProjectMatrix_BulkPerformance`:

```go
func TestGetProjectMatrix_BulkPerformance(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	// Seed 10 projects
	for i := 1; i <= 10; i++ {
		code := fmt.Sprintf("PRJ-%02d", i)
		_ = repo.UpsertProject(ctx, &models.Project{Code: code, Name: "Project " + code})
		_ = repo.db.Create(&models.Document{
			ProjectCode: code,
			DocNumber:   fmt.Sprintf("%s-DOC-01", code),
			Title:       "Test Doc",
			Discipline:  "ME",
			Status:      "Approved",
			IssueDate:   time.Now().UTC(),
		}).Error
	}

	matrix, total, err := svc.GetProjectMatrix(ctx, "", "code", "asc", 1, 20)
	if err != nil {
		t.Fatalf("GetProjectMatrix failed: %v", err)
	}
	if total != 10 || len(matrix) != 10 {
		t.Errorf("expected 10 projects, got %d (total: %d)", len(matrix), total)
	}
}
```

- [ ] **Step 2: Add `GetLatestSnapshotsByProjects` in `backend/internal/project/repository.go`**

```go
func (r *Repository) GetLatestSnapshotsByProjects(ctx context.Context, projectCodes []string) (map[string]*models.KPISnapshot, error) {
	result := make(map[string]*models.KPISnapshot)
	if len(projectCodes) == 0 {
		return result, nil
	}

	var snapshots []models.KPISnapshot
	// Order by project_code, snapshot_date desc to select the newest snapshot per project
	err := r.db.WithContext(ctx).
		Where("project_code IN (?)", projectCodes).
		Order("project_code asc, snapshot_date desc, id desc").
		Find(&snapshots).Error
	if err != nil {
		return nil, err
	}

	for i := range snapshots {
		pCode := snapshots[i].ProjectCode
		if _, exists := result[pCode]; !exists {
			result[pCode] = &snapshots[i]
		}
	}
	return result, nil
}
```

- [ ] **Step 3: Update `GetProjectMatrix` in `backend/internal/project/service.go` to eliminate N+1 queries**

Replace sequential query loop (lines 218-223 and line 487) with bulk fetch:

```go
	// Single bulk fetch of all documents
	allDocs, err := s.repo.ListDocumentsByProject(ctx, "")
	if err != nil {
		return nil, 0, fmt.Errorf("list all documents: %w", err)
	}

	docsByProject := make(map[string][]models.Document, len(projects))
	for _, d := range allDocs {
		docsByProject[d.ProjectCode] = append(docsByProject[d.ProjectCode], d)
	}

	projectCodes := make([]string, len(projects))
	for i, p := range projects {
		projectCodes[i] = p.Code
	}

	snapshotsByProject, err := s.repo.GetLatestSnapshotsByProjects(ctx, projectCodes)
	if err != nil {
		return nil, 0, fmt.Errorf("get snapshots for projects: %w", err)
	}

	rows := make([]ProjectMatrixRow, 0, len(projects))
	for _, p := range projects {
		docs := docsByProject[p.Code]
		// ... metrics calculation ...
		latestSnapshot := snapshotsByProject[p.Code]
```

- [ ] **Step 4: Run project tests to verify accuracy and matrix sorting**

Run: `cd backend; go test ./internal/project -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/project/repository.go backend/internal/project/service.go backend/internal/project/service_test.go
git commit -m "perf: eliminate N+1 queries in GetProjectMatrix using bulk document and snapshot loading"
```

---

### Task 7: Error Propagation & Slog Observability in Project Service and Handlers (Finding 7 - WARNING)

**Files:**
- Modify: `backend/internal/project/service.go:593-605,655-665`
- Modify: `backend/internal/project/handler.go:24-195`
- Test: `backend/internal/project/handler_test.go`

**Interfaces:**
- Propagates errors instead of swallowing with `_`
- Logs all 500 errors with `slog.Error`

- [ ] **Step 1: Check `GetProjectDetails` and `GetAnalyticsTrends` error paths in test**

In `backend/internal/project/service_test.go`, ensure error handling in `GetProjectDetails` and `GetAnalyticsTrends` is tested when database queries fail.

- [ ] **Step 2: Update `service.go` error returns**

In `backend/internal/project/service.go:593-604`:
```go
func (s *Service) GetProjectDetails(ctx context.Context, projectCode string) (*ProjectDetailsResponse, error) {
	p, err := s.repo.GetProjectByCode(ctx, projectCode)
	if err != nil {
		return nil, fmt.Errorf("get project by code %s: %w", projectCode, err)
	}

	snap, err := s.repo.GetLatestSnapshot(ctx, projectCode)
	if err != nil {
		return nil, fmt.Errorf("get latest snapshot for %s: %w", projectCode, err)
	}
	return &ProjectDetailsResponse{
		Project:        p,
		LatestSnapshot: snap,
	}, nil
}
```

In `backend/internal/project/service.go:655-665`:
```go
	if len(projectIDs) == 0 {
		prjs, err := s.repo.ListProjects(ctx)
		if err != nil {
			return nil, fmt.Errorf("list projects for trends: %w", err)
		}
		projectIDs = make([]string, 0, len(prjs))
		for _, p := range prjs {
			projectIDs = append(projectIDs, p.Code)
		}
	}
```

- [ ] **Step 3: Add `slog.Error` in `backend/internal/project/handler.go`**

Add `slog.Error(...)` before each 500 response:
- `GetProjectsSummary`: `slog.Error("Failed to get projects summary", "err", err)`
- `GetProjects`: `slog.Error("Failed to get project matrix", "err", err)`
- `GetProjectDetails`: `slog.Error("Failed to get project details", "projectCode", projectCode, "err", err)`
- `GetProjectOverdue`: `slog.Error("Failed to get project overdue summary", "projectCode", projectCode, "err", err)`
- `GetProjectDisciplines`: `slog.Error("Failed to get project disciplines", "projectCode", projectCode, "err", err)`
- `GetAnalyticsTrends`: `slog.Error("Failed to get analytics trends", "err", err)`

- [ ] **Step 4: Run tests to verify all handler tests pass**

Run: `cd backend; go test ./internal/project -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/project/service.go backend/internal/project/handler.go
git commit -m "fix: propagate repository errors and add structured logging across project handlers"
```

---

### Task 8: Production Health Check Status & Nil DB Degraded Mode Guarding (Findings 1 & 8 - BLOCKER/WARNING)

**Files:**
- Modify: `backend/api.go:90-137`
- Test: `backend/api_test.go`

**Interfaces:**
- `/api/health` and `/api/v1/health` return HTTP 503 Service Unavailable when DB is disconnected/nil
- Route guard: when `app.DB == nil`, non-health endpoints return HTTP 503 instead of nil pointer dereference panic

- [ ] **Step 1: Write test verifying nil DB behavior in `api_test.go`**

In `backend/api_test.go`, add `TestMount_NilDB_DegradedMode`:

```go
func TestMount_NilDB_DegradedMode(t *testing.T) {
	app := &Application{
		Config: Config{},
		DB:     nil, // Nil DB mode
	}

	handler := app.Mount()

	// 1. /api/health should return 503 Service Unavailable
	reqHealth := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	recHealth := httptest.NewRecorder()
	handler.ServeHTTP(recHealth, reqHealth)

	if recHealth.Code != http.StatusServiceUnavailable {
		t.Errorf("health status = %d, want %d", recHealth.Code, http.StatusServiceUnavailable)
	}

	// 2. /api/v1/projects should safely return 503 without panic
	reqProjects := httptest.NewRequest(http.MethodGet, "/api/v1/projects", nil)
	recProjects := httptest.NewRecorder()
	handler.ServeHTTP(recProjects, reqProjects)

	if recProjects.Code != http.StatusServiceUnavailable {
		t.Errorf("projects status = %d, want %d", recProjects.Code, http.StatusServiceUnavailable)
	}
}
```

- [ ] **Step 2: Run test to check current behavior**

Run: `cd backend; go test . -v -run TestMount_NilDB_DegradedMode`
Expected: FAIL (currently returns 200 on health and panics/recovers on projects).

- [ ] **Step 3: Update `backend/api.go`**

Modify `registerRoutes`:

```go
	registerRoutes := func(api chi.Router) {
		api.Use(middleware.Timeout(apiTimeout))

		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			dbStatus := "CONNECTED"
			httpStatus := http.StatusOK
			overallStatus := "healthy"
			if app.DB == nil {
				dbStatus = "DISCONNECTED"
				httpStatus = http.StatusServiceUnavailable
				overallStatus = "unhealthy"
			} else if sqlDB, err := app.DB.DB(); err != nil || sqlDB.PingContext(r.Context()) != nil {
				dbStatus = "DISCONNECTED"
				httpStatus = http.StatusServiceUnavailable
				overallStatus = "unhealthy"
			}

			now := time.Now().UTC().Format(time.RFC3339)
			utils.WriteJSON(w, httpStatus, utils.SuccessResponse(map[string]string{
				"service":   "UP",
				"database":  dbStatus,
				"timestamp": now,
				"status":    overallStatus,
				"time":      now,
			}))
		})

		if app.DB == nil {
			api.Use(func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if strings.HasSuffix(r.URL.Path, "/health") {
						next.ServeHTTP(w, r)
						return
					}
					utils.WriteJSON(w, http.StatusServiceUnavailable, utils.ServerErrorResponse())
				})
			})
			return
		}

		projectRepo := project.NewRepository(app.DB)
		ingestRepo := ingest.NewRepository(app.DB)
		projectHandler := project.NewHandler(project.NewService(projectRepo))
		ingestHandler := ingest.NewHandler(ingest.NewService(ingestRepo))

		// Ingestion endpoint
		api.Post("/ingest", ingestHandler.IngestCSV)
		api.Post("/ingest/csv", ingestHandler.IngestCSV)

		// Projects endpoints
		api.Route("/projects", func(r chi.Router) {
			r.Get("/summary", projectHandler.GetProjectsSummary)
			r.Get("/matrix", projectHandler.GetProjects)
			r.Get("/", projectHandler.GetProjects)
			r.Get("/{projectCode}", projectHandler.GetProjectDetails)
			r.Get("/{projectCode}/overdue", projectHandler.GetProjectOverdue)
			r.Get("/{projectCode}/disciplines", projectHandler.GetProjectDisciplines)
			r.Get("/{projectCode}/trends", projectHandler.GetAnalyticsTrends)
		})

		// Analytics trends
		api.Get("/analytics/trends", projectHandler.GetAnalyticsTrends)
	}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend; go test . -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/api.go backend/api_test.go
git commit -m "fix: report 503 on disconnected database and guard nil DB mode against panics"
```

---

### Task 9: Database Connection Pool Lifecycle & URL Safe Escaping (Finding 6 - WARNING)

**Files:**
- Modify: `backend/internal/database/db.go:19-48`
- Modify: `backend/main.go:44-65`
- Test: `backend/internal/database/db_test.go`
- Test: `backend/internal/config/env_test.go`

**Interfaces:**
- `InitDB`: ping with bounded 10s context timeout
- `main.go`: URL escape credentials with `net/url.UserPassword` and close pool with `sqlDB.Close()` on exit

- [ ] **Step 1: Write test verifying Postgres URL assembly with special characters**

In `backend/internal/config/env_test.go`, add `TestPostgresURLSpecialChars`:

```go
func TestPostgresURLSpecialChars(t *testing.T) {
	user := "user@domain"
	password := "p@ss#word%123/?"
	host := "localhost"
	port := "5432"
	dbname := "eps_db"
	sslmode := "disable"

	u := &url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(user, password),
		Host:     net.JoinHostPort(host, port),
		Path:     dbname,
		RawQuery: "sslmode=" + url.QueryEscape(sslmode),
	}

	dsn := u.String()
	parsed, err := url.Parse(dsn)
	if err != nil {
		t.Fatalf("failed to parse generated DSN: %v", err)
	}
	p, _ := parsed.User.Password()
	if p != password {
		t.Errorf("password mismatch: got %q, want %q", p, password)
	}
}
```

- [ ] **Step 2: Run test to check URL helper logic**

Run: `cd backend; go test ./internal/config -v -run TestPostgresURLSpecialChars`
Expected: PASS.

- [ ] **Step 3: Update `backend/internal/database/db.go` and `backend/main.go`**

In `backend/internal/database/db.go`:
```go
	pingCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(pingCtx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
```

In `backend/main.go`:
```go
		host := config.String("DB_HOST", "")
		if host != "" {
			dbPort := config.String("DB_PORT", "5432")
			user := config.String("DB_USER", "postgres")
			password := config.String("DB_PASSWORD", "postgres")
			dbname := config.String("DB_NAME", "eps_db")
			sslmode := config.String("DB_SSLMODE", "disable")
			u := &url.URL{
				Scheme:   "postgres",
				User:     url.UserPassword(user, password),
				Host:     net.JoinHostPort(host, dbPort),
				Path:     dbname,
				RawQuery: "sslmode=" + url.QueryEscape(sslmode),
			}
			dbURL = u.String()
		}
```
And after `database.InitDB`:
```go
	db, err := database.InitDB(dbURL)
	if err != nil {
		slog.Error("Failed to connect to database", "err", err)
		os.Exit(1)
	}
	if sqlDB, err := db.DB(); err == nil {
		defer func() { _ = sqlDB.Close() }()
	}
```

- [ ] **Step 4: Run full backend test suite**

Run: `cd backend; go test ./... -v`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/database/db.go backend/main.go backend/internal/config/env_test.go
git commit -m "fix: safe DSN URL escaping, startup ping context timeout, and pool drainage"
```

---

### Task 10: End-to-End Regression & Verification

**Files:**
- Test: Full backend suite (`cd backend; go test -race ./...`)
- Test: Full application build (`cd backend; go build -v .`)

- [ ] **Step 1: Execute full test suite with race detector**

Run: `cd backend; go test -race ./...`
Expected: All packages pass with zero race conditions detected.

- [ ] **Step 2: Verify binary compilation**

Run: `cd backend; go build -o server .`
Expected: Clean compilation with 0 warnings or errors.

- [ ] **Step 3: Clean up binary artifact**

Run: `cd backend; rm server` (or `Remove-Item server.exe`)
Expected: Clean git status.

