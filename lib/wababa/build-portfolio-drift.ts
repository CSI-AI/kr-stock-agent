// Phase 37-A9 — Portfolio Drift Timeline narrative layer
// 포트폴리오 상태의 시간 흐름 변화 요약. 차분한 PM 톤.
// ranking/scoring/자동매매 무영향. SELL trigger 생성 X. 빈 문자열 X.

export type PortfolioDriftSnapshot = {
  date?: string;
  longHoldRatio?: number; // 0~1
  cycleRatio?: number; // 0~1
  valuationStretchedRatio?: number; // 0~1
  cashRatePercent?: number; // 0~100
  totalPositions?: number;
};

export type PortfolioDriftInput = {
  fundKey?: string;
  current: PortfolioDriftSnapshot;
  previous?: PortfolioDriftSnapshot | null;
};

export type PortfolioDriftDirection =
  | "IMPROVING"
  | "STABLE"
  | "WATCH"
  | "DATA_LIMITED";

export type PortfolioDriftTimeline = {
  driftDirection: PortfolioDriftDirection;
  driftTitle: string;
  driftNarrative: string;
  driftTags: string[];
};

const DRIFT_TITLES: Record<PortfolioDriftDirection, string> = {
  IMPROVING: "장기 가설 비중 확대",
  STABLE: "큰 변화 없이 유지",
  WATCH: "변동성 노출 일부 확대",
  DATA_LIMITED: "비교 데이터 제한",
};

const DRIFT_NARRATIVES: Record<
  PortfolioDriftDirection,
  ReadonlyArray<string>
> = {
  IMPROVING: [
    "이전보다 장기 성장 가설 종목 비중이 늘어난 모습으로, 흐름이 안정적으로 유지되는 구간.",
    "장기보유 후보 비중이 점진적으로 늘어나며 관찰 중심 운영이 유지되는 상태.",
    "사이클 노출은 비슷한 수준이나 장기 성장 가설 종목이 늘어 균형이 개선된 흐름.",
  ],
  STABLE: [
    "이전 시점 대비 큰 변화 없이 현재 구성과 흐름이 그대로 유지되는 상태.",
    "구성·비중·현금 측면에서 큰 이동 없이 안정적으로 유지되는 포트폴리오.",
    "이전 대비 변화 폭이 제한적이며 현재 흐름을 그대로 이어가는 모습.",
  ],
  WATCH: [
    "이전보다 회복 사이클 노출이 일부 확대되어 변동성 관찰을 유지할 구간.",
    "사이클·밸류 측면 비중이 일부 늘어나며 흐름 점검이 한층 중요해진 상태.",
    "회복 사이클 종목 비중 증가가 관찰되어 단계적 흐름 점검이 필요한 시점.",
  ],
  DATA_LIMITED: [
    "누적 비교 데이터가 충분하지 않아 현재 구성 중심으로 관찰 중.",
    "이전 시점과의 비교 데이터가 부족해 현재 흐름을 중심으로 점검 중.",
    "비교 가능한 과거 데이터가 제한적이라 현재 상태 중심의 관찰을 이어가는 구간.",
  ],
};

const ABSOLUTE_FALLBACK =
  "비교 가능한 과거 데이터가 제한적이라 현재 상태 중심의 관찰을 이어가는 구간.";

const SIGNIFICANT_DELTA = 0.1; // ratio 변화 10pp 이상
const STABLE_BAND = 0.05; // ratio 변화 ±5pp 미만은 무시

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function isFiniteNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasComparableRatios(snap?: PortfolioDriftSnapshot | null): boolean {
  if (!snap) return false;
  return (
    isFiniteNum(snap.longHoldRatio) ||
    isFiniteNum(snap.cycleRatio) ||
    isFiniteNum(snap.valuationStretchedRatio)
  );
}

