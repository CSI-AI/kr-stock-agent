import { scoreStocks } from "@/lib/scoring/financial-score-engine";
import { loadFinancialUniverse } from "@/lib/data/load-financial-universe";
import {
  MOCK_PORTFOLIO_HOLDINGS,
  MOCK_SELL_CANDIDATES,
  type MockHoldingItem,
  type MockSellCandidate,
} from "@/lib/mock/mock-portfolio";
import {
  MOCK_PREVIOUS_TOP10,
  MOCK_PUBLISHED_PORTFOLIO,
  MOCK_LIVE_PORTFOLIO_SNAPSHOT,
  MOCK_DAILY_ASSET_HISTORY,
  MOCK_TRADE_HISTORY,
  type MockPublishedPortfolioPosition,
  type MockLivePortfolioHolding,
  type MockDailyAssetPoint,
  type MockTradeHistoryItem,
} from "@/lib/mock/mock-daily-snapshot";
import type {
  ScoredStockResult,
  StockRecommendationRationale,
} from "@/types/financial";
import {
  createDefaultScoreWeightSet,
  createDefaultStockFilterSet,
  type ScoreWeightSet,
  type StockFilterSet,
} from "@/types/filters";

export type StrategyStockGrade = "S" | "A" | "B" | "C";

export type StrategyPrioritySignal =
  | "STRONG_BUY"
  | "BUY_CANDIDATE"
  | "WATCH"
  | "EXCLUDE";

export type StrategyAgentAction = "BUY" | "HOLD" | "EXCLUDE";

export type StrategyScoredStockResult = ScoredStockResult & {
  grade: StrategyStockGrade;
  prioritySignal: StrategyPrioritySignal;
  gradeReason: string;
  recommendationRationale: StockRecommendationRationale;
};

export type StrategyHoldingAnalysisItem = MockHoldingItem & {
  inTop10: boolean;
  matchedTop10Rank: number | null;
  matchedTop10Score: number | null;
  matchedTop10Grade: StrategyStockGrade | null;
  matchedDecision: ScoredStockResult["decision"] | null;
  matchedDecisionReason: string | null;
  engineSignal: "PROMOTE" | "KEEP" | "REVIEW";
};

export type StrategySellCandidateAnalysisItem = MockSellCandidate & {
  inTop10: boolean;
  matchedTop10Rank: number | null;
  matchedTop10Score: number | null;
  matchedTop10Grade: StrategyStockGrade | null;
  conflictWithTop10: boolean;
};

export type StrategyPortfolioSummary = {
  totalInvestment: number;
  evaluationAmount: number;
  unrealizedProfit: number;
  totalAfterTaxProfit: number;
  totalDividendIncome: number;
  combinedAfterTaxAndDividend: number;
  holdingCount: number;
  sellCandidateCount: number;
};

export type StrategyDailyRecommendationItem = {
  rank: number;
  code: string;
  name: string;
  market: string;
  industry: string;
  currentPrice: number;
  totalScore: number;
  grade: StrategyStockGrade;
  prioritySignal: StrategyPrioritySignal;
  decision: "BUY" | "HOLD" | "SELL";
  decisionReason: string;
  gradeReason: string;
  hypothesis: string;
  evidence: string[];
  risk: string[];
  invalidation: string[];
  recommendationLabel: "오늘의 1순위" | "오늘의 2순위" | "오늘의 3순위";
  agentAction: StrategyAgentAction;
  agentActionLabel: "매수 검토" | "보유 관찰" | "제외";
  agentDecisionReason: string;
  recommendationReasonShort: string;
  riskShort: string;
  whyTodayShort: string;
};

export type StrategyPublishedPortfolioItem = MockPublishedPortfolioPosition & {
  unrealizedReturnPercent: number;
};

export type StrategyLiveHoldingItem = MockLivePortfolioHolding & {
  investedAmount: number;
  evaluationAmount: number;
  unrealizedProfit: number;
  unrealizedReturnPercent: number;
  weightPercent: number;
};

export type StrategyLivePortfolioSummary = {
  startedAt: string;
  initialCapital: number;
  cash: number;
  investedAmount: number;
  evaluationAmount: number;
  totalAsset: number;
  cumulativeProfit: number;
  cumulativeReturnPercent: number;
  holdingCount: number;
};

export type StrategyTradeInstruction = {
  type: "BUY" | "SELL";
  code: string;
  name: string;
  currentPrice: number;
  reason: string;
};

export type StrategyTradeHistoryItem = MockTradeHistoryItem;

export type StrategyTradeHistorySummary = {
  buyCount: number;
  sellCount: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  latestTradeDate: string;
};

export type StrategyAssetHistoryPoint = {
  date: string;
  totalAsset: number;
  cumulativeReturnPercent: number;
};

export type StrategyAssetChartSummary = {
  firstDate: string;
  lastDate: string;
  startAsset: number;
  latestAsset: number;
  highAsset: number;
  lowAsset: number;
  dayChangeAmount: number;
  dayChangePercent: number;
  oneWeekChangeAmount: number;
  oneWeekChangePercent: number;
  oneMonthChangeAmount: number;
  oneMonthChangePercent: number;
};

export type StrategyActionType = "BUY" | "HOLD" | "SELL" | "CHECK";

export type StrategyActionBoardItem = {
  type: StrategyActionType;
  code: string;
  name: string;
  subtitle: string;
  reason: string;
  priority: number;
};

export type StrategyActionBoard = {
  buy: StrategyActionBoardItem[];
  hold: StrategyActionBoardItem[];
  sell: StrategyActionBoardItem[];
  check: StrategyActionBoardItem[];
};

