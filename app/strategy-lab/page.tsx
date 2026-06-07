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
import { MagicLabSection } from "../_dashboard/magic";

export const dynamic = "force-dynamic";

// 전략랩 — 추천/판단 로직 확인용. 두 펀드의 TOP5 후보와 운용 원칙만.
export default function StrategyLabPage() {
  const history = readRecommendationHistory();
  const wababaCandidates = buildWababaCandidates(history);
  const aiCandidates = buildAiCandidates(history);

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="candidatesGrid">
        <CandidateSection
          title="오늘의 매수 후보 TOP 5"
          subtitle="와바바 가치투자 기준"
          items={wababaCandidates}
          theme={WABABA_THEME}
        />
        <CandidateSection
          title="AI 발굴 유망 종목 TOP 5"
          subtitle="와바바AI 자율운용 기준"
          items={aiCandidates}
          theme={AI_THEME}
        />
      </section>

      <section style={{ marginBottom: 22 }}>
        <MagicLabSection history={history} />
      </section>

      <details className="philosophyDetails">
        <summary className="philosophySummary">운용 원칙 보기</summary>
        <PhilosophySection />
      </details>
    </main>
  );
}
