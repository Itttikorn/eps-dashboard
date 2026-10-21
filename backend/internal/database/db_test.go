package database

import (
	"testing"

	"eps-dashboard/backend/internal/models"
)

func TestDatabaseMigrationAndSeeding(t *testing.T) {
	db, err := InitInMemoryDB()
	if err != nil {
		t.Fatalf("failed to init in-memory db: %v", err)
	}

	if err := AutoMigrate(db); err != nil {
		t.Fatalf("failed to automigrate: %v", err)
	}

	// Verify disciplines seeded
	var count int64
	if err := db.Model(&models.Discipline{}).Count(&count).Error; err != nil {
		t.Fatalf("failed to count disciplines: %v", err)
	}
	if count < 6 {
		t.Errorf("expected at least 6 disciplines seeded, got %d", count)
	}

	// Verify Ping
	if err := Ping(db); err != nil {
		t.Errorf("Ping failed: %v", err)
	}

	// Verify GetSQLDB
	sqlDB, err := GetSQLDB(db)
	if err != nil || sqlDB == nil {
		t.Errorf("GetSQLDB failed: %v", err)
	}
}

func TestModelIndexes(t *testing.T) {
	db, err := InitInMemoryDB()
	if err != nil {
		t.Fatalf("InitInMemoryDB failed: %v", err)
	}
	if err := AutoMigrate(db); err != nil {
		t.Fatalf("AutoMigrate failed: %v", err)
	}

	// Verify indexes exist in sqlite_master
	var count int64
	db.Raw("SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_snapshot_project_date'").Scan(&count)
	if count == 0 {
		t.Errorf("expected idx_snapshot_project_date index to be created")
	}

	db.Raw("SELECT count(*) FROM sqlite_master WHERE type = 'index' AND name = 'idx_project_issue_date'").Scan(&count)
	if count == 0 {
		t.Errorf("expected idx_project_issue_date index to be created")
	}
}


