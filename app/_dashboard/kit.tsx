import {
  buildPortfolioState,
  type PortfolioHoldingInput,
} from "@/lib/wababa/build-portfolio-state";
import { buildPortfolioDriftTimeline } from "@/lib/wababa/build-portfolio-drift";
import { buildPortfolioActionLayer } from "@/lib/wababa/build-portfolio-action";
import {
  getPreviousPortfolioSnapshot,
  snapshotToDriftSnapshot,
  type PortfolioSnapshot,
} from "@/lib/wababa/snapshot/portfolio-snapshot";

import fs from "fs";
import path from "path";


const DATA_ROOT_DIR = "C:\\work\\kr-stock-agent-data-new";
const RECOMMENDATION_HISTORY_PATH = path.join(
  DATA_ROOT_DIR,
  "recommendation-history.json",
);
const PUBLIC_RECOMMENDATION_HISTORY_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "recommendation-history.json",
);

type AnyRecord = Record<string, unknown>;

type FundTheme = {
  key: "wababa" | "ai";
  title: string;
  subtitle: string;
  badge: string;
  primary: string;
  soft: string;
  border: string;
  text: string;
  glow: string;
};

const WABABA_THEME: FundTheme = {
  key: "wababa",
  title: "와바바 펀드",
  subtitle: "가치투자 원칙 기반",
  badge: "운용 중",
  primary: "#2563eb",
  soft: "#eff6ff",
  border: "#bfdbfe",
  text: "#1e3a8a",
  glow: "rgba(37, 99, 235, 0.14)",
};

const AI_THEME: FundTheme = {
  key: "ai",
  title: "와바바 AI 펀드",
  subtitle: "AI 자율운용",
  badge: "운용 중",
  primary: "#7c3aed",
  soft: "#f5f3ff",
  border: "#ddd6fe",
  text: "#4c1d95",
  glow: "rgba(124, 58, 237, 0.14)",
};

function readJsonObject(filePath: string): AnyRecord | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AnyRecord;
    }
  } catch {
    // ignore — try next candidate
  }
  return null;
}

function readRecommendationHistory(): AnyRecord {
  return (
    readJsonObject(RECOMMENDATION_HISTORY_PATH) ??
    readJsonObject(PUBLIC_RECOMMENDATION_HISTORY_PATH) ??
    {}
  );
}

function getObject(value: unknown): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as AnyRecord;
}

function getArray(value: unknown): AnyRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is AnyRecord =>
      !!item && typeof item === "object" && !Array.isArray(item),
  );
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function getNumberValue(value: unknown, fallback = 0): number {
  const numeric = getNumber(value);
  return numeric === null ? fallback : numeric;
}

function formatNumber(value: unknown, digits = 0): string {
  const numeric = getNumber(value);
  if (numeric === null) return "-";
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numeric);
}

function formatKrw(value: unknown): string {
  const numeric = getNumber(value);
  if (numeric === null) return "-";
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(numeric))}원`;
}

function formatPercent(value: unknown, digits = 2): string {
  const numeric = getNumber(value);
  if (numeric === null) return "-";
  const fixedDigits = Math.abs(numeric) >= 10 ? 1 : digits;
  return `${formatNumber(numeric, fixedDigits)}%`;
}

function formatShortDate(value: unknown): string {
  const text = getString(value);
  if (!text) return "-";
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?/,
  );
  if (!match) return text.replaceAll("-", ".");
  return `${match[1].slice(2)}.${match[2]}.${match[3]}${match[4] ? ` ${match[4]}` : ""}`;
}

// 내부 엔진/점수 표현을 사용자용 문장으로 정리. (엔진/score/점수/방어선 → 일반 문장)
function humanizeReason(text: unknown): string {
  return getString(text)
    .replace(/매도\s*엔진\s*(HIGH|MID|LOW)?/gi, "매도 신호 확대")
    .replace(/방어선/g, "리스크")
    .replace(/매수\s*가설\s*재확인/g, "매수 가설 재점검")
    .replace(/\bscore\b/gi, "")
    .replace(/점수\s*기준\s*충족/g, "기준 충족")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 손실/리스크 종목의 보유 이유 꼬리 문구 — sellSignal에서 위험 요인 감지.
function holdRiskTail(signal: AnyRecord, isAi: boolean): string {
  const text =
    getStringArray(signal.reasons).join(" ") + " " + getString(signal.summary);
  if (/부채/.test(text)) return isAi ? "재무 리스크 확인 필요" : "부채 부담 확인 필요";
  if (/매출\s*감소|성장\s*지속성/.test(text))
    return isAi ? "실적 신호 점검 필요" : "실적 흐름 점검 필요";
  if (/품질/.test(text)) return "리스크 점검 필요";
  return isAi ? "리스크 점검 필요" : "매수 가설 재점검 구간";
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// 문자열 배열 추출 (getArray는 객체 배열만 통과시키므로 문자열 배열엔 사용 불가).
function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => getString(x)).filter(Boolean);
}

// 보유 종목의 구체 지표 bullet 추출 — holdingReview.holdReason 문자열에서.
function extractHoldMetrics(reviewItem: AnyRecord): {
  opGrowth: string;
  roe: string;
  bullets: string[];
} {
  const arr = getStringArray(reviewItem.holdReason);
  const find = (re: RegExp) => arr.find((s) => re.test(s)) || "";
  // "영업이익 증가율 668.7%" → "영업이익 +668.7%"
  const opGrowth = find(/영업이익/).replace(/영업이익\s*증가율\s*/, "영업이익 +");
  const roe = find(/ROE/);
  // 구체 숫자 bullet만(모호한 헤드라인 제외)
  const bullets = arr.filter((s) =>
    /ROE|영업이익|PER|PBR|매출|배당|CAGR|증가율|%/.test(s),
  );
  return { opGrowth, roe, bullets };
}

// 매수 이유 — 구체 1줄 + 근거 bullet (companySummary / coreCatalyst / investmentPoints / risk).
function buildBuyReason(item: AnyRecord): { line: string; evidence: string[] } {
  const report = getObject(item.investmentReport);
  const decisionEngine = getObject(item.decisionEngine);
  const line =
    getString(decisionEngine.buyTrigger) ||
    getString(report.fact) ||
    getString(item.companySummary) ||
    "성장성과 밸류를 함께 점검";
  const catalyst = getStringArray(item.coreCatalyst);
  const points = getStringArray(item.investmentPoints);
  const summary = getString(item.companySummary);
  const evidence: string[] = [];
  if (summary) evidence.push(summary);
  (catalyst.length ? catalyst : points)
    .filter((b) => b !== summary)
    .slice(0, 2)
    .forEach((b) => evidence.push(b));
  const risk = getString(item.riskSummary);
  if (risk) evidence.push(`⚠ ${risk}`);
  return { line: clamp(line, 44), evidence: evidence.slice(0, 4) };
}

// 보유 이유 — 구체 1줄 + 근거. 펀드별 어휘(와바바=실적/성장/밸류, AI=신호/리스크).
function buildHoldReason(
  position: AnyRecord,
  reviewItem: AnyRecord,
  isAi: boolean,
): { line: string; evidence: string[] } {
  const signal = getObject(position.sellSignal);
  const urgency = getString(signal.urgency).toUpperCase();
  const action = getString(position.action).toUpperCase();
  const rate = getPositionProfitRate(position);
  const metrics = extractHoldMetrics(reviewItem);
  const watching = /SELL/.test(action) || urgency === "HIGH";
  const checking = urgency === "MID" || /CHECK|REDUCE/.test(action);

  const evidence: string[] = [];
  metrics.bullets.forEach((b) => evidence.push(b));
  getStringArray(signal.reasons)
    .map((r) => humanizeReason(r))
    .filter(Boolean)
    .forEach((r) => {
      if (!evidence.includes(r)) evidence.push(r);
    });
  const nextCheck = getString(reviewItem.nextCheck);
  if (nextCheck) evidence.push(`다음 점검 · ${nextCheck}`);

  // 손실 머리말(손실일 때만) + 위험 요인 꼬리말로 자연스러운 문장 구성.
  const lossHead =
    rate !== null && rate < 0 ? `손실 ${formatPercent(Math.abs(rate))}` : "";
  const tail = holdRiskTail(signal, isAi);

  let line: string;
  if (watching || checking) {
    // 손실이 있으면 "손실 X%, 위험요인", 없으면 위험요인 문구만(중복 표현 방지).
    line = lossHead ? `${lossHead}, ${tail}` : tail;
  } else {
    const parts = [metrics.opGrowth, metrics.roe].filter(Boolean);
    if (parts.length > 0) {
      line = isAi
        ? `실적 신호 유지 · ${parts.join(" · ")}`
        : `${parts.join(" · ")}로 실적 흐름 유지`;
    } else {
      line = isAi
        ? "실적 신호 유지, 리스크 허용 범위"
        : "실적 성장 흐름 유지";
    }
  }
  return { line: clamp(line, 46), evidence: evidence.slice(0, 4) };
}

// 매도 이유 — 구체 1줄 + 근거. 내부 엔진 표현은 정리.
function buildSellReason(
  trade: AnyRecord,
  isAi: boolean,
): { line: string; evidence: string[] } {
  const raw = humanizeReason(getString(trade.reason) || getString(trade.sellReason));
  const rate = getPositionProfitRate(trade);
  // 매도 사유 꼬리말 — reason 텍스트에서 실적/재무 신호 감지(엔진 표현은 제외).
  const tail = /성장|실적/.test(raw)
    ? isAi
      ? "성장신호 약화"
      : "성장 가설 약화"
    : /부채|재무/.test(raw)
      ? "재무 리스크 확대"
      : "리스크 점검 기준 도달";

  let line: string;
  if (rate !== null && rate < 0) {
    line = `손실 ${formatPercent(Math.abs(rate))}, ${tail}`;
  } else if (rate !== null && rate > 0) {
    line = `차익 실현, ${tail}`;
  } else {
    line = isAi ? "기대수익 저하로 매도" : "리스크 확대로 매도";
  }

  const evidence: string[] = [];
  // 엔진/등급 표현이 아닌 경우에만 원문 근거 노출.
  if (raw && !/엔진|\bHIGH\b|\bMID\b|\bLOW\b|score|점수/i.test(raw)) {
    evidence.push(raw);
  }
  if (rate !== null) evidence.push(`실현 수익률 ${formatPercent(rate)}`);
  return { line: clamp(line, 40), evidence };
}

function getCode(item: AnyRecord): string {
  return (
    getString(item.code) || getString(item.symbol) || getString(item.stockCode)
  );
}

function getName(item: AnyRecord): string {
  return (
    getString(item.name) ||
    getString(item.corpName) ||
    getString(item.companyName) ||
    getCode(item) ||
    "-"
  );
}

function readStringArray(source: AnyRecord, key: string): string[] {
  const raw = source[key];
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => getString(item)).filter(Boolean);
}

function getNested(source: AnyRecord, key: string): AnyRecord {
  return getObject(source[key]);
}

function uniqByCode(items: AnyRecord[]): AnyRecord[] {
  const seen = new Set<string>();
  const result: AnyRecord[] = [];
  for (const item of items) {
    const code = getCode(item) || getName(item);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    result.push(item);
  }
  return result;
}

function getExploreItems(history: AnyRecord, group: string): AnyRecord[] {
  return getArray(getNested(history, "exploreGroups")[group]);
}

function getAiTradePicks(history: AnyRecord): AnyRecord[] {
  const tradeResult = getNested(history, "aiFundTradeResult");
  return getArray(tradeResult.aiTradePicks);
}

function buildWababaCandidates(history: AnyRecord): AnyRecord[] {
  const finalBest = getObject(history.finalBestPick);
  const total = getExploreItems(history, "total");
  const picks = getArray(history.wababaPicks);
  return uniqByCode(
    [finalBest, ...picks, ...total].filter(
      (item) => Object.keys(item).length > 0,
    ),
  ).slice(0, 5);
}

function buildAiCandidates(history: AnyRecord): AnyRecord[] {
  const aiPicks = getAiTradePicks(history);
  const total = getExploreItems(history, "total");
  const growth = getExploreItems(history, "growth");
  const stable = getExploreItems(history, "stable");
  return uniqByCode([...aiPicks, ...growth, ...stable, ...total]).slice(0, 5);
}

function getSummaryPositions(summary: AnyRecord): AnyRecord[] {
  return getArray(summary.positions);
}

function getPositionAmount(position: AnyRecord): number | null {
  const direct = getNumber(position.evaluationAmount);
  if (direct !== null) return direct;
  const price = getNumber(position.currentPrice);
  const quantity = getNumber(position.quantity);
  if (price === null || quantity === null) return null;
  return price * quantity;
}

function getPositionBuyAmount(position: AnyRecord): number | null {
  const direct = getNumber(position.buyAmount);
  if (direct !== null) return direct;
  const price = getNumber(position.buyPrice);
  const quantity = getNumber(position.quantity);
  if (price === null || quantity === null) return null;
  return price * quantity;
}

function getPositionProfitAmount(position: AnyRecord): number | null {
  const direct = getNumber(position.profitAmount);
  if (direct !== null) return direct;
  const evalAmount = getPositionAmount(position);
  const buyAmount = getPositionBuyAmount(position);
  if (evalAmount === null || buyAmount === null) return null;
  return evalAmount - buyAmount;
}

function getPositionProfitRate(position: AnyRecord): number | null {
  const direct = getNumber(position.profitRate);
  if (direct !== null) return direct;
  const profit = getPositionProfitAmount(position);
  const buyAmount = getPositionBuyAmount(position);
  if (profit === null || buyAmount === null || buyAmount === 0) return null;
  return (profit / buyAmount) * 100;
}

function getPositionWeight(
  position: AnyRecord,
  totalAsset: number | null,
): number | null {
  const direct = getNumber(position.weight);
  if (direct !== null) return direct;
  const amount = getPositionAmount(position);
  if (amount === null || totalAsset === null || totalAsset <= 0) return null;
  return (amount / totalAsset) * 100;
}

function getHoldingDays(position: AnyRecord): string {
  const buyDate = getString(position.buyDate);
  if (!buyDate) return "-";
  const match = buyDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "-";
  const buy = new Date(`${match[1]}-${match[2]}-${match[3]}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - buy.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "1일";
  return `${diffDays}일`;
}

