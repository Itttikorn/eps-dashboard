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

- Adopted Create Merge Commit (--no-ff) across linear promotion branches (type/scope -> staging -> dev -> main) instead of squash-merge, strictly adhering to organizational git standards. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:practices-discovery:68df1feb9fde5af59c228238e174737457497bbbad5e67842acc98460cc4a020 -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

- Decided against a walking skeleton thin slice in favor of structured layer-by-layer isolation to build database models & streaming ingestion first, followed by business logic and dashboard UI. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:practices-discovery:5cf5f1c29979cc940fcb1647683bd221cebdfc1d64468ca3a3947dbb836e48d2 -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Guard Policy

<!-- Project-specific. Mode: strict, relaxed, or off. Strict here holds for every intent and cannot be changed from chat. A section under the retired Change Control heading, written by an earlier release, is still read. -->

## Deployment

<!-- Project-specific specialisation. -->

- Docker Compose containerization is selected for MVP to provide local and internal corporate VM deployment with zero cloud infrastructure provisioning overhead. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:feasibility:235dc9dbd85de0db973344c49bac5cd8cd204da994479ba06f93b9f10601d369 -->

## Code Style

<!-- Project-specific specialisation. -->

- Selected Chi v5 with Universal Response Envelope (internal/utils/envelope.go) as the backend API architecture, ensuring strict conformance to organizational backend standards. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:practices-discovery:4b28e7874dfc7740a754db44382ef1608e775e55621e42a2c8344ccdf21a75a5 -->

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

- NEVER use fast-forward or squash merges across promotion branches; `--no-ff` is mandatory to preserve PR context and enable atomic rollback. (affirmed 2026-10-16)

- NEVER force-push (`git push -f`) or push directly to `main`, `dev`, or `staging`. (affirmed 2026-10-16)

- NEVER commit credentials, private keys, `.env` files, or binary artifacts into git. (affirmed 2026-10-16)

- NEVER leak internal database schemas, driver error strings, or stack traces in API response envelopes (`status.description`). (affirmed 2026-10-16)

- NEVER wrap `/ws` WebSocket routes with HTTP request timeout middleware. (affirmed 2026-10-16)

- NEVER use arbitrary inline CSS styles or uncontained layout divs; use Tailwind CSS semantic token classes and 4/8pt spacing rhythm. (affirmed 2026-10-16)

- NEVER bypass database migrations with manual schema changes. (affirmed 2026-10-16)

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS follow the linear branch promotion pipeline: `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`. (affirmed 2026-10-16)

- ALWAYS merge pull requests across all promotion gates using Create Merge Commit (`--no-ff`). (affirmed 2026-10-16)

- ALWAYS format commit messages according to the Conventional Commits specification (`type(scope): imperative summary`). (affirmed 2026-10-16)

- ALWAYS run Go tests with the race detector enabled (`go test ./... -race -count=1`) in local verification and CI. (affirmed 2026-10-16)

- ALWAYS wrap all HTTP API responses in the organizational four-field JSON envelope (`status: { code, header, description }`, `result`, `total`, `search_params`). (affirmed 2026-10-16)

- ALWAYS enforce maximum request body limits via `http.MaxBytesReader` on all API ingestion endpoints. (affirmed 2026-10-16)

- ALWAYS implement the 4 mandatory interactive screen states (Loading skeleton, Empty, Error, Success) for all frontend views and data tables. (affirmed 2026-10-16)

- ALWAYS run `gofmt` and `golangci-lint` on Go backend code and Prettier/ESLint on TypeScript frontend code. (affirmed 2026-10-16)

- ALWAYS build layers in structured sequence: database schema & Go streaming ingestion first, followed by business logic and dashboard frontend. (affirmed 2026-10-16)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- Executive users are the primary target persona; simplicity and high-level readability take precedence over raw technical document table inspection. (learned 2026-10-16) <!-- cid:261016-doc-dashboard:intent-capture:912bf420d56fec98e19fa88373f58dc4884557c15808937549d53f1437051906 -->
- NEVER use interactive modal questions (`ask_question` tool); ALWAYS present questions, options, and clarification requests in plain chat text for the user to answer in their own response. (learned 2026-10-19)
