import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "./_dashboard/kit";
import {
  MagicHero,
  MagicStatusStrip,
  MagicNumberBoard,
  MagicTrendCharts,
  MagicTodayPicks,
  MagicFormulaExplainer,
} from "./_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 마법공식펀드 전용 요약 대시보드(Phase MF-UI-MASTER-REFINE):
//  Hero → 상태 스트립(자산 현황) → 한눈 수치표 → 운용 추이 차트 → 매수 근거(접힘·세로) → 공식 설명.
// 보유·거래 상세표는 성과분석, 전체 top100은 순위검증으로 분리(대시보드는 요약판).
export default function DashboardPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <MagicHero />
      </section>

      <section className="dashSection">
        <MagicStatusStrip history={history} />
      </section>

      <section className="dashSection">
        <MagicNumberBoard history={history} />
      </section>

      <section className="dashSection">
        <MagicTrendCharts history={history} />
      </section>

      <section className="dashSection">
        <MagicTodayPicks history={history} />
      </section>

      <section className="dashSection">
        <MagicFormulaExplainer />
      </section>
    </main>
  );
}
