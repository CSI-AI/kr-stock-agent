import type { MarketType, StockFinancialMetrics } from "@/types/financial";

type UnknownRecord = Record<string, unknown>;

export type RemoteUniverseLoadSuccess = {
  items: StockFinancialMetrics[];
  sourceUrl: string;
  rawCount: number;
  normalizedCount: number;
  skippedCount: number;
};

const DEFAULT_TIMEOUT_MS = 15000;

const FIELD_ALIASES = {
  code: [
    "code",
    "stockCode",
    "symbol",
    "ticker",
    "shortCode",
    "isuCd",
    "isuSrtCd",
    "ISU_SRT_CD",
  ],
  name: [
    "name",
    "stockName",
    "companyName",
    "corpName",
    "isuAbbrv",
    "korName",
    "issueName",
    "isuNm",
    "ISU_ABBRV",
  ],
  market: [
    "market",
    "marketType",
    "marketName",
    "mktNm",
    "mktTpNm",
    "marketCategory",
  ],
  industry: [
    "industry",
    "sector",
    "industryName",
    "indutyNm",
    "업종",
    "섹터",
  ],
  currentPrice: [
    "currentPrice",
    "price",
    "close",
    "closePrice",
    "clpr",
    "종가",
    "현재가",
  ],
  per: ["per", "PER"],
  pbr: ["pbr", "PBR"],
  roe: ["roe", "ROE"],
  revenueGrowth: ["revenueGrowth", "salesGrowth", "매출성장률"],
  operatingIncomeGrowth: [
    "operatingIncomeGrowth",
    "opIncomeGrowth",
    "영업이익성장률",
  ],
  debtRatio: ["debtRatio", "부채비율"],
  dividendYield: ["dividendYield", "divYield", "배당수익률"],
  operatingMargin: ["operatingMargin", "opMargin", "영업이익률"],
  netMargin: ["netMargin", "순이익률"],
  revenueCagr3Y: ["revenueCagr3Y", "salesCagr3Y", "매출CAGR3Y"],
  epsGrowth3Y: ["epsGrowth3Y", "EPSGrowth3Y", "EPS성장률3Y"],
  marketCapBillionKrw: [
    "marketCapBillionKrw",
    "marketCap",
    "marketCapBillion",
    "시가총액(억원)",
    "시가총액",
  ],
  latestUpdatedAt: ["latestUpdatedAt", "updatedAt", "date", "baseDate", "기준일자"],
} as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} 환경변수가 비어 있습니다.`);
  }

  return value.trim();
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
}

function resolveTimeoutMs(): number {
  const rawValue = getOptionalEnv("FINANCIAL_UNIVERSE_REAL_TIMEOUT_MS");

  if (!rawValue) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return parsed;
}

function getValueByAliases(
  record: UnknownRecord,
  aliases: readonly string[]
): unknown {
  for (const key of aliases) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const digitsOnly = String(value).replace(/[^\d]/g, "");

  if (digitsOnly.length === 0) {
    return null;
  }

  return digitsOnly.padStart(6, "0").slice(-6);
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    return trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed === "-" ||
    trimmed.toLowerCase() === "n/a" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return null;
  }

  const cleaned = trimmed
    .replace(/,/g, "")
    .replace(/원/g, "")
    .replace(/배/g, "")
    .replace(/%/g, "")
    .replace(/\s+/g, "");

  if (cleaned.length === 0) {
    return null;
  }

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function normalizeMarket(value: unknown): MarketType | null {
  const text = normalizeString(value);

  if (!text) {
    return null;
  }

  const upper = text.toUpperCase();

  if (
    upper.includes("KOSPI") ||
    text.includes("유가증권") ||
    text.includes("코스피")
  ) {
    return "KOSPI";
  }

  if (upper.includes("KOSDAQ") || text.includes("코스닥")) {
    return "KOSDAQ";
  }

  return null;
}

function normalizeDateString(value: unknown): string | undefined {
  const text = normalizeString(value);

  if (!text) {
    return undefined;
  }

  return text;
}

function findFirstArrayPayload(value: unknown, depth = 0): UnknownRecord[] | null {
  if (depth > 6 || value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const onlyObjects = value.filter(
      (item): item is UnknownRecord =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );

    if (onlyObjects.length > 0) {
      return onlyObjects;
    }

    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as UnknownRecord;

  const preferredKeys = [
    "items",
    "data",
    "result",
    "results",
    "list",
    "rows",
    "stocks",
    "dataset",
    "output",
    "OutBlock_1",
    "response",
    "body",
  ];

  for (const key of preferredKeys) {
    if (key in record) {
      const found = findFirstArrayPayload(record[key], depth + 1);

      if (found) {
        return found;
      }
    }
  }

  for (const nestedValue of Object.values(record)) {
    const found = findFirstArrayPayload(nestedValue, depth + 1);

    if (found) {
      return found;
    }
  }

  return null;
}

function normalizeOptionalMetric(
  record: UnknownRecord,
  aliases: readonly string[]
): number | null | undefined {
  const rawValue = getValueByAliases(record, aliases);

  if (rawValue === undefined) {
    return undefined;
  }

  return normalizeNumber(rawValue);
}

function normalizeIndustry(record: UnknownRecord): string {
  const rawValue = getValueByAliases(record, FIELD_ALIASES.industry);
  return normalizeString(rawValue) ?? "미분류";
}

function normalizeCurrentPrice(record: UnknownRecord): number | null {
  const rawValue = getValueByAliases(record, FIELD_ALIASES.currentPrice);
  return normalizeNumber(rawValue);
}

function normalizeMarketCapBillionKrw(
  record: UnknownRecord
): number | null | undefined {
  const rawValue = getValueByAliases(record, FIELD_ALIASES.marketCapBillionKrw);

  if (rawValue === undefined) {
    return undefined;
  }

  const parsed = normalizeNumber(rawValue);

  if (parsed === null) {
    return null;
  }

  const looksLikeWonScale = parsed > 100_000_000_000;

  if (looksLikeWonScale) {
    return Number((parsed / 1_000_000_000).toFixed(2));
  }

  return parsed;
}

function normalizeStockItem(record: UnknownRecord): StockFinancialMetrics | null {
  const code = normalizeCode(getValueByAliases(record, FIELD_ALIASES.code));
  const name = normalizeString(getValueByAliases(record, FIELD_ALIASES.name));
  const market = normalizeMarket(getValueByAliases(record, FIELD_ALIASES.market));
  const currentPrice = normalizeCurrentPrice(record);

  if (!code || !name || !market || currentPrice === null) {
    return null;
  }

  return {
    code,
    name,
    market,
    industry: normalizeIndustry(record),
    currentPrice,
    per: normalizeOptionalMetric(record, FIELD_ALIASES.per),
    pbr: normalizeOptionalMetric(record, FIELD_ALIASES.pbr),
    roe: normalizeOptionalMetric(record, FIELD_ALIASES.roe),
    revenueGrowth: normalizeOptionalMetric(record, FIELD_ALIASES.revenueGrowth),
    operatingIncomeGrowth: normalizeOptionalMetric(
      record,
      FIELD_ALIASES.operatingIncomeGrowth
    ),
    debtRatio: normalizeOptionalMetric(record, FIELD_ALIASES.debtRatio),
    dividendYield: normalizeOptionalMetric(record, FIELD_ALIASES.dividendYield),
    operatingMargin: normalizeOptionalMetric(record, FIELD_ALIASES.operatingMargin),
    netMargin: normalizeOptionalMetric(record, FIELD_ALIASES.netMargin),
    revenueCagr3Y: normalizeOptionalMetric(record, FIELD_ALIASES.revenueCagr3Y),
    epsGrowth3Y: normalizeOptionalMetric(record, FIELD_ALIASES.epsGrowth3Y),
    marketCapBillionKrw: normalizeMarketCapBillionKrw(record),
    latestUpdatedAt: normalizeDateString(
      getValueByAliases(record, FIELD_ALIASES.latestUpdatedAt)
    ),
  };
}

function dedupeByCode(items: StockFinancialMetrics[]): StockFinancialMetrics[] {
  const map = new Map<string, StockFinancialMetrics>();

  for (const item of items) {
    map.set(item.code, item);
  }

  return Array.from(map.values()).sort((a, b) => {
    const aCap = a.marketCapBillionKrw ?? -1;
    const bCap = b.marketCapBillionKrw ?? -1;

    if (bCap !== aCap) {
      return bCap - aCap;
    }

    return a.name.localeCompare(b.name, "ko");
  });
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutMs = resolveTimeoutMs();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const authHeaderName = getOptionalEnv(
      "FINANCIAL_UNIVERSE_REAL_AUTH_HEADER_NAME"
    );
    const authToken = getOptionalEnv("FINANCIAL_UNIVERSE_REAL_AUTH_TOKEN");

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (authHeaderName && authToken) {
      headers[authHeaderName] = authToken;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `real 데이터 URL 요청 실패: HTTP ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`real 데이터 URL 요청이 ${timeoutMs}ms 안에 끝나지 않았습니다.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loadRemoteJsonFinancialUniverseFromUrl(
  sourceUrl: string
): Promise<RemoteUniverseLoadSuccess> {
  const payload = await fetchJsonWithTimeout(sourceUrl);
  const rawItems = findFirstArrayPayload(payload);

  if (!rawItems || rawItems.length === 0) {
    throw new Error(
      "real 데이터 응답에서 배열 형태 종목 목록을 찾지 못했습니다. 응답 구조를 확인해주세요."
    );
  }

  const normalizedItems = rawItems
    .map((item) => normalizeStockItem(item))
    .filter((item): item is StockFinancialMetrics => item !== null);

  const dedupedItems = dedupeByCode(normalizedItems);

  if (dedupedItems.length === 0) {
    throw new Error(
      "real 데이터 응답을 정규화했지만 usable 종목이 0건입니다. code/name/market/currentPrice 매핑을 확인해주세요."
    );
  }

  return {
    items: dedupedItems,
    sourceUrl,
    rawCount: rawItems.length,
    normalizedCount: dedupedItems.length,
    skippedCount: rawItems.length - dedupedItems.length,
  };
}

export async function loadRemoteJsonFinancialUniverse(): Promise<RemoteUniverseLoadSuccess> {
  const sourceUrl = getRequiredEnv("FINANCIAL_UNIVERSE_REAL_JSON_URL");
  return loadRemoteJsonFinancialUniverseFromUrl(sourceUrl);
}