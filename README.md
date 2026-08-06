# Manufacturing Cost Estimator

An open-source Chrome extension and reference dataset for estimating the **factory cost, landed cost, selling cost, gross profit, and gross margin** of e-commerce products.

The project combines page extraction, product matching, quantity adjustments, editable logistics assumptions, and transparent low/base/high manufacturing-cost ranges. It is designed for early product research, sourcing comparisons, merchandising analysis, and educational use—not as a replacement for supplier quotations.

## Included

- Chrome Manifest V3 extension with a side-panel interface
- 2,648 product-level estimates
  - Amazon: 1,000
  - Shopify sample listings: 1,623
  - Etsy distinct listings: 20
  - AliExpress samples: 5
- 134 manufacturing-cost archetypes
- CSV datasets for cost models and product estimates
- Excel workbook with dashboard and interactive estimator
- Validation and release-build scripts
- Methodology, architecture, roadmap, and contribution documentation

## Quick start

### Load the Chrome extension

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension` directory.
6. Visit an e-commerce product page and click the extension icon.

### Validate the datasets

```bash
python3 scripts/validate_data.py
```

### Build release archives

```bash
bash scripts/build_release.sh
```

The script creates a standalone extension ZIP and a complete source release under `releases/`.

## Repository structure

```text
extension/                  Chrome extension source and embedded JSON data
data/                       CSV datasets and summary metadata
docs/                       Architecture, methodology, roadmap, and data documentation
examples/                   Excel estimator and sample CSV output
scripts/                    Dataset validation and release packaging
.github/                    Issue and pull-request templates
```

## How the estimates work

1. The extension extracts product information available on the page.
2. It attempts an exact URL or normalized-title match against the reference catalog.
3. If no catalog match exists, it selects the closest manufacturing archetype.
4. Factory cost is adjusted for quantity using a bounded volume curve.
5. Packaging, freight, duty, marketplace fees, fulfillment, returns, and other assumptions are added.
6. The extension displays low, base, and high scenarios with a qualitative confidence rating.

See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) for details.

## Important limitations

These are benchmark-based estimates, not quotes. Public product listings rarely disclose complete bills of materials, material grades, component suppliers, tooling, reject rates, certifications, factory location, negotiated freight, or tariff classification.

Before making a purchasing, investment, sourcing, or pricing decision, validate the result with:

- Supplier RFQs
- A detailed bill of materials
- Tooling and packaging quotations
- Inspection and certification requirements
- Current freight rates
- Current tariffs and verified HS codes
- Actual purchase orders and invoices

## Data provenance

The included catalog is assembled from publicly available sample datasets and development-store seed files. It is not a live or exhaustive copy of any marketplace. Source provenance and dataset-specific limitations are documented in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Privacy

The extension performs estimation locally. It does not include analytics, advertising, authentication, or a remote backend. It only reads the active product page when used.

## Contributing

Contributions are welcome, especially:

- Verified supplier quotations
- Better product classifiers
- New manufacturing archetypes
- Country- and region-specific cost models
- Freight, duty, and fulfillment integrations
- Tests and accessibility improvements

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## License

Code and project documentation are licensed under the [MIT License](LICENSE).

The included data is released under [CC BY 4.0](DATA-LICENSE.md), subject to the terms and rights associated with each upstream source. Marketplace names and trademarks belong to their respective owners.

## Disclaimer

This software is provided for informational and research purposes. It does not provide customs, tax, accounting, legal, sourcing, or financial advice. The maintainers make no representation that an estimate reflects the actual cost of any specific supplier or product.
