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
