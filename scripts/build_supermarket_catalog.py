#!/usr/bin/env python3
"""Build the supermarket mock app catalog data from the Sheng Siong CSV."""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path


CATEGORY_DEFS = [
    ("housebrands", "Our Housebrands", "SS", ["#f6c04a", "#fff0a0"], ["Our Specials Housebrands"]),
    ("local", "Support Local", "SG", ["#df2f2f", "#f6f6f6"], ["Support Local"]),
    ("breakfast", "Breakfast & Spreads", "BF", ["#b77949", "#ffe3ba"], ["Breakfast & Spreads"]),
    ("dairy", "Dairy, Chilled & Eggs", "ML", ["#6db7ff", "#eef8ff"], ["Dairy Chilled & Eggs"]),
    ("fruits", "Fruits", "FR", ["#80c64a", "#eaffc4"], ["Fruits"]),
    ("vegetables", "Vegetables", "VG", ["#38a855", "#c7f5be"], ["Vegetables"]),
    ("meat", "Meat, Poultry & Seafood", "MT", ["#de6c73", "#ffe2e5"], ["Meat Poultry & Seafood", "Seafood"]),
    ("beverages", "Beverages", "BV", ["#d92626", "#ecf4ff"], ["Beverages"]),
    ("alcohol", "Alcohol", "AL", ["#27894a", "#d7f2d9"], ["Alcohol"]),
    ("rice", "Rice, Noodles & Pasta", "RP", ["#e6cb72", "#fff3cf"], ["Rice Noodles & Pasta"]),
    ("frozen", "Frozen Goods", "FZ", ["#f08a32", "#ffefd6"], ["Frozen Goods"]),
    ("dried", "Dried Food & Herbs", "DH", ["#c63b2e", "#ffe1cd"], ["Dried Food & Herbs"]),
    ("cooking", "Cooking & Baking", "CB", ["#e93d36", "#fff7d6"], ["Cooking & Baking", "Cooking & Baking Needs"]),
    ("convenience", "Convenience Food", "CF", ["#f7d86a", "#fff3c4"], ["Convenience Food"]),
    ("snacks", "Snacks & Confectioneries", "SC", ["#f6db2f", "#fff6b5"], ["Snacks & Confectioneries"]),
    ("baby", "Mum, Baby & Kids", "BK", ["#6aa0d8", "#eaf3ff"], ["Mum Baby & Kids"]),
    ("household", "Household", "HH", ["#40a6a1", "#d7fffb"], ["Household"]),
    ("health", "Health & Beauty", "HB", ["#8a80d8", "#f0edff"], ["Health & Beauty"]),
    ("pet", "Pet Care", "PC", ["#697d92", "#eef3f6"], ["Pet Care"]),
    ("lifestyle", "Lifestyle & Outdoors", "LO", ["#4f9b7a", "#dff5ea"], ["Lifestyle & Outdoors"]),
]


def clean(value: str | None) -> str:
    value = (value or "").strip()
    return "" if value in {"0", "False", "None"} else value


def money(value: str | None) -> str:
    value = clean(value)
    if not value:
        return ""
    try:
        return f"{float(value):.2f}".rstrip("0").rstrip(".")
    except ValueError:
        return value


def category_for(raw: str | None) -> str:
    normalized = re.sub(r"\s+", " ", raw or "").strip()
    for category_id, _, _, _, prefixes in CATEGORY_DEFS:
        if any(normalized.startswith(prefix) or f" {prefix} " in f" {normalized} " for prefix in prefixes):
            return category_id
    return "others"


def build_catalog(csv_path: Path) -> dict:
    products = []
    with csv_path.open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            category_id = category_for(row.get("category"))
            tags = [item.strip() for item in clean(row.get("tags")).split("|") if item.strip()]
            dietary = [item.strip() for item in clean(row.get("dietary")).split("|") if item.strip()]
            product = {
                "id": row["id"],
                "slug": clean(row.get("slug")),
                "category": category_id,
                "categoryName": next((name for key, name, *_ in CATEGORY_DEFS if key == category_id), "Others"),
                "rawCategory": clean(row.get("category")),
                "name": clean(row.get("name")),
                "brand": clean(row.get("brand")),
                "weight": clean(row.get("size")),
                "uom": clean(row.get("uom")),
                "price": money(row.get("price")),
                "oldPrice": money(row.get("usual_price")),
                "sku": clean(row.get("sku")),
                "origin": clean(row.get("origin")),
                "dietary": dietary,
                "tags": tags,
                "imageUrl": clean(row.get("image_url")),
            }
            if not product["oldPrice"] or product["oldPrice"] == product["price"]:
                product.pop("oldPrice")
            if tags:
                product["promo"] = tags[0]
            products.append(product)

    counts = Counter(product["category"] for product in products)
    first_image = {}
    for product in products:
        first_image.setdefault(product["category"], product.get("imageUrl", ""))

    categories = []
    for category_id, name, short, colors, _ in CATEGORY_DEFS:
        if counts[category_id]:
            categories.append({
                "id": category_id,
                "name": name,
                "short": short,
                "colors": colors,
                "count": counts[category_id],
                "imageUrl": first_image.get(category_id, ""),
            })
    if counts["others"]:
        categories.append({
            "id": "others",
            "name": "Others",
            "short": "OT",
            "colors": ["#aeb7bd", "#f3f6f7"],
            "count": counts["others"],
            "imageUrl": first_image.get("others", ""),
        })

    return {"generatedFrom": str(csv_path), "productCount": len(products), "categories": categories, "products": products}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="data/shengsiong_products.csv")
    parser.add_argument("--output", default="supermarket/catalog-data.js")
    args = parser.parse_args()

    catalog = build_catalog(Path(args.csv))
    Path(args.output).write_text(
        "window.SHENGSIONG_CATALOG = "
        + json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(catalog['products'])} products and {len(catalog['categories'])} categories to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
