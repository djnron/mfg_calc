# Contributing

Thank you for helping improve the Manufacturing Cost Estimator.

## Good contribution areas

- Add a new manufacturing archetype with documented assumptions
- Correct a classification or benchmark range
- Add tests for product-page extraction
- Improve accessibility or interface behavior
- Add a verified supplier quotation in anonymized form
- Improve freight, duty, fulfillment, or returns modeling
- Add support for another e-commerce page structure

## Development workflow

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-change`.
3. Make the change.
4. Run `python3 scripts/validate_data.py`.
5. Load the unpacked extension and test it on representative pages.
6. Commit with a clear message.
7. Open a pull request using the included template.

## Data contributions

Every new cost model should include:

- Category and archetype name
- Cost basis
- Construction summary
- Low/base/high factory cost
- Low/base/high packaging cost
- Low/base/high freight allocation
- Reference quantity
- Confidence
- Keywords
- Notes explaining inclusions, exclusions, and evidence

Do not submit confidential supplier information without permission. Remove personal information, private contact details, purchase-order numbers, and commercially sensitive terms.

## Estimation standards

- Use ranges instead of false precision.
- Separate observed facts from inferred assumptions.
- Mark weak or broad matches as low confidence.
- Avoid treating retail price as proof of manufacturing cost.
- Document the country, quantity, date, and Incoterm when using a quotation.
- Never represent a benchmark as a binding supplier quote.

## Code style

The extension intentionally uses plain JavaScript, HTML, and CSS to keep local installation simple. Prefer small, readable functions and avoid unnecessary dependencies.
