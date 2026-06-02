# 와바바 MVP 운영 매뉴얼

> 작성일: 2026-05-17 (Phase 31-F)
> 적용 대상: 와바바펀드 / 와바바 AI펀드 Strategy Lab Vercel MVP 운영

이 문서는 **MVP 상태** 운영 방식을 그대로 따라 할 수 있게 정리한 매뉴얼이다.
모든 명령은 순서대로 실행하면 안전하게 동작한다.

---

## 1. 현재 운영 구조

```
[데이터 파이프라인 — Python]                  [웹앱 — Next.js / Vercel]
C:\work\kr-stock-agent-data-new                C:\work\kr-stock-agent

scripts/build_recommendation_history.py        app/strategy-lab/page.tsx
  ├─ recommendation-history.json (원본)         ├─ readRecommendationHistory()
  └─ sanitize → public/data/                   │   ├─ 로컬 경로 우선
     recommendation-history.json (공개용)       │   └─ public/data fallback
                                               │
                                               public/data/
                                               recommendation-history.json
                                                  ↓
                                               git push origin master
                                                  ↓
                                               Vercel 자동 배포
                                                  ↓
                                               https://kr-stock-agent.vercel.app
```

핵심:
- **원본 JSON**은 데이터 repo에 있고 webapp이 직접 읽을 수 없다.
- 그래서 **sanitize된 공개용 사본**을 webapp의 `public/data/` 안에 저장한다.
- Vercel은 이 공개용 사본만 본다.

확정 사항 (2026-05-17 기준):
- Vercel URL: `https://kr-stock-agent.vercel.app/strategy-lab`
- webapp origin: `https://github.com/CSI-AI/kr-stock-agent.git` (브랜치 `master`)
- webapp 최신 HEAD 예: `8445ea1`
- public JSON top-level 키: **16개** (sanitize 후)
- public JSON 크기: 약 **389 KB**

---

## 2. 추천 데이터 생성 명령 (안전 모드 필수)

```powershell
cd C:\work\kr-stock-agent-data-new
$env:PYTHONIOENCODING="utf-8"
$env:WABABA_DISABLE_AUTO_TRADE="1"
python scripts\build_recommendation_history.py --no-trade
```

⚠ **절대 금지**: 일반 모드 실행 (`--no-trade` 빼고 그냥 실행) — 자동매매 트리거 위험.

정상 실행 시 출력에 다음 줄이 보여야 한다:
- `[no-trade 모드] 자동매매 스킵 — portfolio/trade 파일 변경 없음`
- `written (public sanitized): C:\work\kr-stock-agent\public\data\recommendation-history.json`
- `written: C:\work\kr-stock-agent-data-new\recommendation-history.json`
- `fundTradeStatus: NO_TRADE_MODE` / `fundOrders: 0`
- `aiFundTradeStatus: NO_TRADE_MODE` / `aiFundOrders: 0`

추가로 보이는 핵심 지표:
- `wababaPicks: N`, `finalBestPick: 종목명` 등

---

## 2-B. QA / DAILY SUMMARY 리포트 생성

데이터 생성 직후 추천 품질을 사람이 빠르게 검토할 수 있도록 QA 리포트를 생성한다.

```powershell
cd C:\work\kr-stock-agent-data-new
python scripts\qa\generate_qa_report.py
python scripts\qa\generate_daily_summary.py
```

생성되는 파일 (데이터 repo `reports/` 폴더):
- `reports\qa-recommendation-YYYY-MM-DD.txt` — 사람용 상세 QA 리포트
- `reports\qa-recommendation-YYYY-MM-DD.json` — 후속 도구 연동용 동일 데이터
- `reports\daily-summary-YYYY-MM-DD.md` — 운영자용 30초 한 페이지 브리핑

⚠ `reports/` 는 데이터 repo `.gitignore` 처리됨 (Phase 32-E) — **commit 대상이 아니다**. 매일 재생성되므로 그대로 사용/삭제 자유.

