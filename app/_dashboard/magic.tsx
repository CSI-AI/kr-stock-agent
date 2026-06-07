// Phase 43-D — 와바바 마법공식 펀드 공개 표시(자급식).
// 기존 kit.tsx(2펀드)와 분리된 독립 컴포넌트. public recommendation-history.json의
// magic* 최소 요약 키만 optional하게 읽어 렌더한다. 전체 순위/lot 원장/operation log/
// raw 계산값은 표시하지 않는다(공개/운영 분리). magic 키가 없거나 0 보유여도 깨지지 않는다.

type Rec = Record<string, unknown>;

const MAGIC = {
  primary: "#059669",
  soft: "#ecfdf5",
  border: "#a7f3d0",
  text: "#065f46",
  glow: "rgba(5, 150, 105, 0.14)",
};

function obj(value: unknown): Rec {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Rec) : {};
}
function arr(value: unknown): Rec[] {
  return Array.isArray(value)
    ? value.filter((x): x is Rec => !!x && typeof x === "object" && !Array.isArray(x))
    : [];
}
function sarr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function krw(value: unknown): string {
  const n = num(value);
  return n === null ? "-" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n))}원`;
}
function pct(value: unknown, digits = 2): string {
  const n = num(value);
  return n === null
    ? "-"
    : `${new Intl.NumberFormat("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)}%`;
}
// 한국 시장 관례: 이익(+) 빨강 / 손실(-) 파랑.
function tone(n: number | null): string {
  if (n === null || n === 0) return "#0f172a";
  return n > 0 ? "#dc2626" : "#2563eb";
}
function hasMagic(history: Rec): boolean {
  const s = obj(history.magicPortfolioSummary);
  return !!str(s.fundName) || num(s.initialCapital) !== null;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 12px",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: 16,
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

function MagicHeader({ status }: { status: string }) {
  return (
    <div className="fundCardHeader">
      <div className="fundTitleRow">
        <div className="fundIcon" style={{ background: MAGIC.soft, color: MAGIC.primary }}>
          ∑
        </div>
        <h2 style={{ color: MAGIC.primary }}>와바바 마법공식 펀드</h2>
        <span
          className="pill"
          style={{ color: MAGIC.text, background: MAGIC.soft, borderColor: MAGIC.border }}
        >
          정량 규칙 · 기계적 검증
        </span>
      </div>
      <span className="statusPill">{status}</span>
    </div>
  );
}

function WaitNotice() {
  return (
    <div
      style={{
        marginTop: 14,
        padding: "12px 14px",
        background: MAGIC.soft,
        border: `1px solid ${MAGIC.border}`,
        borderRadius: 12,
        color: MAGIC.text,
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      아직 실거래일 운용 전이에요. 다음 개장일 기준으로 첫 매수 기록이 생성됩니다.
    </div>
  );
}

/** 대시보드 · 성과분석용 포트폴리오 카드 */
export function MagicFundCard({ history }: { history: Rec }) {
  if (!hasMagic(history)) return null;
  const s = obj(history.magicPortfolioSummary);
  const p = obj(history.magicPortfolio);
  const recent = obj(history.magicRecentActions);
  const formula = obj(history.magicFormula);
  const holdings = arr(p.holdings);
  const holdingCount = num(s.holdingCount) ?? holdings.length;

  return (
    <section className="fundCard" style={{ borderColor: MAGIC.border, boxShadow: `0 18px 45px ${MAGIC.glow}` }}>
      <MagicHeader status={holdingCount > 0 ? "운용 중" : "운용 대기"} />
      <p style={{ margin: "2px 0 14px", color: "#64748b", fontSize: 13 }}>
        정량 규칙으로 고른 저평가·고수익성 기업
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <Stat label="총자산" value={krw(s.totalAsset)} />
        <Stat label="누적 수익률" value={pct(s.totalReturnRate)} color={tone(num(s.totalReturnRate))} />
        <Stat label="평가금액" value={krw(s.evaluationAmount)} />
        <Stat label="현금" value={krw(s.cash)} />
      </div>

      {holdingCount > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>
            보유 종목 ({holdingCount}개)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {holdings.slice(0, 12).map((h, i) => (
              <div
                key={str(h.code) || String(i)}
                style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, alignItems: "baseline" }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {str(h.name) || str(h.code)}
                </span>
                <span style={{ color: "#64748b", flexShrink: 0 }}>
                  {krw(h.evaluationAmount)} ·{" "}
                  <span style={{ color: tone(num(h.unrealizedReturnRate)) }}>{pct(h.unrealizedReturnRate)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <WaitNotice />
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        {str(recent.message) ? (
          <div>
            최근 운용: {str(recent.date)} · {str(recent.message)}
          </div>
        ) : null}
        <div>
          공식 {str(formula.formulaVersion) || str(s.formulaVersion)} ·{" "}
          {str(formula.tradingRuleVersion) || str(s.tradingRuleVersion)}
        </div>
      </div>
    </section>
  );
}

/** 전략랩용 — 정량규칙 펀드 상태 + 상위 미리보기(rank/code/name) + 공개/운영 분리 안내 */
export function MagicLabSection({ history }: { history: Rec }) {
  if (!hasMagic(history)) return null;
  const s = obj(history.magicPortfolioSummary);
  const recent = obj(history.magicRecentActions);
  const top3 = arr(recent.top10Preview).slice(0, 3);
  const holdingCount = num(s.holdingCount) ?? 0;

  return (
    <section className="fundCard" style={{ borderColor: MAGIC.border, boxShadow: `0 18px 45px ${MAGIC.glow}` }}>
      <MagicHeader status="정량 규칙 펀드" />
      <p style={{ margin: "2px 0 12px", color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
        매일 한국 상장사를 마법공식(수익성·저평가) 기준으로 순위화해, 상위 10개를 시작가로 매수하고 실거래일 50일 후
        기계적으로 매도합니다.
      </p>

      <div style={{ fontSize: 13, color: "#334155", marginBottom: 10 }}>
        {holdingCount > 0
          ? `현재 보유 ${holdingCount}개 · 현금 ${krw(s.cash)} · 누적 수익률 `
          : "현재 운용 대기 — 다음 개장일에 첫 매수가 기록됩니다."}
        {holdingCount > 0 ? (
          <span style={{ color: tone(num(s.totalReturnRate)), fontWeight: 800 }}>{pct(s.totalReturnRate)}</span>
        ) : null}
      </div>

      {top3.length > 0 ? (
        <div
          style={{
            background: MAGIC.soft,
            border: `1px solid ${MAGIC.border}`,
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: MAGIC.text, marginBottom: 6 }}>
            오늘 상위 미리보기
          </div>
          {top3.map((t, i) => (
            <div key={str(t.code) || String(i)} style={{ fontSize: 13, color: "#0f172a", marginBottom: 2 }}>
              {num(t.rank) ?? i + 1}. {str(t.name) || str(t.code)}{" "}
              <span style={{ color: "#94a3b8" }}>({str(t.code)})</span>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
        공식에 따른 전체 순위·매수목록은 내부 운영 기록에 보관됩니다(공개 화면 미노출).
      </div>
    </section>
  );
}

/** 설정/정책용 — 접힘/펼침 운용 원칙 */
export function MagicPolicyDetails({ history }: { history: Rec }) {
  const policy = obj(history.magicFundPolicy);
  const rules = sarr(policy.rules);
  const disclosure = sarr(policy.disclosure);
  if (!str(policy.shortDescription) && rules.length === 0) return null;

  return (
    <details className="philosophyDetails">
      <summary className="philosophySummary">마법공식 운용 원칙</summary>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
        {str(policy.shortDescription) ? <p style={{ marginTop: 6 }}>{str(policy.shortDescription)}</p> : null}
        {rules.length > 0 ? (
          <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
            {rules.map((r, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {r}
              </li>
            ))}
          </ul>
        ) : null}
        {disclosure.length > 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>{disclosure.join(" ")}</p>
        ) : null}
      </div>
    </details>
  );
}
