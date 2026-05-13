import type {
  ScoredStockResult,
  StockRecommendationRationale,
} from "@/types/financial";
import type { AgentAction, AgentStockGrade } from "./agent-decision";

type StrategyPrioritySignal =
  | "STRONG_BUY"
  | "BUY_CANDIDATE"
  | "WATCH"
  | "EXCLUDE";

export type AgentCopyCandidate = ScoredStockResult & {
  grade: AgentStockGrade;
  prioritySignal: StrategyPrioritySignal;
  recommendationRationale: StockRecommendationRationale;
};

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

export function buildGradeReason(item: ScoredStockResult): string {
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

export function buildIndustryRisk(industry: string): string {
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

export function buildHypothesis(item: ScoredStockResult): string {
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

export function buildEvidence(item: AgentCopyCandidate): string[] {
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

export function buildRisk(item: ScoredStockResult): string[] {
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

export function buildInvalidation(item: ScoredStockResult): string[] {
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

export function buildRecommendationReasonShort(
  item: AgentCopyCandidate,
  action: AgentAction
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

export function buildRiskShort(
  item: AgentCopyCandidate,
  action: AgentAction
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

export function buildWhyTodayShort(
  item: AgentCopyCandidate,
  action: AgentAction
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