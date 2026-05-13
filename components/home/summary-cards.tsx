import { portfolioEngineConfig, portfolioMarketCatalog, mockTrades } from "@/data/mock-trades";
import { formatNumber } from "@/components/home/home-format";
import { calculatePortfolioEngineResult } from "@/utils/portfolio/portfolio-engine";

export default function SummaryCards() {
  const { assetSummary } = calculatePortfolioEngineResult({
    trades: mockTrades,
    marketCatalog: portfolioMarketCatalog,
    config: portfolioEngineConfig,
  });

  const items = [
    {
      label: "총 투자금",
      value: `${formatNumber(assetSummary.totalInvestment)}원`,
    },
    {
      label: "평가금액",
      value: `${formatNumber(assetSummary.evaluationAmount)}원`,
    },
    {
      label: "실현손익",
      value: `${formatNumber(assetSummary.realizedProfit)}원`,
    },
    {
      label: "미실현손익",
      value: `${formatNumber(assetSummary.unrealizedProfit)}원`,
    },
    {
      label: "세후 투자수익",
      value: `${formatNumber(assetSummary.taxEffectProfit)}원`,
    },
    {
      label: "세후 배당수입",
      value: `${formatNumber(assetSummary.dividendIncome)}원`,
    },
    {
      label: "보유 현금",
      value: `${formatNumber(assetSummary.cashBalance)}원`,
    },
    {
      label: "보유 종목 수",
      value: `${formatNumber(assetSummary.positionCount)}개`,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className="mt-2 text-2xl font-bold">{item.value}</p>
        </div>
      ))}
    </section>
  );
}