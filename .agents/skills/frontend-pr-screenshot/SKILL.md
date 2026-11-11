---
name: frontend-pr-screenshot
description: >
  Capture screenshots of the Einbürgerungstest trainer and post them to the
  current GitHub pull request. Use when a user asks to post a PR screenshot,
  show the UI in a PR comment, verify visual changes in a PR, or include
  visual evidence after UI work.
allowed-tools: >
  Bash(gh:*), Bash(curl:*), Bash(agent-browser:*), Bash(lsof:*),
  Bash(node:*), Bash(make:*), Bash(sleep:*), Bash(seq:*), Bash(kill:*),
  Bash(date:*), Bash(mktemp:*), Bash(cat:*)
---

# frontend-pr-screenshot

Posts live screenshots of the app to the active pull request. Screenshots are
captured with agent-browser and uploaded to GitHub's **native attachment
storage** with `gh pr comment --attach` (gh ≥ 2.99.0).

## Hard rules

- Never commit screenshots or host them on a branch, gist, release asset or
  external image host. `gh pr comment --attach` is the only destination.
- Screenshots live in a temporary directory only.
- **Never capture the user's real progress.** Progress lives in the browser's
  IndexedDB, so always use a fresh agent-browser profile, never a personal one.

## Workflow

### Step 1 - Verify there is an open PR

```bash
PR_NUMBER=$(gh pr view --json number -q '.number' 2>/dev/null)
REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
```

If this fails, open the PR for the current branch first.

### Step 2 - Build and serve the app on port 5199

```bash
make build
SHOT_DIR=$(mktemp -d /tmp/pr-screenshots.XXXXXX)
vp preview --port 5199 > "$SHOT_DIR/server.log" 2>&1 &
SERVER_PID=$!
READY=0
for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:5199/ > /dev/null 2>&1 && READY=1 && break
  sleep 1
done
[ "$READY" -eq 1 ] || { echo "Preview did not start; see $SHOT_DIR/server.log"; exit 1; }
```

The dashboard needs a Bundesland before it shows anything beyond the picker:
choose one in the **Bundesland** select on first load.

For realistic charts, answer a few sessions through the UI first, or import a
backup file under **Ihre Daten · Your data** (build one with `toBackup` from
`src/lib/backup.ts`; the store functions in `src/lib/progress.ts` accept a
`now` for back-dated sessions).

### Step 3 - Capture screenshots

Load the CLI's own guide first (`agent-browser skills get core`), then:

```bash
agent-browser set viewport 1280 900
agent-browser open http://127.0.0.1:5199/
agent-browser screenshot --full "$SHOT_DIR/dashboard-desktop.png"

agent-browser set viewport 390 844
agent-browser open http://127.0.0.1:5199/
agent-browser screenshot --full "$SHOT_DIR/dashboard-mobile.png"
```

Drive interactive states before capturing them, for example practice feedback:

```bash
agent-browser set viewport 1280 900
agent-browser open http://127.0.0.1:5199/
agent-browser find role button click --name "Start practice"
agent-browser wait --text "Prüfen · Check"   # the session starts after an API call
agent-browser press 1
agent-browser press Enter
agent-browser wait --text "Weiter · Next"
agent-browser screenshot --full "$SHOT_DIR/practice-feedback.png"
```

Useful states: dashboard, practice question, practice feedback, mock exam with
the overview grid, submit dialog, results, and the `#katalog` catalogue view.

### Step 4 - Post the comment with the screenshots attached

Pass one `--attach '<path>#<alt text>'` per file and reference the **same path**
in the body; gh swaps it for the uploaded `user-attachments` URL.

```bash
gh pr comment "$PR_NUMBER" \
  --attach "$SHOT_DIR/dashboard-desktop.png#Dashboard (desktop)" \
  --attach "$SHOT_DIR/dashboard-mobile.png#Dashboard (mobile)" \
  --body "$(cat <<EOF
## Snapshots

### Dashboard
| Desktop | Mobile |
|---|---|
| ![Dashboard (desktop)]($SHOT_DIR/dashboard-desktop.png) | ![Dashboard (mobile)]($SHOT_DIR/dashboard-mobile.png) |

Captured from a throwaway database — $(date -u '+%Y-%m-%d %H:%M UTC')
EOF
)"
```

Use before/after pairs in a table when the PR changes existing UI. Always
start the comment with `## Snapshots`; Step 5 relies on it.

### Step 5 - Mark superseded snapshot comments as outdated

```bash
gh api --paginate "repos/${REPO}/issues/${PR_NUMBER}/comments" \
  --jq '[.[] | select(.body | startswith("## Snapshots"))][:-1] | .[].node_id' |
while read -r NODE_ID; do
  gh api graphql \
    -f query='mutation($id: ID!) {
      minimizeComment(input: {subjectId: $id, classifier: OUTDATED}) {
        minimizedComment { isMinimized }
      }
    }' -f id="$NODE_ID"
done
```

Only comments starting with `## Snapshots` are minimised; never touch human
discussion. Re-running is harmless.

### Step 6 - Clean up

```bash
kill "$SERVER_PID" 2>/dev/null || true
```

## Troubleshooting

| Symptom                                    | Fix                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `gh pr view` fails                         | Open a PR for the current branch first.                                                                                    |
| `unknown flag: --attach`                   | Upgrade GitHub CLI to ≥ 2.99.0 (`gh --version`).                                                                           |
| Image missing from the table               | The body path did not match the `--attach` path exactly.                                                                   |
| Server exits immediately                   | Port 5199 is taken (`lsof -ti:5199`); pick another port everywhere.                                                        |
| Dashboard shows only the state picker      | Choose a Bundesland first, as in Step 2.                                                                                   |
| Blank page or missing assets               | Run `make build` before starting the preview.                                                                              |
| `wait --text` times out on a visible label | It matches rendered text, so CSS-uppercased labels (`Warum · Why`) read as `WARUM · WHY`; wait for a button label instead. |
