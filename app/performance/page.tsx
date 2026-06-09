import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  FundCard,
  WABABA_THEME,
  AI_THEME,
} from "../_dashboard/kit";
import {
  FundComparisonTable,
  MagicHoldingsCard,
  FundTradeHistory,
} from "../_dashboard/funds";
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
        <h2 className="dashSectionTitle">3펀드 비교</h2>
        <FundComparisonTable history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드별 보유 종목</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <FundCard history={history} theme={WABABA_THEME} snapshots={snapshots} />
            <FundTradeHistory history={history} fundKey="wababa" />
          </div>
          <div style={{ minWidth: 0 }}>
            <FundCard history={history} theme={AI_THEME} snapshots={snapshots} />
            <FundTradeHistory history={history} fundKey="ai" />
          </div>
          <div style={{ minWidth: 0 }}>
            <MagicHoldingsCard history={history} />
            <FundTradeHistory history={history} fundKey="magic" />
          </div>
        </div>
      </section>
    </main>
  );
}
