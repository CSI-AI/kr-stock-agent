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

const SHORT_LABEL: Record<FundKey, string> = { wababa: "와바바", ai: "AI", magic: "마법공식" };

type CompRow = { label: string; get: (v: FundView) => string; color?: (v: FundView) => string };

const COMP_ROWS: CompRow[] = [
  { label: "운용상태", get: (v) => v.statusLabel, color: (v) => v.statusTone },
  { label: "총자산", get: (v) => krw(v.totalAsset) },
  { label: "누적수익률", get: (v) => pct(v.totalProfitRate), color: (v) => tone(v.totalProfitRate) },
  { label: "누적손익", get: (v) => krw(v.totalProfit), color: (v) => tone(v.totalProfit) },
  { label: "보유종목 수", get: (v) => `${v.holdingCount}개` },
  { label: "현금", get: (v) => krw(v.cash) },
  { label: "현금비중", get: (v) => pct(v.cashRate, 1) },
];

export function FundComparisonTable({ history }: { history: Rec }) {
  const views = getFundViews(history);
  const magicWaiting = views.some((v) => v.key === "magic" && v.holdingCount === 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, minWidth: 0 }}>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 340 }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 10px", fontSize: 12, color: "#94a3b8", textAlign: "left", whiteSpace: "nowrap" }}>구분</th>
              {views.map((v) => (
                <th key={v.key} style={{ padding: "8px 10px", fontSize: 13, fontWeight: 900, color: v.accent, textAlign: "right", whiteSpace: "nowrap" }}>
                  {SHORT_LABEL[v.key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMP_ROWS.map((r) => (
              <tr key={r.label} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "8px 10px", fontSize: 12, color: "#64748b", textAlign: "left", whiteSpace: "nowrap" }}>{r.label}</td>
                {views.map((v) => (
                  <td key={v.key} style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap", color: r.color ? r.color(v) : "#0f172a" }}>
                    {r.get(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {magicWaiting ? (
        <p style={{ margin: "10px 4px 2px", fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          마법공식 펀드는 아직 첫 매수 기록이 없습니다. 다음 개장일 daily_run 이후 보유·성과 비교에 반영됩니다.
        </p>
      ) : null}
    </div>
  );
}

// 전략랩 — 마법공식 정량 순위 후보(2펀드 CandidateSection과 동일한 .candidateCard chrome 사용).
// public의 magicRecentActions.top10Preview(rank/code/name)만 표시. 전체 순위는 내부 보관.
export function MagicCandidateSection({ history }: { history: Rec }) {
  const recent = obj(history.magicRecentActions);
  const s = obj(history.magicPortfolioSummary);
  const preview = Array.isArray(recent.top10Preview)
    ? (recent.top10Preview as unknown[]).filter((x): x is Rec => !!x && typeof x === "object" && !Array.isArray(x))
    : [];
  const holdingCount = num(s.holdingCount) ?? 0;
  const A = { accent: "#059669", soft: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
  return (
    <section className="candidateCard" style={{ borderColor: A.border }}>
      <div className="candidateHeader">
        <div>
          <h3>와바바 마법공식 펀드 후보</h3>
          <p>정량 순위 후보</p>
        </div>
        <span className="pill" style={{ background: A.soft, color: A.text, borderColor: A.border }}>
          정량 순위 기준
        </span>
      </div>
      {preview.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {preview.slice(0, 10).map((it, i) => (
            <div key={String(it.code ?? i)} style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 14, minWidth: 0 }}>
              <span style={{ fontWeight: 900, color: A.accent, minWidth: 24, flexShrink: 0 }}>#{num(it.rank) ?? i + 1}</span>
              <span style={{ fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {String(it.name ?? it.code ?? "")}
              </span>
              <span style={{ color: "#94a3b8", flexShrink: 0 }}>{String(it.code ?? "")}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>정량 후보 데이터 대기</p>
      )}
      <p style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
        {holdingCount === 0 ? "첫 실거래 lot은 다음 개장일 daily_run 이후 생성됩니다. " : ""}
        전체 순위와 세부 계산 로그는 운영 검증용으로 별도 보관됩니다.
      </p>
    </section>
  );
}

// 설정 — 3펀드 운용 원칙 카드(공통 chrome). 마법공식 상세는 public magicFundPolicy/magicFormula를 접힘으로 흡수.
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function sarr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const FUND_RULES: Record<FundKey, { nature: string; summary: string; rules: string[]; detail: string }> = {
  wababa: {
    nature: "가치성장 펀드",
    summary: "성장하는 회사를 싸게 사서 오래 보유합니다.",
    rules: [
      "고성장 힌트와 실적 개선 가능성 확인",
      "저평가 구간에서 매수 검토",
      "성장 가설이 유지되면 장기 보유",
      "성장 둔화·계산 오류·더 좋은 후보 발견 시 교체 검토",
    ],
    detail: "사람의 가치성장 원칙으로 운용합니다. 좋은 회사를 싼 값에 사서, 성장 가설이 살아 있는 동안 오래 보유하는 것을 기본으로 합니다.",
  },
  ai: {
    nature: "AI 판단 펀드",
    summary: "AI가 뉴스·실적·가격 흐름·리스크를 종합해 판단합니다.",
    rules: [
      "성장 신호와 최근 이슈를 함께 반영",
      "과열·리스크·뉴스 악화를 함께 감시",
      "가치성장 펀드보다 더 유연하게 후보 탐색",
      "보유 종목도 AI 판단으로 유지·교체 검토",
    ],
    detail: "AI가 매일 후보와 보유 종목을 종합 점검합니다. 성장과 가격, 뉴스와 리스크를 함께 보고 더 유연하게 운용합니다.",
  },
  magic: {
    nature: "정량 순위 펀드",
    summary: "정해진 공식으로 매일 순위를 매기고 상위 후보를 기계적으로 운용합니다.",
    rules: [
      "정량 순위(book_faithful_v1) 기준 사용",
      "상위 10개 종목을 매수 후보로 선정",
      "각 매수분은 50거래일 보유 원칙",
      "매수·매도 기준가는 시작가로 기록",
      "수익·손실과 무관하게 규칙대로 운용",
    ],
    detail: "감정·인기·직관을 배제하고 정해진 공식만 따릅니다. 공식 변경 시 버전을 올리고 변경 로그에 기록합니다.",
  },
};

function FundRuleCard({ fundKey, history }: { fundKey: FundKey; history: Rec }) {
  const a = ACCENTS[fundKey];
  const r = FUND_RULES[fundKey];
  const policy = obj(history.magicFundPolicy);
  const formula = obj(history.magicFormula);
  const magicRules = sarr(policy.rules);
  const magicDisclosure = sarr(policy.disclosure);
  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${a.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: a.primary, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>{a.title}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: a.primary, background: a.soft, border: `1px solid ${a.primary}`, borderRadius: 99, padding: "2px 9px" }}>
          {r.nature}
        </span>
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{r.summary}</p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {r.rules.map((x, i) => (
          <li key={i} style={{ fontSize: 13, color: "#475569", marginBottom: 4, lineHeight: 1.45 }}>{x}</li>
        ))}
      </ul>
      <details className="philosophyDetails" style={{ marginTop: 10, marginBottom: 0 }}>
        <summary className="philosophySummary">상세 보기</summary>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginTop: 6 }}>
          {fundKey === "magic" ? (
            <>
              <p style={{ margin: "0 0 6px" }}>{str(policy.shortDescription) || r.detail}</p>
              {magicRules.length > 0 ? (
                <ul style={{ paddingLeft: 16, margin: "0 0 6px" }}>
                  {magicRules.map((x, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>{x}</li>
                  ))}
                </ul>
              ) : null}
              {str(formula.formulaVersion) ? (
                <p style={{ margin: "0 0 4px", color: "#94a3b8" }}>
                  공식 버전: {str(formula.formulaVersion)}
                  {str(formula.tradingRuleVersion) ? ` · ${str(formula.tradingRuleVersion)}` : ""}
                </p>
              ) : null}
              {magicDisclosure.length > 0 ? <p style={{ color: "#94a3b8", margin: 0 }}>{magicDisclosure.join(" ")}</p> : null}
            </>
          ) : (
            <p style={{ margin: 0 }}>{r.detail}</p>
          )}
        </div>
      </details>
    </section>
  );
}

export function FundRulesGrid({ history }: { history: Rec }) {
  const keys: FundKey[] = ["wababa", "ai", "magic"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, minWidth: 0 }}>
      {keys.map((k) => (
        <FundRuleCard key={k} fundKey={k} history={history} />
      ))}
    </div>
  );
}
