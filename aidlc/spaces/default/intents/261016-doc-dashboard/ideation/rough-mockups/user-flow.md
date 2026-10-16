# User Flow & Interaction Specification

## Context & Upstream Traceability
This user flow details the paths, interaction states, and error handling for executive decision-makers and administrators, derived from `intent-statement.md`, `scope-document.md`, `intent-backlog.md`, and `wireframes.md`.

---

## 1. Executive Happy Path (Daily Monitoring & Overdue Drilldown)

```mermaid
flowchart TD
    Start([User opens Web Dashboard]) --> LoadData[Fetch Latest Ingestion Metrics & Summary]
    LoadData --> RenderMatrix[Render Top KPI Cards & Project Comparison Matrix]
    RenderMatrix --> CheckOverdue{Any Project Overdue High?}
    
    CheckOverdue -- Yes --> InspectRow[Locate Row with High Overdue Count / Red Chip]
    InspectRow --> ExpandRow[Click Chevron to Expand Discipline Drawer]
    ExpandRow --> ViewDiscipline[Review Overdue by Discipline: ME / CE / EE]
    ViewDiscipline --> ViewDocTypes[Inspect Specific DOCTYPE Deliverables: FS, GA, RFI, NCR]
    
    CheckOverdue -- No --> SwitchTrend[Click 'Weekly Trend Analytics' Tab]
    ViewDocTypes --> SwitchTrend
    SwitchTrend --> AnalyzeTrend[Examine 8-Week Progression & Backlog Velocity]
    AnalyzeTrend --> Complete([Executive Decision / Review Done])
```

---

## 2. Ingestion Path (Manual Snapshot Upload)

```mermaid
flowchart TD
    UserClick[User clicks '+ Upload CSV' in Header] --> OpenModal[Display Manual Upload Modal]
    OpenModal --> SelectFile[User drags & drops or selects .csv file]
    SelectFile --> ClientValidate{Is CSV valid format?}
    
    ClientValidate -- No --> ShowClientError[Display Error: 'Please select a valid .csv file']
    ShowClientError --> SelectFile
    
    ClientValidate -- Yes --> SubmitPost[POST multipart/form-data to /api/v1/ingest]
    SubmitPost --> ServerParse{Go Streaming Parser Validates Schema}
    
    ServerParse -- Error --> ShowServerError[Display Ingestion Error & Row Number in Modal]
    ServerParse -- Success --> ShowSuccess[Show Success Badge with Row Count Processed]
    ShowSuccess --> AutoRefresh[Modal Closes & Dashboard Metrics Instantly Refresh]
```

---

## 3. Search & Sort State Transitions

```mermaid
flowchart LR
    DefaultState[Default: Highest Overdue First] --> SearchInput[User types in Search Bar]
    SearchInput --> LiveFilter[Filter rows by Project Name or Site Code immediately]
    LiveFilter --> SortChange[User selects Sort: Total Documents / Project Name]
    SortChange --> SortedView[Matrix updates order without page reload]
```

