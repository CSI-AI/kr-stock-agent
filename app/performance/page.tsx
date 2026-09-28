import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";
import {
  MagicOfficialCard,
  isMagicReconstruction,
  parseMagicOfficialTradeDays,
  parseMagicOfficialPortfolio,
} from "../_dashboard/magic-official";

// 공개 장부는 배포 시 함께 갱신된다. 요청마다 2.6MB JSON과 전체 거래표를
// 다시 서버 렌더링하지 않고 정적 결과를 CDN/Next 라우터 prefetch로 재사용한다.
export const dynamic = "force-static";

// 성과분석 — 마법공식펀드 상세 이력 전용. 공식 운용 성과·보유 종목·거래일별 기록 + 넘긴 종목.
// 대시보드와 겹치는 요약(상태·수치표·차트)·매수근거·공식설명 블럭은 대시보드로 일원화했다.
export default function PerformancePage() {
  const history = readRecommendationHistory();
  const magicDays = parseMagicOfficialTradeDays(history);
  const holdings = parseMagicOfficialPortfolio(history).holdings;
  const reconstructed = isMagicReconstruction(history);
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
          {reconstructed ? "별도 복구 가상장부 성과" : "공식 운용 성과"} · 고유 보유종목 {holdings.length} · 기록 {magicDays.length}회차
        </h2>
        <MagicOfficialCard history={history} />
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
