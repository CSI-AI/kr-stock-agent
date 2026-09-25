#!/usr/bin/env python3
"""Network-free contract tests for the Auto Publish lane-separation policy."""
from __future__ import annotations

from pathlib import Path

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

    holiday_newer = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
        source_price_as_of="2026-09-23",
        published_price_as_of="2026-09-22",
    )
    check(
        "holiday publishes only newer validated general data",
        holiday_newer["decision"] == "PROCEED_GENERAL_DATA_ONLY"
        and holiday_newer["publishMode"] == "GENERAL_DATA_ONLY",
    )

    holiday_same = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
        source_price_as_of="2026-09-23",
        published_price_as_of="2026-09-23",
    )
    check(
        "holiday same price date is NO_CHANGE",
        holiday_same["decision"] == "SKIP_NON_TRADING_DAY"
        and holiday_same["publishMode"] == "NONE",
    )

    holiday_stale = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="WARNING_CACHED",
        price_stale_trading_days=2,
        source_price_as_of="2026-09-23",
        published_price_as_of="2026-09-22",
    )
    check(
        "holiday newer but stale source waits",
        holiday_stale["decision"] == "WAIT_STALE_GENERAL_DATA",
    )

    holiday_older = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
        source_price_as_of="2026-09-22",
        published_price_as_of="2026-09-23",
    )
    check(
        "holiday older source is NO_CHANGE",
        holiday_older["decision"] == "SKIP_NON_TRADING_DAY",
    )

    holiday_missing_date = evaluate(
        gate_exit=10,
        gate_decision="SKIPPED_NON_TRADING_DAY",
        price_freshness_status="PASS",
        price_stale_trading_days=0,
    )
    check(
        "holiday missing comparison date fails closed",
        holiday_missing_date["decision"] == "BLOCKED_PRICE_DATE_COMPARISON_UNKNOWN",
    )

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

    publish_script = (Path(__file__).resolve().parent / "publish-public-data.ps1").read_text(
        encoding="utf-8"
    )
    check(
        "publish wrapper passes source and deployed price dates",
        "--source-price-as-of" in publish_script
        and "--published-price-as-of" in publish_script,
    )
    check(
        "general-only wrapper preserves committed Magic hash",
        "$committedMagicOfficialHash" in publish_script
        and "$magicBefore -ne $committedMagicOfficialHash" in publish_script
        and "$magicAfter -ne $committedMagicOfficialHash" in publish_script,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
