# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

- An ingestion-first delivery sequence is adopted for MVP: build and verify the Go CSV ingestion pipeline and database storage before dashboard frontend integration. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:scope-definition:f599e8ce236de968c245e43b0b32a1ad98e70f0dc210be10e1be7f93038fca6e -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Guard Policy

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent and cannot be changed from chat. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

<!-- Project-specific specialisation. -->

- Docker Compose containerization is selected for MVP to provide local and internal corporate VM deployment with zero cloud infrastructure provisioning overhead. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:feasibility:235dc9dbd85de0db973344c49bac5cd8cd204da994479ba06f93b9f10601d369 -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

- PostgreSQL is selected as the primary relational database to support concurrent web dashboard read queries and daily ingestion write updates cleanly. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:feasibility:e09d6fbc69e3d05018d552f161f8f9a98f63dc29f5c6578230f13eb52eaedb85 -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

- Historical trend analytics is included in the MVP scope to track document and overdue status changes across daily snapshots. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:scope-definition:d766e6715a0fb409dbbd25751074a4890a9eeb94dd6506f2fd87a622d473a6b9 -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- Executive users are the primary target persona; simplicity and high-level readability take precedence over raw technical document table inspection. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:intent-capture:912bf420d56fec98e19fa88373f58dc4884557c15808937549d53f1437051906 -->
