# Einbürgerungstest trainer — common chores.  Run `make` to list targets.

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
MAKEFLAGS += --no-print-directory

PORT     ?= 5179
URL      := http://localhost:$(PORT)/
NODE     ?= node
UV       ?= uv
VP       ?= vp
RUFF     ?= $(UV) tool run ruff
PY_SCRIPT := scripts/build_data.py

##@ Everyday

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n"} \
	  /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 } \
	  /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

.PHONY: start
start: build ## Build and serve the app on localhost:5179 and open it
	$(NODE) server/serve.ts --port $(PORT) --open

.PHONY: serve
serve: ## Serve the existing build on localhost:5179 (no rebuild)
	$(NODE) server/serve.ts --port $(PORT)

.PHONY: open
open: ## Open the running app in the browser
	open $(URL)

.PHONY: dev
dev: node_modules ## Start the Vite+ dev server with hot reload (port 5178)
	$(VP) dev --open

.PHONY: stats
stats: ## Print recent mock-exam scores in the terminal
	$(NODE) server/cli.ts stats

##@ Quality

.PHONY: check
check: node_modules ## Format check, lint and type-check everything (Oxfmt, Oxlint, tsgo, Ruff, ty)
	$(VP) check
	$(VP) exec tsc -b
	$(MAKE) check-py

.PHONY: fix
fix: node_modules ## Auto-format and apply safe lint fixes
	$(VP) check --fix
	$(RUFF) format scripts
	$(RUFF) check --fix scripts

.PHONY: fmt
fmt: node_modules ## Format all code
	$(VP) fmt
	$(RUFF) format scripts

.PHONY: lint
lint: node_modules ## Lint only
	$(VP) lint
	$(RUFF) check scripts

.PHONY: typecheck
typecheck: node_modules ## Type-check only (TypeScript 7 / tsgo)
	$(VP) exec tsc -b

.PHONY: check-py
check-py: ## Lint, format-check and type-check the Python data pipeline
	$(RUFF) check scripts
	$(RUFF) format --check scripts
	$(UV) sync --quiet --script $(PY_SCRIPT)
	$(UV) tool run ty@latest check --python "$$($(UV) python find --script $(PY_SCRIPT))" scripts

.PHONY: test
test: node_modules ## Run unit tests (Vitest via Vite+)
	$(VP) test

.PHONY: test-watch
test-watch: node_modules ## Run unit tests in watch mode
	$(VP) test watch

.PHONY: ci
ci: check test build ## Everything CI would run

.PHONY: hooks-install
hooks-install: ## Install the prek git hooks (pre-commit, pre-push, commit-msg)
	prek install

.PHONY: hooks
hooks: ## Run the pre-commit hooks on all tracked files
	prek run --all-files

.PHONY: hooks-push
hooks-push: ## Run the pre-push hooks on all tracked files
	prek run --all-files --hook-stage pre-push

##@ Build

node_modules: package.json pnpm-lock.yaml
	$(VP) install
	@touch node_modules

.PHONY: install
install: ## Install JavaScript dependencies
	$(VP) install

.PHONY: build
build: node_modules ## Production build into dist/
	$(VP) build

.PHONY: data
data: ## Rebuild the question catalogue and pictures from the pinned sources
	$(UV) run --script $(PY_SCRIPT)

.PHONY: data-refresh
data-refresh: ## Re-download the sources, then rebuild (detects a new BAMF edition)
	$(UV) run --script $(PY_SCRIPT) --refresh

##@ Progress database (data/progress.sqlite)

.PHONY: backup
backup: ## Snapshot the progress database into data/backups/
	$(NODE) server/cli.ts backup

.PHONY: export
export: ## Export all sessions and answers as JSON into data/exports/
	$(NODE) server/cli.ts export

.PHONY: reset-progress
reset-progress: ## Delete all progress (keeps a backup). Needs CONFIRM=yes
	@if [ "$(CONFIRM)" != "yes" ]; then echo "Refusing: run 'make reset-progress CONFIRM=yes'"; exit 1; fi
	$(NODE) server/cli.ts reset --yes

##@ Maintenance

.PHONY: outdated
outdated: ## List outdated JavaScript dependencies
	$(VP) outdated

.PHONY: update
update: ## Update JavaScript dependencies to their latest versions
	$(VP) update --latest
	$(VP) install

.PHONY: doctor
doctor: ## Show toolchain versions
	@echo "node   $$($(NODE) --version)"
	@$(VP) --version | head -1
	@echo "pnpm   $$(pnpm --version)"
	@$(UV) --version
	@$(RUFF) --version
	@printf "poppler "; pdftotext -v 2>&1 | head -1

.PHONY: clean
clean: ## Remove build output and tool caches (keeps your progress)
	rm -rf dist node_modules/.vite node_modules/.tmp .cache

.PHONY: distclean
distclean: clean ## Also remove node_modules (keeps your progress)
	rm -rf node_modules