리포트 활용 가이드:
- 오늘의 종합 **BEST** 확인 (DAILY SUMMARY 최상단)
- **신규 / 연속 / 탈락** 변화 확인 — 매일 교체 흐름 파악
- **오늘 예상 주문 (Dry-Run)** 확인 — 아래 §2-B-1 참조
- **이상치 / 주의 종목** 확인 — qualityWarnings, 영업익 폭증, 성장↑밸류↑(고평가) 등 자동 태그
- **점수 높지만 미선정** TOP5 — 차순위 후보 모니터링
- DAILY SUMMARY 한 페이지로 **30초 운영 판단** 가능

스크립트 자체는 데이터 repo에 commit됨:
- `scripts/qa/generate_qa_report.py` (Phase 32-D, hash `888eca7`)
- `scripts/qa/generate_daily_summary.py` (Phase 32-D, hash `888eca7`; Dry-Run 통합은 Phase 33-C, hash `632cbc9`)

---

### 2-B-1. DAILY SUMMARY 안의 "오늘 예상 주문 (Dry-Run)" 섹션

DAILY SUMMARY MD 파일 안에는 추천 흐름(BEST·신규/연속/탈락) 직후에
**"## 오늘 예상 주문 (Dry-Run)"** 섹션이 자동으로 표시된다.

이 섹션이 보여주는 것:
- **와바바펀드 / 와바바AI펀드** 각각의 예상 BUY / SELL 주문
- 각 주문의 종목명·코드·수량·예상 금액·사유
- 주문 후 예상 현금 잔액
- **위험 체크** 결과: 현금 부족 / 종목 비중 초과 / 중복 매수 / 가격 0 / 일일 한도 초과 / 1주 매수 예산 미달
- **MARKET_CLOSED** 여부 (개장일이 아니면 실제 주문은 발생하지 않음을 안내)

⚠ **이 섹션은 dry-run (시뮬레이션) 결과다.**
- `build_recommendation_history.py`의 read-only 헬퍼만 import해 계산한다.
- `apply_*_auto_trading` / `write_json` / `main()` 어떤 것도 호출하지 않는다.
- `portfolio.json` / `trade-history.json` / `wababa-auto-trade-log.json` / `wababa-ai-*` 파일을 **절대 수정하지 않는다**.
- 따라서 이 섹션이 보여주는 주문은 "지금 자동매매 게이트를 다 통과시켰다면 어떤 주문이 만들어졌을지"의 예상치다.

⚠ **자동매매 ON 직전 반드시 이 섹션을 먼저 확인한다.**
- WABABA / AI 양쪽 예상 주문이 의도와 일치하는지
- 위험 체크에 ⚠ 항목이 0건인지
- MARKET_CLOSED 안내가 아닌지 (평일 확인용)
- 매수 후 현금이 minCashRate 이상으로 남는지

빠른 모드:
- `python scripts\qa\generate_daily_summary.py --no-dry-run`
- Dry-Run 계산을 생략해 빠르게 요약만 보고 싶을 때 사용 (기본은 포함)

---

## 2-C. 실제 자동매매 일일 스케줄 (현재 ON 상태)

⚠ **중요**: 자동매매는 **현재 ON 상태로 운영 중**이다. 매일 평일 08:45에 Windows 작업 스케줄러가 자동으로 실행하며, 실제 portfolio / trade-history / auto-trade-log 파일을 갱신한다.

Phase 34-E (2026-05-18)에서 실행 체인을 추적해 확인했고, **Phase 35-B (2026-05-19)에서 localhost:3001 dev server 의존을 제거**했다.

### 실행 체인 (Phase 35-B 이후)

```
Windows 작업 스케줄러 "Wababa Auto Daily" (매일 08:45)
  ↓ powershell.exe -ExecutionPolicy Bypass -File ...
C:\work\kr-stock-agent\scripts\run-wababa-auto-daily.ps1
  ↓ & python (직접 실행 — localhost API 미경유)
C:\work\kr-stock-agent-data-new\scripts\build_recommendation_history.py
  ↓ apply_wababa_fund_auto_trading + apply_wababa_ai_fund_auto_trading
실제 portfolio.json / trade-history.json / wababa-auto-trade-log.json 갱신
실제 wababa-ai-portfolio.json / wababa-ai-trade-history.json / wababa-ai-auto-trade-log.json 갱신
public sanitized JSON 직접 작성: C:\work\kr-stock-agent\public\data\recommendation-history.json
```

