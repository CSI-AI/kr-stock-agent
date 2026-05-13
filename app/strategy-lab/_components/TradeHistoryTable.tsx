import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  formatCurrency,
  getTradeBadgeClass,
} from "../_utils/strategy-lab-display-utils";

type TradeHistoryTableProps = {
  tradeHistorySummary: StrategyResult["tradeHistorySummary"];
  tradeHistory: StrategyResult["tradeHistory"];
};

export default function TradeHistoryTable({
  tradeHistorySummary,
  tradeHistory,
}: TradeHistoryTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">거래 기록</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">누적 매수</div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(tradeHistorySummary.totalBuyAmount)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">누적 매도</div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(tradeHistorySummary.totalSellAmount)}
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-3 py-3">날짜</th>
              <th className="px-3 py-3">구분</th>
              <th className="px-3 py-3">종목</th>
              <th className="px-3 py-3">수량</th>
              <th className="px-3 py-3">가격</th>
              <th className="px-3 py-3">금액</th>
            </tr>
          </thead>
          <tbody>
            {tradeHistory.map((item, index) => (
              <tr
                key={`${item.date}-${item.code}-${index}`}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-3 py-3">{item.date}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTradeBadgeClass(
                      item.action
                    )}`}
                  >
                    {item.action}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold">
                  {item.name}
                  <div className="text-xs text-slate-500">{item.code}</div>
                </td>
                <td className="px-3 py-3">
                  {item.quantity.toLocaleString("ko-KR")}
                </td>
                <td className="px-3 py-3">{formatCurrency(item.price)}</td>
                <td className="px-3 py-3">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}