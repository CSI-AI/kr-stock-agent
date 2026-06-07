import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";
import { FundRulesGrid } from "../_dashboard/funds";

export const dynamic = "force-dynamic";

// 설정 — 운용 규칙 / 데이터 기준 / 관리 링크.
// 자동운용 실행 패널(WababaRunPanel 등)은 lib/strategy/strategy-store 결함으로
// 현재 빌드 불가 상태라 제외. 복구 후 재연결 예정(남은 작업 참고).
export default function SettingsPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="actionPanel">
        <div>
          <div className="sectionTitle">데이터 기준</div>
          <p>
            마지막 데이터 생성: {formatShortDate(history.generatedAt)} · 기준일{" "}
            {formatShortDate(history.baseDate)}. 세 펀드 데이터는 같은
            파이프라인에서 함께 생성됩니다.
          </p>
        </div>
        <div className="actionPanelButtons">
          <a href="/strategy-lab/reviewed">넘긴 종목 관리</a>
        </div>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">펀드 운용 원칙</h2>
        <FundRulesGrid history={history} />
      </section>
    </main>
  );
}
