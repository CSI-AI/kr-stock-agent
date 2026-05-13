export interface StockScoreBreakdown {
  financialQuality: number;
  growth: number;
  value: number;
  industryFit: number;
  marketPosition: number;
  repeatability: number;
  shareholderReturn: number;
  irConsistency: number;
  newsSignal: number;
}

export interface StockScoringInput {
  name: string;
  code: string;
  currentPrice: number;
  buyRange: {
    min: number;
    max: number;
  };
  targetPrice: number;
  hypothesis: string;
  reason: string[];
  risk: string[];
  reversalCondition: string;
  scoreBreakdown: StockScoreBreakdown;
}

export interface ScoredStockResult extends StockScoringInput {
  baseScore: number;
  totalScore: number;
}

export interface RankedStockResult extends ScoredStockResult {
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  isNewEntry: boolean;
}

export interface RankingDiffResult {
  todayTop: RankedStockResult[];
  previousTop: RankedStockResult[];
  newEntries: RankedStockResult[];
  removedEntries: RankedStockResult[];
  todayUniverseRanked: RankedStockResult[];
  recommendationCutoffRank: number;
}