export type StrategyOperationSummary = {
  todayPickCount: number;
  todayBuyCount: number;
  todayHoldCount: number;
  todaySellCount: number;
  holdingActionCounts: {
    addBuy: number;
    hold: number;
    partialSell: number;
    fullSell: number;
    watch: number;
  };
  publicPortfolioCount: number;
};

export type StrategyResultSummary = {
  avgScoreTop10: number;
  buyCount: number;
  holdCount: number;
  sellCount: number;
  filteredUniverseCount: number;
  holdingIncludedInTop10Count: number;
  newEntryCount: number;
  exitedCount: number;
  sellConflictCount: number;
  gradeCounts: {
    s: number;
    a: number;
    b: number;
    c: number;
  };
};

export type StrategyDataStatus = {
  source: "mock" | "real";
  requestedSource: "mock" | "real";
  usedFallback: boolean;
  message: string;
};

export type StrategyResult = {
  scoredUniverse: StrategyScoredStockResult[];
  top10: StrategyScoredStockResult[];
  dailyRecommended: StrategyDailyRecommendationItem[];
  newEntries: StrategyScoredStockResult[];
  exited: StrategyScoredStockResult[];
  holdingsAnalysis: StrategyHoldingAnalysisItem[];
  sellCandidates: StrategySellCandidateAnalysisItem[];
  publishedPortfolio: StrategyPublishedPortfolioItem[];
  livePortfolioHoldings: StrategyLiveHoldingItem[];
  livePortfolioSummary: StrategyLivePortfolioSummary;
  todayTradePlan: StrategyTradeInstruction[];
  tradeHistory: StrategyTradeHistoryItem[];
  tradeHistorySummary: StrategyTradeHistorySummary;
  assetHistory: StrategyAssetHistoryPoint[];
  assetChartSummary: StrategyAssetChartSummary;
  actionBoard: StrategyActionBoard;
  portfolioSummary: StrategyPortfolioSummary;
  operationSummary: StrategyOperationSummary;
  summary: StrategyResultSummary;
  conservativeRules: string[];
  dataStatus: StrategyDataStatus;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return round2(total / values.length);
}

function hasNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

function pushUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function takeFirst<T>(target: T[], count: number): T[] {
  return target.slice(0, count);
}

function getStockGrade(score: number): StrategyStockGrade {
  if (score >= 80) {
    return "S";
  }
  if (score >= 65) {
    return "A";
  }
  if (score >= 45) {
    return "B";
  }
  return "C";
}

function getPrioritySignal(grade: StrategyStockGrade): StrategyPrioritySignal {
  switch (grade) {
    case "S":
      return "STRONG_BUY";
    case "A":
      return "BUY_CANDIDATE";
    case "B":
      return "WATCH";
    case "C":
      return "EXCLUDE";
    default:
      return "WATCH";
  }
}

function buildGradeReason(item: ScoredStockResult): string {
  const score = item.totalScore;

  if (score >= 80) {
    return "최상위 점수 구간으로 즉시 매수 후보 등급";
  }
  if (score >= 65) {
    return "상위 점수 구간으로 유력 매수 후보 등급";
  }
  if (score >= 45) {
    return "중간 점수 구간으로 관찰 대상 등급";
  }
  return "하위 점수 구간으로 제외 대상 등급";
}

function buildHypothesis(item: ScoredStockResult): string {
  const { metrics, breakdown } = item;

  const strongGrowth =
    (metrics.revenueGrowth ?? 0) >= 8 ||
    (metrics.operatingIncomeGrowth ?? 0) >= 10 ||
    breakdown.growth >= 70;

  const strongValue =
    (metrics.per ?? 999) <= 10 ||
    (metrics.pbr ?? 999) <= 1 ||
    breakdown.value >= 70;

  const strongShareholderReturn =
    (metrics.dividendYield ?? 0) >= 3 || breakdown.shareholderReturn >= 60;

  const strongQuality =
    (metrics.roe ?? 0) >= 10 ||
    (((metrics.debtRatio ?? 999) > 0) && (metrics.debtRatio ?? 999) <= 100) ||
    breakdown.financialQuality >= 70;

  if (strongGrowth && strongValue) {
    return "이익 성장과 낮은 밸류가 함께 유지되면 재평가 가능성이 큰 종목입니다.";
  }

  if (strongValue && strongShareholderReturn) {
    return "저평가와 주주환원이 함께 보여 방어력과 재평가를 기대할 수 있습니다.";
  }

  if (strongQuality && strongGrowth) {
    return "재무 품질과 실적 성장이 함께 좋아 중기 성과 기대가 큽니다.";
  }

  if (strongQuality) {
    return "재무 체력이 좋아 흔들릴 때도 상대적으로 버틸 힘이 있습니다.";
  }

  return "여러 재무 지표가 고르게 괜찮아 편입 검토 가치가 있습니다.";
}

