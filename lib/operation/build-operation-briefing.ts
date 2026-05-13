import type { DailyReport } from "@/lib/operation/build-daily-report";
import type { StateChangeSummary } from "@/lib/operation/build-state-change-summary";

export type OperationBriefingTone = "buy" | "hold" | "sell" | "neutral";

export type OperationBriefingBadge = {
  label: string;
  value: string;
  tone: OperationBriefingTone;
};

export type OperationBriefing = {
  title: string;
  summary: string;
  bullets: string[];
  emphasisBadges: OperationBriefingBadge[];
  executionSteps: string[];
  watchpoints: string[];
};

function buildRecommendationSentence(dailyReport: DailyReport): string {
  const recommendationCount = dailyReport.todayRecommendations.length;
  const buyCount = dailyReport.actionSummary.recommendationBuy;
  const holdCount = dailyReport.actionSummary.recommendationHold;
  const sellCount = dailyReport.actionSummary.recommendationSell;

  return `오늘 추천 엔진은 총 ${recommendationCount}개 종목을 제시했고, 이 중 BUY ${buyCount}개, HOLD ${holdCount}개, SELL ${sellCount}개로 분류했습니다.`;
}

function buildTopChangeSentence(stateChangeSummary: StateChangeSummary): string {
  return `추천 변화는 신규 Top ${stateChangeSummary.newTop10.length}개, 탈락 Top ${stateChangeSummary.droppedTop10.length}개이며, 새 BUY ${stateChangeSummary.newBuySignals.length}개와 새 SELL 후보 ${stateChangeSummary.newSellCandidates.length}개가 발생했습니다.`;
}

function buildHoldingSentence(dailyReport: DailyReport): string {
  const holdingCount = dailyReport.holdingsStatus.length;
  const sellCandidateCount = dailyReport.actionSummary.sellCandidateCount;
  const addBuyCount = dailyReport.actionSummary.holdingAddBuy;
  const holdCount = dailyReport.actionSummary.holdingHold;
  const watchCount = dailyReport.actionSummary.holdingWatch;

  return `보유 종목 ${holdingCount}개 중 추가매수 ${addBuyCount}개, 유지 ${holdCount}개, 관찰강화 ${watchCount}개가 식별되었고, 별도 매도 후보는 ${sellCandidateCount}개입니다.`;
}

function buildRiskSentence(dailyReport: DailyReport): string {
  const sellCount = dailyReport.actionSummary.sell;
  const sellCandidates = dailyReport.sellCandidates
    .slice(0, 2)
    .map((item) => item.name);

  if (sellCount === 0) {
    return "현재 즉시 강한 매도 압력은 크지 않지만, 기존 보유 종목의 신호 변화는 계속 추적해야 합니다.";
  }

  if (sellCandidates.length === 0) {
    return `현재 SELL 판단은 총 ${sellCount}건이며, 매도 우선순위 종목의 재검토가 필요합니다.`;
  }

  return `현재 SELL 판단은 총 ${sellCount}건이며, 특히 ${sellCandidates.join(
    ", "
  )} 중심으로 리스크 관리가 필요합니다.`;
}

function buildPublicPortfolioSentence(dailyReport: DailyReport): string {
  return `공개 포트 기준으로는 비중확대 ${dailyReport.publicPortfolioImpact.addCount}개, 유지 ${dailyReport.publicPortfolioImpact.keepCount}개, 비중축소 ${dailyReport.publicPortfolioImpact.reduceCount}개, 제외 검토 ${dailyReport.publicPortfolioImpact.removeCount}개입니다.`;
}

function buildMainSummary(dailyReport: DailyReport): string {
  const finalDecision = dailyReport.finalDecisionSummary;

  return `[${finalDecision.stance}] ${finalDecision.headline} 핵심 초점은 "${finalDecision.primaryFocus}"이며, 현금 비중은 ${finalDecision.cashRatioPercent.toFixed(
    1
  )}% 수준입니다.`;
}

