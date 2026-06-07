// Phase 44-B — 3펀드 공통 요약 카드(자급식).
// kit.tsx(2펀드 로직) 무수정. public recommendation-history.json의 요약 키만 읽어
// 와바바/AI/마법공식을 동일 카드 구조로 표시한다. 마법공식은 약한 accent만 유지.
// 데이터가 없거나 0보유여도 깨지지 않고 "운용대기 / 데이터 대기"로 표시.

type Rec = Record<string, unknown>;
export type FundKey = "wababa" | "ai" | "magic";

export type FundView = {
  key: FundKey;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: string;
  accent: string;
  accentSoft: string;
  totalAsset: number | null;
  totalProfit: number | null;
  totalProfitRate: number | null;
  holdingCount: number;
  cash: number | null;
  cashRate: number | null;
};

function obj(v: unknown): Rec {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
}
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function krw(v: number | null): string {
  return v === null ? "-" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(v))}원`;
}
function pct(v: number | null, digits = 2): string {
  return v === null
    ? "-"
    : `${new Intl.NumberFormat("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)}%`;
}
// 한국 시장 관례: 이익(+) 빨강 / 손실(-) 파랑.
function tone(v: number | null): string {
  if (v === null || v === 0) return "#0f172a";
  return v > 0 ? "#dc2626" : "#2563eb";
}

const ACCENTS: Record<FundKey, { primary: string; soft: string; title: string; subtitle: string }> = {
  wababa: { primary: "#2563eb", soft: "#eff6ff", title: "와바바 펀드", subtitle: "가치성장 원칙" },
  ai: { primary: "#7c3aed", soft: "#f5f3ff", title: "와바바 AI 펀드", subtitle: "AI 자율운용" },
  magic: { primary: "#059669", soft: "#ecfdf5", title: "와바바 마법공식 펀드", subtitle: "정량 규칙 검증" },
};

export function toFundView(history: Rec, key: FundKey): FundView {
  const a = ACCENTS[key];
  const base = { key, title: a.title, subtitle: a.subtitle, accent: a.primary, accentSoft: a.soft };

  if (key === "magic") {
    const s = obj(history.magicPortfolioSummary);
    const hasData = typeof s.fundName === "string" || num(s.initialCapital) !== null;
    const holdingCount = num(s.holdingCount) ?? 0;
    const openLot = num(s.openLotCount) ?? 0;
    const totalAsset = num(s.totalAsset);
    const cash = num(s.cash);
    const active = holdingCount > 0 || openLot > 0;
    return {
      ...base,
      statusLabel: !hasData ? "데이터 대기" : active ? "운용 중" : "운용 대기",
      statusTone: !hasData || !active ? "#94a3b8" : a.primary,
      totalAsset,
      totalProfit: num(s.totalProfit),
      totalProfitRate: num(s.totalReturnRate),
      holdingCount,
      cash,
      cashRate: cash !== null && totalAsset ? (cash / totalAsset) * 100 : null,
    };
  }

  // wababa / ai — 동일 shape의 요약 직접 매핑(kit.getFundData 미사용, kit 무수정)
  const s = obj(key === "ai" ? history.aiPortfolioSummary : history.portfolioSummary);
  const hasData = num(s.totalAssetAmount) !== null || num(s.initialCapital) !== null;
  const totalAsset = num(s.totalAssetAmount);
  const cash = num(s.cash);
  return {
    ...base,
    statusLabel: hasData ? "운용 중" : "데이터 대기",
    statusTone: hasData ? a.primary : "#94a3b8",
    totalAsset,
    totalProfit: num(s.totalProfitAmount),
    totalProfitRate: num(s.totalProfitRate),
    holdingCount: num(s.positionCount) ?? 0,
    cash,
    cashRate: num(s.cashRate) ?? (cash !== null && totalAsset ? (cash / totalAsset) * 100 : null),
  };
}

export function getFundViews(history: Rec): FundView[] {
  return [toFundView(history, "wababa"), toFundView(history, "ai"), toFundView(history, "magic")];
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 10, padding: "8px 10px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 900,
          color: color ?? "#0f172a",
          marginTop: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function FundSummaryCard({ view }: { view: FundView }) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${view.accent}`,
        borderRadius: 14,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: view.accent, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {view.title}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{view.subtitle}</div>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 800,
            color: view.statusTone,
            background: view.statusTone === view.accent ? view.accentSoft : "#f1f5f9",
            border: `1px solid ${view.statusTone === view.accent ? view.accent : "#e2e8f0"}`,
            borderRadius: 99,
            padding: "2px 9px",
          }}
        >
          {view.statusLabel}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <Metric label="운용상태" value={view.statusLabel} color={view.statusTone} />
        <Metric label="총자산" value={krw(view.totalAsset)} />
        <Metric label="누적수익률" value={pct(view.totalProfitRate)} color={tone(view.totalProfitRate)} />
        <Metric label="누적손익" value={krw(view.totalProfit)} color={tone(view.totalProfit)} />
        <Metric label="보유종목 수" value={`${view.holdingCount}개`} />
        <Metric label="현금비중" value={pct(view.cashRate, 1)} />
      </div>
    </section>
  );
}

export function FundSummaryGrid({ history }: { history: Rec }) {
  const views = getFundViews(history);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, minWidth: 0 }}>
      {views.map((v) => (
        <FundSummaryCard key={v.key} view={v} />
      ))}
    </div>
  );
}
