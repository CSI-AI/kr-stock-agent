import { AppNav } from "./_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  BestPickHero,
  GlobalSummary,
} from "./_dashboard/kit";

export const dynamic = "force-dynamic";

// 대시보드 — 오늘의 매수 BEST + 펀드 현황만 압축해서 보여준다.
// 상세 후보/판단은 전략랩, 보유 포트폴리오는 성과분석으로 분리.
export default function DashboardPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />
      <BestPickHero history={history} />
      <GlobalSummary history={history} />
    </main>
  );
}
