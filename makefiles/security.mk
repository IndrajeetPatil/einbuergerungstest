##@ Security

ZIZMOR_VERSION := 1.32.0
# Pinned by digest so a retag cannot change what CI enforces.
ACTIONLINT_IMAGE := rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667
GITLEAKS_IMAGE := zricethezav/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f

.PHONY: security
security: secret-scan workflow-lint workflow-audit audit-js audit-python ## Run every security check

.PHONY: secret-scan
secret-scan: ## Scan the whole git history for secrets with gitleaks
	gitleaks git --log-opts="--all" --redact --no-banner .

.PHONY: secret-scan-ci
secret-scan-ci: ## Scan fetched history with the pinned gitleaks image (CI)
	docker run --rm -v "$(CURDIR)":/repo -w /repo $(GITLEAKS_IMAGE) git \
		--log-opts="--all" --redact --no-banner --log-level=warn .

.PHONY: workflow-lint
workflow-lint: ## Lint workflow syntax and shell with the pinned actionlint image
	docker run --rm -v "$(CURDIR)":/repo -w /repo $(ACTIONLINT_IMAGE) -color

.PHONY: workflow-audit
workflow-audit: ## Audit workflows with zizmor's online checks
	@token="$${GH_TOKEN:-$$(gh auth token)}"; \
	GH_TOKEN="$$token" $(UV) tool run zizmor@$(ZIZMOR_VERSION) $(ZIZMOR_ARGS) .github/workflows/

.PHONY: audit-js
audit-js: ## Audit JavaScript dependencies for known vulnerabilities
	$(VP) pm audit

.PHONY: audit-python
audit-python: ## Audit the locked Python dependencies
	cd scripts && $(UV) audit --locked --preview-features audit-command
