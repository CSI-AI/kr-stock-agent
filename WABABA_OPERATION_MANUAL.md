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
- **이상치 / 주의 종목** 확인 — qualityWarnings, 영업익 폭증, 성장↑밸류↑(고평가) 등 자동 태그
- **점수 높지만 미선정** TOP5 — 차순위 후보 모니터링
- DAILY SUMMARY 한 페이지로 **30초 운영 판단** 가능

스크립트 자체는 데이터 repo에 commit됨 (Phase 32-D, hash `888eca7`):
- `scripts/qa/generate_qa_report.py`
- `scripts/qa/generate_daily_summary.py`

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
| `next-env.d.ts` | Next.js 빌드 자동 생성, git이 추적해도 commit 대상 아님 |
| `data/financial-universe-real.json` | 운영 데이터 (untracked로 관리) |
| `data/financial-universe-upstream-sample.json` | 운영 데이터 (untracked로 관리) |

⚠ `git add .` 또는 `git add -A`를 쓰면 위 파일들이 함께 묶일 수 있다. **반드시 단일 파일 명시**.

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
[데이터 생성 (no-trade)] → [QA + DAILY SUMMARY 리포트 생성] → [public JSON 갱신 자동 확인] → [git add 단일 파일 → commit → push] → [Vercel 자동 배포 확인]
```

이 흐름만 지키면 MVP 운영이 깨지지 않는다.
