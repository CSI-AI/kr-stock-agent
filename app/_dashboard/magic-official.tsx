// Phase 45-E9 — 마법공식 OFFICIAL(공식 모의운용) 성과 + 날짜별 접이식 거래기록.
// public recommendation-history.json 의 magicOfficial* 3키만 읽어 표시한다(읽기 전용 파생).
// PILOT(2026-06-08, magicPortfolio*)과 절대 혼합하지 않는다. 데이터·산식·엔진 무수정.
// 데이터 없거나 깨져도 이 영역만 안내문구로 대체하고 페이지 전체는 정상 유지한다.

type Rec = Record<string, unknown>;

const ACCENT = { primary: "#059669", soft: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };

function obj(v: unknown): Rec {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => !!x && typeof x === "object" && !Array.isArray(x)) : [];
}
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function boolOrNull(v: unknown): boolean | null {
  return v === true ? true : v === false ? false : null;
}
// 비율(EBIT/EV, EBIT/투입자본) → 백분율 표시. 0.4522 → "45.2%".
function ratioPct(v: number | null): string {
  return v === null ? "-" : `${(v * 100).toFixed(1)}%`;
}
// 연결/별도 코드 → 한글.
function fsDivLabel(v: string): string {
  return v === "CFS" ? "연결" : v === "OFS" ? "별도" : "-";
}
function krw(v: number | null): string {
  return v === null ? "-" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(v))}원`;
}
// 손익 부호 포함 금액(0원은 "0원").
function krwSigned(v: number | null): string {
  if (v === null) return "-";
  const r = Math.round(v);
  const body = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.abs(r));
  return r > 0 ? `+${body}원` : r < 0 ? `-${body}원` : "0원";
}
function pct(v: number | null, digits = 2): string {
  if (v === null) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)}%`;
}
function qty(v: number | null): string {
  return v === null ? "-" : `${new Intl.NumberFormat("ko-KR").format(v)}주`;
}
// 한국 시장 관례: 이익(+) 빨강 / 손실(-) 파랑 / 0·결측 회색.
function tone(v: number | null): string {
  if (v === null || v === 0) return "#0f172a";
  return v > 0 ? "#dc2626" : "#1d4ed8";
}
// "2026-06-17" → "2026.06.17" (로케일 무관·hydration 안전).
function fmtDate(v: unknown): string {
  const m = str(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : str(v) || "-";
}
// 내부 sellReason → 사용자 문구.
function humanizeSellReason(reason: string): string {
  if (/FIFTY_BATCH_FIFO_ROLLOVER|FIFO/i.test(reason)) return "50거래일 보유 후 교체";
  return reason || "교체 매도";
}

// ----- 타입 (이 UI에서 실제 사용하는 필드만 명시) -----
export type MagicOfficialSummary = {
  officialStartDate: string;
  officialSequence: number;
  dataDate: string;
  latestTradingDate: string;
  openBatchCount: number;
  openItemLotCount: number;
  closedBatchCount: number;
  totalBuyCount: number;
  totalSellCount: number;
  officialAvailableCash: number | null;
  batchCashReserveTotal: number | null;
  totalCash: number | null;
  holdingsMarketValue: number | null;
  totalAsset: number | null;
  cumulativeReturn: number | null;
  pilotExcluded: boolean;
};
export type MagicOfficialHolding = {
  code: string; name: string; openLotCount: number; totalQuantity: number | null;
  totalInvested: number | null; averageBuyPrice: number | null; currentPrice: number | null;
  marketValue: number | null; unrealizedProfit: number | null; returnRate: number | null;
};
export type MagicOfficialBuyTrade = {
  tradeId: string; batchId: string; lotId: string; rank: number | null; code: string; name: string;
  executionPrice: number | null; quantity: number | null; amount: number | null;
  signalAsOfDate: string; executionDate: string; priceSource: string;
  // MF-PUBLIC-1B: 공식 근거 요약(seq=12+ 신규 lot부터. 순위/점수/비율은 과거 seq에도 값 있음,
  // EV 메타(evMethod/실적연도/종가/dartFsDiv/completeness)는 과거 seq에서 null).
  finalRank: number | null; cheapRank: number | null; qualityRank: number | null; magicScore: number | null;
  earningsYield: number | null; returnOnCapital: number | null; closePrice: number | null;
  priceAsOfDate: string; financialStatementYear: number | null; dartFsDiv: string;
  evMethod: string; evidenceCompleteness: boolean | null;
};
export type MagicOfficialSellTrade = {
  tradeId: string; batchId: string; lotId: string; code: string; name: string;
  originalBuyDate: string; originalBuyPrice: number | null; executionPrice: number | null;
  quantity: number | null; amount: number | null; realizedProfit: number | null;
  realizedReturn: number | null; holdingTradingDays: number | null; sellReason: string;
  executionDate: string; priceSource: string;
};
export type MagicOfficialTradeDay = {
  date: string; officialSequence: number; runStatus: string; buyCount: number; sellCount: number;
  totalBuyAmount: number | null; totalSellAmount: number | null; realizedProfit: number | null;
  totalCash: number | null; holdingsMarketValue: number | null; totalAsset: number | null;
  cumulativeReturn: number | null; buyBatchId: string; sellBatchId: string;
  buys: MagicOfficialBuyTrade[]; sells: MagicOfficialSellTrade[];
};
export type MagicOfficialPortfolio = { holdings: MagicOfficialHolding[] };

// ----- 안전 파서 (canonical은 REPO2, 여기선 public 키만 읽음) -----
export function parseMagicOfficialSummary(history: Rec): MagicOfficialSummary | null {
  const s = obj(history.magicOfficialSummary);
  if (!s.officialStartDate || num(s.officialSequence) === null) return null;
  return {
    officialStartDate: str(s.officialStartDate),
    officialSequence: num(s.officialSequence) ?? 0,
    dataDate: str(s.dataDate),
    latestTradingDate: str(s.latestTradingDate) || str(s.dataDate),
    openBatchCount: num(s.openBatchCount) ?? 0,
    openItemLotCount: num(s.openItemLotCount) ?? 0,
    closedBatchCount: num(s.closedBatchCount) ?? 0,
    totalBuyCount: num(s.totalBuyCount) ?? 0,
    totalSellCount: num(s.totalSellCount) ?? 0,
    officialAvailableCash: num(s.officialAvailableCash),
    batchCashReserveTotal: num(s.batchCashReserveTotal),
    totalCash: num(s.totalCash),
    holdingsMarketValue: num(s.holdingsMarketValue),
    totalAsset: num(s.totalAsset),
    cumulativeReturn: num(s.cumulativeReturn),
    pilotExcluded: s.pilotExcluded === true,
  };
}
export function parseMagicOfficialPortfolio(history: Rec): MagicOfficialPortfolio {
  return {
    holdings: arr(obj(history.magicOfficialPortfolio).holdings).map((h) => ({
      code: str(h.code), name: str(h.name) || str(h.code), openLotCount: num(h.openLotCount) ?? 0,
      totalQuantity: num(h.totalQuantity), totalInvested: num(h.totalInvested),
      averageBuyPrice: num(h.averageBuyPrice), currentPrice: num(h.currentPrice),
      marketValue: num(h.marketValue), unrealizedProfit: num(h.unrealizedProfit), returnRate: num(h.returnRate),
    })),
  };
}
export function parseMagicOfficialTradeDays(history: Rec): MagicOfficialTradeDay[] {
  const days = arr(history.magicOfficialTradeDays).map((d) => ({
    date: str(d.date), officialSequence: num(d.officialSequence) ?? 0, runStatus: str(d.runStatus),
    buyCount: num(d.buyCount) ?? 0, sellCount: num(d.sellCount) ?? 0,
    totalBuyAmount: num(d.totalBuyAmount), totalSellAmount: num(d.totalSellAmount),
    realizedProfit: num(d.realizedProfit), totalCash: num(d.totalCash),
    holdingsMarketValue: num(d.holdingsMarketValue), totalAsset: num(d.totalAsset),
    cumulativeReturn: num(d.cumulativeReturn), buyBatchId: str(d.buyBatchId), sellBatchId: str(d.sellBatchId),
    buys: arr(d.buys).map((b) => ({
      tradeId: str(b.tradeId), batchId: str(b.batchId), lotId: str(b.lotId), rank: num(b.rank),
      code: str(b.code), name: str(b.name) || str(b.code), executionPrice: num(b.executionPrice),
      quantity: num(b.quantity), amount: num(b.amount), signalAsOfDate: str(b.signalAsOfDate),
      executionDate: str(b.executionDate), priceSource: str(b.priceSource),
      finalRank: num(b.finalRank) ?? num(b.rank), cheapRank: num(b.cheapRank), qualityRank: num(b.qualityRank),
      magicScore: num(b.magicScore), earningsYield: num(b.earningsYield), returnOnCapital: num(b.returnOnCapital),
      closePrice: num(b.closePrice), priceAsOfDate: str(b.priceAsOfDate),
      financialStatementYear: num(b.financialStatementYear), dartFsDiv: str(b.dartFsDiv),
      evMethod: str(b.evMethod), evidenceCompleteness: boolOrNull(b.evidenceCompleteness),
    })).sort((x, y) => (x.rank ?? 99) - (y.rank ?? 99) || (x.code < y.code ? -1 : 1)),
    sells: arr(d.sells).map((b) => ({
      tradeId: str(b.tradeId), batchId: str(b.batchId), lotId: str(b.lotId), code: str(b.code),
      name: str(b.name) || str(b.code), originalBuyDate: str(b.originalBuyDate),
      originalBuyPrice: num(b.originalBuyPrice), executionPrice: num(b.executionPrice),
      quantity: num(b.quantity), amount: num(b.amount), realizedProfit: num(b.realizedProfit),
      realizedReturn: num(b.realizedReturn), holdingTradingDays: num(b.holdingTradingDays),
      sellReason: str(b.sellReason), executionDate: str(b.executionDate), priceSource: str(b.priceSource),
    })).sort((x, y) => (x.code < y.code ? -1 : x.code > y.code ? 1 : x.lotId < y.lotId ? -1 : 1)),
  }));
  // 최신 거래일이 위로(원본 mutate 금지 — 이미 새 배열).
  return days.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0));
}

