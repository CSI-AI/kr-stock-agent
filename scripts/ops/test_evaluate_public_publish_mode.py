#!/usr/bin/env python3
"""Network-free contract tests for the Auto Publish lane-separation policy."""
from __future__ import annotations

from evaluate_public_publish_mode import evaluate


def check(name: str, condition: bool) -> None:
    if not condition:
        raise AssertionError(name)
    print(f"PASS {name}")


def main() -> int:
    full = evaluate(
        gate_exit=0,
        gate_decision="PROCEED",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
    )
    check("normal gate keeps full publish", full["decision"] == "PROCEED_FULL")

    full_stale = evaluate(
        gate_exit=0,
        gate_decision="PROCEED",
        price_freshness_status="WAIT_EXTERNAL",
        price_stale_trading_days=10,
    )
    check(
        "normal Magic gate cannot hide stale general data",
        full_stale["decision"] == "WAIT_STALE_GENERAL_DATA",
    )

    held_fresh = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_EXPECTED_HOLD",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
    )
    check(
        "Magic HOLD permits fresh general data only",
        held_fresh["decision"] == "PROCEED_GENERAL_DATA_ONLY"
        and held_fresh["publishMode"] == "GENERAL_DATA_ONLY",
    )

    held_cached_one_day = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_EXPECTED_HOLD",
        price_freshness_status="WARNING_CACHED",
        price_stale_trading_days=1,
    )
    check(
        "one-trading-day cache remains eligible",
        held_cached_one_day["decision"] == "PROCEED_GENERAL_DATA_ONLY",
    )

    held_stale = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_EXPECTED_HOLD",
        price_freshness_status="WAIT_EXTERNAL",
        price_stale_trading_days=10,
    )
    check(
        "stale prices cannot pass on generatedAt alone",
        held_stale["decision"] == "WAIT_STALE_GENERAL_DATA"
        and held_stale["verdict"] == "WAIT",
    )

    held_stale_warning = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_EXPECTED_HOLD",
        price_freshness_status="WARNING_CACHED",
        price_stale_trading_days=2,
    )
    check(
        "cached prices older than one trading day wait",
        held_stale_warning["decision"] == "WAIT_STALE_GENERAL_DATA",
    )

    weekend = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
    )
    check("non-trading day still self-skips", weekend["decision"] == "SKIP_NON_TRADING_DAY")

    broken_gate = evaluate(
        gate_exit=2,
        gate_decision="BLOCKED_HOLD_POLICY_INVALID",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
    )
    check(
        "invalid HOLD policy stays blocked",
        broken_gate["decision"] == "BLOCKED_MAGIC_GATE" and broken_gate["verdict"] == "BLOCKED",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
