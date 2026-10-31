##@ Quality

RUMDL_VERSION := 0.3.2

.PHONY: qa
qa: qa-js qa-python lint-markdown spell-check ## Run every static quality gate (no network)

.PHONY: qa-js
qa-js: file-naming lint typecheck test-unit fallow css-quality ## JavaScript and TypeScript gates

.PHONY: file-naming
file-naming: node_modules ## Check file and directory naming with ls-lint
	$(VP) run file-naming

.PHONY: lint
lint: node_modules ## Format check and type-aware lint, failing on warnings (Oxfmt, Oxlint)
	$(VP) run check

.PHONY: typecheck
typecheck: node_modules ## Type-check the whole project with TypeScript 7 (tsgo)
	$(VP) exec tsc -b

.PHONY: fallow
fallow: node_modules ## Unit tests with coverage, then dead code, duplication and complexity checks
	$(VP) run fallow

.PHONY: css-quality
css-quality: node_modules ## Check CSS maintainability and complexity
	$(VP) run css-quality

.PHONY: format
format: node_modules ## Write formatting fixes (Oxfmt, Ruff)
	$(VP) fmt
	cd scripts && $(UV) run --locked ruff format .

.PHONY: fix
fix: node_modules ## Write formatting and safe lint fixes
	$(VP) check --fix
	cd scripts && $(UV) run --locked ruff check --fix .
	cd scripts && $(UV) run --locked ruff format .

.PHONY: qa-python
qa-python: lint-python typecheck-python typecoverage-python ## Python lint, format and type gates

.PHONY: lint-python
lint-python: ## Lint and format-check the data pipeline with Ruff (ALL rules, preview)
	cd scripts && $(UV) run --locked ruff check .
	cd scripts && $(UV) run --locked ruff format --check .

.PHONY: typecheck-python
typecheck-python: ## Type-check the data pipeline with ty (every rule)
	cd scripts && $(UV) run --locked ty check .

.PHONY: typecoverage-python
typecoverage-python: ## Enforce 100% type coverage with pyrefly
	cd scripts && $(UV) run --locked pyrefly coverage check --fail-under 100

.PHONY: lint-markdown
lint-markdown: ## Lint Markdown with rumdl
	$(UV) tool run rumdl@$(RUMDL_VERSION) check .

.PHONY: spell-check
spell-check: ## Check spelling (British English) with typos
	typos .

.PHONY: link-check
link-check: ## Check links in Markdown and sources with lychee (network)
	GITHUB_TOKEN="$${GITHUB_TOKEN:-$$(gh auth token 2>/dev/null || true)}" lychee --no-progress .

.PHONY: ci
ci: qa test-scripts build ## Everything the pull-request workflows run, except E2E and security
