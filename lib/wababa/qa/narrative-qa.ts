// Phase 37-A3 — narrative QA layer
// 검출/리포트 전용. ranking/scoring/narrative auto-fix 없음.
// 추천 결과 변경 0. UI/자동매매 미접촉.

import {
  buildSectorDurabilityNarrative,
  type SectorNarrativeInput,
} from "../build-sector-durability-narrative";
import {
  buildHoldNarrative,
  classifyHoldState,
  type HoldNarrativeInput,
} from "../build-hold-narrative";
import {
  buildHoldRiskNarrative,
  classifyHoldRiskState,
  type HoldRiskNarrativeInput,
} from "../build-hold-risk-narrative";
import {
  buildPortfolioState,
  type PortfolioState,
  type PortfolioStateInput,
} from "../build-portfolio-state";
import {
  buildPortfolioDriftTimeline,
  type PortfolioDriftInput,
  type PortfolioDriftTimeline,
} from "../build-portfolio-drift";
import {
  buildPortfolioActionLayer,
  type PortfolioActionInput,
  type PortfolioActionLayer,
} from "../build-portfolio-action";

export type NarrativeIssueCode =
  | "INDUSTRY_MISMATCH"
  | "FACTOR_INCONSISTENT"
  | "OVERSTATEMENT"
  | "FALLBACK_TOO_SHORT"
  | "FALLBACK_GENERIC"
  | "OVER_LENGTH"
  | "INTERNAL_WORDING_DUPLICATE"
  | "HOLD_BUY_TONE_CONFLICT"
  | "HOLD_OVERSTATEMENT"
  | "HOLD_RISK_BEARISH_TONE"
  | "HOLD_RISK_SELL_TRIGGER"
  | "HOLD_RISK_BUY_CONFLICT"
  | "PORTFOLIO_OVERSTATEMENT"
  | "PORTFOLIO_BEARISH_TONE"
  | "PORTFOLIO_OVER_LENGTH"
  | "PORTFOLIO_DRIFT_OVERSTATEMENT"
  | "PORTFOLIO_DRIFT_BEARISH_TONE"
  | "PORTFOLIO_DRIFT_OVER_LENGTH"
  | "PORTFOLIO_ACTION_OVERSTATEMENT"
  | "PORTFOLIO_ACTION_SELL_TRIGGER"
  | "PORTFOLIO_ACTION_BUY_TRIGGER"
  | "PORTFOLIO_ACTION_OVER_LENGTH";

export type NarrativeIssue = {
  code: NarrativeIssueCode;
  message: string;
  phrase?: string;
};

export type ExpectedBucket =
  | "SEMICON_AI"
  | "POWER_GRID"
  | "DEFENSE_HEAVY"
  | "CONTENT_IP"
  | null;

export type NarrativeQAResult = {
  code: string;
  name: string;
  industryName: string;
  narrative: string;
  isFallback: boolean;
  expectedBucketFromIndustry: ExpectedBucket;
  pickedBucket: ExpectedBucket;
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

const OVERSTATEMENT_WORDS = [
  "폭발",
  "압도적",
  "혁신적",
  "독점",
  "무조건",
  "반드시",
  "100%",
  "보장",
  "확실히",
  "급등",
  "떡상",
  "폭등",
];

// industryName 단독으로 확정 가능한 bucket만 등록. 모호한 경우는 null 처리.
const INDUSTRY_DEFINITIVE: Array<{ key: string; bucket: ExpectedBucket }> = [
  { key: "반도체", bucket: "SEMICON_AI" },
  { key: "조선", bucket: "DEFENSE_HEAVY" },
  { key: "방산", bucket: "DEFENSE_HEAVY" },
  { key: "엔터테인", bucket: "CONTENT_IP" },
  { key: "콘텐츠", bucket: "CONTENT_IP" },
  { key: "음반", bucket: "CONTENT_IP" },
  { key: "미디어", bucket: "CONTENT_IP" },
  { key: "전력기기", bucket: "POWER_GRID" },
  { key: "전선", bucket: "POWER_GRID" },
];

// narrative 본문이 강하게 시사하는 bucket 키워드 (factor cross-check 용)
const NARRATIVE_BUCKET_HINTS: Record<Exclude<ExpectedBucket, null>, string[]> = {
  SEMICON_AI: ["반도체", "HBM", "메모리", "데이터센터", "후공정", "파운드리"],
  POWER_GRID: ["전력 인프라", "송배전", "변압기", "전력기기", "전력망"],
  DEFENSE_HEAVY: ["방산", "조선", "함정", "국방예산", "수주잔고"],
  CONTENT_IP: ["IP 라이선싱", "팬덤", "콘텐츠 매출", "음반", "OTT", "굿즈"],
};

// 의미 cluster — narrative 안에 같은 cluster 단어가 2회 이상 등장하면 내부 중복으로 본다.
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  PERSIST: ["지속 가능성", "지속성", "지속에", "이어지는", "이어지며"],
  DEMAND_UP: ["수요 확대", "수요 증가", "수요 회복", "수요 가시성"],
  EARNINGS: ["실적 흐름", "실적 개선", "실적 가시성", "실적 기반", "실적 지속"],
};

