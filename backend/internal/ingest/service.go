package ingest

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"eps-dashboard/backend/internal/models"
)

var (
	ErrChronologyDowngrade = errors.New("snapshot date is older than existing latest snapshot date (chronological downgrade protection)")
	ErrNoValidRows         = errors.New("CSV contained no valid document rows to ingest")
)

// CalculateAgingBracket maps overdue days into standard operational aging buckets.
func CalculateAgingBracket(days int) string {
	switch {
	case days <= 30:
		return "0-30"
	case days <= 60:
		return "31-60"
	case days <= 90:
		return "61-90"
	default:
		return ">90"
	}
}

// isMoreRecentRow determines if candidate represents a more current state than current for the same document.
func isMoreRecentRow(current, candidate ParsedRow) bool {
	// 1. Prefer later IssueDate (transmittal date)
	if candidate.IssueDate.After(current.IssueDate) {
		return true
	}
	if candidate.IssueDate.Before(current.IssueDate) {
		return false
	}

	// 2. Prefer higher revision if issue dates are identical
	if candidate.Revision != current.Revision {
		cInt, cErr := strconv.Atoi(strings.TrimSpace(candidate.Revision))
		curInt, curErr := strconv.Atoi(strings.TrimSpace(current.Revision))
		if cErr == nil && curErr == nil {
			if cInt > curInt {
				return true
			}
			if cInt < curInt {
				return false
			}
		} else {
			if len(candidate.Revision) > len(current.Revision) {
				return true
			}
			if len(candidate.Revision) < len(current.Revision) {
				return false
			}
			if candidate.Revision > current.Revision {
				return true
			}
			if candidate.Revision < current.Revision {
				return false
			}
		}
	}

	// 3. Prefer completed/approved status if one has completion date and the other does not
	if candidate.ActualDate != nil && current.ActualDate == nil {
		return true
	}
	if current.ActualDate != nil && candidate.ActualDate == nil {
		return false
	}
	if candidate.Status == "Approved" && current.Status != "Approved" {
		return true
	}
	if current.Status == "Approved" && candidate.Status != "Approved" {
		return false
	}

	// 4. Conzol export sequence: later lines in file reflect subsequent transmittal events
	return candidate.LineNumber >= current.LineNumber
}

// deduplicateParsedRows folds multiple transmittal/revision rows for the same document into a single active state.
func deduplicateParsedRows(rows []ParsedRow, projectCodeOverride string) []ParsedRow {
	type docKey struct {
		projectCode string
		docNumber   string
	}

	bestMap := make(map[docKey]ParsedRow, len(rows))
	keys := make([]docKey, 0, len(rows))

	for _, row := range rows {
		pCode := projectCodeOverride
		if pCode == "" {
			pCode = row.ProjectCode
		}
		key := docKey{projectCode: pCode, docNumber: row.DocNumber}

		current, exists := bestMap[key]
		if !exists {
			bestMap[key] = row
			keys = append(keys, key)
			continue
		}

		if isMoreRecentRow(current, row) {
			bestMap[key] = row
		}
	}

	result := make([]ParsedRow, 0, len(keys))
	for _, k := range keys {
		result = append(result, bestMap[k])
	}
	return result
}

