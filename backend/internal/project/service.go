package project

import (
	"context"
	"sort"
	"strings"
	"time"

	"eps-dashboard/backend/internal/models"
)

type ProjectRepository interface {
	UpsertProject(ctx context.Context, p *models.Project) error
	GetProjectByCode(ctx context.Context, code string) (*models.Project, error)
	ListProjects(ctx context.Context) ([]models.Project, error)
	CountProjects(ctx context.Context) (int64, error)
	ListDocumentsByProject(ctx context.Context, projectCode string) ([]models.Document, error)
	GetDocumentStats(ctx context.Context, projectCode string) (total int, approved int, underReview int, overdue int, err error)
	GetLatestSnapshot(ctx context.Context, projectCode string) (*models.KPISnapshot, error)
	GetTrendSeries(ctx context.Context, projectCode string, from, to time.Time) ([]models.KPISnapshot, error)
}

type Service struct {
	repo ProjectRepository
}

func NewService(repo ProjectRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetGlobalSummary(ctx context.Context) (*GlobalSummary, error) {
	projectCount, err := s.repo.CountProjects(ctx)
	if err != nil {
		return nil, err
	}

	total, approved, underReview, overdue, err := s.repo.GetDocumentStats(ctx, "")
	if err != nil {
		return nil, err
	}

	var rate float64
	if total > 0 {
		rate = float64(approved) / float64(total) * 100.0
	}

	return &GlobalSummary{
		TotalProjects:        int(projectCount),
		TotalDocuments:       total,
		ApprovedDocuments:    approved,
		UnderReviewDocuments: underReview,
		OverdueDocuments:     overdue,
		GlobalApprovalRate:   rate,
	}, nil
}

func (s *Service) GetProjectMatrix(ctx context.Context, search, sortBy, sortDir string) ([]ProjectMatrixRow, error) {
	projects, err := s.repo.ListProjects(ctx)
	if err != nil {
		return nil, err
	}

	rows := make([]ProjectMatrixRow, 0, len(projects))
	for _, p := range projects {
		total, approved, underReview, overdue, err := s.repo.GetDocumentStats(ctx, p.Code)
		if err != nil {
			return nil, err
		}

		var rate float64
		if total > 0 {
			rate = float64(approved) / float64(total) * 100.0
		}

		lastUpdated := p.UpdatedAt
		if lastUpdated.IsZero() {
			lastUpdated = p.CreatedAt
		}

		rows = append(rows, ProjectMatrixRow{
			ProjectCode:          p.Code,
			ProjectName:          p.Name,
			TotalDocuments:       total,
			ApprovedDocuments:    approved,
			UnderReviewDocuments: underReview,
			OverdueDocuments:     overdue,
			ApprovalRate:         rate,
			LastUpdated:          lastUpdated,
		})
	}

	if search != "" {
		term := strings.ToLower(strings.TrimSpace(search))
		var filtered []ProjectMatrixRow
		for _, r := range rows {
			if strings.Contains(strings.ToLower(r.ProjectCode), term) || strings.Contains(strings.ToLower(r.ProjectName), term) {
				filtered = append(filtered, r)
			}
		}
		rows = filtered
	}

	desc := strings.ToLower(sortDir) == "desc"
	sort.Slice(rows, func(i, j int) bool {
		switch strings.ToLower(sortBy) {
		case "name":
			if desc {
				return rows[i].ProjectName > rows[j].ProjectName
			}
			return rows[i].ProjectName < rows[j].ProjectName
		case "total", "total_documents":
			if desc {
				return rows[i].TotalDocuments > rows[j].TotalDocuments
			}
			return rows[i].TotalDocuments < rows[j].TotalDocuments
		case "approved", "approved_documents":
			if desc {
				return rows[i].ApprovedDocuments > rows[j].ApprovedDocuments
			}
			return rows[i].ApprovedDocuments < rows[j].ApprovedDocuments
		case "overdue", "overdue_documents":
			if desc {
				return rows[i].OverdueDocuments > rows[j].OverdueDocuments
			}
			return rows[i].OverdueDocuments < rows[j].OverdueDocuments
		case "approval_rate", "rate":
			if desc {
				return rows[i].ApprovalRate > rows[j].ApprovalRate
			}
			return rows[i].ApprovalRate < rows[j].ApprovalRate
		default:
			if desc {
				return rows[i].ProjectCode > rows[j].ProjectCode
			}
			return rows[i].ProjectCode < rows[j].ProjectCode
		}
	})

	return rows, nil
}

func (s *Service) GetProjectDetails(ctx context.Context, projectCode string) (*ProjectDetailsResponse, error) {
	p, err := s.repo.GetProjectByCode(ctx, projectCode)
	if err != nil {
		return nil, err
	}

	snap, _ := s.repo.GetLatestSnapshot(ctx, projectCode)
	return &ProjectDetailsResponse{
		Project:        p,
		LatestSnapshot: snap,
	}, nil
}

func (s *Service) GetDisciplineBreakdown(ctx context.Context, projectCode string) (map[string]DisciplineMetrics, error) {
	docs, err := s.repo.ListDocumentsByProject(ctx, projectCode)
	if err != nil {
		return nil, err
	}

	disciplineNames := make(map[string]string)
	for _, d := range models.StandardDisciplines {
		disciplineNames[d.Code] = d.Name
	}

	breakdown := make(map[string]DisciplineMetrics)
	for _, doc := range docs {
		code := doc.Discipline
		if code == "" {
			code = "GEN"
		}

		m := breakdown[code]
		m.DisciplineCode = code
		if name, ok := disciplineNames[code]; ok {
			m.DisciplineName = name
		} else {
			m.DisciplineName = code
		}

		m.Total++
		if doc.Status == "Approved" {
			m.Approved++
		} else if doc.Status == "Under Review" {
			m.UnderReview++
		}
		if doc.IsOverdue {
			m.Overdue++
		}

		breakdown[code] = m
	}

	for k, v := range breakdown {
		if v.Total > 0 {
			v.ApprovalRate = float64(v.Approved) / float64(v.Total) * 100.0
			breakdown[k] = v
		}
	}

	return breakdown, nil
}

func (s *Service) GetAnalyticsTrends(ctx context.Context, projectCode string, from, to time.Time) ([]TrendPoint, error) {
	snapshots, err := s.repo.GetTrendSeries(ctx, projectCode, from, to)
	if err != nil {
		return nil, err
	}

	points := make([]TrendPoint, 0, len(snapshots))
	for _, snap := range snapshots {
		points = append(points, TrendPoint{
			Date:         snap.SnapshotDate.Format("2006-01-02"),
			Total:        snap.TotalDocuments,
			Approved:     snap.ApprovedDocuments,
			UnderReview:  snap.UnderReviewDocuments,
			Overdue:      snap.OverdueDocuments,
			ApprovalRate: snap.ApprovalRate,
		})
	}

	return points, nil
}

func (s *Service) GetOverdueSummary(ctx context.Context, projectCode string) (*OverdueSummary, error) {
	docs, err := s.repo.ListDocumentsByProject(ctx, projectCode)
	if err != nil {
		return nil, err
	}

	dist := map[string]int{
		"0-30":  0,
		"31-60": 0,
		"61-90": 0,
		">90":   0,
	}

	calculateBracket := func(days int) string {
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

	var items []OverdueItemDetail
	for _, doc := range docs {
		if doc.IsOverdue {
			bracket := calculateBracket(doc.OverdueDays)
			dist[bracket]++

			items = append(items, OverdueItemDetail{
				DocNumber:    doc.DocNumber,
				Title:        doc.Title,
				Discipline:   doc.Discipline,
				TargetDate:   doc.TargetDate.Format("2006-01-02"),
				DaysOverdue:  doc.OverdueDays,
				AgingBracket: bracket,
			})
		}
	}

	return &OverdueSummary{
		ProjectCode:  projectCode,
		TotalOverdue: len(items),
		AgingBuckets: dist,
		OverdueItems: items,
	}, nil
}