function buildEvidence(item: StrategyScoredStockResult): string[] {
  const { metrics, breakdown, totalScore, grade, prioritySignal } = item;
  const evidence: string[] = [];

  pushUnique(
    evidence,
    `총점 ${totalScore.toFixed(2)}점, 등급 ${grade}, 신호 ${prioritySignal}`
  );

  if (hasNumber(metrics.roe) && metrics.roe >= 10) {
    pushUnique(evidence, `ROE ${metrics.roe}%`);
  }

  if (hasNumber(metrics.revenueGrowth) && metrics.revenueGrowth >= 5) {
    pushUnique(evidence, `매출성장률 ${metrics.revenueGrowth}%`);
  }

  if (
    hasNumber(metrics.operatingIncomeGrowth) &&
    metrics.operatingIncomeGrowth >= 5
  ) {
    pushUnique(evidence, `영업이익성장률 ${metrics.operatingIncomeGrowth}%`);
  }

  if (hasNumber(metrics.per) && metrics.per <= 10) {
    pushUnique(evidence, `PER ${metrics.per}배`);
  }

  if (hasNumber(metrics.pbr) && metrics.pbr <= 1) {
    pushUnique(evidence, `PBR ${metrics.pbr}배`);
  }

  if (hasNumber(metrics.dividendYield) && metrics.dividendYield >= 2) {
    pushUnique(evidence, `배당수익률 ${metrics.dividendYield}%`);
  }

  if (
    hasNumber(metrics.debtRatio) &&
    metrics.debtRatio > 0 &&
    metrics.debtRatio <= 100
  ) {
    pushUnique(evidence, `부채비율 ${metrics.debtRatio}%`);
  }

  if (hasNumber(metrics.operatingMargin) && metrics.operatingMargin >= 10) {
    pushUnique(evidence, `영업이익률 ${metrics.operatingMargin}%`);
  }

  if (breakdown.growth >= 70) {
    pushUnique(evidence, `성장 점수 ${breakdown.growth.toFixed(2)}`);
  }

  if (breakdown.value >= 70) {
    pushUnique(evidence, `밸류 점수 ${breakdown.value.toFixed(2)}`);
  }

  if (breakdown.financialQuality >= 70) {
    pushUnique(evidence, `재무 퀄리티 ${breakdown.financialQuality.toFixed(2)}`);
  }

  if (evidence.length < 3) {
    pushUnique(
      evidence,
      `수익성 안정성 ${breakdown.profitabilityStability.toFixed(2)}`
    );
  }

  return takeFirst(evidence, 4);
}

function buildIndustryRisk(industry: string): string {
  switch (industry) {
    case "반도체":
      return "업황과 메모리 가격 변동";
    case "자동차":
    case "자동차부품":
      return "환율과 글로벌 수요";
    case "은행":
      return "금리와 대손비용";
    case "인터넷":
      return "광고·커머스 성장 둔화";
    case "지주사":
      return "지주사 할인 장기화";
    case "전자":
      return "수요 둔화와 경쟁 심화";
    default:
      return "업종 사이클 둔화";
  }
}

function buildRisk(item: ScoredStockResult): string[] {
  const { metrics, breakdown, industry } = item;
  const risk: string[] = [];

  if (hasNumber(metrics.per) && metrics.per > 20) {
    pushUnique(risk, `PER ${metrics.per}배 부담`);
  }

  if (hasNumber(metrics.pbr) && metrics.pbr > 2) {
    pushUnique(risk, `PBR ${metrics.pbr}배 부담`);
  }

  if (hasNumber(metrics.revenueGrowth) && metrics.revenueGrowth < 5) {
    pushUnique(risk, "매출성장 둔화");
  }

  if (
    hasNumber(metrics.operatingIncomeGrowth) &&
    metrics.operatingIncomeGrowth < 5
  ) {
    pushUnique(risk, "영업이익성장 둔화");
  }

  if (hasNumber(metrics.debtRatio) && metrics.debtRatio > 150) {
    pushUnique(risk, `부채비율 ${metrics.debtRatio}%`);
  }

  if (hasNumber(metrics.roe) && metrics.roe < 8) {
    pushUnique(risk, `ROE ${metrics.roe}%`);
  }

  if (hasNumber(metrics.dividendYield) && metrics.dividendYield < 1) {
    pushUnique(risk, "배당 완충력 약함");
  }

  if (breakdown.growth < 50) {
    pushUnique(risk, `성장 점수 ${breakdown.growth.toFixed(2)}`);
  }

  pushUnique(risk, buildIndustryRisk(industry));

  return takeFirst(risk, 3);
}

function buildInvalidation(item: ScoredStockResult): string[] {
  const { metrics, breakdown } = item;
  const invalidation: string[] = [];

  if (breakdown.growth >= 70) {
    pushUnique(invalidation, "매출·이익 성장 둔화");
  }

  if (breakdown.value >= 70) {
    pushUnique(invalidation, "PER 또는 PBR 급상승");
  }

  if (breakdown.financialQuality >= 70) {
    pushUnique(invalidation, "ROE 하락 + 부채비율 상승");
  }

  if (breakdown.shareholderReturn >= 60) {
    pushUnique(invalidation, "주주환원 약화");
  }

  if (hasNumber(metrics.operatingMargin) && metrics.operatingMargin >= 10) {
    pushUnique(invalidation, "영업이익률 하락");
  }

  if (invalidation.length < 3) {
    pushUnique(invalidation, "다음 분기 실적 약화");
  }

  return takeFirst(invalidation, 3);
}

function buildRecommendationRationale(
  item: StrategyScoredStockResult
): StockRecommendationRationale {
  return {
    hypothesis: buildHypothesis(item),
    evidence: buildEvidence(item),
    risk: buildRisk(item),
    invalidation: buildInvalidation(item),
  };
}

function enhanceScoredStock(
  item: ScoredStockResult
): StrategyScoredStockResult {
  const grade = getStockGrade(item.totalScore);
  const prioritySignal = getPrioritySignal(grade);
  const gradeReason = buildGradeReason(item);

  const baseEnhancedItem: StrategyScoredStockResult = {
    ...item,
    grade,
    prioritySignal,
    gradeReason,
    recommendationRationale: {
      hypothesis: "",
      evidence: [],
      risk: [],
      invalidation: [],
    },
  };

  return {
    ...baseEnhancedItem,
    recommendationRationale: buildRecommendationRationale(baseEnhancedItem),
  };
}

function buildTop10RankMap(
  top10: StrategyScoredStockResult[]
): Map<string, { rank: number; item: StrategyScoredStockResult }> {
  return new Map(
    top10.map((item, index) => [
      item.code,
      {
        rank: index + 1,
        item,
      },
    ])
  );
}