// ----- 소형 컴포넌트 -----
function OMetric({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 10, padding: "9px 11px", minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color: color ?? "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
      {sub ? <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{sub}</div> : null}
    </div>
  );
}

const TH = (align: "left" | "right"): React.CSSProperties => ({
  padding: "8px 9px", fontSize: 11.5, fontWeight: 800, color: "#64748b", textAlign: align,
  whiteSpace: "nowrap", background: "#f8fafc", borderBottom: "2px solid #e2e8f0",
});
const TD = (align: "left" | "right"): React.CSSProperties => ({
  padding: "8px 9px", fontSize: 12.5, textAlign: align, whiteSpace: "nowrap", fontWeight: 700,
});

function BuySection({ buys }: { buys: MagicOfficialBuyTrade[] }) {
  const cols: Array<[string, "left" | "right"]> = [["순위", "right"], ["종목명", "left"], ["매수가", "right"], ["수량", "right"], ["매수금액", "right"]];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#334155", margin: "0 0 6px" }}>매수 {buys.length}건</div>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 460 }}>
          <thead><tr>{cols.map(([h, a]) => <th key={h} style={TH(a)}>{h}</th>)}</tr></thead>
          <tbody>
            {buys.map((b) => (
              <tr key={b.tradeId || b.lotId} style={{ borderTop: "1px solid #eceff3" }}>
                <td style={{ ...TD("right"), fontWeight: 800, color: ACCENT.primary }}>{b.rank !== null ? `${b.rank}위` : "-"}</td>
                <td style={TD("left")}>
                  <b style={{ color: "#0f172a", fontWeight: 850 }}>{b.name}</b>{" "}
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{b.code}</span>
                  <span style={{ display: "block", color: "#cbd5e1", fontSize: 10, fontWeight: 600 }} className="magicLotId">{b.lotId}</span>
                </td>
                <td style={TD("right")}>{krw(b.executionPrice)}</td>
                <td style={TD("right")}>{qty(b.quantity)}</td>
                <td style={TD("right")}>{krw(b.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SellSection({ sells }: { sells: MagicOfficialSellTrade[] }) {
  const cols: Array<[string, "left" | "right"]> = [["종목명", "left"], ["최초매수일", "right"], ["최초매수가", "right"], ["매도가", "right"], ["수량", "right"], ["매도금액", "right"], ["실현손익", "right"], ["실현수익률", "right"], ["보유", "right"], ["사유", "left"]];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#ea580c", margin: "0 0 6px" }}>매도 {sells.length}건</div>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
          <thead><tr>{cols.map(([h, a]) => <th key={h} style={TH(a)}>{h}</th>)}</tr></thead>
          <tbody>
            {sells.map((s) => (
              <tr key={s.tradeId || s.lotId} style={{ borderTop: "1px solid #eceff3" }}>
                <td style={TD("left")}>
                  <b style={{ color: "#0f172a", fontWeight: 850 }}>{s.name}</b>{" "}
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{s.code}</span>
                </td>
                <td style={{ ...TD("right"), color: "#64748b" }}>{fmtDate(s.originalBuyDate)}</td>
                <td style={TD("right")}>{krw(s.originalBuyPrice)}</td>
                <td style={TD("right")}>{krw(s.executionPrice)}</td>
                <td style={TD("right")}>{qty(s.quantity)}</td>
                <td style={TD("right")}>{krw(s.amount)}</td>
                <td style={{ ...TD("right"), color: tone(s.realizedProfit) }}>{krwSigned(s.realizedProfit)}</td>
                <td style={{ ...TD("right"), fontWeight: 800, color: tone(s.realizedReturn) }}>{pct(s.realizedReturn)}</td>
                <td style={{ ...TD("right"), color: "#64748b" }}>{s.holdingTradingDays !== null ? `${s.holdingTradingDays}일` : "-"}</td>
                <td style={{ ...TD("left"), color: "#64748b", whiteSpace: "normal" }}>{humanizeSellReason(s.sellReason)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Placeholder({ note }: { note: string }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: ACCENT.primary }} />
        <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>와바바 마법공식 펀드 · 공식 운용</div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{note}</p>
    </section>
  );
}

export function MagicOfficialCard({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  if (!summary) return <Placeholder note="공식 운용 데이터가 아직 준비되지 않았어요." />;
  const portfolio = parseMagicOfficialPortfolio(history);
  const tradeDays = parseMagicOfficialTradeDays(history);
  const holdings = portfolio.holdings;
  const holdCols: Array<[string, "left" | "right"]> = [["종목명", "left"], ["lot", "right"], ["수량", "right"], ["평균매수가", "right"], ["현재가", "right"], ["투자금액", "right"], ["평가금액", "right"], ["평가손익", "right"], ["수익률", "right"]];

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: ACCENT.primary, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>와바바 마법공식 펀드 · 공식 운용</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>공식 시작일 {fmtDate(summary.officialStartDate)} · 공식 {summary.officialSequence}일차</div>
          </div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: ACCENT.primary, background: ACCENT.soft, border: `1px solid ${ACCENT.border}`, borderRadius: 99, padding: "2px 9px" }}>운용 중</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 8, marginBottom: 12 }}>
        <OMetric label="총자산" value={krw(summary.totalAsset)} />
        <OMetric label="총현금" value={krw(summary.totalCash)} />
        <OMetric label="보유평가액" value={krw(summary.holdingsMarketValue)} />
        <OMetric label="누적수익률" value={pct(summary.cumulativeReturn)} color={tone(summary.cumulativeReturn)} />
        <OMetric label="매수배치" value={`${summary.openBatchCount}개`} sub={`종료 ${summary.closedBatchCount}`} />
        <OMetric label="보유 lot" value={`${summary.openItemLotCount}개`} />
        <OMetric label="누적 매수" value={`${summary.totalBuyCount}건`} />
        <OMetric label="누적 매도" value={`${summary.totalSellCount}건`} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>공식 보유 종목 ({holdings.length}개)</div>
      {holdings.length > 0 ? (
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
            <thead><tr>{holdCols.map(([h, a]) => <th key={h} style={TH(a)}>{h}</th>)}</tr></thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.code} style={{ borderTop: "1px solid #eceff3" }}>
                  <td style={TD("left")}>
                    <b style={{ color: "#0f172a", fontWeight: 850 }}>{h.name}</b>{" "}
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{h.code}</span>
                  </td>
                  <td style={{ ...TD("right"), color: "#64748b" }}>{h.openLotCount}</td>
                  <td style={TD("right")}>{qty(h.totalQuantity)}</td>
                  <td style={TD("right")}>{krw(h.averageBuyPrice)}</td>
                  <td style={TD("right")}>{krw(h.currentPrice)}</td>
                  <td style={TD("right")}>{krw(h.totalInvested)}</td>
                  <td style={TD("right")}>{krw(h.marketValue)}</td>
                  <td style={{ ...TD("right"), color: tone(h.unrealizedProfit) }}>{krwSigned(h.unrealizedProfit)}</td>
                  <td style={{ ...TD("right"), fontWeight: 800, color: tone(h.returnRate) }}>{pct(h.returnRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>공식 보유 종목이 아직 없어요.</p>
      )}

      <div style={{ fontSize: 13, fontWeight: 800, color: "#334155", margin: "16px 0 8px" }}>거래일별 기록</div>
      {tradeDays.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>공식 거래기록이 아직 없어요.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tradeDays.map((d, i) => (
            <details key={d.date} open={i === 0} style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: "0 12px" }}>
              <summary style={{ cursor: "pointer", listStyle: "revert", padding: "11px 2px", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px" }}>
                <span style={{ fontWeight: 900, color: "#0f172a", fontSize: 14 }}>{fmtDate(d.date)}</span>
                <span style={{ fontWeight: 800, color: ACCENT.primary, fontSize: 12 }}>{d.officialSequence}일차</span>
                <span style={{ fontSize: 12.5, color: "#334155", fontWeight: 700 }}>매수 {d.buyCount}건 · 매도 {d.sellCount}건</span>
                <span style={{ fontSize: 12.5, color: d.sellCount > 0 ? tone(d.realizedProfit) : "#64748b", fontWeight: 700 }}>
                  {d.sellCount > 0 ? `실현손익 ${krwSigned(d.realizedProfit)}` : `매수 ${krw(d.totalBuyAmount)}`}
                </span>
                <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700 }}>당일 총자산 {krw(d.totalAsset)}</span>
              </summary>
              <div style={{ paddingBottom: 12 }}>
                {d.sells.length > 0 ? <SellSection sells={d.sells} /> : null}
                <BuySection buys={d.buys} />
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

// ----- 마법공식펀드 전용 홈용 컴포넌트 -----

// Hero — 사이트 정체성 + 실주문 아님 고지.
export function MagicHero() {
  return (
    <section style={{ background: `linear-gradient(135deg, ${ACCENT.soft} 0%, #ffffff 100%)`, border: `1px solid ${ACCENT.border}`, borderRadius: 16, padding: "18px 18px 15px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: ACCENT.text, letterSpacing: "-0.01em" }}>와바바 마법공식펀드</h1>
        <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT.primary, background: "#fff", border: `1px solid ${ACCENT.border}`, borderRadius: 99, padding: "2px 9px" }}>공개 모의장부</span>
      </div>
      <p style={{ margin: "0 0 9px", fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
        매일 정해진 공식으로 한국 주식을 고르고, 50실거래일 보유 규칙에 따라 모의 운용하는 공개 장부입니다.
      </p>
      <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT.primary, background: "#fff", border: `1px dashed ${ACCENT.border}`, borderRadius: 10, padding: "7px 10px" }}>
        실주문 아님 · 투자 참고용 · 모든 수익률은 장마감 종가 기준
      </div>
    </section>
  );
}

function PickMini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 900, color: color ?? "#0f172a", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

// 오늘의 마법공식 매수 근거 — 기본 접힘(details) + 세로 목록. 각 종목이 위→아래로 한 줄씩 쌓인다.
// 가로 카드 나열을 없애 모바일에서도 세로 정렬로만 진행한다.
export function MagicTodayPicks({ history, defaultOpen = false }: { history: Rec; defaultOpen?: boolean }) {
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  const buys = latest?.buys ?? [];
  const hasEvidenceMeta = buys.some((b) => b.evMethod || b.financialStatementYear !== null || b.closePrice !== null);
  // 공식 장부는 사람 승인 후에만 반영된다. 최신 공식 거래일이 데이터 기준일(오늘)보다 과거면
  // "오늘의 근거"가 아니라 "최근(마지막) 승인 반영 근거"이므로 문구를 구분한다. 날짜/데이터는 그대로 사용.
  const todayBase = str(history.baseDate);
  const noNewToday = Boolean(latest?.date && todayBase && latest.date < todayBase);

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: "4px 16px 8px", minWidth: 0 }}>
      <details open={defaultOpen}>
        <summary style={{ cursor: "pointer", listStyle: "revert", padding: "12px 2px 4px", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px" }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
            {noNewToday ? "최근 공식 매수 근거" : "오늘의 마법공식 매수 근거"}
          </span>
          {latest ? <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{fmtDate(latest.date)} · {latest.officialSequence}일차 · 매수 {buys.length}건</span> : null}
          {noNewToday ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 99, padding: "2px 8px" }}>
              오늘({fmtDate(todayBase)}) 신규 공식 매수 없음
            </span>
          ) : null}
          <span style={{ fontSize: 11.5, color: ACCENT.primary, fontWeight: 700 }}>펼쳐서 종목별 근거 보기</span>
        </summary>

        <p style={{ margin: "6px 0 10px", fontSize: 12, color: "#64748b" }}>
          싼 순위(EBIT/EV) + 잘버는 순위(EBIT/투입자본) = 종합점수. 종합점수가 낮을수록 우수합니다.
        </p>

        {buys.length === 0 ? (
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#64748b" }}>오늘의 매수 예정 종목이 아직 없어요.</p>
        ) : (
          <>
            {!hasEvidenceMeta ? (
              <div style={{ fontSize: 11.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "7px 10px", marginBottom: 10, lineHeight: 1.5 }}>
                공식 근거 상세(기준 실적연도·EV 산식 등)는 evidence 스키마 도입 이후 신규 lot부터 표시됩니다. 순위·점수·비율은 그대로 확인할 수 있어요.
              </div>
            ) : null}
            {/* 세로 목록: 각 종목 = 전체 폭 한 줄. 가로 grid 나열 제거. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
              {buys.map((b) => (
                <div key={b.tradeId || b.lotId} style={{ border: "1px solid #eef2f7", borderRadius: 12, padding: "11px 12px", background: "#fbfdfc", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: "#fff", background: ACCENT.primary, borderRadius: 8, padding: "1px 7px", flexShrink: 0 }}>{b.finalRank !== null ? `${b.finalRank}위` : "-"}</span>
                    <b style={{ fontSize: 14, fontWeight: 850, color: "#0f172a" }}>{b.name}</b>
                    <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{b.code}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 6, marginBottom: 8 }}>
                    <PickMini label="싼 순위" value={b.cheapRank !== null ? `${b.cheapRank}위` : "-"} />
                    <PickMini label="잘버는 순위" value={b.qualityRank !== null ? `${b.qualityRank}위` : "-"} />
                    <PickMini label="종합점수" value={b.magicScore !== null ? `${b.magicScore}` : "-"} color={ACCENT.primary} />
                    <PickMini label="EBIT/EV" value={ratioPct(b.earningsYield)} />
                    <PickMini label="EBIT/투입자본" value={ratioPct(b.returnOnCapital)} />
                    <PickMini label="기준주가" value={krw(b.closePrice)} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px", fontSize: 11, color: "#64748b", fontWeight: 700, borderTop: "1px dashed #e2e8f0", paddingTop: 7 }}>
                    <span>매수 {krw(b.executionPrice)}</span>
                    <span>{qty(b.quantity)}</span>
                    <span>총 {krw(b.amount)}</span>
                    {b.priceAsOfDate ? <span style={{ color: "#94a3b8" }}>기준주가일 {fmtDate(b.priceAsOfDate)}</span> : null}
                    {b.financialStatementYear !== null ? <span style={{ color: "#94a3b8" }}>실적 {b.financialStatementYear}년</span> : null}
                    {b.dartFsDiv ? <span style={{ color: "#94a3b8" }}>{fsDivLabel(b.dartFsDiv)}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </details>
    </section>
  );
}

// ===== 대시보드 요약 전용(Phase MF-UI-MASTER-REFINE) — 상태 스트립 / 한눈 수치표 / 추이 차트 =====

function avgOf(buys: MagicOfficialBuyTrade[], key: keyof MagicOfficialBuyTrade): number | null {
  const vs = buys.map((b) => b[key]).filter((v): v is number => typeof v === "number");
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
}
function rankAvg(v: number | null): string {
  return v === null ? "-" : `${v.toFixed(1)}위`;
}

// 상단 상태 스트립 — 자산 현황 한눈 요약(펀드명·기준일·배치·실주문0 고지 포함).
export function MagicStatusStrip({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  if (!summary) return null;
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  const holdings = parseMagicOfficialPortfolio(history).holdings;
  const investRate = summary.totalAsset && summary.holdingsMarketValue !== null ? (summary.holdingsMarketValue / summary.totalAsset) * 100 : null;

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: ACCENT.primary, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>공식 운용 현황</span>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
            공식 반영 기준일 {fmtDate(summary.dataDate)} · 공식 {summary.officialSequence}일차{latest?.buyBatchId ? ` · ${latest.buyBatchId}` : ""}
          </span>
          {str(history.baseDate) && summary.dataDate && summary.dataDate < str(history.baseDate) ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 99, padding: "2px 8px" }}>
              데이터 {fmtDate(str(history.baseDate))} 기준 · 공식 장부는 승인 후 반영
            </span>
          ) : null}
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 9px" }}>실주문 0건 · 모의장부</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(146px, 1fr))", gap: 8 }}>
        <OMetric label="총자산" value={krw(summary.totalAsset)} />
        <OMetric label="누적수익률" value={pct(summary.cumulativeReturn)} color={tone(summary.cumulativeReturn)} />
        <OMetric label="총현금" value={krw(summary.totalCash)} />
        <OMetric label="보유평가액" value={krw(summary.holdingsMarketValue)} sub={investRate !== null ? `투자비중 ${investRate.toFixed(1)}%` : undefined} />
        <OMetric label="보유 종목" value={`${holdings.length}개`} sub={`lot ${summary.openItemLotCount}개`} />
        <OMetric label="운용일" value={`${summary.officialSequence}일`} sub={`시작 ${fmtDate(summary.officialStartDate)}`} />
      </div>
    </section>
  );
}

// 한눈에 보는 마법공식 수치표 — 오늘 상위 10종목의 공식 산출 평균값 + 자산 비중.
export function MagicNumberBoard({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  const buys = latest?.buys ?? [];
  const cashRate = summary?.totalAsset && summary.totalCash !== null ? (summary.totalCash / summary.totalAsset) * 100 : null;
  const investRate = summary?.totalAsset && summary.holdingsMarketValue !== null ? (summary.holdingsMarketValue / summary.totalAsset) * 100 : null;

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 3 }}>한눈에 보는 마법공식</div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>
        {latest ? `${fmtDate(latest.date)} · ${latest.officialSequence}일차 상위 ${buys.length}종목 평균` : "오늘 산출 대기 중"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 8 }}>
        <OMetric label="오늘 매수 종목" value={`${buys.length}개`} />
        <OMetric label="평균 EBIT/EV" value={ratioPct(avgOf(buys, "earningsYield"))} color={ACCENT.primary} />
        <OMetric label="평균 EBIT/투입자본" value={ratioPct(avgOf(buys, "returnOnCapital"))} color={ACCENT.primary} />
        <OMetric label="평균 싼 순위" value={rankAvg(avgOf(buys, "cheapRank"))} />
        <OMetric label="평균 잘버는 순위" value={rankAvg(avgOf(buys, "qualityRank"))} />
        <OMetric label="평균 종합점수" value={avgOf(buys, "magicScore") !== null ? avgOf(buys, "magicScore")!.toFixed(1) : "-"} />
        <OMetric label="현금 비중" value={cashRate !== null ? `${cashRate.toFixed(1)}%` : "-"} />
        <OMetric label="투자 비중" value={investRate !== null ? `${investRate.toFixed(1)}%` : "-"} />
        <OMetric label="이번 회차 매수금액" value={krw(latest?.totalBuyAmount ?? null)} />
        <OMetric label="총 보유 lot" value={`${summary?.openItemLotCount ?? 0}개`} />
      </div>
    </section>
  );
}

// ----- 인라인 SVG 추이 차트(외부 라이브러리 없음) -----
type TrendPt = { i: number; label: string; v: number };

function LineTrend({ pts, color, baseline, unit }: { pts: TrendPt[]; color: string; baseline: number | null; unit: "krw" | "pct" }) {
  const W = 480, H = 150, padL = 46, padR = 12, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const vals = pts.map((p) => p.v).concat(baseline !== null ? [baseline] : []);
  let minV = Math.min(...vals), maxV = Math.max(...vals);
  if (minV === maxV) { minV -= 1; maxV += 1; }
  const pad = (maxV - minV) * 0.12;
  minV -= pad; maxV += pad;
  const xp = (i: number) => padL + (pts.length <= 1 ? plotW / 2 : (i / (pts.length - 1)) * plotW);
  const yp = (v: number) => padT + ((maxV - v) / (maxV - minV || 1)) * plotH;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xp(i).toFixed(1)},${yp(p.v).toFixed(1)}`).join(" ");
  const fmtY = (v: number) => unit === "pct" ? `${v.toFixed(1)}%` : `${new Intl.NumberFormat("ko-KR").format(Math.round(v / 10000))}만`;
  const ticks = [maxV, (maxV + minV) / 2, minV];
  const labelIdx = pts.length <= 4 ? pts.map((_, i) => i) : [0, Math.round((pts.length - 1) / 2), pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="추이 차트">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={yp(t)} y2={yp(t)} stroke="#eef2f7" strokeWidth="1" />
          <text x={padL - 5} y={yp(t) + 3} textAnchor="end" fill="#94a3b8" fontSize="9.5">{fmtY(t)}</text>
        </g>
      ))}
      {baseline !== null ? <line x1={padL} x2={W - padR} y1={yp(baseline)} y2={yp(baseline)} stroke="#cbd5e1" strokeWidth="1.1" strokeDasharray="4 3" /> : null}
      {pts.length >= 2 ? <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {pts.map((p, i) => <circle key={i} cx={xp(i)} cy={yp(p.v)} r={i === pts.length - 1 ? 3.6 : 2.2} fill={color} />)}
      {labelIdx.map((idx, k) => {
        const anchor: "start" | "middle" | "end" = k === 0 ? "start" : k === labelIdx.length - 1 ? "end" : "middle";
        return <text key={idx} x={xp(idx)} y={H - 9} textAnchor={anchor} fill="#94a3b8" fontSize="9.5">{pts[idx].label}</text>;
      })}
    </svg>
  );
}

// 총자산 추이 + 누적수익률 추이 + 현금/투자 비중 bar.
export function MagicTrendCharts({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  const days = parseMagicOfficialTradeDays(history);
  // 최신이 위인 배열 → 시간순(과거→현재)으로 뒤집어 시계열 차트에 사용.
  const chrono = [...days].reverse();
  const mdLabel = (d: string) => { const m = d.match(/^\d{4}-(\d{2})-(\d{2})/); return m ? `${m[1]}/${m[2]}` : d; };
  const assetPts: TrendPt[] = chrono.filter((d) => d.totalAsset !== null).map((d, i) => ({ i, label: mdLabel(d.date), v: d.totalAsset as number }));
  const retPts: TrendPt[] = chrono.filter((d) => d.cumulativeReturn !== null).map((d, i) => ({ i, label: mdLabel(d.date), v: d.cumulativeReturn as number }));
  const initial = 50000000;
  const cashRate = summary?.totalAsset && summary.totalCash !== null ? Math.max(0, Math.min(100, (summary.totalCash / summary.totalAsset) * 100)) : null;
  const investRate = cashRate !== null ? 100 - cashRate : null;

  if (assetPts.length === 0) {
    return (
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>운용 추이</div>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>추이 차트는 운용일이 쌓이면 표시됩니다.</p>
      </section>
    );
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>운용 추이</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#334155", marginBottom: 4 }}>총자산 추이</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>점선 = 초기자본 {krw(initial)}</div>
          <LineTrend pts={assetPts} color={ACCENT.primary} baseline={initial} unit="krw" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#334155", marginBottom: 4 }}>누적수익률 추이</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>점선 = 0%(초기자본 기준)</div>
          <LineTrend pts={retPts} color="#2563eb" baseline={0} unit="pct" />
        </div>
      </div>
      {cashRate !== null && investRate !== null ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#334155", marginBottom: 6 }}>현금 / 투자 비중</div>
          <div style={{ display: "flex", height: 22, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <div style={{ width: `${investRate}%`, background: ACCENT.primary, minWidth: investRate > 0 ? 2 : 0 }} />
            <div style={{ width: `${cashRate}%`, background: "#f97316", minWidth: cashRate > 0 ? 2 : 0 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", marginTop: 6, fontSize: 12, fontWeight: 700, color: "#475569" }}>
            <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: ACCENT.primary, marginRight: 5 }} />투자 {investRate.toFixed(1)}% · {krw(summary!.holdingsMarketValue)}</span>
            <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: "#f97316", marginRight: 5 }} />현금 {cashRate.toFixed(1)}% · {krw(summary!.totalCash)}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// 공식 설명 + EV 정의 고지 + 실주문 아님 안내(접힘).
export function MagicFormulaExplainer() {
  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>마법공식 계산 방식</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
        <div style={{ border: `1px solid ${ACCENT.border}`, background: ACCENT.soft, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: ACCENT.text }}>싼 순위 · EBIT / EV</div>
          <div style={{ fontSize: 11.5, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>기업가치 대비 영업이익이 높을수록 저평가로 봅니다.</div>
        </div>
        <div style={{ border: `1px solid ${ACCENT.border}`, background: ACCENT.soft, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: ACCENT.text }}>잘버는 순위 · EBIT / 투입자본</div>
          <div style={{ fontSize: 11.5, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>적은 자본으로 영업이익을 잘 낼수록 우량으로 봅니다.</div>
        </div>
        <div style={{ border: `1px solid ${ACCENT.border}`, background: ACCENT.soft, borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: ACCENT.text }}>종합점수 = 싼 순위 + 잘버는 순위</div>
          <div style={{ fontSize: 11.5, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>두 순위를 더한 값이 낮을수록 우수하며, 상위 10종목을 매수합니다.</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, fontSize: 12.5, color: "#475569", lineHeight: 1.55, marginBottom: 12 }}>
        <div>· 매일 상위 10종목을 선정해 매수합니다.</div>
        <div>· 각 매수 lot은 50실거래일 동안 보유합니다.</div>
        <div>· 51번째 실거래일에 해당 lot을 매도하고 그날 상위 10종목에 재투자합니다.</div>
        <div>· 수익률은 장마감 종가 기준으로 산정하며, 매수·매도 수량은 모의장부 기준입니다.</div>
      </div>

      <details style={{ border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", padding: "0 12px" }}>
        <summary style={{ cursor: "pointer", padding: "10px 2px", fontSize: 12.5, fontWeight: 800, color: "#475569" }}>EV(기업가치) 산식 안내</summary>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          와바바 마법공식펀드는 EV(기업가치)를 <b>시가총액 + 총부채 - 현금성자산</b> 기준으로 계산합니다.
          조엘 그린블라트의 원식은 이자부채 중심 순차입금을 쓰지만, 국내 전종목을 매일 자동 계산할 때
          차입금 세부계정은 회사별 표준화가 불완전해 결측·오분류 위험이 있어, 재현성·운영안정성을 위해
          총부채 기준 EV 근사값을 사용합니다.
        </p>
      </details>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", marginTop: 12, textAlign: "center" }}>
        공개 재무자료 기반 자동 계산값 · 실주문 아님 · 투자 판단은 본인 책임
      </div>
    </section>
  );
}
