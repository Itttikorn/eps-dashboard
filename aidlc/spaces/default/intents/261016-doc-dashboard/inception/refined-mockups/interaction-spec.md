# UX Interaction Specifications

**Stage**: `refined-mockups` (2.5)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-design-agent`  
**Date**: 2026-10-16  

---

## 1. Tab Navigation & Client State Model

### 1.1 State Preservation
- **Behavior**: Switching between `[Comparative Overview]`, `[Trend Analytics]`, and `[CSV Ingestion]` preserves:
  1. Selected project filters
  2. Selected snapshot date
  3. Active search terms and filter chips
- **Implementation**: Managed in top-level React state (or React Context) without triggering full-page browser reloads.
- **URL Synchronization**: Lightweight query params reflect active tab (`?tab=comparative`, `?tab=trends`, `?tab=upload`) to support bookmarking and browser back/forward buttons.

---

## 2. Screen 1: Multi-Project QA/QC Comparative Overview

### 2.1 Project Card Interactions
- **Card Click**: Clicking anywhere on a project header row highlights that project or navigates to Tab 2 (`Trend Analytics`) with that project isolated.
- **Pillar Hover**: Hovering over any of the 5 QA/QC category bars (Baseline, Control, Corrective, Change, Complete) highlights the column and opens a floating tooltip:
  - Metric breakdown: Total Documents, Approved, Under Review, Overdue count.
  - Return Code distribution (Codes 1, 2, 3, 4).
- **Delinquency Status Chip**:
  - Green (< 5%): Displays `ON TRACK (< 5% Overdue)`
  - Amber (5–15%): Displays `ATTENTION (X% Overdue)`
  - Red (> 15%): Displays `CRITICAL (X% Overdue)` with alert badge

---

## 3. Screen 2: Unlimited Multi-Project Trend Analytics

### 4.1 Timeframe Preset Controls
- Preset buttons: `[30 Days]` `[90 Days]` `[180 Days]` `[1 Year]` `[All Time]`
- Clicking a preset updates the X-axis range instantly without page refresh.
- Selecting custom start/end dates via date-picker clears the preset active state.

### 4.2 Multi-Project Selection & Extended Palette Handling
- **Checkboxes & Project Chips**:
  - Clicking a chip toggles visibility of that project's curve on the canvas.
  - **"Select All"** and **"Clear All"** helper controls in toolbar.
- **Deterministic Color Binding**:
  - Projects 1–8 always receive `--trend-1` through `--trend-8` (fixed mapping regardless of sorting).
  - Projects 9–16 automatically receive `--trend-9` through `--trend-16` (extended high-contrast palette).
  - Projects 17+ receive stroke-dash pattern fallbacks (`dashed`, `dotted`).
- **Over-Capacity Guidance**: If more than 8 projects are active, a subtle non-blocking banner reads: *"Comparing 10 projects. Click project chips to isolate specific curves."*
- **Synchronized Crosshair Tooltip**:
  - Hovering anywhere on the chart canvas renders a vertical guide line (crosshair).
  - The tooltip displays date, total document count for each active project, and net week-over-week variance.
  - Hovering a legend item dims all other curves to 20% opacity and thickens the hovered curve to 3px.

---

## 4. Screen 3: Operational CSV Upload & Ingestion Monitor

### 5.1 Drag & Drop Zone
- **Dropzone States**:
  - *Default*: Dashed gray border, cloud upload icon, helper instructions.
  - *Drag-Over*: Solid blue border (`#2f6fce`), subtle blue background tint (`bg-blue-50`), scaling icon.
  - *Uploading*: Progress bar showing upload and processing status (0% to 100%).
  - *Success*: Green checkmark, batch summary report showing records processed, deltas saved, skipped rows, execution time.
  - *Validation Failure*: Red warning dialog detailing format or schema issues (e.g. missing required columns, malformed dates).

### 5.2 Idempotency & Chronological Date Guard
- **Duplicate Upload**: If the uploaded CSV file SHA-256 matches an existing batch, the system displays an informational banner: *"Snapshot already processed on 2026-03-31 (Batch ID BATCH-260331). No new records created."*
- **Out-of-Order Date Confirmation**: If snapshot date is older than latest recorded date, a confirmation dialog appears: *"Snapshot date (2026-03-15) is earlier than latest state (2026-03-31). Historical rollups will update, but current active state will be preserved. Proceed?"*

