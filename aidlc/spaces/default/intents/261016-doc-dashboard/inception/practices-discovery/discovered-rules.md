# Discovered Rules

> Stamped hard constraints discovered during Practices Discovery from organizational knowledge (`aidlc/spaces/default/knowledge/aidlc-shared/`).
> On affirmation, Mandated and Forbidden rules are promoted to `memory/project.md`.

## Mandated

- ALWAYS follow the linear branch promotion pipeline: `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`.
- ALWAYS merge pull requests across all promotion gates using Create Merge Commit (`--no-ff`).
- ALWAYS format commit messages according to the Conventional Commits specification (`type(scope): imperative summary`).
- ALWAYS run Go tests with the race detector enabled (`go test ./... -race -count=1`) in local verification and CI.
- ALWAYS wrap all HTTP API responses in the organizational four-field JSON envelope (`status: { code, header, description }`, `result`, `total`, `search_params`).
- ALWAYS enforce maximum request body limits via `http.MaxBytesReader` on all API ingestion endpoints.
- ALWAYS implement the 4 mandatory interactive screen states (Loading skeleton, Empty, Error, Success) for all frontend views and data tables.
- ALWAYS run `gofmt` and `golangci-lint` on Go backend code and Prettier/ESLint on TypeScript frontend code.

## Forbidden

- NEVER use fast-forward or squash merges across promotion branches; `--no-ff` is mandatory to preserve PR context and enable atomic rollback.
- NEVER force-push (`git push -f`) or push directly to `main`, `dev`, or `staging`.
- NEVER commit credentials, private keys, `.env` files, or binary artifacts into git.
- NEVER leak internal database schemas, driver error strings, or stack traces in API response envelopes (`status.description`).
- NEVER wrap `/ws` WebSocket routes with HTTP request timeout middleware.
- NEVER use arbitrary inline CSS styles or uncontained layout divs; use Tailwind CSS semantic token classes and 4/8pt spacing rhythm.
- NEVER bypass database migrations with manual schema changes.
