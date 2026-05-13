export interface MockPreviousTopItem {
  code: string;
  name: string;
  previousRank: number;
  previousScore: number;
}

export interface MockPublishedPortfolioPosition {
  code: string;
  name: string;
  action: "BUY" | "HOLD" | "SELL";
  weightPercent: number;
  averagePrice: number;
  currentPrice: number;
  thesis: string;
}

export interface MockLivePortfolioHolding {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ";
  industry: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  thesis: string;
}

export interface MockLivePortfolioSnapshot {
  startedAt: string;
  initialCapital: number;
  cash: number;
  holdings: MockLivePortfolioHolding[];
}

export interface MockDailyAssetPoint {
  date: string;
  totalAsset: number;
}

export interface MockTradeHistoryItem {
  date: string;
  action: "BUY" | "SELL";
  code: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
  note: string;
}

export const MOCK_PREVIOUS_TOP10: MockPreviousTopItem[] = [
  { code: "005930", name: "삼성전자", previousRank: 1, previousScore: 74.2 },
  { code: "005380", name: "현대차", previousRank: 2, previousScore: 72.6 },
  { code: "000660", name: "SK하이닉스", previousRank: 3, previousScore: 71.8 },
  { code: "000270", name: "기아", previousRank: 4, previousScore: 70.4 },
  { code: "105560", name: "KB금융", previousRank: 5, previousScore: 68.9 },
  { code: "086790", name: "하나금융지주", previousRank: 6, previousScore: 67.4 },
  { code: "012330", name: "현대모비스", previousRank: 7, previousScore: 66.8 },
  { code: "003550", name: "LG", previousRank: 8, previousScore: 64.9 },
  { code: "034730", name: "SK", previousRank: 9, previousScore: 63.7 },
  { code: "066570", name: "LG전자", previousRank: 10, previousScore: 62.5 },
];

export const MOCK_PUBLISHED_PORTFOLIO: MockPublishedPortfolioPosition[] = [
  {
    code: "005930",
    name: "삼성전자",
    action: "HOLD",
    weightPercent: 18,
    averagePrice: 73400,
    currentPrice: 81200,
    thesis: "메모리 업황 회복과 HBM 수요 확대 수혜",
  },
  {
    code: "000660",
    name: "SK하이닉스",
    action: "HOLD",
    weightPercent: 14,
    averagePrice: 185000,
    currentPrice: 214500,
    thesis: "HBM 중심 실적 고성장 지속 기대",
  },
  {
    code: "000270",
    name: "기아",
    action: "BUY",
    weightPercent: 11,
    averagePrice: 121000,
    currentPrice: 142300,
    thesis: "고ROE와 주주환원 조합이 우수",
  },
  {
    code: "005380",
    name: "현대차",
    action: "SELL",
    weightPercent: 12,
    averagePrice: 244000,
    currentPrice: 268000,
    thesis: "단기 상승폭 반영 이후 일부 차익 실현 구간",
  },
];

export const MOCK_LIVE_PORTFOLIO_SNAPSHOT: MockLivePortfolioSnapshot = {
  startedAt: "2026-01-02",
  initialCapital: 150000000,
  cash: 49765600,
  holdings: [
    {
      code: "005930",
      name: "삼성전자",
      market: "KOSPI",
      industry: "반도체",
      quantity: 280,
      averagePrice: 73400,
      currentPrice: 81200,
      thesis: "메모리 업황 회복과 HBM 수요 확대 수혜",
    },
    {
      code: "000660",
      name: "SK하이닉스",
      market: "KOSPI",
      industry: "반도체",
      quantity: 95,
      averagePrice: 185000,
      currentPrice: 214500,
      thesis: "HBM 중심 실적 고성장 지속 기대",
    },
    {
      code: "000270",
      name: "기아",
      market: "KOSPI",
      industry: "자동차",
      quantity: 160,
      averagePrice: 121000,
      currentPrice: 142300,
      thesis: "고ROE와 주주환원 조합이 우수",
    },
    {
      code: "105560",
      name: "KB금융",
      market: "KOSPI",
      industry: "은행",
      quantity: 130,
      averagePrice: 84200,
      currentPrice: 96800,
      thesis: "저PBR과 주주환원 매력이 높음",
    },
  ],
};

