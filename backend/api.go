package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"eps-dashboard/backend/internal/ingest"
	"eps-dashboard/backend/internal/project"
	"eps-dashboard/backend/internal/utils"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"
)

// Fallbacks for zero-valued Config
const (
	defaultAPIRequestTimeout = 25 * time.Second
	defaultShutdownGrace     = 8 * time.Second
)

type Application struct {
	Config Config
	DB     *gorm.DB
}

type Config struct {
	Addr              string
	WT                time.Duration // Write Timeout (Response Timeout)
	RT                time.Duration // Read Timeout (Request Timeout)
	IDT               time.Duration // Idle Timeout
	APIRequestTimeout time.Duration // Bound for API handlers
	ShutdownGrace     time.Duration // Grace period for in-flight requests on SIGTERM
	RequestLog        bool          // Toggle chi per-request access log
}

// Mount initializes middleware and mounts HTTP routes onto Chi router.
func (app *Application) Mount() http.Handler {
	r := chi.NewRouter()

	// Base middlewares
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	if app.Config.RequestLog {
		r.Use(middleware.Logger)
	}
	r.Use(middleware.Recoverer)

	// Security Headers
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Content-Security-Policy", "default-src 'self'")
			next.ServeHTTP(w, r)
		})
	})

	allowedOrigins := []string{"*"}
	if v := os.Getenv("CORS_ALLOWED_ORIGINS"); v != "" {
		allowedOrigins = strings.Split(v, ",")
	}
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-API-Key"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Root health endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("Hello from eps-dashboard server! Here is all good."))
	})

	apiTimeout := app.Config.APIRequestTimeout
	if apiTimeout <= 0 {
		apiTimeout = defaultAPIRequestTimeout
	}

	registerRoutes := func(api chi.Router) {
		api.Use(middleware.Timeout(apiTimeout))

		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			utils.WriteJSON(w, http.StatusOK, utils.SuccessResponse(map[string]string{
				"status": "healthy",
				"time":   time.Now().UTC().Format(time.RFC3339),
			}))
		})

		var projectRepo project.ProjectRepository
		var ingestRepo ingest.Repository
		if app.DB != nil {
			projectRepo = project.NewRepository(app.DB)
			ingestRepo = ingest.NewRepository(app.DB)
		}

		projectHandler := project.NewHandler(project.NewService(projectRepo))
		ingestHandler := ingest.NewHandler(ingest.NewService(ingestRepo))

		// Ingestion endpoint
		api.Post("/ingest", ingestHandler.IngestCSV)

		// Projects endpoints
		api.Route("/projects", func(r chi.Router) {
			r.Get("/summary", projectHandler.GetProjectsSummary)
			r.Get("/matrix", projectHandler.GetProjects)
			r.Get("/", projectHandler.GetProjects)
			r.Get("/{projectCode}", projectHandler.GetProjectDetails)
			r.Get("/{projectCode}/overdue", projectHandler.GetProjectOverdue)
			r.Get("/{projectCode}/disciplines", projectHandler.GetProjectDisciplines)
			r.Get("/{projectCode}/trends", projectHandler.GetAnalyticsTrends)
		})

		// Analytics trends
		api.Get("/analytics/trends", projectHandler.GetAnalyticsTrends)
	}

	r.Route("/api", registerRoutes)
	r.Route("/api/v1", registerRoutes)

	return r
}

// Run starts the HTTP server and blocks until ctx is canceled, then executes graceful drain.
func (app *Application) Run(ctx context.Context, h http.Handler) error {
	srv := &http.Server{
		Addr:              app.Config.Addr,
		Handler:           h,
		WriteTimeout:      app.Config.WT,
		ReadTimeout:       app.Config.RT,
		ReadHeaderTimeout: app.Config.RT,
		IdleTimeout:       app.Config.IDT,
	}

	serveErr := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serveErr <- err
		}
	}()

	slog.Info("Server has started", "addr", app.Config.Addr)

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	slog.Info("Shutdown signal received, draining")

	grace := app.Config.ShutdownGrace
	if grace <= 0 {
		grace = defaultShutdownGrace
	}

	drainCtx, cancel := context.WithTimeout(context.Background(), grace)
	defer cancel()

	if err := srv.Shutdown(drainCtx); err != nil {
		slog.Error("Server did not drain cleanly", "err", err)
		return err
	}

	slog.Info("Server stopped cleanly")
	return nil
}

