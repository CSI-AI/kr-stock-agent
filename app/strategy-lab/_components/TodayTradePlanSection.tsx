import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  formatCurrency,
  getTradeBadgeClass,
} from "../_utils/strategy-lab-display-utils";

type TodayTradePlanSectionProps = {
  items: StrategyResult["todayTradePlan"];
};

export default function TodayTradePlanSection({
  items,
}: TodayTradePlanSectionProps) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-violet-900">오늘 매매</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-violet-800">
          {items.length}건
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.code}-${index}`}
            className="rounded-2xl border border-violet-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold text-slate-900">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.code}</div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTradeBadgeClass(
                  item.type
                )}`}
              >
                {item.type}
              </span>
            </div>

            <div className="mt-3 text-sm text-slate-700">{item.reason}</div>

            <div className="mt-3 text-xs text-slate-500">
              기준가 {formatCurrency(item.currentPrice)}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            오늘 실행할 매매 계획이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}