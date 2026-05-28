// 산업 지속성 narrative (Phase 37-A1 / A2 polishing)
// 추천 ranking/score에 영향 없음. 텍스트 layer 전용. 빈 문자열 절대 금지.
// 톤: 차분한 가치투자 PM. 과장·감성문 금지. 동일 종목 → 동일 문장 유지.

export type SectorNarrativeInput = {
  industryName?: string;
  name?: string;
  corpName?: string;
  stockName?: string;
  companyName?: string;
  code?: string;
  symbol?: string;
  hypothesis?: string;
  sectorDurabilityLabel?: string;
  industryTailwind?: string;
  longTermHoldView?: string;
  growthSignalTags?: string[];
  coreCatalyst?: string[];
  growthStory?: string;
  themes?: string[];
};

type Bucket = "SEMICON_AI" | "POWER_GRID" | "DEFENSE_HEAVY" | "CONTENT_IP";

const BUCKET_KEYWORDS: Record<Bucket, string[]> = {
  // "AI"는 한국어 텍스트에서 다른 단어와 우연 매칭 방지 위해 다단어 패턴만 사용
  SEMICON_AI: [
    "반도체",
    "HBM",
    "메모리",
    "데이터센터",
    "파운드리",
    "AI 서버",
    "AI 인프라",
    "AI 메모리",
    "AI 데이터",
    "AI·반도체",
    "AI 투자",
    "AI 수요",
  ],
  POWER_GRID: [
    "전력",
    "송전",
    "송배전",
    "변압기",
    "전선",
    "전력기기",
    "전력 인프라",
    "전력망",
    "ESS",
  ],
  DEFENSE_HEAVY: [
    "방산",
    "조선",
    "해양",
    "국방",
    "무기",
    "항공",
    "중공업",
    "함정",
    "수주잔고",
  ],
  CONTENT_IP: [
    "콘텐츠",
    "엔터",
    "엔터테인",
    "미디어",
    "음반",
    "K-POP",
    "케이팝",
    "게임사",
    "IP·",
    "IP 라이선싱",
  ],
};

// bucket variant: 포인트 다양화 (HBM / CAPEX / 후공정 / 데이터센터 / 메모리 회복 등 분산)
const VARIANTS: Record<Bucket, string[]> = {
  SEMICON_AI: [
    "AI 서버 증설과 HBM 수요 확장이 반도체 밸류체인의 수요 가시성을 높이는 흐름.",
    "데이터센터 CAPEX 재개와 AI 추론·학습 수요가 반도체 부품·장비 발주로 연결되는 모습.",
    "메모리 회복 사이클과 AI 인프라 투자가 중장기 실적 기반을 받쳐주는 구간.",
    "후공정 투자 재개와 고객사 CAPEX 확대가 반도체 장비 수요로 이어지는 흐름.",
    "AI 추론용 고대역 메모리 수요가 늘어나며 관련 부품·소재 수요가 회복되는 모습.",
    "데이터센터 증설과 AI 워크로드 확대가 후공정·테스트 수요를 끌어올리는 단계.",
  ],
  POWER_GRID: [
    "노후 전력망 교체 수요와 데이터센터 전력 부족이 맞물려 전력기기 발주가 늘어나는 흐름.",
    "송배전 설비 투자 확대가 이어지며 전력 인프라 수요가 회복되는 구간.",
    "재생에너지 확대와 전력 안정성 강화 흐름이 전력 인프라 수요를 받쳐주는 모습.",
    "AI·데이터센터 전력 수요 증가가 변압기·전선 발주 확대로 연결되는 흐름.",
    "노후 설비 교체 사이클이 길어지며 전력기기 매출 가시성이 확보되는 단계.",
    "전력 인프라 투자 확대 흐름이 이어지며 관련 매출이 안정적으로 잡히는 구간.",
  ],
  DEFENSE_HEAVY: [
    "방산 수출 파이프라인 확대와 국방예산 증가 흐름이 실적 가시성을 높이는 구간.",
    "조선 수주 회복 사이클과 친환경 선박 교체 수요가 산업 수요를 받쳐주는 흐름.",
    "글로벌 방산·중공업 발주 증가가 장기 수주잔고로 누적되는 모습.",
    "수출 수주 가시화와 후속 옵션 계약 확대가 실적 흐름을 길게 끌어주는 구간.",
    "함정·항공·지상 무기 발주가 동시 진행되며 사업부별 매출이 분산 확보되는 흐름.",
    "국방예산 증가 사이클과 우방국 수출 확대가 매출 기반을 안정시키는 모습.",
  ],
  CONTENT_IP: [
    "IP 재사용 구조와 글로벌 OTT·플랫폼 수요가 콘텐츠 매출의 반복성을 높이는 흐름.",
    "팬덤·IP 자산 기반의 반복 수익 구조와 해외 매출 확장이 이어지는 구간.",
    "글로벌 음반·엔터 수요 확대와 IP 라이선싱 매출 누적이 산업 지속성을 강화하는 모습.",
    "기존 IP 재가공과 해외 유통 확대로 한 번 만든 콘텐츠가 반복 매출을 만들어내는 구조.",
    "팬덤 기반 굿즈·티켓·콘텐츠 매출이 분산되며 매출 변동성이 낮아지는 흐름.",
    "해외 공연·MD·OTT 채널이 동시에 열리며 콘텐츠 매출 회복이 가시화되는 구간.",
  ],
};

