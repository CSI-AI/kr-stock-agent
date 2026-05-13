import type { ScoredStockResult, StockScoringInput } from "@/types/scoring";
import type { StockAnalysis } from "@/types/stock";

export function calculateBaseScore(input: StockScoringInput): number {
  const {
    financialQuality,
    growth,
    value,
    industryFit,
    marketPosition,
    repeatability,
    shareholderReturn,
    irConsistency,
  } = input.scoreBreakdown;

  return (
    financialQuality +
    growth +
    value +
    industryFit +
    marketPosition +
    repeatability +
    shareholderReturn +
    irConsistency
  );
}

export function calculateTotalScore(input: StockScoringInput): number {
  return calculateBaseScore(input) + input.scoreBreakdown.newsSignal;
}

export function calculateScoredStocks(
  universe: StockScoringInput[]
): ScoredStockResult[] {
  return universe
    .map((item) => {
      const baseScore = calculateBaseScore(item);
      const totalScore = baseScore + item.scoreBreakdown.newsSignal;

      return {
        ...item,
        baseScore,
        totalScore,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function mapScoredStocksToAnalysis(
  universe: StockScoringInput[]
): StockAnalysis[] {
  return calculateScoredStocks(universe).map((item) => ({
    name: item.name,
    code: item.code,
    totalScore: item.totalScore,
    currentPrice: item.currentPrice,
    buyRange: item.buyRange,
    targetPrice: item.targetPrice,
    hypothesis: item.hypothesis,
    reason: item.reason,
    risk: item.risk,
    reversalCondition: item.reversalCondition,
  }));
}