⚠ **참고**: Phase 35-B 이전에는 ps1이 `Invoke-RestMethod http://localhost:3001/api/wababa-auto-daily` 로 Next.js dev server 의 route.ts 를 호출했다. 그 구조는 dev server가 꺼지면 자동매매가 실패했으므로, ps1 안에서 직접 python 을 호출하도록 단순화했다.

### 운영자 관점 요약

| 항목 | 값 |
|---|---|
| 작업 스케줄러 작업명 | `Wababa Auto Daily` |
| 실행 시각 | 매일 08:45 (Windows 작업 스케줄러 트리거) |
| 실행 시간 조건 | 08:40 이후 (ps1 시간 가드 — route.ts isAfterRunTime 대체) |
| 평일/휴장일 판단 | `build_recommendation_history.py` 내부 `is_market_open_day` 가 담당 |
| `--no-trade` 사용 여부 | **사용 안 함** → 실제 매매가 발생함 |
| 중복 실행 차단 | `has_auto_trade_log_for_date` (Python 내부, line 732 + 5472) |
| 결과 기록 | `wababa-auto-daily-task-last-result.json` (ps1이 추출 요약), 각 펀드 auto-trade-log (Python이 작성) |
| public JSON 갱신 | Python 안 `write_public_recommendation_history()` 가 직접 작성 |

### 현재 의존성

- **localhost:3001 dev server 의존 없음** (Phase 35-B 이후).
- Dev server가 꺼져 있어도 자동매매 정상 동작. UI 패널 / 수동 재실행 API는 보조 기능으로 남아 있음 — 사용자가 원할 때 페이지 열어 `WababaAutoDailyPanel` 의 GET /api/wababa-auto-daily 호출 가능 (이 때만 dev server 필요).
- Python 실행 환경(작업 스케줄러 컨텍스트의 PATH 에 `python` 존재) 은 필요. 작업 스케줄러가 매일 08:45 실행해 LastTaskResult=0 이면 정상.

### 중복 매수 방지

`build_recommendation_history.py` 안의 두 가드가 같은 날짜 재실행을 자동으로 막는다.

- `apply_wababa_fund_auto_trading` (line 732): `has_auto_trade_log_for_date(today)` 이면 `ALREADY_EXECUTED` 리턴
- `apply_wababa_ai_fund_auto_trading` (line 5472): 동일 가드 (AI 펀드용)

Phase 35-B 이전에는 route.ts 의 `state.lastRunDate === today && lastStatus === "DONE"` 가드가 한 겹 더 있었으나, 이제는 Python 내부 가드만으로 중복 방지를 담당한다 (검증 완료). 강제 재실행은 webapp 이 켜진 상태에서 `POST /api/wababa-auto-daily?mode=rerun-today` 또는 사용자가 직접 python 명령으로 가능.

### Dry-Run 시스템과의 관계

- `generate_daily_summary.py` 의 "오늘 예상 주문 (Dry-Run)" 섹션은 이 자동매매가 **이미 실행된 후**에는 "이미 매수된 종목은 제외"하고 다음 후보를 보여준다. has_auto_trade_log 가드를 우회한 read-only 시뮬레이션이므로 어떤 시점에도 안전하게 호출 가능.
- 2026-05-18 사례: 33-B Dry-Run 예측(에스엠 / 서호전기 / SK스퀘어) = 실제 자동매매 체결 결과와 **100% 일치** 검증됨.

### 자동매매 일시 중지 방법 (참고용 — Claude는 실행 금지)

운영자가 자동 실행을 멈추려면 **관리자 권한 PowerShell**에서:

```powershell
Disable-ScheduledTask -TaskName "Wababa Auto Daily"
```

⚠ Claude Code는 이 명령을 절대 실행하지 않는다. 사용자가 정책 결정 후 직접 실행해야 한다.

재활성화:

```powershell
Enable-ScheduledTask -TaskName "Wababa Auto Daily"
```

dev server 를 끄면 UI 패널 / 수동 재실행 API 만 막힐 뿐 자동 매매 스케줄 자체는 그대로 동작한다 (Phase 35-B 이후).

### 장기 개선 후보 (지금은 보류)

남은 약점:
- Python 실행 환경 (PATH 에 `python` 존재) 이 작업 스케줄러 컨텍스트에서 유지돼야 함
- Vercel 반영 (public/data/recommendation-history.json commit + push) 은 여전히 수동

