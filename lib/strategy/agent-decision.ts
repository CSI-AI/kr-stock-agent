import type { ScoredStockResult } from "@/types/financial";

export type AgentStockGrade = "S" | "A" | "B" | "C";
export type AgentAction = "BUY" | "HOLD" | "EXCLUDE";

type AgentDecisionCandidate = ScoredStockResult & {
  grade: AgentStockGrade;
};

export type AgentDecisionResult = {
  action: AgentAction;
  reason: string;
};

function hasNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

function getMetricOrFallback(
  value: number | null | undefined,
  fallback: number
): number {
  return hasNumber(value) ? value : fallback;
}

export function getAgentActionLabel(
  action: AgentAction
): "매수 검토" | "보유 관찰" | "제외" {
  if (action === "BUY") {
    return "매수 검토";
  }

  if (action === "HOLD") {
    return "보유 관찰";
  }

  return "제외";
}

export function evaluateAgentAction(
  item: AgentDecisionCandidate
): AgentDecisionResult {
  const { totalScore, metrics, grade } = item;

  const marketCap = getMetricOrFallback(metrics.marketCapBillionKrw, 0);
  const per = getMetricOrFallback(metrics.per, 999);
  const pbr = getMetricOrFallback(metrics.pbr, 999);
  const roe = getMetricOrFallback(metrics.roe, 0);
  const debtRatio = getMetricOrFallback(metrics.debtRatio, 999);
  const revenueGrowth = getMetricOrFallback(metrics.revenueGrowth, -999);
  const operatingIncomeGrowth = getMetricOrFallback(
    metrics.operatingIncomeGrowth,
    -999
  );
  const dividendYield = getMetricOrFallback(metrics.dividendYield, 0);
  const operatingMargin = getMetricOrFallback(metrics.operatingMargin, -999);

  const passesStrictProfitability =
    roe >= 10 && (operatingMargin >= 8 || operatingIncomeGrowth >= 5);

  const passesStrictValue = per <= 12 && pbr <= 1.5;

  const passesStrictSafety = marketCap >= 500 && debtRatio <= 120;

  const passesStrictMomentum =
    revenueGrowth >= 3 ||
    operatingIncomeGrowth >= 3 ||
    dividendYield >= 2;

  const passesBuy =
    totalScore >= 75 &&
    (grade === "S" || grade === "A") &&
    passesStrictProfitability &&
    passesStrictValue &&
    passesStrictSafety &&
    passesStrictMomentum;

  if (passesBuy) {
    return {
      action: "BUY",
      reason:
        "총점, 수익성, 밸류, 재무안정성 기준을 모두 강하게 통과해 오늘 매수 검토 대상으로 분류했습니다.",
    };
  }

  const passesHold =
    totalScore >= 60 &&
    marketCap >= 500 &&
    per <= 15 &&
    pbr <= 1.8 &&
    roe >= 8 &&
    debtRatio <= 150 &&
    (revenueGrowth >= 0 ||
      operatingIncomeGrowth >= 0 ||
      dividendYield >= 1.5);

  if (passesHold) {
    return {
      action: "HOLD",
      reason:
        "기본 보수 기준은 통과했지만 지금 바로 매수로 밀어붙일 만큼 강한 확신은 부족해 보유 관찰로 분류했습니다.",
    };
  }

  return {
    action: "EXCLUDE",
    reason:
      "점수 또는 핵심 재무 조건이 현재 보수 기준에 충분히 강하지 않아 오늘 추천 목록에서는 제외했습니다.",
  };
}