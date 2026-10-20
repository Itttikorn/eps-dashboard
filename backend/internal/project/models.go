package project

import (
	"time"

	"eps-dashboard/backend/internal/models"
)

// CategoryCounts holds aggregate counts across the 5 QA/QC category pillars.
type CategoryCounts struct {
	BaselineDrawings int `json:"baseline_drawings"`
	Control          int `json:"control"`
	Corrective       int `json:"corrective"`
	Change           int `json:"change"`
	Complete         int `json:"complete"`
}

// CategoryMetrics details deliverable volume, open/closed split, and delinquency percentage.
type CategoryMetrics struct {
	Total      int     `json:"total"`
	Open       int     `json:"open"`
	Closed     int     `json:"closed"`
	PendingPct float64 `json:"pending_pct"`
	IsCritical bool    `json:"is_critical"`
	AvgAgeDays float64 `json:"avg_age_days"`
}

// GlobalSummary aggregates top-level executive KPIs across all active projects.
type GlobalSummary struct {
	TotalProjects        int            `json:"total_projects"`
	TotalDocuments       int            `json:"total_documents"`
	TotalOverdue         int            `json:"total_overdue"`
	OverdueDocuments     int            `json:"overdue_documents"` // backward compatibility
	CategoryCounts       CategoryCounts `json:"category_counts"`
	LastUpdatedAt        string         `json:"last_updated_at"`
	ApprovedDocuments    int            `json:"approved_documents"`
	UnderReviewDocuments int            `json:"under_review_documents"`
	GlobalApprovalRate   float64        `json:"global_approval_rate"`
}

// BaselineMetrics details deliverable volume, approval and delinquency status for drawings.
type BaselineMetrics struct {
	Total      int     `json:"total"`
	Approved   int     `json:"approved"`
	InReview   int     `json:"in_review"`
	Overdue    int     `json:"overdue"`
	PendingPct float64 `json:"pending_pct"`
	IsCritical bool    `json:"is_critical"`
}

// DisciplineStat tracks total and approved document counts for a discipline.
type DisciplineStat struct {
	Total    int `json:"total"`
	Approved int `json:"approved"`
}

// DisciplinesBreakdown breaks down engineering drawings across ME, CE, and EE.
type DisciplinesBreakdown struct {
	ME DisciplineStat `json:"me"`
	CE DisciplineStat `json:"ce"`
	EE DisciplineStat `json:"ee"`
}

// ProjectMatrixRow represents a single project's summarized status for the comparative matrix.
type ProjectMatrixRow struct {
	ProjectID            string               `json:"project_id"`
	ProjectCode          string               `json:"project_code"` // backward compatibility
	ProjectName          string               `json:"project_name"`
	BaselineDrawings     BaselineMetrics      `json:"baseline_drawings"`
	Control              CategoryMetrics      `json:"control"`
	Corrective           CategoryMetrics      `json:"corrective"`
	Change               CategoryMetrics      `json:"change"`
	FCR                  CategoryMetrics      `json:"fcr"`
	DCR                  CategoryMetrics      `json:"dcr"`
	VOR                  CategoryMetrics      `json:"vor"`
	Complete             CategoryMetrics      `json:"complete"`
	Disciplines          DisciplinesBreakdown `json:"disciplines"`
	DrawingTypes         []string             `json:"drawing_types"`
	PendingAgingDays     float64              `json:"pending_aging_days"`
	OverdueCount         int                  `json:"overdue_count"`
	OverdueDocuments     int                  `json:"overdue_documents"` // backward compatibility
	NetChange            string               `json:"net_change"`        // IMPROVING, DEGRADING, STABLE
	LastSnapshotDate     string               `json:"last_snapshot_date"`
	TotalDocuments       int                  `json:"total_documents"`
	ApprovedDocuments    int                  `json:"approved_documents"`
	UnderReviewDocuments int                  `json:"under_review_documents"`
	ApprovalRate         float64              `json:"approval_rate"`
	LastUpdated          time.Time            `json:"last_updated"`
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

// ProjectMetricPoint defines historical metrics for a specific project on a given date.
type ProjectMetricPoint struct {
	TotalDocuments int     `json:"total_documents"`
	OverdueCount   int     `json:"overdue_count"`
	Total          int     `json:"total,omitempty"`
	Approved       int     `json:"approved,omitempty"`
	UnderReview    int     `json:"under_review,omitempty"`
	Overdue        int     `json:"overdue,omitempty"`
	ApprovalRate   float64 `json:"approval_rate,omitempty"`
}

// DateMetricPoint represents multi-project time-series metrics on a specific calendar date.
type DateMetricPoint struct {
	Date           string                        `json:"date"`
	ProjectMetrics map[string]ProjectMetricPoint `json:"project_metrics"`
	Total          int                           `json:"total,omitempty"`
	Approved       int                           `json:"approved,omitempty"`
	UnderReview    int                           `json:"under_review,omitempty"`
	Overdue        int                           `json:"overdue,omitempty"`
	ApprovalRate   float64                       `json:"approval_rate,omitempty"`
}

// TrendPoint legacy alias for single project trend points.
type TrendPoint = DateMetricPoint

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