function buildHoldingAnalysis(
  top10RankMap: Map<string, { rank: number; item: StrategyScoredStockResult }>
): StrategyHoldingAnalysisItem[] {
  return MOCK_PORTFOLIO_HOLDINGS.map((holding) => {
    const matched = top10RankMap.get(holding.code);

    if (!matched) {
      return {
        ...holding,
        inTop10: false,
        matchedTop10Rank: null,
        matchedTop10Score: null,
        matchedTop10Grade: null,
        matchedDecision: null,
        matchedDecisionReason: null,
        engineSignal: "REVIEW",
      };
    }

    const engineSignal: StrategyHoldingAnalysisItem["engineSignal"] =
      matched.item.grade === "S"
        ? "PROMOTE"
        : matched.item.grade === "A" || matched.item.grade === "B"
        ? "KEEP"
        : "REVIEW";

    return {
      ...holding,
      inTop10: true,
      matchedTop10Rank: matched.rank,
      matchedTop10Score: matched.item.totalScore,
      matchedTop10Grade: matched.item.grade,
      matchedDecision: matched.item.decision,
      matchedDecisionReason: matched.item.decisionReason,
      engineSignal,
    };
  });
}

function buildSellCandidateAnalysis(
  top10RankMap: Map<string, { rank: number; item: StrategyScoredStockResult }>
): StrategySellCandidateAnalysisItem[] {
  return MOCK_SELL_CANDIDATES.map((candidate) => {
    const matched = top10RankMap.get(candidate.code);

    return {
      ...candidate,
      inTop10: !!matched,
      matchedTop10Rank: matched?.rank ?? null,
      matchedTop10Score: matched?.item.totalScore ?? null,
      matchedTop10Grade: matched?.item.grade ?? null,
      conflictWithTop10: !!matched,
    };
  });
}

function buildPortfolioSummary(
  holdingsAnalysis: StrategyHoldingAnalysisItem[],
  sellCandidates: StrategySellCandidateAnalysisItem[]
): StrategyPortfolioSummary {
  const totalInvestment = holdingsAnalysis.reduce(
    (sum, item) => sum + item.quantity * item.avgPrice,
    0
  );

  const evaluationAmount = holdingsAnalysis.reduce(
    (sum, item) => sum + item.quantity * item.currentPrice,
    0
  );

  const unrealizedProfit = evaluationAmount - totalInvestment;

  const totalAfterTaxProfit = holdingsAnalysis.reduce(
    (sum, item) => sum + item.afterTaxProfit,
    0
  );

  const totalDividendIncome = holdingsAnalysis.reduce(
    (sum, item) => sum + item.dividendIncome,
    0
  );

  return {
    totalInvestment,
    evaluationAmount,
    unrealizedProfit,
    totalAfterTaxProfit,
    totalDividendIncome,
    combinedAfterTaxAndDividend: totalAfterTaxProfit + totalDividendIncome,
    holdingCount: holdingsAnalysis.length,
    sellCandidateCount: sellCandidates.length,
  };
}

function countGrades(items: StrategyScoredStockResult[]): {
  s: number;
  a: number;
  b: number;
  c: number;
} {
  return items.reduce(
    (acc, item) => {
      if (item.grade === "S") {
        acc.s += 1;
      } else if (item.grade === "A") {
        acc.a += 1;
      } else if (item.grade === "B") {
        acc.b += 1;
      } else {
        acc.c += 1;
      }

      return acc;
    },
    { s: 0, a: 0, b: 0, c: 0 }
  );
}

function getAgentActionLabel(
  action: StrategyAgentAction
): "매수 검토" | "보유 관찰" | "제외" {
  if (action === "BUY") {
    return "매수 검토";
  }

  if (action === "HOLD") {
    return "보유 관찰";
  }

  return "제외";
}

function buildRecommendationReasonShort(
  item: StrategyScoredStockResult,
  action: StrategyAgentAction
): string {
  const { metrics } = item;

  if (
    action === "BUY" &&
    hasNumber(metrics.roe) &&
    hasNumber(metrics.per) &&
    hasNumber(metrics.pbr)
  ) {
    return `ROE ${metrics.roe}%와 PER ${metrics.per}배, PBR ${metrics.pbr}배 조합이 보수 기준에서 균형이 좋습니다.`;
  }

  if (
    action === "BUY" &&
    hasNumber(metrics.operatingIncomeGrowth) &&
    metrics.operatingIncomeGrowth > 0
  ) {
    return "영업이익 성장 흐름이 살아 있고 점수도 높아 오늘 매수 후보로 볼 만합니다.";
  }

  if (action === "HOLD" && hasNumber(metrics.roe) && metrics.roe >= 8) {
    return "재무 기준은 유지되고 있어 지금은 서두르기보다 보유 관찰이 더 적절합니다.";
  }

  return "기본 재무 조건은 통과했지만 더 강한 확신까지는 아직 부족합니다.";
}

function buildRiskShort(
  item: StrategyScoredStockResult,
  action: StrategyAgentAction
): string {
  const { metrics, industry } = item;

  if (hasNumber(metrics.revenueGrowth) && metrics.revenueGrowth < 5) {
    return `성장률이 아주 강하지 않아 ${industry} 업황 둔화 시 기대수익이 줄 수 있습니다.`;
  }

  if (
    hasNumber(metrics.operatingIncomeGrowth) &&
    metrics.operatingIncomeGrowth < 5
  ) {
    return "이익 성장 탄력이 약해지면 현재 판단은 빠르게 보수적으로 바뀔 수 있습니다.";
  }

  if (hasNumber(metrics.debtRatio) && metrics.debtRatio > 100) {
    return "부채비율이 낮지 않아 실적 흔들림이 나오면 방어력이 약해질 수 있습니다.";
  }

  if (action === "HOLD") {
    return "지금은 살 정도로 강하지 않고, 놓칠 정도로 나쁘지도 않은 중간 구간입니다.";
  }

  return `${buildIndustryRisk(industry)}를 함께 봐야 합니다.`;
}

