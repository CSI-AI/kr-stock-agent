import { ScrollRestore } from "./_components/ScrollRestore";
import { WababaRunPanel } from "./_components/WababaRunPanel";
import { WababaAutoDailyPanel } from "./_components/WababaAutoDailyPanel";
import { PriceRefreshButton } from "./_components/PriceRefreshButton";

import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_ROOT_DIR = "C:\\work\\kr-stock-agent-data-new";
const RECOMMENDATION_HISTORY_PATH = path.join(
  DATA_ROOT_DIR,
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

function readRecommendationHistory(): AnyRecord {
  try {
    const parsed = JSON.parse(
      fs.readFileSync(RECOMMENDATION_HISTORY_PATH, "utf-8"),
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return parsed as AnyRecord;
  } catch {
    return {};
  }
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

function FundCard({
  history,
  theme,
}: {
  history: AnyRecord;
  theme: FundTheme;
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

      <div
        className="memoBox"
        style={{
          background: `linear-gradient(135deg, ${theme.soft} 0%, #ffffff 100%)`,
          borderColor: theme.border,
        }}
      >
        <div className="memoTitle" style={{ color: theme.primary }}>
          오늘의 운용 메모
        </div>
        <div className="memoLines">
          {memoLines.slice(0, 4).map((line, index) => (
            <div key={`${theme.key}-memo-${line}-${index}`}>· {line}</div>
          ))}
        </div>
        {topReview ? (
          <div className="reviewHint">
            {getName(topReview)} ·{" "}
            {getString(topReview.actionLabel) ||
              getString(topReview.action) ||
              "보유 점검"}
          </div>
        ) : null}
      </div>

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
          <div key={r.key} className="holdingCard">
            <div className="holdingCardHeader">
              <div className="holdingCardName">
                <b>{r.name}</b>
                <span>{r.code}</span>
              </div>
              <div className="holdingCardProfit">
                <div
                  className="holdingCardProfitRate"
                  style={{ color: toneColor(r.profitRate) }}
                >
                  {formatPercent(r.profitRate)}
                </div>
                <div
                  className="holdingCardProfitAmount"
                  style={{ color: toneColor(r.profitAmount) }}
                >
                  {formatKrw(r.profitAmount)}
                </div>
              </div>
            </div>
            <div className="holdingCardRow">
              <div className="holdingCardField">
                <span>수량</span>
                <b>{formatNumber(r.quantity, 0)}주</b>
              </div>
              <div className="holdingCardField">
                <span>평균단가</span>
                <b>{formatKrw(r.buyPrice)}</b>
              </div>
              <div className="holdingCardField">
                <span>현재가</span>
                <b>{formatKrw(r.currentPrice)}</b>
              </div>
            </div>
            <div className="holdingCardRow">
              <div className="holdingCardField">
                <span>평가금액</span>
                <b>{formatKrw(r.evalAmount)}</b>
              </div>
              <div className="holdingCardField">
                <span>비중</span>
                <b>{formatPercent(r.weight, 1)}</b>
              </div>
              <div className="holdingCardField">
                <span>보유기간</span>
                <b>{r.holdingDays}</b>
              </div>
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

function BestPickHero({ history }: { history: AnyRecord }) {
  const finalBest = getObject(history.finalBestPick);
  if (Object.keys(finalBest).length === 0) return null;

  const name = getName(finalBest);
  const code = getCode(finalBest);
  const investmentReport = getObject(finalBest.investmentReport);
  const decisionEngine = getObject(finalBest.decisionEngine);
  const headline =
    getString(investmentReport.fact) ||
    getString(finalBest.companySummary) ||
    getString(finalBest.growthStory) ||
    getString(finalBest.rankReason) ||
    "성장성과 밸류를 함께 점검";
  const whyText =
    getString(investmentReport.decision) ||
    getString(investmentReport.businessImpact);
  const valuationText = getString(investmentReport.valuation);
  const riskSummary = getString(finalBest.riskSummary);
  const buyTrigger = getString(decisionEngine.buyTrigger);
  const confidence = getNumber(decisionEngine.confidence);
  const score =
    getNumber(finalBest.aiFundScore) ??
    getNumber(finalBest.finalBestScore) ??
    getNumber(finalBest.score);
  const per = getNumber(finalBest.per) ?? getNumber(finalBest.PER);
  const pbr = getNumber(finalBest.pbr) ?? getNumber(finalBest.PBR);
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

      <div className="bestHeroHeadline">
        {headline.length > 110 ? `${headline.slice(0, 110)}…` : headline}
      </div>

      {whyText ? (
        <div className="bestHeroWhy">
          <b>왜 지금</b>{" "}
          {whyText.length > 130 ? `${whyText.slice(0, 130)}…` : whyText}
        </div>
      ) : null}

      <div className="bestHeroSubRow">
        {valuationText ? (
          <div className="bestHeroValuation">
            <b>밸류</b>{" "}
            {valuationText.length > 90
              ? `${valuationText.slice(0, 90)}…`
              : valuationText}
          </div>
        ) : null}
        {riskSummary ? (
          <div className="bestHeroRisk">
            ⚠ {riskSummary.length > 70 ? `${riskSummary.slice(0, 70)}…` : riskSummary}
          </div>
        ) : null}
      </div>

      <div className="bestHeroMetricsRow">
        {buyTrigger ? (
          <span className="bestHeroBuyTrigger">
            {buyTrigger.length > 30 ? `${buyTrigger.slice(0, 30)}…` : buyTrigger}
          </span>
        ) : null}
        {per !== null ? (
          <span className="bestHeroMetricBadge">PER {formatNumber(per, 1)}배</span>
        ) : null}
        {pbr !== null ? (
          <span className="bestHeroMetricBadge">PBR {formatNumber(pbr, 1)}배</span>
        ) : null}
        {roe !== null ? (
          <span className="bestHeroMetricBadge">ROE {formatPercent(roe, 1)}</span>
        ) : null}
      </div>
    </section>
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
          const score =
            getNumber(item.aiFundScore) ??
            getNumber(item.finalBestScore) ??
            getNumber(item.score) ??
            0;
          const stars = Math.max(3, Math.min(5, Math.round(score / 20)));
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
                  <span className="stars">
                    {"★".repeat(stars)}
                    {"☆".repeat(5 - stars)}
                  </span>
                </div>
              </div>
              <div className="candidateCardBody">
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
                  </div>
                ) : null}
                {buyTrigger ? (
                  <span
                    className="buyTriggerTag"
                    style={{
                      background: theme.soft,
                      color: theme.primary,
                      borderColor: theme.border,
                    }}
                  >
                    {buyTrigger}
                  </span>
                ) : null}
                {confidence !== null ? (
                  <div className="confidenceLine">신뢰도 {confidence}%</div>
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
            <p>AI가 시장 데이터를 실시간 분석해 최적 의사결정</p>
            <p>모멘텀, 성장성, 밸류에이션 자동 평가</p>
            <p>유연한 포지션 조절로 최대 수익 추구</p>
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

function TopBar({ history }: { history: AnyRecord }) {
  return (
    <header className="topBar">
      <div className="brand">
        <span>W</span> 와바바 투자 에이전트
      </div>
      <nav>
        <a>대시보드</a>
        <a className="active">전략랩</a>
        <a>시장분석</a>
        <a>뉴스</a>
        <a>성과분석</a>
        <a>설정</a>
      </nav>
      <div className="topStatus">
        <span className="autoOn">● 자동운용 ON</span>
        <span>마지막 업데이트: {formatShortDate(history.generatedAt)}</span>
      </div>
    </header>
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
        label="오늘 자동운용"
        value="완료"
        sub={formatShortDate(history.baseDate)}
        tone="#059669"
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

export default async function StrategyLabPage() {
  const history = readRecommendationHistory();
  const wababaCandidates = buildWababaCandidates(history);
  const aiCandidates = buildAiCandidates(history);

  return (
    <main className="dashboardRoot">
      <ScrollRestore />
      <style>{dashboardCss}</style>
      <TopBar history={history} />
      <BestPickHero history={history} />

      <section className="candidatesGrid">
        <CandidateSection
          title="오늘의 매수 후보 TOP 5"
          subtitle="와바바 가치투자 기준"
          items={wababaCandidates}
          theme={WABABA_THEME}
        />
        <CandidateSection
          title="AI 발굴 유망 종목 TOP 5"
          subtitle="와바바AI 자율운용 기준"
          items={aiCandidates}
          theme={AI_THEME}
        />
      </section>

      <GlobalSummary history={history} />

      <section className="fundsGrid">
        <FundCard history={history} theme={WABABA_THEME} />
        <FundCard history={history} theme={AI_THEME} />
      </section>

      <ComparisonSection history={history} />

      <PhilosophySection />

      <section className="actionPanel">
        <div>
          <div className="sectionTitle">운용 실행</div>
          <p>
            두 펀드 자동운용은 같은 API에서 함께 실행됩니다. 오늘 데이터 생성은
            분석을 갱신하고, 자동운용은 날짜별 락으로 중복매수를 막습니다.
          </p>
        </div>
        <div className="actionPanelButtons">
          <div className="compactPanel">
            <WababaRunPanel />
          </div>
          <PriceRefreshButton />
          <a href="/strategy-lab/reviewed">넘긴 종목</a>
        </div>
      </section>

      <WababaAutoDailyPanel />
    </main>
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
    max-width: 1480px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #f8fafc;
    color: #0f172a;
    font-family: Arial, sans-serif;
    padding: 0 24px 28px;
  }
  .topBar {
    height: 64px;
    display: grid;
    grid-template-columns: 260px 1fr 330px;
    align-items: center;
    gap: 18px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 18px;
  }
  .brand {
    font-size: 20px;
    font-weight: 950;
    color: #1e3a8a;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #fff;
    font-size: 22px;
    font-weight: 950;
  }
  nav { display: flex; justify-content: center; gap: 34px; }
  nav a { color: #334155; font-size: 15px; font-weight: 900; text-decoration: none; padding: 22px 0 18px; }
  nav a.active { color: #2563eb; border-bottom: 3px solid #2563eb; }
  .topStatus { display: flex; justify-content: flex-end; align-items: center; gap: 16px; color: #64748b; font-size: 13px; font-weight: 850; }
  .autoOn { color: #059669; font-weight: 950; }
  .globalSummary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
    min-width: 0;
  }
  .smallMetricCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px 18px;
    min-height: 104px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  }
  .smallMetricLabel { color: #475569; font-size: 13px; font-weight: 900; margin-bottom: 11px; }
  .smallMetricValue { font-size: 24px; font-weight: 950; letter-spacing: -0.04em; }
  .smallMetricSub { margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 850; }
  .fundsGrid { display: grid; grid-template-columns: 1fr; gap: 22px; margin-bottom: 22px; min-width: 0; }
  .fundCard {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    background: #fff;
    border: 2px solid;
    border-radius: 22px;
    padding: 18px;
  }
  .fundCardHeader { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
  .fundTitleRow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fundIcon { width: 36px; height: 36px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 950; }
  h2 { margin: 0; font-size: 25px; line-height: 1; letter-spacing: -0.04em; }
  .pill, .statusPill { border: 1px solid; border-radius: 999px; padding: 6px 11px; font-size: 12px; font-weight: 950; white-space: nowrap; }
  .statusPill { border-color: #86efac; background: #f0fdf4; color: #047857; }
  .fundTopGrid { display: grid; grid-template-columns: minmax(0, 1fr) 130px; gap: 16px; align-items: center; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #fbfdff; min-width: 0; }
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
  .memoBox { margin-top: 14px; border: 1px solid; border-radius: 18px; padding: 16px; min-height: 142px; }
  .memoTitle { font-size: 15px; font-weight: 950; margin-bottom: 10px; }
  .memoLines { display: grid; gap: 7px; color: #334155; font-size: 13px; font-weight: 850; line-height: 1.45; }
  .reviewHint { margin-top: 10px; color: #64748b; font-size: 12px; font-weight: 900; }
  .holdingHeader { margin: 18px 0 10px; }
  .holdingHeader h3 { margin: 0; font-size: 18px; font-weight: 950; }
  .holdingHeader span { color: #2563eb; }
  .holdingCardList { display: none; }
  .holdingCard { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 13px; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.03); }
  .holdingCardHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px; padding-bottom: 9px; border-bottom: 1px solid #eef2f7; }
  .holdingCardName b { display: block; color: #0f172a; font-size: 15px; font-weight: 950; line-height: 1.2; }
  .holdingCardName span { display: block; color: #64748b; font-size: 11px; font-weight: 850; margin-top: 2px; }
  .holdingCardProfit { text-align: right; min-width: 0; }
  .holdingCardProfitRate { font-size: 16px; font-weight: 950; letter-spacing: -0.02em; line-height: 1.2; }
  .holdingCardProfitAmount { font-size: 12px; font-weight: 900; margin-top: 2px; }
  .holdingCardRow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px; margin-bottom: 6px; }
  .holdingCardRow:last-child { margin-bottom: 0; }
  .holdingCardField { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .holdingCardField span { color: #94a3b8; font-size: 10px; font-weight: 900; }
  .holdingCardField b { color: #0f172a; font-size: 12px; font-weight: 950; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .holdingTableWrap, .candidateTableWrap { width: 100%; max-width: 100%; overflow-x: auto; overflow-y: hidden; border: 1px solid #e2e8f0; border-radius: 16px; }
  .candidateTableWrap { border: none; border-radius: 0; }
  .holdingTable, .candidateTable, .compareTable { width: 100%; border-collapse: collapse; table-layout: auto; }
  .holdingTable { min-width: 1040px; }
  .candidateTable { min-width: 760px; }
  .holdingTable th, .candidateTable th, .compareTable th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 950; text-align: left; padding: 11px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  .holdingTable td, .candidateTable td, .compareTable td { padding: 13px 12px; border-bottom: 1px solid #eef2f7; font-size: 13px; font-weight: 900; white-space: nowrap; }
  .holdingTable td b, .candidateTable td b { display: block; color: #0f172a; font-size: 13px; }
  .holdingTable td span, .candidateTable td span { display: block; color: #64748b; font-size: 11px; margin-top: 3px; }
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
    border-radius: 22px;
    padding: 20px 22px;
    margin-bottom: 18px;
    box-shadow: 0 14px 38px rgba(37, 99, 235, 0.12);
    min-width: 0;
  }
  .bestHeroHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .bestHeroTitleRow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-width: 0; }
  .bestHeroBadge { display: inline-flex; align-items: center; gap: 4px; padding: 5px 11px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 950; border: 1px solid #fde68a; white-space: nowrap; }
  .bestHeroName { font-size: 26px; font-weight: 950; color: #0f172a; letter-spacing: -0.04em; line-height: 1.1; }
  .bestHeroName em { font-style: normal; margin-left: 8px; color: #64748b; font-size: 14px; font-weight: 900; letter-spacing: 0; }
  .bestHeroMeta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .bestHeroConfidence { display: inline-flex; padding: 5px 11px; border-radius: 999px; background: #dbeafe; color: #1e3a8a; font-size: 12px; font-weight: 950; border: 1px solid #bfdbfe; white-space: nowrap; }
  .bestHeroScore { display: inline-flex; padding: 5px 11px; border-radius: 999px; background: #f3e8ff; color: #6b21a8; font-size: 12px; font-weight: 950; border: 1px solid #e9d5ff; white-space: nowrap; }
  .bestHeroHeadline { color: #0f172a; font-size: 17px; font-weight: 950; line-height: 1.45; letter-spacing: -0.01em; margin-bottom: 12px; white-space: normal; }
  .bestHeroWhy { color: #1e293b; font-size: 13px; font-weight: 900; line-height: 1.5; padding: 9px 12px; border-left: 4px solid #2563eb; background: rgba(255, 255, 255, 0.72); border-radius: 0 10px 10px 0; margin-bottom: 10px; white-space: normal; }
  .bestHeroWhy b { font-weight: 950; color: #2563eb; margin-right: 5px; }
  .bestHeroSubRow { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
  .bestHeroValuation { color: #475569; font-size: 12px; font-weight: 850; line-height: 1.5; white-space: normal; flex: 1 1 280px; min-width: 0; }
  .bestHeroValuation b { font-weight: 950; color: #334155; margin-right: 4px; }
  .bestHeroRisk { color: #b91c1c; font-size: 12px; font-weight: 900; line-height: 1.5; white-space: normal; flex: 0 1 320px; min-width: 0; }
  .bestHeroMetricsRow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .bestHeroMetricBadge { display: inline-block; padding: 3px 9px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; color: #334155; font-size: 11px; font-weight: 900; white-space: nowrap; }
  .bestHeroBuyTrigger { display: inline-block; padding: 4px 11px; border-radius: 12px; background: #2563eb; color: #fff; font-size: 11px; font-weight: 950; white-space: normal; line-height: 1.35; max-width: 100%; }
  .candidateCardList { display: flex; flex-direction: column; gap: 14px; }
  .candidateCardRow { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); }
  .candidateCardHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #eef2f7; flex-wrap: wrap; }
  .candidateCardLead { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 220px; }
  .candidateCardName { min-width: 0; }
  .candidateCardName b { display: block; color: #0f172a; font-size: 17px; font-weight: 950; line-height: 1.2; letter-spacing: -0.02em; }
  .candidateCardName span { display: block; color: #64748b; font-size: 12px; font-weight: 850; margin-top: 3px; }
  .candidateCardMeta { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .candidateCardMetaItem { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .candidateCardMetaItem span { color: #94a3b8; font-size: 11px; font-weight: 900; }
  .candidateCardMetaItem b { color: #0f172a; font-size: 14px; font-weight: 950; }
  .candidateCardBody { display: flex; flex-direction: column; gap: 8px; white-space: normal; }
  .candidateFactLine { color: #0f172a; font-size: 14px; font-weight: 950; line-height: 1.5; white-space: normal; letter-spacing: -0.01em; }
  .candidateMetricsRow { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 2px; }
  .candidateMetricBadge { display: inline-block; padding: 3px 9px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 900; line-height: 1.4; white-space: normal; }
  .candidateValuationLine { color: #475569; font-size: 12.5px; font-weight: 850; line-height: 1.55; white-space: normal; }
  .candidateValuationLine b { font-weight: 950; color: #334155; margin-right: 2px; }
  .candidateDecisionLine { color: #1e293b; font-size: 13px; font-weight: 900; line-height: 1.55; white-space: normal; padding: 8px 12px 8px 12px; border-left: 3px solid #2563eb; background: rgba(248, 250, 252, 0.7); border-radius: 0 8px 8px 0; }
  .candidateDecisionLine b { font-weight: 950; margin-right: 4px; }
  .buyTriggerTag { display: inline-block; border-radius: 12px; padding: 3px 9px; font-size: 10px; font-weight: 950; border: 1px solid; white-space: normal; line-height: 1.35; max-width: 100%; margin-bottom: 3px; }
  .riskSummaryLine { color: #dc2626; font-size: 12px; font-weight: 900; line-height: 1.5; white-space: normal; }
  .confidenceLine { color: #64748b; font-size: 11px; font-weight: 900; margin-top: 2px; }
  .emptyHolding, .emptyCell { color: #64748b; font-size: 13px; font-weight: 850; padding: 18px; border: 1px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; }
  .fundStatsRow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
  .miniStat { display: flex; gap: 10px; align-items: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 15px; background: #fff; }
  .miniStatIcon { width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 950; }
  .miniStatLabel { color: #64748b; font-size: 12px; font-weight: 900; }
  .miniStatValue { color: #0f172a; font-size: 15px; font-weight: 950; margin-top: 2px; }
  .comparisonSection { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 22px; min-width: 0; }
  .chartCard, .compareTableCard, .candidateCard, .philosophyBox, .systemBox, .actionPanel { min-width: 0; max-width: 100%; overflow: hidden; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04); }
  .sectionTitle { font-size: 18px; font-weight: 950; color: #0f172a; margin-bottom: 12px; }
  .chartTitle { color: #334155; font-size: 14px; font-weight: 950; margin-bottom: 10px; }
  .lineChart { width: 100%; height: 240px; display: block; }
  .compareTable th, .compareTable td { text-align: center; }
  .compareTable th:first-child, .compareTable td:first-child { text-align: left; color: #475569; }
  .candidatesGrid { display: grid; grid-template-columns: 1fr; gap: 22px; margin-bottom: 22px; min-width: 0; }
  .candidateHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .candidateHeader h3 { margin: 0; font-size: 20px; font-weight: 950; }
  .candidateHeader p { margin: 5px 0 0; color: #64748b; font-size: 13px; font-weight: 850; }
  .rankCircle { display: inline-flex !important; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; font-weight: 950; margin: 0 !important; }
  .stars { color: #f59e0b !important; font-size: 15px !important; letter-spacing: 1px; margin: 0 !important; }
  .bottomGrid { display: grid; grid-template-columns: minmax(0, 1fr) 270px; gap: 18px; margin-bottom: 18px; min-width: 0; }
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
    .topBar { grid-template-columns: 1fr; height: auto; padding: 14px 0; }
    nav { justify-content: flex-start; gap: 14px; overflow-x: auto; }
    .topStatus { justify-content: flex-start; }
    .globalSummary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fundTopGrid { grid-template-columns: 1fr; }
    .fundStatsRow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .bottomGrid { grid-template-columns: 1fr; }
    .philosophyColumns { grid-template-columns: 1fr; }
    .actionPanel { flex-direction: column; align-items: flex-start; }
    .bestHero { padding: 16px 14px; }
    .bestHeroName { font-size: 22px; }
    .bestHeroHeadline { font-size: 15px; }
    .bestHeroSubRow { flex-direction: column; gap: 8px; }
    .holdingTableWrap { display: none; }
    .holdingCardList { display: flex; flex-direction: column; gap: 10px; }
    .candidateCardHeader { flex-direction: column; align-items: stretch; gap: 10px; }
    .candidateCardMeta { gap: 14px; }
  }
  @media (max-width: 560px) {
    .globalSummary { grid-template-columns: 1fr; }
    .metricPair { grid-template-columns: 1fr; }
    .fundStatsRow { grid-template-columns: 1fr; }
    .candidateHeader { flex-direction: column; }
    .fundCoreGrid { grid-template-columns: 1fr; }
    .fundCoreItem { border-left: none; padding: 8px 0; border-top: 1px solid #e2e8f0; }
    .fundCoreItem:first-child { border-top: none; padding-top: 0; }
    .fundCoreItem:last-child { padding-bottom: 0; }
    .holdingCardRow { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
`;