개선 옵션 (별도 Phase 후보):
1. **kr-stock-agent-daily-run 작업 정상화 또는 비활성화** — 매일 08:30 실패 중 (python PATH/WorkingDirectory 이슈). 정상화하면 시장/뉴스 데이터까지 갱신, 비활성화하면 노이즈 제거
2. **public JSON 자동 commit/push** — 매일 자동매매 후 webapp repo 단일 파일을 자동 push (시크릿 누출 방지 + 충돌 시 안전 처리 필요)
3. **클라우드 Cron (Vercel Cron / GitHub Actions)** — 로컬 PC 의존 자체 제거
4. **PM2 / NSSM 등으로 webapp UI 패널을 Windows Service 화** — UI 보조 기능을 항상 켜두고 싶을 때 (자동매매 본 흐름과는 무관)

지금은 자동매매 본 흐름이 안정되어 있으므로 보류. 사용자 요청 시 별도 Phase 진행.

---

## 2-D. 공개 데이터 신선도 / 누출 점검 (push 직전 필수 게이트) — Phase 41-A

`build_recommendation_history.py`는 public sanitized JSON을 매일 자동 갱신하지만,
**Vercel 반영(commit + push)은 수동**이다. 데이터가 갱신돼도 push를 잊으면 공개 링크가 옛 날짜에 머문다(stale 재발).
push 직전에 아래 read-only 점검을 돌려 신선도·배포 반영·민감필드 누출을 한 번에 확인한다.

```powershell
cd C:\work\kr-stock-agent
$env:PYTHONIOENCODING="utf-8"
python scripts\qa\check_public_data_freshness.py
```

이 스크립트가 하는 일 (쓰기/commit/push 없음, 순수 읽기):
- 공개 작업본 `public/data/recommendation-history.json`의 `baseDate` / `generatedAt` 출력
- **REPO2 원본**(`kr-stock-agent-data-new/recommendation-history.json`)과 기준일 일치 확인 → sanitize/동기화 누락 탐지
- **git HEAD(=배포본)**와 기준일 비교 → 작업본이 더 최신이면 "커밋/푸시 필요(미반영)" 로 **FAIL** (stale 재발 차단)
- top-level 키 수(기대 16), 민감 키(token/secret/path 등), 로컬 경로(`C:\...`) 노출 검사
- 정상이면 `결과: PASS`, 문제 있으면 `결과: FAIL` + exit code 1

판정 활용:
- **PASS** → §4 절차로 단일 파일 commit + push 진행.
- **FAIL: ... 커밋/푸시 필요** → 데이터는 신선한데 배포만 안 됨. §4 절차로 push하면 해소.
- **FAIL: 로컬 경로(C:\...) 노출 필드** → 아래 §2-D-1 알려진 이슈 참조.

### 2-D-1. 알려진 이슈 — `tradeHistoryPath` 로컬 경로 노출 (미해결, 별도 Phase)

현재 공개 JSON에 로컬 절대경로가 노출되어 있다(Phase 41-A에서 점검 스크립트로 발견):
- `performanceAnalysis.tradePerformance.tradeHistoryPath`
- `aiPerformanceAnalysis.tradePerformance.tradeHistoryPath`
- 값 예: `C:\work\kr-stock-agent-data-new\trade-history.json`

이 값은 공개 URL(`/data/recommendation-history.json`)로 그대로 노출되어 운영 PC 경로 구조가 드러난다(민감도 낮으나 불필요).
**해결은 REPO2 `build_recommendation_history.py`의 sanitize 단계에서 해당 필드를 제거**해야 하며, REPO2 수정이 필요하므로 별도 Phase로 진행한다. 그전까지 freshness 점검은 이 항목으로 FAIL을 띄운다(의도된 알림).

---

## 3. sanitized public JSON 생성 확인법

데이터 생성 후 webapp의 공개용 사본이 갱신됐는지 확인한다.

```powershell
cd C:\work\kr-stock-agent
dir public\data\recommendation-history.json
```

확인 포인트:
- **수정 시간(LastWriteTime)** 이 방금 시각으로 갱신
- **크기** 약 300~500KB 범위

더 자세히 보고 싶으면 (선택):

