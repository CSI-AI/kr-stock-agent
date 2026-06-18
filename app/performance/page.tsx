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
import { MagicOfficialCard } from "../_dashboard/magic-official";
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
            <MagicOfficialCard history={history} />
            {/* PILOT(2026-06-08 검증용) 기록은 공식 화면과 분리해 접힘으로만 보존(혼합 금지). */}
            <details style={{ marginTop: 10, border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: "0 12px" }}>
              <summary style={{ cursor: "pointer", padding: "11px 2px", fontSize: 13, fontWeight: 800, color: "#475569" }}>
                파일럿 기록 보기 · 2026.06.08 검증용
              </summary>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
                아래는 공식 운용 이전 파일럿(검증용) 기록입니다. 공식 자산·수익률·거래일수에는 포함되지 않습니다.
              </p>
              <MagicHoldingsCard history={history} />
              <FundTradeHistory history={history} fundKey="magic" />
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
