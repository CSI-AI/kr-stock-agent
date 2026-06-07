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
          title="와바바 펀드 후보"
          subtitle="가치성장 후보"
          items={wababaCandidates}
          theme={WABABA_THEME}
        />
        <CandidateSection
          title="와바바 AI 펀드 후보"
          subtitle="AI 판단 후보"
          items={aiCandidates}
          theme={AI_THEME}
        />
        <MagicCandidateSection history={history} />
      </section>

      <details className="philosophyDetails">
        <summary className="philosophySummary">운용 원칙 보기</summary>
        <PhilosophySection />
      </details>
    </main>
  );
}
