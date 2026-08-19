import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "./_dashboard/kit";
import {
  MagicStatusStrip,
  MagicNumberBoard,
  MagicTrendCharts,
  MagicTodayPicks,
  MagicFormulaExplainer,
} from "./_dashboard/magic-official";
import {
  MagicPerformanceHero,
  MagicHoldingsAndTrades,
  MagicHowItWorks,
  MagicVerificationPanel,
} from "./_dashboard/magic-first-page";

export const dynamic = "force-dynamic";

// 공개 첫 화면 — WABABA-FIRST-PAGE-PERFORMANCE-HOLDINGS-UX-REFINE-R1
//
// Founder 요구: 메인에 들어온 순간 **수익률**과 **수익률 그래프**가 한눈에 보이고,
// 그 다음 무엇을 보유·매매했는지 이해한 뒤, 운영규칙과 검증자료로 내려갈 수 있어야 한다.
//
// 시각 우선순위 (위 → 아래)
//   1. 누적수익률 / KOSPI / 초과성과 / 총자산       ← MagicPerformanceHero (신규)
//   2. 수익률 그래프 (펀드 vs KOSPI, 같은 %축)      ← MagicTrendCharts (기존 차트 그대로 재사용)
//   3. 현재 보유 / 최근 매수 / 최근 매도            ← MagicHoldingsAndTrades (신규)
//   4. 어떻게 운영하나                              ← MagicHowItWorks (신규)
//   5. 운영 기록 검증(최신성·실주문 0·상세 링크)     ← MagicVerificationPanel (신규)
//   6. 매수 근거 / 공식 산식 / 운영 상세 수치        ← 기존 컴포넌트(개발·검증 성격이라 아래로)
//
// 이전 순서: Hero → 상태 스트립 → 한눈 수치표 → 추이 차트 → 매수 근거 → 공식 설명.
//   문제였던 점: 누적수익률이 개발자용 값(회차·batchId·평가기준일) 아래에 묻히고,
//   그래프가 10개짜리 수치표 뒤 4번째라 첫 화면에서 보이지 않았다.
// 기존 컴포넌트는 삭제하지 않는다 — 순서와 시각 밀도만 바꾼다.
// 장기 백테스트 연구 결과는 이 화면에 노출하지 않는다(내부 연구 정본으로만 유지).
export default function DashboardPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      {/* 1. 성과 우선 — 첫 인상 */}
      <section className="dashSection">
        <MagicPerformanceHero history={history} />
      </section>

      {/* 2. 수익률 그래프 — 메인 핵심 콘텐츠(부가기능처럼 작아지지 않게 Hero 바로 다음) */}
      <section className="dashSection">
        <MagicTrendCharts history={history} />
      </section>

      {/* 3. 무엇을 보유하고 무엇을 사고팔았나 */}
      <section className="dashSection">
        <MagicHoldingsAndTrades history={history} />
      </section>

      {/* 4. 운영 규칙 — 20~30초 안에 이해 */}
      <section className="dashSection">
        <MagicHowItWorks />
      </section>

      {/* 5. 운영 기록 검증 */}
      <section className="dashSection">
        <MagicVerificationPanel history={history} />
      </section>

      {/* 6. 이하 상세 — 매수 근거 / 공식 산식 / 운영 상세 수치 */}
      <section className="dashSection">
        <MagicTodayPicks history={history} />
      </section>

      <section className="dashSection">
        <MagicFormulaExplainer />
      </section>

      <section className="dashSection">
        <MagicStatusStrip history={history} />
      </section>

      <section className="dashSection">
        <MagicNumberBoard history={history} />
      </section>
    </main>
  );
}
