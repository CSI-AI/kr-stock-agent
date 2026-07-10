import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";

export const dynamic = "force-dynamic";

// 설정 — 연락처 이메일만 두는 읽기 전용 안내 페이지(Phase MF-UI-MASTER-REFINE).
// 3펀드 운용원칙·A/B/C 자동화 게이트 등 중복/불필요 블럭은 제거했다. 저장 기능 없음.
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