const LENGTH_LIMIT_SOFT = 110;

function pickBucketFromIndustry(industryName: string | undefined): ExpectedBucket {
  if (!industryName) {
    return null;
  }

  for (const entry of INDUSTRY_DEFINITIVE) {
    if (industryName.includes(entry.key)) {
      return entry.bucket;
    }
  }

  return null;
}

function classifyNarrativeBucket(narrative: string): ExpectedBucket {
  const ordered: Array<Exclude<ExpectedBucket, null>> = [
    "DEFENSE_HEAVY",
    "POWER_GRID",
    "SEMICON_AI",
    "CONTENT_IP",
  ];

  for (const bucket of ordered) {
    for (const hint of NARRATIVE_BUCKET_HINTS[bucket]) {
      if (narrative.includes(hint)) {
        return bucket;
      }
    }
  }

  return null;
}

function detectOverstatement(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const word of OVERSTATEMENT_WORDS) {
    if (narrative.includes(word)) {
      issues.push({
        code: "OVERSTATEMENT",
        message: `과장 표현 검출: "${word}"`,
        phrase: word,
      });
    }
  }

  return issues;
}

function detectIndustryMismatch(
  expected: ExpectedBucket,
  narrativeBucket: ExpectedBucket
): NarrativeIssue | null {
  if (!expected || !narrativeBucket) {
    return null;
  }

  if (expected === narrativeBucket) {
    return null;
  }

  return {
    code: "INDUSTRY_MISMATCH",
    message: `산업 분류상 ${expected} 기대인데 narrative bucket은 ${narrativeBucket}.`,
  };
}

function detectFactorInconsistency(
  narrative: string,
  input: SectorNarrativeInput
): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  const mentionsOrder =
    narrative.includes("수주잔고") ||
    narrative.includes("수주 가시") ||
    narrative.includes("수주 흐름") ||
    narrative.includes("수주가 분산");

  if (mentionsOrder) {
    const tags = input.growthSignalTags || [];
    const haystack = `${input.industryTailwind || ""} ${
      (input.coreCatalyst || []).join(" ")
    } ${input.growthStory || ""} ${input.hypothesis || ""}`;

    if (!tags.includes("수주") && !haystack.includes("수주")) {
      issues.push({
        code: "FACTOR_INCONSISTENT",
        message:
          "narrative가 수주를 언급하나 growthSignalTags/coreCatalyst/tailwind 어디에도 수주 근거 없음.",
      });
    }
  }

  const mentionsDualGrowth =
    narrative.includes("매출·영업이익") ||
    narrative.includes("매출과 영업이익") ||
    narrative.includes("매출·이익");

  if (mentionsDualGrowth) {
    const catalyst = (input.coreCatalyst || [])[0] || "";

    if (!(catalyst.includes("매출") && catalyst.includes("영업이익"))) {
      issues.push({
        code: "FACTOR_INCONSISTENT",
        message:
          "narrative가 매출·영업이익 동반 성장을 언급하나 coreCatalyst 첫 항목이 이를 뒷받침하지 않음.",
      });
    }
  }

  return issues;
}

function detectInternalDuplicate(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const [clusterId, words] of Object.entries(SEMANTIC_CLUSTERS)) {
    let hits = 0;

    for (const word of words) {
      const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const matches = narrative.match(re);

      if (matches) {
        hits += matches.length;
      }
    }

    if (hits >= 3) {
      issues.push({
        code: "INTERNAL_WORDING_DUPLICATE",
        message: `한 narrative 안에서 의미 cluster "${clusterId}" 어구가 ${hits}회 반복.`,
        phrase: clusterId,
      });
    }
  }

  return issues;
}

