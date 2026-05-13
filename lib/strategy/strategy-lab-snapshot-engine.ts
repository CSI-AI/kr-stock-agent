import type { RealRawItem, RealUniverseResponse } from "./strategy-lab-real-loader";

export type ScoreBreakdownItem = {
  label: string;
  valueText: string;
  scoreText: string;
};

export type SnapshotItem = {
  name: string;
  currentPrice: number | null;
  marketCapBillionKrw: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  dividendYield: number | null;
  operatingMargin: number | null;
  opIncomeGrowth: number | null;
  score: number;
  passed: boolean;
  failReasons: string[];
  updatedAt: string;
  scoreBreakdown: ScoreBreakdownItem[];
};

export type StrategyLabSnapshotResult = {
  totalCount: number;
  passedCount: number;
  failedCount: number;
  topItems: SnapshotItem[];
  sampleItems: SnapshotItem[];
  dailyTopPicks: SnapshotItem[];
  fetchedAt: string;
  baseDate: string;
  metaUpdatedAt: string;
  provider: string;
  rawMetaCount: number | null;
  mode: string;
};

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/,/g, "")
      .replace(/%/g, "")
      .replace(/원/g, "")
      .trim();

    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function formatNumber(value: number | null, digits = 2): string {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatInteger(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function formatDate(value: string | undefined): string {
  if (!value) {
    return "-";
  }

  return value;
}

function buildScoreBreakdown(params: {
  marketCapBillionKrw: number | null;
  currentPrice: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  dividendYield: number | null;
  operatingMargin: number | null;
  opIncomeGrowth: number | null;
}) {
  const {
    marketCapBillionKrw,
    currentPrice,
    per,
    pbr,
    roe,
    dividendYield,
    operatingMargin,
    opIncomeGrowth,
  } = params;

  let marketCapScore = 0;
  let priceExistsScore = 0;
  let perScore = 0;
  let pbrScore = 0;
  let roeScore = 0;
  let dividendScore = 0;
  let operatingMarginScore = 0;
  let opIncomeGrowthScore = 0;

  if (marketCapBillionKrw !== null) {
    if (marketCapBillionKrw >= 200000) marketCapScore = 40;
    else if (marketCapBillionKrw >= 100000) marketCapScore = 34;
    else if (marketCapBillionKrw >= 50000) marketCapScore = 28;
    else if (marketCapBillionKrw >= 10000) marketCapScore = 20;
    else if (marketCapBillionKrw >= 3000) marketCapScore = 10;
  }

  if (currentPrice !== null && currentPrice > 0) {
    priceExistsScore = 10;
  }

  if (per !== null) {
    if (per > 0 && per <= 8) perScore = 18;
    else if (per <= 12) perScore = 14;
    else if (per <= 18) perScore = 10;
    else if (per <= 25) perScore = 5;
  }

  if (pbr !== null) {
    if (pbr > 0 && pbr <= 0.8) pbrScore = 16;
    else if (pbr <= 1.2) pbrScore = 12;
    else if (pbr <= 2) pbrScore = 8;
    else if (pbr <= 3) pbrScore = 4;
  }

  if (roe !== null) {
    if (roe >= 20) roeScore = 16;
    else if (roe >= 15) roeScore = 12;
    else if (roe >= 10) roeScore = 8;
    else if (roe >= 5) roeScore = 4;
  }

  if (dividendYield !== null) {
    if (dividendYield >= 5) dividendScore = 10;
    else if (dividendYield >= 3) dividendScore = 7;
    else if (dividendYield >= 1) dividendScore = 3;
  }

  if (operatingMargin !== null) {
    if (operatingMargin >= 20) operatingMarginScore = 12;
    else if (operatingMargin >= 15) operatingMarginScore = 9;
    else if (operatingMargin >= 10) operatingMarginScore = 6;
    else if (operatingMargin >= 5) operatingMarginScore = 3;
  }

  if (opIncomeGrowth !== null) {
    if (opIncomeGrowth >= 30) opIncomeGrowthScore = 12;
    else if (opIncomeGrowth >= 20) opIncomeGrowthScore = 9;
    else if (opIncomeGrowth >= 10) opIncomeGrowthScore = 6;
    else if (opIncomeGrowth >= 0) opIncomeGrowthScore = 3;
  }

  const scoreBreakdown: ScoreBreakdownItem[] = [
    {
      label: "시가총액",
      valueText: marketCapBillionKrw === null ? "-" : `${formatNumber(marketCapBillionKrw, 0)}억원`,
      scoreText: `${marketCapScore}점`,
    },
    {
      label: "현재가 데이터",
      valueText: currentPrice === null ? "-" : `${formatNumber(currentPrice, 0)}`,
      scoreText: `${priceExistsScore}점`,
    },
    {
      label: "PER",
      valueText: formatNumber(per),
      scoreText: `${perScore}점`,
    },
    {
      label: "PBR",
      valueText: formatNumber(pbr),
      scoreText: `${pbrScore}점`,
    },
    {
      label: "ROE",
      valueText: formatNumber(roe),
      scoreText: `${roeScore}점`,
    },
    {
      label: "배당수익률",
      valueText: formatNumber(dividendYield),
      scoreText: `${dividendScore}점`,
    },
    {
      label: "영업이익률",
      valueText: formatNumber(operatingMargin),
      scoreText: `${operatingMarginScore}점`,
    },
    {
      label: "영업이익증가율",
      valueText: formatNumber(opIncomeGrowth),
      scoreText: `${opIncomeGrowthScore}점`,
    },
  ];

  const totalScore =
    marketCapScore +
    priceExistsScore +
    perScore +
    pbrScore +
    roeScore +
    dividendScore +
    operatingMarginScore +
    opIncomeGrowthScore;

  return {
    totalScore,
    scoreBreakdown,
  };
}

export function normalizeSnapshotItem(raw: RealRawItem): SnapshotItem {
  const marketCapRaw = toNumber(raw.marketCap);
  const marketCapBillionKrw =
    marketCapRaw === null ? null : marketCapRaw / 100_000_000;

  const currentPrice = toNumber(raw.price);
  const per = toNumber(raw.PER);
  const pbr = toNumber(raw.PBR);
  const roe = toNumber(raw.ROE);
  const dividendYield = toNumber(raw.divYield);
  const operatingMargin = toNumber(raw.opMargin);
  const opIncomeGrowth = toNumber(raw.opIncomeGrowth);

  const failReasons: string[] = [];

  if (marketCapBillionKrw === null || marketCapBillionKrw < 3000) {
    failReasons.push("시가총액 3000억 미만");
  }

  if (currentPrice === null || currentPrice <= 0) {
    failReasons.push("현재가 없음");
  }

  const { totalScore, scoreBreakdown } = buildScoreBreakdown({
    marketCapBillionKrw,
    currentPrice,
    per,
    pbr,
    roe,
    dividendYield,
    operatingMargin,
    opIncomeGrowth,
  });

  return {
    name: raw.corpName?.trim() || "이름없음",
    currentPrice,
    marketCapBillionKrw,
    per,
    pbr,
    roe,
    dividendYield,
    operatingMargin,
    opIncomeGrowth,
    score: totalScore,
    passed: failReasons.length === 0,
    failReasons,
    updatedAt: raw.updatedAt?.trim() || "",
    scoreBreakdown,
  };
}

function sortPassedItems(items: SnapshotItem[]): SnapshotItem[] {
  return [...items].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const marketCapA = a.marketCapBillionKrw ?? -1;
    const marketCapB = b.marketCapBillionKrw ?? -1;

    if (marketCapB !== marketCapA) {
      return marketCapB - marketCapA;
    }

    const priceA = a.currentPrice ?? -1;
    const priceB = b.currentPrice ?? -1;

    return priceB - priceA;
  });
}

function pickDailyTopPicks(items: SnapshotItem[]): SnapshotItem[] {
  return items.slice(0, 3);
}

export function buildStrategyLabSnapshotResult(
  payload: RealUniverseResponse
): StrategyLabSnapshotResult {
  const rawItems = Array.isArray(payload.data) ? payload.data : [];
  const items = rawItems.map(normalizeSnapshotItem);

  const passedItems = sortPassedItems(items.filter((item) => item.passed));
  const failedItems = items.filter((item) => !item.passed);

  return {
    totalCount: items.length,
    passedCount: passedItems.length,
    failedCount: failedItems.length,
    topItems: passedItems.slice(0, 20),
    sampleItems: items.slice(0, 10),
    dailyTopPicks: pickDailyTopPicks(passedItems),
    fetchedAt: new Date().toISOString(),
    baseDate: payload.meta?.baseDate || "",
    metaUpdatedAt: payload.meta?.updatedAt || "",
    provider: payload.meta?.provider || "",
    rawMetaCount: payload.meta?.count ?? null,
    mode: payload.meta?.mode || "",
  };
}