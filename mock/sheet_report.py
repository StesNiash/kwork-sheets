from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path


def parse_amount(value: str) -> float:
    normalized = (
        value.replace("\u00a0", "")
        .replace(" ", "")
        .replace(",", ".")
    )
    cleaned = "".join(character for character in normalized if character.isdigit() or character in ".-")
    try:
        return float(cleaned or 0)
    except ValueError:
        return 0.0


def load_orders(path: Path) -> list[dict]:
    path = Path(path)
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"date", "customer", "status", "amount"}
        if not reader.fieldnames or not required.issubset({name.strip().lower() for name in reader.fieldnames}):
            raise ValueError("CSV must contain date, customer, status, amount")
        rows = []
        for raw in reader:
            row = {key.strip().lower(): (value or "").strip() for key, value in raw.items() if key}
            if not any(row.values()):
                continue
            rows.append(row)
    return rows


def build_report(rows: list[dict]) -> dict:
    summary = {
        "orders": len(rows),
        "total": 0.0,
        "by_status": {},
        "latest_date": "",
    }
    by_status: dict[str, dict[str, float]] = defaultdict(lambda: {"count": 0, "total": 0.0})
    for row in rows:
        status = row.get("status") or "без статуса"
        amount = parse_amount(row.get("amount", ""))
        summary["total"] += amount
        by_status[status]["count"] += 1
        by_status[status]["total"] += amount
        date = row.get("date", "")
        if date > summary["latest_date"]:
            summary["latest_date"] = date
    summary["by_status"] = {
        status: {"count": int(value["count"]), "total": round(value["total"], 2)}
        for status, value in sorted(by_status.items())
    }
    summary["total"] = round(summary["total"], 2)
    return summary
