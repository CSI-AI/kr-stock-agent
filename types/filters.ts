export type MarketType = "KOSPI" | "KOSDAQ" | "KONEX" | "ETF" | "UNKNOWN";

export type SortDirection = "asc" | "desc";

export type NumericRange = {
  min: number | null;
  max: number | null;
};

export interface StockFilterSet {
  per: NumericRange;
  pbr: NumericRange;
  roe: NumericRange;
  revenueGrowth: NumericRange;
  operatingIncomeGrowth: NumericRange;
  debtRatio: NumericRange;
  dividendYield: NumericRange;
  marketCapBillionKrw: NumericRange;
  industries: string[];
  markets: MarketType[];
}

export interface ScoreWeightSet {
  financialQuality: number;
  growth: number;
  value: number;
  shareholderReturn: number;
  profitabilityStability: number;
}

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  filters: StockFilterSet;
  weights: ScoreWeightSet;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyPresetInput {
  name: string;
  description?: string;
  filters?: Partial<StockFilterSet>;
  weights?: Partial<ScoreWeightSet>;
  isDefault?: boolean;
}

export function createEmptyRange(): NumericRange {
  return {
    min: null,
    max: null,
  };
}

export function createDefaultStockFilterSet(): StockFilterSet {
  return {
    per: createEmptyRange(),
    pbr: createEmptyRange(),
    roe: createEmptyRange(),
    revenueGrowth: createEmptyRange(),
    operatingIncomeGrowth: createEmptyRange(),
    debtRatio: createEmptyRange(),
    dividendYield: createEmptyRange(),
    marketCapBillionKrw: createEmptyRange(),
    industries: [],
    markets: [],
  };
}

export function createDefaultScoreWeightSet(): ScoreWeightSet {
  return {
    financialQuality: 25,
    growth: 20,
    value: 20,
    shareholderReturn: 5,
    profitabilityStability: 10,
  };
}

export function createDefaultStrategyPreset(): StrategyPreset {
  const now = new Date().toISOString();

  return {
    id: "preset-default",
    name: "기본 전략",
    description: "기본 재무 필터와 기본 점수 가중치",
    filters: createDefaultStockFilterSet(),
    weights: createDefaultScoreWeightSet(),
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function mergeFilterSet(
  base: StockFilterSet,
  patch?: Partial<StockFilterSet>
): StockFilterSet {
  if (!patch) {
    return base;
  }

  return {
    per: patch.per ?? base.per,
    pbr: patch.pbr ?? base.pbr,
    roe: patch.roe ?? base.roe,
    revenueGrowth: patch.revenueGrowth ?? base.revenueGrowth,
    operatingIncomeGrowth:
      patch.operatingIncomeGrowth ?? base.operatingIncomeGrowth,
    debtRatio: patch.debtRatio ?? base.debtRatio,
    dividendYield: patch.dividendYield ?? base.dividendYield,
    marketCapBillionKrw:
      patch.marketCapBillionKrw ?? base.marketCapBillionKrw,
    industries: patch.industries ?? base.industries,
    markets: patch.markets ?? base.markets,
  };
}

export function mergeWeightSet(
  base: ScoreWeightSet,
  patch?: Partial<ScoreWeightSet>
): ScoreWeightSet {
  if (!patch) {
    return base;
  }

  return {
    financialQuality: patch.financialQuality ?? base.financialQuality,
    growth: patch.growth ?? base.growth,
    value: patch.value ?? base.value,
    shareholderReturn: patch.shareholderReturn ?? base.shareholderReturn,
    profitabilityStability:
      patch.profitabilityStability ?? base.profitabilityStability,
  };
}