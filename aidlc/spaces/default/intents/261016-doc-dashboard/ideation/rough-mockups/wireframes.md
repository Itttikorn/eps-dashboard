# Concept Wireframes & Layout Specification

## Context & Upstream Traceability
These concept wireframes establish the user experience and visual architecture for the corporate document management system dashboard, tracing from `intent-statement.md`, `scope-document.md`, `intent-backlog.md`, and the user-provided prototype ([Conzol-Doc-tracker](https://mojiqaqc.github.io/Conzol-Doc-tracker/)).

---

## Screen 1: Primary Comparison Matrix Dashboard

### Screen Layout (ASCII Wireframe)
```
+--------------------------------------------------------------------------------------------------------------------+
|  [ICON] EPS Document Management Dashboard                     [Last Ingestion: 2026-09-25 15:10]  [+ Upload CSV]    |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|  [ KPI SCORECARD ROW (Click to expand project distribution) ]                                                      |
|  +----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------+  |
|  | ① DRAWINGS    | | ② CONTROL (RFI)| | ③ CORRECTIVE   | | ④ CHANGES      | | ⑤ OVERDUE      | | Σ TOTAL DOCS   |  |
|  |   1,842        | |   325          | |   11 (2 NCR/9) | |   2 (1 DCR/1VO)| |   48           | |   2,475        |  |
|  +----------------+ +----------------+ +----------------+ +----------------+ +----------------+ +----------------+  |
|                                                                                                                    |
|  [VIEW TABS]:  [● Project Comparison Matrix]     [○ Weekly Trend Analytics]                                        |
|                                                                                                                    |
|  [TOOLBAR]                                                                                                         |
|  [ Search project, doc ID, title... ]   Sort: [ Highest Overdue ▼ ]                    Showing 3 of 3 Projects      |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|  +--------------------------------------------------------------------------------------------------------------+  |
|  | PROJECT / SITE CODE  | TOTAL | OVERDUE | DRAWINGS | ITP | RFI (Open/Tot) | NCR | CAR | DCR | VOR | NET TREND     |  |
|  +----------------------+-------+---------+----------+-----+----------------+-----+-----+-----+-----+---------------+  |
|  | STS-CN-PP-26001      | 480   | [ 14 ]! | 128 [v]  | 13  | 42 / 322   [v] |  2  |  9  |  1  |  1  | ▲ +4 Backlog  |  |
|  | +-- [EXPANDED DRAWER: STS-CN-PP-26001 Discipline Breakdown] ---------------------------------------------+ |  |
|  | | Mechanical (ME): 210 docs (8 overdue) | Civil (CE): 180 docs (4 overdue) | Electrical (EE): 90 docs  | |  |
|  | | Key Deliverables Present: [FS] [ML] [PR] [GA] [LD] [FD] [SLD] [IOL] [CBL]                              | |  |
|  | +---------------------------------------------------------------------------------------------------------+ |  |
|  | STS-EN-PP-26001      | 1,928 | [ 31 ]! | 1,890[v] | 11  | 0 / 0          |  0  |  0  |  0  |  0  | ▼ -2 Backlog  |  |
|  | SKK-IM-CM-26002      | 67    | [  3 ]  | 60   [v] | 0   | 1 / 3      [v] |  0  |  0  |  0  |  0  | — Stable      |  |
|  +----------------------+-------+---------+----------+-----+----------------+-----+-----+-----+-----+---------------+  |
|                                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
```

### Accessibility & Semantic Notes
- **Heading Level**: `<h1>` EPS Document Management Dashboard, `<h2>` Key Performance Indicators, `<h2>` Project Comparison Matrix.
- **Landmark Regions**: `<header>` for navigation and ingestion controls; `<main>` for KPI cards, toolbar, and matrix table.
- **Keyboard Navigation**: Focus order: `Upload CSV` → `Tab Toggle` → `Search input` → `Sort dropdown` → `Row expand buttons [v]`.
- **Alert Semantics**: Overdue cells with high counts use `aria-label="14 documents overdue, critical attention needed"`.

---

## Screen 2: Weekly Trend Analytics View

### Screen Layout (ASCII Wireframe)
```
+--------------------------------------------------------------------------------------------------------------------+
|  [ICON] EPS Document Management Dashboard                     [Last Ingestion: 2026-09-25 15:10]  [+ Upload CSV]    |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|  [VIEW TABS]:  [○ Project Comparison Matrix]     [● Weekly Trend Analytics]                                        |
|                                                                                                                    |
|  +--------------------------------------------------------------------------------------------------------------+  |
|  | MULTI-PROJECT VOLUME & OVERDUE PROGRESSION (Last 8 Snapshot Intervals)                                       |  |
|  |                                                                                                              |  |
|  |  Total Docs                                                                                                  |  |
|  |   2,500 |                                                *-------*-------* (STS-EN-PP-26001)                 |  |
|  |   2,000 |                              *-------*--------*                                                    |  |
|  |   1,500 |            *--------*-------*                                                                      |  |
|  |   1,000 |                                                                                                    |  |
|  |     500 |   *--------*--------*--------*-------*--------*-------*--------* (STS-CN-PP-26001)                 |  |
|  |       0 +----------------------------------------------------------------- (SKK-IM-CM-26002)                 |  |
|  |            W-7      W-6      W-5      W-4     W-3      W-2     W-1    Current                                |  |
|  |                                                                                                              |  |
|  |  Overdue Backlog Evolution:                                                                                  |  |
|  |    80 |                                                                                                      |  |
|  |    60 |                                                  *-------*-------* Total Overdue (48)                |  |
|  |    40 |            *--------*-------*--------*----------*                                                    |  |
|  |     0 +-----------------------------------------------------------------                                     |  |
|  |            W-7      W-6      W-5      W-4     W-3      W-2     W-1    Current                                |  |
|  +--------------------------------------------------------------------------------------------------------------+  |
|                                                                                                                    |
+--------------------------------------------------------------------------------------------------------------------+
```

### Accessibility & Semantic Notes
- **Heading Level**: `<h2>` Multi-Project Volume & Overdue Progression.
- **Landmarks & Graphics**: `<svg>` charts include descriptive `<title>` and `<desc>` elements for screen readers.
- **Tabular Fallback**: Accessible HTML `<table>` summarizing trend figures available beneath charts for assistive tech.

---

## Screen 3: Manual CSV Upload Modal

### Screen Layout (ASCII Wireframe)
```
+----------------------------------------------------------------------+
|  Upload Database Snapshot CSV                                    [X] |
+----------------------------------------------------------------------+
|                                                                      |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
|  |                                                                 | |
|  |      [CLOUD UPLOAD ICON]                                        | |
|  |      Drag & Drop daily snapshot CSV here, or Browse files       | |
|  |      Supports: .csv (Standard 24-column transmittal export)     | |
|  |                                                                 | |
|  + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - + |
|                                                                      |
|  Selected File: AUTOEMAIL_FILE_06_STS-CN-PP-26001_2026-09-25.csv    |
|  Size: 188.7 KB                                                      |
|                                                                      |
|  [Progress Bar: ================================== 100%]             |
|  ✓ Success: 480 document records parsed and synchronized.            |
|                                                                      |
|                                              [Cancel]  [Upload Now]  |
+----------------------------------------------------------------------+
```

### Accessibility & Semantic Notes
- **Dialog Semantics**: Modal marked with `role="dialog"`, `aria-labelledby="upload-title"`, `aria-modal="true"`.
- **Keyboard Trap & Focus**: Focus enters file browse button on open; `Escape` key closes dialog.
- **Status Announcements**: Upload progress and completion message announced via `aria-live="polite"`.

