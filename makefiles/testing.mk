##@ Tests

.PHONY: test
test: test-unit test-scripts ## Unit tests: TypeScript (Vitest) and Python (pytest)

.PHONY: test-unit
test-unit: node_modules ## Vitest unit tests with coverage floors
	$(VP) run test:unit

.PHONY: test-watch
test-watch: node_modules ## Vitest in watch mode
	$(VP) test watch

.PHONY: test-scripts
test-scripts: ## pytest suite of the data pipeline
	cd scripts && $(UV) run --locked pytest

.PHONY: test-e2e
test-e2e: node_modules ## Build, then Playwright end-to-end and axe accessibility tests
	$(VP) exec playwright test

# .lighthouserc.json audits http://127.0.0.1:5189/einbuergerungstest/, so the
# preview must serve the Pages build at that base path.
.PHONY: lighthouse
lighthouse: node_modules ## Lighthouse CI on the Pages build: five mobile runs, median asserted
	PAGES_BASE=$(PAGES_BASE) $(VP) run lighthouse
