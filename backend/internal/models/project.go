package models

import (
	"time"
)

// Project represents an engineering capital project.
type Project struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Code      string    `gorm:"size:64;uniqueIndex;not null" json:"code"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

