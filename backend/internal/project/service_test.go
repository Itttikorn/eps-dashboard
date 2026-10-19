package project

import (
	"context"
	"testing"
	"time"

	"eps-dashboard/backend/internal/database"
	"eps-dashboard/backend/internal/models"
)

func setupTestService(t *testing.T) (*Service, *Repository) {
	t.Helper()
	db, err := database.InitInMemoryDB()
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	if err := database.AutoMigrate(db); err != nil {
		t.Fatalf("failed to automigrate: %v", err)
	}
	repo := NewRepository(db)
	return NewService(repo), repo
}

func TestGetGlobalSummaryAndMatrix(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-A", Name: "Alpha Unit"})
	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-Z", Name: "Zeta Complex"})

	now := time.Now().UTC()
	docsA := []models.Document{
		{ProjectCode: "PRJ-A", DocNumber: "A-01", Title: "T1", Discipline: "ME", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-A", DocNumber: "A-02", Title: "T2", Discipline: "CE", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -5), IsOverdue: true, OverdueDays: 5},
	}
	docsZ := []models.Document{
		{ProjectCode: "PRJ-Z", DocNumber: "Z-01", Title: "T3", Discipline: "EE", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-Z", DocNumber: "Z-02", Title: "T4", Discipline: "EE", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-Z", DocNumber: "Z-03", Title: "T5", Discipline: "ME", Status: "Approved", IssueDate: now, TargetDate: now},
	}
	_ = repo.db.Create(&docsA).Error
	_ = repo.db.Create(&docsZ).Error

	// Summary
	summary, err := svc.GetGlobalSummary(ctx)
	if err != nil {
		t.Fatalf("GetGlobalSummary failed: %v", err)
	}
	if summary.TotalProjects != 2 || summary.TotalDocuments != 5 || summary.ApprovedDocuments != 4 || summary.OverdueDocuments != 1 {
		t.Errorf("unexpected summary: %+v", summary)
	}
	if summary.TotalOverdue != 1 {
		t.Errorf("expected TotalOverdue 1, got %d", summary.TotalOverdue)
	}

	// Matrix default
	matrix, total, err := svc.GetProjectMatrix(ctx, "", "code", "asc", 1, 20)
	if err != nil || len(matrix) != 2 || matrix[0].ProjectCode != "PRJ-A" || total != 2 {
		t.Errorf("unexpected matrix: %+v, total: %d", matrix, total)
	}
	if matrix[0].ProjectID != "PRJ-A" || matrix[0].OverdueCount != 1 {
		t.Errorf("unexpected contract fields on matrix row: %+v", matrix[0])
	}

	// Matrix sort desc
	matrixDesc, totalDesc, _ := svc.GetProjectMatrix(ctx, "", "code", "desc", 1, 20)
	if totalDesc != 2 || matrixDesc[0].ProjectCode != "PRJ-Z" {
		t.Errorf("expected PRJ-Z first on desc, got %s", matrixDesc[0].ProjectCode)
	}

	// Matrix search
	matrixSearch, totalSearch, _ := svc.GetProjectMatrix(ctx, "Alpha", "code", "asc", 1, 20)
	if len(matrixSearch) != 1 || totalSearch != 1 || matrixSearch[0].ProjectCode != "PRJ-A" {
		t.Errorf("expected 1 search result, got %d", len(matrixSearch))
	}
}

func TestGetProjectDetails(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-01", Name: "Project 01"})
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:  "PRJ-01",
		SnapshotDate: time.Now().UTC(),
		ApprovalRate: 90.0,
	})

	details, err := svc.GetProjectDetails(ctx, "PRJ-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if details.Project.Code != "PRJ-01" || details.LatestSnapshot == nil || details.LatestSnapshot.ApprovalRate != 90.0 {
		t.Errorf("unexpected details: %+v", details)
	}

	_, errNotFound := svc.GetProjectDetails(ctx, "NON-EXISTENT")
	if errNotFound == nil {
		t.Errorf("expected not found error")
	}
}

func TestGetDisciplineBreakdownAndOverdueSummary(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-01", Name: "Project 01"})
	now := time.Now().UTC()
	docs := []models.Document{
		{ProjectCode: "PRJ-01", DocNumber: "D-01", Title: "T1", Discipline: "ME", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-01", DocNumber: "D-02", Title: "T2", Discipline: "ME", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -20), IsOverdue: true, OverdueDays: 20},
	}
	_ = repo.db.Create(&docs).Error

	disc, err := svc.GetDisciplineBreakdown(ctx, "PRJ-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if disc["ME"].Total != 2 || disc["ME"].Overdue != 1 {
		t.Errorf("unexpected discipline metrics: %+v", disc["ME"])
	}

	overdue, err := svc.GetOverdueSummary(ctx, "PRJ-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if overdue.TotalOverdue != 1 || overdue.AgingBuckets["0-30"] != 1 {
		t.Errorf("unexpected overdue summary: %+v", overdue)
	}
}

func TestGetAnalyticsTrends(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	now := time.Now().UTC().Truncate(time.Second)
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:  "PRJ-01",
		SnapshotDate: now,
		ApprovalRate: 85.0,
	})

	trends, err := svc.GetAnalyticsTrends(ctx, []string{"PRJ-01"}, now.AddDate(0, 0, -1), now.AddDate(0, 0, 1), "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(trends) != 1 || trends[0].ApprovalRate != 85.0 {
		t.Errorf("unexpected trends: %+v", trends)
	}
	if pMetric, ok := trends[0].ProjectMetrics["PRJ-01"]; !ok || pMetric.ApprovalRate != 85.0 {
		t.Errorf("missing or invalid ProjectMetrics in trend: %+v", trends[0])
	}
}

