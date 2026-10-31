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
| UI and styling                             | [indrapatil.com DESIGN.md](https://github.com/IndrajeetPatil/indrajeetpatil.github.io/blob/main/DESIGN.md) (light mode only) |
| Question data, pictures, sources           | [Question data](docs/question-data.md), `scripts/build_data.py`                                                              |
| Quiz rules (exam draw, smart mix, mastery) | [Quiz design](docs/quiz-design.md), `src/lib/quiz.ts`, `src/lib/session.ts`                                                  |
| Dependency, hook or Action upgrades        | [`update-deps` prompt](.github/prompts/update-deps.md)                                                                       |
| Screenshots for a PR                       | [`frontend-pr-screenshot` skill](.agents/skills/frontend-pr-screenshot/SKILL.md)                                             |

## Commands

| Command                          | Purpose                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| `make start`                     | Build, serve on <http://localhost:5179> and open the browser |
| `make dev`                       | Vite+ dev server with hot reload on port 5178                |
| `make ci`                        | Everything the QA workflow runs: `check`, `test`, `build`    |
| `make check`                     | Oxfmt, Oxlint (type-aware), tsgo, Ruff and ty                |
| `make fix`                       | Write formatting and safe lint fixes                         |
| `make test`                      | Vitest unit tests (quiz logic and SQLite store)              |
| `make hooks` / `make hooks-push` | prek pre-commit / pre-push stages on all files               |
| `make data`                      | Rebuild `catalogue.json` and pictures (needs poppler and uv) |

## Before committing and pushing

- Run `make ci`; it must pass. `make check` only verifies, `make fix` writes.
- Install hooks once with `make hooks-install`. Run `make hooks` and
  `make hooks-push` before opening a pull request.
- Every commit and PR title is a Conventional Commit (`feat`, `fix`, `docs`,
  `refactor`, `test`, `build`, `ci`, `chore`, …). The commit-msg hook and the
  `Conventional Commits` workflow check structure only.
- `main` is protected by the `protected-main` ruleset: squash-merged pull
  requests with passing `QA` and `Conventional Commits` checks. Workflows run
  on pull requests only.
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
- Follow DESIGN.md: Fraunces for headings, Hanken Grotesk for text, the single
  teal accent for interaction, no box shadows, no opacity to de-emphasise text,
  no emoji in UI chrome.
- Never put information in a native `title` attribute; its tooltip is
  hover-only. Show it visibly instead.
- Every visible German string has an English counterpart (`Deutsch · English`).
  English copy uses British spelling; question text keeps the official wording.
- Node 26 runs `server/*.ts` directly (type stripping): use erasable syntax only
  and `.ts` extensions in relative imports.
