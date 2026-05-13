export type MockHoldingDecision =
  | "유지"
  | "추가매수"
  | "일부매도"
  | "전량매도"
  | "관찰강화";

export interface MockHoldingItem {
  code: string;
  name: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  targetPrice: number;
  weightPercent: number;
  decision: MockHoldingDecision;
  afterTaxProfit: number;
  dividendIncome: number;
  hypothesis: string;
  evidence: string[];
  risk: string[];
}

export interface MockSellCandidate {
  code: string;
  name: string;
  currentPrice: number;
  targetAction: "일부매도" | "전량매도" | "관찰강화";
  sellHypothesis: string;
  evidence: string[];
  risk: string[];
  reversalCondition: string;
}

export const MOCK_PORTFOLIO_HOLDINGS: MockHoldingItem[] = [
  {
    code: "005930",
    name: "삼성전자",
    sector: "반도체",
    quantity: 42,
    avgPrice: 73400,
    currentPrice: 81200,
    targetPrice: 94000,
    weightPercent: 18,
    decision: "유지",
    afterTaxProfit: 286440,
    dividendIncome: 48300,
    hypothesis: "메모리 업황 회복과 HBM 수요가 실적 개선으로 이어진다.",
    evidence: [
      "메모리 업황 회복 기대",
      "HBM 관련 수요 확대",
      "재무구조 안정적",
    ],
    risk: [
      "업황 회복 지연 가능성",
      "반도체 가격 변동성",
    ],
  },
  {
    code: "000660",
    name: "SK하이닉스",
    sector: "반도체",
    quantity: 12,
    avgPrice: 185000,
    currentPrice: 214500,
    targetPrice: 250000,
    weightPercent: 14,
    decision: "유지",
    afterTaxProfit: 296820,
    dividendIncome: 9600,
    hypothesis: "고대역폭 메모리 중심의 구조적 수혜가 이어진다.",
    evidence: [
      "HBM 수요 강함",
      "이익 성장률 개선",
      "업황 민감도 높지만 추세 우호적",
    ],
    risk: [
      "단기 급등 후 변동성 확대",
      "고객사 투자사이클 변동",
    ],
  },
  {
    code: "005380",
    name: "현대차",
    sector: "자동차",
    quantity: 10,
    avgPrice: 244000,
    currentPrice: 268000,
    targetPrice: 310000,
    weightPercent: 12,
    decision: "일부매도",
    afterTaxProfit: 190800,
    dividendIncome: 72000,
    hypothesis: "실적과 주주환원은 좋지만 단기 상승폭 반영이 커졌다.",
    evidence: [
      "저PER/고배당 유지",
      "주주환원 강화",
      "단기 상승 후 밸류 재평가 진행",
    ],
    risk: [
      "환율 변동",
      "자동차 수요 둔화",
    ],
  },
  {
    code: "000270",
    name: "기아",
    sector: "자동차",
    quantity: 18,
    avgPrice: 121000,
    currentPrice: 142300,
    targetPrice: 165000,
    weightPercent: 11,
    decision: "유지",
    afterTaxProfit: 325890,
    dividendIncome: 89100,
    hypothesis: "수익성과 주주환원 조합이 여전히 우수하다.",
    evidence: [
      "높은 ROE",
      "양호한 배당",
      "자동차 업종 내 상대 밸류 매력",
    ],
    risk: [
      "경기 둔화",
      "인센티브 경쟁 확대",
    ],
  },
  {
    code: "105560",
    name: "KB금융",
    sector: "은행",
    quantity: 25,
    avgPrice: 84200,
    currentPrice: 96800,
    targetPrice: 110000,
    weightPercent: 9,
    decision: "관찰강화",
    afterTaxProfit: 236250,
    dividendIncome: 118000,
    hypothesis: "배당과 자사주 매력은 높지만 금리 방향성 민감도가 있다.",
    evidence: [
      "저PBR",
      "배당수익률 높음",
      "자본정책 기대",
    ],
    risk: [
      "금리 하락 구간 수익성 둔화",
      "대손비용 확대 가능성",
    ],
  },
  {
    code: "035420",
    name: "NAVER",
    sector: "인터넷",
    quantity: 14,
    avgPrice: 228000,
    currentPrice: 241000,
    targetPrice: 290000,
    weightPercent: 8,
    decision: "유지",
    afterTaxProfit: 139230,
    dividendIncome: 6300,
    hypothesis: "광고·커머스·AI 수익화 개선이 중기 실적 개선으로 이어진다.",
    evidence: [
      "현금창출력 유지",
      "플랫폼 경쟁력 보유",
      "AI 관련 옵션 존재",
    ],
    risk: [
      "밸류 부담 재확대",
      "규제 리스크",
    ],
  },
  {
    code: "034730",
    name: "SK",
    sector: "지주사",
    quantity: 16,
    avgPrice: 201000,
    currentPrice: 187500,
    targetPrice: 225000,
    weightPercent: 7,
    decision: "관찰강화",
    afterTaxProfit: -177840,
    dividendIncome: 57600,
    hypothesis: "자산가치 대비 할인 매력은 있으나 해소 속도가 더디다.",
    evidence: [
      "지주사 할인 매력",
      "배당 존재",
      "밸류는 낮음",
    ],
    risk: [
      "할인 지속",
      "핵심 자회사 변동성",
    ],
  },
  {
    code: "035720",
    name: "카카오",
    sector: "인터넷",
    quantity: 30,
    avgPrice: 68100,
    currentPrice: 59200,
    targetPrice: 70000,
    weightPercent: 6,
    decision: "전량매도",
    afterTaxProfit: -292410,
    dividendIncome: 0,
    hypothesis: "성장 둔화 대비 밸류 매력과 이익 가시성이 부족하다.",
    evidence: [
      "성장률 둔화",
      "수익성 회복 속도 제한",
      "투자 가설 약화",
    ],
    risk: [
      "반등 시 기회비용 발생",
      "플랫폼 모멘텀 재부각 가능성",
    ],
  },
];

