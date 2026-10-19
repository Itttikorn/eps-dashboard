package ingest

import (
	"encoding/json"
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
	BatchID          string       `json:"batch_id"`
	FileSHA256       string       `json:"file_sha256"`
	Status           string       `json:"status"` // INGESTED, ALREADY_INGESTED
	SnapshotDate     time.Time    `json:"-"`
	TotalRows        int          `json:"total_rows"`
	DeltasUpdated    int          `json:"deltas_updated"`
	SkippedUnchanged int          `json:"skipped_unchanged"`
	CreatedAt        time.Time    `json:"-"`
	ProjectCode      string       `json:"project_code,omitempty"`
	ProcessedCount   int          `json:"processed_count,omitempty"`
	Errors           []ParseError `json:"errors,omitempty"`
}

func (r IngestResult) MarshalJSON() ([]byte, error) {
	type Alias IngestResult
	snapDate := ""
	if !r.SnapshotDate.IsZero() {
		snapDate = r.SnapshotDate.Format("2006-01-02")
	}
	created := ""
	if !r.CreatedAt.IsZero() {
		created = r.CreatedAt.UTC().Format(time.RFC3339)
	}
	return json.Marshal(&struct {
		Alias
		SnapshotDate string `json:"snapshot_date"`
		CreatedAt    string `json:"created_at"`
	}{
		Alias:        Alias(r),
		SnapshotDate: snapDate,
		CreatedAt:    created,
	})
}
