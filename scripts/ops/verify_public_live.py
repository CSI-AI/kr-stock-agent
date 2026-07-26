#!/usr/bin/env python3
"""운영 URL 라이브 검증 — Vercel 자동배포가 실제로 반영됐는지 확인 (read-only, write 0).

§10: Auto Publish 의 완료는 git push 만으로 판단하지 않는다. Vercel Git 자동배포가 끝나
운영 URL 이 *커밋된 public 산출물과 동일한 바이트*를 서빙할 때만 PUBLISHED 로 본다.

검증:
  1) 운영 public JSON 의 sha256 == 로컬 HEAD 커밋 blob 의 sha256 (전 필드 일치를 한 번에 보장)
  2) canonical sequence == 서빙되는 public sequence
  3) 장부 기준일 / 평가가격 기준일 / 현금 / 총자산 / 고유 보유종목 / 누적 lot 일치
  4) 최신 거래일 신규 매수·만기 매도 거래기록 반영
  5) 성과 시계열 마지막 날짜 == 장부 기준일
  6) `/` · `/performance` HTTP 200
  7) 갱신 상태 문구: '최근 갱신 대기 중' 부재 + 정상 상태 표시

배포 전파 대기를 위해 제한 시간 안에서 폴링한다. 시간 내 불일치면 PUBLISHED 로 기록하지 않는다.
어떤 파일도 쓰지 않는다.

exit 0 = LIVE_OK, 2 = 불일치/타임아웃(호출자가 PUBLISHED 로 기록하지 않도록)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO1 = Path("C:/work/kr-stock-agent")
PUBLIC_REL = "public/data/recommendation-history.json"
BASE_URL = "https://kr-stock-agent.vercel.app"
CANONICAL = Path("C:/work/kr-stock-agent-data-new/magic-formula-official-state.json")


def _committed_blob() -> bytes | None:
    try:
        out = subprocess.run(["git", "-C", str(REPO1), "show", f"HEAD:{PUBLIC_REL}"],
                             capture_output=True, timeout=60)
        return out.stdout if out.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def _fetch(url: str, attempt: int) -> tuple[int, bytes]:
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(
        f"{url}{sep}cb={attempt}",
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache",
                 "User-Agent": "wababa-auto-publish-live-verify"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except (urllib.error.URLError, OSError, TimeoutError):
        return 0, b""


def _strip_html(h: str) -> str:
    s = re.sub(r"<!--.*?-->", "", h, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s)


def _canonical_seq():
    try:
        st = json.loads(CANONICAL.read_text(encoding="utf-8"))
        return st.get("officialSequence")
    except (OSError, ValueError):
        return None


def verify_payload(served: dict, canonical_seq) -> dict:
    """서빙된 payload 자체의 내부 정합 + canonical 일치 검사."""
    s = served.get("magicOfficialSummary") or {}
    holdings = (served.get("magicOfficialPortfolio") or {}).get("holdings") or []
    days = served.get("magicOfficialTradeDays") or []
    latest = max(days, key=lambda d: str(d.get("date") or "")) if days else {}
    ledger_date = s.get("dataDate")
    checks = {
        "publicSeqMatchesCanonical": (canonical_seq is None or s.get("officialSequence") == canonical_seq),
        "ledgerBasisDatePresent": bool(ledger_date),
        "priceBasisDatePresent": bool(served.get("priceAsOf")),
        "cashPresent": s.get("officialAvailableCash") is not None,
        "totalAssetPresent": s.get("totalAsset") is not None,
        "uniqueHoldingsPresent": len(holdings) > 0,
        "cumulativeLotsPresent": (s.get("openItemLotCount") or 0) > 0,
        # 총현금 + 평가액 == 총자산 (표시 계약 일치)
        "assetIdentity": (
            s.get("totalCash") is not None and s.get("holdingsMarketValue") is not None
            and s.get("totalAsset") is not None
            and abs((s["totalCash"] + s["holdingsMarketValue"]) - s["totalAsset"]) <= 1
        ),
        # 최신 거래일 거래기록이 장부 기준일과 같은 날짜로 반영됐는지
        "latestTradeDayMatchesLedger": (str(latest.get("date") or "") == str(ledger_date or "")),
        # 성과 시계열(거래일 배열) 마지막 == 장부 기준일
        "performanceSeriesCurrent": (
            bool(days) and max(str(d.get("date") or "") for d in days) == str(ledger_date or "")
        ),
    }
    return {
        "checks": checks,
        "servedSequence": s.get("officialSequence"),
        "ledgerBasisDate": ledger_date,
        "priceBasisDate": served.get("priceAsOf"),
        "availableCash": s.get("officialAvailableCash"),
        "totalAsset": s.get("totalAsset"),
        "uniqueHoldings": len(holdings),
        "cumulativeLots": s.get("openItemLotCount"),
        "latestTradeDate": latest.get("date"),
        "latestBuyCount": latest.get("buyCount"),
        "latestSellCount": latest.get("sellCount"),
        "tradeDayCount": len(days),
    }


def run(*, timeout_sec: int = 180, interval_sec: int = 10, base_url: str = BASE_URL) -> dict:
    blob = _committed_blob()
    if not blob:
        return {"status": "BLOCKED_NO_COMMITTED_BLOB", "reason": "HEAD 커밋에서 public 산출물을 읽을 수 없음",
                "filesWritten": 0}
    want = hashlib.sha256(blob).hexdigest()
    canonical_seq = _canonical_seq()
    deadline = time.time() + timeout_sec
    attempt = 0
    got = None

    while True:
        attempt += 1
        code, body = _fetch(f"{base_url}/data/{Path(PUBLIC_REL).name}", attempt)
        if code == 200 and body:
            got = hashlib.sha256(body).hexdigest()
            if got == want:
                break
        if time.time() >= deadline:
            return {"status": "WAIT_DEPLOY_NOT_LIVE",
                    "reason": (f"제한 시간 {timeout_sec}s 내에 운영 URL 이 커밋된 산출물을 서빙하지 않음 "
                               f"(기대 {want[:16]}, 실제 {(got or 'n/a')[:16]}, HTTP {code}) — "
                               f"Vercel 자동배포 전파 대기 또는 배포 실패"),
                    "expectedSha256": want[:16], "servedSha256": (got or "")[:16],
                    "httpStatus": code, "attempts": attempt, "filesWritten": 0}
        time.sleep(interval_sec)

    served = json.loads(body.decode("utf-8"))
    detail = verify_payload(served, canonical_seq)

    # 페이지 렌더 확인(SSR) — 상태 문구까지 본다.
    pages, page_checks = {}, {}
    for path in ("/", "/performance"):
        c, b = _fetch(f"{base_url}{path}", attempt)
        pages[path] = c
        if path == "/" and c == 200 and b:
            txt = _strip_html(b.decode("utf-8", errors="replace"))
            page_checks["noStalePendingLabel"] = ("최근 갱신 대기 중" not in txt)
            page_checks["syncCompleteLabel"] = ("최신 장부 반영 완료" in txt)
            page_checks["ledgerBasisShown"] = bool(re.search(r"장부 기준일 [\d.]+", txt))
            page_checks["priceBasisShown"] = bool(re.search(r"평가가격 기준일 [\d.]+", txt))
    page_checks["httpOk"] = all(v == 200 for v in pages.values())

    checks = {**detail["checks"], **page_checks}
    failed = [k for k, v in checks.items() if not v]
    status = "LIVE_OK" if not failed else "BLOCKED_LIVE_MISMATCH"
    return {
        "status": status,
        "reason": ("운영 URL 이 커밋된 public 산출물과 일치하고 표시 계약도 정상"
                   if not failed else f"운영 라이브 검증 실패 항목: {', '.join(failed)}"),
        "expectedSha256": want[:16], "servedSha256": got[:16],
        "canonicalSequence": canonical_seq,
        "httpStatus": pages, "attempts": attempt,
        "checks": checks, "failedChecks": failed,
        **{k: v for k, v in detail.items() if k != "checks"},
        "realOrderCount": 0, "brokerApiCallCount": 0, "filesWritten": 0,
    }


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="운영 URL 라이브 검증 (read-only, write 0)")
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--interval", type=int, default=10)
    ap.add_argument("--base-url", default=BASE_URL)
    args = ap.parse_args(argv)
    r = run(timeout_sec=args.timeout, interval_sec=args.interval, base_url=args.base_url)
    print(json.dumps(r, ensure_ascii=False), flush=True)
    return 0 if r["status"] == "LIVE_OK" else 2


if __name__ == "__main__":
    sys.exit(main())
