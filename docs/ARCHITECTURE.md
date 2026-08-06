# Architecture

## Current local architecture

```text
Product page
   │
   ▼
content.js ── extracts visible and structured product fields
   │
   ▼
sidepanel.js
   ├── exact catalog lookup in product_estimates.json
   ├── archetype fallback in benchmarks.json
   ├── quantity and attribute adjustments
   ├── landed-cost and selling-cost calculations
   └── CSV export / Chrome local storage
```

## Extension components

### `manifest.json`

Defines Manifest V3 permissions, content scripts, service worker, side panel, and packaged data resources.

### `content.js`

Reads JSON-LD, common product selectors, metadata, prices, product text, weight, dimensions, and page URL. Extraction is intentionally tolerant because marketplace and merchant templates differ.

### `sidepanel.js`

Loads the embedded catalog and manufacturing models, matches the active page, applies cost calculations, saves local state, and exports a one-row CSV.

### `background.js`

Configures the extension action to open the Chrome side panel.

## Data layer

`product_estimates.json` is optimized for local extension lookup. The CSV version is the human- and analysis-friendly canonical export.

`benchmarks.json` and `manufacturing_cost_benchmarks.csv` contain the archetype model library.

## Recommended production architecture

A production version should separate the extension from a versioned API:

```text
Chrome extension / Web app
          │
          ▼
Authenticated API
   ├── product normalization
   ├── image and text matching
   ├── bill-of-materials inference
   ├── supplier-comparable retrieval
   ├── cost and landed-cost engine
   ├── user corrections / verified quotes
   └── audit and model-version metadata
          │
          ▼
PostgreSQL + object storage + search/vector index
```

## Security and privacy considerations

- Minimize host permissions in future releases.
- Never transmit page content without explicit disclosure and consent.
- Sanitize exported text to reduce spreadsheet-formula injection risk.
- Treat supplier quotes and purchase orders as confidential data.
- Version every cost model so historical estimates remain reproducible.
