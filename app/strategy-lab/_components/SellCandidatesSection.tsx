import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import { getTradeBadgeClass } from "../_utils/strategy-lab-display-utils";

type SellCandidatesSectionProps = {
  items: StrategyResult["sellCandidates"];
};

export default function SellCandidatesSection({
  items,
}: SellCandidatesSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">매도 후보</h2>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.code}
              className="rounded-xl border border-rose-200 bg-rose-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-rose-900">{item.name}</div>
                  <div className="mt-1 text-xs text-rose-700">{item.code}</div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTradeBadgeClass(
                    item.targetAction === "전량매도" ||
                      item.targetAction === "일부매도"
                      ? "SELL"
                      : "BUY"
                  )}`}
                >
                  {item.targetAction}
                </span>
              </div>

              <div className="mt-3 text-sm text-rose-900">
                {item.sellHypothesis}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            매도 후보가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}