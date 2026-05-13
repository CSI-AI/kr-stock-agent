import type { DailyReport } from "@/lib/operation/build-daily-report";
import type { StrategyResult } from "@/lib/strategy/strategy-engine";

type TodayExecutionSummaryCardProps = {
  actionBoard: StrategyResult["actionBoard"];
  dailyReport: DailyReport;
};

function getBuyLabel(index: number) {
  if (index === 0) return "🔥 최우선 매수";
  if (index === 1) return "⚡ 보조 매수";
  return "매수 후보";
}

function getSellLabel(index: number) {
  if (index === 0) return "🔴 즉시 축소";
  if (index === 1) return "🟡 점진 축소";
  return "매도 후보";
}

function getHoldLabel(index: number) {
  if (index === 0) return "🛡 핵심 유지";
  if (index === 1) return "👀 관찰 유지";
  return "보유";
}

function scrollToSection(id: string) {
  if (typeof window === "undefined") return;

  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function TodayExecutionSummaryCard({
  actionBoard,
  dailyReport,
}: TodayExecutionSummaryCardProps) {
  const topBuy = actionBoard.buy.slice(0, 2);
  const topSell = actionBoard.sell.slice(0, 2);
  const topHold = actionBoard.hold.slice(0, 2);
  const impact = dailyReport.publicPortfolioImpact;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900">
            오늘 실제 할 일 요약
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            오늘 실행해야 할 핵심 액션만 먼저 정리합니다.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          {dailyReport.finalDecisionSummary.stance}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4">
          <div className="text-xs text-slate-500">신규 매수</div>

          <div className="mt-2 space-y-2 text-sm">
            {topBuy.length > 0 ? (
              topBuy.map((item, idx) => (
                <button
                  key={`summary-buy-${item.code}`}
                  type="button"
                  onClick={() => scrollToSection("action-buy")}
                  className="flex w-full flex-col rounded-lg px-1 py-1 text-left hover:bg-emerald-50"
                >
                  <span className="font-semibold text-emerald-700">
                    {item.name}
                  </span>
                  <span className="text-xs text-emerald-600">
                    {getBuyLabel(idx)}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-slate-400">없음</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4">
          <div className="text-xs text-slate-500">비중 축소 / 매도</div>

          <div className="mt-2 space-y-2 text-sm">
            {topSell.length > 0 ? (
              topSell.map((item, idx) => (
                <button
                  key={`summary-sell-${item.code}`}
                  type="button"
                  onClick={() => scrollToSection("action-sell")}
                  className="flex w-full flex-col rounded-lg px-1 py-1 text-left hover:bg-rose-50"
                >
                  <span className="font-semibold text-rose-700">
                    {item.name}
                  </span>
                  <span className="text-xs text-rose-600">
                    {getSellLabel(idx)}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-slate-400">없음</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4">
          <div className="text-xs text-slate-500">핵심 보유 유지</div>

          <div className="mt-2 space-y-2 text-sm">
            {topHold.length > 0 ? (
              topHold.map((item, idx) => (
                <button
                  key={`summary-hold-${item.code}`}
                  type="button"
                  onClick={() => scrollToSection("action-hold")}
                  className="flex w-full flex-col rounded-lg px-1 py-1 text-left hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {getHoldLabel(idx)}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-slate-400">없음</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4">
          <div className="text-xs text-slate-500">공개 포트 영향</div>

          <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
            확대 {impact.addCount} / 유지 {impact.keepCount}
            <br />
            축소 {impact.reduceCount} / 제외 {impact.removeCount}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
        <div className="text-xs font-semibold text-slate-500">오늘 결론</div>
        <div className="mt-2 text-sm leading-6 text-slate-800">
          {dailyReport.finalDecisionSummary.headline}
        </div>
      </div>
    </div>
  );
}