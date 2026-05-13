import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  getGradeBadgeClass,
  getPrioritySignalBadgeClass,
} from "../_utils/strategy-lab-display-utils";

type NewEntriesSectionProps = {
  items: StrategyResult["newEntries"];
};

export default function NewEntriesSection({
  items,
}: NewEntriesSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">신규 편입</h2>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.code}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-emerald-900">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">
                    {item.code}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getGradeBadgeClass(
                      item.grade
                    )}`}
                  >
                    {item.grade}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPrioritySignalBadgeClass(
                      item.prioritySignal
                    )}`}
                  >
                    {item.prioritySignal}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-emerald-800">
                {item.gradeReason}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            신규 편입 후보가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}