##@ Question data

.PHONY: data
data: ## Rebuild the catalogue and pictures from the pinned sources (needs poppler)
	cd scripts && $(UV) run --locked build_data.py

.PHONY: data-refresh
data-refresh: ## Re-download the sources, then rebuild (detects a new BAMF edition)
	cd scripts && $(UV) run --locked build_data.py --refresh
