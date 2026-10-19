package ingest

import (
	"context"
	"errors"
	"strings"
	"testing"

	"eps-dashboard/backend/internal/database"
	"eps-dashboard/backend/internal/models"
)

func TestCalculateAgingBracket(t *testing.T) {
	tests := []struct {
		days int
		want string
	}{
		{0, "0-30"},
		{15, "0-30"},
		{30, "0-30"},
		{31, "31-60"},
		{60, "31-60"},
		{61, "61-90"},
		{90, "61-90"},
		{91, ">90"},
		{200, ">90"},
	}

	for _, tt := range tests {
		got := CalculateAgingBracket(tt.days)
		if got != tt.want {
			t.Errorf("CalculateAgingBracket(%d) = %q, want %q", tt.days, got, tt.want)
		}
	}
}

func TestIngestService_IngestCSV_Success(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	csvContent := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-A,DOC-001,Piping Layout,ME,Approved,A,2026-03-01,2026-03-10
PRJ-A,DOC-002,Civil Foundation,CE,Under Review,0,2026-03-15,2026-03-05
PRJ-A,DOC-003,Electrical Single Line,EE,Under Review,B,2026-03-15,2026-03-25
`

	result, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "", false)
	if err != nil {
		t.Fatalf("IngestCSV failed: %v", err)
	}

	if result.ProjectCode != "PRJ-A" {
		t.Errorf("result.ProjectCode = %q, want 'PRJ-A'", result.ProjectCode)
	}
	if result.ProcessedCount != 3 {
		t.Errorf("result.ProcessedCount = %d, want 3", result.ProcessedCount)
	}
	if len(result.Errors) != 0 {
		t.Errorf("expected 0 errors, got %d", len(result.Errors))
	}

	// Verify project was upserted
	var prj models.Project
	if err := db.Where("code = ?", "PRJ-A").First(&prj).Error; err != nil {
		t.Fatalf("project not found in DB: %v", err)
	}

	// Verify documents
	var docs []models.Document
	if err := db.Where("project_code = ?", "PRJ-A").Order("doc_number asc").Find(&docs).Error; err != nil {
		t.Fatalf("failed to query docs: %v", err)
	}
	if len(docs) != 3 {
		t.Fatalf("expected 3 docs, got %d", len(docs))
	}

	// DOC-002 should be overdue (target 2026-03-05 is before snapshot 2026-03-15)
	if !docs[1].IsOverdue {
		t.Errorf("DOC-002 should be overdue")
	}
	if docs[1].OverdueDays <= 0 {
		t.Errorf("DOC-002 overdue days = %d, want > 0", docs[1].OverdueDays)
	}

	// Verify KPI Snapshot
	var snap models.KPISnapshot
	if err := db.Where("project_code = ?", "PRJ-A").First(&snap).Error; err != nil {
		t.Fatalf("failed to query KPI snapshot: %v", err)
	}
	if snap.TotalDocuments != 3 || snap.ApprovedDocuments != 1 || snap.OverdueDocuments != 1 {
		t.Errorf("KPI snapshot values mismatch: %+v", snap)
	}

	// Verify Overdue Logs
	var logs []models.OverdueLog
	if err := db.Where("project_code = ?", "PRJ-A").Find(&logs).Error; err != nil {
		t.Fatalf("failed to query overdue logs: %v", err)
	}
	if len(logs) != 1 {
		t.Fatalf("expected 1 overdue log, got %d", len(logs))
	}
	if logs[0].DocNumber != "DOC-002" {
		t.Errorf("overdue log docNumber = %q, want DOC-002", logs[0].DocNumber)
	}
}

func TestIngestService_FormulaInjection(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	csvContent := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-SEC,=cmd|' /C calc'!A0,+123456,ME,Under Review,0,2026-03-01,2026-03-10
`

	_, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "", false)
	if err != nil {
		t.Fatalf("IngestCSV failed: %v", err)
	}

	var doc models.Document
	if err := db.Where("project_code = ?", "PRJ-SEC").First(&doc).Error; err != nil {
		t.Fatalf("doc not found: %v", err)
	}

	if doc.DocNumber != "'=cmd|' /C calc'!A0" {
		t.Errorf("formula in doc_number not neutralized: %q", doc.DocNumber)
	}
	if doc.Title != "'+123456" {
		t.Errorf("formula in title not neutralized: %q", doc.Title)
	}
}

func TestIngestService_ChronologicalDowngradeProtection(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	firstCSV := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-CHRONO,DOC-001,Title 1,ME,Approved,A,2026-03-20,2026-03-25
`
	_, err := svc.IngestCSV(ctx, strings.NewReader(firstCSV), "", false)
	if err != nil {
		t.Fatalf("first ingestion failed: %v", err)
	}

	// Older snapshot date
	olderCSV := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-CHRONO,DOC-001,Title 1 Older,ME,Approved,A,2026-03-10,2026-03-25
`
	// Attempt downgrade without forceChronology -> expect ErrChronologyDowngrade
	_, err = svc.IngestCSV(ctx, strings.NewReader(olderCSV), "", false)
	if err == nil {
		t.Fatalf("expected chronological downgrade error, got nil")
	}
	if !errors.Is(err, ErrChronologyDowngrade) {
		t.Errorf("expected ErrChronologyDowngrade, got %v", err)
	}

	// Attempt downgrade with forceChronology=true -> should succeed
	res, err := svc.IngestCSV(ctx, strings.NewReader(olderCSV), "", true)
	if err != nil {
		t.Fatalf("forced chronological downgrade failed: %v", err)
	}
	if res.SnapshotDate.Format("2006-01-02") != "2026-03-10" {
		t.Errorf("snapshot date = %s, want 2026-03-10", res.SnapshotDate.Format("2006-01-02"))
	}
}

func TestIngestService_EmptyAndInvalidCSV(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	// Empty CSV
	_, err := svc.IngestCSV(ctx, strings.NewReader(""), "", false)
	if err == nil {
		t.Fatal("expected error for empty CSV, got nil")
	}

	// Headers only, no valid rows
	_, err = svc.IngestCSV(ctx, strings.NewReader("doc_number,title\n"), "", false)
	if !errors.Is(err, ErrNoValidRows) {
		t.Fatalf("expected ErrNoValidRows, got %v", err)
	}

	// Missing required headers
	_, err = svc.IngestCSV(ctx, strings.NewReader("col1,col2\nval1,val2\n"), "", false)
	if err == nil {
		t.Fatal("expected error for missing headers, got nil")
	}
}

func TestIngestService_ProjectOverride(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	csvContent := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-ORIGINAL,DOC-100,Test Doc,ME,Approved,0,2026-03-01,2026-03-15
`
	result, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "PRJ-OVERRIDE", false)
	if err != nil {
		t.Fatalf("IngestCSV with override failed: %v", err)
	}
	if result.ProjectCode != "PRJ-OVERRIDE" {
		t.Errorf("ProjectCode = %q, want 'PRJ-OVERRIDE'", result.ProjectCode)
	}

	var doc models.Document
	if err := db.Where("doc_number = ?", "DOC-100").First(&doc).Error; err != nil {
		t.Fatalf("doc not found: %v", err)
	}
	if doc.ProjectCode != "PRJ-OVERRIDE" {
		t.Errorf("doc.ProjectCode = %q, want 'PRJ-OVERRIDE'", doc.ProjectCode)
	}
}
