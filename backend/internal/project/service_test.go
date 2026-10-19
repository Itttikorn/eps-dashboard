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

	// Matrix default
	matrix, err := svc.GetProjectMatrix(ctx, "", "code", "asc")
	if err != nil || len(matrix) != 2 || matrix[0].ProjectCode != "PRJ-A" {
		t.Errorf("unexpected matrix: %+v", matrix)
	}

	// Matrix sort desc
	matrixDesc, _ := svc.GetProjectMatrix(ctx, "", "code", "desc")
	if matrixDesc[0].ProjectCode != "PRJ-Z" {
		t.Errorf("expected PRJ-Z first on desc, got %s", matrixDesc[0].ProjectCode)
	}

	// Matrix search
	matrixSearch, _ := svc.GetProjectMatrix(ctx, "Alpha", "code", "asc")
	if len(matrixSearch) != 1 || matrixSearch[0].ProjectCode != "PRJ-A" {
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

	trends, err := svc.GetAnalyticsTrends(ctx, "PRJ-01", now.AddDate(0, 0, -1), now.AddDate(0, 0, 1))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(trends) != 1 || trends[0].ApprovalRate != 85.0 {
		t.Errorf("unexpected trends: %+v", trends)
	}
}

