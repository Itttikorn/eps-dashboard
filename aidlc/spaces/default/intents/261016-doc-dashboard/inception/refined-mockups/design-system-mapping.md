# Design System Mapping & Token Catalog

**Stage**: `refined-mockups` (2.5)  
**Intent**: `261016-doc-dashboard`  
**Lead Agent**: `aidlc-design-agent`  
**Date**: 2026-10-16  

---

## 1. Color System & Semantic Tokens

### 1.1 Brand & Neutral Surfaces
| Token | Hex (Light) | Hex (Dark) | Tailwind Class | Semantic Usage |
|---|---|---|---|---|
| `--headerbg` | `#152444` | `#0c1526` | `bg-slate-900` | Global corporate top header |
| `--bg` | `#eef1f6` | `#0f1218` | `bg-slate-100` | Main canvas background |
| `--paper` | `#ffffff` | `#1a2028` | `bg-white` | Cards, scorecards, accordions |
| `--line` | `#e6e9ef` | `#2b323d` | `border-slate-200` | Card borders, table dividers |
| `--ink` | `#1c2636` | `#e9edf3` | `text-slate-900` | Primary text and headings |
| `--ink-dim` | `#6b7688` | `#95a1b3` | `text-slate-500` | Subtitles, labels, metadata |

### 1.2 The 5 QA/QC Lifecycle Pillars
| Pillar | Solid Color | Soft Background | Tailwind Border/Bg | Lifecycle Category |
|---|---|---|---|---|
| **1. Baseline** | `#2f6fce` | `#e8f0fd` | `border-blue-600 bg-blue-50` | Contract deliverables, engineering design specs |
| **2. Control** | `#12a4a0` | `#e2f8f6` | `border-teal-600 bg-teal-50` | Inspection & Test Plans (ITP), review submittals |
| **3. Corrective** | `#ee8a1f` | `#fdedd9` | `border-amber-600 bg-amber-50` | Non-Conformance Reports (NCR), CARs, comments |
| **4. Change** | `#26a65b` | `#e3f8ea` | `border-emerald-600 bg-emerald-50` | Design Change Notices (DCN), revision amendments |
| **5. Complete** | `#8b5cf6` | `#f0e9fd` | `border-purple-600 bg-purple-50` | As-built drawings, final handover, sign-offs |

### 1.3 Delinquency & Health Status Badges
| Status | Threshold | Color | Badge Class | Visual Representation |
|---|---|---|---|---|
| **Good / On Track** | Overdue < 5% | `#16a34a` | `bg-emerald-100 text-emerald-800` | Green status pill |
| **Warning / Attention** | Overdue 5%–15% | `#ca8a04` | `bg-amber-100 text-amber-800` | Amber status pill |
| **Critical / High Delinquency** | Overdue > 15% | `#dc2626` | `bg-rose-100 text-rose-800` | Red status pill with alert icon |

### 1.4 Trend Analytics Categorical Palette
| Project Slot | Color Token | Hex Code | Visual Swatch | Fallback Stroke Style |
|---|---|---|---|---|
| Project 1 | `--trend-1` | `#2a78d6` | Royal Blue | Solid |
| Project 2 | `--trend-2` | `#eb6834` | Coral Orange | Solid |
| Project 3 | `--trend-3` | `#1baf7a` | Emerald Teal | Solid |
| Project 4 | `--trend-4` | `#eda100` | Amber Gold | Solid |
| Project 5 | `--trend-5` | `#e87ba4` | Rose Pink | Solid |
| Project 6 | `--trend-6` | `#008300` | Forest Green | Solid |
| Project 7 | `--trend-7` | `#4a3aa7` | Deep Indigo | Solid |
| Project 8 | `--trend-8` | `#e34948` | Crimson Red | Solid |
| Project 9 | `--trend-9` | `#0ea5e9` | Sky Blue | Dashed `[6, 4]` |
| Project 10 | `--trend-10` | `#d97706` | Ochre | Dashed `[6, 4]` |
| Project 11 | `--trend-11` | `#059669` | Jade Green | Dashed `[6, 4]` |
| Project 12 | `--trend-12` | `#7c3aed` | Violet | Dashed `[6, 4]` |
| Project 13 | `--trend-13` | `#db2777` | Fuchsia | Dashed `[6, 4]` |
| Project 14 | `--trend-14` | `#0284c7` | Ocean Blue | Dashed `[6, 4]` |
| Project 15 | `--trend-15` | `#b45309` | Rust | Dashed `[6, 4]` |
| Project 16 | `--trend-16` | `#475569` | Slate Gray | Dashed `[6, 4]` |

---

## 2. Typography

- **Headings Font Family**: `"IBM Plex Sans Thai", "IBM Plex Sans", system-ui, sans-serif`
  - `H1`: `text-2xl font-bold tracking-tight text-slate-900`
  - `H2`: `text-xl font-semibold text-slate-800`
  - `H3`: `text-base font-semibold text-slate-800`
- **Body & Data Font Family**: `"IBM Plex Sans Thai", "IBM Plex Sans", system-ui, sans-serif`
  - `Body Regular`: `text-sm text-slate-700 leading-normal`
  - `Body Small / Metadata`: `text-xs text-slate-500`
- **Numeric Figures**: `font-mono tabular-nums font-semibold` to guarantee vertical decimal alignment across document tables and metric counters.

---

## 3. Icon Library (Lucide React)

| Icon Name | Context / Placement | Semantic Meaning |
|---|---|---|
| `LayoutDashboard` | Top navigation | QA/QC Comparative Overview |
| `TrendingUp` | Top navigation | Historical Trend Analytics |
| `UploadCloud` | Top navigation / Header | Operational CSV Upload |
| `AlertCircle` | Delinquency pill | Overdue document warning |
| `CheckCircle2` | Status pill | Approved / Code 1 document |
| `Clock` | Status pill | In-Review document |
| `Calendar` | Date controls | Date range filter picker |

