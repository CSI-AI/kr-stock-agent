import Link from "next/link";
import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  BestPickHero,
} from "./_dashboard/kit";
import { FundSummaryGrid, FundFlowChart } from "./_dashboard/funds";

export const dynamic = "force-dynamic";

// 대시보드 — 요약+그래프 중심(45-B): 오늘 추천 → 3펀드 현황 → 3펀드 성과 흐름 그래프.
// 개별 펀드 보유종목 나열은 두지 않고, 보유/거래 상세는 성과분석으로 유도한다.
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
        <h2 className="dashSectionTitle">펀드 현황</h2>
        <FundSummaryGrid history={history} />
      </section>

      <section className="dashSection">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            margin: "0 0 7px",
            flexWrap: "wrap",
          }}
        >
          <h2 className="dashSectionTitle" style={{ margin: 0 }}>
            3펀드 성과 흐름
          </h2>
          <Link
            href="/performance"
            style={{
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 800,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            보유·거래기록 자세히는 성과분석에서 →
          </Link>
        </div>
        <FundFlowChart history={history} />
      </section>
    </main>
  );
}
