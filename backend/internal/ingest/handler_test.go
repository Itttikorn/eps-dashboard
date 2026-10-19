package ingest

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"eps-dashboard/backend/internal/database"
	"eps-dashboard/backend/internal/utils"
)

func createMultipartRequest(t *testing.T, fieldName, fileName, content string) (*http.Request, string) {
	t.Helper()
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile(fieldName, fileName)
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	if _, err := part.Write([]byte(content)); err != nil {
		t.Fatalf("failed to write part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("failed to close multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/ingest", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, writer.FormDataContentType()
}

func TestHandler_IngestCSV_MultipartSuccess(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	csvData := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-HTTP,HTTP-001,Handler Test Doc,ME,Approved,0,2026-03-01,2026-03-15
`
	req, _ := createMultipartRequest(t, "file", "test.csv", csvData)
	rec := httptest.NewRecorder()

	handler.IngestCSV(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse envelope: %v", err)
	}

	if resp.Status.Code != 1000 {
		t.Errorf("status.code = %d, want 1000", resp.Status.Code)
	}
}

func TestHandler_IngestCSV_TextCSVSuccess(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	csvData := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-TEXT,TEXT-001,Raw Stream Doc,CE,Approved,1,2026-03-01,2026-03-15
`
	req := httptest.NewRequest(http.MethodPost, "/api/ingest?project_code=PRJ-TEXT", strings.NewReader(csvData))
	req.Header.Set("Content-Type", "text/csv")
	rec := httptest.NewRecorder()

	handler.IngestCSV(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp utils.Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse envelope: %v", err)
	}
	if resp.Status.Code != 1000 {
		t.Errorf("status.code = %d, want 1000", resp.Status.Code)
	}
}

func TestHandler_IngestCSV_MissingFile(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	// Multipart without file part
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("project_code", "PRJ-X")
	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/ingest", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()

	handler.IngestCSV(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var resp utils.Response
	_ = json.Unmarshal(rec.Body.Bytes(), &resp)
	if resp.Status.Code != 1801 {
		t.Errorf("status.code = %d, want 1801 (validation error)", resp.Status.Code)
	}
}

func TestHandler_IngestCSV_InvalidContentType(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/ingest", strings.NewReader("hello"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.IngestCSV(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestHandler_IngestCSV_ChronologicalDowngradeConflict(t *testing.T) {
	db := database.NewTestDB(t)
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)

	// Ingest latest
	csvNew := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-CONF,DOC-1,Latest,ME,Approved,A,2026-03-25,2026-03-30
`
	req1, _ := createMultipartRequest(t, "file", "new.csv", csvNew)
	rec1 := httptest.NewRecorder()
	handler.IngestCSV(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("initial ingest failed: %d", rec1.Code)
	}

	// Attempt older without force
	csvOld := `project_code,doc_number,title,discipline,status,revision,issue_date,target_date
PRJ-CONF,DOC-1,Old,ME,Approved,0,2026-03-10,2026-03-30
`
	req2, _ := createMultipartRequest(t, "file", "old.csv", csvOld)
	rec2 := httptest.NewRecorder()
	handler.IngestCSV(rec2, req2)

	if rec2.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d (Conflict)", rec2.Code, http.StatusConflict)
	}
}

