import type {
  ComputedAssetSummary,
  ComputedPortfolioItem,
  PortfolioEngineConfig,
  PortfolioEngineResult,
  PortfolioMarketMeta,
  TradeInput,
} from "@/types/trade";

interface PositionState {
  name: string;
  code: string;
  quantity: number;
  totalCost: number;
}

function roundToInt(value: number) {
  return Math.round(value);
}

export function calculatePortfolioEngineResult(params: {
  trades: TradeInput[];
  marketCatalog: Record<string, PortfolioMarketMeta>;
  config: PortfolioEngineConfig;
}): PortfolioEngineResult {
  const { trades, marketCatalog, config } = params;

  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  const positions = new Map<string, PositionState>();

  let cashBalance = config.startingCashBalance;
  let realizedProfit = 0;

  for (const trade of sortedTrades) {
    const existing =
      positions.get(trade.code) ??
      ({
        name: trade.stockName,
        code: trade.code,
        quantity: 0,
        totalCost: 0,
      } satisfies PositionState);

    if (trade.kind === "buy") {
      const buyAmount = trade.quantity * trade.price + trade.fee;

      existing.quantity += trade.quantity;
      existing.totalCost += buyAmount;

      cashBalance -= buyAmount;

      positions.set(trade.code, existing);
      continue;
    }

    const averageCostPerShare =
      existing.quantity > 0 ? existing.totalCost / existing.quantity : 0;

    const removedCost = averageCostPerShare * trade.quantity;
    const sellNetAmount = trade.quantity * trade.price - trade.fee - trade.tax;

    existing.quantity -= trade.quantity;
    existing.totalCost -= removedCost;

    if (existing.quantity < 0) {
      existing.quantity = 0;
    }

    if (existing.totalCost < 0) {
      existing.totalCost = 0;
    }

    realizedProfit += sellNetAmount - removedCost;
    cashBalance += sellNetAmount;

    positions.set(trade.code, existing);
  }

  cashBalance += config.dividendIncomeAfterTax;

  const portfolioItems: ComputedPortfolioItem[] = [];

  let evaluationAmount = 0;
  let unrealizedProfit = 0;

  for (const [, position] of positions) {
    if (position.quantity <= 0) {
      continue;
    }

    const meta = marketCatalog[position.code];

    if (!meta) {
      continue;
    }

    const itemEvaluationAmount = position.quantity * meta.currentPrice;
    const itemEvaluationProfit = itemEvaluationAmount - position.totalCost;
    const itemProfitRate =
      position.totalCost > 0
        ? (itemEvaluationProfit / position.totalCost) * 100
        : 0;

    evaluationAmount += itemEvaluationAmount;
    unrealizedProfit += itemEvaluationProfit;

    portfolioItems.push({
      code: position.code,
      name: meta.name,
      quantity: position.quantity,
      avgPurchasePrice:
        position.quantity > 0
          ? roundToInt(position.totalCost / position.quantity)
          : 0,
      currentPrice: meta.currentPrice,
      targetPrice: meta.targetPrice,
      decision: meta.decision,
      investedAmount: roundToInt(position.totalCost),
      evaluationAmount: roundToInt(itemEvaluationAmount),
      evaluationProfit: roundToInt(itemEvaluationProfit),
      evaluationProfitRate: Number(itemProfitRate.toFixed(2)),
      dividendIncome: meta.dividendIncomeAfterTax ?? 0,
    });
  }

  portfolioItems.sort((a, b) => b.evaluationAmount - a.evaluationAmount);

  const assetSummary: ComputedAssetSummary = {
    totalInvestment: config.totalInvestment,
    evaluationAmount: roundToInt(evaluationAmount),
    realizedProfit: roundToInt(realizedProfit),
    taxEffectProfit: roundToInt(
      realizedProfit + unrealizedProfit + config.dividendIncomeAfterTax
    ),
    dividendIncome: config.dividendIncomeAfterTax,
    cashBalance: roundToInt(cashBalance),
    unrealizedProfit: roundToInt(unrealizedProfit),
    positionCount: portfolioItems.length,
  };

  return {
    portfolioItems,
    assetSummary,
    tradeLogs: sortedTrades,
  };
}