func generateUUID() string {
	var buf [16]byte
	_, _ = rand.Read(buf[:])
	buf[6] = (buf[6] & 0x0f) | 0x40
	buf[8] = (buf[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		buf[0:4], buf[4:6], buf[6:8], buf[8:10], buf[10:16])
}

// Service coordinates the parsing, validation, and persistence of daily document snapshots.
type Service struct {
	repo Repository
}

// NewService creates a new Service instance.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// IngestCSV parses a CSV stream and transactionally updates project deliverables and KPI metrics.
func (s *Service) IngestCSV(ctx context.Context, r io.Reader, projectCodeOverride string, forceChronology bool) (*IngestResult, error) {
	hasher := sha256.New()
	tee := io.TeeReader(r, hasher)
	parsedRows, parseErrors, err := StreamParseCSV(tee)
	if err != nil {
		return nil, fmt.Errorf("CSV parse failed: %w", err)
	}

	if len(parsedRows) == 0 {
		return nil, ErrNoValidRows
	}

	// Determine effective project code
	projectCode := projectCodeOverride
	if projectCode == "" {
		projectCode = parsedRows[0].ProjectCode
	}

	// Find the latest issue date among rows to act as the snapshot timestamp
	var snapshotDate time.Time
	for _, row := range parsedRows {
		if row.IssueDate.After(snapshotDate) {
			snapshotDate = row.IssueDate
		}
	}
	if snapshotDate.IsZero() {
		snapshotDate = time.Now().UTC()
	}

	// Chronological downgrade protection
	latestDate, err := s.repo.GetLatestSnapshotDate(ctx, projectCode)
	if err != nil {
		return nil, fmt.Errorf("failed checking latest snapshot date: %w", err)
	}
	if latestDate != nil && !forceChronology {
		if snapshotDate.Before(*latestDate) {
			return nil, fmt.Errorf("%w: current snapshot %s is older than recorded %s",
				ErrChronologyDowngrade, snapshotDate.Format("2006-01-02"), latestDate.Format("2006-01-02"))
		}
	}

	// Deduplicate rows for the same document to maintain lean, active current state
	uniqueRows := deduplicateParsedRows(parsedRows, projectCodeOverride)

	// Transform unique rows into documents, evaluating overdue status relative to snapshotDate
	docs := make([]models.Document, 0, len(uniqueRows))
	var overdueLogs []models.OverdueLog

	totalDocs := len(uniqueRows)
	approvedDocs := 0
	underReviewDocs := 0
	overdueDocs := 0
	lateApprovalDocs := 0

	now := time.Now().UTC()
	for _, row := range uniqueRows {
		rowProject := projectCode
		if projectCodeOverride == "" && row.ProjectCode != "" {
			rowProject = row.ProjectCode
		}

		isOverdue := false
		overdueDays := 0
		isLateApproval := false

		// New Criteria:
		// 1. IFI deliverables are completed information deliverables and never overdue.
		// 2. Only actionable documents (ISSUEFOR != "IFI") that remain open past TargetDate are overdue.
		// 3. Approved documents returned after TargetDate are tracked as late approval.
		if row.Status != "Approved" && row.Status != "Cancelled" && !strings.EqualFold(row.IssueFor, "IFI") {
			if row.TargetDate.Before(snapshotDate) {
				isOverdue = true
				diff := snapshotDate.Sub(row.TargetDate)
				overdueDays = int(diff.Hours() / 24)
				if overdueDays <= 0 {
					overdueDays = 1
				}
				overdueDocs++

				overdueLogs = append(overdueLogs, models.OverdueLog{
					ProjectCode:  rowProject,
					DocNumber:    row.DocNumber,
					SnapshotDate: snapshotDate,
					DaysOverdue:  overdueDays,
					AgingBracket: CalculateAgingBracket(overdueDays),
					CreatedAt:    now,
				})
			}
			if row.Status == "Under Review" {
				underReviewDocs++
			}
		} else if row.Status == "Approved" {
			approvedDocs++
			if row.ActualDate != nil && !row.TargetDate.IsZero() && row.ActualDate.After(row.TargetDate) {
				isLateApproval = true
				lateApprovalDocs++
			}
		}

		docs = append(docs, models.Document{
			ProjectCode:    rowProject,
			DocNumber:      row.DocNumber,
			Title:          row.Title,
			Discipline:     row.Discipline,
			Status:         row.Status,
			Revision:       row.Revision,
			IssueFor:       row.IssueFor,
			IssueDate:      row.IssueDate,
			TargetDate:     row.TargetDate,
			ActualDate:     row.ActualDate,
			IsOverdue:      isOverdue,
			OverdueDays:    overdueDays,
			IsLateApproval: isLateApproval,
			UpdatedAt:      now,
		})
	}

	approvalRate := 0.0
	if totalDocs > 0 {
		approvalRate = float64(approvedDocs) / float64(totalDocs) * 100.0
	}

	kpiSnapshot := &models.KPISnapshot{
		ProjectCode:           projectCode,
		SnapshotDate:          snapshotDate,
		TotalDocuments:        totalDocs,
		ApprovedDocuments:     approvedDocs,
		UnderReviewDocuments:  underReviewDocs,
		OverdueDocuments:      overdueDocs,
		LateApprovalDocuments: lateApprovalDocs,
		ApprovalRate:          approvalRate,
		CreatedAt:             now,
	}

	// Perform all DB operations inside a transaction
	txErr := s.repo.WithTransaction(ctx, func(txRepo Repository) error {
		// Ensure all projects in the CSV exist
		distinctProjects := make(map[string]struct{})
		for _, row := range parsedRows {
			p := row.ProjectCode
			if projectCodeOverride != "" {
				p = projectCodeOverride
			}
			if p != "" {
				distinctProjects[p] = struct{}{}
			}
		}
		if len(distinctProjects) == 0 && projectCode != "" {
			distinctProjects[projectCode] = struct{}{}
		}

		for pCode := range distinctProjects {
			prj := &models.Project{
				Code:      pCode,
				Name:      fmt.Sprintf("Project %s", pCode),
				UpdatedAt: now,
			}
			if err := txRepo.UpsertProject(ctx, prj); err != nil {
				return fmt.Errorf("failed to upsert project %s: %w", pCode, err)
			}
		}

		// Batch upsert documents
		if err := txRepo.BatchUpsertDocuments(ctx, docs); err != nil {
			return fmt.Errorf("failed to batch upsert documents: %w", err)
		}

		// Save KPI snapshot
		if err := txRepo.SaveSnapshot(ctx, kpiSnapshot); err != nil {
			return fmt.Errorf("failed to save KPI snapshot: %w", err)
		}

		// Batch insert overdue logs
		if len(overdueLogs) > 0 {
			if err := txRepo.BatchInsertOverdueLogs(ctx, overdueLogs); err != nil {
				return fmt.Errorf("failed to insert overdue logs: %w", err)
			}
		}

		return nil
	})

	if txErr != nil {
		return nil, txErr
	}

	fileHash := hex.EncodeToString(hasher.Sum(nil))

	return &IngestResult{
		BatchID:          generateUUID(),
		FileSHA256:       fileHash,
		Status:           "INGESTED",
		SnapshotDate:     snapshotDate,
		TotalRows:        len(parsedRows) + len(parseErrors),
		DeltasUpdated:    len(docs),
		SkippedUnchanged: len(parsedRows) - len(docs),
		CreatedAt:        now,
		ProjectCode:      projectCode,
		ProcessedCount:   len(parsedRows),
		Errors:           parseErrors,
	}, nil
}
