package project

import (
	"errors"
	"net/http"
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

	matrix, err := h.service.GetProjectMatrix(r.Context(), search, sortBy, sortDir)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	searchParams := map[string]any{
		"search":   search,
		"sort_by":  sortBy,
		"sort_dir": sortDir,
	}
	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithSearchParams(matrix, int64(len(matrix)), searchParams))
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
	projectCode := r.URL.Query().Get("project_code")
	rawFrom := r.URL.Query().Get("from")
	rawTo := r.URL.Query().Get("to")

	var from, to time.Time
	if rawFrom != "" {
		if t, err := time.Parse("2006-01-02", rawFrom); err == nil {
			from = t
		}
	}
	if rawTo != "" {
		if t, err := time.Parse("2006-01-02", rawTo); err == nil {
			to = t
		}
	}

	trends, err := h.service.GetAnalyticsTrends(r.Context(), projectCode, from, to)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	searchParams := map[string]any{
		"project_code": projectCode,
		"from":         rawFrom,
		"to":           rawTo,
	}
	utils.WriteJSON(w, http.StatusOK, utils.SuccessWithSearchParams(trends, int64(len(trends)), searchParams))
}

