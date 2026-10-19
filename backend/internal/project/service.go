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

// Category classification constants
const (
	CategoryBaselineDrawings = "baseline_drawings"
	CategoryControl          = "control"
	CategoryCorrective       = "corrective"
	CategoryChange           = "change"
	CategoryComplete         = "complete"
)

// ClassifyCategory identifies which QA/QC pillar a document belongs to, and whether it is closed.
func ClassifyCategory(docNumber, title, status string) (category string, isClosed bool) {
	upperNum := strings.ToUpper(docNumber)
	upperTitle := strings.ToUpper(title)
	upperStatus := strings.ToUpper(status)

	// Closed statuses
	if strings.Contains(upperStatus, "APPROV") ||
		strings.Contains(upperStatus, "COMPLET") ||
		strings.Contains(upperStatus, "CLOSE") ||
		strings.Contains(upperStatus, "ACCEPT") ||
		strings.Contains(upperStatus, "RETURN") {
		isClosed = true
	}

	// Control: ITP, RFI, ITR
	if strings.Contains(upperNum, "ITP") || strings.Contains(upperNum, "RFI") || strings.Contains(upperNum, "ITR") ||
		strings.Contains(upperTitle, "ITP") || strings.Contains(upperTitle, "RFI") || strings.Contains(upperTitle, "ITR") {
		return CategoryControl, isClosed
	}

	// Corrective: NCR, CAR
	if strings.Contains(upperNum, "NCR") || strings.Contains(upperNum, "CAR") ||
		strings.Contains(upperTitle, "NCR") || strings.Contains(upperTitle, "CAR") {
		return CategoryCorrective, isClosed
	}

	// Change: PCR, FCR, DCR, VOR
	if strings.Contains(upperNum, "PCR") || strings.Contains(upperNum, "FCR") || strings.Contains(upperNum, "DCR") || strings.Contains(upperNum, "VOR") ||
		strings.Contains(upperTitle, "PCR") || strings.Contains(upperTitle, "FCR") || strings.Contains(upperTitle, "DCR") || strings.Contains(upperTitle, "VOR") {
		return CategoryChange, isClosed
	}

	// Complete: Punch List & Handover (e.g. -PL-, -PCL-, PUNCH LIST, HANDOVER)
	if strings.Contains(upperNum, "-PL-") || strings.Contains(upperNum, "-PCL-") ||
		strings.Contains(upperTitle, "PUNCH LIST") || strings.Contains(upperTitle, "PUNCHLIST") ||
		strings.Contains(upperTitle, "HANDOVER") {
		return CategoryComplete, isClosed
	}

	// Default: Baseline Drawings
	return CategoryBaselineDrawings, isClosed
}

func (s *Service) GetGlobalSummary(ctx context.Context) (*GlobalSummary, error) {
	projectCount, err := s.repo.CountProjects(ctx)
	if err != nil {
		return nil, err
	}

	docs, err := s.repo.ListDocumentsByProject(ctx, "")
	if err != nil {
		return nil, err
	}

	var total, approved, underReview, overdue int
	var baselineDrawings, control, corrective, change, complete int
	var latestUpdate time.Time

	for _, d := range docs {
		total++
		if d.Status == "Approved" {
			approved++
		} else if d.Status == "Under Review" {
			underReview++
		}
		if d.IsOverdue {
			overdue++
		}
		if d.UpdatedAt.After(latestUpdate) {
			latestUpdate = d.UpdatedAt
		}

		cat, isClosed := ClassifyCategory(d.DocNumber, d.Title, d.Status)
		if isClosed {
			complete++
		}
		switch cat {
		case CategoryControl:
			control++
		case CategoryCorrective:
			corrective++
		case CategoryChange:
			change++
		default:
			baselineDrawings++
		}
	}

	var rate float64
	if total > 0 {
		rate = float64(approved) / float64(total) * 100.0
	}

	if latestUpdate.IsZero() {
		latestUpdate = time.Now().UTC()
	}

	return &GlobalSummary{
		TotalProjects:        int(projectCount),
		TotalDocuments:       total,
		TotalOverdue:         overdue,
		OverdueDocuments:     overdue,
		CategoryCounts: CategoryCounts{
			BaselineDrawings: baselineDrawings,
			Control:          control,
			Corrective:       corrective,
			Change:           change,
			Complete:         complete,
		},
		LastUpdatedAt:        latestUpdate.Format(time.RFC3339),
		ApprovedDocuments:    approved,
		UnderReviewDocuments: underReview,
		GlobalApprovalRate:   rate,
	}, nil
}

