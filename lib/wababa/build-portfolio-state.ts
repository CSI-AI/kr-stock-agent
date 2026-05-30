// Phase 37-A8 — Portfolio State narrative layer
// 포트폴리오 전체 상태 요약. 차분한 운영실 톤.
// ranking/scoring/자동매매 무영향. 텍스트 layer 전용.

export type PortfolioHoldingInput = {
  code?: string;
  name?: string;
  industryName?: string;
  sectorDurabilityLabel?: string;
  growthDurabilityLabel?: string;
  growthConsistencyLabel?: string;
  longTermHoldView?: string;
  industryTailwind?: string;
  per?: number;
  pbr?: number;
  weight?: number;
};

export type PortfolioStateInput = {
  fundKey?: string;
  holdings: PortfolioHoldingInput[];
  cashRatePercent?: number;
  totalPositions?: number;
};

export type PortfolioHealthLevel = "건강" | "관찰";

export type PortfolioStateKind =
  | "HEALTHY_GROWTH"
  | "CYCLE_EXPOSURE"
  | "VALUATION_STRETCHED"
  | "OBSERVATION_BALANCED";

export type PortfolioState = {
  state: PortfolioStateKind;
  portfolioStateTitle: string;
  portfolioStateNarrative: string;
  portfolioStateTags: string[];
  portfolioHealthLevel: PortfolioHealthLevel;
};

const STATE_TITLES: Record<PortfolioStateKind, string> = {
  HEALTHY_GROWTH: "장기 성장 흐름 우세",
  CYCLE_EXPOSURE: "회복 사이클 비중 관찰",
  VALUATION_STRETCHED: "밸류 부담 일부 확대",
  OBSERVATION_BALANCED: "균형·관찰 중심 운영",
};

// 와바바AI펀드 전용 제목 — 가치투자 톤(장기·밸류·보유) 대신 신호 탐색 톤.
// 현재 구현 신호 범위(재무·뉴스·성장신호)에 맞춰 과장 없이 표기. 차트·거래량·추세·변동성 등 미구현 신호어 제외.
const STATE_TITLES_AI: Record<PortfolioStateKind, string> = {
  HEALTHY_GROWTH: "성장 신호 우세",
  CYCLE_EXPOSURE: "회복 사이클 비중 감지",
  VALUATION_STRETCHED: "밸류 부담·리스크 감지",
  OBSERVATION_BALANCED: "시장 기회 탐색 중심",
};

const STATE_NARRATIVES: Record<PortfolioStateKind, ReadonlyArray<string>> = {
  HEALTHY_GROWTH: [
    "장기 성장 가설을 유지하는 종목 비중이 우세한 상태.",
    "성장 흐름이 유지되는 종목이 다수를 차지하는 균형 상태.",
    "장기 보유 후보 중심으로 구성된 우세 흐름 상태.",
    "성장 지속 흐름이 안정적으로 유지되는 종목이 다수인 모습.",
  ],
  CYCLE_EXPOSURE: [
    "회복 사이클형 종목 비중이 일부 존재해 단기 변동성 관찰이 필요한 포트폴리오.",
    "회복 사이클 비중이 절반 이상으로, 사이클 흐름 지속 여부를 점검하는 상태.",
    "회복 사이클 중심의 흐름이 유지되는 상태로, 단기 변동성은 함께 보고 있는 구성.",
    "회복 사이클 종목 비중이 우세해 사이클 지속 신호를 단계적으로 관찰하는 포트폴리오.",
  ],
  VALUATION_STRETCHED: [
    "일부 종목의 밸류 부담이 확대되는 모습으로, 성장 지속 여부 점검이 중요한 구간.",
    "성장 흐름은 유지되나, 밸류 측면이 점진적으로 부담 영역으로 들어가는 포트폴리오.",
    "밸류 부담이 일부 종목에서 확대되어 흐름의 길이를 함께 보는 운용 상태.",
    "성장 가설은 유지되나 밸류 부담 측면이 누적되는 모습으로, 단계적 관찰이 필요한 구성.",
  ],
  OBSERVATION_BALANCED: [
    "특별 위험 신호는 제한적이며, 흐름 유지 여부를 관찰 중심으로 운영 중인 포트폴리오.",
    "강한 신호 없이 균형을 유지하는 상태로, 흐름의 길이를 단계적으로 점검할 구간.",
    "방향성이 한쪽으로 치우치지 않은 균형 상태로, 흐름 지속 여부를 단계별 관찰하는 모습.",
    "산업·실적 흐름의 지속성을 관찰 중심으로 추적하는 포트폴리오 상태.",
  ],
};

