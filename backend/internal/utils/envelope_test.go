package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEnvelopeConstructors(t *testing.T) {
	// Success
	resSuccess := SuccessResponse("test payload")
	if resSuccess.Status.Code != 1000 || resSuccess.Result != "test payload" {
		t.Errorf("unexpected success response: %+v", resSuccess)
	}

	// Success with total
	resTotal := SuccessWithTotal([]string{"a", "b"}, 2)
	if resTotal.Status.Code != 1000 || *resTotal.Total != 2 {
		t.Errorf("unexpected success with total: %+v", resTotal)
	}

	// Success with search params
	params := map[string]any{"query": "chem"}
	resParams := SuccessWithSearchParams("result", 1, params)
	if resParams.SearchParams["query"] != "chem" {
		t.Errorf("unexpected search params: %+v", resParams)
	}

	// Validation error
	resVal := ValidationErrorResponse("bad field")
	if resVal.Status.Code != 1801 || resVal.Status.Description != "bad field" {
		t.Errorf("unexpected validation error: %+v", resVal)
	}

	// Not found error
	resNF := NotFoundErrorResponse("Project")
	if resNF.Status.Code != 1802 || resNF.Status.Description != "Project not found" {
		t.Errorf("unexpected not found error: %+v", resNF)
	}

	// Duplicate error
	resDup := DuplicateErrorResponse("Project")
	if resDup.Status.Code != 1799 {
		t.Errorf("unexpected duplicate error: %+v", resDup)
	}
	resDupMsg := DuplicateErrorResponseMsg("custom duplicate")
	if resDupMsg.Status.Description != "custom duplicate" {
		t.Errorf("unexpected custom duplicate error: %+v", resDupMsg)
	}

	// Generic error
	resGen := GenericErrorResponse()
	if resGen.Status.Code != 1899 {
		t.Errorf("unexpected generic error: %+v", resGen)
	}

	// Unauthorized
	resUnauth := UnauthorizedErrorResponse()
	if resUnauth.Status.Code != 1803 {
		t.Errorf("unexpected unauthorized: %+v", resUnauth)
	}

	// Server error
	resServ := ServerErrorResponse()
	if resServ.Status.Code != 1900 {
		t.Errorf("unexpected server error: %+v", resServ)
	}

	// Internal error
	resInt := InternalErrorResponse()
	if resInt.Status.Code != 1999 {
		t.Errorf("unexpected internal error: %+v", resInt)
	}
}

func TestWriteJSON(t *testing.T) {
	rec := httptest.NewRecorder()
	resp := SuccessResponse(map[string]string{"foo": "bar"})

	WriteJSON(rec, http.StatusOK, resp)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "application/json; charset=utf-8" {
		t.Errorf("expected application/json header, got %s", rec.Header().Get("Content-Type"))
	}

	var parsed Response
	if err := json.Unmarshal(rec.Body.Bytes(), &parsed); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if parsed.Status.Code != 1000 {
		t.Errorf("expected status code 1000, got %d", parsed.Status.Code)
	}
}

