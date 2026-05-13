import { portfolioEngineConfig, portfolioMarketCatalog, mockTrades } from "@/data/mock-trades";
import { formatNumber } from "@/components/home/home-format";
import HomeSectionCard from "@/components/home/home-section-card";
import { calculatePortfolioEngineResult } from "@/utils/portfolio/portfolio-engine";

export default function TradeLogSection() {
  const { tradeLogs } = calculatePortfolioEngineResult({
    trades: mockTrades,
    marketCatalog: portfolioMarketCatalog,
    config: portfolioEngineConfig,
  });

  return (
    <HomeSectionCard eyebrow="입력 거래 로그" title="Trade Log">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4">일자</th>
              <th className="px-4">구분</th>
              <th className="px-4">종목명</th>
              <th className="px-4">수량</th>
              <th className="px-4">가격</th>
              <th className="px-4">수수료</th>
              <th className="px-4">세금</th>
              <th className="px-4">메모</th>
            </tr>
          </thead>

          <tbody>
            {tradeLogs.map((trade, index) => (
              <tr
                key={`${trade.code}-${trade.date}-${trade.kind}-${index}`}
                className="rounded-2xl bg-slate-950/70"
              >
                <td className="rounded-l-2xl px-4 py-4">{trade.date}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
                    {trade.kind === "buy" ? "매수" : "매도"}
                  </span>
                </td>
                <td className="px-4 py-4">{trade.stockName}</td>
                <td className="px-4 py-4">{formatNumber(trade.quantity)}</td>
                <td className="px-4 py-4">{formatNumber(trade.price)}원</td>
                <td className="px-4 py-4">{formatNumber(trade.fee)}원</td>
                <td className="px-4 py-4">
                  {trade.kind === "sell" ? `${formatNumber(trade.tax)}원` : "-"}
                </td>
                <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-300">
                  {trade.memo ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </HomeSectionCard>
  );
}