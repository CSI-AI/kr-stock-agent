import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  BestPickHero,
  DashboardHoldings,
  DashboardSold,
} from "./_dashboard/kit";
import { FundSummaryGrid } from "./_dashboard/funds";

export const dynamic = "force-dynamic";

// 대시보드 — 운용앱 구조: 사고 → 보유 → 판 종목 → 펀드 현황.
// 설명/판단 상세는 전략랩으로, 보유 상세는 성과분석으로 분리.
export default function DashboardPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <h2 className="dashSectionTitle">오늘 추천</h2>
        <BestPickHero history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">보유 종목</h2>
        <DashboardHoldings history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">최근 조정</h2>
        <DashboardSold history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드 현황</h2>
        <FundSummaryGrid history={history} />
      </section>
    </main>
  );
}
