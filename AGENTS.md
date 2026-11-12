# AGENTS.md

Bilingual (German | English) trainer for the Einbürgerungstest: a static React
app that keeps progress in the browser's IndexedDB and is published on GitHub
Pages. Start with the [README](README.md).

## Guidance by area

| Work | Read |
| --- | --- |
| Components, request flow, API | [Architecture](docs/architecture.md) |
| Stored progress, scoring, backups | [Progress database](docs/progress-database.md) |
| Commands, quality gates, hooks, CI, versions, metadata | [Development](docs/development.md) |
| UI and styling | [DESIGN.md](DESIGN.md) |
| Question data, pictures, time-dependent answers | [Question data](docs/question-data.md) |
| Quiz rules (exam draw, smart mix, mastery) | [Quiz design](docs/quiz-design.md) |
| Dependency, hook or Action upgrades | [`update-deps` prompt](.github/prompts/update-deps.md) |

## Setup and commands

On a fresh machine, install the pinned Vite+ CLI with
`scripts/install-vp.sh`, put `~/.vite-plus/bin` on `PATH` and run
`vp env setup && vp env on` so Node and pnpm come from Vite+, not the system.
The data pipeline needs Python 3.15 through uv. Then run `make install` and
`make hooks-install`. `make` lists every target.

| Command | Run it |
| --- | --- |
| `make ci` | Before every push: every static gate, unit tests and the build |
| `make test-e2e` | For UI changes: Playwright with axe audits |
| `make hooks` and `make hooks-push` | Before opening a pull request |
| `make security` | When workflows or dependencies change |
| `make link-check` | When links change |
| `make fix` | To write formatting and safe lint fixes |

Fix failures rather than weakening a check: coverage floors only rise, and an
exception is narrow, commented and only for a rule that contradicts another
or forbids a core idiom. Never bypass hooks unless the user asks.

## Invariants

These are not caught by the gates, or the reason matters when they fire.

- `src/data/catalogue.json` and `public/img/` are generated: change
  `scripts/build_data.py` and run `make data`. The build cross-checks the BAMF
  PDF, answer key and explanations, and must keep failing loudly on
  mismatches.
- There is no server. Progress goes only through `api` in `src/lib/api.ts`;
  changes are pure functions in `src/lib/progress.ts`, which judges every
  answer against the official key (never a caller's or a backup's `correct`),
  applied in one IndexedDB transaction by `progressDb.ts`.
- The build stays static and base-path aware: no absolute `/…` URLs (use
  `import.meta.env.BASE_URL`), hash routes only.
- Never change the meaning of a stored field: bump `progress.version` or
  `DB_VERSION` and keep reading older documents and backups.
- Tests and screenshots use a fresh browser profile, never someone's real
  progress.
- Validate every external value (catalogue, store inputs, IndexedDB
  documents, backup files, `localStorage`) with the Zod schemas in
  `src/lib/schemas.ts` rather than asserting its type.
- `EXAM` in `src/lib/quiz.ts` is the real exam format: 30 general + 3 state
  questions, 60 minutes, 17 to pass.
- Picture and number options keep catalogue order (`keepOrder`); other
  options are shuffled per session.
- Quiz actions read the session through `latest()`, not the render's closure,
  so fast key presses build on each other.
- Third-party ("©") photos from the BAMF PDF never ship: add a free stand-in
  or a `WITHOUT_PICTURE` entry in `scripts/photos.py` and credit it in
  `THIRD-PARTY-NOTICES.md`.
- `index.html` carries the indrapatil.com Google Analytics tag, skipped on
  `localhost` and `127.0.0.1`; keep it in step with that site. Answers and
  progress are never sent anywhere.
- Every visible German string has an English counterpart
  (`Deutsch · English`) in British spelling; question text keeps the official
  wording.
- Follow [DESIGN.md](DESIGN.md) (fonts, the single teal accent, fixed state
  hues, no shadows, no opacity to de-emphasise text, no emoji in UI chrome)
  and keep its front matter in sync with `src/index.css`.
- Never put information in a native `title` attribute; its tooltip is
  hover-only.
- Pure logic lives in `src/lib/` with unit tests. Each module ends with a
  single `export { … }` block, and relative imports carry the `.ts`
  extension.
- Keep `docs/` in sync with behaviour changes; the README stays a short
  overview.

## Pull requests

- Commit messages and PR titles are Conventional Commits. Keep the PR title
  and body in sync with the net diff.
- `main` is protected: squash merges of pull requests whose every workflow
  passes on a branch up to date with `main`. Never rewrite `main`. To catch
  up, rebase onto `origin/main` and push with `--force-with-lease`; GitHub's
  "Update branch" adds a merge commit that fails the commit check.
- Open pull requests ready for review, not as drafts.
- A PR that changes frontend source (`src/`, `index.html`), even a
  behaviour-only refactor, needs screenshots from the
  [`frontend-pr-screenshot` skill](.agents/skills/frontend-pr-screenshot/SKILL.md),
  checked to render on the PR.
- The task ends at the merge, not at opening the PR. After each push, fix
  every failing workflow, then get a Codex review of the current head:
  comment `@codex review`, fix merited findings, and reply to and resolve the
  threads you addressed. Repeat until every workflow passes and Codex gives
  the current head a thumbs-up with no unresolved findings.
- If Codex reports exhausted usage, stop requesting reviews, leave the PR
  open and report it; no other reviewer or silence counts as approval.
- Then recheck the head, checks and threads, and squash-merge with
  `gh pr merge --squash --match-head-commit <sha>`.
