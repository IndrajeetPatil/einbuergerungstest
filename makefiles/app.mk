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
	$(VP) preview --port $(PORT) --open

.PHONY: serve
serve: node_modules ## Serve the existing build on localhost:5179 (no rebuild)
	$(VP) preview --port $(PORT)

.PHONY: open
open: ## Open the running app in the browser
	open $(URL)

.PHONY: dev
dev: node_modules ## Start the Vite+ dev server with hot reload (port 5178)
	$(VP) dev --open

.PHONY: build
build: node_modules ## Production build into dist/
	$(VP) build

.PHONY: build-pages
build-pages: node_modules ## Build for GitHub Pages, served from $(PAGES_BASE)
	BASE_PATH=$(PAGES_BASE) $(VP) build

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
clean: ## Remove build output, reports and caches
	rm -rf dist coverage .fallow playwright-report test-results .cache node_modules/.vite node_modules/.tmp

.PHONY: distclean
distclean: clean ## Also remove node_modules and the Python environment
	rm -rf node_modules scripts/.venv
