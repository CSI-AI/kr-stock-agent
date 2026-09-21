#!/usr/bin/env python3
"""운영 URL 라이브 검증 — Vercel 자동배포가 실제로 반영됐는지 확인 (read-only, write 0).

§10: Auto Publish 의 완료는 git push 만으로 판단하지 않는다. Vercel Git 자동배포가 끝나
운영 URL 이 *커밋된 public 산출물과 동일한 바이트*를 서빙할 때만 PUBLISHED 로 본다.

검증:
  1) 운영 public JSON 의 sha256 == 로컬 HEAD 커밋 blob 의 sha256 (전 필드 일치를 한 번에 보장)
  2) 공개 생성 경로의 활성 가상장부 sequence·source hash == 서빙되는 public 값
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
DATA_ROOT = Path("C:/work/kr-stock-agent-data-new")


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


def _active_ledger_evidence(*, active_path=None, source_path=None, original_path=None,
                            expected_original_sha=None) -> dict:
    """Use the same active-paper resolver as public generation; fail closed on drift."""
    if any(value is None for value in
           (active_path, source_path, original_path, expected_original_sha)):
        sys.path.insert(0, str(DATA_ROOT / "scripts"))
        import magic_active_paper as active_paper
        active_path = active_path or active_paper.ACTIVE_PATH
        source_path = source_path or active_paper.RECONSTRUCTION_SOURCE_PATH
        original_path = original_path or active_paper.ORIGINAL_PATH
        expected_original_sha = (expected_original_sha or
                                 active_paper.ORIGINAL_PRESERVED_SHA256)
    active_path, source_path, original_path = map(
        Path, (active_path, source_path, original_path))
    active_bytes = active_path.read_bytes()
    active = json.loads(active_bytes)
    source = json.loads(source_path.read_text(encoding="utf-8"))
    original_sha = hashlib.sha256(original_path.read_bytes()).hexdigest()
    if original_sha != expected_original_sha.lower():
        raise ValueError("preserved original hash changed")
    if not isinstance(active, dict) or not isinstance(source, dict):
        raise ValueError("active or reconstruction source is not an object")
    identity = active.get("ledgerIdentity")
    if not isinstance(identity, str) or not identity or identity != source.get("ledgerIdentity"):
        raise ValueError("active paper ledger identity mismatch")
    sequence = active.get("officialSequence")
    if type(sequence) is not int or sequence < 1:
        raise ValueError("active paper sequence invalid")
    completed = [str(row.get("date")) for row in active.get("dailyLedger", [])
                 if isinstance(row, dict) and row.get("runStatus") == "COMPLETED"
                 and row.get("date")]
    if not completed:
        raise ValueError("active paper completed ledger absent")
    return {"officialSequence": sequence, "sourceStateSha256":
            hashlib.sha256(active_bytes).hexdigest(), "ledgerIdentity": identity,
            "lastCompletedDate": max(completed), "originalPreserved": True}


def _hold_decision() -> str:
    try:
        sys.path.insert(0, str(DATA_ROOT / "scripts"))
        import magic_paper_lane_hold as hold
        return str(hold.evaluate().get("decision") or "UNKNOWN")
    except Exception:  # noqa: BLE001 — warning is retained, never presumed clear
        return "UNKNOWN"


def source_warnings(served: dict, hold_decision: str) -> list[str]:
    warnings = []
    if served.get("priceFreshnessStatus") != "PASS":
        warnings.append("PRICE_FRESHNESS_NOT_PASS")
    if hold_decision == "HOLD":
        warnings.append("MAGIC_PAPER_HOLD")
    elif hold_decision != "UNHELD":
        warnings.append("MAGIC_PAPER_HOLD_STATE_UNVERIFIED")
    return warnings


def verify_payload(served: dict, active_evidence: dict | None) -> dict:
    """서빙 payload와 공개 생성에 사용한 활성 장부의 동일성 검사."""
    s = served.get("magicOfficialSummary") or {}
    active_evidence = active_evidence or {}
    canonical_seq = active_evidence.get("officialSequence")
    holdings = (served.get("magicOfficialPortfolio") or {}).get("holdings") or []
    days = served.get("magicOfficialTradeDays") or []
    latest = max(days, key=lambda d: str(d.get("date") or "")) if days else {}
    ledger_date = s.get("dataDate")
    checks = {
        "publicSeqMatchesCanonical": (
            type(canonical_seq) is int and type(s.get("officialSequence")) is int
            and s["officialSequence"] == canonical_seq
        ),
        "publicSourceMatchesActiveLedger": (
            isinstance(active_evidence.get("sourceStateSha256"), str)
            and isinstance(s.get("sourceStateSha256"), str)
            and s["sourceStateSha256"] == active_evidence["sourceStateSha256"]
        ),
        "ledgerBasisMatchesActive": (
            bool(active_evidence.get("lastCompletedDate"))
            and s.get("dataDate") == active_evidence["lastCompletedDate"]
        ),
        "activeLedgerIdentityVerified": bool(active_evidence.get("ledgerIdentity")),
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
    try:
        active_evidence = _active_ledger_evidence()
    except (OSError, ValueError, TypeError, ImportError) as error:
        return {"status": "BLOCKED_ACTIVE_LEDGER_EVIDENCE_INVALID",
                "reason": f"활성 장부 증거 불가: {type(error).__name__}", "filesWritten": 0}
    blob = _committed_blob()
    if not blob:
        return {"status": "BLOCKED_NO_COMMITTED_BLOB", "reason": "HEAD 커밋에서 public 산출물을 읽을 수 없음",
                "filesWritten": 0}
    want = hashlib.sha256(blob).hexdigest()
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
    detail = verify_payload(served, active_evidence)
    hold_decision = _hold_decision()
    warnings = source_warnings(served, hold_decision)

    # 페이지 렌더 확인(SSR) — 상태 문구까지 본다.
    pages, page_checks = {}, {}
    for path in ("/", "/performance"):
        c, b = _fetch(f"{base_url}{path}", attempt)
        pages[path] = c
        if path == "/" and c == 200 and b:
            txt = _strip_html(b.decode("utf-8", errors="replace"))
            page_checks["noStalePendingLabel"] = ("최근 갱신 대기 중" not in txt)
            # 일반 가격/추천만 최신화되고 Magic 장부가 intentional HOLD인 경우에는
            # '최신 장부 반영 완료'가 아니라 '장부 미반영'이 정확한 표시다.
            # payload 기준으로 기대 문구를 선택해 HOLD를 정상 동기화로 가장하지 않는다.
            ledger_behind = str(detail.get("ledgerBasisDate") or "") != str(
                detail.get("priceBasisDate") or ""
            )
            page_checks["ledgerStatusLabel"] = (
                "장부 미반영" in txt
                if ledger_behind
                else "최신 장부 반영 완료" in txt
            )
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
        "canonicalSequence": active_evidence["officialSequence"],
        "activeLedgerIdentity": active_evidence["ledgerIdentity"],
        "priceFreshnessStatus": served.get("priceFreshnessStatus"),
        "priceStaleTradingDays": served.get("priceStaleTradingDays"),
        "magicPaperLaneDecision": hold_decision, "sourceWarnings": warnings,
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
    # Windows scheduled PowerShell may capture stdout with a legacy code page.
    print(json.dumps(r, ensure_ascii=True), flush=True)
    return 0 if r["status"] == "LIVE_OK" else 2


if __name__ == "__main__":
    sys.exit(main())
