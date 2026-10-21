package models

import "strings"

// Discipline represents an engineering discipline classification.
type Discipline struct {
	Code string `gorm:"size:16;primaryKey" json:"code"`
	Name string `gorm:"size:128;not null" json:"name"`
}

// StandardDisciplines reference list
var StandardDisciplines = []Discipline{
	{Code: "ME", Name: "Mechanical Engineering"},
	{Code: "CE", Name: "Civil & Structural Engineering"},
	{Code: "EE", Name: "Electrical Engineering"},
	{Code: "INST", Name: "Instrumentation & Control"},
	{Code: "PROC", Name: "Process Engineering"},
	{Code: "GEN", Name: "General / Cross-Discipline"},
}

// ParseDisciplineFromDocNumber extracts engineering discipline tokens directly from a document ID.
func ParseDisciplineFromDocNumber(docNumber string) string {
	normalized := strings.ReplaceAll(docNumber, "_", "-")
	parts := strings.Split(normalized, "-")

	// Phase 1: Multi-letter discipline tokens
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

	// Phase 2: Single-letter discipline segment
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

// ResolveDiscipline extracts or normalizes the discipline code.
// It prioritizes parsing engineering discipline tokens directly from the document ID,
// falling back to standard or known suffixes of explicitDiscipline, and finally defaults to "GEN".
func ResolveDiscipline(explicitDiscipline, docNumber string) string {
	if inferred := ParseDisciplineFromDocNumber(docNumber); inferred != "" {
		return inferred
	}

	disc := strings.ToUpper(strings.TrimSpace(explicitDiscipline))
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


