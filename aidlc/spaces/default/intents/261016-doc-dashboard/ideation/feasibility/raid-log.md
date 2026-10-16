# RAID Log

## Overview
This RAID log records the Risks, Assumptions, Issues, and Dependencies established during Feasibility & Constraint Analysis for the document management system dashboard, tracing from `intent-statement.md`.

## Risks
| ID | Description | Likelihood | Impact | Severity | Mitigation Strategy |
|---|---|---|---|---|---|
| R-1 | Power Automate fails to send the daily HTTP POST or email snapshot fails | Medium | High | High | Expose health check and ingestion status endpoints; record last ingestion timestamp visible on dashboard |
| R-2 | CSV format changes (column reordering, missing headers, date format shifts) | Medium | Medium | Medium | Implement robust CSV schema validation and header mapping with clear ingestion error logging in Go |
| R-3 | Duplicate or out-of-order transmittal revisions sent in snapshot | Low | Medium | Low | Use composite keys (`PROJECTID`, `DOCID`, `REVID`) and upsert logic in PostgreSQL |
| R-4 | Daily multi-project snapshot file size grows significantly over time as project count increases | High | Medium | Medium | Use streaming CSV decoding (`encoding/csv`), batch chunked PostgreSQL upserts (`pgx.CopyFrom` or batched transactions), appropriate HTTP body size limits, and asynchronous ingestion processing |

## Assumptions
| ID | Assumption Description | Confidence | Validation Approach |
|---|---|---|---|
| A-1 | Power Automate will send the daily CSV with standard headers matching the provided sample files | High | Verify parser against actual sample data in `data/` |
| A-2 | Single-server Docker Compose deployment provides adequate capacity and uptime for executive review | High | Validate load and resource utilization in local/internal container environment |
| A-3 | Detailed user authentication and role-based permissions are deferred to post-MVP iterations | High | Confirmed during Q&A (Question 5) |
| A-4 | Daily snapshot contains records from multiple projects simultaneously | High | Confirmed via user feedback; ingestion handles multi-project datasets in a single upload |

## Issues
| ID | Issue Description | Status | Owner | Action Plan |
|---|---|---|---|---|
| I-1 | Scope decision authority remains formally undefined | Open | Product Owner / Tech Lead | Clarify authority during Requirements Analysis and Delivery Planning |

## Dependencies
| ID | Dependency | Dependency Type | Owner / Source | Status |
|---|---|---|---|---|
| D-1 | Upstream Power Automate workflow configuration | External Technical | Power Automate Admin | Outside project scope; API contract to be specified |
| D-2 | Sample CSV files for schema definition and testing | Internal Data | Provided in `@data` | Available & Verified |

