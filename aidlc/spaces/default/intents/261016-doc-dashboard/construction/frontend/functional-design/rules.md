# Business Rules Specification: Unit `frontend`

**Stage**: `functional-design` (3.1)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-architect-agent`  
**Support Agent**: `aidlc-developer-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Provenance

This business rules specification formally defines the client-side presentation rules, interaction constraints, dynamic filtering logic, and state transitions for the React 18 TypeScript dashboard application, tracing from:
- `unit-of-work.md`: Unit boundaries, technology stack, and responsibilities for `frontend` (`U2`).
- `unit-of-work-story-map.md`: Traceability to user stories `US2.1`, `US2.2`, `US2.3`, `US4.1`, `US4.2`, and `US1.1` (UI upload).
- `requirements.md`: Upstream requirements `FR2.1`–`FR2.3`, `FR3.1`–`FR3.4`, `FR4.1`, `FR4.3`, `FR5.1`–`FR5.5`, and `NFR1`–`NFR5`.
- `components.md`: Domain logic ownership across `DashboardUIClient`.
- `contract-summary.md`: OpenAPI 3.0 response structures (`GlobalSummaryResponse`, `ProjectMatrixListResponse`, `HistoricalTrendsResponse`, `IngestionResponse`).

---

## 2. Machine-Readable Business Rules Specification

