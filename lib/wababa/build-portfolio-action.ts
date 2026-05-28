// Phase 37-A10 — AI Portfolio Action Layer
// "오늘 PM이 무엇을 우선 관찰·운영하는가" 설명용. 매수/매도 지시 X.
// ranking/scoring/자동매매 무영향. SELL/BUY trigger 단어 사용 금지.

import type { PortfolioHoldingInput } from "./build-portfolio-state";
import type { PortfolioDriftDirection } from "./build-portfolio-drift";

export type PortfolioActionInput = {
  fundKey?: string;
  holdings: PortfolioHoldingInput[];
  cashRatePercent?: number;
  driftDirection?: PortfolioDriftDirection;
  totalPositions?: number;
};

export type PortfolioActionMode =
  | "OBSERVATION"
  | "BALANCED"
  | "CYCLE_WATCH"
  | "CASH_READY"
  | "GROWTH_FOCUS";

export type PortfolioActionLayer = {
  actionMode: PortfolioActionMode;
  actionTitle: string;
  actionNarrative: string;
  actionTags: string[];
};

const ACTION_TITLES: Record<PortfolioActionMode, string> = {
  OBSERVATION: "관찰 중심 운영",
  BALANCED: "균형 유지 운영",
  CYCLE_WATCH: "사이클 변동성 관찰",
  CASH_READY: "현금 여력 보존",
  GROWTH_FOCUS: "장기 성장 가설 중심",
};

// Mode별 4 variant. 차분한 PM 톤. 미래 단정/매수·매도 권유 표현 금지.
const ACTION_NARRATIVES: Record<PortfolioActionMode, ReadonlyArray<string>> = {
  OBSERVATION: [
    "현재는 신규 확대보다 기존 흐름 유지 여부를 우선 관찰하는 상태.",
    "흐름 변화가 크게 감지되지 않아 관찰 중심으로 운영하는 구간.",
    "현재 구성과 흐름을 유지하며 점진적 신호를 기다리는 운영 모드.",
    "데이터 흐름이 충분히 누적되기 전까지는 관찰 우선으로 운영하는 시점.",
  ],
  BALANCED: [
    "현재 구성과 흐름을 유지하며 실적 지속 여부 중심으로 점검 중.",
    "큰 방향 전환 신호 없이 균형 상태를 유지하며 관찰을 이어가는 운영.",
    "산업·실적 흐름의 길이를 보면서 균형 비중을 유지하는 단계.",
    "특별 신호 없이 흐름 유지와 단계적 점검을 함께 진행하는 모드.",
  ],
  CYCLE_WATCH: [
    "회복 사이클형 종목 비중이 있어 변동성 흐름을 함께 관찰하는 운영 상태.",
    "회복 사이클 비중을 두고 사이클 지속 여부를 단계적으로 점검하는 운영.",
    "사이클 노출이 일부 존재해 단기 변동성과 흐름 지속을 함께 보는 모드.",
    "회복 사이클형 비중을 관찰하면서 흐름 유지 여부를 우선 점검하는 단계.",
  ],
  CASH_READY: [
    "현금 비중이 높은 상태로 추가 기회 탐색 여력이 유지되는 구성.",
    "현금이 충분히 확보되어 후보 종목 발굴에 여유가 있는 운영 모드.",
    "현금 비중 우세 상태로 신규 진입은 보수적으로 검토하며 관찰 우선.",
    "현금이 두텁게 유지되어 새로운 흐름이 잡힐 때까지 관찰을 이어가는 단계.",
  ],
  GROWTH_FOCUS: [
    "장기 성장 흐름 유지 종목 중심으로 흐름 지속 여부를 점검하는 포트폴리오.",
    "장기 성장 가설 비중이 우세해 흐름 유지를 핵심으로 보는 운영 모드.",
    "성장 지속 가설 종목 중심 구성으로 단기보다 흐름의 길이를 우선 관찰.",
    "장기 보유 후보 중심 비중을 두고 가설 유지 여부를 단계별로 점검하는 단계.",
  ],
};

const ACTION_TAGS: Record<PortfolioActionMode, ReadonlyArray<string>> = {
  OBSERVATION: ["관찰 우선", "흐름 변화 점검", "신규 보수적 검토"],
  BALANCED: ["균형 유지", "실적 지속 점검", "흐름 관찰 지속"],
  CYCLE_WATCH: ["변동성 점검", "사이클 흐름 추적", "장기 가설 유지 확인"],
  CASH_READY: ["현금 여력 유지", "후보 탐색 지속", "신규 보수적 진입"],
  GROWTH_FOCUS: ["장기 가설 유지 점검", "흐름 길이 관찰", "단기 변동 무게 낮춤"],
};

const ABSOLUTE_FALLBACK =
  "현재는 신규 확대보다 기존 흐름 유지 여부를 우선 관찰하는 상태.";

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seedOf(input: PortfolioActionInput): string {
  const holdings = input.holdings || [];
  const codes = holdings
    .map((h) => h.code || h.name || "")
    .filter(Boolean)
    .sort()
    .join("|");
  return `${input.fundKey || "fund"}::${codes}`;
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
  return (h.sectorDurabilityLabel || "").includes("회복 사이클");
}

function classifyMode(input: PortfolioActionInput): PortfolioActionMode {
  const holdings = input.holdings || [];
  const total = holdings.length;

  if (total === 0) {
    return "OBSERVATION";
  }

  const longHoldRatio = holdings.filter(isLongHold).length / total;
  const cycleRatio = holdings.filter(isCycle).length / total;
  const cashRate =
    typeof input.cashRatePercent === "number" ? input.cashRatePercent : 0;
  const drift = input.driftDirection;

  // 1) CYCLE_WATCH 우선 — 변동성 점검이 가장 시급
  if (cycleRatio >= 0.5) {
    return "CYCLE_WATCH";
  }

  // 2) 장기 성장 가설 중심
  if (longHoldRatio >= 0.6) {
    return "GROWTH_FOCUS";
  }

  // 3) 현금 비중 높은 운영 (60% 이상)
  if (cashRate >= 60) {
    return "CASH_READY";
  }

  // 4) drift 데이터 부족 → 관찰 중심
  if (drift === "DATA_LIMITED") {
    return "OBSERVATION";
  }

  return "BALANCED";
}

export function buildPortfolioActionLayer(
  input: PortfolioActionInput | null | undefined
): PortfolioActionLayer {
  if (!input || typeof input !== "object" || !Array.isArray(input.holdings)) {
    return {
      actionMode: "OBSERVATION",
      actionTitle: ACTION_TITLES.OBSERVATION,
      actionNarrative: ABSOLUTE_FALLBACK,
      actionTags: [...ACTION_TAGS.OBSERVATION],
    };
  }

  const mode = classifyMode(input);
  const variants = ACTION_NARRATIVES[mode];
  const idx = stableHash(seedOf(input) + "-A") % variants.length;
  const narrative = variants[idx] || ABSOLUTE_FALLBACK;

  return {
    actionMode: mode,
    actionTitle: ACTION_TITLES[mode],
    actionNarrative: narrative,
    actionTags: [...ACTION_TAGS[mode]],
  };
}

export function classifyPortfolioActionMode(
  input: PortfolioActionInput
): PortfolioActionMode {
  return classifyMode(input);
}
