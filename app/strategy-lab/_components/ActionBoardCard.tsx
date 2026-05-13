import type { StrategyResult } from "@/lib/strategy/strategy-engine";

type ActionBoardCardProps = {
  actionBoard: StrategyResult["actionBoard"];
};

export default function ActionBoardCard({
  actionBoard,
}: ActionBoardCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">오늘 할 일</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            매수 {actionBoard.buy.length}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            보유 {actionBoard.hold.length}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            매도 {actionBoard.sell.length}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            확인 {actionBoard.check.length}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        <div
          id="action-buy"
          className="scroll-mt-24 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <div className="text-sm font-bold text-emerald-900">매수</div>
          <div className="mt-3 space-y-3">
            {actionBoard.buy.length > 0 ? (
              actionBoard.buy.map((item) => (
                <div key={`buy-${item.code}`} className="rounded-xl bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      BUY
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.subtitle}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {item.reason}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                오늘 매수 우선 종목이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div
          id="action-hold"
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="text-sm font-bold text-slate-900">보유</div>
          <div className="mt-3 space-y-3">
            {actionBoard.hold.length > 0 ? (
              actionBoard.hold.map((item) => (
                <div key={`hold-${item.code}`} className="rounded-xl bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code}
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      HOLD
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.subtitle}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {item.reason}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                보유 유지 종목이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div
          id="action-sell"
          className="scroll-mt-24 rounded-2xl border border-rose-200 bg-rose-50 p-4"
        >
          <div className="text-sm font-bold text-rose-900">매도</div>
          <div className="mt-3 space-y-3">
            {actionBoard.sell.length > 0 ? (
              actionBoard.sell.map((item) => (
                <div key={`sell-${item.code}`} className="rounded-xl bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code}
                      </div>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700">
                      SELL
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.subtitle}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {item.reason}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                오늘 매도 우선 종목이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div
          id="action-check"
          className="scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="text-sm font-bold text-amber-900">우선 확인</div>
          <div className="mt-3 space-y-3">
            {actionBoard.check.length > 0 ? (
              actionBoard.check.map((item) => (
                <div key={`check-${item.code}`} className="rounded-xl bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                      CHECK
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.subtitle}
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    {item.reason}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                우선 확인 종목이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}