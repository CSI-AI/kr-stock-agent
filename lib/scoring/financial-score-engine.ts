import type {
  StockFinancialMetrics,
  ScoredStockResult,
} from "@/types/financial";

import type {
  NumericRange,
  StockFilterSet,
} from "@/types/filters";

// -----------------------------
// 유틸
// -----------------------------

function isPresentNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

function isWithinRange(
  value: number | null | undefined,
  range: NumericRange
): boolean {
  if (value === null || value === undefined) return false;
  if (range.min !== null && value < range.min) return false;
  if (range.max !== null && value > range.max) return false;
  return true;
}

function isRangeInactive(range: NumericRange): boolean {
  return range.min === null && range.max === null;
}

// -----------------------------
// 필터
// -----------------------------

export function applyStockFilters(
  stock: StockFinancialMetrics,
  filters: StockFilterSet
) {
  const reasons: string[] = [];

  if (!isRangeInactive(filters.per) && !isWithinRange(stock.per, filters.per)) {
    reasons.push("PER 조건 불일치");
  }

  if (!isRangeInactive(filters.pbr) && !isWithinRange(stock.pbr, filters.pbr)) {
    reasons.push("PBR 조건 불일치");
  }

  if (!isRangeInactive(filters.roe) && !isWithinRange(stock.roe, filters.roe)) {
    reasons.push("ROE 조건 불일치");
  }

  if (
    !isRangeInactive(filters.revenueGrowth) &&
    !isWithinRange(stock.revenueGrowth, filters.revenueGrowth)
  ) {
    reasons.push("매출성장률 조건 불일치");
  }

  if (
    !isRangeInactive(filters.operatingIncomeGrowth) &&
    !isWithinRange(stock.operatingIncomeGrowth, filters.operatingIncomeGrowth)
  ) {
    reasons.push("영업이익성장률 조건 불일치");
  }

  return {
    pass: reasons.length === 0,
    reasons,
  };
}

// -----------------------------
// 뉴스 기반 필터
// -----------------------------

function hasMeaningfulNews(stock: any): boolean {
  const hypothesis = stock.hypothesis || "";
  const evidence = stock.evidence || [];

  if (hypothesis && hypothesis.length > 10) return true;
  if (evidence.length > 0) return true;

  return false;
}

// -----------------------------
// 재무 검증
// -----------------------------

function isFinanciallyHealthy(stock: StockFinancialMetrics): boolean {
  if (!isPresentNumber(stock.roe)) return false;
  if (!isPresentNumber(stock.per)) return false;
  if (!isPresentNumber(stock.pbr)) return false;

  if (stock.roe < 5) return false;
  if (stock.per <= 0 || stock.per > 25) return false;
  if (stock.pbr <= 0 || stock.pbr > 5) return false;

  return true;
}

// -----------------------------
// 메인
// -----------------------------

export function scoreSingleStock(
  stock: StockFinancialMetrics,
  filters: StockFilterSet,
  raw: any
): ScoredStockResult | null {
  // 1. 뉴스 필터
  if (!hasMeaningfulNews(raw)) {
    return null;
  }

  // 2. 재무 필터
  if (!isFinanciallyHealthy(stock)) {
    return null;
  }

  // 3. 기존 필터 적용
  const filterResult = applyStockFilters(stock, filters);
  if (!filterResult.pass) {
    return null;
  }

  return {
    code: stock.code,
    name: stock.name,
    market: stock.market,
    industry: stock.industry,
    currentPrice: stock.currentPrice,
    metrics: stock,
    breakdown: {
      financialQuality: 0,
      growth: 0,
      value: 0,
      shareholderReturn: 0,
      profitabilityStability: 0,
      totalBaseScore: 0,
    },
    totalScore: 0,
    passFilter: true,
    filterReasons: [],
    decision: "BUY",
    decisionReason: raw.hypothesis || "",
  };
}

export function scoreStocks(
  stocks: StockFinancialMetrics[],
  filters: StockFilterSet
): ScoredStockResult[] {
  return stocks
    .map((stock: any) =>
      scoreSingleStock(stock, filters, stock.raw)
    )
    .filter((item): item is ScoredStockResult => item !== null)
    .slice(0, 20);
}