```powershell
cd C:\work\kr-stock-agent
node -e "const fs=require('fs');const o=JSON.parse(fs.readFileSync('public/data/recommendation-history.json','utf-8'));console.log('keys',Object.keys(o).length);console.log('BEST',o?.finalBestPick?.corpName);console.log('wababaPicks',o?.wababaPicks?.length)"
```

기대값:
- `keys 16`
- `BEST <종목명>` (예: `YG PLUS`)
- `wababaPicks 3` (또는 그때 추천 수)

---

## 4. webapp public JSON만 commit / push 하는 법

⚠ **단일 파일만** stage. `git add .` 절대 금지.

```powershell
cd C:\work\kr-stock-agent
git status --short
git add public/data/recommendation-history.json
git diff --cached --name-only
```

`git diff --cached --name-only` 결과는 **반드시 아래 한 줄만** 나와야 한다:
```
public/data/recommendation-history.json
```

다른 파일이 함께 staged 되어 있으면 **즉시 중단**하고 원인 확인.

확인 후 commit + push:

```powershell
git commit -m "chore(data): refresh public recommendation history"
git push
```

push 결과 예시:
```
2472dfd..8445ea1  master -> master
```

---

## 5. Vercel 반영 확인법

push 후 Vercel이 자동 배포 (보통 20~60초 안에 반영).

브라우저 확인:
- https://kr-stock-agent.vercel.app/strategy-lab

확인 포인트:
- 페이지가 정상 표시 (빈 화면 아님)
- 상단에 **"오늘의 종합 BEST"** + 종목명
- **"오늘의 매수 후보 TOP 5"** 와 **"AI 발굴 유망 종목 TOP 5"** 둘 다 노출
- 와바바 펀드 / 와바바 AI 펀드 카드 정상

PowerShell에서 curl로도 확인 가능:

```powershell
curl.exe -sI https://kr-stock-agent.vercel.app/strategy-lab
curl.exe -sI https://kr-stock-agent.vercel.app/data/recommendation-history.json
```

기대값:
- `HTTP/1.1 200 OK`
- public JSON: `Content-Length: 약 390000~500000` (300~500KB)

---

## 6. 절대 commit 하면 안 되는 파일

webapp repo에서 commit하면 안 되는 파일:

| 파일 | 이유 |
|---|---|
| `next-env.d.ts` | Next.js 자동 생성, git이 추적해도 commit 대상 아님 |
| `data/financial-universe-real.json` | 운영 데이터 (untracked로 관리) |
| `data/financial-universe-upstream-sample.json` | 운영 데이터 (untracked로 관리) |

⚠ `git add .` 또는 `git add -A`를 쓰면 위 파일들이 함께 묶일 수 있다. **반드시 단일 파일 명시**.

### 6-1. `next-env.d.ts`가 계속 dirty로 뜨는 이유 (Phase 41-A 조사)

`next-env.d.ts`는 Next.js가 자동 생성하는 파일로 git에 **추적은 되지만 commit하면 안 된다**(파일 상단에도 `This file should not be edited` 명시).
계속 dirty로 뜨는 원인은 dev/build가 이 파일의 import 경로를 서로 다르게 다시 쓰기 때문이다:
- `npm run dev` 실행 후 → `import "./.next/dev/types/routes.d.ts";`
- `npm run build` 실행 후 → `import "./.next/types/routes.d.ts";`

즉 dev와 build를 번갈아 돌리면 이 한 줄이 `/dev/types` ↔ `/types` 로 계속 바뀌어 항상 변경 상태가 된다. **정상 동작이며 무시 대상**이다.

처리 방법:
- (현행 유지) 그냥 두고 **절대 stage하지 않는다**. freshness 점검·commit 절차 모두 이 파일을 건드리지 않는다.
- (원하면, 별도 Phase) `.gitignore`에 `next-env.d.ts` 추가 + `git rm --cached next-env.d.ts`로 추적 해제하면 dirty 표시 자체가 사라진다. 단 이는 추적 상태 변경이라 별도 커밋이 필요하므로 이번 운영 점검 범위 밖이다.

원상복구가 필요하면(다른 작업 전 깨끗이): `git restore next-env.d.ts` (단 다음 dev/build에서 다시 바뀜).

---

