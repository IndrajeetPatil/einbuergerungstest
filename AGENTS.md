# AGENTS.md

Bilingual (German | English) trainer for the Einbürgerungstest: a static React
app that keeps progress in the browser's IndexedDB and is published on GitHub
Pages. Start with the [README](README.md).

## Read the guidance relevant to your change

| Work                                       | Guidance                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Product overview and stack                 | [README](README.md)                                                                                                          |
| Components, request flow, API              | [Architecture](docs/architecture.md)                                                                                         |
| Stored progress, scoring, backups          | [Progress database](docs/progress-database.md)                                                                               |
| Commands, checks, hooks, CI, versions      | [Development](docs/development.md)                                                                                           |
| UI and styling                             | [DESIGN.md](DESIGN.md), which extends the [indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md) |
| Question data, pictures, sources           | [Question data](docs/question-data.md), `scripts/build_data.py`                                                              |
| Time-dependent answers (Aktuelles page)    | [Question data](docs/question-data.md#time-dependent-answers), `src/lib/currentAffairs.ts`                                   |
| Quiz rules (exam draw, smart mix, mastery) | [Quiz design](docs/quiz-design.md), `src/lib/quiz.ts`, `src/lib/session.ts`                                                  |
| Dependency, hook or Action upgrades        | [`update-deps` prompt](.github/prompts/update-deps.md)                                                                       |
| Search, AI and social metadata             | [Development](docs/development.md#search-ai-and-social-sharing)                                                              |
| Screenshots for a PR                       | [`frontend-pr-screenshot` skill](.agents/skills/frontend-pr-screenshot/SKILL.md)                                             |

## Commands

| Command | Purpose |
| --- | --- |
| `make install` | Install locked JavaScript and Python dependencies |
| `make start` | Build, serve on <http://localhost:5179> and open the browser |
| `make dev` | Vite+ dev server with hot reload on port 5178 |
| `make build-pages` | Build for GitHub Pages (`BASE_PATH=/einbuergerungstest/`) |
| `make ci` | Every static gate, unit tests and the build (no network) |
| `make test-e2e` | Playwright end-to-end tests with axe accessibility audits |
| `make security` | gitleaks, actionlint, zizmor, pnpm and uv audits |
| `make link-check` | lychee link check (network) |
| `make fix` | Write formatting and safe lint fixes |
| `make hooks` / `make hooks-push` | prek pre-commit / pre-push stages on all files |
| `make data` | Rebuild `catalogue.json` and pictures (needs poppler) |
| `make social-card` | Render `public/og-image.png` and the app icons |

Every gate is listed in [docs/development.md](docs/development.md#quality-gates).

## Before committing and pushing

- Run `make ci`, and `make test-e2e` for UI changes; both must pass. Run
  `make link-check` when links change and `make security` when workflows or
  dependencies change.
- Install hooks once with `make hooks-install`. Run `make hooks` and
  `make hooks-push` before opening a pull request. Never bypass hooks unless
  the user asks.
- Every commit and PR title is a Conventional Commit (`feat`, `fix`, `docs`,
  `refactor`, `test`, `build`, `ci`, `chore`, …). The commit-msg hook and the
  `Conventional Commits` workflow check structure only.
- `main` is protected by the `protected-main` ruleset: squash-merged pull
  requests with every workflow passing. Workflows run on pull requests only,
  except `Pages`, which deploys `main` to GitHub Pages.
- Keep the PR title and body in sync with the net diff. Never rewrite `main`.

## Gotchas

- Never hand-edit `src/data/catalogue.json` or `public/img/`; change
  `scripts/build_data.py` and run `make data`. The build cross-checks the BAMF
  PDF, answer key and explanations and must keep failing loudly on mismatches.
- There is no server. The app reaches progress only through `api` in
  `src/lib/api.ts`; changes are pure functions in `src/lib/progress.ts`, which
  judges every answer against the official key (never trust a caller's or a
  backup's `correct`), applied in one IndexedDB transaction by `progressDb.ts`.
- Keep the build static and base-path aware: no absolute `/…` URLs in the app
  (use `import.meta.env.BASE_URL`), hash routes only, and no feature that needs
  a server.
- `index.html` carries the same Google Analytics tag as every page of the
  indrapatil.com website and skips it on `localhost`/`127.0.0.1`; keep it in step
  with that site. Answers and progress are never sent anywhere.
- Third-party ("©") photos from the BAMF PDF never ship: add a free stand-in
  or a `WITHOUT_PICTURE` entry in `scripts/photos.py` and credit it in
  `THIRD-PARTY-NOTICES.md`.
- Never change the meaning of a stored field: bump `progress.version` or
  `DB_VERSION` and keep reading older documents and backups. Tests use a fresh
  browser context per test, never someone's real browser profile.
- Keep `docs/` in sync with behaviour changes; the README stays a short
  overview with at most a couple of diagrams.
- Keep the real exam format in `EXAM` (`src/lib/quiz.ts`): 30 general + 3
  state questions, 60 minutes, 17 to pass.
- Picture and number options keep catalogue order (`keepOrder`); everything
  else is shuffled per session.
- Follow [DESIGN.md](DESIGN.md): Fraunces for headings, Hanken Grotesk for
  text, the single teal accent for interaction, the fixed state hues, no box
  shadows, no opacity to de-emphasise text, no emoji in UI chrome. Keep its
  front matter in sync with `src/index.css`.
- Never put information in a native `title` attribute; its tooltip is
  hover-only. Show it visibly instead.
- Fix failures rather than weakening checks: every Oxlint category is an
  error, Ruff selects `ALL`, ty enables every rule, pyrefly needs 100% type
  coverage, fallow caps cyclomatic and cognitive complexity at 5, and coverage
  floors only rise. Add a narrow, commented exception only when a rule
  contradicts another or forbids a core idiom.
- Validate every external value with the Zod schemas in `src/lib/schemas.ts`
  (catalogue, store inputs, IndexedDB documents, backup files,
  `localStorage`); never use `as` casts.
- One React component per file (PascalCase); pure logic goes in `src/lib/`
  with unit tests. Each module ends with a single `export { … }` block.
- Use the `#components/*`, `#lib/*` and `#data/*` import aliases from
  `package.json` instead of `../` paths.
- Python imports are `lazy` (Python 3.15) and the data pipeline is a uv
  project in `scripts/` with its own lockfile.
- Quiz actions read the latest session through `latest()`, not the render's
  closure, so fast key presses build on each other.
- Every visible German string has an English counterpart (`Deutsch · English`).
  English copy uses British spelling; question text keeps the official wording.
- Use erasable TypeScript syntax only and `.ts` extensions in relative imports.
