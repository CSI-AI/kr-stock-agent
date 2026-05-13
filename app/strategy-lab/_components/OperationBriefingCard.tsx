import type { DailyReport } from "@/lib/operation/build-daily-report";
import type {
  OperationBriefing,
  OperationBriefingTone,
} from "@/lib/operation/build-operation-briefing";

type OperationBriefingCardProps = {
  operationBriefing: OperationBriefing;
  dailyReport: DailyReport;
};

function getBadgeClass(tone: OperationBriefingTone): string {
  switch (tone) {
    case "buy":
      return "bg-emerald-500/20 text-emerald-300";
    case "hold":
      return "bg-blue-500/20 text-blue-200";
    case "sell":
      return "bg-rose-500/20 text-rose-300";
    default:
      return "bg-slate-500/20 text-slate-200";
  }
}

export default function OperationBriefingCard({
  operationBriefing,
  dailyReport,
}: OperationBriefingCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="text-sm font-semibold text-slate-300">
            {operationBriefing.title}
          </div>

          <div className="mt-2 text-xl font-bold leading-8 text-white">
            {dailyReport.finalDecisionSummary.stance}
          </div>

          <div className="mt-2 text-base leading-7 text-slate-100">
            {operationBriefing.summary}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            BUY {dailyReport.actionSummary.buy}
          </span>
          <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-200">
            HOLD {dailyReport.actionSummary.hold}
          </span>
          <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300">
            SELL {dailyReport.actionSummary.sell}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {operationBriefing.emphasisBadges.map((badge, index) => (
          <span
            key={`${badge.label}-${index}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
              badge.tone
            )}`}
          >
            {badge.label} · {badge.value}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {operationBriefing.bullets.map((bullet, index) => (
          <div
            key={`briefing-bullet-${index}`}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm leading-6 text-slate-200"
          >
            {bullet}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-sm font-bold text-white">오늘 바로 볼 것</div>
          <div className="mt-3 space-y-2">
            {operationBriefing.executionSteps.map((step, index) => (
              <div
                key={`execution-step-${index}`}
                className="rounded-xl bg-slate-900/60 px-3 py-3 text-sm leading-6 text-slate-200"
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-sm font-bold text-white">주의 포인트</div>
          <div className="mt-3 space-y-2">
            {operationBriefing.watchpoints.map((point, index) => (
              <div
                key={`watchpoint-${index}`}
                className="rounded-xl bg-slate-900/60 px-3 py-3 text-sm leading-6 text-slate-200"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}