function buildWhyTodayShort(
  item: StrategyScoredStockResult,
  action: StrategyAgentAction
): string {
  const { metrics } = item;

  if (action === "BUY" && hasNumber(metrics.per) && hasNumber(metrics.roe)) {
    return "낮은 밸류와 준수한 수익성이 동시에 보여질 때만 매수 후보로 좁히기 때문에 오늘 확인 가치가 있습니다.";
  }

  if (
    action === "HOLD" &&
    hasNumber(metrics.dividendYield) &&
    metrics.dividendYield >= 2
  ) {
    return "지금 당장 추격 매수보다 기존 보수 기준이 유지되는지 확인하는 날로 보는 편이 좋습니다.";
  }

  return "보수 기준을 통과한 종목이 많지 않기 때문에 오늘 살아남은 후보라는 점이 중요합니다.";
}

function evaluateAgentAction(item: StrategyScoredStockResult): {
  action: StrategyAgentAction;
  reason: string;
} {
  const { totalScore, metrics, grade } = item;

  const marketCap = metrics.marketCapBillionKrw ?? 0;
  const per = metrics.per ?? 999;
  const pbr = metrics.pbr ?? 999;
  const roe = metrics.roe ?? 0;
  const debtRatio = metrics.debtRatio ?? 999;
  const revenueGrowth = metrics.revenueGrowth ?? -999;
  const operatingIncomeGrowth = metrics.operatingIncomeGrowth ?? -999;
  const dividendYield = metrics.dividendYield ?? 0;

  const passesBuy =
    totalScore >= 75 &&
    (grade === "S" || grade === "A") &&
    marketCap >= 500 &&
    per <= 12 &&
    pbr <= 1.5 &&
    roe >= 10 &&
    debtRatio <= 120 &&
    (revenueGrowth >= 3 ||
      operatingIncomeGrowth >= 3 ||
      dividendYield >= 2);

  if (passesBuy) {
    return {
      action: "BUY",
      reason:
        "총점, 수익성, 밸류, 재무안정성 기준을 모두 강하게 통과해 오늘 매수 후보로 분류했습니다.",
    };
  }

  const passesHold =
    totalScore >= 60 &&
    marketCap >= 500 &&
    per <= 15 &&
    pbr <= 1.8 &&
    roe >= 8 &&
    debtRatio <= 150 &&
    (revenueGrowth >= 0 || operatingIncomeGrowth >= 0);

  if (passesHold) {
    return {
      action: "HOLD",
      reason:
        "기본 보수 조건은 통과했지만 매수까지 밀어붙일 정도로 강한 확신은 부족해 보유 관찰로 분류했습니다.",
    };
  }

  return {
    action: "EXCLUDE",
    reason:
      "점수 또는 핵심 재무 조건이 보수 기준에 충분히 강하지 않아 오늘 추천 목록에서는 제외했습니다.",
    };
}

function buildDailyRecommended(
  scoredUniverse: StrategyScoredStockResult[]
): StrategyDailyRecommendationItem[] {
  const labels: StrategyDailyRecommendationItem["recommendationLabel"][] = [
    "오늘의 1순위",
    "오늘의 2순위",
    "오늘의 3순위",
  ];

  const candidates = scoredUniverse
    .map((item) => {
      const agentDecision = evaluateAgentAction(item);

      return {
        item,
        agentAction: agentDecision.action,
        agentDecisionReason: agentDecision.reason,
      };
    })
    .filter((item) => item.agentAction !== "EXCLUDE")
    .slice(0, 3);

  return candidates.map(({ item, agentAction, agentDecisionReason }, index) => ({
    rank: index + 1,
    code: item.code,
    name: item.name,
    market: item.market,
    industry: item.industry,
    currentPrice: item.currentPrice,
    totalScore: item.totalScore,
    grade: item.grade,
    prioritySignal: item.prioritySignal,
    decision: item.decision,
    decisionReason: item.decisionReason,
    gradeReason: item.gradeReason,
    hypothesis: item.recommendationRationale.hypothesis,
    evidence: item.recommendationRationale.evidence,
    risk: item.recommendationRationale.risk,
    invalidation: item.recommendationRationale.invalidation,
    recommendationLabel: labels[index],
    agentAction,
    agentActionLabel: getAgentActionLabel(agentAction),
    agentDecisionReason,
    recommendationReasonShort: buildRecommendationReasonShort(item, agentAction),
    riskShort: buildRiskShort(item, agentAction),
    whyTodayShort: buildWhyTodayShort(item, agentAction),
  }));
}

function buildPublishedPortfolio(): StrategyPublishedPortfolioItem[] {
  return MOCK_PUBLISHED_PORTFOLIO.map((item) => {
    const base =
      item.averagePrice === 0
        ? 0
        : ((item.currentPrice - item.averagePrice) / item.averagePrice) * 100;

    return {
      ...item,
      unrealizedReturnPercent: round2(base),
    };
  });
}

