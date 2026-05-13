export type MarketType = "KOSPI" | "KOSDAQ";

export type StockDecision = "BUY" | "HOLD" | "SELL";

// ==============================
// 추천 논리 타입
// ==============================

export type StockRecommendationRationale = {
  hypothesis: string;
  evidence: string[];
  risk: string[];
  invalidation: string[];
};

// ==============================
// 핵심 재무 데이터
// ==============================

export type StockFinancialMetrics = {
  code: string;
  name: string;
  market: MarketType;
  industry: string;
  currentPrice: number;

  per?: number | null;
  pbr?: number | null;
  roe?: number | null;

  revenueGrowth?: number | null;
  operatingIncomeGrowth?: number | null;

  debtRatio?: number | null;

  dividendYield?: number | null;

  operatingMargin?: number | null;
  netMargin?: number | null;

  revenueCagr3Y?: number | null;
  epsGrowth3Y?: number | null;

  marketCapBillionKrw?: number | null;

  latestUpdatedAt?: string;
};

// ==============================
// 점수 breakdown
// ==============================

export type FinancialBreakdown = {
  financialQuality: number;
  growth: number;
  value: number;
  shareholderReturn: number;
  profitabilityStability: number;
  totalBaseScore: number;
};

// ==============================
// 최종 결과
// ==============================

export type ScoredStockResult = {
  code: string;
  name: string;
  market: MarketType;
  industry: string;
  currentPrice: number;

  metrics: StockFinancialMetrics;
  breakdown: FinancialBreakdown;

  totalScore: number;
  passFilter: boolean;
  filterReasons: string[];

  decision: StockDecision;
  decisionReason: string;
};