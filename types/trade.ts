import type {
  AssetSummary,
  InvestmentDecision,
  PortfolioItem,
} from "@/types/stock";

export interface BuyTradeInput {
  kind: "buy";
  stockName: string;
  code: string;
  quantity: number;
  price: number;
  date: string;
  fee: number;
  memo?: string;
}

export interface SellTradeInput {
  kind: "sell";
  stockName: string;
  code: string;
  quantity: number;
  price: number;
  date: string;
  fee: number;
  tax: number;
  memo?: string;
}

export type TradeInput = BuyTradeInput | SellTradeInput;

export interface PortfolioMarketMeta {
  name: string;
  code: string;
  currentPrice: number;
  targetPrice: number;
  decision: InvestmentDecision;
  dividendIncomeAfterTax?: number;
}

export interface PortfolioEngineConfig {
  totalInvestment: number;
  startingCashBalance: number;
  dividendIncomeAfterTax: number;
}

export interface ComputedPortfolioItem extends PortfolioItem {
  code: string;
  investedAmount: number;
  evaluationAmount: number;
  evaluationProfit: number;
  evaluationProfitRate: number;
  dividendIncome: number;
}

export interface ComputedAssetSummary extends AssetSummary {
  unrealizedProfit: number;
  positionCount: number;
}

export interface PortfolioEngineResult {
  portfolioItems: ComputedPortfolioItem[];
  assetSummary: ComputedAssetSummary;
  tradeLogs: TradeInput[];
}