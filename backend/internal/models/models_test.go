package models

import (
	"testing"
	"time"
)

func TestStandardDisciplines(t *testing.T) {
	if len(StandardDisciplines) < 6 {
		t.Errorf("expected at least 6 standard disciplines, got %d", len(StandardDisciplines))
	}

	expectedCodes := map[string]bool{
		"ME":   true,
		"CE":   true,
		"EE":   true,
		"INST": true,
		"PROC": true,
		"GEN":  true,
	}

	for _, d := range StandardDisciplines {
		if !expectedCodes[d.Code] {
			t.Errorf("unexpected discipline code: %s", d.Code)
		}
		if d.Name == "" {
			t.Errorf("discipline %s has empty name", d.Code)
		}
	}
}

func TestModelInstantiations(t *testing.T) {
	now := time.Now()
	prj := Project{
		Code: "PRJ-001",
		Name: "Test Project Alpha",
	}
	if prj.Code != "PRJ-001" {
		t.Errorf("expected code PRJ-001, got %s", prj.Code)
	}

	doc := Document{
		ProjectCode: prj.Code,
		DocNumber:   "001-ME-DWG-001",
		Title:       "Piping Layout",
		Discipline:  "ME",
		Status:      "Under Review",
		Revision:    "A",
		IssueDate:   now,
		TargetDate:  now.AddDate(0, 0, 14),
		IsOverdue:   false,
		OverdueDays: 0,
	}
	if doc.DocNumber != "001-ME-DWG-001" {
		t.Errorf("expected doc number 001-ME-DWG-001, got %s", doc.DocNumber)
	}

	snap := KPISnapshot{
		ProjectCode:          prj.Code,
		SnapshotDate:         now,
		TotalDocuments:       10,
		ApprovedDocuments:    6,
		UnderReviewDocuments: 4,
		OverdueDocuments:     1,
		ApprovalRate:         60.0,
	}
	if snap.ApprovalRate != 60.0 {
		t.Errorf("expected approval rate 60.0, got %f", snap.ApprovalRate)
	}

	overdueLog := OverdueLog{
		ProjectCode:  prj.Code,
		DocNumber:    doc.DocNumber,
		SnapshotDate: now,
		DaysOverdue:  15,
		AgingBracket: "0-30",
	}
	if overdueLog.AgingBracket != "0-30" {
		t.Errorf("expected aging bracket 0-30, got %s", overdueLog.AgingBracket)
	}
}

func TestResolveDiscipline(t *testing.T) {
	tests := []struct {
		docNumber string
		explicit  string
		want      string
	}{
		{"STSBPP-AB-E-100-001", "ABB", "EE"},
		{"STSBPP-UB-M-120-094", "", "ME"},
		{"CIVIL-CE-001", "CIVIL", "CE"},
		{"INST-LOOP-01", "", "INST"},
		{"PROC-FLOW-01", "", "PROC"},
		{"UNKNOWN-001", "ME", "ME"},
		{"UNKNOWN-002", "SOME_CE", "CE"},
		{"UNKNOWN-003", "", "GEN"},
	}

	for _, tt := range tests {
		got := ResolveDiscipline(tt.explicit, tt.docNumber)
		if got != tt.want {
			t.Errorf("ResolveDiscipline(%q, %q) = %q, want %q", tt.explicit, tt.docNumber, got, tt.want)
		}
	}
}


