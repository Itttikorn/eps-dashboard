# Refined Mockups & UI Layout Specifications

**Stage**: `refined-mockups` (2.5)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-design-agent`  
**Date**: 2026-10-16  

---

## 1. Global Shell & Navigation Framework

The dashboard uses a Single-Page Application (SPA) architecture with a dark-navy corporate header (`#152444`), global filters, and a responsive tab bar. Active project selections and date filters persist across tab switches in client memory.

```
+--------------------------------------------------------------------------------------------------------------------+
|  [LOGO] Conzol Doc Tracker   |  Corporate Document Management System            [Data Admin: Upload CSV] [v1.0.0]  |
+--------------------------------------------------------------------------------------------------------------------+
|  Navigation Tabs:                                                                                                  |
|  [ (1) QA/QC Comparative Overview ]  [ (2) Trend Analytics ]  [ (3) CSV Ingestion ]                                 |
+--------------------------------------------------------------------------------------------------------------------+
|  Active Filters:                                                                                                   |
|  Projects: [All Projects (3) v] | Date: [2026-03-31 v] | Quick: [Today] [Yesterday] [Latest Snapshot]               |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Screen 1: Multi-Project QA/QC Comparative Overview

Provides executive leadership with a simultaneous comparative health evaluation across all monitored EPC projects, structured across the 5 QA/QC lifecycle pillars and delinquency indicators.

```
+--------------------------------------------------------------------------------------------------------------------+
|  QA/QC Multi-Project Comparative Overview                                                                         |
|  Snapshot Date: 31-Mar-2026 | Total Portfolio Documents: 1,420 | Overall Backlog: 245 | Overdue: 38 (2.7%)          |
+--------------------------------------------------------------------------------------------------------------------+

  +----------------------------------------------------------------------------------------------------------------+
  | PROJECT: SKK-IM-CM-26002 - Rayong Petrochemical Expansion                      [Status: ON TRACK - 3.2% Overdue]|
  +----------------------------------------------------------------------------------------------------------------+
  |  Total Docs: 512  |  Approved: 418 (81.6%)  |  In Review: 78 (15.2%)  |  Overdue: 16 (3.1%) [GREEN BADGE]      |
  +----------------------------------------------------------------------------------------------------------------+
  |  5 QA/QC LIFECYCLE PILLARS:                                                                                    |
  |                                                                                                                |
  |  [1. BASELINE]       [2. CONTROL]        [3. CORRECTIVE]     [4. CHANGE]         [5. COMPLETE]                 |
  |  Color: #2f6fce      Color: #12a4a0      Color: #ee8a1f      Color: #26a65b      Color: #8b5cf6                |
  |  Total: 120 Docs     Total: 185 Docs     Total: 64 Docs      Total: 48 Docs      Total: 95 Docs                |
  |  Approved: 115       Approved: 140       Approved: 42        Approved: 38        Approved: 83                  |
  |  In-Review: 5        In-Review: 35       In-Review: 18       In-Review: 8        In-Review: 12                 |
  |  Overdue: 0 (0.0%)   Overdue: 10 (5.4%)  Overdue: 4 (6.3%)   Overdue: 2 (4.2%)   Overdue: 0 (0.0%)             |
  |  [Progress: 95.8%]   [Progress: 75.7%]   [Progress: 65.6%]   [Progress: 79.2%]   [Progress: 87.4%]             |
  +----------------------------------------------------------------------------------------------------------------+

  +----------------------------------------------------------------------------------------------------------------+
  | PROJECT: STS-CN-PP-26001 - Chonburi Clean Power Substation                    [Status: ATTENTION - 6.8% Overdue]|
  +----------------------------------------------------------------------------------------------------------------+
  |  Total Docs: 468  |  Approved: 320 (68.4%)  |  In Review: 116 (24.8%) |  Overdue: 32 (6.8%) [AMBER BADGE]      |
  +----------------------------------------------------------------------------------------------------------------+
  |  [1. BASELINE]       [2. CONTROL]        [3. CORRECTIVE]     [4. CHANGE]         [5. COMPLETE]                 |
  |  Total: 98 Docs      Total: 162 Docs     Total: 82 Docs      Total: 42 Docs      Total: 84 Docs                |
  |  Approved: 92        Approved: 98        Approved: 48        Approved: 28        Approved: 54                  |
  |  Overdue: 1 (1.0%)   Overdue: 18 (11.1%) Overdue: 9 (10.9%)  Overdue: 4 (9.5%)   Overdue: 0 (0.0%)             |
  |  [Progress: 93.9%]   [Progress: 60.5%]   [Progress: 58.5%]   [Progress: 66.7%]   [Progress: 64.3%]             |
  +----------------------------------------------------------------------------------------------------------------+

  +----------------------------------------------------------------------------------------------------------------+
  | PROJECT: STS-EN-PP-26001 - Saraburi Energy Recovery Unit                       [Status: CRITICAL - 16.2% Overdue]
  +----------------------------------------------------------------------------------------------------------------+
  |  Total Docs: 440  |  Approved: 260 (59.1%)  |  In Review: 109 (24.8%) |  Overdue: 71 (16.2%) [RED BADGE]       |
  +----------------------------------------------------------------------------------------------------------------+
  |  [1. BASELINE]       [2. CONTROL]        [3. CORRECTIVE]     [4. CHANGE]         [5. COMPLETE]                 |
  |  Total: 85 Docs      Total: 175 Docs     Total: 90 Docs      Total: 35 Docs      Total: 55 Docs                |
  |  Approved: 75        Approved: 90        Approved: 45        Approved: 20        Approved: 30                  |
  |  Overdue: 3 (3.5%)   Overdue: 42 (24.0%) Overdue: 18 (20.0%) Overdue: 8 (22.9%)  Overdue: 0 (0.0%)             |
  |  [Progress: 88.2%]   [Progress: 51.4%]   [Progress: 50.0%]   [Progress: 57.1%]   [Progress: 54.5%]             |
  +----------------------------------------------------------------------------------------------------------------+
