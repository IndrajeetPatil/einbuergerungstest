##@ Tests

# Pinned Playwright image for CI-identical end-to-end runs. Keep the tag and
# digest in lockstep with @playwright/test in package.json and e2e.yml.
PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.64.1-noble@sha256:7852dc5a7d72f5fe458a597d690f6c42fbc8e9e26ddfa95f8e6ef552558d9bbf

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

.PHONY: test-e2e-docker
test-e2e-docker: ## Run the end-to-end suite in the pinned CI Playwright image
	docker run --rm -v "$(CURDIR)":/work -v lid-node-modules:/work/node_modules \
		-v lid-vite-plus:/root/.vite-plus -w /work $(PLAYWRIGHT_IMAGE) \
		bash scripts/run-e2e.sh
