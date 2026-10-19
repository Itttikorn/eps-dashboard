package ingest

import (
	"bufio"
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
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
		"02/01/2006",
		"2006/01/02",
		"02-01-2006",
		"02-Jan-2006",
		"2006-01-02T15:04:05Z07:00",
		time.RFC3339,
	}

	for _, layout := range formats {
		if t, err := time.Parse(layout, trimmed); err == nil {
			return t.UTC(), nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date %q (supported formats: YYYY-MM-DD, DD/MM/YYYY, DD-Mon-YYYY)", trimmed)
}

// ExtractDiscipline extracts or normalizes the discipline code.
func ExtractDiscipline(explicitDiscipline, docNumber string) string {
	disc := strings.ToUpper(strings.TrimSpace(explicitDiscipline))
	if disc != "" {
		return disc
	}

	parts := strings.Split(docNumber, "-")
	for _, part := range parts {
		normalized := strings.ToUpper(strings.TrimSpace(part))
		switch normalized {
		case "ME", "CE", "EE", "INST", "PROC", "GEN":
			return normalized
		}
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

// StreamParseCSV reads CSV records sequentially from the reader, sanitizes values,
// and returns parsed rows along with non-fatal parse errors.
func StreamParseCSV(r io.Reader) ([]ParsedRow, []ParseError, error) {
	cleanReader, err := StripBOM(r)
	if err != nil {
		return nil, nil, err
	}

	csvReader := csv.NewReader(cleanReader)
	csvReader.TrimLeadingSpace = true
	csvReader.FieldsPerRecord = -1

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

	prjIdx := findCol("projectcode", "project", "project_code", "projectid")
	docNumIdx := findCol("docnumber", "documentnumber", "docno", "document_no", "document_number")
	titleIdx := findCol("title", "documenttitle", "doc_title")
	discIdx := findCol("discipline", "disc")
	statusIdx := findCol("status", "docstatus", "workflow_status")
	revIdx := findCol("revision", "rev")
	issueDateIdx := findCol("issuedate", "issue_date", "date_issued")
	targetDateIdx := findCol("targetdate", "target_date", "due_date")
	actualDateIdx := findCol("actualdate", "actual_date", "completion_date")

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
		disc := ExtractDiscipline(rawDisc, docNum)

		status := getCol(statusIdx)
		if status == "" {
			status = "Under Review"
		}

		rev := getCol(revIdx)
		if rev == "" {
			rev = "0"
		}

		rawIssueDate := getCol(issueDateIdx)
		issueDate := time.Now().UTC()
		if rawIssueDate != "" {
			parsedDate, err := ParseDate(rawIssueDate)
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

		rawTargetDate := getCol(targetDateIdx)
		targetDate := issueDate.AddDate(0, 0, 14)
		if rawTargetDate != "" {
			parsedDate, err := ParseDate(rawTargetDate)
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
			IssueDate:   issueDate,
			TargetDate:  targetDate,
			ActualDate:  actualDate,
		})
	}

	return rows, parseErrors, nil
}