// 신호별 ending phrasing 풀 — 동일 종목엔 동일 ending이 나오도록 종목 해시로 선택.
// 말미 반복("실적 지속에 신호로 작용", "산업 흐름을 실적으로 입증") 분산이 목적.
const ADDENDUM_POOL = {
  ORDER: [
    "최근 수주 흐름이 실적에 반영되기 시작하는 단계.",
    "수주 가시성이 동반되며 실적 흐름이 길게 이어지는 모습.",
    "수주잔고가 누적되며 향후 매출 가시성이 높아지는 구간.",
    "수주가 분산 확보되며 단발성 매출 의존도가 줄어드는 흐름.",
  ],
  GROWTH_DUAL: [
    "최근 분기 매출·영업이익이 함께 늘어나며 산업 흐름이 실제 숫자로 확인되는 단계.",
    "매출과 영업이익이 동반 개선되며 업황 회복이 숫자로 잡히는 구간.",
    "실적이 매출·이익 양측에서 동시에 확인되며 가설이 데이터로 뒷받침되는 모습.",
    "수요 증가가 매출 성장과 이익률 개선으로 동시에 이어지는 흐름.",
  ],
  LONG_HOLD: [
    "성장이 유지되면 장기 보유 후보로 두고 볼 만한 구간.",
    "현 흐름이 이어진다면 장기 보유 관점에서 점검해볼 만한 단계.",
    "성장 가설이 유지되는 동안엔 장기 보유 후보로 분류해도 무리 없는 모습.",
    "단기 모멘텀보다 장기 보유 후보 관점에서 천천히 확인할 구간.",
  ],
} as const;

const GENERIC_FALLBACK =
  "산업 흐름과 실적 추이를 함께 점검할 구간으로, 단기 변동성보다 지속 가능성에 무게를 두는 시점.";

// Phase 37-A4: fallback 다양화. industryName 슬롯 기반 8 variant.
// 차분한 PM 톤. 과장·감성문 금지. 같은 종목 → 같은 variant 유지.
const FALLBACK_INDUSTRY_TEMPLATES: ReadonlyArray<(industry: string) => string> = [
  (i) =>
    `${i} 업종 내 실적 개선 흐름이 확인되는 가운데, 성장 지속성이 유지될 경우 재평가 여지가 있는 구간.`,
  (i) =>
    `${i} 업종 회복 흐름과 실적 개선이 함께 확인되며, 장기보유 후보로 관찰 가능한 구간.`,
  (i) =>
    `${i} 업종 내 수익성 개선 가능성이 확인되는 종목으로, 현재는 성장 지속성 확인이 중요한 시점.`,
  (i) =>
    `${i} 업종 흐름이 회복되는 가운데 실적이 점진적으로 개선되기 시작하는 단계.`,
  (i) =>
    `${i} 업종 내 성장 지속 여부가 핵심이 되는 구간으로, 단기 모멘텀보다 흐름의 길이를 보는 시점.`,
  (i) =>
    `${i} 업종 회복 가능성을 두고 성장 가설이 유지되는지를 차분히 확인할 구간.`,
  (i) =>
    `${i} 업종 내 실적 흐름이 점진적으로 개선되는 모습으로, 장기 관점에서 관찰 가능한 종목.`,
  (i) =>
    `${i} 업종 내 재평가 흐름이 형성되는 구간으로, 성장이 유지되는지를 천천히 점검할 단계.`,
];

