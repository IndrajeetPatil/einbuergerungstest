##@ Git hooks

# One prek version for local hooks and CI, including its built-in hooks.
PREK_VERSION := 0.5.9
PREK := $(UV) tool run prek@$(PREK_VERSION)

.PHONY: hooks-install
hooks-install: ## Install the pre-commit, pre-push and commit-msg hooks
	$(PREK) install

.PHONY: hooks
hooks: ## Run the pre-commit hooks on all tracked files
	$(PREK) run --stage pre-commit --all-files --show-diff-on-failure

.PHONY: hooks-push
hooks-push: ## Run the pre-push hooks on all tracked files
	$(PREK) run --stage pre-push --all-files --show-diff-on-failure

.PHONY: hooks-update
hooks-update: ## Update remote hooks to their latest releases and freeze their SHAs
	$(PREK) update --freeze
