"""Flat summary extractor for publish-public-data.ps1 (Auto Publish durable status).

Same reason as extract_auto_daily_summary.py: PowerShell 5.1's ConvertFrom-Json
compares keys case-insensitively, so the public recommendation-history.json
(which contains both 'ROE' and 'roe') raises "duplicate key". Python's json
module accepts duplicates, so we read it here and emit a small flat object with
unique keys for the 08:40 Founder brief.

Emits the *publish side* facts only. The canonical apply side is reported by
REPO2 reports/magic-auto-apply-status-latest.json (separate source, no overlap).

usage: extract_public_publish_summary.py <public recommendation-history.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

EMPTY = {
    "ledgerBasisDate": None,
    "priceBasisDate": None,
    "priceFreshnessStatus": None,
    "generatedAt": None,
    "officialSequence": None,
    "uniqueHoldings": 0,
    "totalLots": 0,
    "totalBuyCount": 0,
    "totalSellCount": 0,
    "totalAsset": None,
    "availableCash": None,
    "totalCash": None,
    "holdingsMarketValue": None,
    "latestTradeDate": None,
    "latestBuyCount": 0,
    "latestSellCount": 0,
}


def main() -> int:
    if len(sys.argv) < 2:
        sys.stderr.write("usage: extract_public_publish_summary.py <public history.json>\n")
        return 2
    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps(EMPTY, ensure_ascii=False), flush=True)
        return 0
    try:
        with path.open("r", encoding="utf-8") as fp:
            doc = json.load(fp)
    except (OSError, ValueError):
        print(json.dumps(EMPTY, ensure_ascii=False), flush=True)
        return 0
    if not isinstance(doc, dict):
        print(json.dumps(EMPTY, ensure_ascii=False), flush=True)
        return 0

    summary = dict(EMPTY)
    s = doc.get("magicOfficialSummary")
    s = s if isinstance(s, dict) else {}
    holdings = (doc.get("magicOfficialPortfolio") or {}).get("holdings")
    holdings = holdings if isinstance(holdings, list) else []
    days = doc.get("magicOfficialTradeDays")
    days = days if isinstance(days, list) else []

    # 장부 기준일(dataDate) 과 평가가격 기준일(priceAsOf) 은 의미가 다르므로 분리해 넘긴다.
    summary["ledgerBasisDate"] = s.get("dataDate")
    summary["priceBasisDate"] = doc.get("priceAsOf")
    summary["priceFreshnessStatus"] = doc.get("priceFreshnessStatus")
    summary["generatedAt"] = doc.get("generatedAt")
    summary["officialSequence"] = s.get("officialSequence")
    summary["uniqueHoldings"] = len(holdings)          # 고유 보유종목 수
    summary["totalLots"] = s.get("openItemLotCount") or 0   # 누적/보유 lot 수(별개 개념)
    summary["totalBuyCount"] = s.get("totalBuyCount") or 0
    summary["totalSellCount"] = s.get("totalSellCount") or 0
    summary["totalAsset"] = s.get("totalAsset")
    summary["availableCash"] = s.get("officialAvailableCash")
    summary["totalCash"] = s.get("totalCash")
    summary["holdingsMarketValue"] = s.get("holdingsMarketValue")

    # 최신 거래일의 신규 매수 / 만기 FIFO 매도 건수
    if days:
        latest = max(days, key=lambda d: str(d.get("date") or ""))
        summary["latestTradeDate"] = latest.get("date")
        summary["latestBuyCount"] = latest.get("buyCount") or 0
        summary["latestSellCount"] = latest.get("sellCount") or 0

    print(json.dumps(summary, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