function readMemo(
  history: AnyRecord,
  key: string,
): { title: string; lines: string[]; status: string } {
  const memo = getObject(history[key]);
  return {
    title: getString(memo.title) || "오늘의 운용 메모",
    lines: readStringArray(memo, "lines"),
    status: getString(memo.status),
  };
}

function readHoldingReview(history: AnyRecord, key: string): AnyRecord[] {
  return getArray(getObject(history[key]).items);
}

function collectMetadataByCode(history: AnyRecord): Map<string, AnyRecord> {
  const map = new Map<string, AnyRecord>();
  const sources: AnyRecord[] = [];

  const picks = getArray(history.wababaPicks);
  sources.push(...picks);

  const exploreGroups = getObject(history.exploreGroups);
  for (const value of Object.values(exploreGroups)) {
    if (Array.isArray(value)) {
      sources.push(...getArray(value));
    }
  }

  for (const item of sources) {
    const code = getCode(item);
    if (code && !map.has(code)) {
      map.set(code, item);
    }
  }
  return map;
}

function buildHoldingsForState(
  positions: AnyRecord[],
  history: AnyRecord,
): PortfolioHoldingInput[] {
  const metaByCode = collectMetadataByCode(history);
  return positions.map((pos) => {
    const code = getCode(pos);
    const meta = metaByCode.get(code) || {};
    const per = getNumber(meta.per) ?? getNumber(meta.PER) ?? undefined;
    return {
      code: code || undefined,
      name: getName(pos) || getName(meta) || undefined,
      industryName: getString(meta.industryName) || undefined,
      sectorDurabilityLabel:
        getString(meta.sectorDurabilityLabel) || undefined,
      growthDurabilityLabel:
        getString(meta.growthDurabilityLabel) || undefined,
      growthConsistencyLabel:
        getString(meta.growthConsistencyLabel) || undefined,
      longTermHoldView: getString(meta.longTermHoldView) || undefined,
      industryTailwind: getString(meta.industryTailwind) || undefined,
      per: per === null ? undefined : per,
    };
  });
}

function getFundData(history: AnyRecord, theme: FundTheme) {
  const isAi = theme.key === "ai";
  const summary = isAi
    ? getObject(history.aiPortfolioSummary)
    : getObject(history.portfolioSummary);
  const analysis = isAi
    ? getObject(history.aiPerformanceAnalysis)
    : getObject(history.performanceAnalysis);
  const tradeResult = isAi
    ? getObject(history.aiFundTradeResult)
    : getObject(history.fundTradeResult);
  const memo = isAi
    ? readMemo(history, "aiDailyFundMemo")
    : readMemo(history, "dailyFundMemo");
  const holdingReview = isAi
    ? readHoldingReview(history, "aiHoldingReview")
    : readHoldingReview(history, "holdingReview");
  const portfolio = getNested(analysis, "portfolioPerformance");
  const positions = getSummaryPositions(summary);

  const initialCapital =
    getNumber(summary.initialCapital) ??
    getNumber(portfolio.initialCapital) ??
    50000000;
  const totalAsset =
    getNumber(summary.totalAssetAmount) ??
    getNumber(portfolio.totalAssetAmount) ??
    initialCapital;
  const totalProfit =
    getNumber(summary.totalProfitAmount) ??
    getNumber(portfolio.totalProfitAmount) ??
    totalAsset - initialCapital;
  const totalProfitRate =
    getNumber(summary.totalProfitRate) ??
    getNumber(portfolio.totalProfitRate) ??
    (initialCapital ? (totalProfit / initialCapital) * 100 : null);
  const cash =
    getNumber(summary.cash) ?? getNumber(portfolio.cash) ?? initialCapital;
  const invested =
    getNumber(summary.totalEvaluationAmount) ??
    getNumber(portfolio.totalEvaluationAmount) ??
    0;
  const investedRate = totalAsset > 0 ? (invested / totalAsset) * 100 : null;
  const cashRate = totalAsset > 0 ? (cash / totalAsset) * 100 : null;

  return {
    summary,
    analysis,
    tradeResult,
    memo,
    holdingReview,
    positions,
    initialCapital,
    totalAsset,
    totalProfit,
    totalProfitRate,
    cash,
    invested,
    investedRate,
    cashRate,
    positionCount: getNumber(summary.positionCount) ?? positions.length,
    buyCount:
      getNumber(getNested(analysis, "summary").totalTradeCount) ??
      getArray(tradeResult.orders).length,
    sellCount: getNumber(getNested(analysis, "summary").closedTradeCount) ?? 0,
    holdReviewMap: Object.fromEntries(
      holdingReview
        .map((item) => [getCode(item) || getString(item.code), item] as const)
        .filter(([key]) => key),
    ),
  };
}

function toneColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "#64748b";
  if (value > 0) return "#dc2626";
  if (value < 0) return "#2563eb";
  return "#334155";
}

function SmallMetricCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="smallMetricCard">
      <div className="smallMetricLabel">{label}</div>
      <div className="smallMetricValue" style={{ color: tone ?? "#0f172a" }}>
        {value}
      </div>
      {sub ? <div className="smallMetricSub">{sub}</div> : null}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: string;
  tone: string;
}) {
  return (
    <div className="miniStat">
      <div
        className="miniStatIcon"
        style={{ background: `${tone}14`, color: tone }}
      >
        {icon}
      </div>
      <div>
        <div className="miniStatLabel">{label}</div>
        <div className="miniStatValue">{value}</div>
      </div>
    </div>
  );
}

function CashDonut({
  cashRate,
  theme,
}: {
  cashRate: number | null;
  theme: FundTheme;
}) {
  const rate = Math.max(0, Math.min(100, cashRate ?? 0));
  const angle = `${rate * 3.6}deg`;
  return (
    <div
      className="cashDonut"
      style={{
        background: `conic-gradient(${theme.primary} 0deg ${angle}, #f97316 ${angle} 360deg)`,
      }}
    >
      <div className="cashDonutInner">
        <span>현금</span>
        <b>{formatPercent(rate, 0)}</b>
      </div>
    </div>
  );
}

