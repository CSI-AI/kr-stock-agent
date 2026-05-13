import type { StateChangeSummary } from "@/lib/operation/build-state-change-summary";

type StateChangeSummaryCardProps = {
  stateChangeSummary: StateChangeSummary;
};

export default function StateChangeSummaryCard({
  stateChangeSummary,
}: StateChangeSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">변화 추적 검증</h2>
          <p className="mt-1 text-sm text-slate-500">
            이전 리포트와 현재 리포트를 비교한 변화 요약입니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            신규 Top {stateChangeSummary.newTop10.length}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            탈락 Top {stateChangeSummary.droppedTop10.length}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            신규 BUY {stateChangeSummary.newBuySignals.length}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            신규 SELL {stateChangeSummary.newSellCandidates.length}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-bold text-emerald-900">
            신규 진입 / 탈락
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-emerald-700">
              신규 Top10 추천
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.newTop10.length > 0 ? (
                stateChangeSummary.newTop10.map((item) => (
                  <div
                    key={`new-top-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  신규 진입 종목이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-rose-700">
              탈락 Top10 추천
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.droppedTop10.length > 0 ? (
                stateChangeSummary.droppedTop10.map((item) => (
                  <div
                    key={`drop-top-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  탈락 종목이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-bold text-blue-900">BUY 신호 변화</div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-blue-700">
              새로 BUY 된 종목
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.newBuySignals.length > 0 ? (
                stateChangeSummary.newBuySignals.map((item) => (
                  <div
                    key={`new-buy-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  새 BUY 신호가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-700">
              BUY에서 빠진 종목
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.removedBuySignals.length > 0 ? (
                stateChangeSummary.removedBuySignals.map((item) => (
                  <div
                    key={`removed-buy-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  BUY에서 빠진 종목이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-bold text-amber-900">SELL 후보 변화</div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-rose-700">
              새 매도 후보
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.newSellCandidates.length > 0 ? (
                stateChangeSummary.newSellCandidates.map((item) => (
                  <div
                    key={`new-sell-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  새 매도 후보가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-emerald-700">
              해소된 매도 후보
            </div>
            <div className="mt-2 space-y-2">
              {stateChangeSummary.resolvedSellCandidates.length > 0 ? (
                stateChangeSummary.resolvedSellCandidates.map((item) => (
                  <div
                    key={`resolved-sell-${item.code}`}
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code}
                    </div>
                    <div className="mt-2 text-xs text-slate-700">
                      {item.reason}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  해소된 매도 후보가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}