function detectFallbackQuality(
  narrative: string,
  isFallback: boolean
): NarrativeIssue[] {
  if (!isFallback) {
    return [];
  }

  const issues: NarrativeIssue[] = [];

  if (narrative.length < 8) {
    issues.push({
      code: "FALLBACK_TOO_SHORT",
      message: `fallback 문장 길이 ${narrative.length}자 — 의미가 거의 없음.`,
    });
  }

  if (
    narrative.startsWith("산업 흐름과 실적 추이를 함께 점검할 구간")
  ) {
    issues.push({
      code: "FALLBACK_GENERIC",
      message: "generic fallback 사용 — 데이터 풍부도가 부족함을 시사.",
    });
  }

  return issues;
}

function detectOverLength(narrative: string): NarrativeIssue[] {
  if (narrative.length <= LENGTH_LIMIT_SOFT) {
    return [];
  }

  return [
    {
      code: "OVER_LENGTH",
      message: `narrative 길이 ${narrative.length}자 (limit ${LENGTH_LIMIT_SOFT}). 모바일 line-clamp-3에 과의존할 수 있음.`,
    },
  ];
}

function computeQualityScore(issues: NarrativeIssue[]): number {
  const penalty: Record<NarrativeIssueCode, number> = {
    INDUSTRY_MISMATCH: 25,
    FACTOR_INCONSISTENT: 15,
    OVERSTATEMENT: 30,
    FALLBACK_TOO_SHORT: 10,
    FALLBACK_GENERIC: 5,
    OVER_LENGTH: 10,
    INTERNAL_WORDING_DUPLICATE: 5,
    HOLD_BUY_TONE_CONFLICT: 20,
    HOLD_OVERSTATEMENT: 30,
    HOLD_RISK_BEARISH_TONE: 30,
    HOLD_RISK_SELL_TRIGGER: 30,
    HOLD_RISK_BUY_CONFLICT: 15,
    PORTFOLIO_OVERSTATEMENT: 30,
    PORTFOLIO_BEARISH_TONE: 25,
    PORTFOLIO_OVER_LENGTH: 10,
    PORTFOLIO_DRIFT_OVERSTATEMENT: 30,
    PORTFOLIO_DRIFT_BEARISH_TONE: 25,
    PORTFOLIO_DRIFT_OVER_LENGTH: 10,
    PORTFOLIO_ACTION_OVERSTATEMENT: 30,
    PORTFOLIO_ACTION_SELL_TRIGGER: 30,
    PORTFOLIO_ACTION_BUY_TRIGGER: 25,
    PORTFOLIO_ACTION_OVER_LENGTH: 10,
  };

  let score = 100;

  for (const issue of issues) {
    score -= penalty[issue.code] ?? 0;
  }

  return Math.max(0, score);
}

