# Security policy

The app runs on your own computer: its server listens on `127.0.0.1` only and
stores progress in a local SQLite file. Even so, please report problems.

## Reporting a vulnerability

- Use GitHub's **Report a vulnerability** button on the repository's
  **Security** tab, so the report stays private until it is fixed.
- Include the steps to reproduce and the affected version or commit.
- Expect an answer within a week.

Please do not open a public issue for security problems.

## What is in scope

- The local server and API (`server/`)
- The data pipeline's handling of downloaded sources (`scripts/`)
- The GitHub workflows (`.github/workflows/`)
