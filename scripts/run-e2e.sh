#!/usr/bin/env bash
set -euo pipefail

# Runs inside the pinned Playwright image, for both `make test-e2e-docker` and
# the E2E workflow, so local and CI runs use the same Node, pnpm and steps.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

# Vite+ provisions Node from .node-version and pnpm from devEngines; a
# persistent VP_HOME (a named volume locally) caches them between runs.
export VP_HOME="${VP_HOME:-$HOME/.vite-plus}"
export PATH="$VP_HOME/bin:$PATH"
export VP_SELF_SETUP_NO_MODIFY_PATH=1
bash scripts/install-vp.sh
vp install --frozen-lockfile
vp run test:e2e "$@"
