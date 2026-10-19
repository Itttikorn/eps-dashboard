package project

import (
	"time"

	"eps-dashboard/backend/internal/models"
)

// GlobalSummary aggregates top-level executive KPIs across all active projects.
type GlobalSummary struct {
	TotalProjects        int     `json:"total_projects"`
	TotalDocuments       int     `json:"total_documents"`
	ApprovedDocuments    int     `json:"approved_documents"`
	UnderReviewDocuments int     `json:"under_review_documents"`
	OverdueDocuments     int     `json:"overdue_documents"`
	GlobalApprovalRate   float64 `json:"global_approval_rate"`
}

// ProjectMatrixRow represents a single project's summarized status for the comparative matrix.
type ProjectMatrixRow struct {
	ProjectCode          string    `json:"project_code"`
	ProjectName          string    `json:"project_name"`
	TotalDocuments       int       `json:"total_documents"`
	ApprovedDocuments    int       `json:"approved_documents"`
	UnderReviewDocuments int       `json:"under_review_documents"`
	OverdueDocuments     int       `json:"overdue_documents"`
	ApprovalRate         float64   `json:"approval_rate"`
	LastUpdated          time.Time `json:"last_updated"`
}

// DisciplineMetrics summarizes deliverable health for a specific engineering discipline.
type DisciplineMetrics struct {
	DisciplineCode string  `json:"discipline_code"`
	DisciplineName string  `json:"discipline_name"`
	Total          int     `json:"total"`
	Approved       int     `json:"approved"`
	UnderReview    int     `json:"under_review"`
	Overdue        int     `json:"overdue"`
	ApprovalRate   float64 `json:"approval_rate"`
}

// TrendPoint represents a point in time for historical charts.
type TrendPoint struct {
	Date         string  `json:"date"`
	Total        int     `json:"total"`
	Approved     int     `json:"approved"`
	UnderReview  int     `json:"under_review"`
	Overdue      int     `json:"overdue"`
	ApprovalRate float64 `json:"approval_rate"`
}

// OverdueItemDetail represents detailed information for a single overdue document.
type OverdueItemDetail struct {
	DocNumber    string `json:"doc_number"`
	Title        string `json:"title"`
	Discipline   string `json:"discipline"`
	TargetDate   string `json:"target_date"`
	DaysOverdue  int    `json:"days_overdue"`
	AgingBracket string `json:"aging_bracket"`
}

// OverdueSummary compiles aging metrics and specific overdue items.
type OverdueSummary struct {
	ProjectCode  string              `json:"project_code"`
	TotalOverdue int                 `json:"total_overdue"`
	AgingBuckets map[string]int      `json:"aging_buckets"`
	OverdueItems []OverdueItemDetail `json:"overdue_items"`
}

// ProjectDetailsResponse combines project metadata and latest KPI snapshot.
type ProjectDetailsResponse struct {
	Project        *models.Project     `json:"project"`
	LatestSnapshot *models.KPISnapshot `json:"latest_snapshot,omitempty"`
}

