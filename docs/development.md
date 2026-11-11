# Development

## Prerequisites

| Tool | Why |
| --- | --- |
| Node 26 and [Vite+](https://viteplus.dev) (`vp`) | Runtime and toolchain; `vp` provisions pnpm |
| [uv](https://docs.astral.sh/uv/) | Python data pipeline and its tools (Ruff, ty, pyrefly, pytest) |
| poppler (`pdftotext`, `pdftoppm`) | Only for `make data` |
| [prek](https://github.com/j178/prek) | Git hooks (run through `uv tool run`) |
| typos, lychee, gitleaks | Spelling, links and secret scanning |
| Docker | Pinned actionlint, gitleaks and Playwright images |

Run `make install` once, then `make hooks-install`.

## Make targets

Run `make` for the full list with descriptions.

| Group | Targets |
| --- | --- |
| App | `start`, `serve`, `open`, `dev`, `build`, `build-pages`, `social-card` |
| Quality | `qa`, `qa-js`, `qa-python`, `lint`, `typecheck`, `fallow`, `css-quality`, `file-naming`, `lint-markdown`, `spell-check`, `link-check`, `format`, `fix`, `ci` |
| Tests | `test`, `test-unit`, `test-watch`, `test-scripts`, `test-e2e`, `test-e2e-docker` |
| Security | `security`, `secret-scan`, `workflow-lint`, `workflow-audit`, `audit-js`, `audit-python` |
| Hooks | `hooks-install`, `hooks`, `hooks-push`, `hooks-update` |
| Data | `data`, `data-refresh` |
| Maintenance | `install`, `outdated`, `update`, `doctor`, `clean`, `distclean` |

| Port | Server |
| --- | --- |
| 5178 | `make dev` (hot reload) |
| 5179 | `make start` / `make serve` (production build) |
| 5199 | End-to-end tests and screenshots (fresh browser storage per test) |

## Quality gates

The bar matches [indrajeetpatil.github.io](https://github.com/IndrajeetPatil/indrajeetpatil.github.io): every rule on,
with narrow exceptions explained next to their configuration.

| Gate | Tool and policy | Make target |
| --- | --- | --- |
| File naming | ls-lint: kebab-case, PascalCase components, camelCase modules, snake_case Python | `file-naming` |
| Formatting | Oxfmt (80 columns, sorted imports); Ruff format | `lint`, `lint-python` |
| TypeScript lint | Oxlint, type-aware, **every category as errors**, 12 plugins, complexity ≤ 5, warnings fail | `lint` |
| Types | TypeScript 7 with the strictest options (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, …) | `typecheck` |
| Boundaries | Zod schemas validate the catalogue, store inputs, IndexedDB documents, backup files and `localStorage` | — |
| Unit tests | Vitest, shuffled order, coverage floors that only rise | `test-unit` |
| Dead code and health | fallow: unused files, exports and dependencies, duplication, cyclomatic and cognitive ≤ 5, CRAP ≤ 21 | `fallow` |
| CSS | Project Wallace: maintainability ≥ 98, complexity 100 | `css-quality` |
| Python lint | Ruff `ALL` with preview, mccabe ≤ 5, lazy imports required | `lint-python` |
| Python types | ty with every rule; pyrefly 100% type coverage | `typecheck-python`, `typecoverage-python` |
| Python tests | pytest strict mode, warnings as errors | `test-scripts` |
| End to end | Playwright on desktop and mobile, axe WCAG 2.2 AA audit of every screen | `test-e2e` |
| Markdown | rumdl | `lint-markdown` |
| Spelling | typos, British English | `spell-check` |
| Links | lychee | `link-check` |
| Secrets | gitleaks over the whole history | `secret-scan` |
| Workflows | actionlint (syntax and shell), zizmor (security) | `workflow-lint`, `workflow-audit` |
| Dependencies | pnpm audit, uv audit | `audit-js`, `audit-python` |

`make ci` runs everything the pull-request workflows run except end-to-end
tests and security, which have their own targets.

## Git workflow

```mermaid
flowchart LR
  Branch["Feature branch"] --> Hooks["prek hooks<br/>pre-commit · pre-push · commit-msg"]
  Hooks --> PR["Pull request"]
  PR --> CI["QA · E2E · Docs · Data pipeline<br/>Hooks · Security · Commit conventions"]
  CI --> Merge["Squash merge<br/>into main"]
```

| Hook stage | Runs |
| --- | --- |
| pre-commit | Ruff, rumdl, typos, ls-lint, Oxfmt + Oxlint, file hygiene |
| pre-push | TypeScript and Python types, unit tests |
| commit-msg | Conventional Commits (strict) |

| Rule | Detail |
| --- | --- |
| Commit messages and PR titles | Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, …) |
| `main` | `protected-main` ruleset: pull requests, squash merges only, every workflow's check required, no deletion or force-push |
| Workflows | Pull requests only, except `Pages`, which deploys `main` to GitHub Pages; actions pinned to full commit SHAs; least-privilege tokens; no persisted credentials |
| Merge settings | Squash only, auto-merge allowed, branches deleted after merge |

## Versions

Each version has one source of truth.

| Tool | Declared in |
| --- | --- |
| Node | `.node-version` (and a compatible `engines` in `package.json`) |
| pnpm | `devEngines.packageManager` in `package.json` |
| Vite+ | `catalog` in `pnpm-workspace.yaml`, plus `VP_VERSION` and checksums in `scripts/install-vp.sh` |
| Python and its tools | `scripts/pyproject.toml`, locked in `scripts/uv.lock` |
| Playwright image | `.github/workflows/e2e.yml` and `makefiles/testing.mk`, matching `@playwright/test` |
| prek | `PREK_VERSION` in `makefiles/hooks.mk`, `minimum_prek_version` in `prek.toml`, `prek-version` in the workflows |
| rumdl, zizmor, actionlint, gitleaks | `makefiles/quality.mk`, `makefiles/security.mk` |
| GitHub Actions | Commit SHA plus `# vX.Y.Z` comment in each workflow |

The [`update-deps` prompt](../.github/prompts/update-deps.md) walks through
upgrading all of them.

## Agent tooling

| Kind | Files |
| --- | --- |
| Conventions | [AGENTS.md](../AGENTS.md), imported by `CLAUDE.md` |
| Skills | [`agent-browser`](../.agents/skills/agent-browser/SKILL.md), [`frontend-pr-screenshot`](../.agents/skills/frontend-pr-screenshot/SKILL.md) |
| Prompts | [`address-review`](../.github/prompts/address-review.md), [`update-deps`](../.github/prompts/update-deps.md), [`simplify-codebase`](../.github/prompts/simplify-codebase.md), [`codex-security`](../.github/prompts/codex-security.md) |

## Design

The interface follows [DESIGN.md](../DESIGN.md), which extends the
[indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md):
warm paper background, Fraunces headings, Hanken Grotesk text, one teal accent
for interaction, flat surfaces without shadows, in light and dark modes.

## Publishing

`.github/workflows/pages.yml` deploys every push to `main` (or a manual run) to
GitHub Pages: it builds with `make build-pages`, which sets `BASE_PATH` to
`/<repository>/`, and deploys `dist/` with the official Pages actions. The
account's custom domain serves it at
<https://www.indrapatil.com/einbuergerungstest/>. `index.html` loads the same
Google Analytics tag as the rest of that site, except on `localhost` and
`127.0.0.1`, so local runs and tests send nothing. Turn it
on once under **Settings → Pages → Source: GitHub Actions**.

To check a Pages build locally:

```sh
make build-pages
BASE_PATH=/einbuergerungstest/ vp preview   # http://localhost:5179/einbuergerungstest/
```

## Search, AI and social sharing

The app renders in the browser, so everything crawlers, AI assistants and
social networks read is static and lives in `index.html` and `public/`.
`tests/e2e/seo.spec.ts` checks it.

| What | Where |
| --- | --- |
| Title, description, canonical URL, `robots`, `format-detection` | `index.html` head |
| Open Graph and Twitter card (`summary_large_image`) | `index.html` head, image `public/og-image.png` (1200 × 630) |
| `WebApplication` and `BreadcrumbList` structured data (JSON-LD) | `index.html` head |
| Summary for readers and crawlers without JavaScript | `<noscript>` in `index.html` |
| [llms.txt](https://llmstxt.org/) for AI assistants | `public/llms.txt`, linked with `rel="describedby"` |
| Sitemap | `public/sitemap.xml`, one URL: views are hash routes |
| Web app manifest and icons | `public/site.webmanifest`, `public/icon-*.png`, `public/apple-touch-icon.png` |
| Not-found page (`noindex`, links back to the app, `llms.txt` and the sitemap) | `public/404.html`, which GitHub Pages serves with a 404 status |

`make social-card` renders the card and the icons from
`scripts/social-card.mjs` with Playwright's Chromium; rerun it and commit the
images after changing their copy, the favicon or the design tokens. Keep the head, the
`<noscript>` summary and `llms.txt` in step with the README's feature list.
Absolute URLs in the head point at <https://www.indrapatil.com/einbuergerungstest/>;
Vite prefixes root-relative links with the base path. `public/` is copied
verbatim, so `404.html` uses absolute URLs and the manifest relative ones. The
structured data follows indrapatil.com's: the author is its `#person` node and
the page has no `dateModified`.

Crawlers read `robots.txt` only at the domain root, which
[indrajeetpatil.github.io](https://github.com/IndrajeetPatil/indrajeetpatil.github.io)
publishes, so this app ships none.
