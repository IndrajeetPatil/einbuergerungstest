# Security policy

The app is a set of static files: it runs entirely in your browser, has no
server or accounts, and stores progress only in the browser's IndexedDB. Even
so, please report problems.

## Reporting a vulnerability

- Use GitHub's **Report a vulnerability** button on the repository's
  **Security** tab, so the report stays private until it is fixed.
- Include the steps to reproduce and the affected version or commit.
- Expect an answer within a week.

Please do not open a public issue for security problems.

## What is in scope

- The app, including the progress store and backup import (`src/`)
- The data pipeline's handling of downloaded sources (`scripts/`)
- The GitHub workflows (`.github/workflows/`), including the Pages deployment
