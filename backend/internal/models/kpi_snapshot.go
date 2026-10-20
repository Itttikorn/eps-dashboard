package models

import (
	"time"
)

// KPISnapshot stores point-in-time project health summaries.
type KPISnapshot struct {
	ID                   uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectCode          string    `gorm:"size:64;index;not null" json:"project_code"`
	SnapshotDate         time.Time `gorm:"index;not null" json:"snapshot_date"`
	TotalDocuments       int       `json:"total_documents"`
	ApprovedDocuments    int       `json:"approved_documents"`
	UnderReviewDocuments  int       `json:"under_review_documents"`
	OverdueDocuments      int       `json:"overdue_documents"`
	LateApprovalDocuments int       `json:"late_approval_documents"`
	ApprovalRate          float64   `json:"approval_rate"` // 0.0 to 100.0
	CreatedAt            time.Time `json:"created_at"`
}

