package project

import (
	"context"
	"errors"
	"time"

	"eps-dashboard/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrProjectNotFound = errors.New("project not found")

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) UpsertProject(ctx context.Context, p *models.Project) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "code"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "updated_at"}),
	}).Create(p).Error
}

func (r *Repository) GetProjectByCode(ctx context.Context, code string) (*models.Project, error) {
	var p models.Project
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProjectNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *Repository) ListProjects(ctx context.Context) ([]models.Project, error) {
	var projects []models.Project
	if err := r.db.WithContext(ctx).Order("code asc").Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *Repository) CountProjects(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Project{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *Repository) ListDocumentsByProject(ctx context.Context, projectCode string) ([]models.Document, error) {
	var docs []models.Document
	query := r.db.WithContext(ctx).Order("doc_number asc")
	if projectCode != "" {
		query = query.Where("project_code = ?", projectCode)
	}
	if err := query.Find(&docs).Error; err != nil {
		return nil, err
	}
	return docs, nil
}

func (r *Repository) GetDocumentStats(ctx context.Context, projectCode string) (total int, approved int, underReview int, overdue int, err error) {
	var results []struct {
		Status    string
		IsOverdue bool
		Count     int
	}

	query := r.db.WithContext(ctx).Model(&models.Document{}).Select("status, is_overdue, count(*) as count").Group("status, is_overdue")
	if projectCode != "" {
		query = query.Where("project_code = ?", projectCode)
	}

	if err := query.Scan(&results).Error; err != nil {
		return 0, 0, 0, 0, err
	}

	for _, res := range results {
		total += res.Count
		if res.Status == "Approved" {
			approved += res.Count
		} else if res.Status == "Under Review" {
			underReview += res.Count
		}
		if res.IsOverdue {
			overdue += res.Count
		}
	}

	return total, approved, underReview, overdue, nil
}

func (r *Repository) GetLatestSnapshot(ctx context.Context, projectCode string) (*models.KPISnapshot, error) {
	var s models.KPISnapshot
	query := r.db.WithContext(ctx).Order("snapshot_date desc, id desc")
	if projectCode != "" {
		query = query.Where("project_code = ?", projectCode)
	}
	if err := query.First(&s).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *Repository) GetTrendSeries(ctx context.Context, projectCode string, from, to time.Time) ([]models.KPISnapshot, error) {
	var snapshots []models.KPISnapshot
	query := r.db.WithContext(ctx).Order("snapshot_date asc")
	if projectCode != "" {
		query = query.Where("project_code = ?", projectCode)
	}
	if !from.IsZero() {
		query = query.Where("snapshot_date >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("snapshot_date <= ?", to)
	}

	if err := query.Find(&snapshots).Error; err != nil {
		return nil, err
	}
	return snapshots, nil
}

