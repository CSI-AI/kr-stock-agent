import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  FundCard,
  ComparisonSection,
  WABABA_THEME,
  AI_THEME,
} from "../_dashboard/kit";
import { MagicFundCard } from "../_dashboard/magic";
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

      <section className="fundsGrid">
        <FundCard history={history} theme={WABABA_THEME} snapshots={snapshots} />
        <FundCard history={history} theme={AI_THEME} snapshots={snapshots} />
        <MagicFundCard history={history} />
      </section>

      <ComparisonSection history={history} />
    </main>
  );
}
