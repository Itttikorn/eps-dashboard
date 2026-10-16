---
title: Git & Version Control Standards
description: Authoritative organizational Git standards covering the type/scope -> staging -> dev -> main promotion procedure, Conventional Commits, Non-Fast-Forward Merge Commit PR workflows, branch protection rules, and release tagging.
version: 1.2.0
category: standards
scope: organizational-standard
status: approved
---

# Git & Version Control Standards

## 1. Governance & Version Control Philosophy

This document defines the organizational version control standards for all software repositories. The primary goals are:
- **Traceable History**: Every production release and feature rollout is backed by an auditable, legible Git commit graph.
- **Strict Environment Promotion**: Changes follow an explicit promotion lifecycle: **`type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`**, guaranteeing verification before reaching production.
- **Atomic & Reversible Deployments**: Grouping feature commits via non-fast-forward merge commits (`--no-ff`) preserves context and enables clean, one-step rollbacks (`git revert -m 1 <commit-hash>`).
- **Standardized Communication**: Conventional Commits provide automated changelog generation and semantic release classification.

---

## 2. Branch Promotion Procedure: `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`

All repositories enforce the **Linear Environment Promotion Pipeline**:

```
+------------------+          +-----------+          +-------+          +--------+
|  Working Branch  |  PR #1   |           |  PR #2   |       |  PR #3   |        |
|    type/scope    | -------> |  staging  | -------> |  dev  | -------> |  main  |
| (feat, fix, etc) |          | (Pre-prod)|          | (Dev) |          | (Prod) |
+------------------+          +-----------+          +-------+          +--------+
```

```mermaid
gitGraph
    commit id: "init"
    branch main
    branch dev
    branch staging
    checkout staging
    branch feat/auth
    checkout feat/auth
    commit id: "feat(auth): implement login endpoint"
    commit id: "test(auth): add unit test coverage"
    checkout staging
    merge feat/auth id: "PR: feat/auth -> staging"
    checkout dev
    merge staging id: "PR: staging -> dev"
    checkout main
    merge dev id: "PR: dev -> main (tag: v1.0.0)"
    checkout main
    branch hotfix/auth
    checkout hotfix/auth
    commit id: "fix(auth): patch token leak"
    checkout main
    merge hotfix/auth id: "Hotfix PR -> main (tag: v1.0.1)"
    checkout staging
    merge main id: "Back-port hotfix -> staging"
    checkout dev
    merge staging id: "Back-port hotfix -> dev"
```

---

### 2.1 The 4-Stage Promotion Lifecycle

| Stage | Branch | Role & Purpose | Gate / Entry Criteria |
| :---: | :--- | :--- | :--- |
| **1** | **`type/scope`**<br>*(Working Branch)* | Ephemeral working branch for an individual feature, bugfix, or refactoring task. | Branched off latest `staging`. Named strictly using the `type/scope` convention: `feat/auth`, `fix/vote`, etc. |
| **2** | **`staging`**<br>*(Pre-production / UAT)* | Integration and staging environment. Hosts candidate changes for QA, end-to-end testing, and validation. | **PR Gate 1**: Merges `type/scope` $\rightarrow$ `staging` via `--no-ff`. Requires passing CI checks (unit tests, race detector, linting). |
| **3** | **`dev`**<br>*(Development)* | Consolidated development branch. Deploys to internal dev environment to verify system-wide stability across all services. | **PR Gate 2**: Merges `staging` $\rightarrow$ `dev` via `--no-ff` once verified in staging. |
| **4** | **`main`**<br>*(Production)* | Live production source of truth. Every commit on `main` is deployable and tagged. | **PR Gate 3**: Merges `dev` $\rightarrow$ `main` via `--no-ff`. Requires code owner approvals, tagged with SemVer release tag. |

---

### 2.2 Working Branch Naming Convention

Working branches must adhere directly to the forward-slash `type/scope-short-description` schema:

