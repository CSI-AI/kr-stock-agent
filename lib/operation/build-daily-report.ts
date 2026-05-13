import {
  buildActionSummary,
  type OperationActionSummary,
} from "@/lib/operation/build-action-summary";
import {
  buildPortfolioView,
  type OperationHoldingStatusItem,
  type OperationSellCandidateItem,
} from "@/lib/operation/build-portfolio-view";
import type {
  StrategyDailyRecommendationItem,
  StrategyPublishedPortfolioItem,
  StrategyResult,
} from "@/lib/strategy/strategy-engine";

export type DailyReportRecommendationItem = {
  rank: number;
  code: string;
  name: string;
  market: string;
  industry: string;
  currentPrice: number;
  totalScore: number;
  grade: string;
  prioritySignal: string;
  decision: "BUY" | "HOLD" | "SELL";
  decisionReason: string;
  hypothesis: string;
  evidence: string[];
  risk: string[];
  invalidation: string[];
  recommendationLabel: string;
};

export type DailyReportTop10ChangeItem = {
  code: string;
  name: string;
  score: number;
  grade: string;
};

export type DailyReportFinalDecisionSummary = {
  stance: "선별 매수 확대" | "선별 매수" | "관망 유지" | "방어 강화";
  headline: string;
  primaryFocus: string;
  cashRatioPercent: number;
  recommendationBuyCount: number;
  holdingManageCount: number;
  urgentSellCount: number;
  topPriorityActions: string[];
};

export type DailyReportBridgeItem = {
  code: string;
  name: string;
  label: string;
  detail: string;
};

export type DailyReportPortfolioBridge = {
  recommendationToHolding: DailyReportBridgeItem[];
  holdingRiskLinks: DailyReportBridgeItem[];
  sellExecutionLinks: DailyReportBridgeItem[];
};

export type DailyReportPublicPortfolioImpactItem = {
  code: string;
  name: string;
  currentAction: string;
  suggestedAction:
    | "신규편입검토"
    | "비중확대검토"
    | "핵심보유유지"
    | "비중축소검토"
    | "제외검토";
  weightPercent: number;
  unrealizedReturnPercent: number;
  reason: string;
};

export type DailyReportPublicPortfolioImpact = {
  summary: string;
  addCount: number;
  keepCount: number;
  reduceCount: number;
  removeCount: number;
  items: DailyReportPublicPortfolioImpactItem[];
};

export type DailyReport = {
  generatedAt: string;
  todayRecommendations: DailyReportRecommendationItem[];
  top10Changes: {
    newEntries: DailyReportTop10ChangeItem[];
    dropped: DailyReportTop10ChangeItem[];
  };
  holdingsStatus: OperationHoldingStatusItem[];
  sellCandidates: OperationSellCandidateItem[];
  actionSummary: OperationActionSummary;
  finalDecisionSummary: DailyReportFinalDecisionSummary;
  portfolioBridge: DailyReportPortfolioBridge;
  publicPortfolioImpact: DailyReportPublicPortfolioImpact;
};

function mapRecommendationItem(
  item: StrategyDailyRecommendationItem
): DailyReportRecommendationItem {
  return {
    rank: item.rank,
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
    hypothesis: item.hypothesis,
    evidence: item.evidence,
    risk: item.risk,
    invalidation: item.invalidation,
    recommendationLabel: item.recommendationLabel,
  };
}

