# Functional Design Questions: Unit `frontend`

**Stage**: `functional-design` (3.1)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19  

---

### Q1: Interactive Topbar KPI Detail Presentation
When an executive clicks on a Topbar KPI summary card (e.g., Baseline, Control, Corrective, Change, or Complete), how should the expanded category details grid (`.kpi-detail`) be presented to display project-level volume contributions?

- A. Smooth expanding panel beneath the topbar displaying project-level volume contributions for the selected category (Recommended)
- B. Modal dialog popup displaying project-level volume contributions in a separate table
- C. Filter the main comparative matrix grid directly to show only documents matching the clicked category
- X. Other (please specify)

[Answer]: A. Smooth expanding panel beneath the topbar displaying project-level volume contributions for the selected category

---

### Q2: Search Toolbar Dynamic Filtering & URL Query Synchronization
When an executive or project engineer types in the search toolbar (`#searchInput`) to find projects by Project ID or Site Name:

- A. Client-side instant filtering with 200ms debounce synchronized to the URL query string (?search=...) via Nuqs (Recommended)
- B. Server-side query executed on every keystroke after 500ms debounce with pagination reload
- C. Pure client-side in-memory filtering without URL query synchronization
- X. Other (please specify)

[Answer]: A. Client-side instant filtering with 200ms debounce synchronized to the URL query string (?search=...) via Nuqs

---

### Q3: Delinquency Alert Display & Week-over-Week Trend Indicator
When a document category's pending delinquency ratio reaches $\ge 45\%$, how should the critical alert (`.chip-blink`) and week-over-week net change indicator be rendered?

- A. Subtle pulsing border and badge (animate-pulse) with tooltip showing the pending ratio and directional net-change tag (▼ green / ▲ red) (Recommended)
- B. High-contrast flashing badge with a toast alert notification on view load
- C. Static red badge without CSS pulsing animations
- X. Other (please specify)

[Answer]: A. Subtle pulsing border and badge (animate-pulse) with tooltip showing the pending ratio and directional net-change tag (▼ green / ▲ red)

---

### Q4: Multi-Project Historical Trend Visualization Canvas
How should multiple projects be visualized on the Historical Trend line chart canvas when selected from the project filter dropdown (`ตัวกรองโครงการ`)?

- A. Multi-line continuous bezier curves using a deterministic 8+16 categorical colorway, with a unified crosshair tooltip showing all selected projects side-by-side (Recommended)
- B. Step-line curves with discrete data points and individual project hover tooltips
- C. Stacked area chart displaying aggregate volume across selected projects
- X. Other (please specify)

[Answer]: A. Multi-line continuous bezier curves using a deterministic 8+16 categorical colorway, with a unified crosshair tooltip showing all selected projects side-by-side

---

## Consolidated Summary Confirmation

- **Q1 (KPI Detail Panel)**: Smooth expanding panel beneath the topbar displaying project-level contributions for the selected category.
- **Q2 (Search & URL Sync)**: Client-side instant filtering with 200ms debounce synchronized to the URL query string (`?search=...`) via Nuqs.
- **Q3 (Delinquency Alerts)**: Subtle pulsing border and badge (`animate-pulse`) with tooltip showing the pending ratio and directional net-change tag ($\blacktriangledown$ green / $\blacktriangle$ red).
- **Q4 (Historical Trend Overlay)**: Multi-line continuous bezier curves using a deterministic 8+16 categorical colorway, with a unified crosshair tooltip showing all selected projects side-by-side.

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