```
<type>/<scope>-<short-description>
```

#### Standard Examples:
- `feat/auth-api-key-rotation`
- `fix/websocket-heartbeat-disconnect`
- `refactor/attendance-extract-service`
- `perf/vote-redis-lua-pipeline`
- `docs/bruno-update-collection`
- `chore/deps-bump-chi`

#### Prohibited Branch Names:
- Anonymous names: `feature/test`, `my-branch`, `fix1`, `patch`, `dev-alex`.
- Unconventional prefixes: `bug/`, `task/`, `story/`.
- Bracket/parentheses characters: `feat(auth)`, `feature(api)`.

---

## 3. Pull Request & Merge Workflow: Create Merge Commit

### 3.1 Enforced Merge Strategy: Create Merge Commit (`--no-ff`)

All PR merges across every gate (`type/scope` $\rightarrow$ `staging`, `staging` $\rightarrow$ `dev`, and `dev` $\rightarrow$ `main`) must use the **Create Merge Commit** (`--no-ff`) strategy.

```sh
git merge --no-ff <branch-name>
```

#### Architectural Rationale
1. **Preservation of Fine-Grained History**: Retains the exact sequence of development commits, including design iterations, test additions, and intermediate refactorings.
2. **Atomic Reversibility**: A multi-commit feature can be cleanly reverted in production with a single command:
   ```sh
   git revert -m 1 <merge-commit-hash>
   ```
3. **Traceability in Monorepos**: The merge commit represents the boundary of an integrated pull request, linking the GitHub/GitLab PR number directly to the repository graph.

---

### 3.2 Pull Request Gates & Requirements

1. **Gate 1 (`type/scope` $\rightarrow$ `staging`)**:
   - Rebase on top of latest `origin/staging` prior to final submission.
   - PR must document changes, affected services, and local test evidence.
   - All automated CI checks must pass (`go test ./... -race -count=1`, `gofmt -l`, `golangci-lint`).
   - Merge via `--no-ff`.
2. **Gate 2 (`staging` $\rightarrow$ `dev`)**:
   - Opened after staging verification and UAT validation are completed.
   - Verifies that staged features integrate seamlessly with dev environment dependencies.
   - Merge via `--no-ff`.
3. **Gate 3 (`dev` $\rightarrow$ `main`)**:
   - Production promotion PR.
   - Requires formal review approval from repository code owners.
   - Deploys to production and creates an annotated release tag.
   - Merge via `--no-ff`.

---

## 4. Commit Message Standard: Conventional Commits

All individual commits must adhere to the **Conventional Commits 1.0.0** specification.

### 4.1 Format Specification

```
<type>(<scope>): <imperative-summary>

[optional body providing technical context and rationale]

[optional footer(s): BREAKING CHANGE:, Closes #123]
```

### 4.2 Commit Types Catalog

| Type | Intent | Example |
| :--- | :--- | :--- |
| **`feat`** | Introduces a new user-facing or API feature. | `feat(user): add user registration endpoint` |
| **`fix`** | Patches a bug or addresses unexpected behavior. | `fix(websocket): resolve connection hang on client disconnect` |
| **`docs`** | Documentation changes only. | `docs(readme): update local setup and environment variables` |
| **`style`** | Code formatting, whitespace, semicolons (`gofmt`). | `style(internal): apply gofmt across database packages` |
| **`refactor`**| Code change that neither fixes a bug nor adds a feature. | `refactor(attendance): extract validation logic to service layer` |
| **`perf`** | Performance improvement or query optimization. | `perf(vote): add composite index for session quota lookup` |
| **`test`** | Adding, fixing, or refactoring test suites. | `test(auth): add table-driven test cases for token rotation` |
| **`build`** | Build system, packaging, Dockerfile, or external dependencies. | `build(deps): bump github.com/go-chi/chi/v5 to v5.1.0` |
| **`ci`** | CI/CD workflows and deployment pipeline configuration. | `ci(github): add race detector check to pull request workflow` |
| **`chore`** | Maintenance tasks, repository housekeeping, tooling scripts. | `chore(makefile): add local docker compose up target` |

