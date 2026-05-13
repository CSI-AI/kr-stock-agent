import type { StrategyResult } from "@/lib/strategy/strategy-engine";

type TodayRecommendationsSectionProps = {
  items: StrategyResult["dailyRecommended"];
};

function formatCurrency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getActionBadgeClass(action: "BUY" | "HOLD" | "EXCLUDE") {
  if (action === "BUY") {
    return "bg-emerald-600 text-white";
  }

  if (action === "HOLD") {
    return "bg-amber-500 text-white";
  }

  return "bg-slate-400 text-white";
}

function getActionPanelClass(action: "BUY" | "HOLD" | "EXCLUDE") {
  if (action === "BUY") {
    return "border-emerald-200 bg-emerald-50";
  }

  if (action === "HOLD") {
    return "border-amber-200 bg-amber-50";
  }

  return "border-slate-200 bg-slate-50";
}

export default function TodayRecommendationsSection({
  items,
}: TodayRecommendationsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            오늘 실제로 볼 종목
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            점수 상위 종목 중에서도 보수적 판단을 다시 거쳐
            BUY 또는 HOLD만 보여줍니다.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {items.length}개
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          오늘은 보수 기준을 만족하는 BUY / HOLD 후보가 없습니다.
          <br />
          무리하게 추천하지 않고 관망하는 것이 현재 기준에 더 맞습니다.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.code}
              className={`rounded-3xl border p-5 shadow-sm ${getActionPanelClass(
                item.agentAction
              )}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {item.recommendationLabel}
                  </div>

                  <div className="mt-3 text-lg font-bold text-slate-900">
                    {item.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {item.code} · {item.market} · {item.industry}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getActionBadgeClass(
                    item.agentAction
                  )}`}
                >
                  {item.agentActionLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white p-3">
                  <div className="text-xs text-slate-500">현재가</div>
                  <div className="mt-1 text-base font-bold text-slate-900">
                    {formatCurrency(item.currentPrice)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white p-3">
                  <div className="text-xs text-slate-500">보수 점수</div>
                  <div className="mt-1 text-base font-bold text-slate-900">
                    {item.totalScore.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">
                  추천 이유
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-900">
                  {item.recommendationReasonShort}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">
                  리스크
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-rose-700">
                  {item.riskShort}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">
                  왜 오늘 봐야 하나
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-900">
                  {item.whyTodayShort}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/70 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">
                  에이전트 판단 근거
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  {item.agentDecisionReason}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}