```yaml
rules:
  - id: BR7.1
    statement: Global Topbar must render aggregate document counts and 5 QA/QC category pills in under 50ms upon data receipt.
    category: calculation
    applies_to: TopbarKpiCards
    trigger: Successful fetch of /api/v1/projects/summary.
    logic: >
      IF the summary response payload is received from /api/v1/projects/summary,
      THEN render total document count alongside category badges (Baseline Drawings, Control, Corrective, Change, and Complete)
      formatted with IBM Plex Sans Thai and tabular numbers;
      ELSE display the shimmer skeleton state until data is resolved.
    violation_behaviour: Prevent layout shift by displaying skeleton cards matching exact dimensions.
    source: FR2.1, FR2.3, NFR1.1

  - id: BR7.2
    statement: All Topbar KPI counts must reflect active document revisions only, excluding superseded revisions.
    category: validation
    applies_to: TopbarKpiCards
    trigger: Rendering of aggregate document counts and category totals.
    logic: >
      IF rendering KPI metric totals,
      THEN bind directly to backend summary aggregates that compute against latest active revisions only;
      ELSE flag any discrepancy with backend contract.
    violation_behaviour: Reject any local client-side historical summation that duplicates revision counts.
    source: FR2.1, FR1.5

  - id: BR7.3
    statement: Clicking an interactive Topbar KPI card must toggle an expanded category details grid beneath the topbar.
    category: policy
    applies_to: TopbarKpiCards, CategoryDetailGrid
    trigger: User clicks on an active category KPI card.
    logic: >
      IF user clicks an active category KPI card,
      THEN smoothly expand the .kpi-detail collapse container displaying project-level volume contributions for that selected category;
      IF the user clicks the active card again or clicks a close button,
      THEN smoothly collapse the detail panel.
    violation_behaviour: Prevent modal popups or full-page reloads on KPI card interaction.
    source: FR2.3

  - id: BR8.1
    statement: Comparative Matrix Grid must render projects side-by-side across all 5 QA/QC categories and overdue counts.
    category: validation
    applies_to: ProjectMatrixTable
    trigger: Data binding to /api/v1/projects endpoint response.
    logic: >
      IF projects list is populated,
      THEN render each row containing Site Code, Project ID, Baseline Drawings, Control (ITP/RFI/ITR), Corrective (NCR/CAR),
      Change (PCR/FCR/DCR/VOR), and Overdue counts in aligned tabular columns;
      ELSE render empty state illustration if zero projects are returned.
    violation_behaviour: Display empty state illustration if result set is empty; display error alert if network fails.
    source: FR4.1, FR4.3, NFR5.1

  - id: BR8.2
    statement: Search toolbar input must filter matrix rows in real time with 200ms debounce and synchronize with URL query parameters.
    category: policy
    applies_to: SearchToolbar, ProjectMatrixTable
    trigger: User enters keystrokes into #searchInput.
    logic: >
      IF user enters or modifies text in #searchInput,
      THEN debounce input by 200ms, filter rows client-side matching Site Code or Project ID (case-insensitive),
      and synchronize the search string to the URL query string (?search=...) via Nuqs;
      IF search input is cleared,
      THEN remove the query parameter from URL and restore full project list.
    violation_behaviour: Reject full page reloads or un-debounced excessive state updates on keystroke.
    source: FR4.3, NFR5.1

  - id: BR8.3
    statement: All primary views and tables must explicitly handle the 4 mandatory interactive screen states.
    category: constraint
    applies_to: ProjectMatrixTable, HistoricalTrendChart, TopbarKpiCards
    trigger: View mounting, network fetching, error receipt, or filter mutation.
    logic: >
      IF request is in-flight, THEN render loading skeleton shimmer with zero layout shift (CLS < 0.1);
      ELSE IF request fails (4xx/5xx or network drop), THEN render error state with retry button;
      ELSE IF request succeeds with 0 records or filter returns 0 matches, THEN render empty state with clear filter CTA;
      ELSE render populated successful data components.
    violation_behaviour: Never render a blank white container, unhandled exception screen, or uncontained spinner.
    source: NFR5.1

  - id: BR9.1
    statement: Documents with overdue status must be visually tagged and increment the project's overdue counter.
    category: calculation
    applies_to: ProjectMatrixTable, OverdueBadge
    trigger: Evaluation of project overdue_count from backend envelope.
    logic: >
      IF project overdue_count > 0,
      THEN render an amber/red overdue badge with the count in the Overdue column;
      ELSE render a neutral zero-state badge (0) in muted styling.
    violation_behaviour: Prevent negative or undefined overdue count rendering.
    source: FR2.2, FR3.2

  - id: BR9.2
    statement: Categories with pending delinquency ratio >= 45% must trigger a pulsing visual critical alert (.chip-blink).
    category: constraint
    applies_to: DelinquencyChip, ProjectMatrixTable
    trigger: Evaluation of pending percentage for Control, Corrective, or Change categories.
    logic: >
      IF category pending ratio (Open / (Open + Closed) * 100) >= 45.0%,
      THEN apply the .chip-blink CSS class with subtle pulsing amber/red border (animate-pulse) and show delinquency percentage in tooltip;
      ELSE render standard neutral category pill.
    violation_behaviour: Do not flash aggressive intrusive popups; maintain accessible, subtle pulsing animation.
    source: FR3.3, FR3.4

  - id: BR9.3
    statement: Net backlog changes compared to previous week must render a directional trend tag.
    category: calculation
    applies_to: TrendTag, ProjectMatrixTable
    trigger: Evaluation of week-over-week net document backlog differential.
    logic: >
      IF current week backlog is less than previous week,
      THEN render a green downward indicator (▼) signifying shrinking backlog;
      ELSE IF current week backlog is greater than previous week,
      THEN render a red upward indicator (▲) signifying expanding backlog;
      ELSE render a neutral dash (-) indicating stable backlog.
    violation_behaviour: Disallow incorrect color inverted indicators (green must always indicate backlog reduction).
    source: FR3.4

  - id: BR10.1
    statement: Historical Trend view must render continuous time-series chart querying project_daily_metrics in under 50ms.
    category: calculation
    applies_to: HistoricalTrendChart
    trigger: User navigates to #view-trend or mounts trend view.
    logic: >
      IF trend tab is active,
      THEN query /api/v1/analytics/trends and render Recharts SVG canvas across the full project lifetime in < 50ms;
      ELSE suspend chart rendering to free DOM resources.
    violation_behaviour: Prevent chart canvas re-renders exceeding 50ms after data arrival.
    source: FR5.1, FR5.5, NFR1.4

  - id: BR10.2
    statement: Time range preset selectors must dynamically scale horizontal axis to preset windows.
    category: policy
    applies_to: HistoricalTrendChart, PresetToolbar
    trigger: User clicks preset button (All Time, 1 Year, 6 Months, 3 Months).
    logic: >
      IF user clicks a preset selector,
      THEN filter data points to the selected time window (All Time, 1 Year, 6 Months, or 3 Months),
      re-calculate date ticks on horizontal X-axis, and update active preset button styling;
      ELSE retain default All Time view.
    violation_behaviour: Maintain smooth chart re-scaling without page flicker or layout collapse.
    source: FR5.5

  - id: BR10.3
    statement: Multi-project selection must assign distinct deterministic categorical colors to each project curve.
    category: constraint
    applies_to: HistoricalTrendChart, ProjectSelectorDropdown
    trigger: User selects projects from project filter dropdown.
    logic: >
      IF multiple projects are selected in project filter dropdown,
      THEN assign each project a deterministic color from the 8+16 categorical palette (--trend-1 through --trend-24)
      based on project index or ID hash, rendering distinct curve lines on the shared canvas;
      ELSE display empty chart prompt if zero projects are selected.
    violation_behaviour: Prohibit random color generation on re-render; color assignments must remain stable.
    source: FR5.2, FR5.3

  - id: BR10.4
    statement: Hovering anywhere along the trend timeline must display a unified crosshair tooltip showing all active projects.
    category: policy
    applies_to: HistoricalTrendChart, ChartTooltip
    trigger: Pointer move event across SVG chart area.
    logic: >
      IF pointer hovers over a timestamp on the chart canvas,
      THEN render a vertical crosshair line and display a unified tooltip containing the date and the document volume
      for every currently selected project side-by-side with its matching color indicator;
      ELSE hide tooltip when pointer leaves canvas bounds.
    violation_behaviour: Prevent disjointed multiple individual tooltips for multi-series overlays.
    source: FR5.4

  - id: BR10.5
    statement: Unchecking a project must cleanly remove its curve while preserving colors of remaining active curves.
    category: policy
    applies_to: HistoricalTrendChart, ProjectSelectorDropdown
    trigger: User unchecks a project checkbox in the project filter dropdown.
    logic: >
      IF user unchecks a selected project,
      THEN smoothly remove that project's curve and legend entry from the chart canvas,
      while preserving the assigned categorical color codes of all remaining selected projects;
      ELSE if all projects are unchecked, display empty chart placeholder.
    violation_behaviour: Do not re-shuffle or re-index colors for existing active curves upon removing a sibling project.
    source: FR5.2, FR5.3

  - id: BR11.1
    statement: CSV Upload Modal must support drag-and-drop file selection and transmit multipart/form-data to /api/v1/ingest.
    category: policy
    applies_to: CsvUploadModal
    trigger: User drops or selects a CSV file and confirms upload.
    logic: >
      IF user selects a valid CSV file,
      THEN display the selected file metadata and transmit a multipart/form-data payload to POST /api/v1/ingest
      with an active progress bar;
      ELSE keep the dropzone in the idle state awaiting user input.
    violation_behaviour: Prevent form submission without an attached file.
    source: FR1.1

  - id: BR11.2
    statement: Client must validate file type (.csv) and maximum size (<= 10MB) before transmission and render clear error feedback.
    category: validation
    applies_to: CsvUploadModal
    trigger: File drop or file picker selection in CsvUploadModal.
    logic: >
      IF selected file has extension .csv and size <= 10,485,760 bytes (10MB),
      THEN mark file as valid and enable the submit action;
      ELSE IF size > 10MB or extension is invalid or server returns HTTP 400 Bad Request,
      THEN display a clear error message in the modal dialog describing the validation failure.
    violation_behaviour: Prohibit sending payloads exceeding 10MB to the server; display descriptive client error message.
    source: FR1.1, NFR1.3

  - id: BR11.3
    statement: Upon successful ingestion, client must display an outcome summary dialog and invalidate stale project caches.
    category: policy
    applies_to: CsvUploadModal, QueryClient
    trigger: Ingestion endpoint returns HTTP 200 or 201.
    logic: >
      IF POST /api/v1/ingest returns HTTP 200 or 201,
      THEN display a summary notification showing processed rows, active revision count, and delta changes,
      and invalidate TanStack Query caches for /projects and /projects/summary;
      ELSE if server returns HTTP 409 conflict, display chronological downgrade warning dialog.
    violation_behaviour: Never leave dashboard views showing stale metrics after a successful batch upload.
    source: FR1.1, FR1.5
```

