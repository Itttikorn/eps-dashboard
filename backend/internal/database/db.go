package database

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"eps-dashboard/backend/internal/config"
	"eps-dashboard/backend/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB opens the Postgres connection pool with production-safe pool tuning.
func InitDB(dsn string) (*gorm.DB, error) {
	if dsn == "" {
		return nil, fmt.Errorf("database connection string is empty: configure DATABASE_URL or DB_HOST in environment")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	maxOpen := config.Int("DB_MAX_OPEN_CONNS", 25)
	maxIdle := config.Int("DB_MAX_IDLE_CONNS", 10)
	if maxIdle > maxOpen {
		maxIdle = maxOpen
	}
	sqlDB.SetMaxOpenConns(maxOpen)
	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxLifetime(config.Duration("DB_CONN_MAX_LIFETIME", 30*time.Minute))
	sqlDB.SetConnMaxIdleTime(config.Duration("DB_CONN_MAX_IDLE_TIME", 5*time.Minute))

	pingCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(pingCtx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	slog.Info("Postgres database client initialized", "max_open", maxOpen, "max_idle", maxIdle)

	if config.Bool("DB_AUTO_MIGRATE", true) {
		if err := AutoMigrate(db); err != nil {
			return nil, fmt.Errorf("failed to auto-migrate database: %w", err)
		}
	}

	return db, nil
}

// InitInMemoryDB initializes an isolated in-memory SQLite database instance for unit testing.
func InitInMemoryDB() (*gorm.DB, error) {
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	}

	dbName := fmt.Sprintf("file:mem_%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dbName), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to open in-memory sqlite database: %w", err)
	}

	return db, nil
}

type testingTB interface {
	Helper()
	Fatalf(format string, args ...any)
}

// NewTestDB creates an isolated in-memory SQLite database and applies auto-migrations.
func NewTestDB(t testingTB) *gorm.DB {
	t.Helper()
	db, err := InitInMemoryDB()
	if err != nil {
		t.Fatalf("failed to initialize in-memory database: %v", err)
	}
	if err := AutoMigrate(db); err != nil {
		t.Fatalf("failed to auto-migrate test database: %v", err)
	}
	return db
}

// AutoMigrate applies schema migrations and seeds standard reference disciplines.
func AutoMigrate(db *gorm.DB) error {
	mList := []interface{}{
		&models.Project{},
		&models.Discipline{},
		&models.Document{},
		&models.KPISnapshot{},
		&models.OverdueLog{},
	}

	for _, m := range mList {
		if err := db.AutoMigrate(m); err != nil {
			return fmt.Errorf("automigration failed for model %T: %w", m, err)
		}
	}

	// Seed standard disciplines if not existing
	for _, d := range models.StandardDisciplines {
		var existing models.Discipline
		if err := db.Where("code = ?", d.Code).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&d).Error; err != nil {
					return fmt.Errorf("failed to seed discipline %s: %w", d.Code, err)
				}
			}
		}
	}

	return nil
}

// Ping checks database connectivity.
func Ping(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// GetSQLDB retrieves the underlying *sql.DB object.
func GetSQLDB(db *gorm.DB) (*sql.DB, error) {
	return db.DB()
}
