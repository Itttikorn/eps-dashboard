# Rough Mockups Questions

## Q1. What are the primary user entry points and key views for the dashboard?
A. Two primary views: (1) Main Project Comparison Matrix View with top KPI summary cards and expandable discipline breakdown drawers, and (2) Weekly Trend Analytics View (tabbed toggle)
B. Single monolithic scrollable view containing all charts, project tables, and document registers on one page
C. Multi-page drill-down with separate routes for each project (`/project/:id`)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q2. What is the core user flow (happy path) for the executive user?
A. Executive lands on Dashboard → Reviews top KPI scorecard (Total Docs, Overdue, Returned, Categories) → Checks Project Comparison Matrix for projects with overdue items → Clicks row chevron to inspect discipline breakdown (Mechanical, Electrical, Civil) → Switches to Weekly Trend tab to assess backlog trajectory
B. User navigates directly to a search bar, searches for a specific document ID, and views its transmittal history
C. User enters a project setup wizard to configure tracking parameters
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q3. How should the information hierarchy and visual emphasis be structured?
A. Top: Sticky Header with Ingestion status badge and "Upload CSV" button → Top Hero: 6 Summary KPI Cards → Main Content: Search/Sort Toolbar + Multi-Project Comparison Matrix Table with color-coded severity chips and expandable row drawers
B. Left: Full sidebar navigation with project list → Right: Selected project detail view
C. Metric cards only, with tables hidden in modal windows
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q4. What design system, styling, and color conventions should be adopted?
A. Follow the visual design system established in the prototype (Conzol-Doc-tracker): Navy header (`#152444`), clean slate background (`#eef1f6`), white card panels with subtle shadows, and standardized color tokens for status (Green: good/returned, Amber: warning/pending, Red: overdue/critical)
B. Plain unstyled black-and-white wireframe layout
C. Material Design 3 default components
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q5. What device/form factors must be supported?
A. Desktop & Laptop first (1280px+ optimized widescreen for dense engineering matrix comparison), responsive down to tablet (collapsing table columns gracefully)
B. Mobile smartphone first (vertical stacked cards only)
C. Ultra-wide monitoring wall displays only (4K+)
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Q6. What accessibility (a11y) standards should be incorporated into the mockups?
A. Clear semantic HTML hierarchy (H1 page title, H2 card headers, H3 drawer sections), primary landmark regions (`header`, `main`), table headers with proper `scope="col"` and `scope="row"`, high text contrast ratios, and keyboard-navigable buttons/drawers
B. Minimal standard HTML without ARIA annotations or landmark roles
C. Screen-reader only text without visual focus rings
D. Not yet defined
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