func (s *Service) GetProjectMatrix(ctx context.Context, search, sortBy, sortDir string, page, pageSize int) ([]ProjectMatrixRow, int, error) {
	projects, err := s.repo.ListProjects(ctx)
	if err != nil {
		return nil, 0, err
	}

	rows := make([]ProjectMatrixRow, 0, len(projects))
	for _, p := range projects {
		docs, err := s.repo.ListDocumentsByProject(ctx, p.Code)
		if err != nil {
			return nil, 0, err
		}

		var total, approved, underReview, overdue int
		var baselineTotal, baselineApproved, baselineInReview, baselineOverdue int
		var ctrlTotal, ctrlOpen, ctrlClosed int
		var corrTotal, corrOpen, corrClosed int
		var corrAgeSum float64
		var chgTotal, chgOpen, chgClosed int
		var disciplines DisciplinesBreakdown
		var drawingTypesMap = make(map[string]bool)

		for _, d := range docs {
			total++
			if d.Status == "Approved" {
				approved++
			} else if d.Status == "Under Review" {
				underReview++
			}
			if d.IsOverdue {
				overdue++
			}

			cat, isClosed := ClassifyCategory(d.DocNumber, d.Title, d.Status)
			switch cat {
			case CategoryControl:
				ctrlTotal++
				if isClosed {
					ctrlClosed++
				} else {
					ctrlOpen++
				}
			case CategoryCorrective:
				corrTotal++
				if isClosed {
					corrClosed++
				} else {
					corrOpen++
					corrAgeSum += float64(d.OverdueDays)
				}
			case CategoryChange:
				chgTotal++
				if isClosed {
					chgClosed++
				} else {
					chgOpen++
				}
			default:
				baselineTotal++
				if d.Status == "Approved" {
					baselineApproved++
				} else if d.Status == "Under Review" {
					baselineInReview++
				}
				if d.IsOverdue {
					baselineOverdue++
				}

				switch strings.ToUpper(d.Discipline) {
				case "ME":
					disciplines.ME.Total++
					if d.Status == "Approved" {
						disciplines.ME.Approved++
					}
				case "CE":
					disciplines.CE.Total++
					if d.Status == "Approved" {
						disciplines.CE.Approved++
					}
				case "EE":
					disciplines.EE.Total++
					if d.Status == "Approved" {
						disciplines.EE.Approved++
					}
				}

				// Extract drawing type tag from DocNumber or Title
				parts := strings.Split(strings.ReplaceAll(d.DocNumber, "_", "-"), "-")
				for _, part := range parts {
					pUpper := strings.ToUpper(strings.TrimSpace(part))
					if pUpper == "FS" || pUpper == "ML" || pUpper == "PR" || pUpper == "GA" || pUpper == "LD" || pUpper == "FD" || pUpper == "GAD" || pUpper == "ISO" || pUpper == "PID" || pUpper == "DWG" {
						drawingTypesMap[pUpper] = true
					}
				}
				titleUpper := strings.ToUpper(d.Title)
				if strings.Contains(titleUpper, "FLOWSHEET") {
					drawingTypesMap["FS"] = true
				}
				if strings.Contains(titleUpper, "MACHINE LIST") {
					drawingTypesMap["ML"] = true
				}
				if strings.Contains(titleUpper, "PROCUREMENT") {
					drawingTypesMap["PR"] = true
				}
				if strings.Contains(titleUpper, "GENERAL ARRANGEMENT") {
					drawingTypesMap["GA"] = true
				}
				if strings.Contains(titleUpper, "LOAD DATA") {
					drawingTypesMap["LD"] = true
				}
				if strings.Contains(titleUpper, "FABRICATION") {
					drawingTypesMap["FD"] = true
				}
			}
		}

		var baselinePendingPct float64
		if baselineTotal > 0 {
			baselinePendingPct = float64(baselineInReview) / float64(baselineTotal) * 100.0
		}
		baselineMetrics := BaselineMetrics{
			Total:      baselineTotal,
			Approved:   baselineApproved,
			InReview:   baselineInReview,
			Overdue:    baselineOverdue,
			PendingPct: baselinePendingPct,
			IsCritical: baselinePendingPct >= 45.0,
		}

		drawingTypes := make([]string, 0, len(drawingTypesMap))
		for dt := range drawingTypesMap {
			drawingTypes = append(drawingTypes, dt)
		}
		sort.Strings(drawingTypes)

		calcCategoryMetrics := func(tot, op, cl int, avgAge float64) CategoryMetrics {
			var pct float64
			if tot > 0 {
				pct = float64(op) / float64(tot) * 100.0
			}
			return CategoryMetrics{
				Total:      tot,
				Open:       op,
				Closed:     cl,
				PendingPct: pct,
				IsCritical: pct >= 45.0,
				AvgAgeDays: avgAge,
			}
		}

		var corrAvgAge float64
		if corrOpen > 0 {
			corrAvgAge = corrAgeSum / float64(corrOpen)
		}

		var rate float64
		if total > 0 {
			rate = float64(approved) / float64(total) * 100.0
		}

		lastUpdated := p.UpdatedAt
		if lastUpdated.IsZero() {
			lastUpdated = p.CreatedAt
		}
		if lastUpdated.IsZero() {
			lastUpdated = time.Now().UTC()
		}

		siteCode := p.SiteCode
		if siteCode == "" {
			siteCode = p.Code
		}

		latestSnapshot, _ := s.repo.GetLatestSnapshot(ctx, p.Code)
		lastSnapshotDate := lastUpdated.Format("2006-01-02")
		netChange := "STABLE"
		if latestSnapshot != nil {
			lastSnapshotDate = latestSnapshot.SnapshotDate.Format("2006-01-02")
			if overdue < latestSnapshot.OverdueDocuments {
				netChange = "IMPROVING"
			} else if overdue > latestSnapshot.OverdueDocuments {
				netChange = "DEGRADING"
			}
		}

		rows = append(rows, ProjectMatrixRow{
			ProjectID:            p.Code,
			ProjectCode:          p.Code,
			SiteCode:             siteCode,
			ProjectName:          p.Name,
			BaselineDrawings:     baselineMetrics,
			Control:              calcCategoryMetrics(ctrlTotal, ctrlOpen, ctrlClosed, 0),
			Corrective:           calcCategoryMetrics(corrTotal, corrOpen, corrClosed, corrAvgAge),
			Change:               calcCategoryMetrics(chgTotal, chgOpen, chgClosed, 0),
			Complete:             calcCategoryMetrics(0, 0, 0, 0),
			Disciplines:          disciplines,
			DrawingTypes:         drawingTypes,
			PendingAgingDays:     corrAvgAge,
			OverdueCount:         overdue,
			OverdueDocuments:     overdue,
			NetChange:            netChange,
			LastSnapshotDate:     lastSnapshotDate,
			TotalDocuments:       total,
			ApprovedDocuments:    approved,
			UnderReviewDocuments: underReview,
			ApprovalRate:         rate,
			LastUpdated:          lastUpdated,
		})
	}

	if search != "" {
		term := strings.ToLower(strings.TrimSpace(search))
		var filtered []ProjectMatrixRow
		for _, r := range rows {
			if strings.Contains(strings.ToLower(r.ProjectCode), term) ||
				strings.Contains(strings.ToLower(r.ProjectName), term) ||
				strings.Contains(strings.ToLower(r.SiteCode), term) {
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
		case "overdue", "overdue_documents", "overdue_count":
			if desc {
				return rows[i].OverdueCount > rows[j].OverdueCount
			}
			return rows[i].OverdueCount < rows[j].OverdueCount
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

	totalCount := len(rows)
	if page > 0 && pageSize > 0 {
		start := (page - 1) * pageSize
		if start > totalCount {
			return []ProjectMatrixRow{}, totalCount, nil
		}
		end := start + pageSize
		if end > totalCount {
			end = totalCount
		}
		return rows[start:end], totalCount, nil
	}

	return rows, totalCount, nil
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

func (s *Service) GetAnalyticsTrends(ctx context.Context, projectIDs []string, from, to time.Time, preset string) ([]DateMetricPoint, error) {
	if len(projectIDs) == 0 {
		prjs, err := s.repo.ListProjects(ctx)
		if err == nil {
			for _, p := range prjs {
				projectIDs = append(projectIDs, p.Code)
			}
		}
	}

	now := time.Now().UTC()
	if from.IsZero() && preset != "" {
		switch strings.ToLower(preset) {
		case "3_months", "3m":
			from = now.AddDate(0, -3, 0)
		case "6_months", "6m":
			from = now.AddDate(0, -6, 0)
		case "1_year", "1y":
			from = now.AddDate(-1, 0, 0)
		}
	}

	dateMap := make(map[string]map[string]ProjectMetricPoint)
	dateAggregates := make(map[string]struct {
		total, approved, underReview, overdue int
	})

	for _, pCode := range projectIDs {
		pCode = strings.TrimSpace(pCode)
		if pCode == "" {
			continue
		}
		snapshots, err := s.repo.GetTrendSeries(ctx, pCode, from, to)
		if err != nil {
			return nil, err
		}

		for _, snap := range snapshots {
			dStr := snap.SnapshotDate.Format("2006-01-02")
			if dateMap[dStr] == nil {
				dateMap[dStr] = make(map[string]ProjectMetricPoint)
			}
			dateMap[dStr][pCode] = ProjectMetricPoint{
				TotalDocuments: snap.TotalDocuments,
				OverdueCount:   snap.OverdueDocuments,
				Total:          snap.TotalDocuments,
				Approved:       snap.ApprovedDocuments,
				UnderReview:    snap.UnderReviewDocuments,
				Overdue:        snap.OverdueDocuments,
				ApprovalRate:   snap.ApprovalRate,
			}

			agg := dateAggregates[dStr]
			agg.total += snap.TotalDocuments
			agg.approved += snap.ApprovedDocuments
			agg.underReview += snap.UnderReviewDocuments
			agg.overdue += snap.OverdueDocuments
			dateAggregates[dStr] = agg
		}
	}

	// Build sorted date list
	dates := make([]string, 0, len(dateMap))
	for d := range dateMap {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	points := make([]DateMetricPoint, 0, len(dates))
	for _, d := range dates {
		agg := dateAggregates[d]
		var aggRate float64
		if agg.total > 0 {
			aggRate = float64(agg.approved) / float64(agg.total) * 100.0
		}

		pt := DateMetricPoint{
			Date:           d,
			ProjectMetrics: dateMap[d],
			Total:          agg.total,
			Approved:       agg.approved,
			UnderReview:    agg.underReview,
			Overdue:        agg.overdue,
			ApprovalRate:   aggRate,
		}

		// If single project requested, inherit its direct metrics
		if len(projectIDs) == 1 {
			if single, ok := dateMap[d][projectIDs[0]]; ok {
				pt.Total = single.TotalDocuments
				pt.Approved = single.Approved
				pt.UnderReview = single.UnderReview
				pt.Overdue = single.OverdueCount
				pt.ApprovalRate = single.ApprovalRate
			}
		}

		points = append(points, pt)
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
