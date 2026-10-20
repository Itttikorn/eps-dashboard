package ingest

import (
	"bufio"
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"
)

var (
	ErrEmptyCSV       = errors.New("CSV content is empty")
	ErrMissingHeaders = errors.New("CSV missing required headers")
)

// SanitizeFormulaDefensive neutralizes formula injection vulnerabilities (CSV Injection)
// by prepending a single quote if the field begins with =, +, -, @, \t, or \r.
func SanitizeFormulaDefensive(field string) string {
	if len(field) == 0 {
		return field
	}

	firstChar := field[0]
	if firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r' {
		return "'" + field
	}

	trimmed := strings.TrimSpace(field)
	if len(trimmed) > 0 {
		tChar := trimmed[0]
		if tChar == '=' || tChar == '+' || tChar == '-' || tChar == '@' {
			return "'" + field
		}
	}

	return field
}

// ParseDate attempts to parse date strings across common engineering formats.
func ParseDate(dateStr string) (time.Time, error) {
	trimmed := strings.TrimSpace(dateStr)
	if trimmed == "" {
		return time.Time{}, errors.New("empty date string")
	}

	formats := []string{
		"2006-01-02",
		"2006/01/02",
		"02/01/2006",
		"02-01-2006",
		"02/01/06",
		"02-01-06",
		"02-Jan-2006",
		"02-Jan-06",
		"2006-01-02 15:04:05",
		"2006/01/02 15:04:05",
		"2006-01-02T15:04:05Z07:00",
		time.RFC3339,
	}

	for _, layout := range formats {
		if t, err := time.Parse(layout, trimmed); err == nil {
			return t.UTC(), nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date %q (supported formats: YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, DD/MM/YY)", trimmed)
}

// ParseDisciplineFromDocNumber extracts standard discipline codes from document numbers/IDs.
func ParseDisciplineFromDocNumber(docNumber string) string {
	normalized := strings.ReplaceAll(docNumber, "_", "-")
	parts := strings.Split(normalized, "-")

	// Phase 1: Multi-letter discipline tokens (e.g. ME, CE, EE, ME06, EE15, EXC16, PP, MS, INST)
	for _, p := range parts {
		token := strings.ToUpper(strings.TrimSpace(p))
		if token == "ME" || token == "PP" || (strings.HasPrefix(token, "ME") && len(token) <= 4) {
			return "ME"
		}
		if token == "CE" || token == "MS" || (strings.HasPrefix(token, "CE") && len(token) <= 4) ||
			(strings.HasPrefix(token, "EXC") && len(token) <= 5) || (strings.HasPrefix(token, "EX") && len(token) <= 4 && token != "EXP") {
			return "CE"
		}
		if token == "EE" || (strings.HasPrefix(token, "EE") && len(token) <= 4) {
			return "EE"
		}
		if token == "INST" {
			return "INST"
		}
		if token == "PROC" {
			return "PROC"
		}
		if token == "GEN" {
			return "GEN"
		}
	}

	// Phase 2: Single-letter discipline segment (e.g. STSBPP-AB-E-100-001, STSBPP-UB-M-120-094)
	for _, p := range parts {
		token := strings.ToUpper(strings.TrimSpace(p))
		if token == "M" {
			return "ME"
		}
		if token == "E" || token == "I" {
			return "EE"
		}
		if token == "C" || token == "S" || token == "AR" {
			return "CE"
		}
	}

	return ""
}

// ExtractDiscipline extracts or normalizes the discipline code.
// It prioritizes parsing engineering discipline tokens directly from the document ID / number,
// as the explicit CSV DISCIPLINE column often contains contractor/company codes (e.g. ABB, VK, SN).
func ExtractDiscipline(explicitDiscipline, docNumber string) string {
	disc := strings.ToUpper(strings.TrimSpace(explicitDiscipline))

	// 1. Prioritize parsing discipline directly from docNumber
	if inferred := ParseDisciplineFromDocNumber(docNumber); inferred != "" {
		return inferred
	}

	// 2. Check explicit discipline if it's standard or known suffix
	switch disc {
	case "ME", "CE", "EE", "INST", "PROC", "GEN":
		return disc
	}
	if strings.HasSuffix(disc, "ME") {
		return "ME"
	}
	if strings.HasSuffix(disc, "CE") {
		return "CE"
	}
	if strings.HasSuffix(disc, "EE") {
		return "EE"
	}

	if disc != "" {
		return disc
	}

	return "GEN"
}

// StripBOM removes the UTF-8 Byte Order Mark (\xef\xbb\xbf) if present at reader start.
func StripBOM(r io.Reader) (io.Reader, error) {
	br := bufio.NewReader(r)
	bom, err := br.Peek(3)
	if err == nil && bytes.Equal(bom, []byte{0xef, 0xbb, 0xbf}) {
		_, _ = br.Discard(3)
	}
	return br, nil
}

var trailingDoubleQuoteRegex = regexp.MustCompile(`([^,])""\s*,`)

// SanitizeCSVStream strips UTF-8 BOM if present and repairs common Conzol export anomalies,
// such as unescaped trailing double-quotes before commas.
func SanitizeCSVStream(r io.Reader) (io.Reader, error) {
	cleanReader, err := StripBOM(r)
	if err != nil {
		return nil, err
	}

	content, err := io.ReadAll(cleanReader)
	if err != nil {
		return nil, err
	}

	if bytes.Contains(content, []byte(`"",`)) || bytes.Contains(content, []byte(`"" ,`)) {
		sanitized := trailingDoubleQuoteRegex.ReplaceAll(content, []byte(`${1}",`))
		return bytes.NewReader(sanitized), nil
	}

	return bytes.NewReader(content), nil
}

// StreamParseCSV reads CSV records sequentially from the reader, sanitizes values,
// and returns parsed rows along with non-fatal parse errors.
func StreamParseCSV(r io.Reader) ([]ParsedRow, []ParseError, error) {
	cleanReader, err := SanitizeCSVStream(r)
	if err != nil {
		return nil, nil, err
	}

	csvReader := csv.NewReader(cleanReader)
	csvReader.TrimLeadingSpace = true
	csvReader.FieldsPerRecord = -1
	csvReader.LazyQuotes = true

	headers, err := csvReader.Read()
	if err != nil {
		if errors.Is(err, io.EOF) {
			return nil, nil, ErrEmptyCSV
		}
		return nil, nil, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	headerMap := make(map[string]int)
	for i, h := range headers {
		key := strings.ToLower(strings.TrimSpace(h))
		key = strings.ReplaceAll(key, "_", "")
		key = strings.ReplaceAll(key, " ", "")
		headerMap[key] = i
	}

	findCol := func(aliases ...string) int {
		for _, a := range aliases {
			key := strings.ToLower(strings.TrimSpace(a))
			key = strings.ReplaceAll(key, "_", "")
			key = strings.ReplaceAll(key, " ", "")
			if idx, ok := headerMap[key]; ok {
				return idx
			}
		}
		return -1
	}

	prjIdx := findCol("projectcode", "project", "project_code", "projectid", "project_id")
	docNumIdx := findCol("docnumber", "documentnumber", "docno", "document_no", "document_number", "docid", "doc_id", "documentid", "document_id")
	titleIdx := findCol("title", "documenttitle", "doc_title")
	discIdx := findCol("discipline", "disc")
	discNameIdx := findCol("disciplinename", "discipline_name")
	statusIdx := findCol("status", "workflow_status")
	docStatusIdx := findCol("docstatus", "doc_status")
	lastStatusIdx := findCol("laststatus", "last_status")
	retIdx := findCol("ret", "ret_code", "retcode")
	revIdx := findCol("revision", "rev", "revid", "rev_id", "revisionid", "revision_id")
	issueForIdx := findCol("issuefor", "issue_for")
	issueDateIdx := findCol("issuedate", "issue_date", "date_issued")
	transmitalDateIdx := findCol("transmitaldate", "transmittaldate", "transmital_date", "transmittal_date")
	revDateIdx := findCol("revdate", "rev_date")
	targetDateIdx := findCol("targetdate", "target_date", "duedate", "due_date")
	planDateIdx := findCol("plandate", "plan_date")
	actualDateIdx := findCol("actualdate", "actual_date", "completion_date")
	returnDateIdx := findCol("returndate", "return_date")
	responseDateIdx := findCol("responsedate", "response_date")

	if docNumIdx == -1 || titleIdx == -1 {
		return nil, nil, fmt.Errorf("%w: missing required doc_number or title column", ErrMissingHeaders)
	}

	var rows []ParsedRow
	var parseErrors []ParseError
	line := 1

	for {
		record, err := csvReader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		line++
		if err != nil {
			parseErrors = append(parseErrors, ParseError{
				LineNumber: line,
				Message:    fmt.Sprintf("malformed CSV row: %v", err),
			})
			continue
		}

		allEmpty := true
		for _, col := range record {
			if strings.TrimSpace(col) != "" {
				allEmpty = false
				break
			}
		}
		if allEmpty {
			continue
		}

		getCol := func(idx int) string {
			if idx >= 0 && idx < len(record) {
				return strings.TrimSpace(record[idx])
			}
			return ""
		}

		docNum := SanitizeFormulaDefensive(getCol(docNumIdx))
		if docNum == "" {
			parseErrors = append(parseErrors, ParseError{
				LineNumber: line,
				Column:     "doc_number",
				Message:    "document number is required",
			})
			continue
		}

		title := SanitizeFormulaDefensive(getCol(titleIdx))
		prjCode := getCol(prjIdx)
		if prjCode == "" {
			prjCode = "DEFAULT"
		}
		prjCode = SanitizeFormulaDefensive(prjCode)

		rawDisc := getCol(discIdx)
		if rawDisc == "" {
			rawDisc = getCol(discNameIdx)
		}
		disc := ExtractDiscipline(rawDisc, docNum)

		// Determine status according to Conzol rules & generic columns
		rawStatus := getCol(statusIdx)
		lastStatus := getCol(lastStatusIdx)
		retCode := strings.ToUpper(getCol(retIdx))
		docStatus := strings.ToUpper(getCol(docStatusIdx))
		rawReturnDate := getCol(returnDateIdx)
		rawResponseDate := getCol(responseDateIdx)
		rawIssueFor := strings.ToUpper(getCol(issueForIdx))

		upperLast := strings.ToUpper(lastStatus)
		status := "Under Review"
		if rawStatus != "" {
			status = rawStatus
		} else if strings.Contains(upperLast, "CANCEL") || strings.Contains(upperLast, "INACTIVE") {
			status = "Cancelled"
		} else if rawIssueFor == "IFI" {
			// IFI (Issue For Information) deliverables require no approval cycle and are completed deliveries
			status = "Approved"
		} else if strings.Contains(upperLast, "50:RETURN") ||
			retCode == "A" || retCode == "AC" || retCode == "RC" || retCode == "ACK" ||
			rawReturnDate != "" || rawResponseDate != "" ||
			docStatus == "C" || (docStatus == "A" && retCode != "") {
			status = "Approved"
		} else if strings.Contains(upperLast, "40:WAIT") || (rawIssueFor != "IFI" && strings.Contains(upperLast, "00:NO FLOW")) {
			status = "Under Review"
		}

		rev := getCol(revIdx)
		if rev == "" {
			rev = "0"
		}

		rawIssueDate := getCol(issueDateIdx)
		if rawIssueDate == "" {
			rawIssueDate = getCol(transmitalDateIdx)
		}
		if rawIssueDate == "" {
			rawIssueDate = getCol(revDateIdx)
		}

		issueDate := time.Now().UTC()
		if rawIssueDate != "" {
			parsedDate, err := ParseDate(rawIssueDate)
			if err != nil {
				// Fallback to revDate if transmitalDate was shifted or non-standard
				if alt := getCol(revDateIdx); alt != "" && alt != rawIssueDate {
					if altDate, altErr := ParseDate(alt); altErr == nil {
						parsedDate = altDate
						err = nil
					}
				}
			}
			if err != nil {
				parseErrors = append(parseErrors, ParseError{
					LineNumber: line,
					Column:     "issue_date",
					Message:    err.Error(),
				})
			} else {
				issueDate = parsedDate
			}
		}

		var targetDate time.Time
		rawTargetDate := getCol(targetDateIdx)
		if rawTargetDate == "" {
			rawTargetDate = getCol(planDateIdx)
		}
		if rawTargetDate != "" {
			parsedDate, err := ParseDate(rawTargetDate)
			if err != nil {
				if alt := getCol(planDateIdx); alt != "" && alt != rawTargetDate {
					if altDate, altErr := ParseDate(alt); altErr == nil {
						parsedDate = altDate
						err = nil
					}
				}
			}
			if err != nil {
				parseErrors = append(parseErrors, ParseError{
					LineNumber: line,
					Column:     "target_date",
					Message:    err.Error(),
				})
			} else {
				targetDate = parsedDate
			}
		}

		var actualDate *time.Time
		rawActualDate := getCol(actualDateIdx)
		if rawActualDate == "" {
			rawActualDate = getCol(responseDateIdx)
		}
		if rawActualDate == "" {
			rawActualDate = getCol(returnDateIdx)
		}
		if rawActualDate != "" {
			if parsedDate, err := ParseDate(rawActualDate); err == nil {
				actualDate = &parsedDate
			}
		}

		rows = append(rows, ParsedRow{
			LineNumber:  line,
			ProjectCode: prjCode,
			DocNumber:   docNum,
			Title:       title,
			Discipline:  disc,
			Status:      status,
			Revision:    rev,
			IssueFor:    rawIssueFor,
			DocStatus:   docStatus,
			LastStatus:  lastStatus,
			IssueDate:   issueDate,
			TargetDate:  targetDate,
			ActualDate:  actualDate,
		})
	}

	return rows, parseErrors, nil
}
