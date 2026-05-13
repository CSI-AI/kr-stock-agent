import { sellWatchList } from "@/data/mock-dashboard";
import HomeSectionCard from "@/components/home/home-section-card";

export default function SellWatchSection() {
  return (
    <HomeSectionCard
      eyebrow="매도 필요 종목"
      title="Sell Watch"
    >
      <div className="space-y-4">
        {sellWatchList.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl bg-slate-950/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {item.decision}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {item.hypothesis}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-100">근거</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {item.reason.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-300">리스크</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {item.risk.map((risk) => (
                    <li key={risk}>- {risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-slate-200">
              반증 조건: {item.reversalCondition}
            </div>
          </article>
        ))}
      </div>
    </HomeSectionCard>
  );
}