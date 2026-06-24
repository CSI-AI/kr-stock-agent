import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  buildWababaCandidates,
  buildAiCandidates,
  formatShortDate,
  CandidateSection,
  PhilosophySection,
  WABABA_THEME,
  AI_THEME,
} from "../_dashboard/kit";
import { MagicCandidateSection } from "../_dashboard/funds";
import { parseMagicOfficialTradeDays } from "../_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 전략랩 — 후보 / 전략(운용 원칙) / 마법공식 운용기록 요약 중심.
// 성과성 상세표·차트·비교는 두지 않는다(성과분석으로 분리). 마법공식 실제 성과/거래/보유도 성과분석에서.
export default function StrategyLabPage() {
  const history = readRecommendationHistory();
  const wababaCandidates = buildWababaCandidates(history);
  const aiCandidates = buildAiCandidates(history);
  const magicDays = parseMagicOfficialTradeDays(history);
  const recentMagic = magicDays.slice(0, 3);

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="candidatesGrid">
        <CandidateSection
          title="와바바 펀드 후보"
          subtitle="가치 후보"
          items={wababaCandidates}
          theme={WABABA_THEME}
        />
        <CandidateSection
          title="와바바 AI 펀드 후보"
          subtitle="AI 후보"
          items={aiCandidates}
          theme={AI_THEME}
        />
        <MagicCandidateSection history={history} />
      </section>

      <details className="perfDetails">
        <summary className="perfSummary">
          <span className="perfSummaryTitle">마법공식 최근 운용기록</span>
          <span className="perfSummaryMeta">
            {magicDays.length > 0 ? `최근 ${recentMagic.length}일 · 총 ${magicDays.length}운용일` : "기록 준비 중"}
          </span>
        </summary>
        <div className="perfBody">
          {recentMagic.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              {recentMagic.map((d) => (
                <div
                  key={d.date}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 13,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    {d.date}
                    <span style={{ marginLeft: 8, fontWeight: 700, color: "#94a3b8" }}>
                      {d.runStatus || "—"}
                    </span>
                  </span>
                  <span style={{ color: "#475569", fontWeight: 700 }}>
                    매수 {d.buyCount} · 매도 {d.sellCount}
                  </span>
                </div>
              ))}
              <a
                href="/performance"
                style={{ marginTop: 2, fontSize: 12, fontWeight: 800, color: "#059669", textDecoration: "none" }}
              >
                마법공식 실제 성과·거래·보유는 성과분석에서 →
              </a>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              마법공식 운용기록 준비 중입니다(첫 운용 이후 표시).
            </p>
          )}
        </div>
      </details>

      <details className="philosophyDetails">
        <summary className="philosophySummary">운용 원칙 보기</summary>
        <PhilosophySection />
      </details>
    </main>
  );
}
