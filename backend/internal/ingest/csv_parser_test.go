package ingest

import (
	"bytes"
	"strings"
	"testing"
	"time"
)

func TestSanitizeFormulaDefensive(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"empty string", "", ""},
		{"normal text", "Standard Document Title", "Standard Document Title"},
		{"equals formula", "=SUM(A1:B10)", "'=SUM(A1:B10)"},
		{"plus formula", "+12345", "'+12345"},
		{"minus formula", "-500", "'-500"},
		{"at sign formula", "@SUM(A1)", "'@SUM(A1)"},
		{"tab prefix", "\tmalicious", "'\tmalicious"},
		{"carriage return prefix", "\rmalicious", "'\rmalicious"},
		{"leading space with formula", "   =CMD()", "'   =CMD()"},
		{"leading space normal", "   Normal Text", "   Normal Text"},
		{"cmd injection payload", "=cmd|' /C calc'!A0", "'=cmd|' /C calc'!A0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SanitizeFormulaDefensive(tt.input)
			if got != tt.expected {
				t.Errorf("SanitizeFormulaDefensive(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestParseDate(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    time.Time
		wantErr bool
	}{
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
		{
			name:    "YYYY-MM-DD",
			input:   "2026-03-15",
			want:    time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "DD/MM/YYYY",
			input:   "15/03/2026",
			want:    time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "YYYY/MM/DD",
			input:   "2026/03/15",
			want:    time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "DD-MM-YYYY",
			input:   "15-03-2026",
			want:    time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "DD-Mon-YYYY",
			input:   "15-Mar-2026",
			want:    time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "RFC3339",
			input:   "2026-03-15T10:00:00Z",
			want:    time.Date(2026, 3, 15, 10, 0, 0, 0, time.UTC),
			wantErr: false,
		},
		{
			name:    "invalid format",
			input:   "not-a-date",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseDate(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseDate(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
			if !tt.wantErr && !got.Equal(tt.want) {
				t.Errorf("ParseDate(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestExtractDiscipline(t *testing.T) {
	tests := []struct {
		name      string
		explicit  string
		docNumber string
		want      string
	}{
		{"explicit ME", "ME", "DWG-001", "ME"},
		{"explicit lowercase ce", "ce", "DWG-002", "CE"},
		{"explicit with whitespace", "  EE  ", "DWG-003", "EE"},
		{"inferred from docNumber ME", "", "PRJ-ME-001", "ME"},
		{"inferred from docNumber CE", "", "EPS-CE-DWG-001", "CE"},
		{"inferred from docNumber EE", "", "100-EE-99", "EE"},
		{"inferred from docNumber INST", "", "ABC-INST-101", "INST"},
		{"inferred from docNumber PROC", "", "P-PROC-001", "PROC"},
		{"inferred from docNumber GEN", "", "P-GEN-001", "GEN"},
		{"fallback to GEN", "", "UNKNOWN-1234", "GEN"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExtractDiscipline(tt.explicit, tt.docNumber)
			if got != tt.want {
				t.Errorf("ExtractDiscipline(%q, %q) = %q, want %q", tt.explicit, tt.docNumber, got, tt.want)
			}
		})
	}
}

func TestStripBOM(t *testing.T) {
	t.Run("with UTF-8 BOM", func(t *testing.T) {
		bomData := append([]byte{0xef, 0xbb, 0xbf}, []byte("hello,world")...)
		r, err := StripBOM(bytes.NewReader(bomData))
		if err != nil {
			t.Fatalf("StripBOM failed: %v", err)
		}
		buf := new(bytes.Buffer)
		_, _ = buf.ReadFrom(r)
		if buf.String() != "hello,world" {
			t.Errorf("StripBOM output = %q, want %q", buf.String(), "hello,world")
		}
	})

	t.Run("without BOM", func(t *testing.T) {
		data := []byte("hello,world")
		r, err := StripBOM(bytes.NewReader(data))
		if err != nil {
			t.Fatalf("StripBOM failed: %v", err)
		}
		buf := new(bytes.Buffer)
		_, _ = buf.ReadFrom(r)
		if buf.String() != "hello,world" {
			t.Errorf("StripBOM output = %q, want %q", buf.String(), "hello,world")
		}
	})
}

func TestStreamParseCSV(t *testing.T) {
	t.Run("empty CSV", func(t *testing.T) {
		_, _, err := StreamParseCSV(strings.NewReader(""))
		if err == nil || err != ErrEmptyCSV {
			t.Fatalf("expected ErrEmptyCSV, got %v", err)
		}
	})

	t.Run("missing required headers", func(t *testing.T) {
		csvContent := "ColA,ColB,ColC\n1,2,3\n"
		_, _, err := StreamParseCSV(strings.NewReader(csvContent))
		if err == nil || !strings.Contains(err.Error(), "missing required") {
			t.Fatalf("expected missing required headers error, got %v", err)
		}
	})

	t.Run("valid CSV with UTF-8 BOM", func(t *testing.T) {
		csvContent := "\xef\xbb\xbfproject_code,doc_number,title,discipline,status,revision,issue_date,target_date,actual_date\n" +
			"PRJ-01,DOC-001,Piping Layout,ME,Approved,A,2026-03-01,2026-03-15,2026-03-14\n" +
			"PRJ-01,DOC-002,=SUM(1+1),EE,Under Review,0,2026-03-02,2026-03-16,\n" +
			"\n" + // empty line to be skipped
			"PRJ-01,,Empty Doc Number,CE,Approved,1,2026-03-01,2026-03-15,\n" // missing doc number -> parse error

		rows, parseErrors, err := StreamParseCSV(strings.NewReader(csvContent))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if len(rows) != 2 {
			t.Fatalf("expected 2 valid rows, got %d", len(rows))
		}

		if rows[0].DocNumber != "DOC-001" || rows[0].Discipline != "ME" || rows[0].Status != "Approved" {
			t.Errorf("row[0] mismatch: %+v", rows[0])
		}

		// Formula sanitized
		if rows[1].Title != "'=SUM(1+1)" {
			t.Errorf("row[1].Title not sanitized: %q", rows[1].Title)
		}

		if len(parseErrors) != 1 {
			t.Fatalf("expected 1 parse error, got %d", len(parseErrors))
		}
		if parseErrors[0].Column != "doc_number" {
			t.Errorf("expected error in doc_number column, got %q", parseErrors[0].Column)
		}
	})

	t.Run("date parse error", func(t *testing.T) {
		csvContent := "doc_number,title,issue_date\n" +
			"DOC-003,Bad Date Doc,not-a-date\n"

		rows, parseErrors, err := StreamParseCSV(strings.NewReader(csvContent))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if len(rows) != 1 {
			t.Fatalf("expected 1 row, got %d", len(rows))
		}
		if len(parseErrors) != 1 {
			t.Fatalf("expected 1 parse error for invalid date, got %d", len(parseErrors))
		}
		if parseErrors[0].Column != "issue_date" {
			t.Errorf("expected error column 'issue_date', got %q", parseErrors[0].Column)
		}
	})
}