func TestClassifyCategory(t *testing.T) {
	tests := []struct {
		docNum     string
		title      string
		status     string
		wantCat    string
		wantClosed bool
	}{
		{"DOC-ITP-01", "Inspection Plan", "Open", CategoryControl, false},
		{"DOC-001", "RFI Response", "Closed", CategoryControl, true},
		{"DOC-ITR-02", "Test Record", "Under Review", CategoryControl, false},
		{"DOC-NCR-10", "Non Conformance", "Pending", CategoryCorrective, false},
		{"DOC-002", "CAR Item", "Completed", CategoryCorrective, true},
		{"DOC-PCR-01", "Project Change Request", "Submitted", CategoryChange, false},
		{"DOC-003", "FCR Review", "Approved", CategoryChange, true},
		{"DOC-DCR-05", "Design Change", "Draft", CategoryChange, false},
		{"DOC-VOR-02", "Variation Order", "Closed", CategoryChange, true},
		{"DOC-DWG-001", "General Arrangement", "Approved", CategoryBaselineDrawings, true},
		{"DOC-DWG-002", "Structural Layout", "In Progress", CategoryBaselineDrawings, false},
		{"STSBPP-FS-RFI-CE-001-031", "Roofing Works - Inspection & Punch List", "Approved", CategoryControl, true},
		{"DOC-PL-001", "Punch List Set A", "Approved", CategoryComplete, true},
		{"DOC-PCL-002", "Punch List Set B", "Open", CategoryComplete, false},
	}

	for _, tt := range tests {
		cat, closed := ClassifyCategory(tt.docNum, tt.title, tt.status)
		if cat != tt.wantCat || closed != tt.wantClosed {
			t.Errorf("ClassifyCategory(%q, %q, %q) = (%v, %v), want (%v, %v)",
				tt.docNum, tt.title, tt.status, cat, closed, tt.wantCat, tt.wantClosed)
		}
	}
}