function buildLivePortfolioHoldings(): StrategyLiveHoldingItem[] {
  const raw = MOCK_LIVE_PORTFOLIO_SNAPSHOT.holdings.map((item) => {
    const investedAmount = item.quantity * item.averagePrice;
    const evaluationAmount = item.quantity * item.currentPrice;
    const unrealizedProfit = evaluationAmount - investedAmount;
    const unrealizedReturnPercent =
      investedAmount === 0 ? 0 : (unrealizedProfit / investedAmount) * 100;

    return {
      ...item,
      investedAmount,
      evaluationAmount,
      unrealizedProfit,
      unrealizedReturnPercent: round2(unrealizedReturnPercent),
      weightPercent: 0,
    };
  });

  const totalEvaluationAmount = raw.reduce(
    (sum, item) => sum + item.evaluationAmount,
    0
  );
  const totalAsset = totalEvaluationAmount + MOCK_LIVE_PORTFOLIO_SNAPSHOT.cash;

  return raw.map((item) => ({
    ...item,
    weightPercent:
      totalAsset === 0 ? 0 : round2((item.evaluationAmount / totalAsset) * 100),
  }));
}

function buildLivePortfolioSummary(
  holdings: StrategyLiveHoldingItem[]
): StrategyLivePortfolioSummary {
  const initialCapital = MOCK_LIVE_PORTFOLIO_SNAPSHOT.initialCapital;
  const cash = MOCK_LIVE_PORTFOLIO_SNAPSHOT.cash;

  const investedAmount = holdings.reduce(
    (sum, item) => sum + item.investedAmount,
    0
  );

  const evaluationAmount = holdings.reduce(
    (sum, item) => sum + item.evaluationAmount,
    0
  );

  const totalAsset = cash + evaluationAmount;
  const cumulativeProfit = totalAsset - initialCapital;
  const cumulativeReturnPercent =
    initialCapital === 0 ? 0 : (cumulativeProfit / initialCapital) * 100;

  return {
    startedAt: MOCK_LIVE_PORTFOLIO_SNAPSHOT.startedAt,
    initialCapital,
    cash,
    investedAmount,
    evaluationAmount,
    totalAsset,
    cumulativeProfit,
    cumulativeReturnPercent: round2(cumulativeReturnPercent),
    holdingCount: holdings.length,
  };
}

function buildTodayTradePlan(
  dailyRecommended: StrategyDailyRecommendationItem[],
  sellCandidates: StrategySellCandidateAnalysisItem[]
): StrategyTradeInstruction[] {
  const trades: StrategyTradeInstruction[] = [];

  dailyRecommended.forEach((item) => {
    if (item.agentAction === "BUY") {
      trades.push({
        type: "BUY",
        code: item.code,
        name: item.name,
        currentPrice: item.currentPrice,
        reason: item.agentDecisionReason,
      });
    }
  });

  sellCandidates.forEach((item) => {
    if (item.targetAction === "전량매도" || item.targetAction === "일부매도") {
      trades.push({
        type: "SELL",
        code: item.code,
        name: item.name,
        currentPrice: item.currentPrice,
        reason: item.sellHypothesis,
      });
    }
  });

  return trades;
}

function buildAssetHistory(
  rawHistory: MockDailyAssetPoint[],
  initialCapital: number
): StrategyAssetHistoryPoint[] {
  return rawHistory.map((item) => ({
    date: item.date,
    totalAsset: item.totalAsset,
    cumulativeReturnPercent:
      initialCapital === 0
        ? 0
        : round2(((item.totalAsset - initialCapital) / initialCapital) * 100),
  }));
}

function buildAssetChartSummary(
  assetHistory: StrategyAssetHistoryPoint[]
): StrategyAssetChartSummary {
  const first = assetHistory[0];
  const last = assetHistory[assetHistory.length - 1];
  const prev = assetHistory[assetHistory.length - 2] ?? last;
  const weekBase = assetHistory[Math.max(0, assetHistory.length - 6)] ?? first;
  const monthBase =
    assetHistory[Math.max(0, assetHistory.length - 21)] ?? first;

  const totals = assetHistory.map((item) => item.totalAsset);
  const highAsset = Math.max(...totals);
  const lowAsset = Math.min(...totals);

  const dayChangeAmount = last.totalAsset - prev.totalAsset;
  const dayChangePercent =
    prev.totalAsset === 0 ? 0 : (dayChangeAmount / prev.totalAsset) * 100;

  const oneWeekChangeAmount = last.totalAsset - weekBase.totalAsset;
  const oneWeekChangePercent =
    weekBase.totalAsset === 0
      ? 0
      : (oneWeekChangeAmount / weekBase.totalAsset) * 100;

  const oneMonthChangeAmount = last.totalAsset - monthBase.totalAsset;
  const oneMonthChangePercent =
    monthBase.totalAsset === 0
      ? 0
      : (oneMonthChangeAmount / monthBase.totalAsset) * 100;

  return {
    firstDate: first.date,
    lastDate: last.date,
    startAsset: first.totalAsset,
    latestAsset: last.totalAsset,
    highAsset,
    lowAsset,
    dayChangeAmount,
    dayChangePercent: round2(dayChangePercent),
    oneWeekChangeAmount,
    oneWeekChangePercent: round2(oneWeekChangePercent),
    oneMonthChangeAmount,
    oneMonthChangePercent: round2(oneMonthChangePercent),
  };
}

function buildTradeHistory(): StrategyTradeHistoryItem[] {
  return [...MOCK_TRADE_HISTORY].sort((a, b) => b.date.localeCompare(a.date));
}

function buildTradeHistorySummary(
  trades: StrategyTradeHistoryItem[]
): StrategyTradeHistorySummary {
  const buyTrades = trades.filter((item) => item.action === "BUY");
  const sellTrades = trades.filter((item) => item.action === "SELL");

  return {
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    totalBuyAmount: buyTrades.reduce((sum, item) => sum + item.amount, 0),
    totalSellAmount: sellTrades.reduce((sum, item) => sum + item.amount, 0),
    latestTradeDate: trades[0]?.date ?? "",
  };
}

