package main

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"eps-dashboard/backend/internal/database"
)

func TestMountHealthEndpoint(t *testing.T) {
	app := &Application{
		Config: Config{
			RequestLog: false,
		},
	}

	handler := app.Mount()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	body, _ := io.ReadAll(rec.Body)
	wantBody := "Hello from eps-dashboard server! Here is all good."
	if string(body) != wantBody {
		t.Errorf("body = %q, want %q", string(body), wantBody)
	}
}

func TestMountCORSMiddleware(t *testing.T) {
	_ = os.Setenv("CORS_ALLOWED_ORIGINS", "https://example.com,https://app.example.com")
	defer func() { _ = os.Unsetenv("CORS_ALLOWED_ORIGINS") }()

	app := &Application{
		Config: Config{},
	}

	handler := app.Mount()

	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK && rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 200 or 204", rec.Code)
	}

	header := rec.Header().Get("Access-Control-Allow-Origin")
	if header != "https://example.com" {
		t.Errorf("CORS header = %q, want %q", header, "https://example.com")
	}
}

func TestMountAPIRoutes(t *testing.T) {
	db := database.NewTestDB(t)
	app := &Application{
		Config: Config{},
		DB:     db,
	}

	handler := app.Mount()

	routes := []struct {
		method string
		path   string
		status int
	}{
		{http.MethodGet, "/api/health", http.StatusOK},
		{http.MethodGet, "/api/v1/health", http.StatusOK},
		{http.MethodGet, "/api/projects/summary", http.StatusOK},
		{http.MethodGet, "/api/v1/projects/summary", http.StatusOK},
		{http.MethodGet, "/api/projects/matrix", http.StatusOK},
		{http.MethodGet, "/api/projects", http.StatusOK},
		{http.MethodPost, "/api/ingest", http.StatusBadRequest}, // Bad request because body is empty
	}

	for _, rt := range routes {
		req := httptest.NewRequest(rt.method, rt.path, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != rt.status {
			t.Errorf("%s %s got status %d, want %d", rt.method, rt.path, rec.Code, rt.status)
		}
	}
}

func TestRunGracefulShutdown(t *testing.T) {
	app := &Application{
		Config: Config{
			Addr:              "127.0.0.1:0",
			WT:                5 * time.Second,
			RT:                5 * time.Second,
			IDT:               5 * time.Second,
			APIRequestTimeout: 2 * time.Second,
			ShutdownGrace:     1 * time.Second,
		},
	}

	ctx, cancel := context.WithCancel(context.Background())

	errCh := make(chan error, 1)
	go func() {
		errCh <- app.Run(ctx, app.Mount())
	}()

	// Give the server time to start
	time.Sleep(100 * time.Millisecond)

	// Trigger shutdown
	cancel()

	select {
	case err := <-errCh:
		if err != nil {
			t.Fatalf("Run returned error on shutdown: %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("Run timed out during graceful shutdown")
	}
}

