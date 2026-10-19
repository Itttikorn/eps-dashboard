package ingest

import (
	"fmt"
	"time"
)

// ParsedRow represents a single validated document record parsed from CSV.
type ParsedRow struct {
	LineNumber  int
	ProjectCode string
	DocNumber   string
	Title       string
	Discipline  string
	Status      string
	Revision    string
	IssueDate   time.Time
	TargetDate  time.Time
	ActualDate  *time.Time
}

// ParseError records an error associated with a specific CSV line.
type ParseError struct {
	LineNumber int    `json:"line_number"`
	Column     string `json:"column,omitempty"`
	Message    string `json:"message"`
}

func (e ParseError) Error() string {
	if e.Column != "" {
		return fmt.Sprintf("line %d [%s]: %s", e.LineNumber, e.Column, e.Message)
	}
	return fmt.Sprintf("line %d: %s", e.LineNumber, e.Message)
}

// IngestResult details the outcome of a CSV document ingestion operation.
type IngestResult struct {
	ProjectCode    string       `json:"project_code"`
	TotalRows      int          `json:"total_rows"`
	ProcessedCount int          `json:"processed_count"`
	SnapshotDate   time.Time    `json:"snapshot_date"`
	Errors         []ParseError `json:"errors,omitempty"`
}

