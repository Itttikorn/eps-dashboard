package project

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"eps-dashboard/backend/internal/utils"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// GET /api/v1/projects/summary
func (h *Handler) GetProjectsSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.service.GetGlobalSummary(r.Context())
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithTotal(summary, int64(summary.TotalProjects)))
}

// GET /api/v1/projects
func (h *Handler) GetProjects(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	sortBy := r.URL.Query().Get("sort_by")
	sortDir := r.URL.Query().Get("sort_dir")

	page := 1
	if rawPage := r.URL.Query().Get("page"); rawPage != "" {
		if p, err := strconv.Atoi(rawPage); err == nil && p > 0 {
			page = p
		}
	}

	pageSize := 20
	if rawPageSize := r.URL.Query().Get("page_size"); rawPageSize != "" {
		if ps, err := strconv.Atoi(rawPageSize); err == nil && ps > 0 {
			if ps > 100 {
				ps = 100
			}
			pageSize = ps
		}
	}

	matrix, total, err := h.service.GetProjectMatrix(r.Context(), search, sortBy, sortDir, page, pageSize)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	searchParams := map[string]any{
		"search":    search,
		"page":      page,
		"page_size": pageSize,
	}
	if sortBy != "" {
		searchParams["sort_by"] = sortBy
	}
	if sortDir != "" {
		searchParams["sort_dir"] = sortDir
	}
	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithSearchParams(matrix, int64(total), searchParams))
}

// GET /api/v1/projects/{projectCode}
func (h *Handler) GetProjectDetails(w http.ResponseWriter, r *http.Request) {
	projectCode := chi.URLParam(r, "projectCode")
	if projectCode == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("projectCode is required"))
		return
	}

	res, err := h.service.GetProjectDetails(r.Context(), projectCode)
	if err != nil {
		if errors.Is(err, ErrProjectNotFound) {
			utils.WriteJSON(w, http.StatusNotFound, utils.NotFoundErrorResponse("Project"))
			return
		}
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessResponse(res))
}

// GET /api/v1/projects/{projectCode}/overdue
func (h *Handler) GetProjectOverdue(w http.ResponseWriter, r *http.Request) {
	projectCode := chi.URLParam(r, "projectCode")
	if projectCode == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("projectCode is required"))
		return
	}

	overdueSummary, err := h.service.GetOverdueSummary(r.Context(), projectCode)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithTotal(overdueSummary, int64(overdueSummary.TotalOverdue)))
}

// GET /api/v1/projects/{projectCode}/disciplines
func (h *Handler) GetProjectDisciplines(w http.ResponseWriter, r *http.Request) {
	projectCode := chi.URLParam(r, "projectCode")
	if projectCode == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("projectCode is required"))
		return
	}

	disciplines, err := h.service.GetDisciplineBreakdown(r.Context(), projectCode)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithTotal(disciplines, int64(len(disciplines))))
}

// GET /api/v1/analytics/trends
func (h *Handler) GetAnalyticsTrends(w http.ResponseWriter, r *http.Request) {
	projectIDsRaw := r.URL.Query().Get("project_ids")
	projectCode := r.URL.Query().Get("project_code")

	var projectIDs []string
	if projectIDsRaw != "" {
		for _, id := range strings.Split(projectIDsRaw, ",") {
			trimmed := strings.TrimSpace(id)
			if trimmed != "" {
				projectIDs = append(projectIDs, trimmed)
			}
		}
	} else if projectCode != "" {
		projectIDs = []string{projectCode}
	}

	rawStartDate := r.URL.Query().Get("start_date")
	if rawStartDate == "" {
		rawStartDate = r.URL.Query().Get("from")
	}
	rawEndDate := r.URL.Query().Get("end_date")
	if rawEndDate == "" {
		rawEndDate = r.URL.Query().Get("to")
	}
	preset := r.URL.Query().Get("preset")

	var from, to time.Time
	if rawStartDate != "" {
		if t, err := time.Parse("2006-01-02", rawStartDate); err == nil {
			from = t
		}
	}
	if rawEndDate != "" {
		if t, err := time.Parse("2006-01-02", rawEndDate); err == nil {
			to = t
		}
	}

	trends, err := h.service.GetAnalyticsTrends(r.Context(), projectIDs, from, to, preset)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	searchParams := map[string]any{
		"project_ids": projectIDsRaw,
		"start_date":  rawStartDate,
		"end_date":    rawEndDate,
		"preset":      preset,
	}
	if projectCode != "" {
		searchParams["project_code"] = projectCode
	}
	if r.URL.Query().Get("from") != "" {
		searchParams["from"] = r.URL.Query().Get("from")
	}
	if r.URL.Query().Get("to") != "" {
		searchParams["to"] = r.URL.Query().Get("to")
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithSearchParams(trends, int64(len(trends)), searchParams))
}

