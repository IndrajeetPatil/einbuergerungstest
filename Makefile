# Einbürgerungstest trainer — common chores. Run `make` to list targets.

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
MAKEFLAGS += --no-print-directory

# Vite+ (`vp`) provisions Node from .node-version and pnpm from devEngines,
# then delegates to the locked vite-plus devDependency.
VP ?= vp
NODE ?= node
UV ?= uv
PORT ?= 5179
URL := http://localhost:$(PORT)/
# GitHub Pages serves the site from /<repository>/.
PAGES_BASE ?= /einbuergerungstest/

include makefiles/app.mk
include makefiles/quality.mk
include makefiles/testing.mk
include makefiles/security.mk
include makefiles/hooks.mk
include makefiles/data.mk

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n"} \
	  /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } \
	  /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
