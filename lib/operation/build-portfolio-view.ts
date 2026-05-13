import type {
  StrategyHoldingAnalysisItem,
  StrategyResult,
  StrategySellCandidateAnalysisItem,
} from "@/lib/strategy/strategy-engine";

export type OperationHoldingStatusItem = {
  code: string;
  name: string;
  quantity: number;
  currentPrice: number;
  decision: StrategyHoldingAnalysisItem["decision"];
  hypothesis: string;
  engineSignal: StrategyHoldingAnalysisItem["engineSignal"];
  inTop10: boolean;
  matchedTop10Rank: number | null;
};

export type OperationSellCandidateItem = {
  code: string;
  name: string;
  currentPrice: number;
  targetAction: StrategySellCandidateAnalysisItem["targetAction"];
  hypothesis: string;
  evidence: string[];
  risk: string[];
  reversalCondition: string;
};

export type OperationPortfolioView = {
  holdingsStatus: OperationHoldingStatusItem[];
  sellCandidates: OperationSellCandidateItem[];
};

function mapHoldingStatusItem(
  item: StrategyHoldingAnalysisItem
): OperationHoldingStatusItem {
  return {
    code: item.code,
    name: item.name,
    quantity: item.quantity,
    currentPrice: item.currentPrice,
    decision: item.decision,
    hypothesis: item.hypothesis,
    engineSignal: item.engineSignal,
    inTop10: item.inTop10,
    matchedTop10Rank: item.matchedTop10Rank,
  };
}

function mapSellCandidateItem(
  item: StrategySellCandidateAnalysisItem
): OperationSellCandidateItem {
  return {
    code: item.code,
    name: item.name,
    currentPrice: item.currentPrice,
    targetAction: item.targetAction,
    hypothesis: item.sellHypothesis,
    evidence: item.evidence,
    risk: item.risk,
    reversalCondition: item.reversalCondition,
  };
}

export function buildPortfolioView(
  strategyResult: StrategyResult
): OperationPortfolioView {
  return {
    holdingsStatus: strategyResult.holdingsAnalysis.map(mapHoldingStatusItem),
    sellCandidates: strategyResult.sellCandidates.map(mapSellCandidateItem),
  };
}