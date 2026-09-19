#!/usr/bin/env python3
"""Choose whether Auto Publish may publish all data or general data only.

The Magic paper lane can be intentionally held while prices and general
recommendations remain publishable.  This pure policy helper keeps those two
facts separate, but refuses to treat a newly generated timestamp as fresh
market data.
"""
from __future__ import annotations

import argparse
import json


EXIT_PROCEED = 0
EXIT_SKIP = 10
EXIT_BLOCKED = 2


def evaluate(
    *,
    gate_exit: int,
    gate_decision: str,
    price_freshness_status: str | None,
    price_stale_trading_days: int | None,
) -> dict:
    gate_decision = (gate_decision or "UNKNOWN").strip()
    freshness = (price_freshness_status or "UNKNOWN").strip()
    fresh_enough = freshness == "PASS" or (
        freshness == "WARNING_CACHED"
        and price_stale_trading_days is not None
        and 0 <= price_stale_trading_days <= 1
    )
    stale_general = freshness == "WAIT_EXTERNAL" or (
        freshness == "WARNING_CACHED"
        and price_stale_trading_days is not None
        and price_stale_trading_days > 1
    )

    if gate_exit == 0 and gate_decision == "PROCEED":
        if fresh_enough:
            return {
                "decision": "PROCEED_FULL",
                "publishMode": "FULL",
                "verdict": "PASS",
                "reason": "Magic gate와 일반 데이터 freshness가 정상 publish 경로를 허용",
                "exitCode": EXIT_PROCEED,
            }
        if stale_general:
            return {
                "decision": "WAIT_STALE_GENERAL_DATA",
                "publishMode": "NONE",
                "verdict": "WAIT",
                "reason": "일반 데이터 가격이 오래되어 generatedAt만 바꾼 publish를 차단",
                "exitCode": EXIT_SKIP,
            }
        return {
            "decision": "BLOCKED_GENERAL_DATA_FRESHNESS_UNKNOWN",
            "publishMode": "NONE",
            "verdict": "BLOCKED",
            "reason": f"일반 데이터 freshness를 안전하게 판정할 수 없음({freshness})",
            "exitCode": EXIT_BLOCKED,
        }

    if gate_exit == EXIT_SKIP and gate_decision == "SKIPPED_NON_TRADING_DAY":
        return {
            "decision": "SKIP_NON_TRADING_DAY",
            "publishMode": "NONE",
            "verdict": "PASS",
            "reason": "실제 거래일이 아니므로 예약 publish를 정상 self-skip",
            "exitCode": EXIT_SKIP,
        }

    if gate_exit == EXIT_SKIP and gate_decision == "SKIPPED_EXPECTED_HOLD":
        if fresh_enough:
            return {
                "decision": "PROCEED_GENERAL_DATA_ONLY",
                "publishMode": "GENERAL_DATA_ONLY",
                "verdict": "PASS",
                "reason": (
                    "Magic 장부는 intentional HOLD 그대로 보존하고, "
                    "신선한 가격·일반 추천 데이터만 publish 허용"
                ),
                "exitCode": EXIT_PROCEED,
            }
        if stale_general:
            return {
                "decision": "WAIT_STALE_GENERAL_DATA",
                "publishMode": "NONE",
                "verdict": "WAIT",
                "reason": (
                    "Magic HOLD와 별개로 일반 데이터 가격이 오래됨; "
                    "generatedAt 갱신만으로 publish하지 않음"
                ),
                "exitCode": EXIT_SKIP,
            }
        return {
            "decision": "BLOCKED_GENERAL_DATA_FRESHNESS_UNKNOWN",
            "publishMode": "NONE",
            "verdict": "BLOCKED",
            "reason": f"일반 데이터 freshness를 안전하게 판정할 수 없음({freshness})",
            "exitCode": EXIT_BLOCKED,
        }

    return {
        "decision": "BLOCKED_MAGIC_GATE",
        "publishMode": "NONE",
        "verdict": "BLOCKED",
        "reason": f"Magic gate 실패/미확인(exit={gate_exit}, decision={gate_decision})",
        "exitCode": EXIT_BLOCKED,
    }


def _optional_int(raw: str) -> int | None:
    if raw == "":
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--gate-exit", required=True, type=int)
    parser.add_argument("--gate-decision", required=True)
    parser.add_argument("--price-freshness-status", default="")
    parser.add_argument("--price-stale-trading-days", default="")
    args = parser.parse_args()
    result = evaluate(
        gate_exit=args.gate_exit,
        gate_decision=args.gate_decision,
        price_freshness_status=args.price_freshness_status,
        price_stale_trading_days=_optional_int(args.price_stale_trading_days),
    )
    print(json.dumps(result, ensure_ascii=False), flush=True)
    return int(result["exitCode"])


if __name__ == "__main__":
    raise SystemExit(main())
