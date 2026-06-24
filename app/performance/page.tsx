import type { ReactNode } from "react";
import { AppNav } from "../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
  FundCard,
  WABABA_THEME,
  AI_THEME,
} from "../_dashboard/kit";
import {
  FundComparisonTable,
  FundFlowChart,
  MagicHoldingsCard,
  FundTradeHistory,
  getFundViews,
  type FundKey,
} from "../_dashboard/funds";
import {
  MagicOfficialCard,
  parseMagicOfficialTradeDays,
} from "../_dashboard/magic-official";
import { loadPortfolioSnapshots } from "@/lib/wababa/snapshot/portfolio-snapshot";

export const dynamic = "force-dynamic";

const SHORT: Record<FundKey, string> = { wababa: "와바바", ai: "AI", magic: "마법공식" };

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function fmtPct(v: number | null): string {
  return v === null ? "-" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function fmtMan(v: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(Math.round(v / 10000))}만원`;
}

// 접힘 섹션 — 기본 접힘(요약만), 헤더 우측에 요약 수치. 1차 details/collapse 톤 재사용.
function PerfSection({
  title,
  meta,
  defaultOpen = false,
  children,
}: {
  title: string;
  meta: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="perfDetails" open={defaultOpen || undefined}>
      <summary className="perfSummary">
        <span className="perfSummaryTitle">{title}</span>
        <span className="perfSummaryMeta">{meta}</span>
      </summary>
      <div className="perfBody">{children}</div>
    </details>
  );
}

// 성과분석 — 수익률/총자산/보유/거래/비교 중심. 섹션별 접힘목록으로 길이를 줄인다.
// 전략은 전략랩/설정, 요약 차트는 대시보드. 여기서는 상세만 다룬다(중복 설명 제거).
export default function PerformancePage() {
  const history = readRecommendationHistory();
  const snapshots = loadPortfolioSnapshots();

  const views = getFundViews(history);
  const rates = views.map((v) => v.totalProfitRate).filter((x): x is number => typeof x === "number");
  const best = rates.length ? Math.max(...rates) : null;
  const worst = rates.length ? Math.min(...rates) : null;
  const totalAssetSum = views.reduce((s, v) => s + (v.totalAsset ?? 0), 0);
  const holdingMeta = views.map((v) => `${SHORT[v.key]} ${v.holdingCount}`).join(" · ");
  const magicHolding = views.find((v) => v.key === "magic")?.holdingCount ?? 0;

  const wTrades = asArr(asObj(history.performanceAnalysis).tradeHistory).length;
  const aTrades = asArr(asObj(history.aiPerformanceAnalysis).tradeHistory).length;
  const magicDays = parseMagicOfficialTradeDays(history);
  const reviewedCount = asArr(history.reviewedCandidateCodes).length;
  const basis = formatShortDate(history.generatedAt);

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={basis} />

      <PerfSection
        title="3펀드 성과 요약·비교"
        meta={`최고 ${fmtPct(best)} · 최저 ${fmtPct(worst)}`}
        defaultOpen
      >
        <FundComparisonTable history={history} />
      </PerfSection>

      <PerfSection title="총자산 흐름" meta={`${basis} · 합계 ${fmtMan(totalAssetSum)}`}>
        <FundFlowChart history={history} hideCaption />
      </PerfSection>

      <PerfSection title="펀드별 보유 현황" meta={`${holdingMeta} 종목`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <FundCard history={history} theme={WABABA_THEME} snapshots={snapshots} />
          <FundCard history={history} theme={AI_THEME} snapshots={snapshots} />
        </div>
      </PerfSection>

      <PerfSection title="와바바·AI 거래 기록" meta={`와바바 ${wTrades} · AI ${aTrades}건`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <FundTradeHistory history={history} fundKey="wababa" />
          <FundTradeHistory history={history} fundKey="ai" />
        </div>
      </PerfSection>

      <PerfSection
        title="마법공식 실제 성과"
        meta={`보유 ${magicHolding} · 운용일 ${magicDays.length}`}
      >
        <MagicOfficialCard history={history} />
        {/* PILOT(2026-06-08 검증용)은 공식 화면과 분리해 접힘으로만 보존(혼합 금지). */}
        <details
          style={{
            marginTop: 10,
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            background: "#fff",
            padding: "0 12px",
          }}
        >
          <summary style={{ cursor: "pointer", padding: "11px 2px", fontSize: 13, fontWeight: 800, color: "#475569" }}>
            파일럿 기록 보기 · 2026.06.08 검증용
          </summary>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
            아래는 공식 운용 이전 파일럿(검증용) 기록입니다. 공식 자산·수익률·거래일수에는 포함되지 않습니다.
          </p>
          <MagicHoldingsCard history={history} />
          <FundTradeHistory history={history} fundKey="magic" />
        </details>
      </PerfSection>

      <PerfSection title="넘긴 종목" meta={`${reviewedCount}개`}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minWidth: 0 }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            {reviewedCount > 0
              ? `전략랩에서 넘긴(제외한) 종목 ${reviewedCount}개가 있습니다. 추천 후보에서 숨겨집니다.`
              : "넘긴(제외한) 종목이 없습니다."}
          </p>
          <a
            href="/strategy-lab/reviewed"
            style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", textDecoration: "none" }}
          >
            넘긴 종목 관리 →
          </a>
        </div>
      </PerfSection>
    </main>
  );
}