---

## 3. Human-Readable Business Rules Summary Table

| Rule ID | Category | Component | Description & Trigger | Primary Upstream Source |
|:---|:---|:---|:---|:---|
| **`BR7.1`** | Calculation | `TopbarKpiCards` | Renders global summary total and 5 QA/QC category pills in $< 50\text{ ms}$ upon data receipt | `FR2.1`, `FR2.3`, `NFR1.1` |
| **`BR7.2`** | Validation | `TopbarKpiCards` | Ensures KPI counts reflect latest active document revisions only, excluding superseded revisions | `FR2.1`, `FR1.5` |
| **`BR7.3`** | Policy | `TopbarKpiCards` | Clicking KPI cards toggles expanded `.kpi-detail` collapse panel showing project-level contributions | `FR2.3` |
| **`BR8.1`** | Validation | `ProjectMatrixTable` | Renders comparative project matrix across Site Code, Project ID, 5 categories, and Overdue | `FR4.1`, `FR4.3`, `NFR5.1` |
| **`BR8.2`** | Policy | `SearchToolbar` | Filters matrix in real-time with 200ms debounce and synchronizes query to URL via Nuqs | `FR4.3`, `NFR5.1` |
| **`BR8.3`** | Constraint | `ProjectMatrixTable` | Explicitly implements all 4 mandatory screen states (skeleton shimmer, empty, error, success) | `NFR5.1` |
| **`BR9.1`** | Calculation | `OverdueBadge` | Evaluates overdue document counts and renders amber/red badges for overdue items | `FR2.2`, `FR3.2` |
| **`BR9.2`** | Constraint | `DelinquencyChip` | Applies `.chip-blink` pulsing visual alert (`animate-pulse`) when category pending ratio $\ge 45\%$ | `FR3.3`, `FR3.4` |
| **`BR9.3`** | Calculation | `TrendTag` | Renders directional week-over-week backlog trend indicator ($\blacktriangledown$ green / $\blacktriangle$ red / $-$) | `FR3.4` |
| **`BR10.1`** | Calculation | `HistoricalTrendChart` | Queries `project_daily_metrics` and renders continuous Recharts SVG canvas in $< 50\text{ ms}$ | `FR5.1`, `FR5.5`, `NFR1.4` |
| **`BR10.2`** | Policy | `PresetToolbar` | Scales timeline to preset time windows (`All Time`, `1 Year`, `6 Months`, `3 Months`) | `FR5.5` |
| **`BR10.3`** | Constraint | `ProjectSelectorDropdown` | Assigns stable deterministic 8+16 categorical colorway to multi-project curves on shared canvas | `FR5.2`, `FR5.3` |
| **`BR10.4`** | Policy | `ChartTooltip` | Displays unified crosshair tooltip with side-by-side project metrics at hovered timestamp | `FR5.4` |
| **`BR10.5`** | Policy | `ProjectSelectorDropdown` | Unchecking projects removes curve cleanly without altering color assignments of remaining curves | `FR5.2`, `FR5.3` |
| **`BR11.1`** | Policy | `CsvUploadModal` | Supports drag-and-drop CSV file selection and transmits multipart stream to `/api/v1/ingest` | `FR1.1` |
| **`BR11.2`** | Validation | `CsvUploadModal` | Validates file size ($\le 10$MB) and `.csv` extension, displaying clear error diagnostics | `FR1.1`, `NFR1.3` |
| **`BR11.3`** | Policy | `CsvUploadModal` | Displays batch ingestion summary notification and invalidates dashboard caches upon success | `FR1.1`, `FR1.5` |
