import type { DailyReport } from "@/lib/operation/build-daily-report";
import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  formatSignedPercent,
  getPublicActionBadgeClass,
} from "../_utils/strategy-lab-display-utils";

type PublishedPortfolioSectionProps = {
  items: StrategyResult["publishedPortfolio"];
  dailyReport: DailyReport;
};

function getSuggestedActionClass(
  action:
    | "신규편입검토"
    | "비중확대검토"
    | "핵심보유유지"
    | "비중축소검토"
    | "제외검토"
): string {
  switch (action) {
    case "신규편입검토":
    case "비중확대검토":
      return "bg-emerald-100 text-emerald-700";
    case "핵심보유유지":
      return "bg-slate-100 text-slate-700";
    case "비중축소검토":
      return "bg-amber-100 text-amber-700";
    case "제외검토":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function PublishedPortfolioSection({
  items,
  dailyReport,
}: PublishedPortfolioSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold">공개 포트폴리오</h2>
          <p className="mt-1 text-sm text-slate-500">
            오늘의 운영 판단이 공개 포트에 어떤 변화로 이어지는지 함께 봅니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            확대 {dailyReport.publicPortfolioImpact.addCount}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            유지 {dailyReport.publicPortfolioImpact.keepCount}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            축소 {dailyReport.publicPortfolioImpact.reduceCount}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            제외 {dailyReport.publicPortfolioImpact.removeCount}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-sm font-bold text-indigo-900">
          오늘 공개 포트 영향 요약
        </div>
        <div className="mt-2 text-sm leading-6 text-slate-700">
          {dailyReport.publicPortfolioImpact.summary}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">비중확대 검토</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {dailyReport.publicPortfolioImpact.addCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">핵심보유 유지</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {dailyReport.publicPortfolioImpact.keepCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">비중축소 검토</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {dailyReport.publicPortfolioImpact.reduceCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">제외 검토</div>
          <div className="mt-2 text-2xl font-bold text-rose-700">
            {dailyReport.publicPortfolioImpact.removeCount}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {items.map((item) => {
          const impactItem = dailyReport.publicPortfolioImpact.items.find(
            (impact) => impact.code === item.code
          );

          return (
            <div
              key={item.code}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{item.code}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPublicActionBadgeClass(
                      item.action
                    )}`}
                  >
                    현재 {item.action}
                  </span>

                  {impactItem ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSuggestedActionClass(
                        impactItem.suggestedAction
                      )}`}
                    >
                      오늘 {impactItem.suggestedAction}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">비중</div>
                  <div className="mt-1 font-bold text-slate-900">
                    {item.weightPercent}%
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">수익률</div>
                  <div
                    className={`mt-1 font-bold ${
                      item.unrealizedReturnPercent >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {formatSignedPercent(item.unrealizedReturnPercent)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-500">
                  오늘 공개 포트 판단
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {impactItem?.reason ?? item.thesis}
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-700">{item.thesis}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}