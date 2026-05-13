# NEXT_TASK.md

> Claude Code가 다음 작업을 안전하게 이어갈 수 있도록 작성된 구체적인 작업 지시서입니다.
> 반드시 AGENT_RULES.md와 CURRENT_STATUS.md를 함께 참고할 것.

---

## 다음 작업명

와바바펀드 / 와바바AI펀드 보유종목 분리 표시 조사 및 개선

---

## 작업 목표

현재 상단 자동운용 패널(`WababaAutoDailyPanel.tsx`)에서는 두 펀드가 파랑/보라로 구분되어 있다.
그러나 아래 보유종목/포트폴리오 영역은 아직 와바바펀드 중심일 가능성이 있다.

이번 작업의 목표:

- **와바바펀드 보유종목**
- **와바바AI펀드 보유종목**

을 화면에서 각각 구분해서 보여줄 수 있는지 조사하고,
가능하면 최소 파일 수정으로 UI를 개선하는 것이다.

---

## 우선 조사할 파일

다음 파일을 순서대로 읽고 구조를 요약할 것:

1. `app/strategy-lab/_components/PortfolioHoldingsTable.tsx`
2. `app/strategy-lab/page.tsx`
3. `lib/strategy/strategy-lab-real-loader.ts`
4. `app/api/wababa-auto-daily/route.ts`
5. `C:\work\kr-stock-agent-data-new\portfolio.json`
6. `C:\work\kr-stock-agent-data-new\wababa-ai-portfolio.json`

> **주의**: `portfolio.json`과 `wababa-ai-portfolio.json`은 전체 출력 금지.
> 구조와 주요 필드만 요약할 것.

---

## 반드시 확인할 내용

1. 현재 보유종목 테이블이 어느 파일에서 렌더링되는지
2. `PortfolioHoldingsTable.tsx`가 어떤 props를 받는지
3. 현재 와바바AI펀드 보유종목 데이터가 화면까지 전달되는지
4. 전달되지 않는다면 어느 파일에서 추가로 읽어야 하는지
5. 최소 수정 파일 1~3개가 무엇인지
6. 한 파일만 수정 가능한지 여부
7. API 수정이 필요한지 여부
8. 데이터 JSON 수정 없이 가능한지 여부

---

## 원하는 UI 방향

- 와바바펀드와 와바바AI펀드를 명확히 구분
- 와바바펀드: 파란 계열
- 와바바AI펀드: 보라 계열
- 초보자도 이해 가능하게 표시
- 표시 항목: 종목명 · 평균단가 · 현재가 · 평가금액 · 평가손익 · 수익률
- 텍스트 설명은 짧게, 숫자 중심
- 가로 삐져나감 방지
- 모바일에서도 읽기 좋게

---

## 작업 순서

```
1. 파일 조사 (읽기만, 수정 금지)
2. 현재 데이터 흐름 요약 보고
3. 수정 계획 제안 (수정 파일 목록 + 이유 명시)
4. 사용자 승인 대기
5. 승인 후에만 파일 수정
6. 수정 후 npx tsc --noEmit 검증
```

---

## 금지 사항

| 금지 항목 | 이유 |
|-----------|------|
| 승인 전 파일 수정 | 작업 순서 위반 |
| `portfolio.json` 직접 수정 | Python이 관리하는 실제 펀드 상태 |
| `wababa-ai-portfolio.json` 직접 수정 | Python이 관리하는 실제 AI펀드 상태 |
| `recommendation-history.json` 직접 수정 | 누적 추천·거래 이력 파괴 위험 |
| `.env.local` 출력 | 민감 정보 포함 |
| API Key 출력 | 보안 |
| 무단 리팩토링 | 범위 외 변경 금지 |
| `git add / commit / push` | 사용자가 직접 결정 |
| Python 스크립트 무단 실행 | 실제 거래 데이터 덮어쓰기 위험 |

---

## 완료 보고 형식

작업 후 반드시 아래 형식으로 보고:

```
1. 변경 파일 목록 (경로 + 줄 수)
2. 변경 이유
3. 두 펀드 데이터 흐름 요약
4. 검증 명령어
5. 검증 결과
6. 다음 추천 작업
```

---

*최초 작성: 2026-05-07 | 작성자: Claude Code (사용자 지시 기반)*
