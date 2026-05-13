import type { StrategyResult } from "@/lib/strategy/strategy-engine";
import {
  formatCurrency,
  formatSignedPercent,
} from "../_utils/strategy-lab-display-utils";

type PortfolioHoldingsTableProps = {
  holdings: StrategyResult["livePortfolioHoldings"];
};

export default function PortfolioHoldingsTable({
  holdings,
}: PortfolioHoldingsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">보유 종목</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-3 py-3">종목</th>
              <th className="px-3 py-3">수량</th>
              <th className="px-3 py-3">평균단가</th>
              <th className="px-3 py-3">현재가</th>
              <th className="px-3 py-3">평가손익</th>
              <th className="px-3 py-3">수익률</th>
              <th className="px-3 py-3">비중</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((item) => (
              <tr
                key={item.code}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-3 py-3 font-semibold">
                  {item.name}
                  <div className="text-xs text-slate-500">{item.code}</div>
                </td>
                <td className="px-3 py-3">
                  {item.quantity.toLocaleString("ko-KR")}
                </td>
                <td className="px-3 py-3">{formatCurrency(item.averagePrice)}</td>
                <td className="px-3 py-3">{formatCurrency(item.currentPrice)}</td>
                <td
                  className={`px-3 py-3 font-medium ${
                    item.unrealizedProfit >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {item.unrealizedProfit > 0 ? "+" : ""}
                  {item.unrealizedProfit.toLocaleString("ko-KR")}원
                </td>
                <td
                  className={`px-3 py-3 font-medium ${
                    item.unrealizedReturnPercent >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {formatSignedPercent(item.unrealizedReturnPercent)}
                </td>
                <td className="px-3 py-3">{item.weightPercent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}