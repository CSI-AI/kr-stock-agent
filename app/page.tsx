import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "./_dashboard/kit";
import {
  MagicHero,
  MagicTodayPicks,
  MagicOfficialCard,
  MagicFormulaExplainer,
} from "./_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 마법공식펀드 전용 홈: Hero → 오늘의 매수 근거 → 공식 운용 현황(상태/포트폴리오/거래내역) → 공식 설명.
// public recommendation-history.json 의 magicOfficial* 키만 읽는다(2펀드 병렬 구조 제거).
export default function DashboardPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <MagicHero />
      </section>

      <section className="dashSection">
        <MagicTodayPicks history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">공식 운용 현황</h2>
        <MagicOfficialCard history={history} />
      </section>

      <section className="dashSection">
        <MagicFormulaExplainer />
      </section>
    </main>
  );
}
