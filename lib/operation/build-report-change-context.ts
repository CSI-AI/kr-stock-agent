// @ts-nocheck
import { buildDailyReport, type DailyReport } from "@/lib/operation/build-daily-report";
import {
  buildStateChangeSummary,
  type StateChangeSummary,
} from "@/lib/operation/build-state-change-summary";
import {
  runStrategyEngine,
  type StrategyResult,
} from "@/lib/strategy/strategy-engine";
import type { ScoreWeightSet, StockFilterSet } from "@/types/filters";

export type ReportChangeContext = {
  previousStrategyResult: StrategyResult;
  previousDailyReport: DailyReport;
  stateChangeSummary: StateChangeSummary;
};

function buildPreviousWeights(weights: ScoreWeightSet): ScoreWeightSet {
  return {
    ...weights,
    growth: Math.max(0, weights.growth - 2),
    value: weights.value + 2,
    shareholderReturn: weights.shareholderReturn + 1,
  };
}

function buildPreviousFilters(filters: StockFilterSet): StockFilterSet {
  return {
    ...filters,
    per: {
      min: filters.per.min,
      max:
        filters.per.max === null
          ? 12
          : Math.max(filters.per.max - 2, 5),
    },
    pbr: {
      min: filters.pbr.min,
      max:
        filters.pbr.max === null
          ? 1.2
          : Math.max(filters.pbr.max - 0.2, 0.5),
    },
    dividendYield: {
      min:
        filters.dividendYield.min === null
          ? 1
          : Math.max(filters.dividendYield.min - 1, 0),
      max: filters.dividendYield.max,
    },
  };
}

export function buildReportChangeContext(
  filters: StockFilterSet,
  weights: ScoreWeightSet,
  currentDailyReport: DailyReport
): ReportChangeContext {
  const previousWeights = buildPreviousWeights(weights);
  const previousFilters = buildPreviousFilters(filters);

  const previousStrategyResult = runStrategyEngine(previousFilters, previousWeights);
  const previousDailyReport = buildDailyReport(previousStrategyResult);
  const stateChangeSummary = buildStateChangeSummary(
    previousDailyReport,
    currentDailyReport
  );

  return {
    previousStrategyResult,
    previousDailyReport,
    stateChangeSummary,
  };
}