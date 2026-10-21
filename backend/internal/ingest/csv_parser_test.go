package ingest

import (
	"bytes"
	"io"
	"os"
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
	t.Run("conzol status classification new criteria", func(t *testing.T) {
		csvContent := "doc_number,title,issuefor,laststatus,docstatus,ret,target_date,responsedate\n" +
			"DOC-IFI-01,Manual ABB,IFI,00:NO FLOW,A,,2026-03-01,\n" +
			"DOC-IFA-WAIT,P&ID For Approval,IFA,40:WAIT,A,,2026-03-25,\n" +
			"DOC-IFA-NOFLOW,Motor Spec,IFA,00:NO FLOW,A,,2026-03-20,\n" +
			"DOC-IFA-RETURN,Civil Layout,IFA,50:RETURN,A,A,2026-03-10,2026-03-12\n" +
			"DOC-CANCEL,Old Layout,IFA,60:INACTIVE,I,,,,\n"

		rows, parseErrors, err := StreamParseCSV(strings.NewReader(csvContent))
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}
		if len(parseErrors) != 0 {
			t.Fatalf("unexpected parse errors: %v", parseErrors)
		}
		if len(rows) != 5 {
			t.Fatalf("expected 5 rows, got %d", len(rows))
		}

		// Row 0: IFI with 00:NO FLOW -> Approved
		if rows[0].Status != "Approved" || rows[0].IssueFor != "IFI" {
			t.Errorf("expected DOC-IFI-01 to be Approved, got status=%q, issueFor=%q", rows[0].Status, rows[0].IssueFor)
		}

		// Row 1: IFA with 40:WAIT -> Under Review
		if rows[1].Status != "Under Review" || rows[1].IssueFor != "IFA" {
			t.Errorf("expected DOC-IFA-WAIT to be Under Review, got status=%q", rows[1].Status)
		}

		// Row 2: IFA with 00:NO FLOW -> Under Review
		if rows[2].Status != "Under Review" {
			t.Errorf("expected DOC-IFA-NOFLOW to be Under Review, got status=%q", rows[2].Status)
		}

		// Row 3: IFA with 50:RETURN -> Approved with ActualDate
		if rows[3].Status != "Approved" {
			t.Errorf("expected DOC-IFA-RETURN to be Approved, got status=%q", rows[3].Status)
		}
		if rows[3].ActualDate == nil {
			t.Errorf("expected DOC-IFA-RETURN to have ActualDate set from responsedate")
		}

		// Row 4: Cancelled
		if rows[4].Status != "Cancelled" {
			t.Errorf("expected DOC-CANCEL to be Cancelled, got status=%q", rows[4].Status)
		}
	})
}

func TestParseActualDataDirectoryFiles(t *testing.T) {
	files := []string{
		"../../../data/AUTOEMAIL_FILE_06_SKK-IM-CM-26002_2026-09-25 150903 (1) 1.csv",
		"../../../data/AUTOEMAIL_FILE_06_STS-CN-PP-26001_2026-09-25 151017 (1).csv",
		"../../../data/AUTOEMAIL_FILE_06_STS-EN-PP-26001_2026-09-25 151024.csv",
	}

	for _, fPath := range files {
		t.Run(fPath, func(t *testing.T) {
			data, err := os.ReadFile(fPath)
			if err != nil {
				// Fallback if copied with different name
				altPath := strings.Replace(fPath, ".csv", " - Copy.csv", 1)
				data, err = os.ReadFile(altPath)
				if err != nil {
					t.Skipf("File not accessible: %v", err)
				}
			}

			rows, parseErrs, err := StreamParseCSV(bytes.NewReader(data))
			t.Logf("File: %s -> err=%v, rows=%d, parseErrors=%d", fPath, err, len(rows), len(parseErrs))
			if err != nil {
				t.Errorf("Failed parsing: %v", err)
			}
			if len(parseErrs) > 0 {
				for i, pe := range parseErrs {
					if i < 10 {
						t.Logf("Parse error sample: line %d col %s: %s", pe.LineNumber, pe.Column, pe.Message)
					}
				}
			}
		})
	}
}

func TestSanitizeCSVStream_Streaming(t *testing.T) {
	rawInput := "\xef\xbb\xbfdoc_number,title,issue_date\n" +
		`DOC-01,"Malformed"",2026-03-10` + "\n" +
		`DOC-02,"Normal",2026-03-11` + "\n"

	sanitizedReader, err := SanitizeCSVStream(strings.NewReader(rawInput))
	if err != nil {
		t.Fatalf("SanitizeCSVStream failed: %v", err)
	}

	sanitizedBytes, err := io.ReadAll(sanitizedReader)
	if err != nil {
		t.Fatalf("failed reading sanitized stream: %v", err)
	}

	out := string(sanitizedBytes)
	if strings.HasPrefix(out, "\xef\xbb\xbf") {
		t.Errorf("BOM was not stripped")
	}
	if strings.Contains(out, `"",`) {
		t.Errorf("malformed trailing quote was not repaired: %s", out)
	}
	if !strings.Contains(out, `DOC-01,"Malformed",2026-03-10`) {
		t.Errorf("repaired line not found in output: %s", out)
	}
}