function buildEmphasisBadges(
  dailyReport: DailyReport
): OperationBriefingBadge[] {
  const finalDecision = dailyReport.finalDecisionSummary;

  const stanceTone: OperationBriefingTone =
    finalDecision.stance === "방어 강화"
      ? "sell"
      : finalDecision.stance === "관망 유지"
      ? "neutral"
      : "buy";

  return [
    {
      label: "운영 스탠스",
      value: finalDecision.stance,
      tone: stanceTone,
    },
    {
      label: "핵심 초점",
      value: finalDecision.primaryFocus,
      tone: "hold",
    },
    {
      label: "현금 비중",
      value: `${finalDecision.cashRatioPercent.toFixed(1)}%`,
      tone: "neutral",
    },
    {
      label: "긴급 매도",
      value: `${finalDecision.urgentSellCount}건`,
      tone: finalDecision.urgentSellCount > 0 ? "sell" : "neutral",
    },
  ];
}

function buildExecutionSteps(dailyReport: DailyReport): string[] {
  const steps = [...dailyReport.finalDecisionSummary.topPriorityActions];

  if (dailyReport.portfolioBridge.recommendationToHolding.length > 0) {
    const firstBridge = dailyReport.portfolioBridge.recommendationToHolding[0];
    steps.push(
      `${firstBridge.name} 연결 점검: ${firstBridge.label} 상태이므로 기존 보유와 신규 추천 흐름을 함께 확인합니다.`
    );
  }

  if (dailyReport.publicPortfolioImpact.items.length > 0) {
    const firstPublicItem = dailyReport.publicPortfolioImpact.items[0];
    steps.push(
      `${firstPublicItem.name} 공개 포트 반영 검토: ${firstPublicItem.suggestedAction} 대상으로 분류되었습니다.`
    );
  }

  return steps.slice(0, 4);
}

function buildWatchpoints(
  dailyReport: DailyReport,
  stateChangeSummary: StateChangeSummary
): string[] {
  const watchpoints: string[] = [];

  if (stateChangeSummary.droppedTop10.length > 0) {
    const item = stateChangeSummary.droppedTop10[0];
    watchpoints.push(
      `${item.name}은(는) Top10에서 이탈했습니다. 기존 보유 여부와 신호 약화 원인을 다시 확인해야 합니다.`
    );
  }

  if (dailyReport.portfolioBridge.holdingRiskLinks.length > 0) {
    const item = dailyReport.portfolioBridge.holdingRiskLinks[0];
    watchpoints.push(`${item.name}: ${item.label} 상태. ${item.detail}`);
  }

  if (dailyReport.portfolioBridge.sellExecutionLinks.length > 0) {
    const item = dailyReport.portfolioBridge.sellExecutionLinks[0];
    watchpoints.push(
      `${item.name}: ${item.label} 우선 후보. 반전 조건과 매도 타이밍을 함께 점검합니다.`
    );
  }

  if (dailyReport.publicPortfolioImpact.removeCount > 0) {
    const removalTarget = dailyReport.publicPortfolioImpact.items.find(
      (item) => item.suggestedAction === "제외검토"
    );

    if (removalTarget) {
      watchpoints.push(
        `${removalTarget.name}: 공개 포트 제외 검토 대상입니다. ${removalTarget.reason}`
      );
    }
  }

  if (watchpoints.length === 0) {
    watchpoints.push(
      "오늘은 큰 구조 변화보다 기존 전략 유지와 상위 추천주 점검이 우선입니다."
    );
  }

  return watchpoints.slice(0, 4);
}

export function buildOperationBriefing(
  dailyReport: DailyReport,
  stateChangeSummary: StateChangeSummary
): OperationBriefing {
  const title = "오늘의 운영 브리핑";

  const summary = [
    buildMainSummary(dailyReport),
    buildTopChangeSentence(stateChangeSummary),
    buildHoldingSentence(dailyReport),
    buildPublicPortfolioSentence(dailyReport),
  ].join(" ");

  const bullets = [
    buildRecommendationSentence(dailyReport),
    buildTopChangeSentence(stateChangeSummary),
    buildHoldingSentence(dailyReport),
    buildRiskSentence(dailyReport),
    buildPublicPortfolioSentence(dailyReport),
  ];

  return {
    title,
    summary,
    bullets,
    emphasisBadges: buildEmphasisBadges(dailyReport),
    executionSteps: buildExecutionSteps(dailyReport),
    watchpoints: buildWatchpoints(dailyReport, stateChangeSummary),
  };
}