function buildFinalDecisionSummary(
  strategyResult: StrategyResult,
  holdingsStatus: OperationHoldingStatusItem[],
  sellCandidates: OperationSellCandidateItem[],
  actionSummary: OperationActionSummary
): DailyReportFinalDecisionSummary {
  const totalAsset = strategyResult.livePortfolioSummary.totalAsset;
  const cash = strategyResult.livePortfolioSummary.cash;
  const cashRatioPercent =
    totalAsset > 0 ? Number(((cash / totalAsset) * 100).toFixed(1)) : 0;

  const urgentSellCount = sellCandidates.filter(
    (item) =>
      item.targetAction === "전량매도" || item.targetAction === "일부매도"
  ).length;

  const recommendationBuyCount = actionSummary.recommendationBuy;
  const holdingManageCount = holdingsStatus.length;

  let stance: DailyReportFinalDecisionSummary["stance"] = "관망 유지";

  if (urgentSellCount >= 2 || actionSummary.sell >= 2) {
    stance = "방어 강화";
  } else if (recommendationBuyCount >= 3 && cashRatioPercent >= 15) {
    stance = "선별 매수 확대";
  } else if (recommendationBuyCount >= 1) {
    stance = "선별 매수";
  }

  const firstRecommendation = strategyResult.dailyRecommended[0] ?? null;
  const firstSellCandidate = sellCandidates[0] ?? null;
  const firstWatchHolding =
    holdingsStatus.find((item) => item.decision === "관찰강화") ?? null;

  let headline = "신규 매수보다 보유 종목 점검과 신호 추적이 우선입니다.";
  let primaryFocus = "보유 포트폴리오 점검";

  if (stance === "방어 강화") {
    headline = `매도 우선 후보 ${urgentSellCount}개를 먼저 정리하고 신규 매수는 제한적으로 접근합니다.`;
    primaryFocus = "리스크 축소와 매도 우선 실행";
  } else if (stance === "선별 매수 확대") {
    headline = `${
      firstRecommendation?.name ?? "상위 추천주"
    } 중심으로 오늘은 선별 매수 확대를 검토할 수 있습니다.`;
    primaryFocus = "상위 추천주 신규 진입";
  } else if (stance === "선별 매수") {
    headline =
      "기존 보유를 유지하면서 상위 추천주 중심의 제한적 진입이 적절합니다.";
    primaryFocus = "기존 보유 유지 + 소수 신규 진입";
  }

  const topPriorityActions: string[] = [];

  if (firstRecommendation) {
    topPriorityActions.push(
      `${firstRecommendation.name} 신규 진입 검토: ${firstRecommendation.decisionReason}`
    );
  }

  if (firstSellCandidate) {
    topPriorityActions.push(
      `${firstSellCandidate.name} ${firstSellCandidate.targetAction} 우선 검토: ${firstSellCandidate.hypothesis}`
    );
  }

  if (firstWatchHolding) {
    topPriorityActions.push(
      `${firstWatchHolding.name} 신호 추적 강화: ${firstWatchHolding.hypothesis}`
    );
  }

  if (topPriorityActions.length === 0) {
    topPriorityActions.push(
      "오늘은 급격한 포트폴리오 변경보다 기존 전략 유지가 우선입니다."
    );
  }

  return {
    stance,
    headline,
    primaryFocus,
    cashRatioPercent,
    recommendationBuyCount,
    holdingManageCount,
    urgentSellCount,
    topPriorityActions,
  };
}

function buildRecommendationToHoldingLinks(
  holdingsStatus: OperationHoldingStatusItem[]
): DailyReportBridgeItem[] {
  return holdingsStatus
    .filter(
      (item) =>
        item.decision === "추가매수" ||
        item.inTop10 ||
        item.decision === "유지"
    )
    .slice(0, 5)
    .map((item) => {
      let label = "보유 유지";

      if (item.decision === "추가매수") {
        label = "보유 + 추가매수";
      } else if (item.inTop10 && item.matchedTop10Rank) {
        label = `보유 + Top10 ${item.matchedTop10Rank}위`;
      }

      return {
        code: item.code,
        name: item.name,
        label,
        detail: item.hypothesis,
      };
    });
}

function buildHoldingRiskLinks(
  holdingsStatus: OperationHoldingStatusItem[]
): DailyReportBridgeItem[] {
  return holdingsStatus
    .filter(
      (item) =>
        item.decision === "관찰강화" ||
        item.decision === "일부매도" ||
        item.decision === "전량매도" ||
        (!item.inTop10 && item.decision === "유지")
    )
    .slice(0, 5)
    .map((item) => {
      let label: string = item.decision;

      if (!item.inTop10 && item.decision === "유지") {
        label = "Top10 이탈 보유";
      }

      return {
        code: item.code,
        name: item.name,
        label,
        detail: item.hypothesis,
      };
    });
}

function buildSellExecutionLinks(
  sellCandidates: OperationSellCandidateItem[]
): DailyReportBridgeItem[] {
  return sellCandidates.slice(0, 5).map((item) => ({
    code: item.code,
    name: item.name,
    label: item.targetAction,
    detail: item.hypothesis || item.reversalCondition,
  }));
}

function getPublicSuggestedAction(
  item: StrategyPublishedPortfolioItem,
  recommendationMap: Map<string, DailyReportRecommendationItem>,
  holdingMap: Map<string, OperationHoldingStatusItem>,
  sellCandidateMap: Map<string, OperationSellCandidateItem>
): DailyReportPublicPortfolioImpactItem["suggestedAction"] {
  const sellCandidate = sellCandidateMap.get(item.code);
  const recommendation = recommendationMap.get(item.code);
  const holding = holdingMap.get(item.code);

  if (sellCandidate?.targetAction === "전량매도") {
    return "제외검토";
  }

  if (sellCandidate?.targetAction === "일부매도") {
    return "비중축소검토";
  }

  if (holding?.decision === "일부매도") {
    return "비중축소검토";
  }

  if (holding?.decision === "추가매수") {
    return "비중확대검토";
  }

  if (recommendation?.decision === "BUY") {
    return "비중확대검토";
  }

  return "핵심보유유지";
}

