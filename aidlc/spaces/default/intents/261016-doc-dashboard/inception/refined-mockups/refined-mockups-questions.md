# Refined Mockups Questions & Design Decisions

## How would you like to answer the questions?
A. Guide me (ask questions one by one with recommended defaults)
B. I'll edit the file directly
C. Chat (discuss design and interaction nuances conversationally)
X. Other (please specify)

[Answer]: A

## Q1. What primary layout and navigation model should be used for the dashboard?
A. Single-page application with top navigation tabs: [Comparative Overview] [Discipline Drill-Down] [Trend Analytics] [CSV Upload], preserving active project selection and date filters across tab switches without full page reloads
B. Multi-page layout with traditional browser navigation and URL routing (/projects, /disciplines, /trends, /upload)
C. Dashboard widget grid with all components on a single scrollable page
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. How should the multi-project trend line chart present comparative data?
A. Multi-line time series chart with fixed 8-color project palette (Project A-H assigned static distinct colors that never change regardless of rank), interactive checkboxes for toggling projects, and a synchronized vertical crosshair tooltip showing all selected projects at that date
B. Small-multiples sparklines (individual isolated mini-charts for each project stacked vertically)
C. Stacked area chart showing aggregate volume with project breakdown
D. Not yet defined
X. Other (please specify)

[Answer]: A (With extended 16-color categorical palette + stroke-dash fallback for >8 projects, ensuring deterministic project-to-color mapping)

## Q3. What visual indicator and interaction pattern should be used for delinquent/overdue documents?
A. Three-tier color badges (Green <5% pending, Amber 5-15% pending, Red >15% pending) on project cards, with red tag/chip countdown on document rows showing days overdue (e.g., "Overdue: 14 days") and one-click quick-filter toggle "Show Overdue Only"
B. Simple overdue count number without color thresholds or quick filter
C. Modal alert popup displaying delinquent documents upon project selection
D. Not yet defined
X. Other (please specify)

[Answer]: A (Three-tier color badges: Green <5%, Amber 5-15%, Red >15%, overdue aging counters, and 'Show Overdue Only' toolbar toggle)

## Consolidated Summary Confirmation

- Dashboard Navigation: Single-page application with top navigation tabs ([Comparative Overview], [Trend Analytics], [CSV Ingestion]). Discipline & Document-Type Drill-Down Accordion is removed from scope per user instruction.
- Trend Analytics Visualization: Synchronized multi-line chart with persistent 8-color categorical palette, extended 16-color palette + stroke-dash pattern fallback for >8 projects, interactive project chips, and crosshair tooltip showing all active projects.
- Delinquency & Overdue Indicators: Three-tier color badges (Green <5%, Amber 5-15%, Red >15% pending), overdue aging counters, and "Show Overdue Only" quick-filter toggle.
- Design System Mapping: 5 QA/QC category pillars (Baseline #2f6fce, Control #12a4a0, Corrective #ee8a1f, Change #26a65b, Complete #8b5cf6), English UI with IBM Plex Sans Thai font stack, WCAG 2.1 AA accessible contrast.
- Out-of-Scope Boundaries: Strict adherence to exclusions (no physical construction S-curves, no drawing plan vs actual quotas, no punchlists, no in-browser CAD/PDF viewing, no inline metadata editing, no RBAC/auth, no discipline drill-down accordion).

Does this all look correct before I generate the refined mockups artifacts?
- Looks correct
- Request changes

[Answer]: Looks correct
