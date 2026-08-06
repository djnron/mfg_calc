# Chrome Extension

This directory contains the installable Manifest V3 extension.

## Local installation

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `extension` directory.
5. Open a product page and click the extension icon.

## Embedded data

- `benchmarks.json`: manufacturing archetype models
- `product_estimates.json`: reference product catalog

These files make the current release operate locally without a backend.

## Permissions

- `activeTab`: read the current product page when used
- `storage`: save recent estimator state locally
- `downloads`: export a CSV result
- `sidePanel`: display the estimator interface
- `scripting`: reserved for page integration
- `<all_urls>` host permission: enables extraction across e-commerce domains

A future release should evaluate narrower site permissions and optional permissions.