function getPublicImpactReason(
  item: StrategyPublishedPortfolioItem,
  recommendationMap: Map<string, DailyReportRecommendationItem>,
  holdingMap: Map<string, OperationHoldingStatusItem>,
  sellCandidateMap: Map<string, OperationSellCandidateItem>
): string {
  const sellCandidate = sellCandidateMap.get(item.code);
  const recommendation = recommendationMap.get(item.code);
  const holding = holdingMap.get(item.code);

  if (sellCandidate) {
    return sellCandidate.hypothesis;
  }

  if (holding?.decision === "추가매수") {
    return holding.hypothesis;
  }

  if (holding?.decision === "관찰강화") {
    return holding.hypothesis;
  }

  if (recommendation) {
    return recommendation.hypothesis;
  }

  return item.thesis;
}

function buildPublicPortfolioImpact(
  strategyResult: StrategyResult,
  todayRecommendations: DailyReportRecommendationItem[],
  holdingsStatus: OperationHoldingStatusItem[],
  sellCandidates: OperationSellCandidateItem[]
): DailyReportPublicPortfolioImpact {
  const recommendationMap = new Map(
    todayRecommendations.map((item) => [item.code, item])
  );
  const holdingMap = new Map(holdingsStatus.map((item) => [item.code, item]));
  const sellCandidateMap = new Map(sellCandidates.map((item) => [item.code, item]));

  const publishedItems = strategyResult.publishedPortfolio.map((item) => ({
    code: item.code,
    name: item.name,
    currentAction: item.action,
    suggestedAction: getPublicSuggestedAction(
      item,
      recommendationMap,
      holdingMap,
      sellCandidateMap
    ),
    weightPercent: item.weightPercent,
    unrealizedReturnPercent: item.unrealizedReturnPercent,
    reason: getPublicImpactReason(
      item,
      recommendationMap,
      holdingMap,
      sellCandidateMap
    ),
  }));

  const addCount = publishedItems.filter(
    (item) =>
      item.suggestedAction === "신규편입검토" ||
      item.suggestedAction === "비중확대검토"
  ).length;

  const keepCount = publishedItems.filter(
    (item) => item.suggestedAction === "핵심보유유지"
  ).length;

  const reduceCount = publishedItems.filter(
    (item) => item.suggestedAction === "비중축소검토"
  ).length;

  const removeCount = publishedItems.filter(
    (item) => item.suggestedAction === "제외검토"
  ).length;

  const summary = `공개 포트 ${publishedItems.length}개 종목 기준으로 비중확대 검토 ${addCount}개, 유지 ${keepCount}개, 비중축소 ${reduceCount}개, 제외 검토 ${removeCount}개입니다.`;

  const sortedItems = [...publishedItems].sort((a, b) => {
    const priorityMap: Record<
      DailyReportPublicPortfolioImpactItem["suggestedAction"],
      number
    > = {
      제외검토: 0,
      비중축소검토: 1,
      비중확대검토: 2,
      신규편입검토: 3,
      핵심보유유지: 4,
    };

    return priorityMap[a.suggestedAction] - priorityMap[b.suggestedAction];
  });

  return {
    summary,
    addCount,
    keepCount,
    reduceCount,
    removeCount,
    items: sortedItems,
  };
}

export function buildDailyReport(strategyResult: StrategyResult): DailyReport {
  const portfolioView = buildPortfolioView(strategyResult);
  const actionSummary = buildActionSummary(strategyResult);

  const todayRecommendations = strategyResult.dailyRecommended.map(
    mapRecommendationItem
  );

  const holdingsStatus = portfolioView.holdingsStatus;
  const sellCandidates = portfolioView.sellCandidates;

  const finalDecisionSummary = buildFinalDecisionSummary(
    strategyResult,
    holdingsStatus,
    sellCandidates,
    actionSummary
  );

  const portfolioBridge: DailyReportPortfolioBridge = {
    recommendationToHolding: buildRecommendationToHoldingLinks(holdingsStatus),
    holdingRiskLinks: buildHoldingRiskLinks(holdingsStatus),
    sellExecutionLinks: buildSellExecutionLinks(sellCandidates),
  };

  const publicPortfolioImpact = buildPublicPortfolioImpact(
    strategyResult,
    todayRecommendations,
    holdingsStatus,
    sellCandidates
  );

  return {
    generatedAt: new Date().toISOString(),
    todayRecommendations,
    top10Changes: {
      newEntries: strategyResult.newEntries.map((item) => ({
        code: item.code,
        name: item.name,
        score: item.totalScore,
        grade: item.grade,
      })),
      dropped: strategyResult.exited.map((item) => ({
        code: item.code,
        name: item.name,
        score: item.totalScore,
        grade: item.grade,
      })),
    },
    holdingsStatus,
    sellCandidates,
    actionSummary,
    finalDecisionSummary,
    portfolioBridge,
    publicPortfolioImpact,
  };
}