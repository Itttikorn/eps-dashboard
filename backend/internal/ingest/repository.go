package ingest

import (
	"context"
	"errors"
	"time"

	"eps-dashboard/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Repository defines data access operations required for daily document ingestion.
type Repository interface {
	GetLatestSnapshotDate(ctx context.Context, projectCode string) (*time.Time, error)
	UpsertProject(ctx context.Context, p *models.Project) error
	BatchUpsertDocuments(ctx context.Context, docs []models.Document) error
	SaveSnapshot(ctx context.Context, snapshot *models.KPISnapshot) error
	BatchInsertOverdueLogs(ctx context.Context, logs []models.OverdueLog) error
	WithTransaction(ctx context.Context, fn func(txRepo Repository) error) error
}

// GormRepository implements Repository backed by GORM.
type GormRepository struct {
	db *gorm.DB
}

// NewRepository creates a new GormRepository instance.
func NewRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

// WithTransaction runs the provided function inside an isolated database transaction.
func (r *GormRepository) WithTransaction(ctx context.Context, fn func(txRepo Repository) error) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(&GormRepository{db: tx})
	})
}

// GetLatestSnapshotDate queries the latest document issue date for chronological downgrade checks.
func (r *GormRepository) GetLatestSnapshotDate(ctx context.Context, projectCode string) (*time.Time, error) {
	var doc models.Document
	query := r.db.WithContext(ctx).Order("issue_date desc")
	if projectCode != "" {
		query = query.Where("project_code = ?", projectCode)
	}
	if err := query.First(&doc).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &doc.IssueDate, nil
}

// UpsertProject inserts or updates project master record metadata.
func (r *GormRepository) UpsertProject(ctx context.Context, p *models.Project) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "code"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "updated_at"}),
	}).Create(p).Error
}

// BatchUpsertDocuments upserts engineering document metadata in batches of 250.
func (r *GormRepository) BatchUpsertDocuments(ctx context.Context, docs []models.Document) error {
	if len(docs) == 0 {
		return nil
	}

	// Defensive deduplication by (ProjectCode, DocNumber) preserving last occurrence
	uniqueMap := make(map[string]models.Document, len(docs))
	order := make([]string, 0, len(docs))
	for _, doc := range docs {
		key := doc.ProjectCode + "::" + doc.DocNumber
		if _, exists := uniqueMap[key]; !exists {
			order = append(order, key)
		}
		uniqueMap[key] = doc
	}
	deduped := make([]models.Document, 0, len(order))
	for _, k := range order {
		deduped = append(deduped, uniqueMap[k])
	}

	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "project_code"}, {Name: "doc_number"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"title", "discipline", "status", "revision", "issue_date",
			"target_date", "actual_date", "is_overdue", "overdue_days", "updated_at",
		}),
	}).CreateInBatches(deduped, 250).Error
}

// SaveSnapshot records a point-in-time KPI snapshot for trend analytics.
func (r *GormRepository) SaveSnapshot(ctx context.Context, snapshot *models.KPISnapshot) error {
	return r.db.WithContext(ctx).Create(snapshot).Error
}

// BatchInsertOverdueLogs records overdue aging entries for historical audit logs.
func (r *GormRepository) BatchInsertOverdueLogs(ctx context.Context, logs []models.OverdueLog) error {
	if len(logs) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).CreateInBatches(logs, 250).Error
}

