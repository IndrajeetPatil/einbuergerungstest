# AGENTS.md

Local, bilingual (German | English) trainer for the Einbürgerungstest: a React
app served by a small Node server that stores progress in SQLite. Start with
the [README](README.md).

## Read the guidance relevant to your change

| Work                                       | Guidance                                                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Product overview and stack                 | [README](README.md)                                                                                                          |
| Components, request flow, API              | [Architecture](docs/architecture.md)                                                                                         |
| Schema, scoring, migrations, backups       | [Progress database](docs/progress-database.md)                                                                               |
| Commands, checks, hooks, CI, versions      | [Development](docs/development.md)                                                                                           |
| UI and styling                             | [DESIGN.md](DESIGN.md), which extends the [indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md) |
| Question data, pictures, sources           | [Question data](docs/question-data.md), `scripts/build_data.py`                                                              |
| Time-dependent answers (Aktuelles page)    | [Question data](docs/question-data.md#time-dependent-answers), `src/lib/currentAffairs.ts`                                   |
| Quiz rules (exam draw, smart mix, mastery) | [Quiz design](docs/quiz-design.md), `src/lib/quiz.ts`, `src/lib/session.ts`                                                  |
| Dependency, hook or Action upgrades        | [`update-deps` prompt](.github/prompts/update-deps.md)                                                                       |
| Screenshots for a PR                       | [`frontend-pr-screenshot` skill](.agents/skills/frontend-pr-screenshot/SKILL.md)                                             |

## Commands

| Command | Purpose |
| --- | --- |
| `make install` | Install locked JavaScript and Python dependencies |
| `make start` | Build, serve on <http://localhost:5179> and open the browser |
| `make dev` | Vite+ dev server with hot reload on port 5178 |
| `make ci` | Every static gate, unit tests and the build (no network) |
| `make test-e2e` | Playwright end-to-end tests with axe accessibility audits |
| `make security` | gitleaks, actionlint, zizmor, pnpm and uv audits |
| `make link-check` | lychee link check (network) |
| `make fix` | Write formatting and safe lint fixes |
| `make hooks` / `make hooks-push` | prek pre-commit / pre-push stages on all files |
| `make data` | Rebuild `catalogue.json` and pictures (needs poppler) |

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
  requests with every workflow passing. Workflows run on pull requests only.
- Keep the PR title and body in sync with the net diff. Never rewrite `main`.

## Gotchas

- Never hand-edit `src/data/catalogue.json` or `public/img/`; change
  `scripts/build_data.py` and run `make data`. The build cross-checks the BAMF
  PDF, answer key and explanations and must keep failing loudly on mismatches.
- The server, not the browser, judges correctness against the official answer
  key. Keep the API in `server/api.ts` as the single handler for `vp dev`,
  `vp preview` and `server/serve.ts`.
- `data/` holds the user's personal progress (git-ignored). Never commit, reset
  or overwrite it; tests and screenshots use `LID_DB=/tmp/….sqlite` or
  `:memory:`.
- Schema changes go in a new entry of `MIGRATIONS` in `server/db.ts`; never
  edit an applied migration.
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
  (catalogue, API bodies, SQLite rows, `localStorage`); never use `as` casts.
- One React component per file (PascalCase); pure logic goes in `src/lib/`
  with unit tests. Each module ends with a single `export { … }` block.
- Use the `#components/*`, `#lib/*`, `#data/*` and `#server/*` import aliases
  from `package.json` instead of `../` paths; Node resolves them natively.
- Python imports are `lazy` (Python 3.15) and the data pipeline is a uv
  project in `scripts/` with its own lockfile.
- Quiz actions read the latest session through `latest()`, not the render's
  closure, so fast key presses build on each other.
- Every visible German string has an English counterpart (`Deutsch · English`).
  English copy uses British spelling; question text keeps the official wording.
- Node 26 runs `server/*.ts` directly (type stripping): use erasable syntax only
  and `.ts` extensions in relative imports.
