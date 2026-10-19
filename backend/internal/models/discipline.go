package models

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

