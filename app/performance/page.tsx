import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";
import {
  MagicOfficialCard,
  MagicTodayPicks,
  MagicFormulaExplainer,
  parseMagicOfficialTradeDays,
  parseMagicOfficialPortfolio,
} from "../_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 성과분석 — 마법공식펀드 전용. 공식 운용 성과·보유·거래일 기록 + 오늘의 매수 근거 + 공식 설명.
// 2펀드(와바바/AI) 병렬 비교·거래기록·파일럿 섹션은 제거했다(마법공식펀드 전용 개편).
export default function PerformancePage() {
  const history = readRecommendationHistory();
  const magicDays = parseMagicOfficialTradeDays(history);
  const holdings = parseMagicOfficialPortfolio(history).holdings;
  const reviewedCount = Array.isArray(history.reviewedCandidateCodes)
    ? history.reviewedCandidateCodes.length
    : 0;
  const basis = formatShortDate(history.generatedAt);

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={basis} />

      <section className="dashSection">
        <h2 className="dashSectionTitle">
          공식 운용 성과 · 보유 {holdings.length} · 운용일 {magicDays.length}
        </h2>
        <MagicOfficialCard history={history} />
      </section>

      <section className="dashSection">
        <MagicTodayPicks history={history} />
      </section>

      <section className="dashSection">
        <MagicFormulaExplainer />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">넘긴 종목</h2>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minWidth: 0 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            {reviewedCount > 0
              ? `전략랩에서 넘긴(제외한) 종목 ${reviewedCount}개가 있습니다.`
              : "넘긴(제외한) 종목이 없습니다."}
          </p>
          <a
            href="/strategy-lab/reviewed"
            style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", textDecoration: "none" }}
          >
            넘긴 종목 관리 →
          </a>
        </div>
      </section>
    </main>
  );
}
