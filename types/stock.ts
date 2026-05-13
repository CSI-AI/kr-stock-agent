/**
 * 파일 경로: types/stock.ts
 * 역할: 주식 에이전트 시스템에서 사용하는 핵심 데이터 타입 정의
 */

// 1. 투자 판단 결과 타입
export type InvestmentDecision =
  | "유지"
  | "추가매수"
  | "일부매도"
  | "전량매도"
  | "관찰강화";

// 2. 상위 10개 종목 상세 정보 타입
export interface StockAnalysis {
  name: string;
  code: string;
  totalScore: number;
  currentPrice: number;
  buyRange: {
    min: number;
    max: number;
  };
  targetPrice: number;
  hypothesis: string;
  reason: string[];
  risk: string[];
  reversalCondition: string;
}

// 3. 보유 포트폴리오 종목 타입
export interface PortfolioItem {
  name: string;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  targetPrice: number;
  decision: InvestmentDecision;
}

// 4. 전체 자산 현황 타입
export interface AssetSummary {
  totalInvestment: number;
  evaluationAmount: number;
  realizedProfit: number;
  taxEffectProfit: number;
  dividendIncome: number;
  cashBalance: number;
}