function buildActionBoard(
  dailyRecommended: StrategyDailyRecommendationItem[],
  holdingsAnalysis: StrategyHoldingAnalysisItem[],
  sellCandidates: StrategySellCandidateAnalysisItem[]
): StrategyActionBoard {
  const buy: StrategyActionBoardItem[] = dailyRecommended
    .filter((item) => item.agentAction === "BUY")
    .map((item, index) => ({
      type: "BUY",
      code: item.code,
      name: item.name,
      subtitle: `${item.recommendationLabel} · ${item.agentActionLabel}`,
      reason: item.agentDecisionReason,
      priority: index + 1,
    }));

  const hold: StrategyActionBoardItem[] = [
    ...dailyRecommended
      .filter((item) => item.agentAction === "HOLD")
      .map((item, index) => ({
        type: "HOLD" as const,
        code: item.code,
        name: item.name,
        subtitle: `${item.recommendationLabel} · ${item.agentActionLabel}`,
        reason: item.agentDecisionReason,
        priority: index + 1,
      })),
    ...holdingsAnalysis
      .filter(
        (item) =>
          item.decision === "유지" ||
          item.engineSignal === "KEEP" ||
          item.engineSignal === "PROMOTE"
      )
      .slice(0, 2)
      .map((item, index) => ({
        type: "HOLD" as const,
        code: item.code,
        name: item.name,
        subtitle: `${item.decision} · ${item.engineSignal}`,
        reason:
          item.matchedDecisionReason ?? "현재 보유 유지가 우선인 종목입니다.",
        priority: 10 + index,
      })),
  ].slice(0, 4);

  const sell: StrategyActionBoardItem[] = sellCandidates
    .filter(
      (item) =>
        item.targetAction === "전량매도" || item.targetAction === "일부매도"
    )
    .map((item, index) => ({
      type: "SELL",
      code: item.code,
      name: item.name,
      subtitle: item.targetAction,
      reason: item.sellHypothesis,
      priority: index + 1,
    }));

  const checkCandidates: StrategyActionBoardItem[] = [
    ...dailyRecommended.map((item, index) => ({
      type: "CHECK" as const,
      code: item.code,
      name: item.name,
      subtitle: `추천 ${index + 1}순위`,
      reason: item.agentDecisionReason,
      priority: index + 1,
    })),
    ...sell.slice(0, 2).map((item, index) => ({
      ...item,
      type: "CHECK" as const,
      priority: 10 + index,
    })),
  ]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);

  return {
    buy,
    hold,
    sell,
    check: checkCandidates,
  };
}

function buildOperationSummary(
  dailyRecommended: StrategyDailyRecommendationItem[],
  holdingsAnalysis: StrategyHoldingAnalysisItem[],
  publishedPortfolio: StrategyPublishedPortfolioItem[]
): StrategyOperationSummary {
  return {
    todayPickCount: dailyRecommended.length,
    todayBuyCount: dailyRecommended.filter((item) => item.agentAction === "BUY")
      .length,
    todayHoldCount: dailyRecommended.filter(
      (item) => item.agentAction === "HOLD"
    ).length,
    todaySellCount: 0,
    holdingActionCounts: {
      addBuy: holdingsAnalysis.filter((item) => item.decision === "추가매수")
        .length,
      hold: holdingsAnalysis.filter((item) => item.decision === "유지").length,
      partialSell: holdingsAnalysis.filter(
        (item) => item.decision === "일부매도"
      ).length,
      fullSell: holdingsAnalysis.filter((item) => item.decision === "전량매도")
        .length,
      watch: holdingsAnalysis.filter((item) => item.decision === "관찰강화")
        .length,
    },
    publicPortfolioCount: publishedPortfolio.length,
  };
}

function createConservativeFilters(): StockFilterSet {
  const filters = createDefaultStockFilterSet();

  filters.per = { min: null, max: 15 };
  filters.pbr = { min: null, max: 1.5 };
  filters.roe = { min: 8, max: null };
  filters.revenueGrowth = { min: 0, max: null };
  filters.operatingIncomeGrowth = { min: 0, max: null };
  filters.debtRatio = { min: null, max: 150 };
  filters.dividendYield = { min: null, max: null };
  filters.marketCapBillionKrw = { min: 500, max: null };
  filters.industries = [];
  filters.markets = [];

  return filters;
}

function createConservativeWeights(): ScoreWeightSet {
  return createDefaultScoreWeightSet();
}

