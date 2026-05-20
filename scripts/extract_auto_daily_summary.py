"""Flat summary extractor for run-wababa-auto-daily.ps1.

PowerShell 5.1's ConvertFrom-Json compares keys case-insensitively, so a
recommendation-history.json that contains both 'ROE' and 'roe' raises
"duplicate key" and the wrapper reports ERROR even when the Python trade
pipeline succeeded. Python's json module accepts duplicates (last wins),
so we read the history here and emit a small flat JSON object whose keys
are all unique.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def _orders_summary(node: object) -> tuple[int, object]:
    if not isinstance(node, dict):
        return 0, None
    orders = node.get("orders")
    count = len(orders) if isinstance(orders, list) else 0
    return count, node.get("status")


def _empty_summary() -> dict:
    return {
        "baseDate": None,
        "finalBestPickName": None,
        "wababaPickCount": 0,
        "fundTradeStatus": None,
        "fundOrderCount": 0,
        "aiFundTradeStatus": None,
        "aiFundOrderCount": 0,
    }


def main() -> int:
    if len(sys.argv) < 2:
        sys.stderr.write("usage: extract_auto_daily_summary.py <history.json>\n")
        return 2
    history_path = Path(sys.argv[1])
    if not history_path.exists():
        print(json.dumps(_empty_summary(), ensure_ascii=False), flush=True)
        return 0

    with history_path.open("r", encoding="utf-8") as fp:
        history = json.load(fp)

    if not isinstance(history, dict):
        print(json.dumps(_empty_summary(), ensure_ascii=False), flush=True)
        return 0

    final_best = history.get("finalBestPick")
    final_best_name = final_best.get("corpName") if isinstance(final_best, dict) else None
    wababa_picks = history.get("wababaPicks")
    wababa_pick_count = len(wababa_picks) if isinstance(wababa_picks, list) else 0
    fund_orders, fund_status = _orders_summary(history.get("fundTradeResult"))
    ai_orders, ai_status = _orders_summary(history.get("aiFundTradeResult"))

    summary = {
        "baseDate": history.get("baseDate"),
        "finalBestPickName": final_best_name,
        "wababaPickCount": wababa_pick_count,
        "fundTradeStatus": fund_status,
        "fundOrderCount": fund_orders,
        "aiFundTradeStatus": ai_status,
        "aiFundOrderCount": ai_orders,
    }
    print(json.dumps(summary, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
