import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";
import { MagicHowItWorks } from "../_dashboard/magic-first-page";
import { MagicFormulaExplainer } from "../_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 설정 — 1호 운용 설명·선정 산식과 연락처를 제공하는 읽기 전용 안내 페이지.
// 저장 기능이나 2호 보류 해제 기능은 없다.
const CONTACT_EMAIL = "duria2002@gmail.com";

export default function SettingsPage() {
  const history = readRecommendationHistory();

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <h1 style={{ margin: "0 0 4px", fontSize: 21, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.01em" }}>
          설정
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>읽기 전용 안내 페이지입니다(저장 기능 없음).</p>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">마법공식 1호 운용규칙</h2>
        <MagicHowItWorks />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">종목 선정 방법</h2>
        <MagicFormulaExplainer />
      </section>

      <section className="dashSection">
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: "3px solid #059669", borderRadius: 14, padding: 16, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8", marginBottom: 6 }}>연락처 이메일</div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{ fontSize: 17, fontWeight: 900, color: "#059669", textDecoration: "none" }}
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>
    </main>
  );
}