export function createEmptyStrategyResult(): StrategyResult {
  return {
    scoredUniverse: [],
    top10: [],
    dailyRecommended: [],
    newEntries: [],
    exited: [],
    holdingsAnalysis: [],
    sellCandidates: [],
    publishedPortfolio: [],
    livePortfolioHoldings: [],
    livePortfolioSummary: {
      startedAt: "",
      initialCapital: 0,
      cash: 0,
      investedAmount: 0,
      evaluationAmount: 0,
      totalAsset: 0,
      cumulativeProfit: 0,
      cumulativeReturnPercent: 0,
      holdingCount: 0,
    },
    todayTradePlan: [],
    tradeHistory: [],
    tradeHistorySummary: {
      buyCount: 0,
      sellCount: 0,
      totalBuyAmount: 0,
      totalSellAmount: 0,
      latestTradeDate: "",
    },
    assetHistory: [],
    assetChartSummary: {
      firstDate: "",
      lastDate: "",
      startAsset: 0,
      latestAsset: 0,
      highAsset: 0,
      lowAsset: 0,
      dayChangeAmount: 0,
      dayChangePercent: 0,
      oneWeekChangeAmount: 0,
      oneWeekChangePercent: 0,
      oneMonthChangeAmount: 0,
      oneMonthChangePercent: 0,
    },
    actionBoard: {
      buy: [],
      hold: [],
      sell: [],
      check: [],
    },
    portfolioSummary: {
      totalInvestment: 0,
      evaluationAmount: 0,
      unrealizedProfit: 0,
      totalAfterTaxProfit: 0,
      totalDividendIncome: 0,
      combinedAfterTaxAndDividend: 0,
      holdingCount: 0,
      sellCandidateCount: 0,
    },
    operationSummary: {
      todayPickCount: 0,
      todayBuyCount: 0,
      todayHoldCount: 0,
      todaySellCount: 0,
      holdingActionCounts: {
        addBuy: 0,
        hold: 0,
        partialSell: 0,
        fullSell: 0,
        watch: 0,
      },
      publicPortfolioCount: 0,
    },
    summary: {
      avgScoreTop10: 0,
      buyCount: 0,
      holdCount: 0,
      sellCount: 0,
      filteredUniverseCount: 0,
      holdingIncludedInTop10Count: 0,
      newEntryCount: 0,
      exitedCount: 0,
      sellConflictCount: 0,
      gradeCounts: {
        s: 0,
        a: 0,
        b: 0,
        c: 0,
      },
    },
    conservativeRules: [
      "PER 15 이하",
      "PBR 1.5 이하",
      "ROE 8 이상",
      "부채비율 150 이하",
      "시가총액 500억 이상",
      "BUY는 점수·수익성·밸류 기준을 더 엄격하게 적용",
    ],
    dataStatus: {
      source: "mock",
      requestedSource: "mock",
      usedFallback: false,
      message: "초기 상태",
    },
  };
}

export async function runStrategyEngine(): Promise<StrategyResult> {
  const fixedFilters = createConservativeFilters();
  const fixedWeights = createConservativeWeights();

  const financialUniverseResult = await loadFinancialUniverse();

  const rawScoredUniverse = scoreStocks(
    financialUniverseResult.items,
    fixedFilters
  );

  const scoredUniverse = rawScoredUniverse.map(enhanceScoredStock);
  const top10 = scoredUniverse.slice(0, 10);
  const dailyRecommended = buildDailyRecommended(scoredUniverse);
  const top10RankMap = buildTop10RankMap(top10);

  const holdingCodeSet = new Set(
    MOCK_PORTFOLIO_HOLDINGS.map((item) => item.code)
  );

  const newEntries = top10.filter((item) => !holdingCodeSet.has(item.code));

  const previousTop10CodeSet = new Set(
    MOCK_PREVIOUS_TOP10.map((item) => item.code)
  );

  const exited = scoredUniverse.filter(
    (item) =>
      previousTop10CodeSet.has(item.code) &&
      !top10.some((topItem) => topItem.code === item.code)
  );

  const holdingsAnalysis = buildHoldingAnalysis(top10RankMap);
  const sellCandidates = buildSellCandidateAnalysis(top10RankMap);
  const publishedPortfolio = buildPublishedPortfolio();
  const livePortfolioHoldings = buildLivePortfolioHoldings();
  const livePortfolioSummary = buildLivePortfolioSummary(livePortfolioHoldings);
  const todayTradePlan = buildTodayTradePlan(dailyRecommended, sellCandidates);
  const tradeHistory = buildTradeHistory();
  const tradeHistorySummary = buildTradeHistorySummary(tradeHistory);
  const assetHistory = buildAssetHistory(
    MOCK_DAILY_ASSET_HISTORY,
    MOCK_LIVE_PORTFOLIO_SNAPSHOT.initialCapital
  );
  const assetChartSummary = buildAssetChartSummary(assetHistory);
  const actionBoard = buildActionBoard(
    dailyRecommended,
    holdingsAnalysis,
    sellCandidates
  );
  const portfolioSummary = buildPortfolioSummary(
    holdingsAnalysis,
    sellCandidates
  );
  const operationSummary = buildOperationSummary(
    dailyRecommended,
    holdingsAnalysis,
    publishedPortfolio
  );

  const buyCount = top10.filter((item) => item.decision === "BUY").length;
  const holdCount = top10.filter((item) => item.decision === "HOLD").length;
  const sellCount = top10.filter((item) => item.decision === "SELL").length;
  const holdingIncludedInTop10Count = holdingsAnalysis.filter(
    (item) => item.inTop10
  ).length;
  const sellConflictCount = sellCandidates.filter(
    (item) => item.conflictWithTop10
  ).length;

  return {
    scoredUniverse,
    top10,
    dailyRecommended,
    newEntries,
    exited,
    holdingsAnalysis,
    sellCandidates,
    publishedPortfolio,
    livePortfolioHoldings,
    livePortfolioSummary,
    todayTradePlan,
    tradeHistory,
    tradeHistorySummary,
    assetHistory,
    assetChartSummary,
    actionBoard,
    portfolioSummary,
    operationSummary,
    summary: {
      avgScoreTop10: average(top10.map((item) => item.totalScore)),
      buyCount,
      holdCount,
      sellCount,
      filteredUniverseCount: scoredUniverse.length,
      holdingIncludedInTop10Count,
      newEntryCount: newEntries.length,
      exitedCount: exited.length,
      sellConflictCount,
      gradeCounts: countGrades(top10),
    },
    conservativeRules: [
      "PER 15 이하",
      "PBR 1.5 이하",
      "ROE 8 이상",
      "부채비율 150 이하",
      "시가총액 500억 이상",
      "BUY는 점수·수익성·밸류 기준을 더 엄격하게 적용",
    ],
    dataStatus: {
      source: financialUniverseResult.source,
      requestedSource: financialUniverseResult.requestedSource,
      usedFallback: financialUniverseResult.usedFallback,
      message: financialUniverseResult.message,
    },
  };
}