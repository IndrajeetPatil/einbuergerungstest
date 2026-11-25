##@ Tests

# Pinned Playwright image for CI-identical end-to-end runs. Keep the tag and
# digest in lockstep with @playwright/test in package.json and e2e.yml.
PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579

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
	$(VP) run test:e2e

# .lighthouserc.json audits http://127.0.0.1:5189/einbuergerungstest/, so the
# preview must serve the Pages build at that base path.
.PHONY: lighthouse
lighthouse: build-pages ## Lighthouse CI on the Pages build: five mobile runs, median asserted
	BASE_PATH=$(PAGES_BASE) $(VP) run lighthouse

.PHONY: test-e2e-docker
test-e2e-docker: ## Run the end-to-end suite in the pinned CI Playwright image
	docker run --rm -v "$(CURDIR)":/work -v lid-node-modules:/work/node_modules \
		-v lid-vite-plus:/root/.vite-plus -w /work $(PLAYWRIGHT_IMAGE) \
		bash scripts/run-e2e.sh