export function analyzeNarrative(
  input: SectorNarrativeInput
): NarrativeQAResult {
  const narrative = buildSectorDurabilityNarrative(input);

  const expectedBucketFromIndustry = pickBucketFromIndustry(input.industryName);
  const pickedBucket = classifyNarrativeBucket(narrative);
  // isFallback: pickedBucket이 null이면 함수가 fallback 경로를 탔다고 본다.
  const isFallback = pickedBucket === null;

  const issues: NarrativeIssue[] = [
    ...detectOverstatement(narrative),
    ...detectFactorInconsistency(narrative, input),
    ...detectInternalDuplicate(narrative),
    ...detectFallbackQuality(narrative, isFallback),
    ...detectOverLength(narrative),
  ];

  const mismatch = detectIndustryMismatch(
    expectedBucketFromIndustry,
    pickedBucket
  );

  if (mismatch) {
    issues.push(mismatch);
  }

  return {
    code: input.code || input.symbol || "",
    name: input.name || input.corpName || input.stockName || "",
    industryName: input.industryName || "",
    narrative,
    isFallback,
    expectedBucketFromIndustry,
    pickedBucket,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}

export type CorpusDuplicateCluster = {
  endingTail: string;
  count: number;
  members: Array<{ code: string; name: string }>;
};

export type CorpusSummary = {
  total: number;
  fallbackCount: number;
  fallbackPercent: number;
  avgLength: number;
  maxLength: number;
  issueCounts: Record<NarrativeIssueCode, number>;
  avgQualityScore: number;
  duplicateClusters: CorpusDuplicateCluster[];
};

export function summarizeCorpus(
  results: NarrativeQAResult[]
): CorpusSummary {
  const total = results.length;
  const fallbackCount = results.filter((r) => r.isFallback).length;
  const sumLen = results.reduce((acc, r) => acc + r.length, 0);
  const maxLength = results.reduce((acc, r) => Math.max(acc, r.length), 0);
  const sumScore = results.reduce((acc, r) => acc + r.qualityScore, 0);

  const issueCounts: Record<NarrativeIssueCode, number> = {
    INDUSTRY_MISMATCH: 0,
    FACTOR_INCONSISTENT: 0,
    OVERSTATEMENT: 0,
    FALLBACK_TOO_SHORT: 0,
    FALLBACK_GENERIC: 0,
    OVER_LENGTH: 0,
    INTERNAL_WORDING_DUPLICATE: 0,
    HOLD_BUY_TONE_CONFLICT: 0,
    HOLD_OVERSTATEMENT: 0,
    HOLD_RISK_BEARISH_TONE: 0,
    HOLD_RISK_SELL_TRIGGER: 0,
    HOLD_RISK_BUY_CONFLICT: 0,
    PORTFOLIO_OVERSTATEMENT: 0,
    PORTFOLIO_BEARISH_TONE: 0,
    PORTFOLIO_OVER_LENGTH: 0,
    PORTFOLIO_DRIFT_OVERSTATEMENT: 0,
    PORTFOLIO_DRIFT_BEARISH_TONE: 0,
    PORTFOLIO_DRIFT_OVER_LENGTH: 0,
    PORTFOLIO_ACTION_OVERSTATEMENT: 0,
    PORTFOLIO_ACTION_SELL_TRIGGER: 0,
    PORTFOLIO_ACTION_BUY_TRIGGER: 0,
    PORTFOLIO_ACTION_OVER_LENGTH: 0,
  };

  for (const r of results) {
    for (const issue of r.issues) {
      issueCounts[issue.code] += 1;
    }
  }

  // ending tail 30자 hash로 cluster (동일 종목 다회 등장은 unique code 기준으로 dedup)
  const tailMap = new Map<string, Map<string, { code: string; name: string }>>();

  for (const r of results) {
    const sentences = r.narrative
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tail =
      sentences[sentences.length - 1]?.slice(-30) ||
      r.narrative.slice(-30);

    const existing = tailMap.get(tail) || new Map<string, { code: string; name: string }>();
    const dedupKey = r.code || r.name;
    if (!existing.has(dedupKey)) {
      existing.set(dedupKey, { code: r.code, name: r.name });
    }
    tailMap.set(tail, existing);
  }

  const duplicateClusters: CorpusDuplicateCluster[] = [];

  for (const [tail, membersMap] of tailMap.entries()) {
    const members = Array.from(membersMap.values());

    if (members.length >= 3) {
      duplicateClusters.push({
        endingTail: tail,
        count: members.length,
        members,
      });
    }
  }

  duplicateClusters.sort((a, b) => b.count - a.count);

  return {
    total,
    fallbackCount,
    fallbackPercent: total > 0 ? Number(((fallbackCount / total) * 100).toFixed(1)) : 0,
    avgLength: total > 0 ? Number((sumLen / total).toFixed(1)) : 0,
    maxLength,
    issueCounts,
    avgQualityScore: total > 0 ? Number((sumScore / total).toFixed(1)) : 0,
    duplicateClusters,
  };
}

// ───────────────────────────────────────────────────────────────
// Hold narrative QA (Phase 37-A5)
// ───────────────────────────────────────────────────────────────

// HOLD narrative에 절대 들어가면 안 되는 BUY-ish 단어. (충돌 검출용)
const BUY_TONE_PHRASES = [
  "매수 검토",
  "신규 진입",
  "신규 매수",
  "지금이 매수 시점",
  "재평가 여지", // 추천 narrative ending에서 쓰이는 표현
  "선별 매수",
  "비중확대",
];

// HOLD narrative에서 강한 미래 단정/감성 표현 추가 검출 (BUY 룰과 일부 중복 허용)
const HOLD_FORBIDDEN_PHRASES = [
  "반드시 상승",
  "확실히 오른다",
  "무조건",
  "100%",
  "급등",
  "폭등",
  "압도적",
];

export type HoldNarrativeQAResult = {
  code: string;
  name: string;
  industryName: string;
  state: ReturnType<typeof classifyHoldState>;
  narrative: string;
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

function detectHoldBuyToneConflict(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const phrase of BUY_TONE_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "HOLD_BUY_TONE_CONFLICT",
        message: `HOLD narrative에 BUY 톤 표현이 포함됨: "${phrase}"`,
        phrase,
      });
    }
  }

  return issues;
}

