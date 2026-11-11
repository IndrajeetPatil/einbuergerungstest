# Contributing

Thanks for helping. This project is a study app that runs in the browser, so
most contributions are fixes to the quiz, the data pipeline or the docs.

## Use it for your own exam

Open the [published app](https://indrajeetpatil.github.io/einbuergerungstest/),
or run it yourself:

1. Fork or clone the repository.
2. Install the [prerequisites](docs/development.md#prerequisites).
3. Run `make install`, then `make start`.
4. Pick your Bundesland and set your exam date in **Einstellungen · Settings**.

Your progress lives in your browser's IndexedDB; nothing leaves your machine.
Export a backup under **Ihre Daten · Your data** now and then.

## Make a change

1. Create a branch from `main`.
2. Run `make hooks-install` once, so formatting, linting and commit-message
   checks run on every commit and push.
3. Make the change, keeping [AGENTS.md](AGENTS.md) and the
   [documentation](docs/) in sync with it.
4. Run `make ci` and, for UI changes, `make test-e2e`.
5. Commit with a [Conventional Commit](https://www.conventionalcommits.org/)
   message, such as `fix(quiz): keep flagged questions after reload`.
6. Open a pull request; every workflow must pass before it can be merged.

## Standards

| Area | Bar |
| --- | --- |
| TypeScript | Every Oxlint category as errors, strictest `tsconfig`, complexity ≤ 5 |
| Python | Ruff `ALL` (preview), ty with every rule, 100% type coverage |
| Tests | Coverage floors only rise; end-to-end tests audit accessibility (WCAG 2.2 AA) |
| Copy | German paired with English; English in British spelling |
| Design | The [design notes](docs/development.md#design), checked in light and dark mode |

See [docs/development.md](docs/development.md) for every command and check.
