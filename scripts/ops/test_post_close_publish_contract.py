#!/usr/bin/env python3
from pathlib import Path


def main() -> int:
    source = (Path(__file__).with_name("publish-public-data.ps1")).read_text(encoding="utf-8-sig")
    checks = {
        "existing same-day wrapper only": "post_close_price_refresh.py" in source,
        "trading-day proceed only": '$gateDecision -eq "PROCEED"' in source,
        "manual recovery excluded": "-not $ManualTargetDate" in source,
        "target date explicit": "--target-date $publishTarget" in source,
        "duplicate collection skipped": "중복 수집 0" in source,
        "failure closes publish": 'Stop-Fail "BLOCKED_POST_CLOSE_PRICE_REFRESH' in source,
        "Windows subprocess UTF-8": '$env:PYTHONUTF8 = "1"' in source,
        "no new scheduler": "Register-ScheduledTask" not in source,
    }
    for name, ok in checks.items():
        print(f"[{'PASS' if ok else 'FAIL'}] {name}")
    failed = [name for name, ok in checks.items() if not ok]
    print(f"result: {len(checks) - len(failed)} passed, {len(failed)} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