### 4.3 Imperative Mood & Writing Rules
- Use lowercase imperative summary: "add", "fix", "refactor" (not "added", "fixes", "refactored").
- No trailing period.
- Maximum 72 characters for summary line.
- Breaking changes indicated with `!` (e.g. `feat(api)!: migrate envelope`) or `BREAKING CHANGE:` footer.

---

## 5. Release Management & Hotfix Procedures

### 5.1 Tagging Convention

All production releases on `main` receive an annotated Git tag following **Semantic Versioning (SemVer 2.0.0)**:

```
v<MAJOR>.<MINOR>.<PATCH>
```

#### Monorepo Scoped Releases
In microservice monorepos where services are released independently, prefix tags with the service folder name:
```
<service-name>@v<MAJOR>.<MINOR>.<PATCH>
```
*Examples:*
- `wa-backend@v1.4.0`
- `acb-system-core@v2.1.2`
- `fx-forwarder@v1.0.5`

### 5.2 Hotfix Procedure
When an urgent fix must bypass the standard staging/dev development cycle:
1. Branch `hotfix/<scope>` directly off `main`.
2. Apply the minimal patch and verify with tests (`-race`).
3. Open a PR into `main` with code owner approval.
4. Merge using `--no-ff` and tag the release (`vX.Y.Z+1`).
5. **Back-Porting (Mandatory)**: Open PRs to back-port the hotfix from `main` into `staging` and `dev` immediately to prevent regressions during future promotions.

---

## 6. Git Hygiene, Security & Anti-Patterns

### 6.1 Zero Secrets Policy
- **Never commit credentials**: `.env`, private keys (`.pem`, `.key`), API secrets, or service account credentials must be strictly excluded via `.gitignore`.
- If a secret is committed:
  1. Revoke and rotate the compromised credential immediately.
  2. Purge repository history using `git filter-repo` before pushing.

### 6.2 Prohibited Git Operations

| Prohibited Action | Risk / Why It Is Banned | Correct Alternative |
| :--- | :--- | :--- |
| **Force-pushing (`git push -f`) to `main`, `dev`, or `staging`** | Destroys shared commit history and desynchronizes clones. | Use `git revert` to undo commits on shared branches. |
| **Direct pushes to protected branches** | Bypasses automated CI gates, code reviews, and test gates. | Always use the PR promotion pipeline. |
| **Skipping pipeline stages (e.g., straight to `main`)** | Introduces unverified changes into production. | Strictly follow `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`. |
| **Committing binaries or heavy media** | Permanently bloats git repository size. | Store binaries in Cloud Storage or artifact registries. |
| **Amending published commits** | Modifies commit hashes of already-pushed commits. | Only amend local, unpushed commits (`git commit --amend` before push). |

---

## 7. Engineering Compliance Checklist for Git Operations

Before creating branches, opening PRs, or merging:

- [ ] **Branch Naming**: Working branch named strictly using `type/scope` (e.g., `feat/auth`, `fix/vote`).
- [ ] **Promotion Sequence**: Changes follow `type/scope` $\rightarrow$ `staging` $\rightarrow$ `dev` $\rightarrow$ `main`.
- [ ] **Commit Messages**: All commit messages follow `type(scope): imperative summary`.
- [ ] **Local Verification**: All tests and race detectors pass locally (`go test ./... -race -count=1`, `gofmt -l`).
- [ ] **Merge Strategy**: PRs merged using **Create Merge Commit** (`--no-ff`).
- [ ] **Secrets & Binaries**: No `.env` files, secrets, or compiled binaries staged.
- [ ] **Hotfix Back-Port**: Emergency hotfixes to `main` back-ported to `staging` and `dev`.