export const MOCK_SELL_CANDIDATES: MockSellCandidate[] = [
  {
    code: "035720",
    name: "카카오",
    currentPrice: 59200,
    targetAction: "전량매도",
    sellHypothesis: "성장성과 수익성 회복이 기대보다 느려 기존 투자 가설이 약화됐다.",
    evidence: [
      "PER 부담 대비 이익 성장 약함",
      "최근 점수 체계에서 하위권",
      "대안 종목 대비 기회비용 큼",
    ],
    risk: [
      "플랫폼 반등 모멘텀 재발생 가능성",
      "AI/신사업 기대감 재점화 가능성",
    ],
    reversalCondition: "분기 실적에서 이익 성장 재가속과 밸류 정상화 신호가 확인될 때",
  },
  {
    code: "005380",
    name: "현대차",
    currentPrice: 268000,
    targetAction: "일부매도",
    sellHypothesis: "보유 비중과 단기 상승폭을 감안할 때 일부 차익 실현이 합리적이다.",
    evidence: [
      "단기 상승 후 비중 부담 확대",
      "배당/주주환원은 여전히 우수",
      "전량매도 사안은 아니나 리밸런싱 필요",
    ],
    risk: [
      "추가 상승 시 매도 조기 판단 가능성",
      "자동차 업황 강세 지속 가능성",
    ],
    reversalCondition: "밸류 부담이 완화되거나 실적 추정치가 다시 상향될 때",
  },
  {
    code: "034730",
    name: "SK",
    currentPrice: 187500,
    targetAction: "관찰강화",
    sellHypothesis: "할인 매력은 있으나 해소 촉매가 약해 장기 정체 가능성을 점검해야 한다.",
    evidence: [
      "지주사 할인 지속",
      "주가 반등 촉매 부족",
      "자본 재배치 필요 후보",
    ],
    risk: [
      "갑작스런 할인 해소 시 주가 반등 가능",
      "배당 매력 유지",
    ],
    reversalCondition: "자회사 가치 재평가 또는 주주환원 확대가 구체적으로 확인될 때",
  },
];