// 와바바AI펀드 전용 narrative — 재무·뉴스·실적·성장신호 기반 기회·리스크 감지 톤.
// 차트·거래량·추세·모멘텀·변동성 등 아직 입력 feature에 없는 신호어는 쓰지 않음.
const STATE_NARRATIVES_AI: Record<PortfolioStateKind, ReadonlyArray<string>> = {
  HEALTHY_GROWTH: [
    "실적·성장신호가 우호적인 종목 비중이 높은 상태.",
    "재무·뉴스·성장신호가 함께 우호적인 종목이 다수를 차지하는 구성.",
    "실적·성장신호가 우호적인 종목 중심으로 기회를 보는 상태.",
    "성장신호가 안정적으로 유지되는 종목이 다수인 모습.",
  ],
  CYCLE_EXPOSURE: [
    "회복 사이클형 종목 비중이 있어 리스크를 함께 감지하는 구성.",
    "회복 사이클 비중이 절반 이상으로, 사이클 지속 여부를 탐색하는 상태.",
    "회복 사이클 흐름이 유지되는 상태로, 단기 리스크를 함께 보는 구성.",
    "회복 사이클 비중이 우세해 사이클 지속 여부를 단계적으로 감지하는 포트폴리오.",
  ],
  VALUATION_STRETCHED: [
    "일부 종목의 밸류 부담이 확대되는 모습으로, 리스크 점검이 중요한 구간.",
    "성장신호는 유지되나, 밸류 부담이 점진적으로 누적되는 포트폴리오.",
    "밸류 부담이 일부 종목에서 확대되어 리스크와 기회를 함께 보는 운용 상태.",
    "성장신호는 유지되나 밸류 부담이 누적되어 단계적 감지가 필요한 구성.",
  ],
  OBSERVATION_BALANCED: [
    "뚜렷한 기회 신호는 제한적이며, 기회·리스크를 탐색 중심으로 감지하는 포트폴리오.",
    "강한 신호 없이 균형을 유지하는 상태로, 새로운 시장 기회를 단계적으로 탐색하는 구간.",
    "방향성이 한쪽으로 치우치지 않은 균형 상태로, 실적·뉴스 신호를 단계별 감지하는 모습.",
    "재무·실적·뉴스 신호의 변화를 탐색 중심으로 추적하는 포트폴리오 상태.",
  ],
};

const EMPTY_PORTFOLIO_STATE: PortfolioState = {
  state: "OBSERVATION_BALANCED",
  portfolioStateTitle: "보유 종목 없음",
  portfolioStateNarrative:
    "현재 보유 종목이 없는 상태로, 관망과 후보 검토가 우선되는 구간.",
  portfolioStateTags: [],
  portfolioHealthLevel: "관찰",
};

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function bucketOf(haystack: string): string {
  if (/방산|조선|해양|국방|무기|항공|중공업|함정/.test(haystack)) {
    return "방산·조선";
  }
  if (/전력|송배전|변압기|전선|전력기기|전력 인프라|전력망/.test(haystack)) {
    return "전력 인프라";
  }
  if (/반도체|HBM|메모리|데이터센터|파운드리|AI 서버|AI 인프라|AI·반도체/.test(haystack)) {
    return "반도체·AI";
  }
  if (/콘텐츠|엔터|엔터테인|음반|미디어|K-POP|케이팝|IP 라이선싱/.test(haystack)) {
    return "콘텐츠·IP";
  }
  return "기타 산업";
}

function isLongHold(h: PortfolioHoldingInput): boolean {
  const longView = h.longTermHoldView || "";
  const dur = h.growthDurabilityLabel || "";
  const cons = h.growthConsistencyLabel || "";
  return (
    longView.includes("장기보유") ||
    dur.includes("장기보유") ||
    cons.includes("장기보유")
  );
}

