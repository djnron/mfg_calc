# Data Dictionary

## Product-estimate fields

- `record_number`: sequential row identifier
- `platform`: source marketplace or e-commerce system
- `source_dataset`: upstream sample file or dataset
- `source_product_id`: source-specific listing identifier
- `product_url`: public product URL when supplied
- `title`: listing title
- `brand`, `seller`: observed source fields when available
- `observed_price`, `currency`: public listing price and currency
- `source_category`, `product_type`: source taxonomy fields
- `weight_grams`, `dimensions`: observed specifications
- `estimate_status`: physical estimate or digital marginal-cost treatment
- `manufacturing_category`: normalized internal category
- `product_archetype`: selected benchmark model
- `match_basis`: explanation of how the archetype was selected
- `confidence`: qualitative estimate confidence
- `quantity_assumption`: production volume used for the estimate
- `factory_cost_low_usd`, `factory_cost_base_usd`, `factory_cost_high_usd`: estimated ex-factory range
- `packaging_base_usd`, `freight_base_usd`: illustrative per-unit allocations
- `duty_assumption_percent`: illustrative category-level duty input
- `landed_cost_*_usd`: factory, packaging, freight, and duty result
- `marketplace_fee_rate_percent`: scenario assumption
- `fulfillment_assumption_usd`: per-unit scenario assumption
- `returns_allowance_rate_percent`: scenario assumption
- `total_selling_cost_base_usd`: base landed and selling costs
- `gross_profit_base_usd`, `gross_margin_base_percent`: calculated only where meaningful
- `estimate_notes`: product-specific limitations
- `source_dataset_url`: provenance reference
- `estimate_version`: model version

## Benchmark-model fields

Each archetype includes category, construction summary, factory/packaging/freight low-base-high values, reference quantity, confidence, notes, and matching keywords.
