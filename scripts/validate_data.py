#!/usr/bin/env python3
"""Validate the benchmark and product-estimate CSV files using only Python stdlib."""

from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def numeric(row: dict[str, str], field: str, errors: list[str], row_number: int) -> float | None:
    value = row.get(field, "").strip()
    if value == "":
        return None
    try:
        number = float(value)
    except ValueError:
        errors.append(f"row {row_number}: {field} is not numeric: {value!r}")
        return None
    if not math.isfinite(number):
        errors.append(f"row {row_number}: {field} is not finite")
    return number


def main() -> int:
    errors: list[str] = []
    benchmark_path = DATA / "manufacturing_cost_benchmarks.csv"
    estimate_path = DATA / "product_cost_estimates.csv"

    benchmarks = read_csv(benchmark_path)
    estimates = read_csv(estimate_path)

    required_benchmarks = {
        "category", "product_archetype", "factory_cost_low_usd",
        "factory_cost_base_usd", "factory_cost_high_usd", "reference_quantity"
    }
    required_estimates = {
        "platform", "source_product_id", "title", "product_archetype",
        "factory_cost_low_usd", "factory_cost_base_usd", "factory_cost_high_usd",
        "confidence", "estimate_version"
    }

    if benchmarks:
        missing = required_benchmarks - set(benchmarks[0])
        if missing:
            errors.append(f"benchmark CSV missing columns: {sorted(missing)}")
    if estimates:
        missing = required_estimates - set(estimates[0])
        if missing:
            errors.append(f"estimate CSV missing columns: {sorted(missing)}")

    archetypes: set[str] = set()
    for i, row in enumerate(benchmarks, start=2):
        archetype = row.get("product_archetype", "").strip()
        if not archetype:
            errors.append(f"benchmark row {i}: blank product_archetype")
        if archetype in archetypes:
            errors.append(f"benchmark row {i}: duplicate archetype {archetype!r}")
        archetypes.add(archetype)
        low = numeric(row, "factory_cost_low_usd", errors, i)
        base = numeric(row, "factory_cost_base_usd", errors, i)
        high = numeric(row, "factory_cost_high_usd", errors, i)
        if None not in (low, base, high) and not (low <= base <= high):
            errors.append(f"benchmark row {i}: factory range is not low <= base <= high")

    seen_ids: set[tuple[str, str]] = set()
    for i, row in enumerate(estimates, start=2):
        key = (row.get("platform", ""), row.get("source_product_id", ""))
        if key in seen_ids:
            errors.append(f"estimate row {i}: duplicate platform/product ID {key}")
        seen_ids.add(key)
        if row.get("product_archetype", "") not in archetypes:
            errors.append(f"estimate row {i}: unknown archetype {row.get('product_archetype')!r}")
        low = numeric(row, "factory_cost_low_usd", errors, i)
        base = numeric(row, "factory_cost_base_usd", errors, i)
        high = numeric(row, "factory_cost_high_usd", errors, i)
        if None not in (low, base, high) and not (low <= base <= high):
            errors.append(f"estimate row {i}: factory range is not low <= base <= high")
        if row.get("confidence") not in {"Medium", "Low"}:
            errors.append(f"estimate row {i}: unsupported confidence {row.get('confidence')!r}")

    summary_path = DATA / "dataset_summary.json"
    if summary_path.exists():
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        expected = summary.get("total_products")
        if expected is not None and int(expected) != len(estimates):
            errors.append(f"dataset summary says {expected} products, CSV contains {len(estimates)}")

    if errors:
        print(f"Validation failed with {len(errors)} error(s):", file=sys.stderr)
        for error in errors[:100]:
            print(f"- {error}", file=sys.stderr)
        if len(errors) > 100:
            print(f"- ... {len(errors) - 100} more", file=sys.stderr)
        return 1

    print(f"Validated {len(benchmarks):,} benchmarks and {len(estimates):,} product estimates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
