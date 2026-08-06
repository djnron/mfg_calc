# Estimation Methodology

## Objective

Estimate a plausible per-unit manufacturing-cost range and a configurable landed/selling-cost scenario from incomplete public product information.

## 1. Product normalization

The system collects available fields such as title, description, product type, category, price, currency, dimensions, weight, URL, seller, and brand.

## 2. Reference-catalog match

The extension first attempts to match the current URL or normalized title to a pre-estimated record. A catalog match reuses the recorded archetype and assumptions but remains an estimate, not a verified cost.

## 3. Archetype classification

When no catalog match exists, the product is assigned to the nearest manufacturing archetype using ordered keyword and category rules. Archetypes represent common construction patterns such as a cotton T-shirt, stainless vacuum bottle, injection-molded phone case, complete bicycle, or Bluetooth speaker.

## 4. Quantity adjustment

Factory benchmarks use a reference quantity. The current MVP approximates volume effects with a bounded curve:

```text
adjusted factory cost = reference factory cost
                      × max(0.68, min(1.90,
                        (reference quantity / requested quantity) ^ 0.14))
```

The bounds avoid extreme extrapolation. This does not model tooling, MOQ step changes, commodity contracts, or supplier capacity constraints.

## 5. Low/base/high range

Each archetype includes low, base, and high values for factory cost, packaging, and freight. The range reflects variation in materials, construction, quality, production region, complexity, and incomplete specifications.

## 6. Landed cost

The basic landed-cost model is:

```text
landed cost = (factory cost + packaging + freight) × (1 + duty rate)
```

Real landed cost can additionally include inspection, insurance, brokerage, port charges, drayage, storage, demurrage, financing, taxes, and other charges.

## 7. Selling economics

The extension can add marketplace fees, fulfillment, returns allowance, and user-defined costs. Margin is only meaningful when the observed retail price and all cost assumptions use compatible currencies.

## 8. Confidence

- **Medium:** a reasonably specific archetype or stronger listing match
- **Low:** a broad category match, missing specifications, or a product with high component/material variability

No estimate is labeled high confidence until validated against a detailed specification and supplier evidence.

## Validation hierarchy

From strongest to weakest:

1. Paid invoice or purchase-order actuals
2. Current supplier RFQ tied to a complete specification
3. Multiple comparable supplier quotations
4. Bottom-up bill of materials and process model
5. Closely matched archetype benchmark
6. Broad category fallback
