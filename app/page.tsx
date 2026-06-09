import Link from "next/link";
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

// 대시보드 — 요약 중심(45-A 정보 다이어트): 오늘 추천 → 3펀드 현황 → 보유 미리보기 + 성과분석 유도.
// 3펀드 보유 전체·매수/매도 기록 등 상세는 성과분석으로 분리한다.
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
            와바바 펀드 보유{" "}
            <span style={{ color: "#94a3b8", fontWeight: 700 }}>미리보기</span>
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
            성과분석에서 3펀드 보유·거래 전체 보기 →
          </Link>
        </div>
        <DashboardHoldings history={history} limit={5} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">최근 매도·조정</h2>
        <DashboardSold history={history} limit={3} />
      </section>
    </main>
  );
}