export const MOCK_DAILY_ASSET_HISTORY: MockDailyAssetPoint[] = [
  { date: "2026-01-02", totalAsset: 150000000 },
  { date: "2026-01-03", totalAsset: 149620000 },
  { date: "2026-01-06", totalAsset: 150840000 },
  { date: "2026-01-07", totalAsset: 151330000 },
  { date: "2026-01-08", totalAsset: 150910000 },
  { date: "2026-01-09", totalAsset: 152480000 },
  { date: "2026-01-10", totalAsset: 153210000 },
  { date: "2026-01-13", totalAsset: 152760000 },
  { date: "2026-01-14", totalAsset: 154020000 },
  { date: "2026-01-15", totalAsset: 154980000 },
  { date: "2026-01-16", totalAsset: 156340000 },
  { date: "2026-01-17", totalAsset: 155920000 },
  { date: "2026-01-20", totalAsset: 157180000 },
  { date: "2026-01-21", totalAsset: 156870000 },
  { date: "2026-01-22", totalAsset: 158540000 },
  { date: "2026-01-23", totalAsset: 159310000 },
  { date: "2026-01-24", totalAsset: 158920000 },
  { date: "2026-01-27", totalAsset: 160280000 },
  { date: "2026-01-28", totalAsset: 161740000 },
  { date: "2026-01-29", totalAsset: 160950000 },
  { date: "2026-01-30", totalAsset: 162680000 },
  { date: "2026-01-31", totalAsset: 163920000 },
  { date: "2026-02-03", totalAsset: 162870000 },
  { date: "2026-02-04", totalAsset: 164430000 },
  { date: "2026-02-05", totalAsset: 165280000 },
  { date: "2026-02-06", totalAsset: 164810000 },
  { date: "2026-02-07", totalAsset: 166240000 },
  { date: "2026-02-10", totalAsset: 167130000 },
  { date: "2026-02-11", totalAsset: 166720000 },
  { date: "2026-02-12", totalAsset: 168010000 },
  { date: "2026-02-13", totalAsset: 168950000 },
  { date: "2026-02-14", totalAsset: 169620000 },
  { date: "2026-02-17", totalAsset: 170880000 },
  { date: "2026-02-18", totalAsset: 171420000 },
  { date: "2026-02-19", totalAsset: 170960000 },
  { date: "2026-02-20", totalAsset: 172380000 },
  { date: "2026-02-21", totalAsset: 173260000 },
  { date: "2026-02-24", totalAsset: 172910000 },
  { date: "2026-02-25", totalAsset: 174120000 },
  { date: "2026-02-26", totalAsset: 174940000 },
  { date: "2026-02-27", totalAsset: 175530000 },
  { date: "2026-02-28", totalAsset: 176380000 },
  { date: "2026-03-03", totalAsset: 175920000 },
  { date: "2026-03-04", totalAsset: 176740000 },
  { date: "2026-03-05", totalAsset: 177630000 },
  { date: "2026-03-06", totalAsset: 178420000 },
  { date: "2026-03-07", totalAsset: 177980000 },
  { date: "2026-03-10", totalAsset: 179210000 },
  { date: "2026-03-11", totalAsset: 180060000 },
  { date: "2026-03-12", totalAsset: 181340000 },
  { date: "2026-03-13", totalAsset: 180910000 },
  { date: "2026-03-14", totalAsset: 182240000 },
  { date: "2026-03-17", totalAsset: 183120000 },
  { date: "2026-03-18", totalAsset: 182680000 },
  { date: "2026-03-19", totalAsset: 184010000 },
  { date: "2026-03-20", totalAsset: 184920000 },
  { date: "2026-03-21", totalAsset: 185340000 },
  { date: "2026-03-24", totalAsset: 184960000 },
  { date: "2026-03-25", totalAsset: 186180000 },
  { date: "2026-03-26", totalAsset: 187420000 },
  { date: "2026-03-27", totalAsset: 186940000 },
  { date: "2026-03-28", totalAsset: 188210000 },
  { date: "2026-03-31", totalAsset: 189060000 },
  { date: "2026-04-01", totalAsset: 188720000 },
  { date: "2026-04-02", totalAsset: 189480000 },
  { date: "2026-04-03", totalAsset: 190320000 },
  { date: "2026-04-06", totalAsset: 191040000 },
  { date: "2026-04-07", totalAsset: 190610000 },
  { date: "2026-04-08", totalAsset: 191880000 },
  { date: "2026-04-09", totalAsset: 192460000 },
  { date: "2026-04-10", totalAsset: 193120000 },
  { date: "2026-04-13", totalAsset: 193860000 },
  { date: "2026-04-14", totalAsset: 194602600 },
];

export const MOCK_TRADE_HISTORY: MockTradeHistoryItem[] = [
  {
    date: "2026-01-02",
    action: "BUY",
    code: "005930",
    name: "삼성전자",
    quantity: 200,
    price: 73400,
    amount: 14680000,
    note: "초기 편입",
  },
  {
    date: "2026-01-03",
    action: "BUY",
    code: "000660",
    name: "SK하이닉스",
    quantity: 60,
    price: 185000,
    amount: 11100000,
    note: "반도체 비중 확대",
  },
  {
    date: "2026-01-07",
    action: "BUY",
    code: "105560",
    name: "KB금융",
    quantity: 80,
    price: 84200,
    amount: 6736000,
    note: "저PBR 금융주 편입",
  },
  {
    date: "2026-01-15",
    action: "BUY",
    code: "000270",
    name: "기아",
    quantity: 120,
    price: 121000,
    amount: 14520000,
    note: "자동차 업종 편입",
  },
  {
    date: "2026-02-06",
    action: "SELL",
    code: "005380",
    name: "현대차",
    quantity: 40,
    price: 257000,
    amount: 10280000,
    note: "차익 실현",
  },
  {
    date: "2026-02-21",
    action: "BUY",
    code: "005930",
    name: "삼성전자",
    quantity: 80,
    price: 74800,
    amount: 5984000,
    note: "추가 매수",
  },
  {
    date: "2026-03-10",
    action: "BUY",
    code: "000660",
    name: "SK하이닉스",
    quantity: 35,
    price: 191000,
    amount: 6685000,
    note: "실적 모멘텀 반영",
  },
  {
    date: "2026-03-25",
    action: "BUY",
    code: "105560",
    name: "KB금융",
    quantity: 50,
    price: 85800,
    amount: 4290000,
    note: "주주환원 기대",
  },
  {
    date: "2026-04-04",
    action: "BUY",
    code: "000270",
    name: "기아",
    quantity: 40,
    price: 126500,
    amount: 5060000,
    note: "비중 보강",
  },
];