package models

import (
	"time"
)

// OverdueLog stores historical aging records for overdue deliverables.
type OverdueLog struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectCode  string    `gorm:"size:64;index;not null" json:"project_code"`
	DocNumber    string    `gorm:"size:128;index;not null" json:"doc_number"`
	SnapshotDate time.Time `gorm:"index;not null" json:"snapshot_date"`
	DaysOverdue  int       `json:"days_overdue"`
	AgingBracket string    `gorm:"size:32;index;not null" json:"aging_bracket"` // "0-30", "31-60", "61-90", ">90"
	CreatedAt    time.Time `json:"created_at"`
}

