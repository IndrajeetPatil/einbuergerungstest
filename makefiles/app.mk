##@ App

node_modules: package.json pnpm-lock.yaml
	$(VP) install
	@touch node_modules

.PHONY: install
install: ## Install JavaScript and Python dependencies from the lockfiles
	$(VP) install --frozen-lockfile
	cd scripts && $(UV) sync --locked

.PHONY: start
start: build ## Build, serve on localhost:5179 and open the browser
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

.PHONY: build
build: node_modules ## Production build into dist/
	$(VP) build

.PHONY: stats
stats: ## Print recent mock-exam scores in the terminal
	$(NODE) server/cli.ts stats

.PHONY: backup
backup: ## Snapshot the progress database into data/backups/
	$(NODE) server/cli.ts backup

.PHONY: export
export: ## Export all sessions and answers as JSON into data/exports/
	$(NODE) server/cli.ts export

.PHONY: reset-progress
reset-progress: ## Delete all progress, keeping a backup (needs CONFIRM=yes; stop the app first)
	@if [ "$(CONFIRM)" != "yes" ]; then echo "Refusing: run 'make reset-progress CONFIRM=yes'"; exit 1; fi
	$(NODE) server/cli.ts reset --yes

.PHONY: outdated
outdated: ## List outdated JavaScript dependencies
	$(VP) outdated

.PHONY: update
update: ## Update JavaScript and Python dependencies and frozen hook revisions
	$(VP) update --latest
	$(VP) install
	cd scripts && $(UV) lock --upgrade
	$(MAKE) hooks-update

.PHONY: doctor
doctor: ## Show toolchain versions
	@echo "node   $$($(NODE) --version)"
	@$(VP) --version | head -1
	@echo "pnpm   $$(pnpm --version)"
	@$(UV) --version
	@printf "poppler "; pdftotext -v 2>&1 | head -1

.PHONY: clean
clean: ## Remove build output, reports and caches (keeps your progress)
	rm -rf dist coverage .fallow playwright-report test-results .cache node_modules/.vite node_modules/.tmp

.PHONY: distclean
distclean: clean ## Also remove node_modules and the Python environment (keeps your progress)
	rm -rf node_modules scripts/.venv
