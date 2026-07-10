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
// 원 단위 금액 → 억원 표시(EBIT/EV/투입자본 등). 1e8로 나눠 소수 없이.
function eok(v: number | null): string {
  return v === null ? "—" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(v / 1e8))}억`;
}
// 시가총액(signal은 억원 단위) → 억원 표시.
function eokMc(v: number | null): string {
  return v === null ? "—" : `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(v))}억`;
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
  ebit: number | null; enterpriseValue: number | null; investedCapital: number | null;
  netWorkingCapital: number | null; propertyPlantAndEquipment: number | null; marketCap: number | null;
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
    ebit: num(x.ebit), enterpriseValue: num(x.enterpriseValue), investedCapital: num(x.investedCapital),
    netWorkingCapital: num(x.netWorkingCapital), propertyPlantAndEquipment: num(x.propertyPlantAndEquipment),
    marketCap: num(x.marketCap),
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
// cheap: 싼 순위/종목/EBIT·EV/EBIT/EV/시가총액/실적연도.
// quality: 잘버는 순위/종목/EBIT·투입자본/EBIT/투입자본/순운전자본/유형자산/실적연도.
function Top100Table({ items, kind }: { items: RankingItem[]; kind: "cheap" | "quality" }) {
  const isCheap = kind === "cheap";
  const rankKey = (x: RankingItem) => (isCheap ? x.cheapRank : x.qualityRank);
  const rankLabel = isCheap ? "싼 순위" : "잘버는 순위";
  const sorted = [...items].sort((a, b) => (rankKey(a) ?? 1e9) - (rankKey(b) ?? 1e9)).slice(0, 100);
  const cheapCols = ["EBIT/EV", "EBIT", "EV", "시가총액", "실적연도"];
  const qualityCols = ["EBIT/투입자본", "EBIT", "투입자본", "순운전자본", "유형자산", "실적연도"];
  const extraCols = isCheap ? cheapCols : qualityCols;
  const minW = isCheap ? 560 : 640;
  return (
    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: minW }}>
        <thead>
          <tr>
            <th style={TH}>{rankLabel}</th><th style={THL}>종목명</th>
            {extraCols.map((h) => <th key={h} style={TH}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((x) => (
            <tr key={x.code} style={{ borderTop: "1px solid #eceff3" }}>
              <td style={{ ...TD, fontWeight: 800, color: ACCENT.primary }}>{rankTxt(rankKey(x))}</td>
              <td style={TDL}><b style={{ color: "#0f172a", fontWeight: 850 }}>{x.name}</b>{" "}<span style={{ color: "#94a3b8", fontSize: 11 }}>{x.code}</span></td>
              {isCheap ? (
                <>
                  <td style={TD}>{ratioPct(x.earningsYield)}</td>
                  <td style={TD}>{eok(x.ebit)}</td>
                  <td style={TD}>{eok(x.enterpriseValue)}</td>
                  <td style={TD}>{eokMc(x.marketCap)}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{x.financialStatementYear !== null ? `${x.financialStatementYear}년` : "—"}</td>
                </>
              ) : (
                <>
                  <td style={TD}>{ratioPct(x.returnOnCapital)}</td>
                  <td style={TD}>{eok(x.ebit)}</td>
                  <td style={TD}>{eok(x.investedCapital)}</td>
                  <td style={TD}>{eok(x.netWorkingCapital)}</td>
                  <td style={TD}>{eok(x.propertyPlantAndEquipment)}</td>
                  <td style={{ ...TD, color: "#64748b" }}>{x.financialStatementYear !== null ? `${x.financialStatementYear}년` : "—"}</td>
                </>
              )}
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

// Case B 고지 — 현재 top100은 "종합 상위 100 후보"를 해당 순위로 정렬한 목록이라
// 순위 값이 1,5,8,10…처럼 건너뛴다. 전체 시장 1~100 연속표는 별도 파이프라인(준비 중).
function SubsetNotice({ kind }: { kind: "cheap" | "quality" }) {
  const label = kind === "cheap" ? "싼 순위" : "잘버는 순위";
  return (
    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "9px 11px", lineHeight: 1.55 }}>
      아래 목록은 <b>종합 상위 100 후보</b>를 {label}로 정렬한 것입니다. 각 종목의 {label}는 전체 시장에서 받은 순위 원값이라
      1위·5위·8위처럼 건너뛸 수 있어요(후보에 들지 못한 회사는 빠져 있음). 전체 시장 {label} 1~100 연속표는 별도로 준비 중입니다.
    </p>
  );
}

export default function MagicRankingPage() {
  const history = readRecommendationHistory();
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  const buys = latest?.buys ?? [];
  const rankings = parseRankings(history);

  // 데이터 기준(원자료) — 최신 매수분의 실적연도·연결/별도·기준주가일에서 도출.
  const fsYear = buys.map((b) => b.financialStatementYear).find((v) => v !== null) ?? null;
  const fsDiv = buys.map((b) => b.dartFsDiv).find((v) => v) ?? "";
  const priceDate = buys.map((b) => b.priceAsOfDate).find((v) => v) ?? latest?.date ?? "";

  return (
    <main className="dashboardRoot">
      <DashboardStyles />
      <AppNav updatedAt={formatShortDate(history.generatedAt)} />

      <section className="dashSection">
        <div style={{ background: `linear-gradient(135deg, ${ACCENT.soft} 0%, #ffffff 100%)`, border: `1px solid ${ACCENT.border}`, borderRadius: 16, padding: "18px 18px 15px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 900, color: ACCENT.text, letterSpacing: "-0.01em" }}>마법공식 순위 검증</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
            마법공식은 싼 회사와 돈을 잘버는 회사를 각각 순위화한 뒤, 두 순위를 더해 종합점수가 낮은 종목을 선택합니다.
            이 페이지는 순위 원자료를 그대로 보여줍니다. 해석과 판단은 직접 하세요.
          </p>
        </div>
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
          {rankings && rankings.cheapTop100.length > 0 ? (
            <>
              <SubsetNotice kind="cheap" />
              <Top100Table items={rankings.cheapTop100} kind="cheap" />
            </>
          ) : (
            <Top100Pending label="싼 회사" />
          )}
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">돈 잘버는 회사 순위 100등</h2>
        <SectionCard title="EBIT/투입자본 높은 순 · 순운전자본 + 유형자산 대비 영업이익">
          {rankings && rankings.qualityTop100.length > 0 ? (
            <>
              <SubsetNotice kind="quality" />
              <Top100Table items={rankings.qualityTop100} kind="quality" />
            </>
          ) : (
            <Top100Pending label="돈 잘버는 회사" />
          )}
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">데이터 기준</h2>
        <SectionCard title="어떤 자료로 계산했나">
          <div style={{ display: "grid", gap: 7, fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
            <div>· 기준 주가: <b>{fmtDate(priceDate)}</b> 장마감 종가 기준</div>
            <div>· 재무제표: <b>{fsYear !== null ? `${fsYear}년 결산` : "최근 확보 결산"}</b>{fsDiv ? ` · ${fsDivLabel(fsDiv)}` : ""} (DART 공시 기준)</div>
            <div>· 순위 값은 전체 상장사(금융·지주 등 제외한 적격 universe)에서 매긴 원값입니다.</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              현재는 연간 결산 기준으로 계산합니다. 최근 4개 분기(TTM) 반영은 분기 재무자료 수집·검증이 필요해 별도 단계로 준비 중입니다.
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="dashSection">
        <h2 className="dashSectionTitle">공식 근거 · 산식</h2>
        <MagicFormulaExplainer />
      </section>
    </main>
  );
}
