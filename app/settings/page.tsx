import type { CSSProperties } from "react";
import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../_dashboard/kit";
import { FundRulesGrid } from "../_dashboard/funds";

export const dynamic = "force-dynamic";

// 설정 — 운용 규칙 / 자동화·승인 게이트 / 데이터 기준 안내(읽기 전용 운영 기준).
// 실제 설정 저장 기능은 없다. 현재 3펀드 + A/B/C 티어 자동화 구조를 그대로 안내한다.
export default function SettingsPage() {
  const history = readRecommendationHistory();

  const guideCard: CSSProperties = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
    minWidth: 0,
  };
  const guideTitle: CSSProperties = {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
  };
  const guideList: CSSProperties = {
    margin: 0,
    paddingLeft: 18,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
  };

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="actionPanel">
        <div>
          <div className="sectionTitle">데이터 기준</div>
          <p>
            마지막 데이터 생성: {formatShortDate(history.generatedAt)} · 기준일{" "}
            {formatShortDate(history.baseDate)}. 대시보드·전략랩·성과분석·설정은
            모두 같은 최신 데이터(배포본 + 작업본 병합)를 봅니다.
          </p>
        </div>
        <div className="actionPanelButtons">
          <a href="/strategy-lab/reviewed">넘긴 종목 관리</a>
        </div>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">운용 원칙</h2>
        <FundRulesGrid history={history} />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">자동화 · 승인 게이트</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
            minWidth: 0,
          }}
        >
          <section style={{ ...guideCard, borderTop: "3px solid #059669" }}>
            <div style={guideTitle}>자동화 상태 (A티어)</div>
            <ul style={guideList}>
              <li>signal · dry-run · status 평일 자동 실행</li>
              <li>read-only / 임시(TEMP) 산출물만 생성</li>
              <li>장부 · 운영 데이터 write 없음</li>
            </ul>
          </section>
          <section style={{ ...guideCard, borderTop: "3px solid #2563eb" }}>
            <div style={guideTitle}>승인 게이트 (B티어)</div>
            <ul style={guideList}>
              <li>장부 저장 · public 반영은 사람 승인 필요</li>
              <li>approval-ticket + 승인 문구 + 데이터 SHA 일치 시에만 적용</li>
              <li>승인 전에는 미리보기/검증만 수행</li>
            </ul>
          </section>
          <section style={{ ...guideCard, borderTop: "3px solid #dc2626" }}>
            <div style={guideTitle}>자동 실행 금지선 (C티어)</div>
            <ul style={guideList}>
              <li>Vercel 배포(deploy/promote) 자동 금지</li>
              <li>실제 증권 주문 금지</li>
              <li>canonical · public · 운영 데이터 자동 write 금지</li>
            </ul>
          </section>
        </div>
        <p
          style={{
            margin: "10px 2px 0",
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          이 화면은 현재 운영 기준 안내입니다(저장 기능 없음). 장부·배포·실주문은
          항상 사람 승인 하에서만 진행됩니다.
        </p>
      </section>
    </main>
  );
}
