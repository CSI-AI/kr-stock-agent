import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  BestPickHero,
  GlobalSummary,
  DashboardHoldings,
  DashboardSold,
} from "./_dashboard/kit";

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
        <h2 className="dashSectionTitle">오늘 살 종목</h2>
        <BestPickHero history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">현재 보유</h2>
        <DashboardHoldings history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">최근 판 종목</h2>
        <DashboardSold history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드 현황</h2>
        <GlobalSummary history={history} />
      </section>
    </main>
  );
}
