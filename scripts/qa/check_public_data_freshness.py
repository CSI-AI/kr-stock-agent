#!/usr/bin/env python3
"""공개 데이터 신선도 / 배포 반영 / 민감필드 점검 (READ-ONLY).

와바바 Phase 41-A. 매일 daily_run 이후 공개 링크(Vercel)에 최신 데이터가
반영됐는지 push 직전에 빠르게 확인하기 위한 점검 스크립트.

이 스크립트는 절대 파일을 쓰지 않고, git commit/push도 하지 않는다.
오직 읽기(파일 read + `git show`)만 수행한다.

판정:
  - PASS (exit 0): 공개 작업본이 신선하고, 배포본과 일치하며, 민감필드 누출 없음.
  - FAIL (exit 1): stale / 미반영 / 민감필드 누출 등 사람이 조치해야 하는 문제.
  - ERROR(exit 2): 공개 JSON 자체가 없거나 파싱 불가.

사용:
  cd C:\\work\\kr-stock-agent
  python scripts\\qa\\check_public_data_freshness.py
  python scripts\\qa\\check_public_data_freshness.py --allow-unpublished
    (자동 publish 사전점검용 - '미반영(새 데이터 미커밋)'을 NOTE로 처리하고
     누출/sanitize/원본불일치만 FAIL로 본다.)
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Any

# 콘솔 인코딩(cp949 등)에서도 한글/기호가 깨지거나 크래시하지 않도록 UTF-8로 출력.
try:  # Python 3.7+
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):  # pragma: no cover
    pass

# scripts/qa/ 기준으로 repo1 루트는 두 단계 위.
REPO1 = Path(__file__).resolve().parents[2]
PUBLIC_PATH = REPO1 / "public" / "data" / "recommendation-history.json"
PUBLIC_REL = "public/data/recommendation-history.json"

# REPO2 원본(옆 디렉토리 가정). 못 찾으면 원본 대조는 생략한다.
REPO2_ORIGINAL_CANDIDATES = [
    REPO1.parent / "kr-stock-agent-data-new" / "recommendation-history.json",
]

# sanitize 후 기대 top-level 키 수 (WABABA_OPERATION_MANUAL.md §1).
# Phase 43-C: 마법공식 공개 최소 5키(magicPortfolio/Summary/RecentActions/FundPolicy/Formula) 추가 -> 16+5=21
EXPECTED_TOP_KEYS = 21
# 기준일이 이만큼 지나면 정보성 경고(연속 휴장이 아니면 daily_run 점검 권장).
STALE_DAYS = 3

SENSITIVE_KEY = re.compile(
    r"token|secret|password|passwd|api[_-]?key|credential|private|cookie|session",
    re.I,
)
# 드라이브 경로 노출 (C:\... 형태). 단일 드라이브 문자 + 콜론 + 백슬래시.
# URL("https://"의 s:/)이나 시각("08:48:34")은 매칭되지 않도록 백슬래시로 한정.
WIN_PATH = re.compile(r"(?<![A-Za-z])[A-Za-z]:\\")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as file:
        return json.load(file)


def get_dates(data: dict[str, Any]) -> tuple[Any, Any]:
    return data.get("baseDate"), data.get("generatedAt")


def all_keys(obj: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(obj, dict):
        for key, value in obj.items():
            found.add(str(key))
            found |= all_keys(value)
    elif isinstance(obj, list):
        for item in obj:
            found |= all_keys(item)
    return found


def find_path_leaks(obj: Any, path: str = "") -> list[str]:
    """드라이브 경로(C:\\...)가 들어간 문자열 값의 위치(json-path)를 모은다."""
    leaks: list[str] = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            leaks += find_path_leaks(value, f"{path}.{key}")
    elif isinstance(obj, list):
        for index, item in enumerate(obj):
            leaks += find_path_leaks(item, f"{path}[{index}]")
    elif isinstance(obj, str) and WIN_PATH.search(obj):
        leaks.append(path.lstrip("."))
    return leaks


def git_head_public() -> dict[str, Any] | None:
    """배포(=git HEAD)에 들어간 공개 JSON. 조회 실패 시 None."""
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{PUBLIC_REL}"],
            cwd=str(REPO1),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except FileNotFoundError:
        return None
    if result.returncode != 0 or not result.stdout.strip():
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def main() -> int:
    problems: list[str] = []
    notes: list[str] = []
    # 자동 publish 사전점검: 작업본이 배포본보다 최신(아직 미반영)인 상태는
    # 정상(=publish 대상)이므로 FAIL이 아닌 NOTE로 처리한다. 누출/sanitize/원본불일치는
    # 이 플래그와 무관하게 그대로 FAIL로 남겨 publish를 차단한다.
    allow_unpublished = "--allow-unpublished" in sys.argv

    if not PUBLIC_PATH.exists():
        print(f"ERROR: 공개 JSON이 없습니다: {PUBLIC_PATH}")
        return 2
    try:
        public = load_json(PUBLIC_PATH)
    except json.JSONDecodeError as error:
        print(f"ERROR: 공개 JSON 파싱 실패: {error}")
        return 2

    pub_base, pub_gen = get_dates(public)
    print(f"[public 작업본]  baseDate={pub_base}  generatedAt={pub_gen}")

    # 1) REPO2 원본과 기준일 일치 여부 (sanitize/동기화 누락 탐지).
    repo2 = next((p for p in REPO2_ORIGINAL_CANDIDATES if p.exists()), None)
    if repo2 is not None:
        try:
            original = load_json(repo2)
            o_base, o_gen = get_dates(original)
            print(f"[REPO2 원본]    baseDate={o_base}  generatedAt={o_gen}")
            if pub_base != o_base:
                problems.append(
                    f"공개 작업본 baseDate({pub_base}) != REPO2 원본({o_base}) "
                    "- sanitize/동기화 누락 의심"
                )
        except json.JSONDecodeError:
            notes.append("REPO2 원본 파싱 실패 - 원본 대조 생략")
    else:
        notes.append("REPO2 원본을 찾지 못함 - 원본 대조 생략")

    # 2) 배포(git HEAD) 반영 여부 - stale 재발의 핵심 체크.
    head = git_head_public()
    if head is not None:
        h_base, h_gen = get_dates(head)
        print(f"[git HEAD/배포] baseDate={h_base}  generatedAt={h_gen}")
        if h_base != pub_base:
            message = (
                f"배포본 baseDate({h_base}) != 공개 작업본({pub_base}) "
                f"- '{PUBLIC_REL}' 커밋/푸시 필요(아직 Vercel 미반영)"
            )
            if allow_unpublished:
                notes.append(message + " [자동 publish 대상]")
            else:
                problems.append(message)
    else:
        notes.append("git HEAD 공개본 조회 실패 - 배포 대조 생략")

    # 3) 오늘 기준 경과일 (정보성).
    try:
        base_day = date.fromisoformat(str(pub_base)[:10])
        gap = (date.today() - base_day).days
        if gap >= STALE_DAYS:
            notes.append(
                f"기준일이 {gap}일 경과 - 연속 휴장이 아니면 daily_run 점검 권장"
            )
    except (TypeError, ValueError):
        pass

    # 4) sanitize 점검 (키 수 / 민감 키 / 경로 노출).
    top_keys = list(public.keys())
    print(f"[sanitize]      top-level keys={len(top_keys)} (기대 {EXPECTED_TOP_KEYS})")
    if len(top_keys) != EXPECTED_TOP_KEYS:
        notes.append(
            f"top-level 키 수 {len(top_keys)} (기대 {EXPECTED_TOP_KEYS}) - 구조 변동 확인"
        )
    sensitive = sorted(k for k in all_keys(public) if SENSITIVE_KEY.search(k))
    if sensitive:
        problems.append(f"민감 키 의심: {sensitive}")
    path_leaks = sorted(set(find_path_leaks(public)))
    if path_leaks:
        problems.append(
            "로컬 경로(C:\\...) 노출 필드: " + ", ".join(path_leaks)
        )

    print()
    for note in notes:
        print(f"NOTE: {note}")

    if problems:
        print()
        for problem in problems:
            print(f"FAIL: {problem}")
        print()
        print("결과: FAIL - 위 항목을 조치한 뒤 다시 점검하세요.")
        return 1

    print()
    print("결과: PASS - 공개 데이터 신선 / 배포 반영 / 민감필드 모두 정상.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
