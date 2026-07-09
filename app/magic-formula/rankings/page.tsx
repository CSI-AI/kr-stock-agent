import { AppNav } from "../../_dashboard/AppNav";
import {
  DashboardStyles,
  readRecommendationHistory,
  formatShortDate,
} from "../../_dashboard/kit";
import {
  parseMagicOfficialTradeDays,
  MagicFormulaExplainer,
  type MagicOfficialBuyTrade,
} from "../../_dashboard/magic-official";

export const dynamic = "force-dynamic";

// 마법공식 순위 검증 페이지 — 싼 순위(EBIT/EV) + 잘버는 순위(EBIT/투입자본) 합산 검증.
// 현재 public에는 합산 상위10(magicOfficialTradeDays buys)만 노출된다. 전체 top100 순위표는
// signal rankings.json(TEMP)에만 있어 별도 저장/publish 파이프라인 도입 후 표시한다.

const ACCENT = { primary: "#059669", soft: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };

type Rec = Record<string, unknown>;
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => !!x && typeof x === "object" && !Array.isArray(x)) : [];
}
// 비율(EBIT/EV, EBIT/투입자본) → 백분율.
function ratioPct(v: number | null): string {
  return v === null ? "—" : `${(v * 100).toFixed(1)}%`;
}
function krw(v: number | null): string {
  return v === null ? "—" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(v))}원`;
}
function rankTxt(v: number | null): string {
  return v === null ? "—" : `${v}위`;
}
function fmtDate(v: unknown): string {
  const m = str(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : str(v) || "—";
}
function fsDivLabel(v: string): string {
  return v === "CFS" ? "연결" : v === "OFS" ? "별도" : "—";
}

// magicOfficialRankings(전체 top100) — 현재 public에 없으면 null. 도입 후 자동 표시.
type RankingItem = {
  code: string; name: string; cheapRank: number | null; qualityRank: number | null;
  magicScore: number | null; earningsYield: number | null; returnOnCapital: number | null;
  financialStatementYear: number | null;
};
type OfficialRankings = {
  dataDate: string; cheapTop100: RankingItem[]; qualityTop100: RankingItem[];
};
function parseRankings(history: Rec): OfficialRankings | null {
  const r = history.magicOfficialRankings;
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const ro = r as Rec;
  const mapItem = (x: Rec): RankingItem => ({
    code: str(x.code), name: str(x.name) || str(x.code), cheapRank: num(x.cheapRank),
    qualityRank: num(x.qualityRank), magicScore: num(x.magicScore), earningsYield: num(x.earningsYield),
    returnOnCapital: num(x.returnOnCapital), financialStatementYear: num(x.financialStatementYear),
  });
  return {
    dataDate: str(ro.dataDate),
    cheapTop100: arr(ro.cheapTop100).map(mapItem),
    qualityTop100: arr(ro.qualityTop100).map(mapItem),
  };
}

const TH: React.CSSProperties = {
  padding: "8px 9px", fontSize: 11.5, fontWeight: 800, color: "#64748b", textAlign: "right",
  whiteSpace: "nowrap", background: "#f8fafc", borderBottom: "2px solid #e2e8f0",
};
const THL: React.CSSProperties = { ...TH, textAlign: "left" };
const TD: React.CSSProperties = { padding: "8px 9px", fontSize: 12.5, textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 };
const TDL: React.CSSProperties = { ...TD, textAlign: "left" };

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

// 섹션 2 — 합산 상위 10개(현재 public 노출분).
function CombinedTop10({ buys, date, seq }: { buys: MagicOfficialBuyTrade[]; date: string; seq: number }) {
  if (buys.length === 0) {
    return <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>합산 상위 종목이 아직 없어요.</p>;
  }
  const cols: Array<[string, boolean]> = [
    ["최종순위", true], ["종목명", false], ["싼 순위", true], ["잘버는 순위", true], ["종합점수", true],
    ["EBIT/EV", true], ["EBIT/투입자본", true], ["기준주가", true], ["기준주가일", true],
    ["실적연도", true], ["연결/별도", true], ["실제매수", true],
  ];
  return (
    <>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>
        {fmtDate(date)} · {seq}일차 기준 · 종합점수(싼 순위 + 잘버는 순위)가 낮은 순
      </div>
      <div style={{ overflowX: "auto", maxWidth: "100%" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
          <thead><tr>{cols.map(([h, r]) => <th key={h} style={r ? TH : THL}>{h}</th>)}</tr></thead>
          <tbody>
            {buys.map((b) => {
              const incomplete = b.evidenceCompleteness === false || b.evidenceCompleteness === null;
              return (
                <tr key={b.tradeId || b.lotId} style={{ borderTop: "1px solid #eceff3" }}>
                  <td style={{ ...TD, fontWeight: 900, color: ACCENT.primary }}>{rankTxt(b.finalRank)}</td>
                  <td style={TDL}>
                    <b style={{ color: "#0f172a", fontWeight: 850 }}>{b.name}</b>{" "}
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{b.code}</span>
                    {incomplete ? <span style={{ display: "block", color: "#b45309", fontSize: 10, fontWeight: 700 }}>근거 데이터 불완전</span> : null}
                  </td>
                  <td style={TD}>{rankTxt(b.cheapRank)}</td>
                  <td style={TD}>{rankTxt(b.qualityRank)}</td>
                  <td style={{ ...TD, fontWeight: 900 }}>{b.magicScore ?? "—"}</td>
                  <td style={TD}>{ratioPct(b.earningsYield)}</td>
                  <td style={TD}>{ratioPct(b.returnOnCapital)}</td>
                  <td style={TD}>{krw(b.closePrice)}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{fmtDate(b.priceAsOfDate)}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{b.financialStatementYear !== null ? `${b.financialStatementYear}년` : "—"}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{fsDivLabel(b.dartFsDiv)}</td>
                  <td style={{ ...TD, color: ACCENT.text, fontWeight: 800 }}>예</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// 섹션 3/4 — 싼 순위 100 / 잘버는 순위 100(magicOfficialRankings 도입 후).
function Top100Table({ items, kind }: { items: RankingItem[]; kind: "cheap" | "quality" }) {
  const isCheap = kind === "cheap";
  const rankKey = (x: RankingItem) => (isCheap ? x.cheapRank : x.qualityRank);
  const metricLabel = isCheap ? "EBIT/EV" : "EBIT/투입자본";
  const rankLabel = isCheap ? "싼 순위" : "잘버는 순위";
  const sorted = [...items].sort((a, b) => (rankKey(a) ?? 1e9) - (rankKey(b) ?? 1e9)).slice(0, 100);
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 420 }}>
        <thead><tr><th style={TH}>{rankLabel}</th><th style={THL}>종목명</th><th style={TH}>{metricLabel}</th><th style={TH}>종합점수</th><th style={TH}>실적연도</th></tr></thead>
        <tbody>
          {sorted.map((x) => (
            <tr key={x.code} style={{ borderTop: "1px solid #eceff3" }}>
              <td style={{ ...TD, fontWeight: 800, color: ACCENT.primary }}>{rankTxt(rankKey(x))}</td>
              <td style={TDL}><b style={{ color: "#0f172a", fontWeight: 850 }}>{x.name}</b>{" "}<span style={{ color: "#94a3b8", fontSize: 11 }}>{x.code}</span></td>
              <td style={TD}>{ratioPct(isCheap ? x.earningsYield : x.returnOnCapital)}</td>
              <td style={{ ...TD, color: "#64748b" }}>{x.magicScore ?? "—"}</td>
              <td style={{ ...TD, color: "#64748b" }}>{x.financialStatementYear !== null ? `${x.financialStatementYear}년` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Top100Pending({ label }: { label: string }) {
  return (
    <p style={{ margin: 0, fontSize: 12.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "9px 11px", lineHeight: 1.55 }}>
      {label} 100등 순위표는 매일 전체 종목 랭킹(top100) 저장·공개 도입 이후 표시됩니다.
      현재는 합산 상위 10개(실제 매수분)의 싼 순위·잘버는 순위·종합점수만 확인할 수 있어요.
    </p>
  );
}

export default function MagicRankingPage() {
  const history = readRecommendationHistory();
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  const buys = latest?.buys ?? [];
  const rankings = parseRankings(history);

  // 검증 메모: 합산 상위10이 싼/잘버는 순위에서 각각 몇 위인지 → 균형/편중 판단.
  const balanced = buys.filter((b) => b.cheapRank !== null && b.qualityRank !== null && b.cheapRank <= 30 && b.qualityRank <= 30).length;
  const cheapLean = buys.filter((b) => b.cheapRank !== null && b.qualityRank !== null && b.cheapRank <= 15 && b.qualityRank > 40).length;
  const qualityLean = buys.filter((b) => b.cheapRank !== null && b.qualityRank !== null && b.qualityRank <= 15 && b.cheapRank > 40).length;

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <div style={{ background: `linear-gradient(135deg, ${ACCENT.soft} 0%, #ffffff 100%)`, border: `1px solid ${ACCENT.border}`, borderRadius: 16, padding: "18px 18px 15px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 900, color: ACCENT.text, letterSpacing: "-0.01em" }}>마법공식 순위 검증</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
            마법공식은 싼 회사와 돈을 잘버는 회사를 각각 순위화한 뒤, 두 순위를 더해 종합점수가 낮은 종목을 선택합니다.
            이 페이지에서 오늘의 상위 10개가 어느 순위에서 뽑혔는지 직접 확인할 수 있어요.
          </p>
        </div>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">공식 근거</h2>
        <MagicFormulaExplainer />
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">합산 상위 10개</h2>
        <SectionCard title="종합점수 = 싼 순위 + 잘버는 순위 (낮을수록 우수)">
          <CombinedTop10 buys={buys} date={latest?.date ?? ""} seq={latest?.officialSequence ?? 0} />
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">싼 회사 순위 100등</h2>
        <SectionCard title="EBIT/EV 높은 순 · 기업가치 대비 영업이익">
          {rankings && rankings.cheapTop100.length > 0 ? <Top100Table items={rankings.cheapTop100} kind="cheap" /> : <Top100Pending label="싼 회사" />}
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">돈 잘버는 회사 순위 100등</h2>
        <SectionCard title="EBIT/투입자본 높은 순 · 순운전자본 + 유형자산 대비 영업이익">
          {rankings && rankings.qualityTop100.length > 0 ? <Top100Table items={rankings.qualityTop100} kind="quality" /> : <Top100Pending label="돈 잘버는 회사" />}
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">검증 메모</h2>
        <SectionCard title="오늘의 top10이 어떻게 뽑혔나">
          {buys.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>검증할 매수 종목이 아직 없어요.</p>
          ) : (
            <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
              <div>· 양쪽 균형(싼 순위·잘버는 순위 모두 30위 이내): <b style={{ color: ACCENT.primary }}>{balanced}종목</b></div>
              <div>· 싼 쪽 편중(싼 15위 이내·잘버는 40위 밖): <b>{cheapLean}종목</b></div>
              <div>· 잘버는 쪽 편중(잘버는 15위 이내·싼 40위 밖): <b>{qualityLean}종목</b></div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>한쪽만 극단적으로 좋은 종목보다, 두 순위가 균형 있게 높은 종목이 마법공식의 의도에 가깝습니다.</div>
            </div>
          )}
        </SectionCard>
      </section>
    </main>
  );
}
