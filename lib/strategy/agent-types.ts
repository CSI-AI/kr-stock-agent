import type { ScoredStockResult } from "@/types/financial";

export type StrategyStockGrade = "S" | "A" | "B" | "C";

export type StrategyPrioritySignal =
  | "STRONG_BUY"
  | "BUY_CANDIDATE"
  | "WATCH"
  | "EXCLUDE";

export type StrategyAgentAction = "BUY" | "HOLD" | "EXCLUDE";

export type StrategyAgentActionLabel = "매수 검토" | "보유 관찰" | "제외";

export type StrategyAgentEvaluationTarget = ScoredStockResult & {
  grade: StrategyStockGrade;
  prioritySignal: StrategyPrioritySignal;
};

export type StrategyAgentDecision = {
  action: StrategyAgentAction;
  reason: string;
};

export type StrategyAgentCopy = {
  recommendationReasonShort: string;
  riskShort: string;
  whyTodayShort: string;
};