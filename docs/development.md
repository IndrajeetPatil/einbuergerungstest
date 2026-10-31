# Development

## Prerequisites

| Tool                                             | Why                                         |
| ------------------------------------------------ | ------------------------------------------- |
| Node 26 and [Vite+](https://viteplus.dev) (`vp`) | Runtime and toolchain; `vp` provisions pnpm |
| uv                                               | Python data pipeline, Ruff and ty           |
| poppler (`pdftotext`, `pdftoppm`)                | Only for `make data`                        |
| [prek](https://github.com/j178/prek)             | Git hooks                                   |

## Make targets

Run `make` for the full list with descriptions.

| Group       | Targets                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| Everyday    | `start`, `serve`, `open`, `dev`, `stats`                                           |
| Quality     | `check`, `fix`, `fmt`, `lint`, `typecheck`, `check-py`, `test`, `test-watch`, `ci` |
| Git hooks   | `hooks-install`, `hooks`, `hooks-push`                                             |
| Build       | `install`, `build`, `data`, `data-refresh`                                         |
| Progress    | `backup`, `export`, `reset-progress CONFIRM=yes`                                   |
| Maintenance | `outdated`, `update`, `doctor`, `clean`, `distclean`                               |

| Port | Server                                         |
| ---- | ---------------------------------------------- |
| 5178 | `make dev` (hot reload)                        |
| 5179 | `make start` / `make serve` (production build) |

## Checks

| Check                  | Tool                    | Run by                   |
| ---------------------- | ----------------------- | ------------------------ |
| Formatting             | Oxfmt                   | `make check`, pre-commit |
| Linting, type-aware    | Oxlint with tsgolint    | `make check`, pre-commit |
| Types                  | TypeScript 7 (`tsc -b`) | `make check`, pre-push   |
| Python lint and format | Ruff                    | `make check`, pre-commit |
| Python types           | ty                      | `make check`             |
| Unit tests             | Vitest via `vp test`    | `make test`, pre-push    |
| Production build       | Vite+ / Rolldown        | `make build`             |
| Commit messages        | conventional-pre-commit | commit-msg hook, CI      |

`make ci` runs `check`, `test` and `build` — exactly what the `QA` workflow
runs.

## Git workflow

```mermaid
flowchart LR
  Branch["Feature branch"] --> Hooks["prek hooks<br/>pre-commit · pre-push · commit-msg"]
  Hooks --> PR["Pull request"]
  PR --> CI["QA + Conventional Commits<br/>(pull requests only)"]
  CI --> Merge["Squash merge<br/>into main"]
```

| Rule                          | Detail                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit messages and PR titles | Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, …)                                                       |
| `main`                        | Protected by the `protected-main` ruleset: pull requests, squash merges only, `QA` and `Conventional Commits` required, no deletion or force-push |
| Workflows                     | Run on pull requests only; actions pinned to full commit SHAs; read-only token                                                                    |
| Merge settings                | Squash only, auto-merge allowed, branches deleted after merge                                                                                     |

## Versions

Each version has one source of truth.

| Tool           | Declared in                                                                         |
| -------------- | ----------------------------------------------------------------------------------- |
| Node           | `.node-version` (and a compatible `engines` in `package.json`)                      |
| pnpm           | `devEngines.packageManager` in `package.json`                                       |
| Vite+          | `catalog` in `pnpm-workspace.yaml`                                                  |
| Python         | `requires-python` in `scripts/build_data.py`, mirrored in `pyproject.toml`          |
| prek           | `minimum_prek_version` in `prek.toml` and `prek-version` in the commitlint workflow |
| GitHub Actions | Commit SHA plus `# vX.Y.Z` comment in each workflow                                 |

The [`update-deps` prompt](../.github/prompts/update-deps.md) walks through
upgrading all of them.

## Agent tooling

| Kind        | Files                                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conventions | [AGENTS.md](../AGENTS.md), imported by `CLAUDE.md`                                                                                                                                                                                     |
| Skills      | [`agent-browser`](../.agents/skills/agent-browser/SKILL.md), [`frontend-pr-screenshot`](../.agents/skills/frontend-pr-screenshot/SKILL.md)                                                                                             |
| Prompts     | [`address-review`](../.github/prompts/address-review.md), [`update-deps`](../.github/prompts/update-deps.md), [`simplify-codebase`](../.github/prompts/simplify-codebase.md), [`codex-security`](../.github/prompts/codex-security.md) |

## Design

The interface follows the
[indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md):
warm paper background, Fraunces headings, Hanken Grotesk text, one teal accent
for interaction, flat surfaces without shadows. Light mode only.