function stableHash(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function buildHaystack(input: SectorNarrativeInput): string {
  const parts: string[] = [];

  const pushIfString = (value: unknown) => {
    if (typeof value === "string" && value.length > 0) {
      parts.push(value);
    }
  };

  pushIfString(input.industryName);
  pushIfString(input.industryTailwind);
  pushIfString(input.hypothesis);
  pushIfString(input.growthStory);
  pushIfString(input.name);
  pushIfString(input.corpName);
  pushIfString(input.stockName);
  pushIfString(input.companyName);

  (input.themes || []).forEach(pushIfString);
  (input.coreCatalyst || []).forEach(pushIfString);
  (input.growthSignalTags || []).forEach(pushIfString);

  return parts.join(" ");
}

function pickBucket(input: SectorNarrativeInput): Bucket | null {
  const haystack = buildHaystack(input);

  if (haystack.length === 0) {
    return null;
  }

  // 조선/방산 키워드가 반도체 키워드보다 먼저 매칭되도록 우선순위 부여
  const ordered: Bucket[] = [
    "DEFENSE_HEAVY",
    "POWER_GRID",
    "SEMICON_AI",
    "CONTENT_IP",
  ];

  for (const bucket of ordered) {
    const keywords = BUCKET_KEYWORDS[bucket];

    for (const keyword of keywords) {
      if (haystack.includes(keyword)) {
        return bucket;
      }
    }
  }

  return null;
}

function seedOf(input: SectorNarrativeInput): string {
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

function pickVariant(bucket: Bucket, input: SectorNarrativeInput): string {
  const variants = VARIANTS[bucket];
  const index = stableHash(seedOf(input)) % variants.length;
  return variants[index];
}

function buildSignalAddendum(input: SectorNarrativeInput): string {
  const catalyst = (input.coreCatalyst || [])[0] || "";
  const tags = input.growthSignalTags || [];
  const longTerm = input.longTermHoldView || "";

  let pool: readonly string[] | null = null;
  let salt = "";

  if (tags.includes("수주")) {
    pool = ADDENDUM_POOL.ORDER;
    salt = "-O";
  } else if (catalyst.includes("매출") && catalyst.includes("영업이익")) {
    pool = ADDENDUM_POOL.GROWTH_DUAL;
    salt = "-G";
  } else if (longTerm.includes("장기보유")) {
    pool = ADDENDUM_POOL.LONG_HOLD;
    salt = "-L";
  }

  if (!pool || pool.length === 0) {
    return "";
  }

  const idx = stableHash(seedOf(input) + salt) % pool.length;
  return pool[idx];
}

function buildFallbackNarrative(input: SectorNarrativeInput): string {
  const industry = (input.industryName || "").trim();

  // industryName이 있을 때만 신규 8 variant 사용. 같은 종목은 같은 variant 유지.
  if (industry.length > 0) {
    const idx =
      stableHash(seedOf(input) + "-F") % FALLBACK_INDUSTRY_TEMPLATES.length;
    return FALLBACK_INDUSTRY_TEMPLATES[idx](industry);
  }

  // industryName 결측 시 기존 보조 fallback 체인 유지 (완전 제거 금지)
  const tailwind = (input.industryTailwind || "").trim();

  if (tailwind.length > 4) {
    return `${tailwind} 흐름이 이어지는 산업 구간.`;
  }

  const story = (input.growthStory || "").trim();

  if (story.length > 8) {
    return story;
  }

  return GENERIC_FALLBACK;
}

export function buildSectorDurabilityNarrative(
  input: SectorNarrativeInput | null | undefined
): string {
  if (!input || typeof input !== "object") {
    return GENERIC_FALLBACK;
  }

  const bucket = pickBucket(input);

  if (!bucket) {
    const fallback = buildFallbackNarrative(input);
    return fallback.length > 0 ? fallback : GENERIC_FALLBACK;
  }

  const base = pickVariant(bucket, input);
  const addendum = buildSignalAddendum(input);

  if (!addendum) {
    return base;
  }

  return `${base} ${addendum}`;
}
