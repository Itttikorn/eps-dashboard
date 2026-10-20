package ingest

import (
	"bytes"
	"context"
	"errors"
	"os"
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

func TestIngestService_ActualDataDirectoryFiles(t *testing.T) {
	files := []struct {
		path               string
		wantProjectCode    string
		totalRows          int
		expectedUniqueDocs int
	}{
		{
			path:               "../../../data/AUTOEMAIL_FILE_06_SKK-IM-CM-26002_2026-09-25 150903 (1) 1.csv",
			wantProjectCode:    "SKK-IM-CM-26002",
			totalRows:          67,
			expectedUniqueDocs: 36,
		},
		{
			path:               "../../../data/AUTOEMAIL_FILE_06_STS-CN-PP-26001_2026-09-25 151017 (1).csv",
			wantProjectCode:    "STS-CN-PP-26001",
			totalRows:          480,
			expectedUniqueDocs: 304,
		},
		{
			path:               "../../../data/AUTOEMAIL_FILE_06_STS-EN-PP-26001_2026-09-25 151024.csv",
			wantProjectCode:    "STS-EN-PP-26001",
			totalRows:          1928,
			expectedUniqueDocs: 827,
		},
	}

	for _, tt := range files {
		t.Run(tt.wantProjectCode, func(t *testing.T) {
			data, err := os.ReadFile(tt.path)
			if err != nil {
				altPath := strings.Replace(tt.path, ".csv", " - Copy.csv", 1)
				data, err = os.ReadFile(altPath)
				if err != nil {
					t.Skipf("File not accessible: %v", err)
				}
			}

			db := database.NewTestDB(t)
			repo := NewRepository(db)
			svc := NewService(repo)
			ctx := context.Background()

			result, err := svc.IngestCSV(ctx, bytes.NewReader(data), "", true)
			if err != nil {
				t.Fatalf("IngestCSV failed on %s: %v", tt.path, err)
			}

			if result.ProjectCode != tt.wantProjectCode {
				t.Errorf("result.ProjectCode = %q, want %q", result.ProjectCode, tt.wantProjectCode)
			}
			if result.ProcessedCount != tt.totalRows {
				t.Errorf("result.ProcessedCount = %d, want %d", result.ProcessedCount, tt.totalRows)
			}

			// Verify project exists in DB
			var prj models.Project
			if err := db.Where("code = ?", tt.wantProjectCode).First(&prj).Error; err != nil {
				t.Fatalf("Project record not created in DB: %v", err)
			}

			// Verify unique documents were saved in DB
			var docCount int64
			if err := db.Model(&models.Document{}).Where("project_code = ?", tt.wantProjectCode).Count(&docCount).Error; err != nil {
				t.Fatalf("Failed counting documents: %v", err)
			}
			if int(docCount) != tt.expectedUniqueDocs {
				t.Errorf("Document DB count = %d, want %d", docCount, tt.expectedUniqueDocs)
			}

			// Verify KPI snapshot exists and reflects the new truthful overdue criteria
			var snap models.KPISnapshot
			if err := db.Where("project_code = ?", tt.wantProjectCode).First(&snap).Error; err != nil {
				t.Fatalf("Failed querying snapshot: %v", err)
			}

			switch tt.wantProjectCode {
			case "STS-EN-PP-26001":
				// STS-EN has 813 IFI vendor deliverables; new criteria correctly marks 0 overdue
				if snap.OverdueDocuments != 0 {
					t.Errorf("STS-EN OverdueDocuments = %d, want 0", snap.OverdueDocuments)
				}
			case "SKK-IM-CM-26002":
				// Exactly 1 actionable IFA deliverable is overdue by 1 day (CM24045-SKK-EX00-MS-0001)
				if snap.OverdueDocuments != 1 {
					t.Errorf("SKK OverdueDocuments = %d, want 1", snap.OverdueDocuments)
				}
			case "STS-CN-PP-26001":
				// 68 actionable open documents past due date
				if snap.OverdueDocuments != 68 {
					t.Errorf("STS-CN OverdueDocuments = %d, want 68", snap.OverdueDocuments)
				}
			}
		})
	}
}

func TestIngestService_DuplicateDocumentRowsInSingleSnapshot(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	// 4 rows for DOC-001 with varying revisions and transmittal dates, 1 row for DOC-002
	csvContent := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-DEDUP,DOC-001,Piping Layout Initial,ME,Approved,00,2026-03-01,2026-03-10
PRJ-DEDUP,DOC-001,Piping Layout IFA,ME,Under Review,01,2026-03-15,2026-03-25
PRJ-DEDUP,DOC-001,Piping Layout IFC,ME,Approved,02,2026-04-01,2026-04-15
PRJ-DEDUP,DOC-001,Piping Layout IFC Package 2,ME,Approved,02,2026-04-01,2026-04-15
PRJ-DEDUP,DOC-002,Electrical Diagram,EE,Under Review,A,2026-04-01,2026-04-10
`

	result, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "", false)
	if err != nil {
		t.Fatalf("IngestCSV failed with duplicates: %v", err)
	}

	if result.TotalRows != 5 {
		t.Errorf("result.TotalRows = %d, want 5", result.TotalRows)
	}
	if result.DeltasUpdated != 2 {
		t.Errorf("result.DeltasUpdated = %d, want 2 (2 unique documents)", result.DeltasUpdated)
	}
	if result.SkippedUnchanged != 3 {
		t.Errorf("result.SkippedUnchanged = %d, want 3 (3 superseded rows)", result.SkippedUnchanged)
	}

	var docs []models.Document
	if err := db.Where("project_code = ?", "PRJ-DEDUP").Order("doc_number asc").Find(&docs).Error; err != nil {
		t.Fatalf("failed to query docs: %v", err)
	}

	if len(docs) != 2 {
		t.Fatalf("expected 2 unique documents in DB, got %d", len(docs))
	}

	// DOC-001 should have the highest revision (02) and latest title
	if docs[0].Revision != "02" {
		t.Errorf("DOC-001 revision = %q, want '02'", docs[0].Revision)
	}
	if docs[0].Status != "Approved" {
		t.Errorf("DOC-001 status = %q, want 'Approved'", docs[0].Status)
	}
}

func TestIngestService_NewCriteria_IFI_NeverOverdue(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	// Snapshot date will be 2026-03-25 (latest issue date)
	csvContent := `project_code,doc_number,title,discipline,issuefor,laststatus,docstatus,issue_date,target_date,responsedate
PRJ-NEW,DOC-IFI-01,ABB Manual,ME,IFI,00:NO FLOW,A,2026-03-01,2026-03-05,
PRJ-NEW,DOC-IFA-OVERDUE,Piping Approval,ME,IFA,40:WAIT,A,2026-03-01,2026-03-10,
PRJ-NEW,DOC-IFA-OK,Electrical Dwg,EE,IFA,40:WAIT,A,2026-03-25,2026-04-10,
PRJ-NEW,DOC-IFA-LATE,Civil Foundation,CE,IFA,50:RETURN,A,2026-03-01,2026-03-10,2026-03-15
`

	result, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "", false)
	if err != nil {
		t.Fatalf("IngestCSV failed: %v", err)
	}
	if result.ProcessedCount != 4 {
		t.Errorf("ProcessedCount = %d, want 4", result.ProcessedCount)
	}

	var docs []models.Document
	if err := db.Where("project_code = ?", "PRJ-NEW").Order("doc_number asc").Find(&docs).Error; err != nil {
		t.Fatalf("failed querying docs: %v", err)
	}
	if len(docs) != 4 {
		t.Fatalf("expected 4 docs, got %d", len(docs))
	}

	docMap := make(map[string]models.Document)
	for _, d := range docs {
		docMap[d.DocNumber] = d
	}

	// 1. DOC-IFI-01: TargetDate is 2026-03-05 (< 2026-03-25), but because it is IFI, it is Approved and NEVER overdue
	ifiDoc := docMap["DOC-IFI-01"]
	if ifiDoc.Status != "Approved" {
		t.Errorf("DOC-IFI-01 status = %q, want 'Approved'", ifiDoc.Status)
	}
	if ifiDoc.IsOverdue {
		t.Errorf("DOC-IFI-01 isOverdue = true, want false (IFI must never be overdue)")
	}
	if ifiDoc.OverdueDays != 0 {
		t.Errorf("DOC-IFI-01 overdueDays = %d, want 0", ifiDoc.OverdueDays)
	}

	// 2. DOC-IFA-OVERDUE: Actionable IFA, 40:WAIT, target 2026-03-10 (< 2026-03-25) -> Under Review & Overdue
	ifaOverdue := docMap["DOC-IFA-OVERDUE"]
	if ifaOverdue.Status != "Under Review" {
		t.Errorf("DOC-IFA-OVERDUE status = %q, want 'Under Review'", ifaOverdue.Status)
	}
	if !ifaOverdue.IsOverdue {
		t.Errorf("DOC-IFA-OVERDUE isOverdue = false, want true")
	}
	if ifaOverdue.OverdueDays <= 0 {
		t.Errorf("DOC-IFA-OVERDUE overdueDays = %d, want > 0", ifaOverdue.OverdueDays)
	}

	// 3. DOC-IFA-OK: Actionable IFA, 40:WAIT, target 2026-04-10 (> 2026-03-25) -> Under Review but NOT Overdue
	ifaOk := docMap["DOC-IFA-OK"]
	if ifaOk.Status != "Under Review" {
		t.Errorf("DOC-IFA-OK status = %q, want 'Under Review'", ifaOk.Status)
	}
	if ifaOk.IsOverdue {
		t.Errorf("DOC-IFA-OK isOverdue = true, want false")
	}

	// 4. DOC-IFA-LATE: Actionable IFA, returned 2026-03-15 after target 2026-03-10 -> Approved and Late Approval
	ifaLate := docMap["DOC-IFA-LATE"]
	if ifaLate.Status != "Approved" {
		t.Errorf("DOC-IFA-LATE status = %q, want 'Approved'", ifaLate.Status)
	}
	if ifaLate.IsOverdue {
		t.Errorf("DOC-IFA-LATE isOverdue = true, want false")
	}
	if !ifaLate.IsLateApproval {
		t.Errorf("DOC-IFA-LATE isLateApproval = false, want true")
	}

	// Verify KPI snapshot totals
	var snap models.KPISnapshot
	if err := db.Where("project_code = ?", "PRJ-NEW").First(&snap).Error; err != nil {
		t.Fatalf("failed querying snapshot: %v", err)
	}
	if snap.TotalDocuments != 4 {
		t.Errorf("snap.TotalDocuments = %d, want 4", snap.TotalDocuments)
	}
	if snap.ApprovedDocuments != 2 { // DOC-IFI-01 and DOC-IFA-LATE
		t.Errorf("snap.ApprovedDocuments = %d, want 2", snap.ApprovedDocuments)
	}
	if snap.UnderReviewDocuments != 2 { // DOC-IFA-OVERDUE and DOC-IFA-OK
		t.Errorf("snap.UnderReviewDocuments = %d, want 2", snap.UnderReviewDocuments)
	}
	if snap.OverdueDocuments != 1 { // Only DOC-IFA-OVERDUE
		t.Errorf("snap.OverdueDocuments = %d, want 1", snap.OverdueDocuments)
	}
	if snap.LateApprovalDocuments != 1 { // DOC-IFA-LATE
		t.Errorf("snap.LateApprovalDocuments = %d, want 1", snap.LateApprovalDocuments)
	}
}

func TestIngestService_NoDueDate_NeverOverdue(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	ctx := context.Background()

	// Document has issue_date 2026-03-01, but completely omitted target_date.
	// Previously, the system would arbitrarily add 14 days (target: 2026-03-15).
	// Under the new criteria without 14-days fallback, TargetDate remains zero and the doc is NEVER overdue.
	csvContent := `project_code,doc_number,title,discipline,issuefor,laststatus,docstatus,issue_date,target_date
PRJ-NOSLA,DOC-NO-TARGET,General Memo,GEN,IFA,40:WAIT,A,2026-03-01,
PRJ-NOSLA,DOC-WITH-TARGET,Technical Spec,GEN,IFA,40:WAIT,A,2026-03-25,2026-03-10
`

	result, err := svc.IngestCSV(ctx, strings.NewReader(csvContent), "", false)
	if err != nil {
		t.Fatalf("IngestCSV failed: %v", err)
	}
	if result.ProcessedCount != 2 {
		t.Errorf("ProcessedCount = %d, want 2", result.ProcessedCount)
	}

	var docs []models.Document
	if err := db.Where("project_code = ?", "PRJ-NOSLA").Order("doc_number asc").Find(&docs).Error; err != nil {
		t.Fatalf("failed querying docs: %v", err)
	}
	if len(docs) != 2 {
		t.Fatalf("expected 2 docs, got %d", len(docs))
	}

	// DOC-NO-TARGET has no target date -> TargetDate.IsZero() == true, isOverdue == false
	docNoTarget := docs[0]
	if !docNoTarget.TargetDate.IsZero() {
		t.Errorf("expected DOC-NO-TARGET to have zero TargetDate, got %v", docNoTarget.TargetDate)
	}
	if docNoTarget.IsOverdue {
		t.Errorf("DOC-NO-TARGET must NOT be overdue when target_date is not specified")
	}

	// DOC-WITH-TARGET has explicit target date 2026-03-10 (< snapshot 2026-03-25) -> isOverdue == true
	docWithTarget := docs[1]
	if !docWithTarget.IsOverdue {
		t.Errorf("DOC-WITH-TARGET should be overdue")
	}

	var snap models.KPISnapshot
	if err := db.Where("project_code = ?", "PRJ-NOSLA").First(&snap).Error; err != nil {
		t.Fatalf("failed querying snapshot: %v", err)
	}
	if snap.OverdueDocuments != 1 {
		t.Errorf("snap.OverdueDocuments = %d, want 1", snap.OverdueDocuments)
	}
}


