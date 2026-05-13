import { portfolioEngineConfig, portfolioMarketCatalog, mockTrades } from "@/data/mock-trades";
import { formatNumber } from "@/components/home/home-format";
import HomeSectionCard from "@/components/home/home-section-card";
import { calculatePortfolioEngineResult } from "@/utils/portfolio/portfolio-engine";

export default function PortfolioSection() {
  const { portfolioItems } = calculatePortfolioEngineResult({
    trades: mockTrades,
    marketCatalog: portfolioMarketCatalog,
    config: portfolioEngineConfig,
  });

  return (
    <HomeSectionCard eyebrow="보유 종목 전체" title="Portfolio">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4">종목명</th>
              <th className="px-4">수량</th>
              <th className="px-4">평균단가</th>
              <th className="px-4">현재가</th>
              <th className="px-4">투입금액</th>
              <th className="px-4">평가금액</th>
              <th className="px-4">평가손익</th>
              <th className="px-4">수익률</th>
              <th className="px-4">목표가</th>
              <th className="px-4">판단</th>
            </tr>
          </thead>

          <tbody>
            {portfolioItems.map((item) => (
              <tr key={item.code} className="rounded-2xl bg-slate-950/70">
                <td className="rounded-l-2xl px-4 py-4 font-medium">{item.name}</td>
                <td className="px-4 py-4">{formatNumber(item.quantity)}</td>
                <td className="px-4 py-4">{formatNumber(item.avgPurchasePrice)}원</td>
                <td className="px-4 py-4">{formatNumber(item.currentPrice)}원</td>
                <td className="px-4 py-4">{formatNumber(item.investedAmount)}원</td>
                <td className="px-4 py-4">{formatNumber(item.evaluationAmount)}원</td>
                <td className="px-4 py-4">{formatNumber(item.evaluationProfit)}원</td>
                <td className="px-4 py-4">{item.evaluationProfitRate}%</td>
                <td className="px-4 py-4">{formatNumber(item.targetPrice)}원</td>
                <td className="rounded-r-2xl px-4 py-4">
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
                    {item.decision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </HomeSectionCard>
  );
}