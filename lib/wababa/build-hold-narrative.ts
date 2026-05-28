// Phase 37-A5 — Hold narrative layer
// "왜 아직 보유 가능한가" 설명용. 차분한 장기 PM 톤.
// ranking/scoring/자동매매 무영향. 텍스트 layer 전용. 빈 문자열 금지.

export type HoldNarrativeInput = {
  industryName?: string;
  name?: string;
  corpName?: string;
  stockName?: string;
  companyName?: string;
  code?: string;
  symbol?: string;
  longTermHoldView?: string;
  growthDurabilityLabel?: string;
  growthConsistencyLabel?: string;
  sectorDurabilityLabel?: string;
  growthSignalTags?: string[];
  coreCatalyst?: string[];
  growthStory?: string;
  investmentThesis?: string;
  industryTailwind?: string;
  hypothesis?: string;
  salesGrowth?: number;
  operatingProfitGrowth?: number;
  per?: number;
  pbr?: number;
  roe?: number;
  opMargin?: number;
};

type HoldState =
  | "FLOW_HOLDING"
  | "VALUATION_CAUTION"
  | "OBSERVATION_REQUIRED"
  | "BASELINE";

// State별 4 variant. 차분한 PM 톤. 미래 예언/확정 표현 금지.
// 종목 해시로 안정 선택 → 같은 종목 같은 narrative 유지.
const HOLD_TEMPLATES: Record<HoldState, ReadonlyArray<string>> = {
  FLOW_HOLDING: [
    "현재까지는 실적 흐름과 산업 방향성이 함께 유지되는 상태로, 장기 가설을 깨는 신호는 아직 확인되지 않는 구간.",
    "산업 흐름과 성장 가설이 동시에 유지되는 모습으로, 단기 변동보다 흐름의 길이를 보는 시점.",
    "성장 지속 가설이 현재까지 훼손되지 않은 상태로, 매도보다 흐름 유지 여부 관찰이 우선되는 구간.",
    "실적·산업 양측의 흐름이 함께 이어지는 모습으로, 장기 보유 관점이 그대로 유지되는 시점.",
  ],
  VALUATION_CAUTION: [
    "밸류 부담은 일부 있으나 산업 흐름과 실적이 함께 유지되며, 매도보다 흐름 확인이 우선되는 구간.",
    "단기 밸류 부담 가능성은 있으나 성장 가설 훼손 신호는 제한적으로 관찰되는 모습.",
    "밸류 측면 부담 가능성은 있으나, 산업 방향성과 실적 흐름이 동반되어 보유 여지가 남는 구간.",
    "밸류 부담 가능성이 있어 흐름의 길이를 점검할 필요가 있으나, 가설 훼손 신호는 아직 확인되지 않는 모습.",
  ],
  OBSERVATION_REQUIRED: [
    "현재 흐름이 회복 사이클에 가까워 단기 변동성 가능성이 있고, 흐름 유지 여부를 계속 관찰할 구간.",
    "단기 테마 성격이 일부 섞여 있어 흐름 지속 여부를 면밀히 확인할 필요가 있는 종목.",
    "회복 흐름 자체는 유지되는 모습이나 흐름의 길이를 두고 점검할 필요가 있는 구간.",
    "단기 흐름과 장기 흐름이 함께 작용하는 구간으로, 흐름 유지가 확인되는 동안엔 보유 여지가 있는 모습.",
  ],
  BASELINE: [
    "현재까지는 매도를 서두를 신호가 제한적으로 관찰되며, 산업·실적 흐름을 더 확인할 구간.",
    "장기 가설 훼손 신호가 명확히 잡히지 않은 상태로, 보유 유지를 두고 흐름을 관찰할 시점.",
    "현재까지의 데이터로는 매도 우선 신호가 명확하지 않아, 흐름 지속 여부를 점검할 구간.",
    "산업·실적 흐름의 지속 여부를 계속 확인할 필요가 있는 모습으로, 단기 매도보다 관찰이 우선되는 시점.",
  ],
};

const ABSOLUTE_FALLBACK =
  "현재까지는 매도 우선 신호가 명확히 잡히지 않은 상태로, 흐름 지속 여부를 관찰할 구간.";

function stableHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function seedOf(input: HoldNarrativeInput): string {
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

function classifyState(input: HoldNarrativeInput): HoldState {
  const sector = input.sectorDurabilityLabel || "";
  const longHold = input.longTermHoldView || "";
  const dur = input.growthDurabilityLabel || "";
  const per = typeof input.per === "number" ? input.per : null;

  // 단기 테마 성격이 강하면 관찰 우선
  if (sector.includes("단기 테마")) {
    return "OBSERVATION_REQUIRED";
  }

  // 흐름은 있으나 밸류 부담 큼 (PER > 30 등)
  if (per !== null && per > 30) {
    if (
      sector.includes("구조적") ||
      sector.includes("회복") ||
      longHold.includes("장기보유") ||
      dur.includes("장기보유")
    ) {
      return "VALUATION_CAUTION";
    }
  }

  // 장기보유 후보로 분류된 종목 — 가장 안정적 상태
  if (longHold.includes("장기보유") || dur.includes("장기보유")) {
    return "FLOW_HOLDING";
  }

  // 회복 사이클 단독 → 관찰
  if (sector.includes("회복 사이클")) {
    return "OBSERVATION_REQUIRED";
  }

  return "BASELINE";
}

export function buildHoldNarrative(
  input: HoldNarrativeInput | null | undefined
): string {
  if (!input || typeof input !== "object") {
    return ABSOLUTE_FALLBACK;
  }

  const state = classifyState(input);
  const variants = HOLD_TEMPLATES[state];

  if (!variants || variants.length === 0) {
    return ABSOLUTE_FALLBACK;
  }

  const idx = stableHash(seedOf(input) + "-H") % variants.length;
  const text = variants[idx];

  if (!text || text.length === 0) {
    return ABSOLUTE_FALLBACK;
  }

  return text;
}

// 내부 분류 결과를 QA가 활용할 수 있도록 export.
export function classifyHoldState(input: HoldNarrativeInput): HoldState {
  return classifyState(input);
}
