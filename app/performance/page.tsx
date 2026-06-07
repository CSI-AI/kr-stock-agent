import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  FundCard,
  WABABA_THEME,
  AI_THEME,
} from "../_dashboard/kit";
import { FundSummaryGrid, FundComparisonTable } from "../_dashboard/funds";
import { loadPortfolioSnapshots } from "@/lib/wababa/snapshot/portfolio-snapshot";

export const dynamic = "force-dynamic";

// 성과분석 — 펀드 성과 + 보유 포트폴리오 중심.
export default function PerformancePage() {
  const history = readRecommendationHistory();
  const snapshots = loadPortfolioSnapshots();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드 성과 요약</h2>
        <FundSummaryGrid history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">3펀드 비교</h2>
        <FundComparisonTable history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드별 상세</h2>
        <div className="fundsGrid">
          <FundCard history={history} theme={WABABA_THEME} snapshots={snapshots} />
          <FundCard history={history} theme={AI_THEME} snapshots={snapshots} />
        </div>
      </section>
    </main>
  );
}
