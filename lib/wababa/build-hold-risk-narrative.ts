// Phase 37-A6 — Hold Risk / Thesis Drift narrative layer
// "현재 무엇을 계속 점검 중인가" 설명용. 관찰형 PM 톤.
// SELL trigger 생성 X. bearish 단어 X. ranking/scoring 무영향.

export type HoldRiskNarrativeInput = {
  industryName?: string;
  name?: string;
  corpName?: string;
  stockName?: string;
  companyName?: string;
  code?: string;
  symbol?: string;
  per?: number;
  pbr?: number;
  roe?: number;
  opMargin?: number;
  salesGrowth?: number;
  operatingProfitGrowth?: number;
  sectorDurabilityLabel?: string;
  growthDurabilityLabel?: string;
  growthConsistencyLabel?: string;
  longTermHoldView?: string;
  industryTailwind?: string;
  growthSignalTags?: string[];
  coreCatalyst?: string[];
};

type RiskState =
  | "VALUATION_WATCH"
  | "CYCLE_VOLATILITY"
  | "GROWTH_CONFIRMATION"
  | "BASELINE_OBSERVATION";

// State별 4 variant. 관찰형 PM 톤. 미래 단정/매도 권유 표현 금지.
const RISK_TEMPLATES: Record<RiskState, ReadonlyArray<string>> = {
  VALUATION_WATCH: [
    "실적 흐름은 유지되고 있으나, 최근 밸류 부담 확대 여부는 계속 확인이 필요한 구간.",
    "산업 방향성은 유지되는 상태이나, 밸류 측면이 점진적으로 부담 영역에 들어서는지 점검이 필요한 시점.",
    "성장 가설은 유효한 모습이나, 현재 밸류 수준이 흐름의 길이를 견뎌낼 수 있는지 관찰할 구간.",
    "흐름은 살아 있으나, 밸류 부담 측면에서 단기 변동성이 확대되는지 확인할 필요가 있는 시점.",
  ],
  CYCLE_VOLATILITY: [
    "현재까지는 성장 가설이 유지되는 상태이나, 회복 사이클 특성상 단기 변동성 가능성은 함께 보고 있는 구간.",
    "산업 회복 흐름은 이어지나, 사이클 후반부 흔들림 가능성은 늘 함께 점검을 이어갈 시점.",
    "회복 사이클 진행 중인 모습이나, 사이클 정상화 단계에서의 변동성을 단계별로 관찰할 구간.",
    "흐름 자체는 유지되나, 회복 사이클이 길어지는 동안 흔들림이 잡히는지 관찰할 필요가 있는 종목.",
  ],
  GROWTH_CONFIRMATION: [
    "산업 흐름은 유지되는 상태지만, 실적 성장률이 계속 이어지는지는 확인이 필요한 시점.",
    "성장 가설 자체는 살아 있으나, 분기 실적이 흐름을 그대로 받쳐주는지 점검을 이어갈 구간.",
    "현재까지의 흐름은 유지되나, 다음 분기에도 성장률이 둔화되지 않는지 확인할 필요가 있는 모습.",
    "장기 가설은 유지되나, 매출·이익 성장이 평탄화되는 신호가 나오는지 천천히 관찰할 시점.",
  ],
  BASELINE_OBSERVATION: [
    "특별한 리스크 신호는 제한적으로 관찰되며, 산업·실적 흐름의 길이를 계속 점검할 구간.",
    "현재까지는 가설 훼손 신호가 명확히 잡히지 않은 상태로, 흐름 유지 여부를 단계적으로 관찰할 시점.",
    "지금 단계에서 가설을 흔드는 강한 신호는 없으나, 산업 흐름 변동성은 늘 함께 보고 있어야 할 구간.",
    "리스크 신호 자체는 제한적이나, 단기 변동성과 산업 흐름의 지속성은 꾸준히 점검할 필요가 있는 모습.",
  ],
};

const ABSOLUTE_FALLBACK =
  "현재까지는 가설을 흔드는 강한 신호가 명확하지 않은 상태로, 흐름 유지 여부를 계속 관찰할 구간.";

function stableHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function seedOf(input: HoldRiskNarrativeInput): string {
  return (
    input.code ||
    input.symbol ||
    input.name ||
    input.corpName ||
    input.stockName ||
    input.companyName ||
    "default"
  );
}

function classifyRiskState(input: HoldRiskNarrativeInput): RiskState {
  const per = typeof input.per === "number" ? input.per : null;
  const sector = input.sectorDurabilityLabel || "";
  const consistency = input.growthConsistencyLabel || "";
  const durability = input.growthDurabilityLabel || "";
  const sales =
    typeof input.salesGrowth === "number" ? input.salesGrowth : null;

  // 1) PER 부담 영역 → 밸류 워치 (성장이 유지되는 종목에서도 밸류는 따로 본다)
  if (per !== null && per > 25) {
    return "VALUATION_WATCH";
  }

  // 2) 회복 사이클 종목 → 사이클 변동성 점검
  if (sector.includes("회복 사이클")) {
    return "CYCLE_VOLATILITY";
  }

  // 3) 성장률 둔화 가능성 (한 자릿수 매출 성장 또는 장기보유 라벨 부재) → 성장 확인 필요
  if (sales !== null && sales < 10) {
    return "GROWTH_CONFIRMATION";
  }

  if (
    (durability && !durability.includes("장기보유")) ||
    (consistency && !consistency.includes("장기보유"))
  ) {
    return "GROWTH_CONFIRMATION";
  }

  return "BASELINE_OBSERVATION";
}

export function buildHoldRiskNarrative(
  input: HoldRiskNarrativeInput | null | undefined
): string {
  if (!input || typeof input !== "object") {
    return ABSOLUTE_FALLBACK;
  }

  const state = classifyRiskState(input);
  const variants = RISK_TEMPLATES[state];

  if (!variants || variants.length === 0) {
    return ABSOLUTE_FALLBACK;
  }

  const idx = stableHash(seedOf(input) + "-R") % variants.length;
  const text = variants[idx];

  if (!text || text.length === 0) {
    return ABSOLUTE_FALLBACK;
  }

  return text;
}

export function classifyHoldRiskState(
  input: HoldRiskNarrativeInput
): RiskState {
  return classifyRiskState(input);
}