func TestGetProjectMatrix_SortsAndNetChange(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-01", Name: "Alpha Plant", SiteCode: "SITE-A"})
	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-02", Name: "Beta Hub", SiteCode: "SITE-B"})

	now := time.Now().UTC()
	// PRJ-01 has 1 overdue document, previous snapshot had 2 -> IMPROVING
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:      "PRJ-01",
		SnapshotDate:     now.AddDate(0, 0, -1),
		OverdueDocuments: 2,
	})
	// PRJ-02 has 2 overdue documents, previous snapshot had 1 -> DEGRADING
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:      "PRJ-02",
		SnapshotDate:     now.AddDate(0, 0, -1),
		OverdueDocuments: 1,
	})

	docs := []models.Document{
		{ProjectCode: "PRJ-01", DocNumber: "ITP-01", Title: "Control Doc", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -5), IsOverdue: true, OverdueDays: 5},
		{ProjectCode: "PRJ-01", DocNumber: "NCR-01", Title: "Corrective Doc", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, 5), IsOverdue: false, OverdueDays: 10},
		{ProjectCode: "PRJ-01", DocNumber: "PCR-01", Title: "Change Doc", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-02", DocNumber: "NCR-02", Title: "CAR Issue", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -10), IsOverdue: true, OverdueDays: 10},
		{ProjectCode: "PRJ-02", DocNumber: "NCR-03", Title: "CAR Issue 2", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -20), IsOverdue: true, OverdueDays: 20},
	}
	_ = repo.db.Create(&docs).Error

	// Test NetChange
	rows, total, err := svc.GetProjectMatrix(ctx, "", "code", "asc", 1, 10)
	if err != nil || total != 2 {
		t.Fatalf("GetProjectMatrix failed: %v, total: %d", err, total)
	}
	if rows[0].NetChange != "IMPROVING" {
		t.Errorf("expected PRJ-01 NetChange to be IMPROVING, got %s", rows[0].NetChange)
	}
	if rows[1].NetChange != "DEGRADING" {
		t.Errorf("expected PRJ-02 NetChange to be DEGRADING, got %s", rows[1].NetChange)
	}

	// Test sort by name desc
	sortedName, _, _ := svc.GetProjectMatrix(ctx, "", "name", "desc", 1, 10)
	if sortedName[0].ProjectName != "Beta Hub" {
		t.Errorf("expected Beta Hub first on name desc, got %s", sortedName[0].ProjectName)
	}

	// Test sort by total desc
	sortedTotal, _, _ := svc.GetProjectMatrix(ctx, "", "total", "desc", 1, 10)
	if sortedTotal[0].ProjectID != "PRJ-01" {
		t.Errorf("expected PRJ-01 first on total desc, got %s", sortedTotal[0].ProjectID)
	}

	// Test sort by approved desc
	sortedAppr, _, _ := svc.GetProjectMatrix(ctx, "", "approved", "desc", 1, 10)
	if sortedAppr[0].ApprovedDocuments != 1 {
		t.Errorf("expected PRJ-01 with approved doc, got %d", sortedAppr[0].ApprovedDocuments)
	}

	// Test sort by overdue desc
	sortedOverdue, _, _ := svc.GetProjectMatrix(ctx, "", "overdue", "desc", 1, 10)
	if sortedOverdue[0].ProjectID != "PRJ-02" {
		t.Errorf("expected PRJ-02 first on overdue desc, got %s", sortedOverdue[0].ProjectID)
	}

	// Test sort by rate desc
	sortedRate, _, _ := svc.GetProjectMatrix(ctx, "", "rate", "desc", 1, 10)
	if sortedRate[0].ApprovalRate <= 0 {
		t.Errorf("expected positive approval rate first, got %f", sortedRate[0].ApprovalRate)
	}

	// Test search by site code
	searchedSite, count, _ := svc.GetProjectMatrix(ctx, "SITE-B", "code", "asc", 1, 10)
	if count != 1 || searchedSite[0].SiteCode != "SITE-B" {
		t.Errorf("expected 1 result matching SITE-B, got %d", count)
	}

	// Test pagination start > totalCount
	emptyPage, count, _ := svc.GetProjectMatrix(ctx, "", "code", "asc", 10, 10)
	if len(emptyPage) != 0 || count != 2 {
		t.Errorf("expected empty page for page 10, got %d rows", len(emptyPage))
	}
}

func TestGetAnalyticsTrends_PresetsAndFilters(t *testing.T) {
	svc, repo := setupTestService(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-01", Name: "Alpha Plant"})
	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-02", Name: "Beta Hub"})

	now := time.Now().UTC().Truncate(time.Second)
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:      "PRJ-01",
		SnapshotDate:     now.AddDate(0, -1, 0),
		TotalDocuments:   10,
		OverdueDocuments: 2,
		ApprovalRate:     70.0,
	})
	_ = repo.db.Create(&models.KPISnapshot{
		ProjectCode:      "PRJ-02",
		SnapshotDate:     now.AddDate(0, -2, 0),
		TotalDocuments:   20,
		OverdueDocuments: 1,
		ApprovalRate:     90.0,
	})

	// Test presets
	presets := []string{"all_time", "1_year", "6_months", "3_months"}
	for _, p := range presets {
		res, err := svc.GetAnalyticsTrends(ctx, nil, time.Time{}, time.Time{}, p)
		if err != nil {
			t.Errorf("preset %s failed: %v", p, err)
		}
		if len(res) == 0 {
			t.Errorf("expected trends for preset %s, got 0", p)
		}
	}

	// Test multi-project filter
	multi, err := svc.GetAnalyticsTrends(ctx, []string{"PRJ-01", "PRJ-02"}, now.AddDate(0, -3, 0), now, "")
	if err != nil {
		t.Fatalf("multi-project trends failed: %v", err)
	}
	if len(multi) == 0 {
		t.Errorf("expected trend points for multi-project")
	}
}

func TestRepository_GetDocumentStats(t *testing.T) {
	_, repo := setupTestService(t)
	ctx := context.Background()

	now := time.Now().UTC()
	docs := []models.Document{
		{ProjectCode: "PRJ-01", DocNumber: "D-01", Title: "T1", Discipline: "ME", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-01", DocNumber: "D-02", Title: "T2", Discipline: "CE", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -5), IsOverdue: true, OverdueDays: 5},
	}
	_ = repo.db.Create(&docs).Error

	total, appr, review, overdue, err := repo.GetDocumentStats(ctx, "")
	if err != nil || total != 2 || appr != 1 || review != 1 || overdue != 1 {
		t.Errorf("GetDocumentStats global failed: total=%d, appr=%d, review=%d, overdue=%d, err=%v", total, appr, review, overdue, err)
	}

	totalPrj, _, _, _, errPrj := repo.GetDocumentStats(ctx, "PRJ-01")
	if errPrj != nil || totalPrj != 2 {
		t.Errorf("GetDocumentStats project failed: total=%d, err=%v", totalPrj, errPrj)
	}
}


