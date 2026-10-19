// Package config reads tunables from the process environment.
//
// Every knob has a production-safe default, so an environment that sets nothing
// still boots. Values are read once at startup.
package config

import (
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

// String reads a string env var, falling back to def when unset.
func String(key, def string) string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	return raw
}

// Strings reads a comma-separated list of strings.
func Strings(key string, def []string) []string {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	parts := strings.Split(raw, ",")
	res := make([]string, 0, len(parts))
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			res = append(res, trimmed)
		}
	}
	if len(res) == 0 {
		return def
	}
	return res
}

// Int reads an integer env var, falling back to def when unset or unparseable.
func Int(key string, def int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		slog.Warn("invalid integer environment variable, using default", "key", key, "value", raw, "default", def)
		return def
	}
	return v
}

// Int64 is Int for 64-bit values (e.g. GOMEMLIMIT in bytes or MAX_UPLOAD_SIZE).
func Int64(key string, def int64) int64 {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	v, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		slog.Warn("invalid integer environment variable, using default", "key", key, "value", raw, "default", def)
		return def
	}
	return v
}

// Duration reads a Go duration string ("30s", "5m") or a bare number of seconds.
func Duration(key string, def time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	if d, err := time.ParseDuration(raw); err == nil {
		return d
	}
	if secs, err := strconv.Atoi(raw); err == nil {
		return time.Duration(secs) * time.Second
	}
	slog.Warn("invalid duration environment variable, using default", "key", key, "value", raw, "default", def)
	return def
}

// Bool accepts the usual strconv spellings ("1", "true", "TRUE", "yes"/"no").
func Bool(key string, def bool) bool {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return def
	}
	v, err := strconv.ParseBool(raw)
	if err != nil {
		slog.Warn("invalid boolean environment variable, using default", "key", key, "value", raw, "default", def)
		return def
	}
	return v
}

