package ingest

import (
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"eps-dashboard/backend/internal/utils"
)

// Handler handles HTTP requests for document ingestion.
type Handler struct {
	svc *Service
}

// NewHandler creates a new Handler instance.
func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// IngestCSV processes multipart file uploads or raw CSV body streams.
func (h *Handler) IngestCSV(w http.ResponseWriter, r *http.Request) {
	const maxUploadSize = 32 << 20 // 32MB hard ceiling
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	projectCodeOverride := strings.TrimSpace(r.URL.Query().Get("project_code"))
	if projectCodeOverride == "" {
		projectCodeOverride = strings.TrimSpace(r.URL.Query().Get("projectCode"))
	}
	forceChronology := r.URL.Query().Get("force") == "true" || r.URL.Query().Get("forceChronology") == "true"

	var reader io.Reader

	contentType := r.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("failed to parse multipart form: "+err.Error()))
			return
		}
		if r.MultipartForm != nil {
			defer func() { _ = r.MultipartForm.RemoveAll() }()
		}

		if projectCodeOverride == "" {
			projectCodeOverride = strings.TrimSpace(r.FormValue("project_code"))
			if projectCodeOverride == "" {
				projectCodeOverride = strings.TrimSpace(r.FormValue("projectCode"))
			}
		}
		if !forceChronology {
			forceChronology = r.FormValue("force") == "true" || r.FormValue("forceChronology") == "true"
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			// Try "csv" field name
			var csvErr error
			file, _, csvErr = r.FormFile("csv")
			if csvErr != nil {
				utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("missing CSV file in 'file' or 'csv' form field"))
				return
			}
		}
		defer file.Close()
		reader = file
	} else if strings.Contains(contentType, "text/csv") || strings.Contains(contentType, "application/csv") || contentType == "text/plain" {
		reader = io.LimitReader(r.Body, maxUploadSize)
	} else {
		// Attempt to parse multipart form if content type is unset or generic
		if err := r.ParseMultipartForm(maxUploadSize); err == nil && r.MultipartForm != nil {
			defer func() { _ = r.MultipartForm.RemoveAll() }()
			if f, _, err := r.FormFile("file"); err == nil {
				defer f.Close()
				reader = f
			}
		}
		if reader == nil {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse("request must be multipart/form-data or text/csv"))
			return
		}
	}

	result, err := h.svc.IngestCSV(r.Context(), reader, projectCodeOverride, forceChronology)
	if err != nil {
		if errors.Is(err, ErrChronologyDowngrade) {
			utils.WriteJSON(w, http.StatusConflict, utils.Response{
				Status: utils.StatusInfo{
					Code:        1801,
					Header:      "Conflict",
					Description: err.Error(),
				},
			})
			return
		}
		if errors.Is(err, ErrEmptyCSV) || errors.Is(err, ErrMissingHeaders) || errors.Is(err, ErrNoValidRows) {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ValidationErrorResponse(err.Error()))
			return
		}

		slog.Error("Failed to ingest CSV", "err", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ServerErrorResponse())
		return
	}

	utils.WriteJSON(w, http.StatusOK, utils.SuccessResponse(result))
}