## 7. 데이터 repo diverged 상태와 보류 이유

데이터 repo (`C:\work\kr-stock-agent-data-new`)는 **origin/main과 diverged 상태**다.

- 로컬 main HEAD: `d3d4110 refactor(data): sanitize public recommendation history`
- origin/main HEAD: `b7d66cc chore: refresh financial universe`
- 양쪽이 갈라진 시점(merge-base): `e7f5996`
- 로컬이 10 commit 앞 (와바바 Phase 22~31 작업), origin이 21 commit 앞 (다른 환경의 daily refresh)

**현재는 push하지 않는다.** 이유:
- 사용자 안전 규칙으로 `force push / reset / rebase / merge commit 추가` 모두 금지
- webapp Vercel은 이미 sanitized public JSON으로 정상 운영 중 — 데이터 repo push 없이도 무관

**해결은 별도 Phase에서**. 옵션:
1. 별도 브랜치 push 후 PR 흐름
2. 사용자가 GitHub UI에서 수동 merge
3. 보류 유지

운영상 영향: 없음.

---

## 8. Supabase Storage 이전 — 중기 과제 (지금은 보류)

현재 sanitize MVP의 단점:
- public JSON이 git에 commit되어 history 비대 (~389KB/매 commit)
- 외부 URL `/data/recommendation-history.json`이 누구나 접근 가능

향후 Phase 31-B (중기):
- `daily_run.py` → Supabase Storage (private bucket) upload
- Vercel server-side에서 service_role 키로 fetch
- 장점: git history 비대 회피 + URL 노출 제거 + 실시간 갱신
- 단점: Supabase 설정 + Vercel 환경변수 관리 작업

**지금은 보류**. MVP 운영이 안정되면 진입.

---

## 9. 문제가 생겼을 때 확인 순서

### A. Vercel 화면이 빈 데이터로 보임
1. `https://kr-stock-agent.vercel.app/data/recommendation-history.json` 직접 접속해서 HTTP 200 + 내용 확인
2. 200인데도 빈 화면이면 webapp 빌드 캐시 문제 — Vercel 대시보드에서 재배포
3. 404이면 `public/data/recommendation-history.json`이 webapp repo에 commit되지 않음 → 4번 절차 다시 실행

### B. `git add` 시 다른 파일이 함께 staged됨
1. `git restore --staged <파일>` 으로 해당 파일만 unstage
2. 또는 처음부터 `git reset` 후 `git add public/data/recommendation-history.json` 단일 명령으로 다시

### C. push가 거부됨 (rejected)
- webapp이면 `git pull --ff-only` 후 다시 push (충돌 시 보고)
- ⚠ `--force` 절대 금지
- 데이터 repo면 보류 (7번 항목 참조)

### D. 자동매매가 발생했음 (의도 외)
- ⚠ 매우 위험. 즉시 보고
- `--no-trade` 누락 또는 `WABABA_DISABLE_AUTO_TRADE` 환경변수 누락 의심
- portfolio.json / trade-history.json / wababa-*-auto-trade-log.json 변경 확인

### E. tsc / build 실패
- `npx tsc --noEmit` 단독 실행해서 오류 메시지 확인
- `npm run build` 단독 실행
- public JSON 구조가 깨졌으면 데이터 생성 단계로 돌아가서 다시 실행

### F. 데이터 생성 출력에 `written (public sanitized): ...` 가 없음
- `build_recommendation_history.py` 안의 `write_public_recommendation_history()` 호출이 누락된 상태
- 보고 후 코드 점검 (Phase 31-C-Impl 변경 누락 가능성)
- 또는 `public/data/` 디렉토리 존재 안 함 → `mkdir -p public/data` 후 재실행

---

## 10. 운영 루틴 한 줄 요약

```
[데이터 생성 (no-trade)] → [QA + DAILY SUMMARY 리포트 생성] → [freshness 점검(check_public_data_freshness.py)] → [git add 단일 파일 → commit → push] → [Vercel 자동 배포 확인]
```

이 흐름만 지키면 MVP 운영이 깨지지 않는다.
특히 **freshness 점검을 push 직전 게이트로 삼으면** "데이터는 갱신됐는데 push를 잊어 공개 링크가 stale" 사고가 반복되지 않는다(§2-D).
