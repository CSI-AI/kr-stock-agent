import type {
  PortfolioEngineConfig,
  PortfolioMarketMeta,
  TradeInput,
} from "@/types/trade";

export const portfolioEngineConfig: PortfolioEngineConfig = {
  totalInvestment: 15000000,
  startingCashBalance: 15000000,
  dividendIncomeAfterTax: 182000,
};

export const portfolioMarketCatalog: Record<string, PortfolioMarketMeta> = {
  "005930": {
    name: "삼성전자",
    code: "005930",
    currentPrice: 81200,
    targetPrice: 98000,
    decision: "유지",
    dividendIncomeAfterTax: 182000,
  },
  "005380": {
    name: "현대차",
    code: "005380",
    currentPrice: 251500,
    targetPrice: 290000,
    decision: "추가매수",
    dividendIncomeAfterTax: 0,
  },
  "999999": {
    name: "2차전지예시주",
    code: "999999",
    currentPrice: 181000,
    targetPrice: 190000,
    decision: "일부매도",
    dividendIncomeAfterTax: 0,
  },
};

export const mockTrades: TradeInput[] = [
  {
    kind: "buy",
    stockName: "삼성전자",
    code: "005930",
    quantity: 20,
    price: 74200,
    date: "2026-01-10",
    fee: 3000,
    memo: "핵심 대형주 비중 진입",
  },
  {
    kind: "buy",
    stockName: "삼성전자",
    code: "005930",
    quantity: 10,
    price: 75500,
    date: "2026-02-03",
    fee: 3000,
    memo: "조정 시 추가 매수",
  },
  {
    kind: "buy",
    stockName: "현대차",
    code: "005380",
    quantity: 8,
    price: 228000,
    date: "2026-02-14",
    fee: 3000,
    memo: "주주환원 강화 기대",
  },
  {
    kind: "buy",
    stockName: "2차전지예시주",
    code: "999999",
    quantity: 12,
    price: 155000,
    date: "2026-03-05",
    fee: 3000,
    memo: "단기 성장 모멘텀 확인",
  },
  {
    kind: "sell",
    stockName: "삼성전자",
    code: "005930",
    quantity: 5,
    price: 80100,
    date: "2026-03-28",
    fee: 3000,
    tax: 1200,
    memo: "일부 비중 조절",
  },
];