import type { StrategyResult } from "@/lib/strategy/strategy-engine";

export type OperationActionSummary = {
  buy: number;
  hold: number;
  sell: number;
  recommendationBuy: number;
  recommendationHold: number;
  recommendationSell: number;
  holdingAddBuy: number;
  holdingHold: number;
  holdingPartialSell: number;
  holdingFullSell: number;
  holdingWatch: number;
  sellCandidateCount: number;
};

export function buildActionSummary(
  strategyResult: StrategyResult
): OperationActionSummary {
  return {
    buy: strategyResult.actionBoard.buy.length,
    hold: strategyResult.actionBoard.hold.length,
    sell: strategyResult.actionBoard.sell.length,
    recommendationBuy: strategyResult.dailyRecommended.filter(
      (item) => item.decision === "BUY"
    ).length,
    recommendationHold: strategyResult.dailyRecommended.filter(
      (item) => item.decision === "HOLD"
    ).length,
    recommendationSell: strategyResult.dailyRecommended.filter(
      (item) => item.decision === "SELL"
    ).length,
    holdingAddBuy: strategyResult.holdingsAnalysis.filter(
      (item) => item.decision === "추가매수"
    ).length,
    holdingHold: strategyResult.holdingsAnalysis.filter(
      (item) => item.decision === "유지"
    ).length,
    holdingPartialSell: strategyResult.holdingsAnalysis.filter(
      (item) => item.decision === "일부매도"
    ).length,
    holdingFullSell: strategyResult.holdingsAnalysis.filter(
      (item) => item.decision === "전량매도"
    ).length,
    holdingWatch: strategyResult.holdingsAnalysis.filter(
      (item) => item.decision === "관찰강화"
    ).length,
    sellCandidateCount: strategyResult.sellCandidates.length,
  };
}