function isCycle(h: PortfolioHoldingInput): boolean {
  const sector = h.sectorDurabilityLabel || "";
  return sector.includes("회복 사이클");
}

function isValuationStretched(h: PortfolioHoldingInput): boolean {
  return typeof h.per === "number" && h.per > 25;
}

function classifyState(input: PortfolioStateInput): PortfolioStateKind {
  const holdings = input.holdings || [];
  const total = holdings.length;

  if (total === 0) {
    return "OBSERVATION_BALANCED";
  }

  const valuationRatio =
    holdings.filter(isValuationStretched).length / total;
  const cycleRatio = holdings.filter(isCycle).length / total;
  const longHoldRatio = holdings.filter(isLongHold).length / total;

  if (valuationRatio >= 0.4) {
    return "VALUATION_STRETCHED";
  }
  if (cycleRatio >= 0.5) {
    return "CYCLE_EXPOSURE";
  }
  if (longHoldRatio >= 0.6) {
    return "HEALTHY_GROWTH";
  }
  return "OBSERVATION_BALANCED";
}

function buildTags(input: PortfolioStateInput): string[] {
  const holdings = input.holdings || [];
  const total = holdings.length;
  const tags: string[] = [];

  if (total === 0) {
    return tags;
  }

  // 산업 bucket 분포
  const bucketCount = new Map<string, number>();
  for (const h of holdings) {
    const haystack = `${h.industryName || ""} ${h.industryTailwind || ""} ${h.name || ""}`;
    const bucket = bucketOf(haystack);
    bucketCount.set(bucket, (bucketCount.get(bucket) || 0) + 1);
  }
  const topBuckets = [...bucketCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)
    .filter((name) => name !== "기타 산업");

  tags.push(...topBuckets);

  // 회복 사이클 비중
  const cycleRatio = holdings.filter(isCycle).length / total;
  if (cycleRatio >= 0.2 && !tags.includes("회복 사이클 일부")) {
    tags.push("회복 사이클 일부");
  }

  // 장기보유 비중 (AI펀드는 신호 톤으로 표기)
  const longHoldRatio = holdings.filter(isLongHold).length / total;
  if (longHoldRatio >= 0.5) {
    tags.push(input.fundKey === "ai" ? "성장신호 우호 다수" : "장기보유 다수");
  }

  // 현금 비중
  if (
    typeof input.cashRatePercent === "number" &&
    input.cashRatePercent >= 5
  ) {
    const cashLabel = `현금 ${Math.round(input.cashRatePercent)}%`;
    tags.push(cashLabel);
  }

  // 보유 종목 수
  tags.push(`보유 ${total}종목`);

  return tags.slice(0, 5);
}

function seedOf(input: PortfolioStateInput): string {
  const holdings = input.holdings || [];
  const codes = holdings
    .map((h) => h.code || h.name || "")
    .filter(Boolean)
    .sort()
    .join("|");
  return `${input.fundKey || "fund"}::${codes}`;
}

export function buildPortfolioState(
  input: PortfolioStateInput
): PortfolioState {
  if (!input || !Array.isArray(input.holdings) || input.holdings.length === 0) {
    return { ...EMPTY_PORTFOLIO_STATE };
  }

  const isAi = input.fundKey === "ai";
  const state = classifyState(input);
  const variants = isAi ? STATE_NARRATIVES_AI[state] : STATE_NARRATIVES[state];
  const idx = stableHash(seedOf(input) + "-PS") % variants.length;
  const narrative = variants[idx] || EMPTY_PORTFOLIO_STATE.portfolioStateNarrative;
  const tags = buildTags(input);

  return {
    state,
    portfolioStateTitle: (isAi ? STATE_TITLES_AI : STATE_TITLES)[state],
    portfolioStateNarrative: narrative,
    portfolioStateTags: tags,
    portfolioHealthLevel: state === "HEALTHY_GROWTH" ? "건강" : "관찰",
  };
}

export function classifyPortfolioStateKind(
  input: PortfolioStateInput
): PortfolioStateKind {
  return classifyState(input);
}
