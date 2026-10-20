package models

import (
	"time"
)

// Document represents an engineering deliverable tracked in the QA/QC workflow.
type Document struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectCode string     `gorm:"size:64;uniqueIndex:idx_project_doc;not null" json:"project_code"`
	DocNumber   string     `gorm:"size:128;uniqueIndex:idx_project_doc;not null" json:"doc_number"`
	Title       string     `gorm:"size:255;not null" json:"title"`
	Discipline  string     `gorm:"size:32;index;not null" json:"discipline"`
	Status      string     `gorm:"size:64;index;not null" json:"status"`
	Revision       string     `gorm:"size:32;not null" json:"revision"`
	IssueFor       string     `gorm:"size:32;default:''" json:"issue_for"`
	IssueDate      time.Time  `json:"issue_date"`
	TargetDate     time.Time  `json:"target_date"`
	ActualDate     *time.Time `json:"actual_date,omitempty"`
	IsOverdue      bool       `gorm:"index" json:"is_overdue"`
	OverdueDays    int        `json:"overdue_days"`
	IsLateApproval bool       `gorm:"index;default:false" json:"is_late_approval"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