function detectHoldOverstatement(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const phrase of HOLD_FORBIDDEN_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "HOLD_OVERSTATEMENT",
        message: `HOLD narrative에 금지 표현 검출: "${phrase}"`,
        phrase,
      });
    }
  }

  return issues;
}

export function analyzeHoldNarrative(
  input: HoldNarrativeInput
): HoldNarrativeQAResult {
  const narrative = buildHoldNarrative(input);
  const state = classifyHoldState(input);

  const issues: NarrativeIssue[] = [
    ...detectOverstatement(narrative),
    ...detectHoldOverstatement(narrative),
    ...detectHoldBuyToneConflict(narrative),
    ...detectInternalDuplicate(narrative),
    ...detectOverLength(narrative),
  ];

  return {
    code: input.code || input.symbol || "",
    name: input.name || input.corpName || input.stockName || "",
    industryName: input.industryName || "",
    state,
    narrative,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}

export type HoldCorpusSummary = {
  total: number;
  stateCounts: Record<ReturnType<typeof classifyHoldState>, number>;
  avgLength: number;
  maxLength: number;
  issueCounts: Partial<Record<NarrativeIssueCode, number>>;
  avgQualityScore: number;
  duplicateClusters: CorpusDuplicateCluster[];
};

export function summarizeHoldCorpus(
  results: HoldNarrativeQAResult[]
): HoldCorpusSummary {
  const total = results.length;
  const stateCounts: HoldCorpusSummary["stateCounts"] = {
    FLOW_HOLDING: 0,
    VALUATION_CAUTION: 0,
    OBSERVATION_REQUIRED: 0,
    BASELINE: 0,
  };

  const issueCounts: Partial<Record<NarrativeIssueCode, number>> = {};
  let sumLen = 0;
  let maxLength = 0;
  let sumScore = 0;

  for (const r of results) {
    stateCounts[r.state] += 1;
    sumLen += r.length;
    maxLength = Math.max(maxLength, r.length);
    sumScore += r.qualityScore;

    for (const issue of r.issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }

  // ending tail dedup cluster (동일 종목 dedup)
  const tailMap = new Map<string, Map<string, { code: string; name: string }>>();

  for (const r of results) {
    const sentences = r.narrative
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tail =
      sentences[sentences.length - 1]?.slice(-30) ||
      r.narrative.slice(-30);

    const existing =
      tailMap.get(tail) || new Map<string, { code: string; name: string }>();
    const dedupKey = r.code || r.name;
    if (!existing.has(dedupKey)) {
      existing.set(dedupKey, { code: r.code, name: r.name });
    }
    tailMap.set(tail, existing);
  }

  const duplicateClusters: CorpusDuplicateCluster[] = [];

  for (const [tail, membersMap] of tailMap.entries()) {
    const members = Array.from(membersMap.values());

    if (members.length >= 3) {
      duplicateClusters.push({
        endingTail: tail,
        count: members.length,
        members,
      });
    }
  }

  duplicateClusters.sort((a, b) => b.count - a.count);

  return {
    total,
    stateCounts,
    avgLength: total > 0 ? Number((sumLen / total).toFixed(1)) : 0,
    maxLength,
    issueCounts,
    avgQualityScore: total > 0 ? Number((sumScore / total).toFixed(1)) : 0,
    duplicateClusters,
  };
}

// ───────────────────────────────────────────────────────────────
// Hold Risk narrative QA (Phase 37-A6)
// ───────────────────────────────────────────────────────────────

// 관찰형 PM 톤 침범 단어. 미래 단정/감성/매도 권유는 모두 위반.
const HOLD_RISK_BEARISH_PHRASES = [
  "위험하다",
  "곧 하락",
  "폭락",
  "반드시 조정",
  "확실히 하락",
  "무조건 빠진",
  "급락 임박",
  "압도적 하락",
];

// SELL trigger 단어 — narrative가 매도 사유를 만들면 안 됨.
const HOLD_RISK_SELL_TRIGGER_PHRASES = [
  "매도 필요",
  "매도 권고",
  "매도 신호",
  "처분 필요",
  "익절 필요",
  "손절 필요",
  "전량 매도",
];

// BUY 톤 — 추천 메시지처럼 보이면 안 됨.
const HOLD_RISK_BUY_TONE_PHRASES = [
  "지금 매수",
  "매수 검토",
  "신규 진입",
  "비중확대",
  "재평가 여지",
];

export type HoldRiskQAResult = {
  code: string;
  name: string;
  industryName: string;
  state: ReturnType<typeof classifyHoldRiskState>;
  narrative: string;
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

function detectHoldRiskBearishTone(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const phrase of HOLD_RISK_BEARISH_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "HOLD_RISK_BEARISH_TONE",
        message: `risk narrative에 과도한 bearish 표현: "${phrase}"`,
        phrase,
      });
    }
  }

  return issues;
}