function classifyDirection(
  input: PortfolioDriftInput
): PortfolioDriftDirection {
  const cur = input.current;
  const prev = input.previous;

  if (!hasComparableRatios(prev) || !hasComparableRatios(cur)) {
    return "DATA_LIMITED";
  }

  const longDelta =
    isFiniteNum(cur.longHoldRatio) && isFiniteNum(prev!.longHoldRatio)
      ? cur.longHoldRatio - prev!.longHoldRatio
      : 0;
  const cycleDelta =
    isFiniteNum(cur.cycleRatio) && isFiniteNum(prev!.cycleRatio)
      ? cur.cycleRatio - prev!.cycleRatio
      : 0;
  const valDelta =
    isFiniteNum(cur.valuationStretchedRatio) &&
    isFiniteNum(prev!.valuationStretchedRatio)
      ? cur.valuationStretchedRatio - prev!.valuationStretchedRatio
      : 0;

  // WATCH 우선 — 사이클·밸류 부담 확대가 가장 점검 필요
  if (cycleDelta >= SIGNIFICANT_DELTA || valDelta >= SIGNIFICANT_DELTA) {
    return "WATCH";
  }

  // IMPROVING — 장기보유 비중 확대 + 사이클/밸류 부담 안정
  if (
    longDelta >= SIGNIFICANT_DELTA &&
    cycleDelta <= STABLE_BAND &&
    valDelta <= STABLE_BAND
  ) {
    return "IMPROVING";
  }

  return "STABLE";
}

function formatDeltaPp(delta: number, suffix: string): string | null {
  const pp = Math.round(delta * 100);
  if (pp === 0) return null;
  const sign = pp > 0 ? "+" : "";
  return `${suffix} ${sign}${pp}pp`;
}

function buildTags(input: PortfolioDriftInput, dir: PortfolioDriftDirection): string[] {
  if (dir === "DATA_LIMITED") {
    return ["비교 데이터 부족"];
  }

  const cur = input.current;
  const prev = input.previous!;
  const tags: string[] = [];

  if (isFiniteNum(cur.longHoldRatio) && isFiniteNum(prev.longHoldRatio)) {
    const delta = cur.longHoldRatio - prev.longHoldRatio;
    const tag = formatDeltaPp(delta, "장기보유");
    if (tag) {
      tags.push(tag);
    } else {
      tags.push("장기보유 안정");
    }
  }

  if (isFiniteNum(cur.cycleRatio) && isFiniteNum(prev.cycleRatio)) {
    const delta = cur.cycleRatio - prev.cycleRatio;
    const tag = formatDeltaPp(delta, "사이클");
    if (tag) {
      tags.push(tag);
    } else {
      tags.push("사이클 안정");
    }
  }

  if (
    isFiniteNum(cur.cashRatePercent) &&
    isFiniteNum(prev.cashRatePercent)
  ) {
    const cashDelta = cur.cashRatePercent - prev.cashRatePercent;
    const ppRounded = Math.round(cashDelta);
    if (ppRounded !== 0) {
      const sign = ppRounded > 0 ? "+" : "";
      tags.push(`현금 ${sign}${ppRounded}pp`);
    }
  }

  return tags.slice(0, 3);
}

function seedOf(input: PortfolioDriftInput): string {
  const cur = input.current || {};
  const prev = input.previous || {};
  return `${input.fundKey || "fund"}::${cur.date || ""}::${prev.date || ""}`;
}

export function buildPortfolioDriftTimeline(
  input: PortfolioDriftInput | null | undefined
): PortfolioDriftTimeline {
  if (!input || typeof input !== "object" || !input.current) {
    return {
      driftDirection: "DATA_LIMITED",
      driftTitle: DRIFT_TITLES.DATA_LIMITED,
      driftNarrative: ABSOLUTE_FALLBACK,
      driftTags: ["비교 데이터 부족"],
    };
  }

  const direction = classifyDirection(input);
  const variants = DRIFT_NARRATIVES[direction];
  const idx = stableHash(seedOf(input) + "-D") % variants.length;
  const narrative = variants[idx] || ABSOLUTE_FALLBACK;
  const tags = buildTags(input, direction);

  return {
    driftDirection: direction,
    driftTitle: DRIFT_TITLES[direction],
    driftNarrative: narrative,
    driftTags: tags,
  };
}

export function classifyPortfolioDriftDirection(
  input: PortfolioDriftInput
): PortfolioDriftDirection {
  return classifyDirection(input);
}
