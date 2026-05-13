import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  buildLinePath,
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from "../_utils/strategy-lab-display-utils";

type AssetOverviewCardProps = {
  strategyResult: StrategyResult;
};

export default function AssetOverviewCard({
  strategyResult,
}: AssetOverviewCardProps) {
  const chartPath = buildLinePath(
    strategyResult.assetHistory.map((item) => item.totalAsset),
    1000,
    260
  );

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-500">전체 자산</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {formatCurrency(strategyResult.assetChartSummary.latestAsset)}
          </div>
          <div
            className={`mt-2 text-sm font-semibold ${
              strategyResult.assetChartSummary.dayChangeAmount >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            오늘{" "}
            {formatSignedCurrency(
              strategyResult.assetChartSummary.dayChangeAmount
            )}{" "}
            ·{" "}
            {formatSignedPercent(
              strategyResult.assetChartSummary.dayChangePercent
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">시작</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {formatCurrency(strategyResult.assetChartSummary.startAsset)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">최고</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {formatCurrency(strategyResult.assetChartSummary.highAsset)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">최저</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {formatCurrency(strategyResult.assetChartSummary.lowAsset)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">누적</div>
            <div
              className={`mt-1 text-sm font-bold ${
                strategyResult.livePortfolioSummary.cumulativeReturnPercent >= 0
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {formatSignedPercent(
                strategyResult.livePortfolioSummary.cumulativeReturnPercent
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="h-[280px] w-full">
          <svg
            viewBox="0 0 1000 260"
            className="h-full w-full"
            preserveAspectRatio="none"
          >
            <path
              d={chartPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-900"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{strategyResult.assetChartSummary.firstDate}</span>
          <span>{strategyResult.assetChartSummary.lastDate}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">1주 변화</div>
          <div
            className={`mt-1 text-lg font-bold ${
              strategyResult.assetChartSummary.oneWeekChangeAmount >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {formatSignedCurrency(
              strategyResult.assetChartSummary.oneWeekChangeAmount
            )}
          </div>
          <div
            className={`mt-1 text-sm ${
              strategyResult.assetChartSummary.oneWeekChangePercent >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {formatSignedPercent(
              strategyResult.assetChartSummary.oneWeekChangePercent
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">1개월 변화</div>
          <div
            className={`mt-1 text-lg font-bold ${
              strategyResult.assetChartSummary.oneMonthChangeAmount >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {formatSignedCurrency(
              strategyResult.assetChartSummary.oneMonthChangeAmount
            )}
          </div>
          <div
            className={`mt-1 text-sm ${
              strategyResult.assetChartSummary.oneMonthChangePercent >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {formatSignedPercent(
              strategyResult.assetChartSummary.oneMonthChangePercent
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">최근 거래일</div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {strategyResult.tradeHistorySummary.latestTradeDate}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            매수 {strategyResult.tradeHistorySummary.buyCount} · 매도{" "}
            {strategyResult.tradeHistorySummary.sellCount}
          </div>
        </div>
      </div>
    </div>
  );
}