```

---

## 3. Screen 2: Unlimited Multi-Project Historical Trend Analytics

Provides interactive multi-project comparative trend analysis across the full historical lifecycle without date window constraints.

```
+--------------------------------------------------------------------------------------------------------------------+
|  Trend Analytics: Multi-Project Historical Comparison                                                             |
|  Presets: [30 Days] [90 Days] [180 Days] [1 Year] [(All Time)] | Date Range: [2025-01-01] to [2026-03-31]         |
|  Metric:  (*) Total Volume   ( ) Approved Volume   ( ) In-Review Backlog   ( ) Overdue Volume                      |
+--------------------------------------------------------------------------------------------------------------------+
|  Project Selection:                                                                                                |
|  [x] SKK-IM-CM-26002 (Blue)     [x] STS-CN-PP-26001 (Orange)   [x] STS-EN-PP-26001 (Teal)                          |
|  [Select All]  [Clear All]      (Notice: 3 projects selected - deterministic color mapping active)                 |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|  Docs                                                                                                              |
|   600 |                                                 .-'""`-.  (SKK Blue)                                       |
|       |                                            _.-""        `--.                                               |
|   450 |                                       _.-""                 `-. (STS-CN Orange)                            |
|       |                                  _.-""                         `-..                                        |
|   300 |                             _.-""                                  `--. (STS-EN Teal)                      |
|       |                        _.-""                                                                               |
|   150 |                   _.-""                                                                                    |
|       |              _.-""                                                                                         |
|     0 +-------------+-------------+-------------+-------------+-------------+-------------+                        |
|     Jan 2025      Apr 2025      Jul 2025      Oct 2025      Jan 2026      Mar 2026                                 |
|                                                                                                                    |
|  [Hover Tooltip at 2026-03-15]:                                                                                    |
|  --------------------------------------------------                                                                |
|  Date: 15-Mar-2026                                                                                                 |
|  * SKK-IM-CM-26002: 508 Docs (+2 from prior week)                                                                 |
|  * STS-CN-PP-26001: 462 Docs (+4 from prior week)                                                                 |
|  * STS-EN-PP-26001: 435 Docs (+1 from prior week)                                                                 |
+--------------------------------------------------------------------------------------------------------------------+
```

---

## 4. Screen 3: Operational CSV Upload & Ingestion Monitor

Provides data administrators with a drag-and-drop CSV upload portal, idempotent checksum validation, and real-time ingestion reporting.

```
+--------------------------------------------------------------------------------------------------------------------+
|  Data Administration: Daily CSV Ingestion Portal                                                                   |
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|      + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +       |
|      '                                                                                                     '       |
|      '        [CLOUDUPLOAD ICON]                                                                           '       |
|      '        Drag & drop daily CSV snapshot export here, or click to browse                               '       |
|      '        Supported format: CSV (Max 50MB) | Encodings: UTF-8, ASCII                                   '       |
|      '                                                                                                     '       |
|      + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +       |
|                                                                                                                    |
|  Recent Ingestion History:                                                                                         |
|  +--------------+------------------+------------+-------------+-------------+-------------+----------------------+ |
|  | Batch ID     | Project Target   | Snapshot   | Rows Total  | Deltas New  | Skipped     | Ingestion Status     | |
|  +--------------+------------------+------------+-------------+-------------+-------------+----------------------+ |
|  | BATCH-260331 | SKK-IM-CM-26002  | 2026-03-31 | 512 rows    | 8 updated   | 504 unchanged| [SUCCESS (18ms)]     | |
|  | BATCH-260330 | SKK-IM-CM-26002  | 2026-03-30 | 510 rows    | 12 updated  | 498 unchanged| [SUCCESS (22ms)]     | |
|  | BATCH-260329 | STS-CN-PP-26001  | 2026-03-29 | 468 rows    | 5 updated   | 463 unchanged| [SUCCESS (16ms)]     | |
|  +--------------+------------------+------------+-------------+-------------+-------------+----------------------+ |
+--------------------------------------------------------------------------------------------------------------------+
```

