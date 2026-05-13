import type {
  RankedStockResult,
  RankingDiffResult,
  StockScoringInput,
} from "@/types/scoring";
import { calculateScoredStocks } from "@/utils/scoring/scoring-engine";

function limitTopItems<T>(items: T[], topN: number): T[] {
  return items.slice(0, topN);
}

export function calculateRankingDiff(params: {
  todayUniverse: StockScoringInput[];
  previousUniverse: StockScoringInput[];
  topN?: number;
}): RankingDiffResult {
  const { todayUniverse, previousUniverse, topN = 10 } = params;

  const todayUniverseScored = calculateScoredStocks(todayUniverse);
  const previousUniverseScored = calculateScoredStocks(previousUniverse);

  const todayScored = limitTopItems(todayUniverseScored, topN);
  const previousScored = limitTopItems(previousUniverseScored, topN);

  const previousRankMap = new Map<string, number>();
  previousScored.forEach((item, index) => {
    previousRankMap.set(item.code, index + 1);
  });

  const todayUniverseRanked: RankedStockResult[] = todayUniverseScored.map(
    (item, index) => {
      const currentRank = index + 1;
      const previousRank = previousRankMap.get(item.code) ?? null;

      return {
        ...item,
        rank: currentRank,
        previousRank,
        rankChange: previousRank === null ? null : previousRank - currentRank,
        isNewEntry: previousRank === null,
      };
    }
  );

  const todayTop = todayUniverseRanked.slice(0, topN);

  const todayCodeSet = new Set(todayTop.map((item) => item.code));

  const removedEntries: RankedStockResult[] = previousScored
    .filter((item) => !todayCodeSet.has(item.code))
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      previousRank: index + 1,
      rankChange: null,
      isNewEntry: false,
    }));

  const newEntries = todayTop.filter((item) => item.isNewEntry);

  const previousTop: RankedStockResult[] = previousScored.map((item, index) => ({
    ...item,
    rank: index + 1,
    previousRank: index + 1,
    rankChange: 0,
    isNewEntry: false,
  }));

  return {
    todayTop,
    previousTop,
    newEntries,
    removedEntries,
    todayUniverseRanked,
    recommendationCutoffRank: topN,
  };
}