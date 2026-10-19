package config

import (
	"testing"
	"time"
)

func TestEnvHelpers(t *testing.T) {
	// String
	if val := String("UNSET_STR", "default"); val != "default" {
		t.Errorf("expected default, got %s", val)
	}
	t.Setenv("TEST_STR", "custom")
	if val := String("TEST_STR", "default"); val != "custom" {
		t.Errorf("expected custom, got %s", val)
	}

	// Strings
	if val := Strings("UNSET_STRS", []string{"a", "b"}); len(val) != 2 {
		t.Errorf("expected 2 items, got %d", len(val))
	}
	t.Setenv("TEST_STRS", "x, y , z")
	strs := Strings("TEST_STRS", nil)
	if len(strs) != 3 || strs[0] != "x" || strs[1] != "y" || strs[2] != "z" {
		t.Errorf("unexpected strings parsed: %v", strs)
	}

	// Int
	if val := Int("UNSET_INT", 42); val != 42 {
		t.Errorf("expected 42, got %d", val)
	}
	t.Setenv("TEST_INT", "100")
	if val := Int("TEST_INT", 42); val != 100 {
		t.Errorf("expected 100, got %d", val)
	}
	t.Setenv("BAD_INT", "not_a_number")
	if val := Int("BAD_INT", 42); val != 42 {
		t.Errorf("expected fallback on bad int, got %d", val)
	}

	// Int64
	if val := Int64("UNSET_INT64", 1000); val != 1000 {
		t.Errorf("expected 1000, got %d", val)
	}
	t.Setenv("TEST_INT64", "2000")
	if val := Int64("TEST_INT64", 1000); val != 2000 {
		t.Errorf("expected 2000, got %d", val)
	}
	t.Setenv("BAD_INT64", "bad")
	if val := Int64("BAD_INT64", 1000); val != 1000 {
		t.Errorf("expected fallback on bad int64, got %d", val)
	}

	// Duration
	if val := Duration("UNSET_DUR", 5*time.Second); val != 5*time.Second {
		t.Errorf("expected 5s, got %v", val)
	}
	t.Setenv("TEST_DUR_STR", "10m")
	if val := Duration("TEST_DUR_STR", time.Second); val != 10*time.Minute {
		t.Errorf("expected 10m, got %v", val)
	}
	t.Setenv("TEST_DUR_SECS", "30")
	if val := Duration("TEST_DUR_SECS", time.Second); val != 30*time.Second {
		t.Errorf("expected 30s, got %v", val)
	}
	t.Setenv("BAD_DUR", "invalid")
	if val := Duration("BAD_DUR", time.Second); val != time.Second {
		t.Errorf("expected fallback on bad duration, got %v", val)
	}

	// Bool
	if val := Bool("UNSET_BOOL", true); !val {
		t.Errorf("expected true, got false")
	}
	t.Setenv("TEST_BOOL", "true")
	if val := Bool("TEST_BOOL", false); !val {
		t.Errorf("expected true, got false")
	}
	t.Setenv("TEST_BOOL_NUM", "1")
	if val := Bool("TEST_BOOL_NUM", false); !val {
		t.Errorf("expected true, got false")
	}
	t.Setenv("BAD_BOOL", "invalid")
	if val := Bool("BAD_BOOL", false); val {
		t.Errorf("expected fallback on bad bool, got true")
	}
}

