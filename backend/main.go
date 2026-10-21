package main

import (
	"context"
	"log/slog"
	"net"
	"net/url"
	"os"
	"os/signal"
	"runtime/debug"
	"syscall"
	"time"

	"eps-dashboard/backend/internal/config"
	"eps-dashboard/backend/internal/database"

	"github.com/joho/godotenv"
)

func main() {
	// Standardized structured logging for the service
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Load environment variables (.env files)
	if err := godotenv.Load("/secrets/.env"); err != nil {
		if err := godotenv.Load(".env"); err != nil {
			slog.Info("No secret or .env file found, using system environment variables")
		}
	}

	// Dynamic memory limit ceiling for containerized environments
	if limit := config.Int64("GOMEMLIMIT_BYTES", 0); limit > 0 {
		debug.SetMemoryLimit(limit)
		slog.Info("Go memory limit configured", "bytes", limit)
	}

	// Graceful shutdown context listening for SIGTERM / SIGINT
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	port := config.String("PORT", "8080")
	dbURL := config.String("DATABASE_URL", config.String("DB_DSN", ""))
	if dbURL == "" {
		host := config.String("DB_HOST", "")
		if host != "" {
			dbPort := config.String("DB_PORT", "5432")
			user := config.String("DB_USER", "postgres")
			password := config.String("DB_PASSWORD", "postgres")
			dbname := config.String("DB_NAME", "eps_db")
			sslmode := config.String("DB_SSLMODE", "disable")
			u := &url.URL{
				Scheme:   "postgres",
				User:     url.UserPassword(user, password),
				Host:     net.JoinHostPort(host, dbPort),
				Path:     dbname,
				RawQuery: "sslmode=" + url.QueryEscape(sslmode),
			}
			dbURL = u.String()
		}
	}

	db, err := database.InitDB(dbURL)
	if err != nil {
		slog.Error("Failed to connect to database", "err", err)
		os.Exit(1)
	}
	if sqlDB, err := db.DB(); err == nil {
		defer func() { _ = sqlDB.Close() }()
	}

	cfg := Config{
		Addr:              ":" + port,
		WT:                config.Duration("HTTP_WRITE_TIMEOUT", 30*time.Second),
		RT:                config.Duration("HTTP_READ_TIMEOUT", 10*time.Second),
		IDT:               config.Duration("HTTP_IDLE_TIMEOUT", time.Minute),
		APIRequestTimeout: config.Duration("API_REQUEST_TIMEOUT", 25*time.Second),
		ShutdownGrace:     config.Duration("SHUTDOWN_GRACE_PERIOD", 8*time.Second),
		RequestLog:        config.Bool("HTTP_REQUEST_LOG", false),
	}

	app := Application{
		Config: cfg,
		DB:     db,
	}

	if err := app.Run(ctx, app.Mount()); err != nil {
		slog.Error("Server has failed to start", "err", err)
		os.Exit(1)
	}
}