function detectHoldRiskSellTrigger(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const phrase of HOLD_RISK_SELL_TRIGGER_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "HOLD_RISK_SELL_TRIGGER",
        message: `risk narrative가 SELL 추천을 만들고 있음: "${phrase}"`,
        phrase,
      });
    }
  }

  return issues;
}

function detectHoldRiskBuyConflict(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];

  for (const phrase of HOLD_RISK_BUY_TONE_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "HOLD_RISK_BUY_CONFLICT",
        message: `risk narrative에 BUY 톤 단어 침범: "${phrase}"`,
        phrase,
      });
    }
  }

  return issues;
}

export function analyzeHoldRiskNarrative(
  input: HoldRiskNarrativeInput
): HoldRiskQAResult {
  const narrative = buildHoldRiskNarrative(input);
  const state = classifyHoldRiskState(input);

  const issues: NarrativeIssue[] = [
    ...detectOverstatement(narrative),
    ...detectHoldRiskBearishTone(narrative),
    ...detectHoldRiskSellTrigger(narrative),
    ...detectHoldRiskBuyConflict(narrative),
    ...detectInternalDuplicate(narrative),
    ...detectOverLength(narrative),
  ];

  return {
    code: input.code || input.symbol || "",
    name: input.name || input.corpName || input.stockName || "",
    industryName: input.industryName || "",
    state,
    narrative,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}

export type HoldRiskCorpusSummary = {
  total: number;
  stateCounts: Record<ReturnType<typeof classifyHoldRiskState>, number>;
  avgLength: number;
  maxLength: number;
  issueCounts: Partial<Record<NarrativeIssueCode, number>>;
  avgQualityScore: number;
  duplicateClusters: CorpusDuplicateCluster[];
};

export function summarizeHoldRiskCorpus(
  results: HoldRiskQAResult[]
): HoldRiskCorpusSummary {
  const total = results.length;
  const stateCounts: HoldRiskCorpusSummary["stateCounts"] = {
    VALUATION_WATCH: 0,
    CYCLE_VOLATILITY: 0,
    GROWTH_CONFIRMATION: 0,
    BASELINE_OBSERVATION: 0,
  };

  const issueCounts: Partial<Record<NarrativeIssueCode, number>> = {};
  let sumLen = 0;
  let maxLength = 0;
  let sumScore = 0;

  for (const r of results) {
    stateCounts[r.state] += 1;
    sumLen += r.length;
    maxLength = Math.max(maxLength, r.length);
    sumScore += r.qualityScore;

    for (const issue of r.issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }

  // ending tail dedup cluster
  const tailMap = new Map<string, Map<string, { code: string; name: string }>>();

  for (const r of results) {
    const sentences = r.narrative
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const tail =
      sentences[sentences.length - 1]?.slice(-30) ||
      r.narrative.slice(-30);

    const existing =
      tailMap.get(tail) || new Map<string, { code: string; name: string }>();
    const dedupKey = r.code || r.name;
    if (!existing.has(dedupKey)) {
      existing.set(dedupKey, { code: r.code, name: r.name });
    }
    tailMap.set(tail, existing);
  }

  const duplicateClusters: CorpusDuplicateCluster[] = [];

  for (const [tail, membersMap] of tailMap.entries()) {
    const members = Array.from(membersMap.values());

    if (members.length >= 3) {
      duplicateClusters.push({
        endingTail: tail,
        count: members.length,
        members,
      });
    }
  }

  duplicateClusters.sort((a, b) => b.count - a.count);

  return {
    total,
    stateCounts,
    avgLength: total > 0 ? Number((sumLen / total).toFixed(1)) : 0,
    maxLength,
    issueCounts,
    avgQualityScore: total > 0 ? Number((sumScore / total).toFixed(1)) : 0,
    duplicateClusters,
  };
}

// ───────────────────────────────────────────────────────────────
// Portfolio State narrative QA (Phase 37-A8)
// ───────────────────────────────────────────────────────────────

const PORTFOLIO_OVERSTATEMENT_PHRASES = [
  "완벽",
  "안전",
  "무조건 수익",
  "폭등 가능",
  "압도적",
  "최강 포트폴리오",
  "확실한 수익",
];

const PORTFOLIO_BEARISH_PHRASES = [
  "위험하다",
  "곧 하락",
  "폭락",
  "반드시 조정",
  "확실히 하락",
  "급락 임박",
];

const PORTFOLIO_LENGTH_LIMIT = 140;

export type PortfolioStateQAResult = {
  fundKey: string;
  state: PortfolioState["state"];
  title: string;
  narrative: string;
  healthLevel: PortfolioState["portfolioHealthLevel"];
  tags: string[];
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

function detectPortfolioOverstatement(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_OVERSTATEMENT_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_OVERSTATEMENT",
        message: `portfolio narrative에 과장 표현: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioBearishTone(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_BEARISH_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_BEARISH_TONE",
        message: `portfolio narrative에 과도한 bearish 표현: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioOverLength(narrative: string): NarrativeIssue[] {
  if (narrative.length <= PORTFOLIO_LENGTH_LIMIT) {
    return [];
  }
  return [
    {
      code: "PORTFOLIO_OVER_LENGTH",
      message: `portfolio narrative 길이 ${narrative.length}자 (limit ${PORTFOLIO_LENGTH_LIMIT}). 모바일 가독성 점검 필요.`,
    },
  ];
}

export function analyzePortfolioState(
  input: PortfolioStateInput
): PortfolioStateQAResult {
  const state = buildPortfolioState(input);
  const narrative = state.portfolioStateNarrative;

  const issues: NarrativeIssue[] = [
    ...detectPortfolioOverstatement(narrative),
    ...detectPortfolioBearishTone(narrative),
    ...detectPortfolioOverLength(narrative),
  ];

  return {
    fundKey: input.fundKey || "fund",
    state: state.state,
    title: state.portfolioStateTitle,
    narrative,
    healthLevel: state.portfolioHealthLevel,
    tags: state.portfolioStateTags,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}


// ───────────────────────────────────────────────────────────────
// Portfolio Drift Timeline QA (Phase 37-A9)
// ───────────────────────────────────────────────────────────────

const PORTFOLIO_DRIFT_OVERSTATEMENT_PHRASES = [
  "반드시 개선",
  "곧 상승",
  "확실히 좋아",
  "무조건",
  "압도적",
  "완벽",
  "폭등 가능",
];

const PORTFOLIO_DRIFT_BEARISH_PHRASES = [
  "위험하다",
  "곧 하락",
  "폭락",
  "반드시 조정",
  "확실히 하락",
  "급락 임박",
  "매도 필요",
];

const PORTFOLIO_DRIFT_LENGTH_LIMIT = 120;

export type PortfolioDriftQAResult = {
  fundKey: string;
  driftDirection: PortfolioDriftTimeline["driftDirection"];
  driftTitle: string;
  driftNarrative: string;
  driftTags: string[];
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

function detectPortfolioDriftOverstatement(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_DRIFT_OVERSTATEMENT_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_DRIFT_OVERSTATEMENT",
        message: `drift narrative에 과장 표현: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioDriftBearish(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_DRIFT_BEARISH_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_DRIFT_BEARISH_TONE",
        message: `drift narrative에 과도한 bearish/SELL 표현: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioDriftOverLength(narrative: string): NarrativeIssue[] {
  if (narrative.length <= PORTFOLIO_DRIFT_LENGTH_LIMIT) return [];
  return [
    {
      code: "PORTFOLIO_DRIFT_OVER_LENGTH",
      message: `drift narrative 길이 ${narrative.length}자 (limit ${PORTFOLIO_DRIFT_LENGTH_LIMIT}). 모바일 가독성 점검 필요.`,
    },
  ];
}

export function analyzePortfolioDrift(
  input: PortfolioDriftInput
): PortfolioDriftQAResult {
  const result = buildPortfolioDriftTimeline(input);
  const narrative = result.driftNarrative;
  const issues: NarrativeIssue[] = [
    ...detectPortfolioDriftOverstatement(narrative),
    ...detectPortfolioDriftBearish(narrative),
    ...detectPortfolioDriftOverLength(narrative),
  ];

  return {
    fundKey: input.fundKey || "fund",
    driftDirection: result.driftDirection,
    driftTitle: result.driftTitle,
    driftNarrative: narrative,
    driftTags: result.driftTags,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}


// ───────────────────────────────────────────────────────────────
// Portfolio Action Layer QA (Phase 37-A10)
// ───────────────────────────────────────────────────────────────

const PORTFOLIO_ACTION_OVERSTATEMENT_PHRASES = [
  "반드시 매수",
  "무조건",
  "압도적",
  "폭등 가능",
  "확실한 수익",
  "최강",
  "완벽",
];

const PORTFOLIO_ACTION_SELL_TRIGGER_PHRASES = [
  "매도 권고",
  "매도 신호",
  "처분 필요",
  "손절 필요",
  "익절 필요",
  "전량 매도",
];

const PORTFOLIO_ACTION_BUY_TRIGGER_PHRASES = [
  "지금 매수",
  "신규 매수 권장",
  "공격적 진입",
  "비중확대 권고",
];

const PORTFOLIO_ACTION_LENGTH_LIMIT = 120;

export type PortfolioActionQAResult = {
  fundKey: string;
  actionMode: PortfolioActionLayer["actionMode"];
  actionTitle: string;
  actionNarrative: string;
  actionTags: string[];
  length: number;
  issues: NarrativeIssue[];
  qualityScore: number;
};

function detectPortfolioActionOverstatement(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_ACTION_OVERSTATEMENT_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_ACTION_OVERSTATEMENT",
        message: `action narrative에 과장 표현: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioActionSellTrigger(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_ACTION_SELL_TRIGGER_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_ACTION_SELL_TRIGGER",
        message: `action narrative가 SELL trigger 생성: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioActionBuyTrigger(narrative: string): NarrativeIssue[] {
  const issues: NarrativeIssue[] = [];
  for (const phrase of PORTFOLIO_ACTION_BUY_TRIGGER_PHRASES) {
    if (narrative.includes(phrase)) {
      issues.push({
        code: "PORTFOLIO_ACTION_BUY_TRIGGER",
        message: `action narrative가 BUY trigger 생성: "${phrase}"`,
        phrase,
      });
    }
  }
  return issues;
}

function detectPortfolioActionOverLength(narrative: string): NarrativeIssue[] {
  if (narrative.length <= PORTFOLIO_ACTION_LENGTH_LIMIT) return [];
  return [
    {
      code: "PORTFOLIO_ACTION_OVER_LENGTH",
      message: `action narrative 길이 ${narrative.length}자 (limit ${PORTFOLIO_ACTION_LENGTH_LIMIT}).`,
    },
  ];
}

export function analyzePortfolioAction(
  input: PortfolioActionInput
): PortfolioActionQAResult {
  const result = buildPortfolioActionLayer(input);
  const narrative = result.actionNarrative;
  const issues: NarrativeIssue[] = [
    ...detectPortfolioActionOverstatement(narrative),
    ...detectPortfolioActionSellTrigger(narrative),
    ...detectPortfolioActionBuyTrigger(narrative),
    ...detectPortfolioActionOverLength(narrative),
  ];

  return {
    fundKey: input.fundKey || "fund",
    actionMode: result.actionMode,
    actionTitle: result.actionTitle,
    actionNarrative: narrative,
    actionTags: result.actionTags,
    length: narrative.length,
    issues,
    qualityScore: computeQualityScore(issues),
  };
}