function PortfolioStateBanner({
  history,
  theme,
  positions,
  cashRatePercent,
  snapshots,
}: {
  history: AnyRecord;
  theme: FundTheme;
  positions: AnyRecord[];
  cashRatePercent: number | null;
  snapshots: PortfolioSnapshot[];
}) {
  const holdings = buildHoldingsForState(positions, history);
  const state = buildPortfolioState({
    fundKey: theme.key,
    holdings,
    cashRatePercent: cashRatePercent ?? undefined,
    totalPositions: positions.length,
  });

  // Phase 37-A9: drift timeline. 현재 시점 ratios만 계산.
  // 과거 ratios snapshot이 데이터에 없으면 함수가 DATA_LIMITED로 처리.
  const totalHoldings = holdings.length;
  const longHoldCount = holdings.filter(
    (h) =>
      (h.longTermHoldView || "").includes("장기보유") ||
      (h.growthDurabilityLabel || "").includes("장기보유"),
  ).length;
  const cycleCount = holdings.filter((h) =>
    (h.sectorDurabilityLabel || "").includes("회복 사이클"),
  ).length;
  const valCount = holdings.filter(
    (h) => typeof h.per === "number" && (h.per as number) > 25,
  ).length;

  // Phase 37-A12: snapshot에서 previous 자동 lookup.
  // snapshot/previous 결측 시 안전 fallback (DATA_LIMITED).
  const currentDate = getString(history.baseDate) || undefined;
  const previousSnap = getPreviousPortfolioSnapshot({
    fundKey: theme.key,
    currentDate,
    snapshots,
  });
  const previousInput = snapshotToDriftSnapshot(previousSnap);

  const drift = buildPortfolioDriftTimeline({
    fundKey: theme.key,
    current: {
      date: currentDate,
      longHoldRatio: totalHoldings > 0 ? longHoldCount / totalHoldings : 0,
      cycleRatio: totalHoldings > 0 ? cycleCount / totalHoldings : 0,
      valuationStretchedRatio:
        totalHoldings > 0 ? valCount / totalHoldings : 0,
      cashRatePercent: cashRatePercent ?? undefined,
      totalPositions: totalHoldings,
    },
    previous: previousInput,
  });

  // Phase 37-A10: Action Layer. drift direction을 운영 모드 결정에 활용.
  const action = buildPortfolioActionLayer({
    fundKey: theme.key,
    holdings,
    cashRatePercent: cashRatePercent ?? undefined,
    driftDirection: drift.driftDirection,
    totalPositions: totalHoldings,
  });

  const chipClass =
    state.portfolioHealthLevel === "건강"
      ? "portfolioHealthChip portfolioHealthChip--healthy"
      : "portfolioHealthChip portfolioHealthChip--watch";

  return (
    <div
      className="portfolioStateBanner"
      style={{ borderColor: theme.border, background: theme.soft }}
    >
      <div className="portfolioStateRow">
        <span className={chipClass}>{state.portfolioHealthLevel}</span>
        <span
          className="portfolioStateTitleText"
          style={{ color: theme.primary }}
        >
          {state.portfolioStateTitle}
        </span>
      </div>
      <div className="portfolioStateText">
        {state.portfolioStateNarrative}
      </div>
      {state.portfolioStateTags.length > 0 ? (
        <div className="portfolioStateTagRow">
          {state.portfolioStateTags.map((tag) => (
            <span
              key={`${theme.key}-pst-${tag}`}
              className="portfolioStateTag"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="portfolioDriftRow">
        <span className="portfolioDriftLabel">상태 흐름</span>
        <span className="portfolioDriftText">
          {drift.driftNarrative}
        </span>
      </div>
      <div className="portfolioActionRow">
        <span
          className="portfolioActionLabel"
          style={{ color: theme.primary }}
        >
          오늘의 운영 포인트
        </span>
        <span className="portfolioActionText">{action.actionNarrative}</span>
      </div>
      {action.actionTags.length > 0 ? (
        <div className="portfolioActionTagRow">
          {action.actionTags.map((tag) => (
            <span
              key={`${theme.key}-pa-${tag}`}
              className="portfolioActionTag"
              style={{
                background: theme.soft,
                color: theme.primary,
                borderColor: theme.border,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FundCard({
  history,
  theme,
  snapshots,
}: {
  history: AnyRecord;
  theme: FundTheme;
  snapshots: PortfolioSnapshot[];
}) {
  const data = getFundData(history, theme);
  const memoLines =
    data.memo.lines.length > 0
      ? data.memo.lines
      : theme.key === "ai"
        ? [
            "AI가 시장 후보를 비교해 자율 운용합니다.",
            "현금과 보유 종목을 매일 점검합니다.",
          ]
        : [
            "가치투자 원칙에 맞는 종목만 보유합니다.",
            "성장이 유지되는지 매일 점검합니다.",
          ];
  const topReview = data.holdingReview[0];
  const positions = data.positions;
  const totalBuyAmount =
    positions.length > 0
      ? positions.reduce(
          (sum, p) => sum + (getPositionBuyAmount(p) ?? 0),
          0,
        )
      : null;

  return (
    <section
      className="fundCard"
      style={{
        borderColor: theme.border,
        boxShadow: `0 18px 45px ${theme.glow}`,
      }}
    >
      <div className="fundCardHeader">
        <div>
          <div className="fundTitleRow">
            <div
              className="fundIcon"
              style={{ background: theme.soft, color: theme.primary }}
            >
              ⌁
            </div>
            <h2 style={{ color: theme.primary }}>{theme.title}</h2>
            <span
              className="pill"
              style={{
                color: theme.text,
                background: theme.soft,
                borderColor: theme.border,
              }}
            >
              {theme.subtitle}
            </span>
          </div>
        </div>
        <span className="statusPill">{theme.badge}</span>
      </div>

      <PortfolioStateBanner
        history={history}
        theme={theme}
        positions={data.positions}
        cashRatePercent={data.cashRate}
        snapshots={snapshots}
      />

      <div className="fundTopGrid">
        <div className="fundMetricMain">
          <div className="fundCoreGrid">
            <div className="fundCoreItem">
              <div className="mutedLabel">총자산</div>
              <div className="coreNumber">{formatKrw(data.totalAsset)}</div>
              <div className="coreSub">현금 + 보유주식</div>
            </div>
            <div className="fundCoreItem">
              <div className="mutedLabel">누적 수익률</div>
              <div
                className="coreNumber"
                style={{ color: toneColor(data.totalProfitRate) }}
              >
                {formatPercent(data.totalProfitRate)}
              </div>
              <div className="coreSub">초기자산 대비</div>
            </div>
            <div className="fundCoreItem">
              <div className="mutedLabel">평가손익</div>
              <div
                className="coreNumber"
                style={{ color: toneColor(data.totalProfit) }}
              >
                {formatKrw(data.totalProfit)}
              </div>
              <div className="coreSub">보유주식 기준</div>
            </div>
          </div>
          <div className="fundAuxGrid">
            <div className="fundAuxItem">
              <div className="auxLabel">현금</div>
              <div className="auxValue">{formatKrw(data.cash)}</div>
            </div>
            <div className="fundAuxItem">
              <div className="auxLabel">총매수금액</div>
              <div className="auxValue">
                {totalBuyAmount ? formatKrw(totalBuyAmount) : "-"}
              </div>
            </div>
            <div className="fundAuxItem">
              <div className="auxLabel">현금비중</div>
              <div className="auxValue">{formatPercent(data.cashRate, 1)}</div>
            </div>
          </div>
        </div>
        <CashDonut cashRate={data.cashRate} theme={theme} />
      </div>

      <details
        className="memoBox"
        style={{
          background: `linear-gradient(135deg, ${theme.soft} 0%, #ffffff 100%)`,
          borderColor: theme.border,
        }}
      >
        <summary className="memoTitle" style={{ color: theme.primary }}>
          오늘의 운용 메모
          {topReview ? (
            <span className="reviewHintInline">
              {" · "}
              {getName(topReview)}{" "}
              {getString(topReview.actionLabel) ||
                getString(topReview.action) ||
                "보유 점검"}
            </span>
          ) : null}
        </summary>
        <div className="memoLines">
          {memoLines.slice(0, 3).map((line, index) => (
            <div key={`${theme.key}-memo-${line}-${index}`}>· {line}</div>
          ))}
        </div>
      </details>

      <div className="holdingHeader">
        <h3>
          보유 종목 <span>({formatNumber(data.positionCount, 0)}개)</span>
        </h3>
      </div>
      <HoldingTable
        positions={positions}
        totalAsset={data.totalAsset}
        theme={theme}
        holdReviewMap={data.holdReviewMap}
      />

      <div className="fundStatsRow">
        <MiniStat
          label="매수 건수"
          value={`${formatNumber(data.buyCount, 0)}건`}
          icon="↗"
          tone={theme.primary}
        />
        <MiniStat
          label="매도 건수"
          value={`${formatNumber(data.sellCount, 0)}건`}
          icon="↘"
          tone="#ef4444"
        />
        <MiniStat
          label="총 거래 금액"
          value={formatKrw(data.invested)}
          icon="₩"
          tone={theme.primary}
        />
        <MiniStat
          label="보유 기간"
          value={positions.length > 0 ? "1일" : "-"}
          icon="◷"
          tone={theme.primary}
        />
      </div>
    </section>
  );
}

function HoldingTable({
  positions,
  totalAsset,
  theme,
  holdReviewMap,
}: {
  positions: AnyRecord[];
  totalAsset: number | null;
  theme: FundTheme;
  holdReviewMap: Record<string, AnyRecord>;
}) {
  if (positions.length === 0) {
    return <div className="emptyHolding">아직 보유 종목이 없습니다.</div>;
  }

  const rows = positions.map((position, index) => {
    const name = getName(position);
    const code = getCode(position);
    const quantity = getNumber(position.quantity);
    const buyPrice = getNumber(position.buyPrice);
    const currentPrice = getNumber(position.currentPrice);
    const buyAmount = getPositionBuyAmount(position);
    const evalAmount = getPositionAmount(position);
    const profitAmount = getPositionProfitAmount(position);
    const profitRate = getPositionProfitRate(position);
    const weight = getPositionWeight(position, totalAsset);
    const holdingDays = getHoldingDays(position);
    const reviewItem = getObject(holdReviewMap[code]);
    const hold = buildHoldReason(position, reviewItem, theme.key === "ai");
    return {
      key: `${theme.key}-${code}-${index}`,
      name,
      code,
      quantity,
      buyPrice,
      currentPrice,
      buyAmount,
      evalAmount,
      profitAmount,
      profitRate,
      weight,
      holdingDays,
      holdLine: hold.line,
      holdEvidence: hold.evidence,
    };
  });

  return (
    <>
      <div className="holdingTableWrap">
        <table className="holdingTable">
          <thead>
            <tr>
              <th>종목명</th>
              <th>수량</th>
              <th>평균단가</th>
              <th>총매수금액</th>
              <th>현재가</th>
              <th>현재금액</th>
              <th>평가손익</th>
              <th>수익률</th>
              <th>비중</th>
              <th>보유기간</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <b>{r.name}</b>
                  <span>{r.code}</span>
                  <span className="holdReasonInline">보유 · {r.holdLine}</span>
                </td>
                <td>{formatNumber(r.quantity, 0)}주</td>
                <td>{formatKrw(r.buyPrice)}</td>
                <td>{formatKrw(r.buyAmount)}</td>
                <td>{formatKrw(r.currentPrice)}</td>
                <td>{formatKrw(r.evalAmount)}</td>
                <td style={{ color: toneColor(r.profitAmount) }}>
                  {formatKrw(r.profitAmount)}
                </td>
                <td style={{ color: toneColor(r.profitRate) }}>
                  {formatPercent(r.profitRate)}
                </td>
                <td>{formatPercent(r.weight, 1)}</td>
                <td>{r.holdingDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="holdingCardList">
        {rows.map((r) => (
          <div key={r.key} className="holdRow">
            <div className="holdRowMain">
              <span className="holdRowName">{r.name}</span>
              <span
                className="holdRowRate"
                style={{ color: toneColor(r.profitRate) }}
              >
                {formatPercent(r.profitRate)}
              </span>
            </div>
            <div className="holdRowReason">보유 · {r.holdLine}</div>
            <ReasonDetails items={r.holdEvidence} label="근거 보기" theme={theme} />
            <div className="holdRowSub">
              <span>평가 {formatKrw(r.evalAmount)}</span>
              <span>비중 {formatPercent(r.weight, 1)}</span>
              <span>평단 {formatKrw(r.buyPrice)}</span>
              <span>현재 {formatKrw(r.currentPrice)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ComparisonSection({ history }: { history: AnyRecord }) {
  const wababa = getFundData(history, WABABA_THEME);
  const ai = getFundData(history, AI_THEME);
  const rows = [
    [
      "누적 수익률",
      formatPercent(wababa.totalProfitRate),
      formatPercent(ai.totalProfitRate),
    ],
    ["누적 손익", formatKrw(wababa.totalProfit), formatKrw(ai.totalProfit)],
    ["투자 금액", formatKrw(wababa.invested), formatKrw(ai.invested)],
    [
      "현금 비중",
      formatPercent(wababa.cashRate, 1),
      formatPercent(ai.cashRate, 1),
    ],
    [
      "보유 종목 수",
      `${formatNumber(wababa.positionCount, 0)}개`,
      `${formatNumber(ai.positionCount, 0)}개`,
    ],
    [
      "매수 건수",
      `${formatNumber(wababa.buyCount, 0)}건`,
      `${formatNumber(ai.buyCount, 0)}건`,
    ],
  ];

  return (
    <section className="comparisonSection">
      <div className="chartCard">
        <div className="sectionTitle">펀드 성과 비교</div>
        <div className="chartTitle">수익률 비교</div>
        <SimpleLineChart
          wababa={wababa.totalProfitRate ?? 0}
          ai={ai.totalProfitRate ?? 0}
        />
      </div>
      <details className="comparisonDetails">
        <summary className="comparisonSummary">
          펀드별 상세 비교 보기
        </summary>
        <div className="compareTableCard">
          <table className="compareTable">
            <thead>
              <tr>
                <th>구분</th>
                <th style={{ color: WABABA_THEME.primary }}>와바바 펀드</th>
                <th style={{ color: AI_THEME.primary }}>와바바 AI 펀드</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, a, b]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function SimpleLineChart({ wababa, ai }: { wababa: number; ai: number }) {
  const width = 520;
  const height = 210;
  const valuesA = [
    0,
    wababa * 0.25,
    wababa * 0.45,
    wababa * 0.65,
    wababa * 0.82,
    wababa,
  ];
  const valuesB = [0, ai * 0.25, ai * 0.45, ai * 0.65, ai * 0.82, ai];
  const all = [...valuesA, ...valuesB, -10, 5];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const x = (index: number) => 36 + index * ((width - 72) / 5);
  const y = (value: number) =>
    20 + ((max - value) / (max - min || 1)) * (height - 48);
  const pathFor = (values: number[]) =>
    values
      .map(
        (value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`,
      )
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="lineChart"
      role="img"
      aria-label="누적 수익률 비교 차트"
    >
      {[0, 1, 2, 3].map((line) => {
        const yy = 24 + line * 44;
        return (
          <line
            key={line}
            x1="28"
            x2={width - 24}
            y1={yy}
            y2={yy}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}
      <path
        d={pathFor(valuesA)}
        fill="none"
        stroke={WABABA_THEME.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d={pathFor(valuesB)}
        fill="none"
        stroke={AI_THEME.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {valuesA.map((value, index) => (
        <circle
          key={`a-${index}`}
          cx={x(index)}
          cy={y(value)}
          r="4"
          fill={WABABA_THEME.primary}
        />
      ))}
      {valuesB.map((value, index) => (
        <circle
          key={`b-${index}`}
          cx={x(index)}
          cy={y(value)}
          r="4"
          fill={AI_THEME.primary}
        />
      ))}
      <text x="36" y={height - 6} fill="#64748b" fontSize="12">
        05/01
      </text>
      <text x={width - 70} y={height - 6} fill="#64748b" fontSize="12">
        최근
      </text>
    </svg>
  );
}

// 근거 보기 — 접힘. 기본 노출은 1줄, 자세한 근거는 여기로.
function ReasonDetails({
  items,
  label = "근거 보기",
  theme,
}: {
  items: string[];
  label?: string;
  theme?: FundTheme;
}) {
  if (!items || items.length === 0) return null;
  return (
    <details className="reasonDetails">
      <summary
        className="reasonDetailsSummary"
        style={theme ? { color: theme.primary } : undefined}
      >
        {label}
      </summary>
      <ul className="reasonDetailsList">
        {items.map((it, i) => (
          <li key={`${label}-${i}`}>{it}</li>
        ))}
      </ul>
    </details>
  );
}

function BestPickHero({ history }: { history: AnyRecord }) {
  const finalBest = getObject(history.finalBestPick);
  if (Object.keys(finalBest).length === 0) return null;

  const name = getName(finalBest);
  const code = getCode(finalBest);
  const decisionEngine = getObject(finalBest.decisionEngine);
  // 운용앱 원칙: 기본은 구체 1줄, 자세한 근거는 "근거 보기"로 접어 제공.
  const buy = buildBuyReason(finalBest);
  const reasonLine = buy.line;
  const confidence = getNumber(decisionEngine.confidence);
  const score =
    getNumber(finalBest.aiFundScore) ??
    getNumber(finalBest.finalBestScore) ??
    getNumber(finalBest.score);
  const per = getNumber(finalBest.per) ?? getNumber(finalBest.PER);
  const roe = getNumber(finalBest.roe) ?? getNumber(finalBest.ROE);

  return (
    <section className="bestHero">
      <div className="bestHeroHeader">
        <div className="bestHeroTitleRow">
          <span className="bestHeroBadge">⭐ 오늘의 종합 BEST</span>
          <span className="bestHeroName">
            {name}
            {code ? <em>{code}</em> : null}
          </span>
        </div>
        <div className="bestHeroMeta">
          {confidence !== null ? (
            <span className="bestHeroConfidence">신뢰도 {confidence}%</span>
          ) : null}
          {score !== null ? (
            <span className="bestHeroScore">스코어 {formatNumber(score, 0)}</span>
          ) : null}
        </div>
      </div>

      <div className="bestHeroReason">{reasonLine}</div>

      <div className="bestHeroMetricsRow">
        {per !== null ? (
          <span className="bestHeroMetricBadge">PER {formatNumber(per, 1)}배</span>
        ) : null}
        {roe !== null ? (
          <span className="bestHeroMetricBadge">ROE {formatPercent(roe, 1)}</span>
        ) : null}
      </div>

      <ReasonDetails items={buy.evidence} label="매수 근거 보기" />
    </section>
  );
}

// 대시보드 전용 — 현재 보유 종목 압축 1줄 목록(와바바 펀드 기준).
function DashboardHoldings({ history }: { history: AnyRecord }) {
  const data = getFundData(history, WABABA_THEME);
  const positions = data.positions;
  if (positions.length === 0) {
    return <div className="emptyCell">현재 보유 중인 종목이 없습니다.</div>;
  }
  return (
    <div className="holdStrip">
      {positions.map((position, index) => {
        const rate = getPositionProfitRate(position);
        const weight = getPositionWeight(position, data.totalAsset);
        const reviewItem = getObject(data.holdReviewMap[getCode(position)]);
        const hold = buildHoldReason(position, reviewItem, false);
        return (
          <div className="holdStripRow" key={`hold-${getCode(position)}-${index}`}>
            <div className="holdStripMain">
              <span className="holdStripName">{getName(position)}</span>
              <span className="holdStripReason">보유 · {hold.line}</span>
            </div>
            <span className="holdStripWeight">{formatPercent(weight, 1)}</span>
            <span className="holdStripRate" style={{ color: toneColor(rate) }}>
              {formatPercent(rate)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 대시보드 전용 — 최근 매도/축소. 일부 매도 후 잔여 보유면 "판 종목"으로 단정하지 않음.
function DashboardSold({ history }: { history: AnyRecord }) {
  const analysis = getObject(history.performanceAnalysis);
  const sold = getArray(analysis.tradeHistory).filter((trade) =>
    /매도|sell/i.test(
      getString(trade.action) ||
        getString(trade.side) ||
        getString(trade.type),
    ),
  );
  if (sold.length === 0) {
    return <div className="emptyCell">최근 매도 내역이 없습니다.</div>;
  }
  // 현재 보유 코드(펀드별) — 일부 매도 / 펀드 차이를 구분하기 위함.
  const wababaHeld = new Set(
    getFundData(history, WABABA_THEME).positions.map((p) => getCode(p)),
  );
  const aiHeld = new Set(
    getFundData(history, AI_THEME).positions.map((p) => getCode(p)),
  );
  return (
    <div className="holdStrip">
      {sold.slice(0, 5).map((trade, index) => {
        const rate = getPositionProfitRate(trade);
        const code = getCode(trade);
        // 매도 이력은 와바바펀드 기준(tradeHistory). 잔여 보유 여부로 라벨 결정.
        let statusLabel: string;
        let statusNote = "";
        if (wababaHeld.has(code)) {
          statusLabel = "일부 매도";
          statusNote = "현재 일부 보유 중";
        } else if (aiHeld.has(code)) {
          statusLabel = "와바바펀드 매도";
          statusNote = "AI펀드 보유 중";
        } else {
          statusLabel = "전량 매도";
        }
        return (
          <div className="holdStripRow" key={`sold-${code}-${index}`}>
            <div className="holdStripMain">
              <span className="holdStripName">{getName(trade)}</span>
              <span className="holdStripReason">
                {statusLabel} · {buildSellReason(trade, false).line}
              </span>
              {statusNote ? (
                <span className="holdSoldNote">{statusNote}</span>
              ) : null}
            </div>
            <span className="holdStripWeight">
              {formatShortDate(trade.date || trade.sellDate)}
            </span>
            <span className="holdStripRate" style={{ color: toneColor(rate) }}>
              {formatPercent(rate)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CandidateSection({
  title,
  subtitle,
  items,
  theme,
}: {
  title: string;
  subtitle: string;
  items: AnyRecord[];
  theme: FundTheme;
}) {
  return (
    <section className="candidateCard" style={{ borderColor: theme.border }}>
      <div className="candidateHeader">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span
          className="pill"
          style={{
            background: theme.soft,
            color: theme.text,
            borderColor: theme.border,
          }}
        >
          {theme.key === "ai" ? "와바바 AI 기준" : "와바바 기준"}
        </span>
      </div>
      <div className="candidateCardList">
        {items.slice(0, 5).map((item, index) => {
          const name = getName(item);
          const code = getCode(item);
          const investmentReport = getObject(item.investmentReport);
          const decisionEngine = getObject(item.decisionEngine);
          const fact =
            getString(investmentReport.fact) ||
            getString(item.companySummary) ||
            getString(item.growthStory) ||
            getString(item.rankReason) ||
            "성장성과 밸류를 함께 점검";
          const buyTrigger = getString(decisionEngine.buyTrigger);
          const riskSummary = getString(item.riskSummary);
          const confidence = getNumber(decisionEngine.confidence);
          const per = getNumber(item.per) ?? getNumber(item.PER);
          const pbr = getNumber(item.pbr) ?? getNumber(item.PBR);
          const roe = getNumber(item.roe) ?? getNumber(item.ROE);
          const divYield =
            getNumber(item.dividendYield) ?? getNumber(item.divYield);
          const opMargin =
            getNumber(item.ebitMargin) ?? getNumber(item.opMargin);
          const valuationText = getString(investmentReport.valuation);
          const businessImpactText = getString(
            investmentReport.businessImpact,
          );
          const decisionText = getString(investmentReport.decision);
          const judgmentText = decisionText || businessImpactText;
          const hasAnyMetric =
            per !== null ||
            pbr !== null ||
            roe !== null ||
            divYield !== null ||
            opMargin !== null;
          const price =
            getNumber(item.price) ?? getNumber(item.currentPrice);
          const buyPrice =
            getNumber(getObject(item.positionSizing).firstBuyPrice) ??
            price;
          return (
            <div className="candidateCardRow" key={`${title}-${code}-${index}`}>
              <div className="candidateCardHeader">
                <div className="candidateCardLead">
                  <span
                    className="rankCircle"
                    style={{ background: theme.soft, color: theme.primary }}
                  >
                    {index + 1}
                  </span>
                  <div className="candidateCardName">
                    <b>{name}</b>
                    <span>{code}</span>
                  </div>
                </div>
                <div className="candidateCardMeta">
                  <div className="candidateCardMetaItem">
                    <span>매수단가</span>
                    <b>{formatKrw(buyPrice)}</b>
                  </div>
                  <div className="candidateCardMetaItem">
                    <span>현재가</span>
                    <b>{formatKrw(price)}</b>
                  </div>
                </div>
              </div>
              <div className="candidateCardBody">
                {/* 한줄 이유 — 가장 짧은 핵심만 우선 노출 */}
                <div className="candidateReasonLine">
                  {(() => {
                    const r = buyTrigger || fact;
                    return r.length > 40 ? `${r.slice(0, 40)}…` : r;
                  })()}
                </div>
                {/* 핵심 지표 한 줄 */}
                {hasAnyMetric ? (
                  <div className="candidateMetricsRow">
                    {per !== null ? (
                      <span className="candidateMetricBadge">
                        PER {formatNumber(per, 1)}배
                      </span>
                    ) : null}
                    {pbr !== null ? (
                      <span className="candidateMetricBadge">
                        PBR {formatNumber(pbr, 1)}배
                      </span>
                    ) : null}
                    {roe !== null ? (
                      <span className="candidateMetricBadge">
                        ROE {formatPercent(roe, 1)}
                      </span>
                    ) : null}
                    {divYield !== null ? (
                      <span className="candidateMetricBadge">
                        배당 {formatPercent(divYield, 1)}
                      </span>
                    ) : null}
                    {opMargin !== null ? (
                      <span className="candidateMetricBadge">
                        영업이익률 {formatPercent(opMargin, 1)}
                      </span>
                    ) : null}
                    {confidence !== null ? (
                      <span className="candidateMetricBadge">
                        신뢰도 {confidence}%
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {/* 상세 설명 — 접어서 아래로 밀기 (삭제하지 않음) */}
                {judgmentText || valuationText || riskSummary ? (
                  <details className="candidateDetails">
                    <summary className="candidateDetailsSummary">
                      상세 보기
                    </summary>
                    <div className="candidateDetailsBody">
                      <div className="candidateFactLine">{fact}</div>
                      {judgmentText ? (
                        <div
                          className="candidateDecisionLine"
                          style={{ borderLeftColor: theme.primary }}
                        >
                          <b style={{ color: theme.primary }}>왜 지금</b>{" "}
                          {judgmentText}
                        </div>
                      ) : null}
                      {valuationText ? (
                        <div className="candidateValuationLine">
                          <b>밸류</b> · {valuationText}
                        </div>
                      ) : null}
                      {riskSummary ? (
                        <div className="riskSummaryLine">⚠ {riskSummary}</div>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          );
        })}
        {items.length === 0 ? (
          <div className="emptyCell">표시할 후보가 없습니다.</div>
        ) : null}
      </div>
    </section>
  );
}

function PhilosophySection() {
  return (
    <section className="bottomGrid">
      <div className="philosophyBox">
        <div className="sectionTitle">운용 철학 비교</div>
        <div className="philosophyColumns">
          <div>
            <h4 style={{ color: WABABA_THEME.primary }}>와바바 펀드</h4>
            <p>가치투자 원칙 기반, 저평가 우량주 중심 투자</p>
            <p>성장 지속성, 재무건전성, 배당 매력도 함께 고려</p>
            <p>장기 보유를 통한 복리 수익 추구</p>
          </div>
          <div>
            <h4 style={{ color: AI_THEME.primary }}>와바바 AI 펀드</h4>
            <p>가치투자 기준과 별도로 운용하는 AI 자율운용</p>
            <p>재무·뉴스·성장신호를 종합해 기회와 리스크를 감지</p>
            <p>시장에서 수익 기회를 탐색</p>
          </div>
        </div>
      </div>
      <div className="systemBox">
        <div className="sectionTitle">자동운용 시스템</div>
        {[
          "매일 08:45 자동 실행",
          "시장 데이터 수집 및 분석",
          "투자 의사결정 및 실행",
          "성과 분석 및 리포트 생성",
        ].map((line) => (
          <div key={line} className="checkLine">
            ✓ {line}
          </div>
        ))}
      </div>
    </section>
  );
}


function GlobalSummary({ history }: { history: AnyRecord }) {
  const wababa = getFundData(history, WABABA_THEME);
  const ai = getFundData(history, AI_THEME);
  const totalAsset = (wababa.totalAsset ?? 0) + (ai.totalAsset ?? 0);
  const totalInitial = (wababa.initialCapital ?? 0) + (ai.initialCapital ?? 0);
  const totalProfit = totalAsset - totalInitial;
  const totalProfitRate =
    totalInitial > 0 ? (totalProfit / totalInitial) * 100 : null;
  const totalPositions = (wababa.positionCount ?? 0) + (ai.positionCount ?? 0);
  const totalCash = (wababa.cash ?? 0) + (ai.cash ?? 0);

  return (
    <section className="globalSummary">
      <SmallMetricCard
        label="전체 자산 (2펀드)"
        value={formatKrw(totalAsset)}
        sub={`전일 대비 ${formatPercent(totalProfitRate)}`}
      />
      <SmallMetricCard
        label="총 투자 원금"
        value={formatKrw(totalInitial)}
        sub="2펀드 합계"
      />
      <SmallMetricCard
        label="총 평가 손익"
        value={formatKrw(totalProfit)}
        sub={formatPercent(totalProfitRate)}
        tone={toneColor(totalProfit)}
      />
      <SmallMetricCard
        label="데이터 기준"
        value={formatShortDate(history.baseDate)}
        sub="최근 운용 기준"
      />
      <SmallMetricCard
        label="보유 종목 수"
        value={`${formatNumber(totalPositions, 0)}개`}
        sub="2펀드 합계"
      />
      <SmallMetricCard
        label="현금 보유액"
        value={formatKrw(totalCash)}
        sub="전체 현금 합계"
      />
    </section>
  );
}


const dashboardCss = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    background: #f8fafc;
  }
  .dashboardRoot {
    width: 100%;
    max-width: 1280px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #f8fafc;
    color: #0f172a;
    font-family: Arial, sans-serif;
    padding: 0 24px 28px;
  }
  .topBar {
    height: 50px;
    display: grid;
    grid-template-columns: 240px 1fr 300px;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 12px;
  }
  .brand {
    font-size: 17px;
    font-weight: 950;
    color: #1e3a8a;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .brand span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #fff;
    font-size: 18px;
    font-weight: 950;
  }
  nav { display: flex; justify-content: center; gap: 28px; height: 100%; align-items: stretch; }
  nav a { display: inline-flex; align-items: center; color: #334155; font-size: 14px; font-weight: 900; text-decoration: none; border-bottom: 2px solid transparent; }
  nav a.active { color: #2563eb; border-bottom-color: #2563eb; }
  .topStatus { display: flex; justify-content: flex-end; align-items: center; gap: 8px; color: #64748b; font-size: 12px; font-weight: 850; white-space: nowrap; }
  .autoOn { color: #059669; font-weight: 950; }
  .dataStaleNote { color: #94a3b8; font-size: 11px; font-weight: 800; }
  .globalSummary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 12px;
    min-width: 0;
  }
  .smallMetricCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px 14px;
    min-height: 0;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  }
  .smallMetricLabel { color: #475569; font-size: 12px; font-weight: 900; margin-bottom: 6px; }
  .smallMetricValue { font-size: 19px; font-weight: 950; letter-spacing: -0.04em; }
  .smallMetricSub { margin-top: 5px; color: #64748b; font-size: 11px; font-weight: 850; }
  /* Phase 38-B: 종목 우선 섹션 (사고/보유/판/펀드) */
  .dashSection { margin-bottom: 12px; }
  .dashSectionTitle { margin: 0 0 7px; font-size: 13px; font-weight: 900; color: #475569; }
  /* PC에서 가로로 길게 퍼지지 않도록 다중 컬럼으로 밀도 확보. 좁은 폭에선 auto-fill로 1컬럼. */
  .holdStrip { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 6px 10px; }
  .holdStripRow {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 14px;
  }
  .holdStripMain { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .holdStripName { font-size: 14px; font-weight: 850; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdStripReason { font-size: 11px; color: #94a3b8; font-weight: 750; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdSoldNote { font-size: 10px; color: #2563eb; font-weight: 850; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdStripWeight { font-size: 12px; color: #94a3b8; font-weight: 750; white-space: nowrap; }
  .holdStripRate { font-size: 14px; font-weight: 900; min-width: 56px; text-align: right; }
  .bestHeroReason {
    margin-top: 10px;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fundsGrid { display: grid; grid-template-columns: 1fr; gap: 22px; margin-bottom: 22px; min-width: 0; }
  .fundCard {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    background: #fff;
    border: 2px solid;
    border-radius: 16px;
    padding: 14px;
  }
  .fundCardHeader { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
  .fundTitleRow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fundIcon { width: 36px; height: 36px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 950; }
  h2 { margin: 0; font-size: 25px; line-height: 1; letter-spacing: -0.04em; }
  .pill, .statusPill { border: 1px solid; border-radius: 999px; padding: 6px 11px; font-size: 12px; font-weight: 950; white-space: nowrap; }
  .statusPill { border-color: #86efac; background: #f0fdf4; color: #047857; }
  .fundTopGrid { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 14px; align-items: center; border: 1px solid #e2e8f0; border-radius: 14px; padding: 13px; background: #fbfdff; min-width: 0; }
  .fundMetricMain { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .fundCoreGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px 0; }
  .fundCoreItem { display: flex; flex-direction: column; gap: 3px; min-width: 0; overflow: hidden; padding: 0 14px; border-left: 1px solid #e2e8f0; }
  .fundCoreItem:first-child { border-left: none; padding-left: 0; }
  .fundCoreItem:last-child { padding-right: 0; }
  .coreNumber { font-size: 22px; font-weight: 950; letter-spacing: -0.04em; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .coreSub { color: #94a3b8; font-size: 11px; font-weight: 850; line-height: 1.3; }
  .fundAuxGrid { display: flex; gap: 18px; flex-wrap: wrap; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  .fundAuxItem { display: flex; flex-direction: column; gap: 2px; }
  .auxLabel { color: #94a3b8; font-size: 11px; font-weight: 900; }
  .auxValue { color: #334155; font-size: 14px; font-weight: 950; letter-spacing: -0.02em; }
  .mutedLabel { color: #64748b; font-size: 12px; font-weight: 900; margin-bottom: 4px; }
  .profitSub, .cashText { color: #64748b; font-size: 12px; font-weight: 850; margin-top: 5px; }
  .cashDonut { width: 120px; height: 120px; border-radius: 999px; padding: 16px; justify-self: center; }
  .cashDonutInner { width: 100%; height: 100%; border-radius: 999px; background: #fff; display: flex; align-items: center; justify-content: center; flex-direction: column; box-shadow: inset 0 0 0 1px #e2e8f0; }
  .cashDonutInner span { color: #64748b; font-size: 13px; font-weight: 900; }
  .cashDonutInner b { color: #0f172a; font-size: 18px; font-weight: 950; }
  .memoBox { margin-top: 12px; border: 1px solid; border-radius: 14px; padding: 12px 14px; }
  .memoTitle { font-size: 14px; font-weight: 950; cursor: pointer; list-style: none; line-height: 1.4; }
  .memoTitle::-webkit-details-marker { display: none; }
  .memoTitle::marker { content: ""; }
  .memoTitle::before { content: "▸"; display: inline-block; margin-right: 7px; color: #94a3b8; transition: transform 0.18s; }
  .memoBox[open] > .memoTitle::before { transform: rotate(90deg); }
  .reviewHintInline { color: #64748b; font-size: 12px; font-weight: 850; }
  .memoBox:not([open]) > .memoLines { display: none; }
  .memoBox[open] > .memoLines { display: grid; gap: 6px; margin-top: 10px; color: #334155; font-size: 13px; font-weight: 850; line-height: 1.45; }
  .holdingHeader { margin: 18px 0 10px; }
  .holdingHeader h3 { margin: 0; font-size: 18px; font-weight: 950; }
  .holdingHeader span { color: #2563eb; }
  .holdingCardList { display: none; }
  /* Phase 38-D: 보유 종목 compact 1행 (종목당 2줄) */
  .holdRow { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 11px; }
  .holdRowMain { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .holdRowName { color: #0f172a; font-size: 14px; font-weight: 900; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdRowRate { font-size: 14px; font-weight: 950; letter-spacing: -0.02em; white-space: nowrap; }
  .holdRowReason { margin-top: 3px; color: #94a3b8; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdRowSub { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 4px; color: #64748b; font-size: 11px; font-weight: 800; }
  .holdRowSub span { white-space: nowrap; }
  .reasonDetails { margin-top: 6px; }
  .reasonDetailsSummary { cursor: pointer; list-style: none; font-size: 11px; font-weight: 850; color: #64748b; }
  .reasonDetailsSummary::-webkit-details-marker { display: none; }
  .reasonDetailsSummary::before { content: "▸ "; }
  details[open] > .reasonDetailsSummary::before { content: "▾ "; }
  .reasonDetailsList { margin: 6px 0 2px; padding-left: 16px; display: flex; flex-direction: column; gap: 3px; }
  .reasonDetailsList li { color: #475569; font-size: 11px; font-weight: 750; line-height: 1.5; }
  .holdingTableWrap, .candidateTableWrap { width: 100%; max-width: 100%; overflow-x: auto; overflow-y: hidden; border: 1px solid #e2e8f0; border-radius: 16px; }
  .candidateTableWrap { border: none; border-radius: 0; }
  .holdingTable, .candidateTable, .compareTable { width: 100%; border-collapse: collapse; table-layout: auto; }
  .holdingTable { min-width: 1040px; }
  .candidateTable { min-width: 760px; }
  .holdingTable th, .candidateTable th, .compareTable th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 950; text-align: left; padding: 11px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  .holdingTable td, .candidateTable td, .compareTable td { padding: 13px 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; font-weight: 900; white-space: nowrap; }
  .holdingTable td b, .candidateTable td b { display: block; color: #0f172a; font-size: 13px; }
  .holdingTable td span, .candidateTable td span { display: block; color: #64748b; font-size: 11px; margin-top: 3px; }
  .holdingTable td span.holdReasonInline { color: #94a3b8; font-weight: 800; margin-top: 2px; }
  .qualityPill { display: inline-flex !important; border-radius: 999px; padding: 5px 9px; font-size: 12px !important; font-weight: 950; margin-top: 0 !important; }
  .holdingJudgeCell { min-width: 160px; max-width: 240px; }
  .holdingJudgeRow { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .growthLabelTag { display: inline-block; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 950; background: #f0fdf4; color: #047857; border: 1px solid #bbf7d0; white-space: nowrap; }
  .holdReasonList { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
  .holdReasonItem { color: #334155; font-size: 11px; font-weight: 850; line-height: 1.4; white-space: normal; }
  .signalSummaryText { display: block; margin-top: 3px; color: #64748b; font-size: 11px; font-weight: 850; }
  .nextCheckText { display: block; margin-top: 4px; color: #94a3b8; font-size: 10px; font-weight: 850; line-height: 1.4; white-space: normal; }
  .bestHero {
    position: relative;
    background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
    border: 2px solid #bfdbfe;
    border-radius: 14px;
    padding: 11px 14px;
    margin-bottom: 0;
    box-shadow: 0 8px 22px rgba(37, 99, 235, 0.1);
    min-width: 0;
  }
  .bestHeroHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
  .bestHeroTitleRow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-width: 0; }
  .bestHeroBadge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 950; border: 1px solid #fde68a; white-space: nowrap; }
  .bestHeroName { font-size: 21px; font-weight: 950; color: #0f172a; letter-spacing: -0.04em; line-height: 1.1; }
  .bestHeroName em { font-style: normal; margin-left: 8px; color: #64748b; font-size: 14px; font-weight: 900; letter-spacing: 0; }
  .bestHeroMeta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .bestHeroConfidence { display: inline-flex; padding: 5px 11px; border-radius: 999px; background: #dbeafe; color: #1e3a8a; font-size: 12px; font-weight: 950; border: 1px solid #bfdbfe; white-space: nowrap; }
  .bestHeroScore { display: inline-flex; padding: 5px 11px; border-radius: 999px; background: #f3e8ff; color: #6b21a8; font-size: 12px; font-weight: 950; border: 1px solid #e9d5ff; white-space: nowrap; }
  .bestHeroMetricsRow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .bestHeroMetricBadge { display: inline-block; padding: 3px 9px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; color: #334155; font-size: 11px; font-weight: 900; white-space: nowrap; }
  .candidateCardList { display: flex; flex-direction: column; gap: 10px; }
  .candidateCardRow { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 11px 13px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); }
  .candidateCardHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 9px; margin-bottom: 9px; border-bottom: 1px solid #eef2f7; flex-wrap: wrap; }
  .candidateCardLead { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 220px; }
  .candidateCardName { min-width: 0; }
  .candidateCardName b { display: block; color: #0f172a; font-size: 17px; font-weight: 950; line-height: 1.2; letter-spacing: -0.02em; }
  .candidateCardName span { display: block; color: #64748b; font-size: 12px; font-weight: 850; margin-top: 3px; }
  .candidateCardMeta { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .candidateCardMetaItem { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .candidateCardMetaItem span { color: #94a3b8; font-size: 11px; font-weight: 900; }
  .candidateCardMetaItem b { color: #0f172a; font-size: 14px; font-weight: 950; }
  .candidateCardBody { display: flex; flex-direction: column; gap: 7px; white-space: normal; }
  .candidateReasonLine { color: #1e293b; font-size: 13px; font-weight: 900; line-height: 1.45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .candidateDetails { margin-top: 1px; }
  .candidateDetailsSummary { cursor: pointer; color: #64748b; font-size: 12px; font-weight: 900; list-style: none; padding: 2px 0; user-select: none; }
  .candidateDetailsSummary::-webkit-details-marker { display: none; }
  .candidateDetailsSummary::marker { content: ""; }
  .candidateDetailsSummary::before { content: "▸"; display: inline-block; margin-right: 6px; color: #94a3b8; transition: transform 0.18s; }
  .candidateDetails[open] > .candidateDetailsSummary::before { transform: rotate(90deg); }
  .candidateDetails:not([open]) > .candidateDetailsBody { display: none; }
  .candidateDetails[open] > .candidateDetailsBody { display: flex; flex-direction: column; gap: 7px; margin-top: 8px; }
  .candidateFactLine { color: #0f172a; font-size: 14px; font-weight: 950; line-height: 1.5; white-space: normal; letter-spacing: -0.01em; }
  .candidateMetricsRow { display: flex; flex-wrap: wrap; gap: 5px; margin: 1px 0 2px; }
  .candidateMetricBadge { display: inline-block; padding: 3px 9px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 900; line-height: 1.4; white-space: normal; }
  .candidateValuationLine { color: #475569; font-size: 12.5px; font-weight: 850; line-height: 1.55; white-space: normal; }
  .candidateValuationLine b { font-weight: 950; color: #334155; margin-right: 2px; }
  .candidateDecisionLine { color: #1e293b; font-size: 13px; font-weight: 900; line-height: 1.55; white-space: normal; padding: 8px 12px 8px 12px; border-left: 3px solid #2563eb; background: rgba(248, 250, 252, 0.7); border-radius: 0 8px 8px 0; }
  .candidateDecisionLine b { font-weight: 950; margin-right: 4px; }
  .buyTriggerTag { display: inline-block; border-radius: 12px; padding: 3px 9px; font-size: 10px; font-weight: 950; border: 1px solid; white-space: normal; line-height: 1.35; max-width: 100%; margin-bottom: 3px; }
  .riskSummaryLine { color: #dc2626; font-size: 12px; font-weight: 900; line-height: 1.5; white-space: normal; }
  .confidenceLine { color: #64748b; font-size: 11px; font-weight: 900; margin-top: 2px; }
  .emptyHolding, .emptyCell { color: #64748b; font-size: 13px; font-weight: 850; padding: 18px; border: 1px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; }
  .fundStatsRow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
  .miniStat { display: flex; gap: 10px; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; }
  .miniStatIcon { width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 950; }
  .miniStatLabel { color: #64748b; font-size: 12px; font-weight: 900; }
  .miniStatValue { color: #0f172a; font-size: 15px; font-weight: 950; margin-top: 2px; }
  .comparisonSection { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 22px; min-width: 0; }
  .comparisonDetails { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 6px 16px; min-width: 0; }
  .comparisonDetails[open] { padding: 6px 16px 14px; }
  .comparisonDetails > .compareTableCard { margin-top: 10px; box-shadow: none; border: 1px solid #eef2f7; padding: 14px; }
  .comparisonSummary { cursor: pointer; color: #475569; font-size: 13px; font-weight: 950; padding: 8px 0; list-style: none; user-select: none; line-height: 1.5; }
  .comparisonSummary::-webkit-details-marker { display: none; }
  .comparisonSummary::marker { display: none; content: ""; }
  .comparisonSummary::before { content: "▸"; display: inline-block; margin-right: 8px; color: #94a3b8; transition: transform 0.18s; }
  .comparisonDetails[open] > .comparisonSummary::before { transform: rotate(90deg); }
  .chartCard, .compareTableCard, .candidateCard, .philosophyBox, .systemBox, .actionPanel { min-width: 0; max-width: 100%; overflow: hidden; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04); }
  .sectionTitle { font-size: 16px; font-weight: 950; color: #0f172a; margin-bottom: 8px; }
  .chartTitle { color: #334155; font-size: 13px; font-weight: 950; margin-bottom: 6px; }
  .lineChart { width: 100%; height: 160px; display: block; }
  .compareTable th, .compareTable td { text-align: center; }
  .compareTable th:first-child, .compareTable td:first-child { text-align: left; color: #475569; }
  .candidatesGrid { display: grid; grid-template-columns: 1fr; gap: 22px; margin-bottom: 0; min-width: 0; }
  .portfolioStateBanner {
    border: 1px solid;
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
    min-width: 0;
    max-width: 100%;
  }
  .portfolioStateRow {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .portfolioHealthChip {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 950;
    white-space: nowrap;
  }
  .portfolioHealthChip--healthy {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  .portfolioHealthChip--watch {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  .portfolioStateTitleText {
    font-size: 14px;
    font-weight: 950;
    letter-spacing: -0.01em;
    min-width: 0;
  }
  .portfolioStateText {
    color: #475569;
    font-size: 12.5px;
    font-weight: 850;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .portfolioStateTagRow {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .portfolioStateTag {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
  }
  .portfolioDriftRow {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    padding-top: 8px;
    margin-top: 2px;
    border-top: 1px dashed #cbd5e1;
    min-width: 0;
    flex-wrap: wrap;
  }
  .portfolioDriftLabel {
    color: #64748b;
    font-size: 11px;
    font-weight: 950;
    white-space: nowrap;
    padding-top: 1px;
  }
  .portfolioDriftText {
    color: #475569;
    font-size: 12px;
    font-weight: 850;
    line-height: 1.5;
    overflow-wrap: anywhere;
    flex: 1 1 0;
    min-width: 0;
  }
  .portfolioActionRow {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    padding-top: 6px;
    margin-top: 2px;
    min-width: 0;
    flex-wrap: wrap;
  }
  .portfolioActionLabel {
    font-size: 11px;
    font-weight: 950;
    white-space: nowrap;
    padding-top: 1px;
    letter-spacing: -0.01em;
  }
  .portfolioActionText {
    color: #475569;
    font-size: 12px;
    font-weight: 850;
    line-height: 1.5;
    overflow-wrap: anywhere;
    flex: 1 1 0;
    min-width: 0;
  }
  .portfolioActionTagRow {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    min-width: 0;
    margin-top: 2px;
  }
  .portfolioActionTag {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
  }
  .dashboardGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 22px;
    margin-bottom: 22px;
    min-width: 0;
    align-items: start;
  }
  .dashboardCol {
    display: flex;
    flex-direction: column;
    gap: 22px;
    min-width: 0;
    max-width: 100%;
  }
  @media (min-width: 1180px) {
    .dashboardGrid {
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    }
  }
  .candidateHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .candidateHeader h3 { margin: 0; font-size: 20px; font-weight: 950; }
  .candidateHeader p { margin: 5px 0 0; color: #64748b; font-size: 13px; font-weight: 850; }
  .rankCircle { display: inline-flex !important; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; font-weight: 950; margin: 0 !important; }
  .stars { color: #f59e0b !important; font-size: 15px !important; letter-spacing: 1px; margin: 0 !important; }
  .bottomGrid { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 18px; margin-bottom: 18px; min-width: 0; }
  .operationDetails { margin-top: 12px; margin-bottom: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 6px 16px; }
  .operationDetails[open] { padding: 6px 16px 14px; }
  .operationDetails > .actionPanel { margin-top: 10px; margin-bottom: 10px; box-shadow: none; border: 1px solid #eef2f7; }
  .operationSummary { cursor: pointer; color: #475569; font-size: 13px; font-weight: 950; padding: 8px 0; list-style: none; user-select: none; line-height: 1.5; }
  .operationSummary::-webkit-details-marker { display: none; }
  .operationSummary::marker { display: none; content: ""; }
  .operationSummary::before { content: "▸"; display: inline-block; margin-right: 8px; color: #94a3b8; transition: transform 0.18s; }
  .operationDetails[open] > .operationSummary::before { transform: rotate(90deg); }
  .philosophyDetails { margin-bottom: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 6px 16px; }
  .philosophyDetails[open] { padding: 6px 16px 14px; }
  .philosophyDetails > .bottomGrid { margin-top: 10px; margin-bottom: 0; }
  .philosophySummary { cursor: pointer; color: #475569; font-size: 14px; font-weight: 950; padding: 8px 0; list-style: none; user-select: none; }
  .philosophySummary::-webkit-details-marker { display: none; }
  .philosophySummary::marker { display: none; content: ""; }
  .philosophySummary::before { content: "▸"; display: inline-block; margin-right: 8px; color: #94a3b8; transition: transform 0.18s; }
  .philosophyDetails[open] > .philosophySummary::before { transform: rotate(90deg); }
  .philosophyBox { background: linear-gradient(135deg, #fffbeb 0%, #fff 100%); border-color: #fde68a; }
  .philosophyColumns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .philosophyColumns h4 { margin: 0 0 8px; font-size: 15px; font-weight: 950; }
  .philosophyColumns p { margin: 6px 0; color: #334155; font-size: 13px; font-weight: 850; line-height: 1.4; }
  .systemBox { background: #fff; }
  .checkLine { color: #059669; font-size: 13px; font-weight: 950; margin: 10px 0; }
  .actionPanel { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 14px; }
  .actionPanel p { margin: 0; color: #64748b; font-size: 13px; font-weight: 850; line-height: 1.5; }
  .actionPanelButtons { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .actionPanelButtons a { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; border-radius: 10px; border: 1px solid #bfdbfe; color: #172554; background: #fff; text-decoration: none; padding: 0 12px; font-size: 12px; font-weight: 950; }
  .compactPanel { background: #fff; border: 1px solid #dbeafe; border-radius: 12px; padding: 4px; }
  .compactPanel * { font-size: 11px !important; line-height: 1.1 !important; }
  .compactPanel h1, .compactPanel h2, .compactPanel h3 { display: none !important; }
  .compactPanel button { height: 30px !important; min-height: 30px !important; border-radius: 9px !important; font-size: 11px !important; font-weight: 950 !important; }
  @media (max-width: 1180px) {
    .globalSummary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .fundsGrid, .comparisonSection, .candidatesGrid { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .dashboardRoot { padding: 0 12px 24px; }
    .holdStrip { grid-template-columns: 1fr; }
    .topBar { grid-template-columns: 1fr; height: auto; gap: 8px; padding: 9px 0; }
    nav { justify-content: flex-start; gap: 16px; height: auto; overflow-x: auto; }
    nav a { padding: 4px 0; }
    .topStatus { justify-content: flex-start; }
    .globalSummary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fundTopGrid { grid-template-columns: 1fr; }
    .fundStatsRow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .bottomGrid { grid-template-columns: 1fr; }
    .philosophyColumns { grid-template-columns: 1fr; }
    .actionPanel { flex-direction: column; align-items: flex-start; }
    .bestHero { padding: 11px 13px; margin-bottom: 0; }
    .bestHeroHeader { margin-bottom: 7px; }
    .bestHeroName { font-size: 19px; }
    .bestHeroReason { font-size: 13px; }
    .bestHeroMetricsRow { gap: 5px; }
    .holdingTableWrap { display: none; }
    .holdingCardList { display: flex; flex-direction: column; gap: 6px; }
    .candidateCardRow { padding: 12px 13px; }
    .candidateCardHeader { align-items: center; gap: 10px; padding-bottom: 10px; margin-bottom: 10px; }
    .candidateCardLead { flex: 1 1 auto; gap: 10px; }
    .candidateCardName b { font-size: 16px; }
    .candidateCardMeta { gap: 10px; }
    .candidateCardMetaItem b { font-size: 13px; }
    .candidateCardBody { gap: 6px; }
  }
  @media (max-width: 560px) {
    .globalSummary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .metricPair { grid-template-columns: 1fr; }
    .fundStatsRow { grid-template-columns: 1fr; }
    .candidateHeader { flex-direction: column; }
    .fundCoreGrid { grid-template-columns: 1fr; }
    .fundCoreItem { border-left: none; padding: 8px 0; border-top: 1px solid #e2e8f0; }
    .fundCoreItem:first-child { border-top: none; padding-top: 0; }
    .fundCoreItem:last-child { padding-bottom: 0; }
  }
`;

export function DashboardStyles() {
  return <style>{dashboardCss}</style>;
}

export {
  WABABA_THEME,
  AI_THEME,
  readRecommendationHistory,
  buildWababaCandidates,
  buildAiCandidates,
  formatShortDate,
  BestPickHero,
  GlobalSummary,
  CandidateSection,
  FundCard,
  ComparisonSection,
  PhilosophySection,
  DashboardHoldings,
  DashboardSold,
  dashboardCss,
};
