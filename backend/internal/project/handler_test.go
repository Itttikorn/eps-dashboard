package project

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"eps-dashboard/backend/internal/database"
	"eps-dashboard/backend/internal/models"
	"eps-dashboard/backend/internal/utils"

	"github.com/go-chi/chi/v5"
)

func setupTestProjectHandler(t *testing.T) (*Handler, *Repository, *chi.Mux) {
	t.Helper()
	db, err := database.InitInMemoryDB()
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	if err := database.AutoMigrate(db); err != nil {
		t.Fatalf("failed to automigrate: %v", err)
	}
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	r := chi.NewRouter()
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/projects", func(r chi.Router) {
			r.Get("/summary", handler.GetProjectsSummary)
			r.Get("/", handler.GetProjects)
			r.Get("/{projectCode}", handler.GetProjectDetails)
			r.Get("/{projectCode}/overdue", handler.GetProjectOverdue)
			r.Get("/{projectCode}/disciplines", handler.GetProjectDisciplines)
		})
		r.Get("/analytics/trends", handler.GetAnalyticsTrends)
	})

	return handler, repo, r
}

func TestProjectHandlerEndpoints(t *testing.T) {
	_, repo, r := setupTestProjectHandler(t)
	ctx := context.Background()

	_ = repo.UpsertProject(ctx, &models.Project{Code: "PRJ-01", Name: "Alpha Plant"})
	now := time.Now().UTC()
	docs := []models.Document{
		{ProjectCode: "PRJ-01", DocNumber: "D-01", Title: "T1", Discipline: "ME", Status: "Approved", IssueDate: now, TargetDate: now},
		{ProjectCode: "PRJ-01", DocNumber: "D-02", Title: "T2", Discipline: "CE", Status: "Under Review", IssueDate: now, TargetDate: now.AddDate(0, 0, -10), IsOverdue: true, OverdueDays: 10},
	}
	_ = repo.db.Create(&docs).Error

	// Summary
	reqSum := httptest.NewRequest(http.MethodGet, "/api/v1/projects/summary", nil)
	recSum := httptest.NewRecorder()
	r.ServeHTTP(recSum, reqSum)
	if recSum.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", recSum.Code)
	}
	var resSum utils.Response
	_ = json.Unmarshal(recSum.Body.Bytes(), &resSum)
	if resSum.Status.Code != 1000 {
		t.Errorf("expected 1000, got %d", resSum.Status.Code)
	}

	// Matrix
	reqMatrix := httptest.NewRequest(http.MethodGet, "/api/v1/projects?search=Alpha", nil)
	recMatrix := httptest.NewRecorder()
	r.ServeHTTP(recMatrix, reqMatrix)
	if recMatrix.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", recMatrix.Code)
	}

	// Details
	reqDet := httptest.NewRequest(http.MethodGet, "/api/v1/projects/PRJ-01", nil)
	recDet := httptest.NewRecorder()
	r.ServeHTTP(recDet, reqDet)
	if recDet.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", recDet.Code)
	}

	// Details 404
	req404 := httptest.NewRequest(http.MethodGet, "/api/v1/projects/MISSING", nil)
	rec404 := httptest.NewRecorder()
	r.ServeHTTP(rec404, req404)
	if rec404.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found, got %d", rec404.Code)
	}

	// Overdue
	reqOverdue := httptest.NewRequest(http.MethodGet, "/api/v1/projects/PRJ-01/overdue", nil)
	recOverdue := httptest.NewRecorder()
	r.ServeHTTP(recOverdue, reqOverdue)
	if recOverdue.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", recOverdue.Code)
	}

	// Disciplines
	reqDisc := httptest.NewRequest(http.MethodGet, "/api/v1/projects/PRJ-01/disciplines", nil)
	recDisc := httptest.NewRecorder()
	r.ServeHTTP(recDisc, reqDisc)
	if recDisc.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", recDisc.Code)
	}

	// Trends
	reqTrends := httptest.NewRequest(http.MethodGet, "/api/v1/analytics/trends?project_code=PRJ-01", nil)
	recTrends := httptest.NewRecorder()
	r.ServeHTTP(recTrends, reqTrends)
	if recTrends.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", recTrends.Code)
	}
}

