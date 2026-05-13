# CURRENT_STATUS.md

> 이 파일은 Claude Code가 다음 작업 전에 항상 참고하는 프로젝트 현황 문서입니다.
> 작업이 완료될 때마다 사용자 지시에 따라 갱신합니다.

---

## 프로젝트명

와바바 (Why Buy & Bye?)

---

## 프로젝트 목적

국내주식 가치성장 투자 운영 에이전트 웹앱.
고성장·저평가 종목을 분석하고, 와바바펀드와 와바바AI펀드를 운영/비교하는 것이 목적.

---

## 현재 큰 구조

| 항목 | 경로 |
|------|------|
| 웹앱 루트 | `C:\work\kr-stock-agent` |
| 데이터/Python 루트 | `C:\work\kr-stock-agent-data-new` |
| 웹앱 프레임워크 | Next.js (App Router) |
| 데이터 생성 | Python 스크립트 기반 |
| 메인 화면 | `strategy-lab` 중심 |

---

## 현재 펀드 구조

| 펀드 | 파일 | recommendation-history.json 필드 |
|------|------|----------------------------------|
| 와바바펀드 | `portfolio.json` | `fundTradeResult`, `portfolioSummary` |
| 와바바AI펀드 | `wababa-ai-portfolio.json` | `aiFundTradeResult`, `aiPortfolioSummary` |

두 펀드 실행 결과는 `recommendation-history.json` 에 함께 저장됨.

---

## 현재 완료된 작업

- [x] `AGENT_RULES.md` 생성 완료 — 와바바 투자 철학·개발 규칙 문서화
- [x] `WababaAutoDailyPanel.tsx` 개선 완료
  - 와바바펀드(파랑) / 와바바AI펀드(보라) 색상 카드로 시각 구분
  - `totalAssetAmount` / `aiTotalAssetAmount` 평가금액 표시 반영
  - 두 펀드 실행 버튼 및 자동운용 상태 표시 유지
  - API 로직·폴링 주기 변경 없음
- [x] 타입 오류 안정화 완료 (15개 → 0개)
  - `app/(backup)page.tsx` → `// @ts-nocheck` 적용
  - `financial-score-engine.ts` → `FinancialBreakdown` 필드 초기화, `raw` 제거
  - `strategy-engine.ts` → `scoreStocks` 인자 수정
  - `build-daily-report.ts` → `label: string` 타입 애노테이션
  - `build-report-change-context.ts` → `// @ts-nocheck` 적용 (미사용 파일)
  - `strategy-lab/reviewed/delete/route.ts` → `export {}` 추가

---

## 현재 중요한 파일

| 파일 | 역할 |
|------|------|
| `AGENT_RULES.md` | 개발 운영 규칙 기준 문서 |
| `app/strategy-lab/_components/WababaAutoDailyPanel.tsx` | 두 펀드 자동운용 패널 UI |
| `app/strategy-lab/_components/PortfolioHoldingsTable.tsx` | 보유 종목 테이블 |
| `app/api/wababa-auto-daily/route.ts` | 자동 일일 운용 API |
| `lib/strategy/strategy-lab-real-loader.ts` | 실제 데이터 JSON 로더 |
| `lib/strategy/strategy-engine.ts` | 전략 핵심 엔진 |
| `lib/scoring/financial-score-engine.ts` | 종목 점수 계산 |
| `utils/portfolio/portfolio-engine.ts` | 포트폴리오 연산 |

---

## 수정 위험 파일

다음 파일은 직접 수정 금지. 반드시 조사 → 계획 → 승인 후 진행.

| 파일 | 위험 이유 |
|------|-----------|
| `C:\work\kr-stock-agent-data-new\portfolio.json` | 실제 펀드 상태 (Python이 관리) |
| `C:\work\kr-stock-agent-data-new\wababa-ai-portfolio.json` | 실제 AI펀드 상태 (Python이 관리) |
| `C:\work\kr-stock-agent-data-new\recommendation-history.json` | 1.1MB 누적 추천·거래 이력 |
| `C:\work\kr-stock-agent-data-new\trade-history.json` | 거래 기록 (손익 계산 기반) |
| `.env.local` | API Key·경로 등 민감 정보 — 출력 금지 |
| Python 자동운용 스크립트 전체 | 실제 거래 데이터 덮어쓰기 위험 |

---

## 현재 다음으로 필요한 작업 후보

1. 두 펀드 보유 종목을 화면에서 각각 따로 표시
2. 와바바펀드 / 와바바AI펀드 수익률과 평가손익 비교 강화
3. 추천 종목과 실제 보유 종목 연결 표시
4. 매수/보유/매도 판단 근거를 더 직관적으로 표시
5. 실제 운용 리포트 화면 정리

---

## 개발 원칙 요약

- `AGENT_RULES.md`를 최우선 기준으로 삼을 것
- 작업 순서: **조사 → 계획 → 승인 → 수정 → 검증**
- 파일 수정은 최소화, 전체 교체 시 replacement 코드로 제시 후 승인
- 데이터 JSON 직접 수정 금지
- `.env.local` 내용 출력 금지
- `git add / commit / push` 금지

---

*최초 작성: 2026-05-07 | 작성자: Claude Code (사용자 지시 기반)*
*최종 갱신: 2026-05-07 | 타입 오류 안정화 완료 (15개 → 0개)*
